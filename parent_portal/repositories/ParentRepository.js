const prisma = require("../../lib/prisma");

// PARENT AUTH

const findParentByFirebaseUid = (firebaseUid) =>
	prisma.parent.findFirst({
		where: { firebaseUid, deletedAt: null },
	});

const findParentById = (id) =>
	prisma.parent.findFirst({
		where: { id, deletedAt: null },
		include: { students: { where: { deletedAt: null } } },
	});

const updateParent = (id, data) =>
	prisma.parent.update({ where: { id }, data });

// CHILDREN

// All children linked to a parent
const findChildren = (parentId) =>
	prisma.student.findMany({
		where: { parentId, deletedAt: null },
		select: {
			id: true,
			admissionNumber: true,
			firstName: true,
			lastName: true,
			gender: true,
			dateOfBirth: true,
			passportPhoto: true,
			status: true,
			enrollments: {
				where: { status: "ACTIVE" },
				include: {
					class: { 
						select: { 
							id: true, 
							name: true, 
							color: true 
						} 
					},
				},
				take: 1,
			},
		},
	});

// Full child profile
const findChildProfile = (studentId, parentId) =>
	prisma.student.findFirst({
		where: { id: studentId, parentId, deletedAt: null },
		include: {
			parent: {
				select: {
					id: true,
					accountEmail: true,
					accountPhone: true,
					primaryGuardian: true,
					secondaryGuardian: true,
					address: true,
					maritalStatus: true,
				},
			},
			enrollments: {
				where: { status: "ACTIVE" },
				include: {
					class: { 
						select: { 
							id: true, 
							name: true, 
							color: true 
						} 
					},
				},
				take: 1,
			},
		},
	});

// RESULTS
// Only verified results are visible to parents

const findVerifiedResults = (studentId, termId, sessionId) =>
	prisma.result.findMany({
		where: { studentId, termId, sessionId, isVerified: true },
		include: {
			subject: { select: { subjectName: true, subjectCode: true } },
			term: { select: { term: true } },
			session: { select: { session: true } },
		},
		orderBy: { subject: { subjectName: "asc" } },
	});

// Result summary stats for a term
const findResultSummary = async (studentId, termId, sessionId, passMark) => {
	const [results, termRemark] = await Promise.all([
		prisma.result.findMany({
			where: { studentId, termId, sessionId, isVerified: true },
			select: {
				total: true,
				grade: true,
				position: true,
				subject: { select: { subjectName: true } },
			},
		}),
		prisma.studentTermRemark.findUnique({
			where: { studentId_termId_sessionId: { studentId, termId, sessionId } },
		}),
	]);

	const totalSubjects = results.length;
	const subjectsPassed = results.filter((r) => r.total >= passMark).length;
	const totalScore = results.reduce((sum, r) => sum + r.total, 0);
	const average = totalSubjects ? (totalScore / totalSubjects).toFixed(2) : 0;
	const position = results[0]?.position ?? null;
	// Remarks only surface once at least one subject result is verified —
	// matches the previous behavior where remarks came from the verified list.
	const classTeacherRemark = totalSubjects
		? (termRemark?.classTeacherRemark ?? null)
		: null;
	const headTeacherRemark = totalSubjects
		? (termRemark?.headTeacherRemark ?? null)
		: null;

	return {
		totalSubjects,
		subjectsPassed,
		average: Number(average),
		position,
		classTeacherRemark,
		headTeacherRemark,
		results,
	};
};

// ATTENDANCE

const findAttendanceRate = async (studentId, filters = {}) => {
	const where = { studentId };

	if (filters.startDate && filters.endDate) {
		where.date = {
			gte: new Date(filters.startDate),
			lte: new Date(filters.endDate),
		};
	}

	const [total, present, late, excused, absent] = await Promise.all([
		prisma.attendance.count({ where }),
		prisma.attendance.count({ where: { ...where, status: "PRESENT" } }),
		prisma.attendance.count({ where: { ...where, status: "LATE" } }),
		prisma.attendance.count({ where: { ...where, status: "EXCUSED" } }),
		prisma.attendance.count({ where: { ...where, status: "ABSENT" } }),
	]);

	const attendanceRate = total
		? (((present + late + excused) / total) * 100).toFixed(1)
		: 0;

	return {
		total,
		present,
		late,
		excused,
		absent,
		attendanceRate: Number(attendanceRate),
	};
};

