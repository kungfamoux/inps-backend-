const express = require("express");
const router = express.Router();
const {
	staffLogin,
	refreshToken,
	changePassword,
	getMe,
} = require("../controller/auth.controller");
const { authenticate } = require("../../middleware/authenticate");
const { loginLimiter } = require("../../middleware/loginLimiter");
const { validate } = require("../../middleware/validate");
const {
	loginSchema,
	refreshTokenSchema,
	changePasswordSchema,
} = require("../validators/auth.validator");

/**
 * @swagger
 * /api/staff/login:
 *   post:
 *     summary: Staff login (all roles)
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: i.inps@yahoo.com
 *               password:
 *                 type: string
 *                 description: Default password is phone number (digits only)
 *                 example: "08162774990"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "AMf-vBz...redacted"
 *                 role: TEACHER
 *                 user:
 *                   staffId: "INPS-TCH-2024-001"
 *                   firstName: "Ada"
 *                   lastName: "Obi"
 *                   email: "i.inps@yahoo.com"
 *                   role: TEACHER
 *                   status: ACTIVE
 *       401:
 *         description: Invalid email or password, or account inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UnauthorizedResponse' }
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post("/login", loginLimiter, validate(loginSchema), staffLogin);

/**
 * @swagger
 * /api/staff/refresh-token:
 *   post:
 *     summary: Refresh an expired ID token
 *     description: Call this when any API request returns 401 (token expired). Provide the refresh token received at login.
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "AMf-vBz...redacted"
 *       401:
 *         description: Refresh token invalid, expired, or session revoked
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UnauthorizedResponse' }
 */
router.post("/refresh-token", validate(refreshTokenSchema), refreshToken);

/**
 * @swagger
 * /api/staff/change-password:
 *   post:
 *     summary: Change the authenticated staff member's password
 *     description: Verifies the current password before applying the update. Requires authentication.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 description: Must be at least 6 characters and different from the current password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Password changed successfully"
 *       400:
 *         description: Validation error (wrong current password, same password, too short, etc.)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/change-password",
	authenticate,
	validate(changePasswordSchema),
	changePassword,
);

/**
 * @swagger
 * /api/staff/me:
 *   get:
 *     summary: Get the currently authenticated staff member's profile
 *     description: Available to all staff roles. Used by each portal on load.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   staffId: "INPS-TCH-2024-001"
 *                   firstName: "Ada"
 *                   lastName: "Obi"
 *                   email: "i.inps@yahoo.com"
 *                   role: TEACHER
 *                   status: ACTIVE
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/me", authenticate, getMe);

module.exports = router;
