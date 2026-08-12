const prisma = require("../../lib/prisma");

const searchStaff = (q, filters = {}) => {
	const where = { deletedAt: null };
	
	// Add text search if query provided
	if (q && q.trim()) {
		where.OR = [
			{ firstName: { contains: q, mode: "insensitive" } },
			{ lastName: { contains: q, mode: "insensitive" } },
			{ staffId: { contains: q, mode: "insensitive" } },
			{ email: { contains: q, mode: "insensitive" } },
		];
	}
	
	// Add basic filters
	if (filters.status) where.status = filters.status;
	if (filters.role) where.role = filters.role;
	
	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	return prisma.staff.findMany({
		where,
		select: {
			id: true,
			staffId: true,
			firstName: true,
			lastName: true,
			email: true,
			role: true,
			type: true,
			status: true,
		},
		orderBy: { createdAt: 'desc' },
		skip,
		take: limit,
	});
};

const searchStudents = (q, filters = {}) => {
	const where = { deletedAt: null };
	
	// Add text search if query provided
	if (q && q.trim()) {
		where.OR = [
			{ firstName: { contains: q, mode: "insensitive" } },
			{ lastName: { contains: q, mode: "insensitive" } },
			{ admissionNumber: { contains: q, mode: "insensitive" } },
		];
	}
	
	// Add basic filters
	if (filters.status) where.status = filters.status;
	if (filters.classId) where.enrollments = {
		some: {
			classId: filters.classId,
			status: 'ACTIVE'
		}
	};
	
	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	return prisma.student.findMany({
		where,
		select: {
			id: true,
			admissionNumber: true,
			firstName: true,
			lastName: true,
			status: true,
			passportPhoto: true,
			gender: true,
			enrollments: {
				where: { status: "ACTIVE" },
				include: {
					class: { select: { name: true, id: true } },
				},
				take: 1,
				orderBy: { createdAt: "desc" },
			},
		},
		orderBy: { createdAt: 'desc' },
		skip,
		take: limit,
	}).then(students => {
		// Flatten the enrollment data to match the existing pattern
		return students.map(student => {
			const activeEnrollment = student.enrollments[0];
			return {
				...student,
				class: activeEnrollment?.class || null,
				enrollments: undefined
			};
		});
	});
};

const searchParents = (q, filters = {}) => {
	const where = { deletedAt: null };
	
	// Add text search if query provided
	if (q && q.trim()) {
		where.OR = [
			{ fatherFirstName: { contains: q, mode: "insensitive" } },
			{ fatherLastName: { contains: q, mode: "insensitive" } },
			{ motherFirstName: { contains: q, mode: "insensitive" } },
			{ motherLastName: { contains: q, mode: "insensitive" } },
			{ accountEmail: { contains: q, mode: "insensitive" } },
			{ accountPhone: { contains: q, mode: "insensitive" } },
		];
	}
	
	// Add basic filters
	if (filters.status) where.status = filters.status;
	
	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	return prisma.parent.findMany({
		where,
		select: {
			id: true,
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
			status: true,
			students: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					lastName: true,
					status: true,
				},
			},
		},
		orderBy: { createdAt: 'desc' },
		skip,
		take: limit,
	}).then(parents => {
		// Add computed fields to match existing pattern
		return parents.map(parent => ({
			id: parent.id, // Ensure ID is preserved
			accountEmail: parent.accountEmail,
			accountPhone: parent.accountPhone,
			fatherFirstName: parent.fatherFirstName,
			fatherLastName: parent.fatherLastName,
			fatherPhone: parent.fatherPhone,
			fatherEmail: parent.fatherEmail,
			motherFirstName: parent.motherFirstName,
			motherLastName: parent.motherLastName,
			motherPhone: parent.motherPhone,
			motherEmail: parent.motherEmail,
			status: parent.status,
			students: parent.students,
			firstName: parent.fatherFirstName,
			lastName: parent.fatherLastName,
		}));
	});
};

const searchSubjects = (q, filters = {}) => {
	const where = { deletedAt: null };
	
	// Add text search if query provided
	if (q && q.trim()) {
		where.OR = [
			{ subjectName: { contains: q, mode: "insensitive" } },
			{ subjectCode: { contains: q, mode: "insensitive" } },
		];
	}
	
	// Add basic filters
	if (filters.status) where.isActive = filters.status === 'ACTIVE';
	
	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	return prisma.subject.findMany({
		where,
		select: {
			id: true,
			subjectName: true,
			subjectCode: true,
			isActive: true,
			levels: { select: { level: true } },
		},
		orderBy: { subjectName: 'asc' },
		skip,
		take: limit,
	});
};

