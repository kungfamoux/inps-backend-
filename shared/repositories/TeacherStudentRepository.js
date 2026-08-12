const prisma = require("../../lib/prisma");

const DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const todayName = () => DAYS[new Date().getDay()];

const findStudentsInClass = async (classId, filters = {}) => {
	const where = {
		deletedAt: null,
		enrollments: {
			some: { classId, status: "ACTIVE" },
		},
	};

	if (filters.search) {
		where.OR = [
			{ firstName: { contains: filters.search, mode: "insensitive" } },
			{ lastName: { contains: filters.search, mode: "insensitive" } },
			{ admissionNumber: { contains: filters.search, mode: "insensitive" } },
		];
	}

	const page = Number(filters.page) || 1;
	const limit = Number(filters.limit) || 30;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.student.findMany({
			where,
			include: {
				parent: {
					select: {
						accountEmail: true,
						fatherFirstName: true,
						fatherPhone: true,
						motherFirstName: true,
						motherPhone: true,
					},
				},
				enrollments: {
					where: { classId, status: "ACTIVE" },
					include: { class: true },
					take: 1,
				},
			},
			orderBy: { lastName: "asc" },
			skip,
			take: limit,
		}),
		prisma.student.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const findStudentInClass = (admissionNumber, classId) =>
	prisma.student.findFirst({
		where: {
			admissionNumber,
			deletedAt: null,
			enrollments: { some: { classId, status: "ACTIVE" } },
		},
		include: {
			parent: {
				select: {
					accountEmail: true,
					accountPhone: true,
					fatherFirstName: true,
					fatherLastName: true,
					fatherPhone: true,
					fatherEmail: true,
					motherFirstName: true,
					motherLastName: true,
					motherPhone: true,
					motherEmail: true,
				},
			},
			enrollments: {
				where: { classId, status: "ACTIVE" },
				include: { class: true },
				take: 1,
			},
		},
	});

const countStudentsInClass = (classId) =>
	prisma.student.count({
		where: {
			deletedAt: null,
			enrollments: { some: { classId, status: "ACTIVE" } },
		},
	});

// setUTCHours, not setHours — date-only strings ("YYYY-MM-DD") parse as UTC
// midnight, so mutating with the server's local timezone shifts the
// calendar day whenever local time isn't UTC (e.g. Africa/Lagos, UTC+1).
const getDayBounds = (date) => ({
	start: new Date(new Date(date).setUTCHours(0, 0, 0, 0)),
	end: new Date(new Date(date).setUTCHours(23, 59, 59, 999)),
});

const findAttendanceByDate = (classId, date) => {
	const { start, end } = getDayBounds(date);

	return prisma.attendance.findMany({
		where: {
			classId,
			date: { gte: start, lte: end },
		},
		include: {
			student: {
				select: {
					admissionNumber: true,
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: { student: { lastName: "asc" } },
	});
};

const upsertAttendance = (data) =>
	prisma.attendance.upsert({
		where: {
			studentId_date: {
				studentId: data.studentId,
				date: data.date,
			},
		},
		update: {
			status: data.status,
			note: data.note ?? null,
		},
		create: {
			studentId: data.studentId,
			classId: data.classId,
			staffId: data.staffId,
			date: data.date,
			status: data.status,
			note: data.note ?? null,
		},
	});

const bulkUpsertAttendance = (records) =>
	prisma.$transaction(records.map(upsertAttendance));

const findAttendanceSummary = async (classId, filters = {}) => {
	const where = { classId };

	if (filters.startDate && filters.endDate) {
		where.date = {
			gte: new Date(filters.startDate),
			lte: new Date(filters.endDate),
		};
	}

	return prisma.attendance.groupBy({
		by: ["studentId", "status"],
		where,
		_count: { status: true },
	});
};

const classScheduleInclude = {
	subject: { select: { subjectName: true, subjectCode: true } },
	staff: { select: { firstName: true, lastName: true, staffId: true } },
};

const teacherScheduleInclude = {
	subject: { select: { subjectName: true, subjectCode: true } },
	class: {
		select: { name: true },
	},
};

const _fetchSchedule = async ({ where, page = 1, limit = 20, include }) => {
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.schedule.findMany({
			where,
			include,
			orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
			skip,
			take: limit,
		}),
		prisma.schedule.count({ where }),
	]);

	return {
		data,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const findClassSchedule = ({
	classId,
	range,
	startDate,
	endDate,
	page,
	limit,
}) => {
	const where = { classId };

	if (range === "today") where.dayOfWeek = todayName();
	if (range === "month") where.dayOfWeek = { in: WEEKDAYS };

	return _fetchSchedule({ where, page, limit, include: classScheduleInclude });
};

const findTeacherSchedule = ({
	teacherId,
	range,
	startDate,
	endDate,
	page,
	limit,
}) => {
	const where = { staffId: teacherId };

	if (range === "today") where.dayOfWeek = todayName();
	if (range === "month") where.dayOfWeek = { in: WEEKDAYS };

	return _fetchSchedule({
		where,
		page,
		limit,
		include: teacherScheduleInclude,
	});
};

/**
 * Fetches the class record and subject assignment for a teacher in parallel.
 * Used by resolveTeacherClass in utils/teacher.js.
 */
const resolveClassAndSubjectRecords = async (
	staffId,
	{ isClassTeacher, isSubjectTeacher },
) => {
	const [classRecord, subjectAssignment] = await Promise.all([
		isClassTeacher
			? prisma.class.findFirst({
					where: {
						OR: [{ classTeacherId: staffId }, { assistantTeacherId: staffId }],
						status: "ACTIVE",
					},
				})
			: Promise.resolve(null),

		isSubjectTeacher
			? prisma.subjectAssignment.findFirst({
					where: { teacherId: staffId, status: "ACTIVE" },
					include: { class: true },
				})
			: Promise.resolve(null),
	]);

	return { classRecord, subjectAssignment };
};

/**
 * Checks whether attendance has already been recorded for a class on a given date.
 * Used for the "pending tasks" dashboard widget (has *any* attendance been done today).
 */
const checkAttendanceExists = (classId, date) =>
	prisma.attendance.count({
		where: { classId, date },
	});

/**
 * Finds which of the given students already have an attendance record for a date.
 * Used to block re-marking per student, not per class — a class can have
 * some students marked and others still pending on the same date.
 */
const findAttendanceForStudentsOnDate = (studentIds, date) =>
	prisma.attendance.findMany({
		where: { studentId: { in: studentIds }, date },
		include: { student: { select: { admissionNumber: true } } },
	});

/**
 * Finds students by admission numbers who are actively enrolled in a class.
 * Used to validate records before marking attendance.
 */
const findEnrolledStudentsByAdmissionNumbers = (admissionNumbers, classId) =>
	prisma.student.findMany({
		where: {
			admissionNumber: { in: admissionNumbers },
			enrollments: {
				some: { classId, status: "ACTIVE" },
			},
		},
		select: { id: true, admissionNumber: true },
	});

/**
 * Finds all active students in a class with their parent email addresses.
 * Used by emailAllParents.
 */
const findStudentsWithParentEmails = (classId) =>
	prisma.student.findMany({
		where: {
			deletedAt: null,
			enrollments: {
				some: { classId, status: "ACTIVE" },
			},
		},
		include: {
			parent: {
				select: {
					accountEmail: true,
					fatherFirstName: true,
					fatherLastName: true,
					motherFirstName: true,
					motherLastName: true,
				},
			},
		},
		select: {
			admissionNumber: true,
			firstName: true,
			lastName: true,
		},
	});

module.exports = {
	findStudentsInClass,
	findStudentInClass,
	countStudentsInClass,
	findAttendanceByDate,
	upsertAttendance,
	bulkUpsertAttendance,
	findAttendanceSummary,
	findClassSchedule,
	findTeacherSchedule,
	resolveClassAndSubjectRecords,
	checkAttendanceExists,
	findAttendanceForStudentsOnDate,
	findEnrolledStudentsByAdmissionNumbers,
	findStudentsWithParentEmails,
};
