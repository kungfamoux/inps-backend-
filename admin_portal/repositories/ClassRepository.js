const prisma = require("../../lib/prisma");

// CLASSES

const createClass = (data) =>
	prisma.class.create({
		data,
		include: {
			classTeacher: {
				select: {
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
			assistantTeacher: {
				select: {
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});

const findClassById = (id) =>
	prisma.class.findUnique({
		where: { id },
		include: {
			classTeacher: {
				select: {
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
			assistantTeacher: {
				select: {
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
			classSubjects: true,
		},
	});

const findClassByName = (name) =>
	prisma.class.findFirst({
		where: { name },
		include: {
			classTeacher: {
				select: {
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
			assistantTeacher: {
				select: {
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});

const findAllClasses = (filters = {}) => {
	const where = {};
	if (filters.status) where.status = filters.status;
	if (filters.color) where.color = filters.color;

	return prisma.class.findMany({
		where,
		include: {
			classTeacher: {
				select: {
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
			assistantTeacher: {
				select: {
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
			_count: {
				select: {
					enrollments: true,
				},
			},
		},
		orderBy: { name: "asc" },
	});
};

const updateClass = (id, data) =>
	prisma.class.update({
		where: { id },
		data,
		include: {
			classTeacher: {
				select: {
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
			assistantTeacher: {
				select: {
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});

const deleteClass = (id) =>
	prisma.class.delete({
		where: { id },
	});

const countClassDependents = async (classId) => {
	const [classSubjects, enrollments, billClasses, subjectAssignments, schedules, attendance, behavioralRatings, nurseryAssessments, communications] = await Promise.all(
		[
			prisma.classSubject.count({ where: { classId } }),
			prisma.enrollment.count({ where: { classId } }),
			prisma.billClass.count({ where: { classId } }),
			prisma.subjectAssignment.count({ where: { classId } }),
			prisma.schedule.count({ where: { classId } }),
			prisma.attendance.count({ where: { classId } }),
			prisma.behavioralRating.count({ where: { classId } }),
			prisma.nurseryAssessment.count({ where: { classId } }),
			prisma.communication.count({ where: { classId } }),
		],
	);

	return {
		classSubjects,
		enrollments,
		billClasses,
		subjectAssignments,
		schedules,
		attendance,
		behavioralRatings,
		nurseryAssessments,
		communications,
		total:
			classSubjects +
			enrollments +
			billClasses +
			subjectAssignments +
			schedules +
			attendance +
			behavioralRatings +
			nurseryAssessments +
			communications,
	};
};

const assignClassTeacher = (classId, teacherId) =>
	prisma.class.update({
		where: { id: classId },
		data: { classTeacherId: teacherId },
	});

const assignAssistantTeacher = (classId, teacherId) =>
	prisma.class.update({
		where: { id: classId },
		data: { assistantTeacherId: teacherId },
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

const getStudentsByClass = (classId, filters = {}) => {
	const where = { classId };
	if (filters.status) where.status = filters.status;
	if (filters.academicYear) where.academicYear = filters.academicYear;
	if (filters.term) where.term = filters.term;

	console.log('[DEBUG ClassRepository] getStudentsByClass called with:', { classId, filters, where });

	// First, let's see what enrollment records exist for this class without filters
	prisma.enrollment.findMany({
		where: { classId },
		select: {
			id: true,
			academicYear: true,
			term: true,
			student: {
				select: {
					firstName: true,
					lastName: true,
				}
			}
		}
	}).then(enrollments => {
		console.log('[DEBUG ClassRepository] All enrollments for this class:', enrollments);
	}).catch(err => {
		console.error('[DEBUG ClassRepository] Error fetching enrollments:', err);
	});

	return prisma.enrollment.findMany({
		where,
		include: {
			student: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					lastName: true,
					gender: true,
					status: true,
				},
			},
			class: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: { student: { lastName: "asc" } },
	});
};

const updateClassEnrollment = (classId) =>
	prisma.class.update({
		where: { id: classId },
		data: {
			currentEnrollment: {
				increment: 1,
			},
		},
	});

const decrementClassEnrollment = (classId) =>
	prisma.class.update({
		where: { id: classId },
		data: {
			currentEnrollment: {
				decrement: 1,
			},
		},
	});

// EXPORTS

module.exports = {
	createClass,
	findClassById,
	findClassByName,
	findAllClasses,
	updateClass,
	deleteClass,
	countClassDependents,
	assignClassTeacher,
	assignAssistantTeacher,
	removeClassTeacher,
	removeAssistantTeacher,
	getStudentsByClass,
	updateClassEnrollment,
	decrementClassEnrollment,
};
