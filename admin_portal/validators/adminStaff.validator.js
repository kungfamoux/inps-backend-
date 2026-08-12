const { z } = require("zod");
const {
	GENDER_VALUES,
	STAFF_ROLE_VALUES,
	STAFF_TYPE_VALUES,
} = require("../../utils/enums");

const createStaffAccountSchema = z.object({
	firstName: z.string().trim().min(1, "firstName is required"),
	lastName: z.string().trim().min(1, "lastName is required"),
	email: z.string().trim().email("email must be a valid email"),
	phone: z.string().trim().min(1, "phone is required"),
	role: z.enum(STAFF_ROLE_VALUES),
	gender: z.enum(GENDER_VALUES).optional(),
	dateOfBirth: z.coerce.date().optional(),
	address: z.string().trim().min(1).optional(),
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
	phone: z.string().trim().min(1).optional(),
	address: z.string().trim().min(1).optional(),
	gender: z.enum(GENDER_VALUES).optional(),
	dateOfBirth: z.coerce.date().optional(),
	role: z.enum(STAFF_ROLE_VALUES).optional(),
});

module.exports = {
	createStaffAccountSchema,
	getAllStaffQuerySchema,
	updateStaffSchema,
};
