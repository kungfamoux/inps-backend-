const express = require("express");
const router = express.Router();

const {
	createStaffAccount,
	getAllStaff,
	getActiveStaff,
	getStaffById,
	updateStaff,
	resetPasswordToDefault,
	deactivateStaffAccount,
	reactivateStaffAccount,
	getStaffFinancial,
	updateStaffFinancial,
} = require("../controller/AdminStaffController");

const { authenticate, requireAdmin, validate } = require("../../middleware");
const {
	createStaffAccountSchema,
	getAllStaffQuerySchema,
	updateStaffSchema,
	updateStaffFinancialSchema,
} = require("../validators/adminStaff.validator");

/**
 * @swagger
 * tags:
 *   name: Admin - Staff
 *   description: Staff management (Admin only)
 */

/**
 * @swagger
 * /api/admin/staff:
 *   post:
 *     summary: Create a new staff account
 *     description: |
 *       Creates a Firebase auth user and a staff record.
 *       The `type` field (TEACHING / NON_TEACHING) is derived automatically from
 *       the `role` — do not pass it in the request body.
 *       Whether a TEACHER ends up as a class teacher, subject teacher, or both
 *       is determined later by section/subject assignments, not by this role.
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Chukwuemeka
 *               lastName:
 *                 type: string
 *                 example: Obi
 *               email:
 *                 type: string
 *                 example: c.obi@inps.edu.ng
 *               phone:
 *                 type: string
 *                 description: Used as the default password (digits only)
 *                 example: "08152622312"
 *               role:
 *                 type: string
 *                 enum:
 *                   - TEACHER
 *                   - ADMIN
 *                   - HEAD_TEACHER
 *                   - BURSARY
 *                   - STOREKEEPER
 *               gender:
 *                 type: string
 *                 enum:
 *                   - MALE
 *                   - FEMALE
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-14"
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Staff account created successfully"
 *                 data:
 *                   id: "staff_01"
 *                   staffId: "INPS-TCH-2024-001"
 *                   firstName: "Chukwuemeka"
 *                   lastName: "Obi"
 *                   email: "c.obi@inps.edu.ng"
 *                   phone: "08152622312"
 *                   gender: MALE
 *                   dateOfBirth: "1990-05-14T00:00:00.000Z"
 *                   address: null
 *                   type: TEACHING
 *                   role: TEACHER
 *                   status: ACTIVE
 *       400:
 *         description: Validation error, duplicate email, or role cap reached
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/",
	authenticate,
	requireAdmin,
	validate(createStaffAccountSchema),
	createStaffAccount,
);

/**
 * @swagger
 * /api/admin/staff:
 *   get:
 *     summary: Get all staff (paginated)
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [TEACHER, ADMIN, HEAD_TEACHER, BURSARY, STOREKEEPER]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [TEACHING, NON_TEACHING]
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include soft-deleted (inactive) staff records. Admin only.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of staff
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - staffId: "INPS-TCH-2024-001"
 *                     firstName: "Ada"
 *                     lastName: "Obi"
 *                     email: "a.obi@inps.edu.ng"
 *                     type: TEACHING
 *                     role: TEACHER
 *                     status: ACTIVE
 *                 meta: { total: 12, page: 1, limit: 20, totalPages: 1 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/",
	authenticate,
	requireAdmin,
	validate(getAllStaffQuerySchema, "query"),
	getAllStaff,
);

// /**
//  * @swagger
//  * /api/admin/staff/active:
//  *   get:
//  *     summary: Get active staff only (paginated)
//  *     tags: [Admin - Staff]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: role
//  *         schema:
//  *           type: string
//  *           enum: [TEACHER, ADMIN, HEAD_TEACHER, BURSARY, STOREKEEPER]
//  *       - in: query
//  *         name: type
//  *         schema:
//  *           type: string
//  *           enum: [TEACHING, NON_TEACHING]
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           default: 1
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           default: 20
//  *     responses:
//  *       200:
//  *         description: Paginated list of active staff
//  *       401:
//  *         description: Unauthorized
//  *       403:
//  *         description: Forbidden
//  */
//router.get("/active", authenticate, requireAdmin, getActiveStaff);

