const prisma = require("../../lib/prisma");
const ParentFeeRepository = require("../repositories/ParentFeeRepository");
const ParentRepository = require("../repositories/ParentRepository");
const { sanitizeInvoice, sanitizePayment } = require("../../utils/sanitizers");
const logger = require("../../utils/logger");
const paystack = require("../../utils/paystack");
const { sendFeePaymentConfirmationEmail } = require("../../utils/resend");
const { computeInvoiceStatus } = require("../../utils/invoiceStatus");

class ParentFeeService {
	//  Fee Overview
	// Returns totals, outstanding, and a full invoice breakdown in one call.
	async getFeeOverview(parentId, studentId) {
		logger.info(`Fetching fee overview — student: ${studentId}`);

		const student = await ParentRepository.assertStudentBelongsToParent(
			studentId,
			parentId,
		);

		const invoices = await ParentFeeRepository.findInvoicesByStudent(studentId);

		const totalFees = invoices.reduce((s, i) => s + i.amount, 0);
		const totalPaid = invoices.reduce((s, i) => s + i.amountPaid, 0);
		const totalBalance = invoices.reduce((s, i) => s + i.balance, 0);

		return {
			totalFees,
			totalPaid,
			totalOutstanding: totalBalance,
			breakdown: invoices.map(sanitizeInvoice),
		};
	}
	async getOutstandingInvoiceIds(parentId, studentId) {
		await ParentRepository.assertStudentBelongsToParent(studentId, parentId);

		const invoices =
			await ParentFeeRepository.findOutstandingInvoices(studentId);

		return {
			invoiceIds: invoices.map((i) => i.id),
			total: invoices.reduce((s, i) => s + i.balance, 0),
			count: invoices.length,
		};
	}
	//  Payment History
	async getPaymentHistory(parentId, studentId, filters = {}) {
		logger.info(`Fetching payment history — student: ${studentId}`);

		await ParentRepository.assertStudentBelongsToParent(studentId, parentId);

		const result = await ParentFeeRepository.findPaymentHistory(
			studentId,
			filters,
		);

		return {
			...result,
			data: result.data.map(sanitizePayment),
		};
	}

	//  Initialize Fee Payment (Paystack)
	// Parent selects one or more outstanding invoices to pay.
	// Returns Paystack authorization URL for frontend redirect.
	async initializeFeePayment(parentId, studentId, invoiceIds) {
		if (!invoiceIds?.length) {
			throw new Error("At least one invoiceId is required");
		}

		const student = await ParentRepository.assertStudentBelongsToParent(
			studentId,
			parentId,
		);

		logger.info(
			`Initializing fee payment — student: ${studentId}, invoices: ${invoiceIds.join(", ")}`,
		);

		const invoices = await ParentFeeRepository.findInvoicesByIds(
			invoiceIds,
			studentId,
		);

		if (invoices.length !== invoiceIds.length) {
			throw new Error("One or more invoices are invalid or already paid");
		}

		const totalAmount = invoices.reduce((s, i) => s + i.balance, 0);

		const response = await paystack.post("/transaction/initialize", {
			email: student.parent?.accountEmail ?? parentId,
			amount: Math.round(totalAmount * 100),
			currency: "NGN",
			metadata: {
				studentId,
				parentId,
				invoiceIds,
				type: "FEES",
			},
			callback_url: process.env.PAYSTACK_CALLBACK_URL,
		});

		const { authorization_url, reference } = response.data.data;

		logger.info(`Paystack initialized — reference: ${reference}`);

		return {
			authorizationUrl: authorization_url,
			reference,
			amount: totalAmount,
			invoices: invoices.map(sanitizeInvoice),
		};
	}

