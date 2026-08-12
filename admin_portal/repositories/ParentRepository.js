const prisma = require("../../lib/prisma");

const findById = async (id) => {
	const parent = await prisma.parent.findUnique({
		where: { id },
		select: {
			id: true,
			accountEmail: true,
			accountPhone: true,
			primaryGuardian: true,
			secondaryGuardian: true,
			address: true,
			maritalStatus: true,
			createdAt: true,
			updatedAt: true,
			students: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					lastName: true,
					status: true,
					enrollments: {
						where: { status: "ACTIVE" },
						include: { class: true },
						take: 1,
						orderBy: { createdAt: "desc" },
					},
				},
			},
		},
	});

	if (!parent) return null;

	// Parse guardian JSON fields
	const parentData = { ...parent };
	if (parentData.primaryGuardian) {
		try {
			parentData.primaryGuardian = JSON.parse(parentData.primaryGuardian);
		} catch (e) {
			console.error('Failed to parse primaryGuardian:', e);
			parentData.primaryGuardian = null;
		}
	}
	if (parentData.secondaryGuardian) {
		try {
			parentData.secondaryGuardian = JSON.parse(parentData.secondaryGuardian);
		} catch (e) {
			console.error('Failed to parse secondaryGuardian:', e);
			parentData.secondaryGuardian = null;
		}
	}

	// Transform students to flatten class info
	if (parentData.students) {
		parentData.students = parentData.students.map(student => {
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
	}

	// Add computed fields for frontend compatibility
	if (parentData.primaryGuardian) {
		parentData.firstName = parentData.primaryGuardian.firstName;
		parentData.lastName = parentData.primaryGuardian.lastName;
	}

	return parentData;
};

const findByAccountEmail = async (accountEmail) => {
	const parent = await prisma.parent.findUnique({
		where: { accountEmail },
		select: {
			id: true,
			accountEmail: true,
			accountPhone: true,
			primaryGuardian: true,
			secondaryGuardian: true,
			address: true,
			maritalStatus: true,
			createdAt: true,
			updatedAt: true,
			students: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					lastName: true,
					status: true,
					enrollments: {
						where: { status: "ACTIVE" },
						include: { class: true },
						take: 1,
						orderBy: { createdAt: "desc" },
					},
				},
			},
		},
	});

	if (!parent) return null;

	// Parse guardian JSON fields
	const parentData = { ...parent };
	if (parentData.primaryGuardian) {
		try {
			parentData.primaryGuardian = JSON.parse(parentData.primaryGuardian);
		} catch (e) {
			console.error('Failed to parse primaryGuardian:', e);
			parentData.primaryGuardian = null;
		}
	}
	if (parentData.secondaryGuardian) {
		try {
			parentData.secondaryGuardian = JSON.parse(parentData.secondaryGuardian);
		} catch (e) {
			console.error('Failed to parse secondaryGuardian:', e);
			parentData.secondaryGuardian = null;
		}
	}

	// Transform students to flatten class info
	if (parentData.students) {
		parentData.students = parentData.students.map(student => {
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
	}

	// Add computed fields for frontend compatibility
	if (parentData.primaryGuardian) {
		parentData.firstName = parentData.primaryGuardian.firstName;
		parentData.lastName = parentData.primaryGuardian.lastName;
	}

	return parentData;
};

const findAll = async (filters = {}) => {
	const where = { deletedAt: null };
	if (filters.search) {
		// Search in guardian JSON fields is not directly supported by Prisma
		// For now, search accountEmail and accountPhone
		where.OR = [
			{ accountEmail: { contains: filters.search, mode: "insensitive" } },
			{ accountPhone: { contains: filters.search } },
		];
	}

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.parent.findMany({
			where,
			select: {
				id: true,
				accountEmail: true,
				accountPhone: true,
				primaryGuardian: true,
				secondaryGuardian: true,
				address: true,
				maritalStatus: true,
				createdAt: true,
				updatedAt: true,
				students: {
					select: {
						id: true,
						admissionNumber: true,
						firstName: true,
						lastName: true,
						status: true,
						enrollments: {
							where: { status: "ACTIVE" },
							include: { class: true },
							take: 1,
							orderBy: { createdAt: "desc" },
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.parent.count({ where }),
	]);

	// Transform data and parse guardian JSON fields
	const transformedData = data.map(parent => {
		const parentData = { ...parent };
		
		// Parse guardian JSON fields
		if (parentData.primaryGuardian) {
			try {
				parentData.primaryGuardian = JSON.parse(parentData.primaryGuardian);
			} catch (e) {
				console.error('Failed to parse primaryGuardian:', e);
				parentData.primaryGuardian = null;
			}
		}
		if (parentData.secondaryGuardian) {
			try {
				parentData.secondaryGuardian = JSON.parse(parentData.secondaryGuardian);
			} catch (e) {
				console.error('Failed to parse secondaryGuardian:', e);
				parentData.secondaryGuardian = null;
			}
		}

		// Transform students to flatten class info
		if (parentData.students) {
			parentData.students = parentData.students.map(student => {
				const studentData = { ...student };
				if (student.enrollments && student.enrollments.length > 0) {
					studentData.class = student.enrollments[0].class;
				} else {
					studentData.class = null;
				}
				delete studentData.enrollments;
				return studentData;
			});
		}

		// Add computed fields for frontend compatibility
		if (parentData.primaryGuardian) {
			parentData.firstName = parentData.primaryGuardian.firstName;
			parentData.lastName = parentData.primaryGuardian.lastName;
		}

		return parentData;
	});

	return {
		data: transformedData,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const update = async (id, data) => {
	const parent = await prisma.parent.update({
		where: { id },
		data,
		select: {
			id: true,
			accountEmail: true,
			accountPhone: true,
			primaryGuardian: true,
			secondaryGuardian: true,
			address: true,
			maritalStatus: true,
			createdAt: true,
			updatedAt: true,
			students: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					lastName: true,
					status: true,
					enrollments: {
						where: { status: "ACTIVE" },
						include: { class: true },
						take: 1,
						orderBy: { createdAt: "desc" },
					},
				},
			},
		},
	});

	// Parse guardian JSON fields
	const parentData = { ...parent };
	if (parentData.primaryGuardian) {
		try {
			parentData.primaryGuardian = JSON.parse(parentData.primaryGuardian);
		} catch (e) {
			console.error('Failed to parse primaryGuardian:', e);
			parentData.primaryGuardian = null;
		}
	}
	if (parentData.secondaryGuardian) {
		try {
			parentData.secondaryGuardian = JSON.parse(parentData.secondaryGuardian);
		} catch (e) {
			console.error('Failed to parse secondaryGuardian:', e);
			parentData.secondaryGuardian = null;
		}
	}

	// Transform students to flatten class info
	if (parentData.students) {
		parentData.students = parentData.students.map(student => {
			const studentData = { ...student };
			if (student.enrollments && student.enrollments.length > 0) {
				studentData.class = student.enrollments[0].class;
			} else {
				studentData.class = null;
			}
			delete studentData.enrollments;
			return studentData;
		});
	}

	// Add computed fields for frontend compatibility
	if (parentData.primaryGuardian) {
		parentData.firstName = parentData.primaryGuardian.firstName;
		parentData.lastName = parentData.primaryGuardian.lastName;
	}

	return parentData;
};

const softDelete = async (id) => {
	await prisma.parent.update({
		where: { id },
		data: { deletedAt: new Date() },
	});
};

const create = async (data) => {
	return await prisma.parent.create({
		data,
		select: {
			id: true,
			accountEmail: true,
			accountPhone: true,
			primaryGuardian: true,
			secondaryGuardian: true,
			address: true,
			maritalStatus: true,
			createdAt: true,
			updatedAt: true,
		},
	});
};

module.exports = {
	findById,
	findByAccountEmail,
	findAll,
	update,
	softDelete,
	create,
};