/**
 * @swagger
 * /api/admin/staff/{id}:
 *   get:
 *     summary: Get a staff member by id
 *     description: id format — UUID
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Staff record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   staffId: "INPS-TCH-2024-001"
 *                   firstName: "Ada"
 *                   lastName: "Obi"
 *                   email: "a.obi@inps.edu.ng"
 *                   type: TEACHING
 *                   role: TEACHER
 *                   status: ACTIVE
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", authenticate, requireAdmin, getStaffById);

/**
 * @swagger
 * /api/admin/staff/{id}:
 *   patch:
 *     summary: Update a staff member's profile and/or role
 *     description: |
 *       Single endpoint for all staff updates — profile fields and role changes.
 *
 *       **Profile fields** (firstName, lastName, phone, address, gender, dateOfBirth)
 *       can be updated freely.
 *
 *       **Role update** — include `role` in the request.
 *       Rules:
 *       - `type` is always derived from the role automatically — do not pass it.
 *       - Whether a TEACHER is a class teacher, subject teacher, or both is
 *         determined by section/subject assignments, not by this role.
 *       - Role cap is enforced: max 2 ADMIN accounts, max 1 HEAD_TEACHER.
 *
 *       **Immutable fields** — staffId, firebaseUid, email, status are always ignored.
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               role:
 *                 type: string
 *                 enum: [TEACHER, ADMIN, HEAD_TEACHER, BURSARY, STOREKEEPER]
 *                 description: Optional. Updates the role and auto-derives type.
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Staff updated successfully"
 *                 data:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   staffId: "INPS-TCH-2024-001"
 *                   firstName: "Ada"
 *                   lastName: "Obi"
 *                   type: TEACHING
 *                   role: TEACHER
 *                   status: ACTIVE
 *       400:
 *         description: Role cap reached or validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/:id",
	authenticate,
	requireAdmin,
	validate(updateStaffSchema),
	updateStaff,
);

/**
 * @swagger
 * /api/admin/staff/{id}/reset-password:
 *   patch:
 *     summary: Reset a staff member's password to their phone number
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Password reset to default (phone number) successfully"
 *       400:
 *         description: Staff not found or no phone number on record
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/:id/reset-password",
	authenticate,
	requireAdmin,
	resetPasswordToDefault,
);

/**
 * @swagger
 * /api/admin/staff/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a staff account (soft delete)
 *     description: |
 *       Disables the Firebase account and sets deletedAt on the staff record.
 *       Historical data is preserved.
 *       Blocked if deactivating the last active admin.
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Staff account deactivated successfully"
 *       400:
 *         description: Already deactivated or minimum admin count would be breached
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/:id/deactivate",
	authenticate,
	requireAdmin,
	deactivateStaffAccount,
);

/**
 * @swagger
 * /api/admin/staff/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a previously deactivated staff account
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff account reactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Staff account reactivated successfully"
 *       400:
 *         description: Already active or not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/:id/reactivate",
	authenticate,
	requireAdmin,
	reactivateStaffAccount,
);

/**
 * @swagger
 * /api/admin/staff/{id}/financial:
 *   get:
 *     summary: Get staff financial information (Admin/HeadTeacher only)
 *     description: |
 *       Retrieves sensitive financial data for a staff member.
 *       Access restricted to ADMIN and HEAD_TEACHER roles only.
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Financial data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   salary: 150000.00
 *                   bankName: "GTBank"
 *                   bankAccountNumber: "1234567890"
 *                   bankAccountName: "Chukwuemeka Obi"
 *                   taxId: "TIN123456"
 *                   pensionNumber: "PEN789012"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/:id/financial",
	authenticate,
	requireAdmin,
	getStaffFinancial,
);

/**
 * @swagger
 * /api/admin/staff/{id}/financial:
 *   patch:
 *     summary: Update staff financial information (Admin/HeadTeacher only)
 *     description: |
 *       Updates sensitive financial data for a staff member.
 *       Access restricted to ADMIN and HEAD_TEACHER roles only.
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               salary:
 *                 type: number
 *                 example: 150000.00
 *               bankName:
 *                 type: string
 *                 example: "GTBank"
 *               bankAccountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               bankAccountName:
 *                 type: string
 *                 example: "Chukwuemeka Obi"
 *               taxId:
 *                 type: string
 *                 example: "TIN123456"
 *               pensionNumber:
 *                 type: string
 *                 example: "PEN789012"
 *     responses:
 *       200:
 *         description: Financial data updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Financial data updated successfully"
 *                 data:
 *                   salary: 150000.00
 *                   bankName: "GTBank"
 *                   bankAccountNumber: "1234567890"
 *                   bankAccountName: "Chukwuemeka Obi"
 *                   taxId: "TIN123456"
 *                   pensionNumber: "PEN789012"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/:id/financial",
	authenticate,
	requireAdmin,
	validate(updateStaffFinancialSchema),
	updateStaffFinancial,
);

module.exports = router;
