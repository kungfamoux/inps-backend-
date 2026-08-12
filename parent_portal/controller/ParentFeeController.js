const ParentFeeService = require("../services/parentFee.service");
const { sanitizeQueryParams, sanitizeBody } = require("../../utils/sanitizers");
const { parsePagination } = require("../../utils/pagination");

const getFeeOverview = async (req, res, next) => {
	try {
		const parentId = req.parent.id;
		const { studentId } = req.params;

		const data = await ParentFeeService.getFeeOverview(parentId, studentId);

		return res.status(200).json({
			success: true,
			message: "Fee overview retrieved successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};
const getOutstandingInvoiceIds = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const parentId = req.parent.id;
		const result = await ParentFeeService.getOutstandingInvoiceIds(
			parentId,
			studentId,
		);
		return res.status(200).json({
			success: true,
			message: "Outstanding invoices retrieved successfully",
			data: result,
		});
	} catch (error) {
		return next(error);
	}
};

const getPaymentHistory = async (req, res, next) => {
	try {
		const parentId = req.parent.id;
		const { studentId } = req.params;

		const query = sanitizeQueryParams(req.query);
		const pagination = parsePagination(query);

		// Allowed sort fields — reject anything outside this set
		const ALLOWED_SORT_FIELDS = ["paymentDate", "amount", "createdAt"];
		const sortBy = ALLOWED_SORT_FIELDS.includes(query.sortBy)
			? query.sortBy
			: "paymentDate";
		const order = query.order?.toLowerCase() === "asc" ? "asc" : "desc";

		// Date range filter
		const startDate = query.startDate ? new Date(query.startDate) : null;
		const endDate = query.endDate ? new Date(query.endDate) : null;

		if (startDate && isNaN(startDate.getTime())) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: [{ field: "startDate", message: "Invalid date format" }],
			});
		}
		if (endDate && isNaN(endDate.getTime())) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: [{ field: "endDate", message: "Invalid date format" }],
			});
		}

		const filters = {
			...pagination,
			sortBy,
			order,
			startDate,
			endDate,
			status: query.status || null,
			search: query.search || null,
		};

		const result = await ParentFeeService.getPaymentHistory(
			parentId,
			studentId,
			filters,
		);

		return res.status(200).json({
			success: true,
			message: "Payment history retrieved successfully",
			data: result.data,
			meta: result.meta,
		});
	} catch (error) {
		return next(error);
	}
};

const initializeFeePayment = async (req, res, next) => {
	try {
		const parentId = req.parent.id;
		const { studentId } = req.params;
		const body = sanitizeBody(req.body);

		const { invoiceIds } = body;

		if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: [
					{
						field: "invoiceIds",
						message: "At least one invoice ID is required",
					},
				],
			});
		}

		const data = await ParentFeeService.initializeFeePayment(
			parentId,
			studentId,
			invoiceIds,
		);

		return res.status(200).json({
			success: true,
			message: "Payment initialized successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

/**
 * POST /parent/fees/pay/verify        — authenticated (req.parent set)
 * POST /parent/fees/webhook/verify    — Paystack server-to-server (no req.parent)
 *
 * Verifies a Paystack payment after callback.
 * Applies payment to invoices and creates income record.
 *
 * Body: { reference: string }
 */
const verifyFeePayment = async (req, res, next) => {
	try {
		const callerParentId = req.parent?.id ?? null;
		const body = sanitizeBody(req.body);

		const { reference } = body;

		if (!reference || typeof reference !== "string") {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: [
					{
						field: "reference",
						message: "Payment reference is required",
					},
				],
			});
		}

		const data = await ParentFeeService.verifyFeePayment(
			reference.trim(),
			callerParentId,
		);

		if (data.alreadyProcessed) {
			return res.status(200).json({
				success: true,
				message: "Payment was already processed",
				data,
			});
		}

		return res.status(200).json({
			success: true,
			message: "Payment verified and applied successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	verifyFeePayment,
	initializeFeePayment,
	getFeeOverview,
	getPaymentHistory,
	getOutstandingInvoiceIds,
};
