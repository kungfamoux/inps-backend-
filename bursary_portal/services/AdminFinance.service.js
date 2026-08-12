const AcademicRepository = require("../../shared/repositories/AcademicRepository");
const FinanceRepository = require("../repositories/FinanceRepository");
const logger = require("../../utils/logger");

class AdminFinanceService {
	// BILL / FEE STRUCTURE
	// Each bill represents one fee line item e.g. Tuition Fee,
	// Development Fee, Sports Fee, Library Fee.
	// A class's total fee is the sum of all bills for that class/term.

	async createBill(data) {
		try {
			const {
				name,
				amount,
				academicYear,
				term,
				isCompulsory,
				scope,
				intakeType,
				classIds,
			} = data;

			// Proper validation
			if (
				!name?.trim() ||
				amount == null ||
				!academicYear?.trim() ||
				!term?.trim() ||
				!scope
			) {
				throw new Error("Fill all required fields");
			}

			logger.info(`Creating bill: "${name}" — ${academicYear} ${term}`);
			const academicTerm =
				await AcademicRepository.findTermBySessionNameAndTerm(
					academicYear,
					term,
				);

			if (!academicTerm) {
				throw new Error(
					`Term "${term}" does not exist in session "${academicYear}". Create the academic term first.`,
				);
			}

			// Check if bill already exists
			const existingBill = await FinanceRepository.findBillByUniqueFields({
				name,
				academicYear,
				term,
			});

			if (existingBill) {
				throw new Error(
					`Bill "${name}" already exists for ${academicYear} ${term}`,
				);
			}

			const bill = await FinanceRepository.createBill({
				name: name.trim(),
				amount: Number(amount),
				academicYear: academicYear.trim(),
				term: term.trim(),
				isCompulsory: isCompulsory ?? true,
				scope,
				intakeType: intakeType ?? null,

				// Link classes only for BY_CLASS
				classes:
					scope === "BY_CLASS" && Array.isArray(classIds) && classIds.length
						? {
								create: classIds.map((classId) => ({
									classId,
								})),
							}
						: undefined,
			});

			logger.info(`Bill created — id: ${bill.id}`);

			return bill;
		} catch (error) {
			logger.error("Create bill failed:", error.message);
			throw error;
		}
	}

	async getAllBills(filters = {}) {
		logger.info(`Fetching bills — filters: ${JSON.stringify(filters)}`);
		return FinanceRepository.findAllBills(filters);
	}

	async getBillById(id) {
		logger.info(`Fetching bill: ${id}`);
		const bill = await FinanceRepository.findBillById(id);
		if (!bill) throw new Error("Bill not found");
		return bill;
	}

	async updateBill(id, data) {
		logger.info(`Updating bill: ${id}`);
		const bill = await FinanceRepository.findBillById(id);
		if (!bill) throw new Error("Bill not found");

		const updated = await FinanceRepository.updateBill(id, {
			name: data.name ?? undefined,
			amount: data.amount ?? undefined,
			isCompulsory: data.isCompulsory ?? undefined,
		});

		logger.info(`Bill updated: ${id}`);
		return updated;
	}

	async deleteBill(id) {
		logger.info(`Deleting bill: ${id}`);
		const bill = await FinanceRepository.findBillById(id);
		if (!bill) throw new Error("Bill not found");

		const invoiceCount = await FinanceRepository.countBillInvoices(id);
		if (invoiceCount > 0) {
			throw new Error(
				`Cannot delete a bill with ${invoiceCount} existing invoice(s). Remove these first.`,
			);
		}

		await FinanceRepository.deleteBill(id);
		logger.info(`Bill deleted: ${id}`);
	}

	// Returns all bills for a class grouped into a fee summary
	// Tuition + Development + Sports + Library = Total
	async getFeeStructureByClass(classId, academicYear, term) {
		logger.info(
			`Fetching fee structure for class: ${classId} — ${academicYear} ${term}`,
		);

		const bills = await FinanceRepository.findBillsByClass(
			classId,
			academicYear,
			term,
		);

		const total = bills.reduce((sum, b) => sum + b.amount, 0);

		logger.info(`Found ${bills.length} fee line(s) for class, total: ${total}`);

		return { bills, total };
	}

