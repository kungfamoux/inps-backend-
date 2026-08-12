const { z } = require("zod");
const {
	ANNOUNCEMENT_CATEGORY_VALUES,
	COMMUNICATION_TYPE_VALUES,
	COMMUNICATION_TARGET_VALUES,
	COMMUNICATION_STATUS_VALUES,
} = require("../../utils/enums");

const createCommunicationSchema = z
	.object({
		title: z.string().trim().min(1, "title is required"),
		content: z.string().trim().min(1, "content is required"),
		type: z.enum(COMMUNICATION_TYPE_VALUES),
		target: z.enum(COMMUNICATION_TARGET_VALUES),
		status: z.enum(COMMUNICATION_STATUS_VALUES).optional(),
		announcementCategory: z.enum(ANNOUNCEMENT_CATEGORY_VALUES).optional(),
	})
	.refine(
		(data) => data.type !== "ANNOUNCEMENT" || !!data.announcementCategory,
		{
			message: "announcementCategory is required when type is ANNOUNCEMENT",
			path: ["announcementCategory"],
		},
	);

const updateCommunicationSchema = z.object({
	title: z.string().trim().min(1).optional(),
	content: z.string().trim().min(1).optional(),
	target: z.enum(COMMUNICATION_TARGET_VALUES).optional(),
	status: z.enum(COMMUNICATION_STATUS_VALUES).optional(),
	announcementCategory: z.enum(ANNOUNCEMENT_CATEGORY_VALUES).optional(),
});

const getAllCommunicationsQuerySchema = z.object({
	type: z.enum(COMMUNICATION_TYPE_VALUES).optional(),
	status: z.enum(COMMUNICATION_STATUS_VALUES).optional(),
	target: z.enum(COMMUNICATION_TARGET_VALUES).optional(),
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
});

module.exports = {
	createCommunicationSchema,
	updateCommunicationSchema,
	getAllCommunicationsQuerySchema,
};
