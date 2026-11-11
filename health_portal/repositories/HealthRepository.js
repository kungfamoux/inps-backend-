const prisma = require("../../lib/prisma");

// Drug Request Methods
const createDrugRequest = (data, tx) => {
	const client = tx ?? prisma;
	return client.drugRequest.create({ data });
};

const getDrugRequests = async () => {
	return prisma.drugRequest.findMany({
		include: {
			nurse: {
				select: {
					id: true,
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
			purchases: true,
		},
		orderBy: { requestDate: "desc" },
	});
};

const getDrugRequestById = async (id) => {
	return prisma.drugRequest.findUnique({
		where: { id },
		include: {
			nurse: {
				select: {
					id: true,
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
			purchases: true,
		},
	});
};

const updateDrugRequestStatus = (id, status, tx) => {
	const client = tx ?? prisma;
	return client.drugRequest.update({
		where: { id },
		data: { status },
	});
};

// Drug Purchase Methods
const createDrugPurchase = (data, tx) => {
	const client = tx ?? prisma;
	return client.drugPurchase.create({ data });
};

const getPurchasesByRequestId = async (requestId) => {
	return prisma.drugPurchase.findMany({
		where: { requestId },
		orderBy: { purchaseDate: "desc" },
	});
};

// Sickbay Visit Methods
const createSickbayVisit = (data, tx) => {
	const client = tx ?? prisma;
	return client.sickbayVisit.create({
		data,
		include: {
			student: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					middleName: true,
					lastName: true,
				},
			},
			nurse: {
				select: {
					id: true,
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});
};

const getSickbayVisits = async (filters = {}) => {
	const { studentId, startDate, endDate } = filters;

	const where = {};
	if (studentId) {
		where.studentId = studentId;
	}
	if (startDate || endDate) {
		where.visitDate = {};
		if (startDate) {
			where.visitDate.gte = new Date(startDate);
		}
		if (endDate) {
			where.visitDate.lte = new Date(endDate);
		}
	}

	return prisma.sickbayVisit.findMany({
		where,
		include: {
			student: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					middleName: true,
					lastName: true,
				},
			},
			nurse: {
				select: {
					id: true,
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: { visitDate: "desc" },
	});
};

const getSickbayVisitById = async (id) => {
	return prisma.sickbayVisit.findUnique({
		where: { id },
		include: {
			student: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					middleName: true,
					lastName: true,
				},
			},
			nurse: {
				select: {
					id: true,
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});
};

const updateSickbayVisit = (id, data, tx) => {
	const client = tx ?? prisma;
	return client.sickbayVisit.update({
		where: { id },
		data,
	});
};

const getDailyVisits = async (date) => {
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);

	const endOfDay = new Date(date);
	endOfDay.setHours(23, 59, 59, 999);

	return prisma.sickbayVisit.findMany({
		where: {
			visitDate: {
				gte: startOfDay,
				lte: endOfDay,
			},
		},
		include: {
			student: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					middleName: true,
					lastName: true,
				},
			},
			nurse: {
				select: {
					id: true,
					staffId: true,
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: { visitDate: "desc" },
	});
};

// Daily Visitor Log Methods
const updateDailyVisitorLog = (date, image, tx) => {
	const client = tx ?? prisma;
	
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);

	const endOfDay = new Date(date);
	endOfDay.setHours(23, 59, 59, 999);

	// Update all visits on this date with the daily image
	return client.sickbayVisit.updateMany({
		where: {
			visitDate: {
				gte: startOfDay,
				lte: endOfDay,
			},
		},
		data: { dailyImage: image },
	});
};

const getDailyVisitorLog = async (date) => {
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);

	const endOfDay = new Date(date);
	endOfDay.setHours(23, 59, 59, 999);

	const visit = await prisma.sickbayVisit.findFirst({
		where: {
			visitDate: {
				gte: startOfDay,
				lte: endOfDay,
			},
			dailyImage: {
				not: null,
			},
		},
		select: {
			dailyImage: true,
		},
	});

	return visit?.dailyImage || null;
};

module.exports = {
	// Drug Request
	createDrugRequest,
	getDrugRequests,
	getDrugRequestById,
	updateDrugRequestStatus,
	// Drug Purchase
	createDrugPurchase,
	getPurchasesByRequestId,
	// Sickbay Visit
	createSickbayVisit,
	getSickbayVisits,
	getSickbayVisitById,
	updateSickbayVisit,
	getDailyVisits,
	// Daily Visitor Log
	updateDailyVisitorLog,
	getDailyVisitorLog,
};