	// BOOK PRICES

	async createBookPrice(data) {
		const { level, bookName, price } = data;

		if (!level || !bookName || !price) {
			throw new Error("Fill all required fields");
		}

		logger.info(`Creating book price: "${bookName}" — ${level}`);
		const book = await FinanceRepository.createBookPrice({
			level,
			bookName,
			price,
		});
		logger.info(`Book price created — id: ${book.id}`);
		return book;
	}

	async getAllBookPrices(filters = {}) {
		logger.info(`Fetching book prices — filters: ${JSON.stringify(filters)}`);
		return FinanceRepository.findAllBookPrices(filters);
	}

	async updateBookPrice(id, data) {
		logger.info(`Updating book price: ${id}`);
		const book = await FinanceRepository.findBookPriceById(id);
		if (!book) throw new Error("Book price not found");

		const updated = await FinanceRepository.updateBookPrice(id, data);
		logger.info(`Book price updated: ${id}`);
		return updated;
	}

	async deleteBookPrice(id) {
		logger.info(`Deleting book price: ${id}`);
		const book = await FinanceRepository.findBookPriceById(id);
		if (!book) throw new Error("Book price not found");
		await FinanceRepository.deleteBookPrice(id);
		logger.info(`Book price deleted: ${id}`);
	}

	// EXPENSES

	async addExpense(data) {
		const { date, description, category, amount } = data;

		if (!date || !description || !category || !amount) {
			throw new Error("Fill all required fields");
		}

		logger.info(`Adding expense: "${description}" — ${category} — ${amount}`);

		const expense = await FinanceRepository.createExpense({
			date: new Date(date),
			description,
			category,
			amount,
		});

		logger.info(`Expense added — id: ${expense.id}`);
		return expense;
	}

	async getAllExpenses(filters = {}) {
		logger.info(`Fetching expenses — filters: ${JSON.stringify(filters)}`);
		return FinanceRepository.findAllExpenses(filters);
	}

	// INCOME RECORDS

	async addIncomeRecord(data) {
		const { date, description, category, amount } = data;

		if (!date || !description || !category || !amount) {
			throw new Error("Fill all required fields");
		}

		logger.info(
			`Adding income record: "${description}" — ${category} — ${amount}`,
		);

		const record = await FinanceRepository.createIncomeRecord({
			date: new Date(date),
			description,
			category,
			amount,
		});

		logger.info(`Income record added — id: ${record.id}`);
		return record;
	}

	async getAllIncomeRecords(filters = {}) {
		logger.info(
			`Fetching income records — filters: ${JSON.stringify(filters)}`,
		);
		return FinanceRepository.findAllIncomeRecords(filters);
	}

	// FINANCIAL SUMMARY
	// Total income, total expenses, net balance

	async getFinancialSummary() {
		logger.info("Fetching financial summary");

		const [incomeAgg, expenseAgg, paymentsAgg] = await Promise.all([
			FinanceRepository.getTotalIncome(),
			FinanceRepository.getTotalExpenses(),
			FinanceRepository.getTotalPayments(),
		]);

		const totalIncome =
			(incomeAgg._sum.amount ?? 0) + (paymentsAgg._sum.amount ?? 0);
		const totalExpenses = expenseAgg._sum.amount ?? 0;
		const netBalance = totalIncome - totalExpenses;

		logger.info(
			`Summary — income: ${totalIncome}, expenses: ${totalExpenses}, net: ${netBalance}`,
		);

		return {
			totalIncome,
			totalExpenses,
			netBalance,
			totalFeePayments: paymentsAgg._sum.amount ?? 0,
			totalOtherIncome: incomeAgg._sum.amount ?? 0,
		};
	}

	// PAYMENTS (from Paystack and manual)

	async getRecentPayments(filters = {}) {
		logger.info(`Fetching payments — filters: ${JSON.stringify(filters)}`);
		return FinanceRepository.findRecentPayments(filters);
	}

	// INVOICES

	async getAllInvoices(filters = {}) {
		logger.info(`Fetching invoices — filters: ${JSON.stringify(filters)}`);
		return FinanceRepository.findAllInvoices(filters);
	}
}

module.exports = new AdminFinanceService();
