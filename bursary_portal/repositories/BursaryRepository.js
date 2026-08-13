const prisma = require("../../lib/prisma");

// FEE COLLECTIONS (completed payments)

const findFeeCollections = async (filters = {}) => {
	//  Base conditions
	const where = {
		deletedAt: null,
	};

	//  Status — accepts one or more values (e.g. the former dedicated
	// debtors view is now just status=PENDING,PARTIAL,OVERDUE here).
	if (filters.status) {
		if (Array.isArray(filters.status) && filters.status.length) {
			where.status = { in: filters.status };
		} else if (typeof filters.status === 'string') {
			where.status = filters.status;
		}
	}

	//  Academic year / term
	// Both are indexed together with studentId — these filters are cheap
	if (filters.academicYear) where.academicYear = filters.academicYear;
	if (filters.term) where.term = filters.term;

	//  Date range
	if (filters.startDate || filters.endDate) {
		where.dueDate = {};
		if (filters.startDate) where.dueDate.gte = new Date(filters.startDate);
		if (filters.endDate) where.dueDate.lte = new Date(filters.endDate);
	}

	//  Search
	if (filters.search) {
		where.OR = [
			{ invoiceNumber: { contains: filters.search, mode: "insensitive" } },
			{
				student: {
					OR: [
						{ firstName: { contains: filters.search, mode: "insensitive" } },
						{ lastName: { contains: filters.search, mode: "insensitive" } },
					],
				},
			},
		];
	}

	//  Pagination
	const page = parseInt(filters.page) || 1;
	const limit = Math.min(parseInt(filters.limit) || 20, 100);
	const skip = (page - 1) * limit;

	const ALLOWED_SORT_FIELDS = ["createdAt", "dueDate", "amount", "balance"];
	const sortBy = ALLOWED_SORT_FIELDS.includes(filters.sortBy)
		? filters.sortBy
		: "createdAt";
	const order = filters.order === "asc" ? "asc" : "desc";

	//  Query

	const [data, total] = await Promise.all([
		prisma.invoice.findMany({
			where,
			select: {
				id: true,
				invoiceNumber: true,
				amount: true,
				amountPaid: true,
				balance: true,
				status: true,
				dueDate: true,
				academicYear: true,
				term: true,
				createdAt: true,
				bill: {
					select: { name: true },
				},
				student: {
					select: {
						admissionNumber: true,
						firstName: true,
						lastName: true,
						enrollments: {
							where: { status: "ACTIVE" },
							select: {
								class: { select: { name: true } },
							},
							take: 1,
						},
					},
				},
				parent: {
					select: {
						primaryGuardian: true,
						secondaryGuardian: true,
						accountEmail: true,
						accountPhone: true,
					},
				},
			},
			orderBy: { [sortBy]: order },
			skip,
			take: limit,
		}),
		prisma.invoice.count({ where }),
	]);

	return {
		data,
		pagination: {
			page,
			limit,
			totalItems: total,
			totalPages: Math.ceil(total / limit),
			hasNextPage: page < Math.ceil(total / limit),
			hasPreviousPage: page > 1,
		},
	};
};
// STATS

const countTotalReceipts = () =>
	prisma.payment.count({
		where: { status: "COMPLETED", deletedAt: null },
	});

const countTransactionsThisMonth = () => {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

	return prisma.payment.count({
		where: {
			status: "COMPLETED",
			deletedAt: null,
			paymentDate: { gte: start, lte: end },
		},
	});
};

const getTotalOutstanding = () =>
	prisma.invoice.aggregate({
		where: {
			deletedAt: null,
			status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
		},
		_sum: { balance: true },
	});

const countStudentsOwing = () =>
	prisma.invoice
		.groupBy({
			by: ["studentId"],
			where: {
				deletedAt: null,
				status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
			},
		})
		.then((r) => r.length);

// INVOICE GENERATION

// Fetches all bills for a given term, optionally filtered by specific bill IDs
const findBillsForTerm = (academicYear, term, billIds = null) =>
	prisma.bill.findMany({
		where: {
			academicYear,
			term,
			...(billIds && billIds.length > 0 ? { id: { in: billIds } } : {}),
		},
		include: {
			classes: { include: { class: { select: { id: true, name: true } } } },
			students: { select: { studentId: true } },
		},
	});

// Fetch all active students with their current enrollment for matching
const findActiveStudentsWithEnrollment = (academicYear, term) =>
	prisma.student.findMany({
		where: {
			deletedAt: null,
			status: "ACTIVE",
			enrollments: {
				some: { academicYear, term, status: "ACTIVE" },
			},
		},
		include: {
			enrollments: {
				where: { academicYear, term, status: "ACTIVE" },
				include: { class: { select: { id: true, name: true } } },
				take: 1,
			},
			parent: { select: { id: true } },
		},
	});

// Check if an invoice already exists to prevent duplicates
const findExistingInvoice = (studentId, billId, academicYear, term) =>
	prisma.invoice.findFirst({
		where: { studentId, billId, academicYear, term, deletedAt: null },
	});

/**
 * Same check as findExistingInvoice but for every (bill, student) pair a
 * bulk invoice generation run covers, in one query — avoids an N+1 (one
 * query per bill x student combination).
 */
const findExistingInvoicesForBillsAndStudents = (
	billIds,
	studentIds,
	academicYear,
	term,
) =>
	prisma.invoice.findMany({
		where: {
			billId: { in: billIds },
			studentId: { in: studentIds },
			academicYear,
			term,
			deletedAt: null,
		},
		select: { studentId: true, billId: true },
	});

// Generate a sequential invoice number
const createInvoice = (data) => prisma.invoice.create({ data });

// Bulk-creates invoices in one round trip instead of one create() per invoice.
const createInvoices = (dataArray) => prisma.invoice.createMany({ data: dataArray });

// Counter for invoice number generation
const getNextInvoiceCounter = () =>
	prisma.counter.upsert({
		where: { id: "invoice" },
		create: { id: "invoice", value: 1 },
		update: { value: { increment: 1 } },
	});

// Atomically reserves a contiguous block of `n` invoice numbers in one
// increment, instead of incrementing once per invoice — the returned
// counter's value is the END of the reserved block (value - n + 1 is the start).
const incrementInvoiceCounterBy = (n) =>
	prisma.counter.upsert({
		where: { id: "invoice" },
		create: { id: "invoice", value: n },
		update: { value: { increment: n } },
	});

module.exports = {
	findFeeCollections,
	countTotalReceipts,
	countTransactionsThisMonth,
	getTotalOutstanding,
	countStudentsOwing,
	findBillsForTerm,
	findActiveStudentsWithEnrollment,
	findExistingInvoice,
	findExistingInvoicesForBillsAndStudents,
	createInvoice,
	createInvoices,
	getNextInvoiceCounter,
	incrementInvoiceCounterBy,
};
