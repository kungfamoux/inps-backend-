const prisma = require("../../lib/prisma");

const create = (data, tx) => {
	const client = tx ?? prisma;
	return client.student.create({ data });
};

const findById = async (id, filters = {}) => {
	const academicYear = filters.academicYear || "2026/2027";
	const term = filters.term || "FIRST_TERM";

	const student = await prisma.student.findFirst({
		where: { id, deletedAt: null },
		select: {
			id: true,
			admissionNumber: true,
			firstName: true,
			middleName: true,
			lastName: true,
			gender: true,
			dateOfBirth: true,
			admissionDate: true,
			nationality: true,
			state: true,
			lga: true,
			religion: true,
			healthInfo: true,
			sportHouse: true,
			bloodGroup: true,
			studentType: true,
			address: true,
			passportPhoto: true,
			parentId: true,
			status: true,
			createdAt: true,
			updatedAt: true,
			parent: true,
			enrollments: {
				where: { 
					status: "ACTIVE",
					academicYear: academicYear,
					term: term
				},
				include: { class: true },
				take: 1,
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!student) return null;

	// Flatten enrollment class info
	const studentData = { ...student };
	if (student.enrollments && student.enrollments.length > 0) {
		studentData.class = student.enrollments[0].class;
	} else {
		studentData.class = null;
	}
	delete studentData.enrollments;

	return studentData;
};

const findByAdmissionNumber = async (admissionNumber, filters = {}) => {
	const academicYear = filters.academicYear || "2026/2027";
	const term = filters.term || "FIRST_TERM";

	const student = await prisma.student.findFirst({
		where: { admissionNumber, deletedAt: null },
		select: {
			id: true,
			admissionNumber: true,
			firstName: true,
			middleName: true,
			lastName: true,
			gender: true,
			dateOfBirth: true,
			admissionDate: true,
			nationality: true,
			state: true,
			lga: true,
			religion: true,
			healthInfo: true,
			sportHouse: true,
			bloodGroup: true,
			studentType: true,
			address: true,
			passportPhoto: true,
			parentId: true,
			status: true,
			createdAt: true,
			updatedAt: true,
			parent: true,
			enrollments: {
				where: { 
					status: "ACTIVE",
					academicYear: academicYear,
					term: term
				},
				include: { class: true },
				take: 1,
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!student) return null;

	// Flatten enrollment class info
	const studentData = { ...student };
	if (student.enrollments && student.enrollments.length > 0) {
		studentData.class = student.enrollments[0].class;
	} else {
		studentData.class = null;
	}
	delete studentData.enrollments;

	return studentData;
};

const findAll = async (filters = {}) => {
	const where = { deletedAt: null };
	if (filters.status) where.status = filters.status;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	// Get current academic year and term from filters or use defaults
	const academicYear = filters.academicYear || "2026/2027";
	const term = filters.term || "FIRST_TERM";

	const [data, total] = await Promise.all([
		prisma.student.findMany({
			where,
			select: {
				id: true,
				admissionNumber: true,
				firstName: true,
				middleName: true,
				lastName: true,
				gender: true,
				dateOfBirth: true,
				admissionDate: true,
				nationality: true,
				state: true,
				lga: true,
				religion: true,
				healthInfo: true,
				sportHouse: true,
				bloodGroup: true,
				studentType: true,
				address: true,
				passportPhoto: true,
				parentId: true,
				status: true,
				createdAt: true,
				updatedAt: true,
				parent: true,
				enrollments: {
					where: { 
						status: "ACTIVE",
						academicYear: academicYear,
						term: term
					},
					include: { class: true },
					take: 1,
					orderBy: { createdAt: "desc" },
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.student.count({ where }),
	]);

	// Transform data to flatten enrollment class info
	const transformedData = data.map(student => {
		const studentData = { ...student };
		// Get the class from the enrollment
		if (student.enrollments && student.enrollments.length > 0) {
			studentData.class = student.enrollments[0].class;
		} else {
			studentData.class = null;
		}
		// Remove enrollments from the response to avoid nesting
		delete studentData.enrollments;
		return studentData;
	});

	return {
		data: transformedData,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const update = (id, data) => prisma.student.update({ where: { id }, data });

const softDelete = (id) =>
	prisma.student.update({
		where: { id },
		data: { deletedAt: new Date() },
	});

/**
 * Hard deletes a student and releases their admission number back to the pool for reuse.
 * This operation is performed within a transaction to ensure data integrity.
 *
 * @param {string} admissionNumber - The admission number of the student to delete
 * @param {string} staffId - The ID of the staff member performing the deletion (for audit trail)
 * @returns {Promise<void>}
 */
const hardDeleteAndReleaseAdmissionNumber = async (admissionNumber, staffId) => {
	return prisma.$transaction(async (tx) => {
		// Get the student before deletion
		const student = await tx.student.findUnique({
			where: { admissionNumber }
		});

		if (!student) throw new Error("Student not found");

		// Extract year from admission number (format: INPS-YEAR-SEQUENCE)
		const year = admissionNumber.split('-')[1];

		// Delete the student (hard delete)
		await tx.student.delete({
			where: { admissionNumber }
		});

		// Add admission number to pool for reuse
		await tx.admissionNumberPool.create({
			data: {
				admissionNumber: student.admissionNumber,
				isAvailable: true,
				year: year,
				releasedAt: new Date(),
				releasedBy: staffId,
				studentId: student.id
			}
		});
	});
};

const countStudents = (filters = {}) => {
	const where = { deletedAt: null };
	if (filters.status) where.status = filters.status;
	return prisma.student.count({ where });
};

/**
 * Finds a parent by accountEmail.
 * Used in createStudent for the sibling check.
 */
const findParentByAccountEmail = (accountEmail) =>
	prisma.parent.findUnique({ where: { accountEmail } });

/**
 * Finds a duplicate student based on personal details and parent email.
 * Used in createStudent to prevent duplicate registrations.
 */
const findDuplicateStudent = ({ firstName, lastName, dateOfBirth, accountEmail }) =>
	prisma.student.findFirst({
		where: {
			firstName,
			lastName,
			dateOfBirth,
			parent: {
				accountEmail,
			},
			deletedAt: null,
		},
	});

/**
 * Creates a new parent record.
 * Used in createStudent after Firebase user creation succeeds.
 */
const createParent = (data) => prisma.parent.create({ data });

/**
 * Runs the admission number + student creation inside a transaction.
 * Accepts the transaction client and pre-built student data.
 */
const createStudentWithAdmissionNumber = (studentData, tx) => {
	const client = tx ?? prisma;
	return client.student.create({ data: studentData });
};

const RESULT_INCLUDE = {
	subject: { select: { subjectName: true, subjectCode: true } },
	term: { select: { term: true } },
	session: { select: { session: true } },
	staff: { select: { firstName: true, lastName: true } },
};

/**
 * Finds results for a student filtered by term and session.
 */
const findResultsByStudentAndTerm = (studentId, termId, sessionId) =>
	prisma.result.findMany({
		where: { studentId, termId, sessionId },
		include: RESULT_INCLUDE,
		orderBy: { createdAt: "asc" },
	});

/**
 * Finds all results for a student across every term and session.
 */
const findAllResultsByStudent = (studentId) =>
	prisma.result.findMany({
		where: { studentId },
		include: RESULT_INCLUDE,
		orderBy: [{ session: { session: "desc" } }, { createdAt: "desc" }],
	});

/**
 * Finds all results with pagination, optionally filtered by session and term.
 */
const findAllResults = async (filters = {}) => {
	const where = {};
	if (filters.sessionId) where.sessionId = filters.sessionId;
	if (filters.termId) where.termId = filters.termId;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.result.findMany({
			where,
			include: {
				student: {
					select: {
						admissionNumber: true,
						firstName: true,
						lastName: true,
					},
				},
				...RESULT_INCLUDE,
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.result.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

/**
 * Finds a subject by its subjectCode.
 * Used by getResultsBySubject before scoping the result query.
 */
const findSubjectByCode = (subjectCode) =>
	prisma.subject.findUnique({ where: { subjectCode } });

/**
 * Finds all results for a subject with pagination,
 * optionally filtered by session, term, and student class name.
 */
const findResultsBySubject = async (subjectId, filters = {}) => {
	const where = { subjectId };
	if (filters.sessionId) where.sessionId = filters.sessionId;
	if (filters.termId) where.termId = filters.termId;

	if (filters.className) {
		where.student = {
			deletedAt: null,
			enrollments: {
				some: { status: "ACTIVE", class: { name: filters.className } },
			},
		};
	}

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.result.findMany({
			where,
			include: {
				student: {
					select: {
						admissionNumber: true,
						firstName: true,
						lastName: true,
					},
				},
				...RESULT_INCLUDE,
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.result.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

module.exports = {
	create,
	findById,
	findByAdmissionNumber,
	findAll,
	update,
	softDelete,
	hardDeleteAndReleaseAdmissionNumber,
	countStudents,
	findParentByAccountEmail,
	findDuplicateStudent,
	createParent,
	createStudentWithAdmissionNumber,
	findResultsByStudentAndTerm,
	findAllResultsByStudent,
	findAllResults,
	findSubjectByCode,
	findResultsBySubject,
};
