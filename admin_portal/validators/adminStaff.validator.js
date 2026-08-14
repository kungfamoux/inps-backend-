const { z } = require("zod");
const {
	GENDER_VALUES,
	STAFF_ROLE_VALUES,
	STAFF_TYPE_VALUES,
	MARITAL_STATUS_VALUES,
} = require("../../utils/enums");

const createStaffAccountSchema = z.object({
	firstName: z.string().trim().min(1, "firstName is required"),
	lastName: z.string().trim().min(1, "lastName is required"),
	middleName: z.string().trim().optional(),
	email: z.string().trim().email("email must be a valid email"),
	phone: z.string().trim().min(1, "phone is required"),
	role: z.enum(STAFF_ROLE_VALUES),
	gender: z.enum(GENDER_VALUES).optional(),
	dateOfBirth: z.coerce.date().optional(),
	address: z.string().trim().min(1).optional(),
	maritalStatus: z.enum(MARITAL_STATUS_VALUES).optional(),
	nationality: z.string().trim().optional(),
	state: z.string().trim().optional(),
	lga: z.string().trim().optional(),
	religion: z.string().trim().optional(),
	qualifications: z.any().optional(), // JSON array
	subjectId: z.string().uuid().optional(),
	yearsOfExperience: z.coerce.number().int().nonnegative().optional(),
	previousEmployment: z.any().optional(), // JSON array
	dateOfEmployment: z.coerce.date().optional(),
	nextOfKinName: z.string().trim().optional(),
	nextOfKinPhone: z.string().trim().optional(),
	nextOfKinRelationship: z.string().trim().optional(),
	nextOfKinAddress: z.string().trim().optional(),
});

const getAllStaffQuerySchema = z.object({
	role: z.enum(STAFF_ROLE_VALUES).optional(),
	type: z.enum(STAFF_TYPE_VALUES).optional(),
	includeDeleted: z.coerce.boolean().optional(),
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
});

const updateStaffSchema = z.object({
	firstName: z.string().trim().min(1).optional(),
	lastName: z.string().trim().min(1).optional(),
	middleName: z.string().trim().optional(),
	phone: z.string().trim().min(1).optional(),
	address: z.string().trim().min(1).optional(),
	gender: z.enum(GENDER_VALUES).optional(),
	dateOfBirth: z.coerce.date().optional(),
	role: z.enum(STAFF_ROLE_VALUES).optional(),
	maritalStatus: z.enum(MARITAL_STATUS_VALUES).optional(),
	nationality: z.string().trim().optional(),
	state: z.string().trim().optional(),
	lga: z.string().trim().optional(),
	religion: z.string().trim().optional(),
	qualifications: z.any().optional(),
	subjectId: z.string().uuid().optional(),
	yearsOfExperience: z.coerce.number().int().nonnegative().optional(),
	previousEmployment: z.any().optional(),
	dateOfEmployment: z.coerce.date().optional(),
	nextOfKinName: z.string().trim().optional(),
	nextOfKinPhone: z.string().trim().optional(),
	nextOfKinRelationship: z.string().trim().optional(),
	nextOfKinAddress: z.string().trim().optional(),
});

const updateStaffFinancialSchema = z.object({
	salary: z.coerce.number().nonnegative().optional(),
	bankName: z.string().trim().optional(),
	bankAccountNumber: z.string().trim().optional(),
	bankAccountName: z.string().trim().optional(),
	taxId: z.string().trim().optional(),
	pensionNumber: z.string().trim().optional(),
});

module.exports = {
	createStaffAccountSchema,
	getAllStaffQuerySchema,
	updateStaffSchema,
	updateStaffFinancialSchema,
};
