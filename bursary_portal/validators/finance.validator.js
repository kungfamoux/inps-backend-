const { z } = require("zod");
const {
	TERM_VALUES,
	INTAKE_TYPE_VALUES,
	PAYMENT_STATUS_VALUES,
	BILL_SCOPE_VALUES,
	EXPENSE_CATEGORY_VALUES,
	INCOME_CATEGORY_VALUES,
} = require("../../utils/enums");

const termEnumOptional = () =>
	z
		.enum(TERM_VALUES, {
			errorMap: () => ({ message: `term must be one of: ${TERM_VALUES.join(", ")}` }),
		})
		.optional();

const paginationQueryFields = {
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
};

// Dates are read from req.body.date as strings and passed straight to
// `new Date(date)` in the service, so we validate the string is parseable
// rather than coercing here.
const dateString = z
	.string()
	.trim()
	.min(1, "date is required")
	.refine((value) => !Number.isNaN(Date.parse(value)), {
		message: "date must be a valid date string",
	});

// POST /api/finance/bills
const createBillSchema = z
	.object({
		name: z.string().trim().min(1, "name is required"),
		amount: z.coerce.number().positive("amount must be a positive number"),
		academicYear: z.string().trim().min(1, "academicYear is required"),
		term: z.enum(TERM_VALUES, {
			errorMap: () => ({ message: `term must be one of: ${TERM_VALUES.join(", ")}` }),
		}),
		isCompulsory: z.boolean().optional(),
		scope: z.enum(BILL_SCOPE_VALUES, {
			errorMap: () => ({
				message: `scope must be one of: ${BILL_SCOPE_VALUES.join(", ")}`,
			}),
		}),
		intakeType: z.enum(INTAKE_TYPE_VALUES).nullish(),
		classIds: z.array(z.string().trim().min(1)).optional(),
	})
	.refine(
		(data) =>
			data.scope !== "BY_CLASS" ||
			(Array.isArray(data.classIds) && data.classIds.length > 0),
		{
			message: "classIds is required and must be non-empty when scope is BY_CLASS",
			path: ["classIds"],
		},
	);

// GET /api/finance/bills
const getAllBillsQuerySchema = z.object({
	academicYear: z.string().trim().optional(),
	term: termEnumOptional(),
	scope: z
		.enum(BILL_SCOPE_VALUES, {
			errorMap: () => ({
				message: `scope must be one of: ${BILL_SCOPE_VALUES.join(", ")}`,
			}),
		})
		.optional(),
	...paginationQueryFields,
});

// PATCH /api/finance/bills/:billId
const updateBillSchema = z.object({
	name: z.string().trim().min(1, "name cannot be empty").optional(),
	amount: z.coerce
		.number()
		.positive("amount must be a positive number")
		.optional(),
	isCompulsory: z.boolean().optional(),
});

// GET /api/finance/bills/class/:classId
const feeStructureByClassQuerySchema = z.object({
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES, {
		errorMap: () => ({ message: `term must be one of: ${TERM_VALUES.join(", ")}` }),
	}),
});

// POST /api/finance/expenses
const addExpenseSchema = z.object({
	date: dateString,
	description: z.string().trim().min(1, "description is required"),
	category: z.enum(EXPENSE_CATEGORY_VALUES, {
		errorMap: () => ({
			message: `category must be one of: ${EXPENSE_CATEGORY_VALUES.join(", ")}`,
		}),
	}),
	amount: z.coerce.number().positive("amount must be a positive number"),
});

// GET /api/finance/expenses
const getAllExpensesQuerySchema = z.object({
	category: z
		.enum(EXPENSE_CATEGORY_VALUES, {
			errorMap: () => ({
				message: `category must be one of: ${EXPENSE_CATEGORY_VALUES.join(", ")}`,
			}),
		})
		.optional(),
	...paginationQueryFields,
});

// POST /api/finance/income
const addIncomeRecordSchema = z.object({
	date: dateString,
	description: z.string().trim().min(1, "description is required"),
	category: z.enum(INCOME_CATEGORY_VALUES, {
		errorMap: () => ({
			message: `category must be one of: ${INCOME_CATEGORY_VALUES.join(", ")}`,
		}),
	}),
	amount: z.coerce.number().positive("amount must be a positive number"),
});

// GET /api/finance/income
const getAllIncomeRecordsQuerySchema = z.object({
	category: z
		.enum(INCOME_CATEGORY_VALUES, {
			errorMap: () => ({
				message: `category must be one of: ${INCOME_CATEGORY_VALUES.join(", ")}`,
			}),
		})
		.optional(),
	...paginationQueryFields,
});

// GET /api/finance/payments
const getRecentPaymentsQuerySchema = z.object({
	status: z
		.enum(PAYMENT_STATUS_VALUES, {
			errorMap: () => ({
				message: `status must be one of: ${PAYMENT_STATUS_VALUES.join(", ")}`,
			}),
		})
		.optional(),
	...paginationQueryFields,
});

module.exports = {
	createBillSchema,
	updateBillSchema,
	feeStructureByClassQuerySchema,
	getAllBillsQuerySchema,
	addExpenseSchema,
	getAllExpensesQuerySchema,
	addIncomeRecordSchema,
	getAllIncomeRecordsQuerySchema,
	getRecentPaymentsQuerySchema,
};
