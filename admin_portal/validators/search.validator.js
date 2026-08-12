const { z } = require("zod");

const SEARCH_TYPES = ["staff", "students", "subjects", "classes"];

// types comes in as a comma-separated string, e.g. "staff,students".
// The controller splits/trims/lowercases it before calling the service,
// so we only ensure it's a string here — the actual per-token whitelist
// check happens downstream against SEARCH_TYPES-equivalent business logic.
const searchQuerySchema = z.object({
	q: z.string().trim().min(2, "Search query must be at least 2 characters").optional(),
	types: z
		.string()
		.trim()
		.min(1)
		.optional()
		.refine(
			(val) =>
				!val ||
				val
					.split(",")
					.map((t) => t.trim().toLowerCase())
					.every((t) => SEARCH_TYPES.includes(t)),
			{
				message: `types must be a comma-separated list of: ${SEARCH_TYPES.join(", ")}`,
			},
		),
});

// More flexible schema for entity-specific search endpoints
const entitySearchSchema = z.object({
	q: z.string().trim().min(2, "Search query must be at least 2 characters"),
	page: z.string().optional(),
	limit: z.string().optional(),
	status: z.string().optional(),
	classId: z.string().optional(),
	role: z.string().optional(),
	level: z.string().optional(),
	academicYear: z.string().optional(),
	term: z.string().optional(),
});

module.exports = {
	searchQuerySchema,
	entitySearchSchema,
};
