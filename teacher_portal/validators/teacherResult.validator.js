const { z } = require("zod");
const { TERM_VALUES, NURSERY_RATING_VALUES } = require("../../utils/enums");

const id = z.string().trim().min(1, "Required");
const optionalRemark = z.string().trim().min(1).optional();

// Score bounds from the Result model comments:
// ca1Score max 30, ca2Score max 30, examScore max 40 (total/grade are server-computed)
const ca1Score = z.coerce.number().min(0).max(30, "CA1 score must be between 0 and 30");
const ca2Score = z.coerce.number().min(0).max(30, "CA2 score must be between 0 and 30");
const examScore = z.coerce
	.number()
	.min(0)
	.max(40, "Exam score must be between 0 and 40");

// GET /api/teacher/results/subjects
const assignedSubjectsQuerySchema = z.object({
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
});

// GET /api/teacher/results/section/:sectionId/subject/:subjectId/students
const studentsWithResultsQuerySchema = z.object({
	termId: id,
	sessionId: id,
});

// POST /api/teacher/results
const uploadResultSchema = z.object({
	studentId: id,
	sectionId: id,
	subjectId: id,
	termId: id,
	sessionId: id,
	ca1Score,
	ca2Score,
	examScore,
	subjectTeacherRemark: optionalRemark,
});

// POST /api/teacher/results/bulk
const bulkResultRecordSchema = z.object({
	studentId: id,
	ca1Score,
	ca2Score,
	examScore,
	subjectTeacherRemark: optionalRemark,
});

const bulkUploadResultsSchema = z.object({
	sectionId: id,
	subjectId: id,
	termId: id,
	sessionId: id,
	records: z.array(bulkResultRecordSchema).min(1, "records must not be empty"),
});

// GET /api/teacher/results/section/:sectionId/students
const sectionStudentsQuerySchema = z.object({
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
	search: z.string().trim().min(1).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).optional(),
});

// GET /api/teacher/results/section/:sectionId/student/:studentId/subjects
const studentSubjectsQuerySchema = z.object({
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
	termId: id,
	sessionId: id,
});

// POST /api/teacher/results/student/:studentId/bulk
const studentSubjectResultSchema = z.object({
	subjectId: id,
	ca1Score,
	ca2Score,
	examScore,
	subjectTeacherRemark: optionalRemark,
});

const uploadResultsForStudentSchema = z.object({
	sectionId: id,
	termId: id,
	sessionId: id,
	results: z
		.array(studentSubjectResultSchema)
		.min(1, "results must not be empty"),
});

// POST /api/teacher/results/recalculate
const recalculateResultsSchema = z.object({
	sectionId: id,
	subjectId: id,
	termId: id,
	sessionId: id,
});

// GET /api/teacher/results/student/:studentId
const studentResultSheetQuerySchema = z.object({
	termId: id,
	sessionId: id,
});

// GET /api/teacher/results/behavioral-ratings/student/:studentId
// GET /api/teacher/results/nursery/assessments/student/:studentId
const academicYearTermQuerySchema = z.object({
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
});

// POST /api/teacher/results/behavioral-ratings
const behavioralRatingSchema = z.object({
	traitId: id,
	score: z.coerce
		.number()
		.int()
		.min(1, "score must be between 1 and 5")
		.max(5, "score must be between 1 and 5"),
});

const submitBehavioralRatingsSchema = z.object({
	studentId: id,
	sectionId: id,
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
	ratings: z.array(behavioralRatingSchema).min(1, "ratings must not be empty"),
});

// POST /api/teacher/results/nursery/assessments
const nurseryAssessmentSchema = z.object({
	itemId: id,
	rating: z.enum(NURSERY_RATING_VALUES),
});

const submitNurseryAssessmentsSchema = z.object({
	studentId: id,
	sectionId: id,
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
	assessments: z
		.array(nurseryAssessmentSchema)
		.min(1, "assessments must not be empty"),
});

// PATCH /api/teacher/results/student/:studentId/class-remark
// PATCH /api/teacher/results/student/:studentId/head-remark
// One remark per student per term — applies across all subjects.
const termRemarkSchema = z.object({
	termId: id,
	sessionId: id,
	remark: z.string().trim().min(1, "remark is required"),
});

module.exports = {
	assignedSubjectsQuerySchema,
	studentsWithResultsQuerySchema,
	uploadResultSchema,
	bulkUploadResultsSchema,
	sectionStudentsQuerySchema,
	studentSubjectsQuerySchema,
	uploadResultsForStudentSchema,
	recalculateResultsSchema,
	studentResultSheetQuerySchema,
	academicYearTermQuerySchema,
	submitBehavioralRatingsSchema,
	submitNurseryAssessmentsSchema,
	termRemarkSchema,
};
