const { z } = require("zod");
const { TERM_VALUES, INVOICE_STATUS_VALUES } = require("../../utils/enums");

// POST /api/finance/invoices/generate
const generateInvoicesSchema = z.object({
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES, {
		errorMap: () => ({ message: `term must be one of: ${TERM_VALUES.join(", ")}` }),
	}),
});

// GET /api/finance/collections
// status accepts one or more comma-separated values (e.g.
// "PENDING,PARTIAL,OVERDUE" — this is how the former dedicated debtors
// endpoint's view is reproduced here) and is normalized to an array.
const getFeeCollectionsQuerySchema = z.object({
	status: z
		.string()
		.trim()
		.transform((value) =>
			value
				.split(",")
				.map((s) => s.trim().toUpperCase())
				.filter(Boolean),
		)
		.refine(
			(values) => values.every((v) => INVOICE_STATUS_VALUES.includes(v)),
			{
				message: `status must be one or more of: ${INVOICE_STATUS_VALUES.join(", ")}`,
			},
		)
		.optional(),
	search: z.string().trim().optional(),
	academicYear: z.string().trim().optional(),
	term: z.enum(TERM_VALUES, {
		errorMap: () => ({ message: `term must be one of: ${TERM_VALUES.join(", ")}` }),
	}).optional(),
	startDate: z
		.string()
		.trim()
		.refine((v) => !Number.isNaN(Date.parse(v)), "startDate must be a valid date")
		.optional(),
	endDate: z
		.string()
		.trim()
		.refine((v) => !Number.isNaN(Date.parse(v)), "endDate must be a valid date")
		.optional(),
	sortBy: z.string().trim().optional(),
	order: z.string().trim().optional(),
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
});

module.exports = {
	generateInvoicesSchema,
	getFeeCollectionsQuerySchema,
};
