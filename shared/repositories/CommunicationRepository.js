const prisma = require("../../lib/prisma");

const create = (data) => prisma.communication.create({ data });

const findById = (id) => prisma.communication.findUnique({ where: { id } });

const findAll = async (filters = {}) => {
	const where = {};
	if (filters.type) where.type = filters.type;
	if (filters.status) where.status = filters.status;
	if (filters.target) where.target = filters.target;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.communication.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.communication.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const update = (id, data) => prisma.communication.update({ where: { id }, data });

const deleteOne = (id) => prisma.communication.delete({ where: { id } });

const countReads = (id) =>
	prisma.communicationRead.count({ where: { communicationId: id } });

// RECIPIENTS

/**
 * Fetches all non-deleted parent emails.
 * Used by _getRecipientEmails for PARENTS and ALL targets.
 */
const findParentEmails = () =>
	prisma.parent.findMany({
		where: { deletedAt: null },
		select: { accountEmail: true },
	});

/**
 * Fetches all active, non-deleted staff emails.
 * Used by _getRecipientEmails for STAFF and ALL targets.
 */
const findStaffEmails = () =>
	prisma.staff.findMany({
		where: { deletedAt: null, status: "ACTIVE" },
		select: { email: true },
	});

module.exports = {
	create,
	findById,
	findAll,
	update,
	deleteOne,
	countReads,
	findParentEmails,
	findStaffEmails,
};