// TIMETABLE

const findTimetableForStudent = async (studentId, parentId) => {
	// Find the student's active class
	const student = await prisma.student.findFirst({
		where: { id: studentId, parentId, deletedAt: null },
		include: {
			enrollments: {
				where: { status: "ACTIVE" },
				include: { class: true },
				take: 1,
			},
		},
	});

	if (!student?.enrollments[0]?.classId) return [];

	const classId = student.enrollments[0].classId;

	return prisma.schedule.findMany({
		where: { classId },
		include: {
			subject: { select: { subjectName: true, subjectCode: true } },
			staff: { select: { firstName: true, lastName: true } },
		},
		orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
	});
};

// ANNOUNCEMENTS

// Current active class(es) of a parent's children — used to scope
// class-teacher broadcasts so they're only visible to the relevant parents.
const findActiveClassIdsForParent = async (parentId) => {
	const enrollments = await prisma.enrollment.findMany({
		where: {
			status: "ACTIVE",
			student: { parentId, deletedAt: null },
		},
		select: { classId: true },
		distinct: ["classId"],
	});
	return enrollments.map((e) => e.classId);
};

// School-wide announcements (classId null) plus any scoped to a class
// one of this parent's children is currently enrolled in.
const visibleAnnouncementScope = (classIds) => ({
	OR: [{ classId: null }, { classId: { in: classIds } }],
});

const findAnnouncements = async (parentId, filters = {}) => {
	const classIds = await findActiveClassIdsForParent(parentId);

	const where = {
		status: "PUBLISHED",
		type: "ANNOUNCEMENT",
		...visibleAnnouncementScope(classIds),
	};

	if (filters.category) where.announcementCategory = filters.category;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [announcements, total] = await Promise.all([
		prisma.communication.findMany({
			where,
			include: {
				reads: {
					where: { parentId },
					select: { readAt: true },
				},
			},
			orderBy: { publishedAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.communication.count({ where }),
	]);

	// Attach isRead flag
	const data = announcements.map((a) => ({
		...a,
		isRead: a.reads.length > 0,
		readAt: a.reads[0]?.readAt ?? null,
		reads: undefined,
	}));

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const countUnreadAnnouncements = async (parentId) => {
	const classIds = await findActiveClassIdsForParent(parentId);
	const scope = {
		status: "PUBLISHED",
		type: "ANNOUNCEMENT",
		...visibleAnnouncementScope(classIds),
	};

	const total = await prisma.communication.count({ where: scope });

	const read = await prisma.communicationRead.count({
		where: { parentId, communication: scope },
	});

	return { unread: total - read, total };
};

const markAnnouncementRead = (communicationId, parentId) =>
	prisma.communicationRead.upsert({
		where: { communicationId_parentId: { communicationId, parentId } },
		update: {},
		create: { communicationId, parentId },
	});

const assertStudentBelongsToParent = async (studentId, parentId) => {
	const student = await prisma.student.findFirst({
		where: { id: studentId, parentId, deletedAt: null },
		include: {
			parent: {
				select: {
					id: true,
					accountEmail: true,
					accountPhone: true,
					primaryGuardian: true,
					secondaryGuardian: true,
					address: true,
					maritalStatus: true,
				},
			},
		},
	});
	if (!student) {
		throw new Error("Student does not belong to parent");
	}
	return student;
};
/**
 * Fetches the most recent school configuration.
 * Used to get the pass mark for result summary calculations.
 */
const findLatestSchoolConfig = () =>
	prisma.schoolConfiguration.findFirst({
		orderBy: { createdAt: "desc" },
	});

module.exports = {
	findParentByFirebaseUid,
	findParentById,
	findLatestSchoolConfig,
	updateParent,
	findChildren,
	findChildProfile,
	findVerifiedResults,
	findResultSummary,
	findAttendanceRate,
	findTimetableForStudent,
	findAnnouncements,
	countUnreadAnnouncements,
	markAnnouncementRead,
	assertStudentBelongsToParent,
};
