const { z } = require("zod");

const getUnverifiedResultsQuerySchema = z.object({
	termId: z.string().trim().min(1).optional(),
	sessionId: z.string().trim().min(1).optional(),
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
});

// Shared by verify-all for student and for section
const verifyAllResultsSchema = z.object({
	termId: z.string().trim().min(1, "termId is required"),
	sessionId: z.string().trim().min(1, "sessionId is required"),
});

const bulkEntrySchema = z.object({
	classId: z.string().trim().min(1, "classId is required"),
	subjectId: z.string().trim().min(1, "subjectId is required"),
	termId: z.string().trim().min(1, "termId is required"),
	sessionId: z.string().trim().min(1, "sessionId is required"),
	staffId: z.string().trim().min(1).optional(),
	scores: z.array(
		z.object({
			studentId: z.string().trim().min(1, "studentId is required"),
			ca1Score: z.number().min(0).max(30).optional(),
			ca2Score: z.number().min(0).max(30).optional(),
			examScore: z.number().min(0).max(40).optional(),
		})
	).min(1, "At least one score entry is required"),
});

// Report card validation schemas
const reportCardQuerySchema = z.object({
	termId: z.string().trim().min(1, "termId is required"),
	sessionId: z.string().trim().min(1, "sessionId is required"),
});

const batchReportCardSchema = z.object({
	classId: z.string().trim().min(1, "classId is required"),
	termId: z.string().trim().min(1, "termId is required"),
	sessionId: z.string().trim().min(1, "sessionId is required"),
	format: z.enum(["zip", "individual"]).optional(),
});

module.exports = {
	getUnverifiedResultsQuerySchema,
	verifyAllResultsSchema,
	bulkEntrySchema,
	reportCardQuerySchema,
	batchReportCardSchema,
};
