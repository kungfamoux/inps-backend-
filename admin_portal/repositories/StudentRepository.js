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
	countStudents,
	findParentByAccountEmail,
	createParent,
	createStudentWithAdmissionNumber,
	findResultsByStudentAndTerm,
	findAllResultsByStudent,
	findAllResults,
	findSubjectByCode,
	findResultsBySubject,
};
