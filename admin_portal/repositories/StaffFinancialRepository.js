const prisma = require("../../lib/prisma");

const create = (data, tx) => {
	const client = tx ?? prisma;
	return client.staffFinancial.create({ data });
};

const findByStaffId = (staffId) => {
	return prisma.staffFinancial.findUnique({
		where: { staffId },
	});
};

const update = (staffId, data, tx) => {
	const client = tx ?? prisma;
	return client.staffFinancial.update({
		where: { staffId },
		data,
	});
};

const deleteByStaffId = (staffId) => {
	return prisma.staffFinancial.delete({
		where: { staffId },
	});
};

module.exports = {
	create,
	findByStaffId,
	update,
	deleteByStaffId,
};