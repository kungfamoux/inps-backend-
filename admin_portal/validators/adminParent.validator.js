const { z } = require("zod");

const guardianSchema = z.object({
	relationship: z.enum(["Father", "Mother", "Guardian", "Uncle", "Aunt", "Grandparent"]),
	title: z.string().optional(),
	firstName: z.string().trim().min(1, "First name is required"),
	lastName: z.string().trim().min(1, "Last name is required"),
	phone: z.string().trim().min(1, "Phone number is required"),
	email: z.string().trim().email("Email must be valid").optional(),
	occupation: z.string().trim().optional(),
	address: z.string().trim().optional(),
});

const createParentSchema = z.object({
	accountEmail: z.string().trim().email("Account email must be valid"),
	accountPhone: z.string().trim().min(1, "Account phone is required"),
	primaryGuardian: guardianSchema,
	secondaryGuardian: guardianSchema.optional(),
	address: z.string().trim().optional(),
	maritalStatus: z.enum(["MARRIED", "SINGLE", "DIVORCED", "WIDOWED", "SEPARATED"]).optional(),
});

const updateParentSchema = z.object({
	accountEmail: z.string().trim().email("Account email must be valid").optional(),
	accountPhone: z.string().trim().min(1, "Account phone is required").optional(),
	primaryGuardian: guardianSchema.optional(),
	secondaryGuardian: guardianSchema.optional(),
	address: z.string().trim().optional(),
	maritalStatus: z.enum(["MARRIED", "SINGLE", "DIVORCED", "WIDOWED", "SEPARATED"]).optional(),
});

const getAllParentsQuerySchema = z.object({
	search: z.string().trim().optional(),
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
});

module.exports = {
	createParentSchema,
	updateParentSchema,
	getAllParentsQuerySchema,
};
