const prisma = require("../../lib/prisma");
const { computeInvoiceStatus } = require("../../utils/invoiceStatus");

//  Fee Summary

// All invoices for a student with bill details
const findInvoicesByStudent = (studentId) =>
	prisma.invoice.findMany({
		where: { studentId, deletedAt: null },
		include: { bill: { select: { name: true, scope: true } } },
		orderBy: { dueDate: "asc" },
	});

// Outstanding invoices only (PENDING, PARTIAL, OVERDUE)
const findOutstandingInvoices = (studentId) =>
	prisma.invoice.findMany({
		where: {
			studentId,
			deletedAt: null,
			status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
		},
		include: { bill: { select: { name: true } } },
		orderBy: { dueDate: "asc" },
	});

//  Payment History

const findPaymentHistory = async (studentId, filters = {}) => {
	const where = { studentId, status: "COMPLETED", deletedAt: null };
	const page = parseInt(filters.page) || 1;
	const limit = parseInt(filters.limit) || 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.payment.findMany({
			where,
			include: {
				student: {
					select: {
						firstName: true,
						lastName: true,
						admissionNumber: true,
						enrollments: {
							where: { status: "ACTIVE" },
							include: { class: { select: { name: true } } },
							take: 1,
						},
					},
				},
				invoice: {
					select: {
						invoiceNumber: true,
						academicYear: true,
						term: true,
						bill: { select: { name: true } },
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
//  Paystack

const createPayment = (data) => prisma.payment.create({ data });

const findPaymentByReference = (paystackRef) =>
	prisma.payment.findUnique({ where: { paystackRef } });

const updatePayment = (id, data) =>
	prisma.payment.update({ where: { id }, data });

// Update invoice balance after a successful payment
const applyPaymentToInvoice = async (invoiceId, amountPaid) => {
	const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
	if (!invoice) throw new Error("Invoice not found");

	const { newAmountPaid, newBalance, newStatus } = computeInvoiceStatus(
		invoice,
		amountPaid,
	);

	return prisma.invoice.update({
		where: { id: invoiceId },
		data: {
			amountPaid: newAmountPaid,
			balance: newBalance,
			status: newStatus,
		},
	});
};

const findInvoicesByIds = (invoiceIds, studentId) =>
	prisma.invoice.findMany({
		where: {
			id: { in: invoiceIds },
			studentId,
			deletedAt: null,
			status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
		},
		include: { bill: { select: { name: true } } },
	});

const createIncomeRecord = (data) => prisma.incomeRecord.create({ data });
module.exports = {
	findInvoicesByStudent,
	findOutstandingInvoices,
	findPaymentHistory,
	createPayment,
	findPaymentByReference,
	updatePayment,
	applyPaymentToInvoice,
	computeInvoiceStatus,
	findInvoicesByIds,
	createIncomeRecord,
};
