const { z } = require("zod");
const { ANNOUNCEMENT_CATEGORY_VALUES } = require("../../utils/enums");

const parentLoginSchema = z.object({
	email: z.string().trim().email(),
	password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// filter is validated against the service's RESULT_FILTERS set
const RESULT_FILTER_VALUES = ["detail", "summary"];

const childResultsQuerySchema = z.object({
	termId: z.string().trim().min(1, "termId is required"),
	sessionId: z.string().trim().min(1, "sessionId is required"),
	filter: z.enum(RESULT_FILTER_VALUES).optional(),
});

// Dates are kept as plain date-parseable strings — the repository does
// `new Date(filters.startDate)` itself, so no coercion needed here.
const childAttendanceQuerySchema = z.object({
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
});

const announcementsQuerySchema = z.object({
	category: z.enum(ANNOUNCEMENT_CATEGORY_VALUES).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).optional(),
});

const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).optional(),
});

module.exports = {
	parentLoginSchema,
	changePasswordSchema,
	childResultsQuerySchema,
	childAttendanceQuerySchema,
	announcementsQuerySchema,
	paginationQuerySchema,
};
