const { z } = require("zod");

const loginSchema = z.object({
	email: z.string().trim().email(),
	password: z.string().min(1, "Password is required"),
});

const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, "refreshToken is required"),
});

// Service layer re-checks length/equality against the account's current
// password, but shape/required checks belong at the boundary.
const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

module.exports = {
	loginSchema,
	refreshTokenSchema,
	changePasswordSchema,
};
