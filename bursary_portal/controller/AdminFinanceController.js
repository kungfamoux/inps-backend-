const AdminFinanceService = require("../services/AdminFinance.service");
const { generateSignedUrl } = require("../../utils/uploadToCloudinary");
const { sanitizeBody } = require("../../utils/sanitizers");

// Bills / Fee Structure

const createBill = async (req, res, next) => {
	try {
		const data = await AdminFinanceService.createBill(req.body);
		return res.status(201).json({
			success: true,
			message: "Bill created successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getAllBills = async (req, res, next) => {
	try {
		const { academicYear, term, scope, page, limit } = req.query;
		const result = await AdminFinanceService.getAllBills({
			academicYear,
			term,
			scope,
			page,
			limit,
		});
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const getBillById = async (req, res, next) => {
	try {
		const data = await AdminFinanceService.getBillById(req.params.billId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const updateBill = async (req, res, next) => {
	try {
		const data = await AdminFinanceService.updateBill(
			req.params.billId,
			req.body,
		);
		return res.status(200).json({
			success: true,
			message: "Bill updated successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const deleteBill = async (req, res, next) => {
	try {
		await AdminFinanceService.deleteBill(req.params.billId);
		return res.status(200).json({
			success: true,
			message: "Bill deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
};

const getFeeStructureByClass = async (req, res, next) => {
	try {
		const { classId } = req.params;
		const { academicYear, term } = req.query;

		if (!academicYear || !term) {
			return res.status(400).json({
				success: false,
				message: "academicYear and term are required query params",
			});
		}

		const data = await AdminFinanceService.getFeeStructureByClass(
			classId,
			academicYear,
			term,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

// Book Prices

const createBookPrice = async (req, res, next) => {
	try {
		const data = await AdminFinanceService.createBookPrice(req.body);
		return res.status(201).json({
			success: true,
			message: "Book price created successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getAllBookPrices = async (req, res, next) => {
	try {
		const { level, page, limit } = req.query;
		const result = await AdminFinanceService.getAllBookPrices({
			level,
			page,
			limit,
		});
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const updateBookPrice = async (req, res, next) => {
	try {
		const data = await AdminFinanceService.updateBookPrice(
			req.params.bookId,
			req.body,
		);
		return res.status(200).json({
			success: true,
			message: "Book price updated successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const deleteBookPrice = async (req, res, next) => {
	try {
		await AdminFinanceService.deleteBookPrice(req.params.bookId);
		return res.status(200).json({
			success: true,
			message: "Book price deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
};

// Expenses

const addExpense = async (req, res, next) => {
	try {
		const data = await AdminFinanceService.addExpense(req.body);
		return res.status(201).json({
			success: true,
			message: "Expense added successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getAllExpenses = async (req, res, next) => {
	try {
		const { category, page, limit } = req.query;
		const result = await AdminFinanceService.getAllExpenses({
			category,
			page,
			limit,
		});
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

// Income Records

const addIncomeRecord = async (req, res, next) => {
	try {
		const data = await AdminFinanceService.addIncomeRecord(req.body);
		return res.status(201).json({
			success: true,
			message: "Income record added successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getAllIncomeRecords = async (req, res, next) => {
	try {
		const { category, page, limit } = req.query;
		const result = await AdminFinanceService.getAllIncomeRecords({
			category,
			page,
			limit,
		});
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

// Financial Summary

const getFinancialSummary = async (req, res, next) => {
	try {
		const data = await AdminFinanceService.getFinancialSummary();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

//Payments

const getRecentPayments = async (req, res, next) => {
	try {
		const { status, page, limit } = req.query;
		const result = await AdminFinanceService.getRecentPayments({
			status,
			page,
			limit,
		});
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

// Manual Payment Recording

const recordManualPayment = async (req, res, next) => {
	try {
		const body = sanitizeBody(req.body);
		const staffId = req.staff?.id;

		const data = {
			...body,
			recordedBy: staffId,
		};

		const result = await AdminFinanceService.recordManualPayment(data);

		return res.status(201).json({
			success: true,
			message: "Manual payment recorded successfully",
			data: result,
		});
	} catch (error) {
		return next(error);
	}
};

const uploadPaymentProof = async (req, res, next) => {
	try {
		const proofFile = req.files?.proofOfPayment?.[0];
		if (!proofFile) {
			return res.status(400).json({
				success: false,
				message: "Proof of payment image is required",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Proof uploaded successfully",
			data: { publicId: proofFile.path },
		});
	} catch (error) {
		return next(error);
	}
};

const getPaymentProof = async (req, res, next) => {
	try {
		const { paymentId } = req.params;

		const payment = await AdminFinanceService.getPaymentById(paymentId);
		if (!payment?.proofOfPaymentId) {
			return res.status(404).json({
				success: false,
				message: "No proof of payment found",
			});
		}

		const signedUrl = generateSignedUrl(payment.proofOfPaymentId, {
			expiresInSeconds: 3600,
		});

		return res.status(200).json({
			success: true,
			data: {
				signedUrl,
				expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
			},
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	createBill,
	getAllBills,
	getBillById,
	updateBill,
	deleteBill,
	getFeeStructureByClass,
	createBookPrice,
	getAllBookPrices,
	updateBookPrice,
	deleteBookPrice,
	addExpense,
	getAllExpenses,
	addIncomeRecord,
	getAllIncomeRecords,
	getFinancialSummary,
	getRecentPayments,
	recordManualPayment,
	uploadPaymentProof,
	getPaymentProof,
};
