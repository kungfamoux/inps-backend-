const prisma = require("../../lib/prisma");

// BILL (Fee Structure)

const createBill = async (data) => {
	try {
		return await prisma.bill.create({
			data,
			include: {
				classes: true,
			},
		});
	} catch (error) {
		// Prisma unique constraint error
		if (error.code === "P2002") {
			throw new Error(
				`Bill "${data.name}" already exists for ${data.academicYear} ${data.term}`,
			);
		}

		throw error;
	}
};

const findBillById = (id) =>
	prisma.bill.findUnique({
		where: { id },
		include: { classes: { include: { class: true } }, students: true },
	});

const findAllBills = async (filters = {}) => {
	const where = {};
	if (filters.academicYear) where.academicYear = filters.academicYear;
	if (filters.term) where.term = filters.term;
	if (filters.scope) where.scope = filters.scope;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.bill.findMany({
			where,
			include: { classes: { include: { class: true } } },
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.bill.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const updateBill = (id, data) => prisma.bill.update({ where: { id }, data });

const countBillInvoices = (id) =>
	prisma.invoice.count({ where: { billId: id } });

const deleteBill = (id) =>
	prisma.$transaction(async (tx) => {
		await tx.billClass.deleteMany({ where: { billId: id } });
		await tx.billStudent.deleteMany({ where: { billId: id } });
		return tx.bill.delete({ where: { id } });
	});

// BOOK PRICES

const createBookPrice = (data) => prisma.bookPrice.create({ data });

const findBookPriceById = (id) =>
	prisma.bookPrice.findUnique({ where: { id } });

const findAllBookPrices = async (filters = {}) => {
	const where = {};
	if (filters.level) where.level = filters.level;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.bookPrice.findMany({
			where,
			orderBy: { level: "asc" },
			skip,
			take: limit,
		}),
		prisma.bookPrice.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const updateBookPrice = (id, data) =>
	prisma.bookPrice.update({ where: { id }, data });

const deleteBookPrice = (id) => prisma.bookPrice.delete({ where: { id } });

// EXPENSES

const createExpense = (data) => prisma.expense.create({ data });

const findAllExpenses = async (filters = {}) => {
	const where = {};
	if (filters.category) where.category = filters.category;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.expense.findMany({
			where,
			orderBy: { date: "desc" },
			skip,
			take: limit,
		}),
		prisma.expense.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const getTotalExpenses = () =>
	prisma.expense.aggregate({ _sum: { amount: true } });

// INCOME RECORDS

const createIncomeRecord = (data) => prisma.incomeRecord.create({ data });

const findAllIncomeRecords = async (filters = {}) => {
	const where = {};
	if (filters.category) where.category = filters.category;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.incomeRecord.findMany({
			where,
			orderBy: { date: "desc" },
			skip,
			take: limit,
		}),
		prisma.incomeRecord.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const getTotalIncome = () =>
	prisma.incomeRecord.aggregate({ _sum: { amount: true } });

// PAYMENTS

const findRecentPayments = async (filters = {}) => {
	const where = {};
	if (filters.status) where.status = filters.status;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.payment.findMany({
			where,
			include: {
				student: {
					select: {
						admissionNumber: true,
						firstName: true,
						lastName: true,
					},
				},
				invoice: {
					select: {
						invoiceNumber: true,
						academicYear: true,
						term: true,
					},
				},
			},
			orderBy: { paymentDate: "desc" },
			skip,
			take: limit,
		}),
		prisma.payment.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

const getTotalPayments = () =>
	prisma.payment.aggregate({
		_sum: { amount: true },
		where: { status: "COMPLETED", deletedAt: null },
	});
const findBillByUniqueFields = async ({ name, academicYear, term }) => {
	return prisma.bill.findUnique({
		where: {
			name_academicYear_term: {
				name,
				academicYear,
				term,
			},
		},
	});
};
/**
 * Fetches all bills applicable to a class for a given term.
 * Includes ALL_STUDENTS scope and BY_CLASS scope filtered to the given classId.
 * Used by getFeeStructureByClass.
 */
const findBillsByClass = (classId, academicYear, term) =>
	prisma.bill.findMany({
		where: {
			academicYear,
			term,
			OR: [
				{ scope: "ALL_STUDENTS" },
				{
					scope: "BY_CLASS",
					classes: { some: { classId } },
				},
			],
		},
		orderBy: { name: "asc" },
	});

// INVOICES

const findAllInvoices = async (filters = {}) => {
	const where = {};
	if (filters.academicYear) where.academicYear = filters.academicYear;
	if (filters.term) where.term = filters.term;
	if (filters.status) where.status = filters.status;

	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.invoice.findMany({
			where,
			include: {
				student: {
					select: {
						admissionNumber: true,
						firstName: true,
						lastName: true,
					},
				},
				bill: {
					select: {
						name: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.invoice.count({ where }),
	]);

	return {
		data,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
};

module.exports = {
	createBill,
	findBillByUniqueFields,
	findBillById,
	findAllBills,
	findBillsByClass,
	updateBill,
	deleteBill,
	countBillInvoices,
	createBookPrice,
	findBookPriceById,
	findAllBookPrices,
	updateBookPrice,
	deleteBookPrice,
	createExpense,
	findAllExpenses,
	getTotalExpenses,
	createIncomeRecord,
	findAllIncomeRecords,
	getTotalIncome,
	findRecentPayments,
	getTotalPayments,
	findAllInvoices,
};
