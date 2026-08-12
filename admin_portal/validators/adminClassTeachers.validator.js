const { z } = require("zod");

const assignTeacherSchema = z.object({
	staffId: z.string().trim().min(1, "staffId is required"),
});

module.exports = {
	assignTeacherSchema,
};
