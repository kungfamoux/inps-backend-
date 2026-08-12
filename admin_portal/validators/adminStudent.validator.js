const { z } = require("zod");
const {
	GENDER_VALUES,
	INTAKE_TYPE_VALUES,
	STUDENT_STATUS_VALUES,
} = require("../../utils/enums");

// Multipart form-data — multer populates req.body with string fields.
// parentData arrives as a JSON string; only check it's non-empty here,
// its nested shape is parsed/validated in the controller + service layer.
const createStudentSchema = z.object({
	firstName: z.string().trim().min(1, "firstName is required"),
	lastName: z.string().trim().min(1, "lastName is required"),
	middleName: z.string().trim().min(1).optional(),
	gender: z.enum(GENDER_VALUES),
	dateOfBirth: z.coerce.date(),
	nationality: z.string().trim().min(1).optional(),
	state: z.string().trim().min(1).optional(),
	lga: z.string().trim().min(1).optional(),
	religion: z.string().trim().min(1).optional(),
	healthInfo: z.string().trim().min(1).optional(),
	bloodGroup: z.string().trim().min(1).optional(),
	sportHouse: z.string().trim().min(1).optional(),
	address: z.string().trim().min(1).optional(),
	intakeType: z.enum(INTAKE_TYPE_VALUES).optional(),
	studentType: z.string().trim().min(1).optional(),
	admissionDate: z.coerce.date(),
	graduationDate: z.coerce.date().optional(),
	accountEmail: z.string().trim().email("accountEmail must be a valid email"),
	accountPhone: z.string().trim().min(1, "accountPhone is required"),
	parentData: z.string().trim().min(1, "parentData is required"),
});

const getAllStudentsQuerySchema = z.object({
	status: z.enum(STUDENT_STATUS_VALUES).optional(),
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
});

const getAllResultsQuerySchema = z.object({
	sessionId: z.string().trim().min(1).optional(),
	termId: z.string().trim().min(1).optional(),
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
});

const SCHOOL_LEVEL_VALUES = [
	"PRIMARY_1",
	"PRIMARY_2",
	"PRIMARY_3",
	"PRIMARY_4",
	"PRIMARY_5",
	"PRIMARY_6",
];

const getResultsBySubjectQuerySchema = z.object({
	level: z.enum(SCHOOL_LEVEL_VALUES).optional(),
	sessionId: z.string().trim().min(1).optional(),
	termId: z.string().trim().min(1).optional(),
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
});

const getStudentResultsQuerySchema = z.object({
	filter: z.enum(["all", "term"]).optional(),
	termId: z.string().trim().min(1).optional(),
	sessionId: z.string().trim().min(1).optional(),
});

// PATCH /:admissionNumber — partial profile update, no fixed required fields
const updateStudentSchema = z.object({
	firstName: z.string().trim().min(1).optional(),
	lastName: z.string().trim().min(1).optional(),
	middleName: z.string().trim().min(1).optional(),
	gender: z.enum(GENDER_VALUES).optional(),
	dateOfBirth: z.coerce.date().optional(),
	nationality: z.string().trim().min(1).optional(),
	state: z.string().trim().min(1).optional(),
	lga: z.string().trim().min(1).optional(),
	religion: z.string().trim().min(1).optional(),
	healthInfo: z.string().trim().min(1).optional(),
	bloodGroup: z.string().trim().min(1).optional(),
	sportHouse: z.string().trim().min(1).optional(),
	address: z.string().trim().min(1).optional(),
	status: z.enum(STUDENT_STATUS_VALUES).optional(),
	intakeType: z.enum(INTAKE_TYPE_VALUES).optional(),
	studentType: z.string().trim().min(1).optional(),
	admissionDate: z.coerce.date().optional(),
	graduationDate: z.coerce.date().optional(),
});

module.exports = {
	createStudentSchema,
	getAllStudentsQuerySchema,
	getAllResultsQuerySchema,
	getResultsBySubjectQuerySchema,
	getStudentResultsQuerySchema,
	updateStudentSchema,
};
