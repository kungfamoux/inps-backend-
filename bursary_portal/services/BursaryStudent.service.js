const BursaryRepository = require("../repositories/BursaryRepository");
const FinanceRepository = require("../repositories/FinanceRepository");
const { sanitizeInvoiceRecord } = require("../../utils/sanitizers");

const logger = require("../../utils/logger");

class BursaryStudentService {
	//  Fee Collections

	async getFeeCollections(filters = {}) {
		logger.info(
			`Fetching fee collections — filters: ${JSON.stringify(filters)}`,
		);

		const result = await BursaryRepository.findFeeCollections(filters);

		return {
			...result,
			data: result.data.map(sanitizeInvoiceRecord),
		};
	}

	//  Stats Dashboard

	async getStats() {
		logger.info("Fetching bursary stats");

		const [
			totalReceipts,
			transactionsThisMonth,
			totalCollectedAgg,
			totalOutstandingAgg,
			studentsOwing,
		] = await Promise.all([
			BursaryRepository.countTotalReceipts(),
			BursaryRepository.countTransactionsThisMonth(),
			FinanceRepository.getTotalPayments(),
			BursaryRepository.getTotalOutstanding(),
			BursaryRepository.countStudentsOwing(),
		]);

		return {
			totalReceipts,
			transactionsThisMonth,
			totalCollected: totalCollectedAgg._sum.amount ?? 0,
			totalOutstanding: totalOutstandingAgg._sum.balance ?? 0,
			studentsOwing,
		};
	}

	//  Generate Invoices
	// Creates invoices for all eligible students from Bills for a given term.
	// Skips students who already have an invoice for a given bill (idempotent).
	async generateInvoices(academicYear, term, billIds = null) {
		if (!academicYear || !term) {
			throw new Error("academicYear and term are required");
		}

		logger.info(`Generating invoices for ${academicYear} ${term}${billIds ? ` for specific bills: ${billIds.join(", ")}` : ""}`);

		const [bills, students] = await Promise.all([
			BursaryRepository.findBillsForTerm(academicYear, term, billIds),
			BursaryRepository.findActiveStudentsWithEnrollment(academicYear, term),
		]);

		if (!bills.length) {
			throw new Error(`No bills found for ${academicYear} ${term}`);
		}

		// Build the full list of (bill, student) pairs this run covers.
		const pairs = [];
		for (const bill of bills) {
			let eligibleStudents = [];

			if (bill.scope === "ALL_STUDENTS") {
				// Apply intake type filter if set
				eligibleStudents = bill.intakeType
					? students.filter((s) => s.intakeType === bill.intakeType)
					: students;
			} else if (bill.scope === "BY_CLASS") {
				const billClassIds = bill.classes.map((bc) => bc.class.id);
				eligibleStudents = students.filter(
					(s) =>
						s.enrollments?.[0]?.class?.id &&
						billClassIds.includes(s.enrollments[0].class.id),
				);
			} else if (bill.scope === "BY_STUDENT") {
				const billStudentIds = bill.students.map((bs) => bs.studentId);
				eligibleStudents = students.filter((s) =>
					billStudentIds.includes(s.id),
				);
			}

			for (const student of eligibleStudents) {
				pairs.push({ bill, student });
			}
		}

		// One query for every existing invoice instead of one per (bill, student) pair.
		const existing = await BursaryRepository.findExistingInvoicesForBillsAndStudents(
			bills.map((b) => b.id),
			students.map((s) => s.id),
			academicYear,
			term,
		);
		const existingKeys = new Set(
			existing.map((i) => `${i.studentId}:${i.billId}`),
		);

		const toCreate = pairs.filter(
			({ bill, student }) => !existingKeys.has(`${student.id}:${bill.id}`),
		);
		const skipped = pairs.length - toCreate.length;

		if (!toCreate.length) {
			logger.info(`Invoice generation complete — created: 0, skipped: ${skipped}`);
			return {
				academicYear,
				term,
				billsProcessed: bills.length,
				created: 0,
				skipped,
			};
		}

		// Reserve a contiguous block of invoice numbers in one atomic
		// increment instead of one increment round trip per invoice.
		const counter = await BursaryRepository.incrementInvoiceCounterBy(
			toCreate.length,
		);
		const startValue = counter.value - toCreate.length + 1;

		const dueDate = new Date();
		dueDate.setDate(dueDate.getDate() + 30); // 30 days to pay

		const invoiceData = toCreate.map(({ bill, student }, index) => ({
			invoiceNumber: `INV-${academicYear.replace("/", "-")}-${String(startValue + index).padStart(4, "0")}`,
			studentId: student.id,
			parentId: student.parent?.id ?? null,
			billId: bill.id,
			amount: bill.amount,
			amountPaid: 0,
			balance: bill.amount,
			dueDate,
			status: "PENDING",
			description: bill.name,
			academicYear,
			term,
		}));

		await BursaryRepository.createInvoices(invoiceData);
		const created = invoiceData.length;

		logger.info(
			`Invoice generation complete — created: ${created}, skipped: ${skipped}`,
		);

		return {
			academicYear,
			term,
			billsProcessed: bills.length,
			created,
			skipped,
		};
	}
}

module.exports = new BursaryStudentService();
