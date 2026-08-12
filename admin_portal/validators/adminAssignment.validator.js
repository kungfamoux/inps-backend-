const { z } = require("zod");
const {
	TERM_VALUES,
	SUBJECT_ASSIGNMENT_STATUS_VALUES: STATUS_VALUES,
} = require("../../utils/enums");

const assignSubjectToTeacherSchema = z.object({
	classId: z.string().trim().min(1, "classId is required"),
	subjectId: z.string().trim().min(1, "subjectId is required"),
	teacherId: z.string().trim().min(1, "teacherId is required"),
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
	termId: z.string().trim().min(1, "termId is required"),
});

const bulkAssignSubjectToTeacherSchema = z.object({
	classIds: z.array(z.string().trim().min(1, "classId is required")).min(1, "At least one class must be selected"),
	subjectId: z.string().trim().min(1, "subjectId is required"),
	teacherId: z.string().trim().min(1, "teacherId is required"),
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
	termId: z.string().trim().min(1, "termId is required"),
});

// GET /api/admin/assignments — all filters optional
const getAllSubjectAssignmentsQuerySchema = z.object({
	classId: z.string().trim().min(1).optional(),
	subjectId: z.string().trim().min(1).optional(),
	academicYear: z.string().trim().min(1).optional(),
	term: z.enum(TERM_VALUES).optional(),
	status: z.enum(STATUS_VALUES).optional(),
});

// GET /api/admin/assignments/class/:classId — academicYear + term required
const getAssignmentsByClassQuerySchema = z.object({
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES, {
		errorMap: () => ({ message: "term is required" }),
	}),
});

module.exports = {
	assignSubjectToTeacherSchema,
	bulkAssignSubjectToTeacherSchema,
	getAllSubjectAssignmentsQuerySchema,
	getAssignmentsByClassQuerySchema,
};
