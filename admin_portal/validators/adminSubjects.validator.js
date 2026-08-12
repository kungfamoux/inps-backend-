const { z } = require("zod");
const { SCHOOL_LEVEL_VALUES } = require("../../utils/enums");

const createSubjectSchema = z.object({
	subjectName: z.string().trim().min(1, "subjectName is required"),
	subjectCode: z.string().trim().min(1, "subjectCode is required"),
	levels: z.array(z.enum(SCHOOL_LEVEL_VALUES)).min(1, "levels must have at least one entry"),
});

const getAllSubjectsQuerySchema = z.object({
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
});

const getSubjectsByClassQuerySchema = z.object({
	termId: z.string().trim().min(1, "termId is required"),
});

const updateSubjectSchema = z.object({
	subjectName: z.string().trim().min(1).optional(),
	subjectCode: z.string().trim().min(1).optional(),
	levels: z.array(z.enum(SCHOOL_LEVEL_VALUES)).optional(),
});

const addSubjectLevelSchema = z.object({
	level: z.enum(SCHOOL_LEVEL_VALUES),
});

// Shared by assignSubjectToClass (POST) and removeSubjectFromClass (DELETE)
const termIdBodySchema = z.object({
	termId: z.string().trim().min(1, "termId is required"),
});

const bulkAssignSubjectsSchema = z.object({
	termId: z.string().trim().min(1, "termId is required"),
	subjectIds: z
		.array(z.string().trim().min(1))
		.min(1, "subjectIds must not be empty"),
});

module.exports = {
	createSubjectSchema,
	getAllSubjectsQuerySchema,
	getSubjectsByClassQuerySchema,
	updateSubjectSchema,
	addSubjectLevelSchema,
	termIdBodySchema,
	bulkAssignSubjectsSchema,
};