const searchClasses = (q, filters = {}) => {
	const where = { deletedAt: null };
	
	// Add text search if query provided
	if (q && q.trim()) {
		where.OR = [
			{ name: { contains: q, mode: "insensitive" } },
		];
	}
	
	// Add basic filters
	if (filters.status) where.status = filters.status;
	if (filters.level) where.level = filters.level;
	
	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	return prisma.class.findMany({
		where,
		select: {
			id: true,
			name: true,
			level: true,
			status: true,
			currentEnrollment: true,
			color: true,
		},
		orderBy: { name: 'asc' },
		skip,
		take: limit,
	});
};

const searchResults = (q, filters = {}) => {
	const where = { deletedAt: null };
	
	// Add text search if query provided
	if (q && q.trim()) {
		where.OR = [
			{ student: { firstName: { contains: q, mode: "insensitive" } } },
			{ student: { lastName: { contains: q, mode: "insensitive" } } },
			{ student: { admissionNumber: { contains: q, mode: "insensitive" } } },
		];
	}
	
	// Add basic filters
	if (filters.sessionId) where.sessionId = filters.sessionId;
	if (filters.termId) where.termId = filters.termId;
	if (filters.subjectId) where.subjectId = filters.subjectId;
	
	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	return prisma.result.findMany({
		where,
		include: {
			student: {
				select: {
					admissionNumber: true,
					firstName: true,
					lastName: true,
				},
			},
			subject: {
				select: {
					subjectName: true,
					subjectCode: true,
				},
			},
			term: {
				select: {
					term: true,
				},
			},
			session: {
				select: {
					session: true,
				},
			},
		},
		orderBy: { createdAt: 'desc' },
		skip,
		take: limit,
	});
};

// Helper function to get total count for pagination
const getCount = async (modelName, query, filters = {}) => {
	const where = { deletedAt: null };
	
	// Add text search if query provided
	if (query && query.trim()) {
		switch (modelName) {
			case 'staff':
				where.OR = [
					{ firstName: { contains: query, mode: "insensitive" } },
					{ lastName: { contains: query, mode: "insensitive" } },
					{ staffId: { contains: query, mode: "insensitive" } },
					{ email: { contains: query, mode: "insensitive" } },
				];
				break;
			case 'student':
				where.OR = [
					{ firstName: { contains: query, mode: "insensitive" } },
					{ lastName: { contains: query, mode: "insensitive" } },
					{ admissionNumber: { contains: query, mode: "insensitive" } },
				];
				break;
			case 'parent':
				where.OR = [
					{ fatherFirstName: { contains: query, mode: "insensitive" } },
					{ fatherLastName: { contains: query, mode: "insensitive" } },
					{ motherFirstName: { contains: query, mode: "insensitive" } },
					{ motherLastName: { contains: query, mode: "insensitive" } },
					{ accountEmail: { contains: query, mode: "insensitive" } },
					{ accountPhone: { contains: query, mode: "insensitive" } },
				];
				break;
			case 'subject':
				where.OR = [
					{ subjectName: { contains: query, mode: "insensitive" } },
					{ subjectCode: { contains: query, mode: "insensitive" } },
				];
				break;
			case 'class':
				where.OR = [
					{ name: { contains: query, mode: "insensitive" } },
				];
				break;
			case 'result':
				where.OR = [
					{ student: { firstName: { contains: query, mode: "insensitive" } } },
					{ student: { lastName: { contains: query, mode: "insensitive" } } },
					{ student: { admissionNumber: { contains: query, mode: "insensitive" } } },
				];
				break;
		}
	}
	
	// Add basic filters
	if (filters.status) where.status = filters.status;
	if (filters.role) where.role = filters.role;
	if (filters.classId) where.enrollments = {
		some: {
			classId: filters.classId,
			status: 'ACTIVE'
		}
	};
	if (filters.level) where.level = filters.level;
	if (filters.sessionId) where.sessionId = filters.sessionId;
	if (filters.termId) where.termId = filters.termId;
	if (filters.subjectId) where.subjectId = filters.subjectId;
	if (filters.status && modelName === 'subject') where.isActive = filters.status === 'ACTIVE';
	
	switch (modelName) {
		case 'staff':
			return prisma.staff.count({ where });
		case 'student':
			return prisma.student.count({ where });
		case 'parent':
			return prisma.parent.count({ where });
		case 'subject':
			return prisma.subject.count({ where });
		case 'class':
			return prisma.class.count({ where });
		case 'result':
			return prisma.result.count({ where });
		default:
			return 0;
	}
};

module.exports = {
	searchStaff,
	searchStudents,
	searchParents,
	searchSubjects,
	searchClasses,
	searchResults,
	getCount,
};
