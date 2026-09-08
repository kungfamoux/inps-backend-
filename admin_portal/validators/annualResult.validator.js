const { z } = require("zod");

// Schema for annual report card query parameters
const annualReportCardQuerySchema = z.object({
	sessionId: z.string().uuid("Invalid session ID"),
});

// Schema for batch annual report card generation
const batchAnnualReportCardSchema = z.object({
	classId: z.string().uuid("Invalid class ID"),
	sessionId: z.string().uuid("Invalid session ID"),
	format: z.enum(["zip", "individual"]).optional().default("zip"),
});

// Schema for annual statistics query parameters
const annualStatisticsQuerySchema = z.object({
	classId: z.string().uuid("Invalid class ID"),
	sessionId: z.string().uuid("Invalid session ID"),
});

// Schema for annual results by class query parameters
const annualResultsByClassQuerySchema = z.object({
	classId: z.string().uuid("Invalid class ID"),
	sessionId: z.string().uuid("Invalid session ID"),
});

module.exports = {
	annualReportCardQuerySchema,
	batchAnnualReportCardSchema,
	annualStatisticsQuerySchema,
	annualResultsByClassQuerySchema,
};