	// After payment is confirmed:
	//   1. Re-validates invoices from metadata before processing
	//   2. Applies payment to each invoice atomically
	//   3. Creates a Payment record per invoice
	//   4. Creates a single IncomeRecord for the full amount under FEES category
	//
	// Idempotency strategy:
	//   - Pre-check: findPaymentByReference catches sequential duplicate calls
	//   - Unique constraint handler: catches concurrent duplicate calls (P2002)
	//   - Both return a clean alreadyProcessed response instead of crashing
	async verifyFeePayment(reference, callerParentId = null) {
		if (!reference) throw new Error("Payment reference is required");

		logger.info(`Verifying payment — reference: ${reference}`);

		// Sequential duplicate guard
		const existing =
			await ParentFeeRepository.findPaymentByReference(reference);
		if (existing) {
			logger.warn(`Payment already processed: ${reference}`);
			return { alreadyProcessed: true, status: existing.status };
		}

		const response = await paystack.get(`/transaction/verify/${reference}`);
		const transaction = response.data.data;

		if (transaction.status !== "success") {
			throw new Error(`Payment not successful: ${transaction.status}`);
		}

		const { studentId, invoiceIds, parentId } = transaction.metadata;

		if (!parentId) {
			throw new Error("Payment transaction is missing parent metadata");
		}

		if (callerParentId && callerParentId !== parentId) {
			throw new Error("This payment does not belong to your account");
		}

		const student = await ParentRepository.assertStudentBelongsToParent(
			studentId,
			parentId,
		);

		// Re-validate invoices from metadata — confirms they still belong to
		// the student and are still outstanding before processing
		const validInvoices = await ParentFeeRepository.findInvoicesByIds(
			invoiceIds,
			studentId,
		);

		if (!validInvoices.length) {
			logger.warn(
				`No valid invoices found for reference: ${reference} — may already be paid`,
			);
			return { alreadyProcessed: true, status: "COMPLETED" };
		}

		const validInvoiceIds = validInvoices.map((i) => i.id);
		const amountPaid = transaction.amount / 100; // convert from kobo

		try {
			// All invoice updates, payment records, and income record are atomic.
			// If anything fails mid-way, the entire transaction rolls back cleanly.
			await prisma.$transaction(async (tx) => {
				for (const invoiceId of validInvoiceIds) {
					const invoice = await tx.invoice.findUnique({
						where: { id: invoiceId },
					});
					if (!invoice) continue;

					const share = invoice.balance;
					const { newAmountPaid, newBalance, newStatus } =
						computeInvoiceStatus(invoice, share);

					await tx.invoice.update({
						where: { id: invoiceId },
						data: {
							amountPaid: newAmountPaid,
							balance: newBalance,
							status: newStatus,
						},
					});

					await tx.payment.create({
						data: {
							invoiceId,
							studentId,
							parentId,
							amount: share,
							category: "FEES",
							paymentMethod: "paystack",
							paystackRef: reference,
							transactionId: String(transaction.id),
							status: "COMPLETED",
							paymentDate: new Date(transaction.paid_at),
						},
					});
				}

				await tx.incomeRecord.create({
					data: {
						category: "FEES",
						amount: amountPaid,
						description: `Fee payment via Paystack — ref: ${reference}, student: ${studentId}`,
						date: new Date(transaction.paid_at),
					},
				});
			});
		} catch (error) {
			// Concurrent duplicate guard — two requests passed the pre-check
			// simultaneously. The unique constraint on paystackRef blocks the second.
			if (
				error.code === "P2002" &&
				error.meta?.target?.includes("paystackRef")
			) {
				logger.warn(
					`Concurrent payment attempt blocked — reference: ${reference}`,
				);
				return { alreadyProcessed: true, status: "COMPLETED" };
			}
			throw error;
		}

		logger.info(
			`Payment verified, applied, and income recorded — reference: ${reference}`,
		);

		// Email delivery failure should never undo a successfully recorded payment.
		try {
			const parent = student.parent;
			// Extract parent name from JSON guardian fields
			const primaryGuardian = parent?.primaryGuardian ? JSON.parse(parent.primaryGuardian) : {};
			const secondaryGuardian = parent?.secondaryGuardian ? JSON.parse(parent.secondaryGuardian) : {};
			const parentName =
				[primaryGuardian.firstName, primaryGuardian.lastName].filter(Boolean).join(" ") ||
				[secondaryGuardian.firstName, secondaryGuardian.lastName].filter(Boolean).join(" ") ||
				"Parent";

			await sendFeePaymentConfirmationEmail({
				to: parent?.accountEmail,
				parentName,
				firstName: student.firstName,
				lastName: student.lastName,
				admissionNumber: student.admissionNumber,
				billName: validInvoices
					.map((i) => i.bill?.name)
					.filter(Boolean)
					.join(", "),
				amount: amountPaid,
				totalAmount: amountPaid,
				paymentDate: new Date(transaction.paid_at).toLocaleString(),
				transactionId: String(transaction.id),
				paymentMethod: "Paystack",
				term: validInvoices[0]?.term,
				academicYear: validInvoices[0]?.academicYear,
			});
		} catch (emailError) {
			logger.error(
				`Fee payment confirmation email failed for reference ${reference}: ${emailError.message}`,
			);
		}

		return {
			status: "success",
			reference,
			amount: amountPaid,
			studentId,
		};
	}
}

module.exports = new ParentFeeService();
