const prisma = require("../../lib/prisma");

// SUBJECTS
const createSubject = (data) => prisma.subject.create({ data });

const findSubjectById = (id) =>
	prisma.subject.findUnique({
		where: { id },
		include: {
			levels: true,
			assignments: { include: { teacher: true, class: true } },
		},
	});

const findSubjectByCode = (subjectCode) =>
	prisma.subject.findUnique({
		where: { subjectCode },
		include: { levels: true },
	});

const findAllSubjects = async (filters = {}) => {
	const page = Number(filters.page ?? 1);
	const limit = Number(filters.limit ?? 20);
	const skip = (page - 1) * limit;

	const where = { isActive: true, deletedAt: null };

	const [data, total] = await Promise.all([
		prisma.subject.findMany({
			where,
			include: { levels: true },
			orderBy: { subjectName: "asc" },
			skip,
			take: limit,
		}),
		prisma.subject.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const updateSubject = (id, data) =>
	prisma.subject.update({ where: { id }, data });

const deleteSubject = (id) =>
	prisma.subject.update({
		where: { id },
		data: { isActive: false, deletedAt: new Date() },
	});

const addSubjectLevel = (subjectId, level) =>
	prisma.subjectLevel.create({ data: { subjectId, level } });

const removeSubjectLevel = (subjectId, level) =>
	prisma.subjectLevel.delete({
		where: { subjectId_level: { subjectId, level } },
	});

// CLASS CURRICULUM
// Curriculum is scoped per term via termId → AcademicTerm foreign key.

const findClassSubject = (classId, subjectId, termId) =>
	prisma.classSubject.findUnique({
		where: { classId_subjectId_termId: { classId, subjectId, termId } },
	});

const createClassSubject = (classId, subjectId, termId) =>
	prisma.classSubject.create({
		data: { classId, subjectId, termId },
		include: { subject: true, class: true, term: true },
	});

const deleteClassSubject = (classId, subjectId, termId) =>
	prisma.classSubject.delete({
		where: { classId_subjectId_termId: { classId, subjectId, termId } },
	});

const findSubjectsByClass = (classId, termId) =>
	prisma.classSubject.findMany({
		where: { classId, termId },
		include: { subject: true },
	});

const findSubjectsByIds = (subjectIds) =>
	prisma.subject.findMany({ where: { id: { in: subjectIds } } });

const bulkCreateClassSubjects = (classId, subjectIds, termId) =>
	prisma.classSubject.createMany({
		data: subjectIds.map((subjectId) => ({ classId, subjectId, termId })),
		skipDuplicates: true,
	});

// SUBJECT ASSIGNMENTS
const createSubjectAssignment = (data) =>
	prisma.subjectAssignment.create({
		data,
		include: {
			subject: true,
			class: true,
			teacher: true,
		},
	});

const findAssignmentsByTeacher = (teacherId) =>
	prisma.subjectAssignment.findMany({
		where: { teacherId, status: "ACTIVE" },
		include: {
			subject: true,
			class: true,
		},
		orderBy: { createdAt: "desc" },
	});

const findAssignmentsByClass = (classId, academicYear, term) =>
	prisma.subjectAssignment.findMany({
		where: { classId, academicYear, term, status: "ACTIVE" },
		include: {
			subject: true,
			teacher: { select: { staffId: true, firstName: true, lastName: true } },
		},
	});

const updateSubjectAssignment = (id, data) =>
	prisma.subjectAssignment.update({ where: { id }, data });

const deactivateSubjectAssignment = (id) =>
	prisma.subjectAssignment.update({
		where: { id },
		data: { status: "INACTIVE" },
	});

const findSubjectAssignmentByUnique = (
	classId,
	subjectId,
	academicYear,
	term,
) =>
	prisma.subjectAssignment.findUnique({
		where: {
			classId_subjectId_academicYear_term: {
				classId,
				subjectId,
				academicYear,
				term,
			},
		},
	});

const findActiveSubjectAssignment = (classId, subjectId, teacherId) =>
	prisma.subjectAssignment.findFirst({
		where: { classId, subjectId, teacherId, status: "ACTIVE" },
	});

const bulkCreateSubjectAssignments = (assignments) =>
	prisma.subjectAssignment.createMany({
		data: assignments,
		skipDuplicates: true,
	});

const findClassesByIds = (classIds) =>
	prisma.class.findMany({
		where: { id: { in: classIds } },
	});

const findClassById = (classId) =>
	prisma.class.findUnique({
		where: { id: classId },
	});

// CLASS TEACHER ASSIGNMENT

// classTeacherId/assistantTeacherId are unique on Class — a staff member
// can only hold either role in one class at a time. Used to give a clear
// "already assigned to X" error instead of a raw P2002 conflict.
const findClassByClassTeacherId = (staffId) =>
	prisma.class.findUnique({
		where: { classTeacherId: staffId },
	});

const findClassByAssistantTeacherId = (staffId) =>
	prisma.class.findUnique({
		where: { assistantTeacherId: staffId },
	});

const assignClassTeacher = (classId, staffId) =>
	prisma.class.update({
		where: { id: classId },
		data: { classTeacherId: staffId },
		include: {
			classTeacher: {
				select: { staffId: true, firstName: true, lastName: true },
			},
		},
	});

const assignAssistantTeacher = (classId, staffId) =>
	prisma.class.update({
		where: { id: classId },
		data: { assistantTeacherId: staffId },
		include: {
			assistantTeacher: {
				select: { staffId: true, firstName: true, lastName: true },
			},
		},
	});

const removeClassTeacher = (classId) =>
	prisma.class.update({
		where: { id: classId },
		data: { classTeacherId: null },
	});

const removeAssistantTeacher = (classId) =>
	prisma.class.update({
		where: { id: classId },
		data: { assistantTeacherId: null },
	});

// SCHEDULES
const createSchedule = (data) =>
	prisma.schedule.create({
		data,
		include: {
			subject: true,
			class: true,
			staff: { select: { staffId: true, firstName: true, lastName: true } },
		},
	});

const findSchedulesByClass = (classId) =>
	prisma.schedule.findMany({
		where: { classId },
		include: {
			subject: true,
			staff: { select: { staffId: true, firstName: true, lastName: true } },
		},
		orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
	});

const findSchedulesByTeacher = (staffId) =>
	prisma.schedule.findMany({
		where: { staffId },
		include: {
			subject: true,
			class: true,
		},
		orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
	});

const findSchedulesByDay = (classId, dayOfWeek) =>
	prisma.schedule.findMany({
		where: { classId, dayOfWeek },
		include: { subject: { select: { subjectName: true } } },
	});

const findSchedulesByStaffAndDay = (staffId, dayOfWeek) =>
	prisma.schedule.findMany({
		where: { staffId, dayOfWeek },
		include: {
			subject: { select: { subjectName: true } },
			class: { select: { name: true } },
		},
	});

const deleteSchedule = (id) => prisma.schedule.delete({ where: { id } });

// RESULT VERIFICATION
const findResultById = (id) => prisma.result.findUnique({ where: { id } });

const verifyResult = (resultId, staffId) =>
	prisma.result.update({
		where: { id: resultId },
		data: {
			isVerified: true,
			verifiedById: staffId,
			verifiedAt: new Date(),
		},
	});

const verifyAllResultsForStudent = (studentId, termId, sessionId, staffId) =>
	prisma.result.updateMany({
		where: { studentId, termId, sessionId, isVerified: false },
		data: {
			isVerified: true,
			verifiedById: staffId,
			verifiedAt: new Date(),
		},
	});

const verifyAllResultsForClass = async (
	classId,
	termId,
	sessionId,
	staffId,
) => {
	const enrollments = await prisma.enrollment.findMany({
		where: { classId, status: "ACTIVE" },
		select: { studentId: true },
	});

	const studentIds = enrollments.map((e) => e.studentId);

	const result = await prisma.result.updateMany({
		where: {
			studentId: { in: studentIds },
			termId,
			sessionId,
			isVerified: false,
		},
		data: {
			isVerified: true,
			verifiedById: staffId,
			verifiedAt: new Date(),
		},
	});

	return result;
};

module.exports = {
	// Subjects
	createSubject,
	findSubjectById,
	findSubjectByCode,
	findAllSubjects,
	updateSubject,
	deleteSubject,
	addSubjectLevel,
	removeSubjectLevel,

	// Class Curriculum
	findClassSubject,
	createClassSubject,
	deleteClassSubject,
	findSubjectsByClass,
	findSubjectsByIds,
	bulkCreateClassSubjects,

	// Subject Assignments
	createSubjectAssignment,
	findAssignmentsByTeacher,
	findAssignmentsByClass,
	updateSubjectAssignment,
	deactivateSubjectAssignment,
	findSubjectAssignmentByUnique,
	findActiveSubjectAssignment,
	bulkCreateSubjectAssignments,
	findClassesByIds,
	findClassById,

	// Class Teacher Assignment
	findClassByClassTeacherId,
	findClassByAssistantTeacherId,
	assignClassTeacher,
	assignAssistantTeacher,
	removeClassTeacher,
	removeAssistantTeacher,

	// Schedules
	createSchedule,
	findSchedulesByClass,
	findSchedulesByTeacher,
	findSchedulesByDay,
	findSchedulesByStaffAndDay,
	deleteSchedule,

	// Result Verification
	findResultById,
	verifyResult,
	verifyAllResultsForStudent,
	verifyAllResultsForClass,
};
