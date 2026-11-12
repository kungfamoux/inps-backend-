const { z } = require("zod");

// Query parameter schemas for filtering

const financialAnalyticsQuerySchema = z.object({
	limit: z.coerce.number().min(1).max(100).optional().default(10),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

const staffOverviewQuerySchema = z.object({
	role: z.string().optional(),
	type: z.enum(["TEACHING", "NON_TEACHING"]).optional(),
	status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

const enrollmentQuerySchema = z.object({
	academicYear: z.string().optional(),
	term: z.string().optional(),
	classId: z.string().optional(),
});

module.exports = {
	financialAnalyticsQuerySchema,
	staffOverviewQuerySchema,
	enrollmentQuerySchema,
};
