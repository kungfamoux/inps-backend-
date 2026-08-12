const { z } = require("zod");
const { PAYMENT_STATUS_VALUES } = require("../../utils/enums");

// Paystack transaction reference — used by both the frontend verify
// endpoint and the server-to-server webhook (validated after signature check).
const verifyPaymentSchema = z.object({
	reference: z.string().trim().min(1, "Payment reference is required"),
});

const initializeFeePaymentSchema = z.object({
	invoiceIds: z
		.array(z.string().trim().min(1, "Invoice ID cannot be empty"))
		.min(1, "At least one invoice ID is required"),
});

// PENDING/FAILED are included even though most parent-facing payments will
// be COMPLETED, since the Swagger doc allows filtering by any of these.
const SORT_BY_VALUES = ["paymentDate", "amount", "createdAt"];
const ORDER_VALUES = ["asc", "desc"];

// Dates are kept as plain strings (not coerced to Date objects) because the
// controller runs sanitizeQueryParams() over req.query after validation, and
// that helper only understands strings/numbers/booleans — a Date instance
// would be flattened away. The controller itself does `new Date(...)` on
// these strings, so a date-parseable string check here is sufficient.
const paymentHistoryQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	sortBy: z.enum(SORT_BY_VALUES).optional(),
	order: z.enum(ORDER_VALUES).optional(),
	status: z.enum(PAYMENT_STATUS_VALUES).optional(),
	startDate: z
		.string()
		.trim()
		.refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
		.optional(),
	endDate: z
		.string()
		.trim()
		.refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
		.optional(),
	search: z.string().trim().optional(),
});

module.exports = {
	verifyPaymentSchema,
	initializeFeePaymentSchema,
	paymentHistoryQuerySchema,
};
