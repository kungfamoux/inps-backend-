const { z } = require("zod");

const createScheduleSchema = z.object({
	classId: z.string().trim().min(1, "classId is required"),
	subjectId: z.string().trim().min(1, "subjectId is required"),
	staffId: z.string().trim().min(1, "staffId is required"),
	dayOfWeek: z.string().trim().min(1, "dayOfWeek is required"),
	startTime: z.string().trim().min(1, "startTime is required"),
	endTime: z.string().trim().min(1, "endTime is required"),
});

module.exports = {
	createScheduleSchema,
};
