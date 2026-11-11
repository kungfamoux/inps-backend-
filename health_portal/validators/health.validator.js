const { z } = require("zod");
const { DRUG_REQUEST_STATUS_VALUES } = require("../../utils/enums");

// Drug Request Schemas
const createDrugRequestSchema = z.object({
	listImage: z.string().trim().min(1, "Drug list image is required"),
	notes: z.string().trim().min(1).optional(),
});

const updateDrugRequestStatusSchema = z.object({
	status: z.enum(DRUG_REQUEST_STATUS_VALUES, "Invalid status"),
});

// Drug Purchase Schemas
const createDrugPurchaseSchema = z.object({
	requestId: z.string().trim().min(1, "Request ID is required"),
	invoiceImage: z.string().trim().min(1, "Invoice image is required"),
	receiptImage: z.string().trim().min(1, "Receipt image is required"),
	amount: z.coerce.number().positive().optional(),
	supplier: z.string().trim().min(1).optional(),
	notes: z.string().trim().min(1).optional(),
});

// Sickbay Visit Schemas
const createSickbayVisitSchema = z.object({
	studentId: z.string().trim().min(1, "Student ID is required"),
	symptoms: z.string().trim().min(1, "Symptoms are required"),
	treatment: z.string().trim().min(1, "Treatment is required"),
	medication: z.string().trim().min(1).optional(),
	notes: z.string().trim().min(1).optional(),
});

const updateSickbayVisitSchema = z.object({
	symptoms: z.string().trim().min(1).optional(),
	treatment: z.string().trim().min(1).optional(),
	medication: z.string().trim().min(1).optional(),
	notes: z.string().trim().min(1).optional(),
});

// Daily Visitor Log Schema
const uploadDailyVisitorLogSchema = z.object({
	date: z.coerce.date(),
	image: z.string().trim().min(1, "Image is required"),
});

// Query Schemas
const getSickbayVisitsQuerySchema = z.object({
	studentId: z.string().trim().min(1).optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

const getDailyVisitorLogQuerySchema = z.object({
	date: z.coerce.date(),
});

module.exports = {
	createDrugRequestSchema,
	updateDrugRequestStatusSchema,
	createDrugPurchaseSchema,
	createSickbayVisitSchema,
	updateSickbayVisitSchema,
	uploadDailyVisitorLogSchema,
	getSickbayVisitsQuerySchema,
	getDailyVisitorLogQuerySchema,
};
