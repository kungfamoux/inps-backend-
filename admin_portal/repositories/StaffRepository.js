const prisma = require("../../lib/prisma");

const create = (data, tx) => {
	const client = tx ?? prisma;
	return client.staff.create({ data });
};

const findById = (id) => {
	return prisma.staff.findFirst({ 
		where: { id, deletedAt: null },
		include: {
			financialRecord: true,
			subjectAssignments: true,
		}
	});
};

const findByStaffId = (staffId) => {
	return prisma.staff.findFirst({ where: { staffId } });
};

const findByFirebaseUid = (firebaseUid) => {
	return prisma.staff.findFirst({ where: { firebaseUid, deletedAt: null } });
};

const findByEmail = (email) => {
	return prisma.staff.findFirst({ where: { email, deletedAt: null } });
};

// All staff — paginated
// Returns { data, meta: { total, page, limit, totalPages } }
const findAll = async (filters = {}) => {
	const includeDeleted = filters.includeDeleted === "true";

	const where = {};

	if (!includeDeleted) {
		where.deletedAt = null;
	}

	if (filters.role) where.role = filters.role;
	if (filters.type) where.type = filters.type;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.staff.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.staff.count({ where }),
	]);

	return {
		data,
		meta: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

// Active staff only — paginated
// Returns { data, meta: { total, page, limit, totalPages } }
const findAllActive = async (filters = {}) => {
	const where = { deletedAt: null, status: "ACTIVE" };
	if (filters.role) where.role = filters.role;
	if (filters.type) where.type = filters.type;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.staff.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.staff.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const update = (id, data) => {
	return prisma.staff.update({ where: { id }, data });
};

const softDelete = (id) => {
	return prisma.staff.update({
		where: { id },
		data: { deletedAt: new Date() },
	});
};

const count = (filters = {}) => {
	const where = { deletedAt: null };
	if (filters.role) where.role = filters.role;
	if (filters.status) where.status = filters.status;
	return prisma.staff.count({ where });
};

module.exports = {
	create,
	findById,
	findByStaffId,
	findByFirebaseUid,
	findByEmail,
	findAll,
	findAllActive,
	update,
	softDelete,
	count,
	countStaff: count,
};
