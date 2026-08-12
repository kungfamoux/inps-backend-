const { z } = require("zod");
const {
	CLASS_STATUS_VALUES,
	CLASS_COLOR_VALUES,
} = require("../../utils/enums");

// CLASSES

const createClassSchema = z.object({
	name: z.string().trim().min(1, "name is required"),
	color: z.enum(CLASS_COLOR_VALUES).optional(),
	roomNumber: z.string().trim().min(1).optional(),
});

const getAllClassesQuerySchema = z.object({
	status: z.enum(CLASS_STATUS_VALUES).optional(),
	color: z.enum(CLASS_COLOR_VALUES).optional(),
});

const updateClassSchema = z.object({
	color: z.enum(CLASS_COLOR_VALUES).optional(),
	roomNumber: z.string().trim().min(1).optional(),
	classTeacherId: z.string().trim().min(1).optional(),
	assistantTeacherId: z.string().trim().min(1).optional(),
});

module.exports = {
	createClassSchema,
	getAllClassesQuerySchema,
	updateClassSchema,
};
