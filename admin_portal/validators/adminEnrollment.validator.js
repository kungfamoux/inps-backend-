const { z } = require("zod");
const { TERM_VALUES, ENROLLMENT_STATUS_VALUES } = require("../../utils/enums");

const enrollStudentSchema = z.object({
	studentId: z.string().trim().min(1, "studentId is required"),
	classId: z.string().trim().min(1, "classId is required"),
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
});

// GET /class/:classId and /section/:sectionId share the same shape:
// academicYear and term are required query params, status optional.
const enrollmentListQuerySchema = z.object({
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES, {
		errorMap: () => ({ message: "term is required" }),
	}),
	status: z.enum(ENROLLMENT_STATUS_VALUES).optional(),
});

const transferStudentSchema = z.object({
	newClassId: z.string().trim().min(1, "newClassId is required"),
});

const bulkTransferSchema = z.object({
	transfers: z.array(z.object({
		enrollmentId: z.string().trim().min(1, "enrollmentId is required"),
		newClassId: z.string().trim().min(1, "newClassId is required"),
	})).min(1, "At least one transfer is required"),
});

const assignFromPoolSchema = z.object({
	classId: z.string().trim().min(1, "classId is required"),
});

module.exports = {
	enrollStudentSchema,
	enrollmentListQuerySchema,
	transferStudentSchema,
	bulkTransferSchema,
	assignFromPoolSchema,
};
