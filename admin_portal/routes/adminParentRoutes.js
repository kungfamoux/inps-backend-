const express = require("express");
const router = express.Router();

const {
	getAllParents,
	getParentById,
	createParent,
	updateParent,
	deleteParent,
} = require("../controller/AdminParentController");

const { authenticate, requireAdmin, validate } = require("../../middleware");
const {
	createParentSchema,
	updateParentSchema,
	getAllParentsQuerySchema,
} = require("../validators/adminParent.validator");

/**
 * @swagger
 * tags:
 *   name: Admin - Parents
 *   description: Parent management (Admin only)
 */

/**
 * @swagger
 * /api/admin/parents:
 *   get:
 *     summary: Get all parents (paginated)
 *     tags: [Admin - Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email, phone, name, or address
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
 *         description: Paginated list of parents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - accountEmail: "parent@example.com"
 *                     accountPhone: "08160000000"
 *                     primaryGuardian:
 *                       relationship: "Father"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                     secondaryGuardian: null
 *                     address: "123 Main St"
 *                     maritalStatus: "MARRIED"
 *                     students: []
 *                 meta: { total: 50, page: 1, limit: 20, totalPages: 3 }
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
	validate(getAllParentsQuerySchema, "query"),
	getAllParents,
);

/**
 * @swagger
 * /api/admin/parents:
 *   post:
 *     summary: Create a new parent
 *     tags: [Admin - Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountEmail
 *               - accountPhone
 *               - primaryGuardian
 *             properties:
 *               accountEmail:
 *                 type: string
 *                 format: email
 *               accountPhone:
 *                 type: string
 *               primaryGuardian:
 *                 type: object
 *                 required:
 *                   - relationship
 *                   - firstName
 *                   - lastName
 *                 properties:
 *                   relationship:
 *                     type: string
 *                     enum: [Father, Mother, Guardian, Uncle, Aunt, Grandparent]
 *                   title:
 *                     type: string
 *                     enum: [Mr., Mrs., Ms., Dr., Chief, Engr., Pastor, Imam]
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   occupation:
 *                     type: string
 *                   address:
 *                     type: string
 *               secondaryGuardian:
 *                 type: object
 *                 properties:
 *                   relationship:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   occupation:
 *                     type: string
 *               address:
 *                 type: string
 *               maritalStatus:
 *                 type: string
 *                 enum: [MARRIED, SINGLE, DIVORCED, WIDOWED, SEPARATED]
 *     responses:
 *       201:
 *         description: Parent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Parent created successfully"
 *                 data:
 *                   id: "uuid"
 *                   accountEmail: "parent@example.com"
 *                   accountPhone: "08160000000"
 *                   primaryGuardian:
 *                     relationship: "Father"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *       400:
 *         description: Validation error or Firebase creation failed
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
	validate(createParentSchema),
	createParent,
);

/**
 * @swagger
 * /api/admin/parents/{id}:
 *   get:
 *     summary: Get a parent by ID
 *     tags: [Admin - Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent UUID
 *     responses:
 *       200:
 *         description: Parent record with linked students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   accountEmail: "parent@example.com"
 *                   accountPhone: "08160000000"
 *                   primaryGuardian:
 *                     relationship: "Father"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                   secondaryGuardian: null
 *                   address: "123 Main St"
 *                   maritalStatus: "MARRIED"
 *                   students:
 *                     - admissionNumber: "INPS-2024-001"
 *                       firstName: "Child"
 *                       lastName: "Doe"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Parent not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/:id",
	authenticate,
	requireAdmin,
	getParentById,
);

/**
 * @swagger
 * /api/admin/parents/{id}:
 *   patch:
 *     summary: Update parent information
 *     description: |
 *       Updates parent details. If accountEmail is changed, Firebase user email is also updated.
 *       If accountPhone is changed, Firebase password is reset to the new phone number.
 *     tags: [Admin - Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountEmail:
 *                 type: string
 *                 format: email
 *               accountPhone:
 *                 type: string
 *               primaryGuardian:
 *                 type: object
 *                 properties:
 *                   relationship:
 *                     type: string
 *                     enum: [Father, Mother, Guardian, Uncle, Aunt, Grandparent]
 *                   title:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   occupation:
 *                     type: string
 *                   address:
 *                     type: string
 *               secondaryGuardian:
 *                 type: object
 *                 properties:
 *                   relationship:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   occupation:
 *                     type: string
 *               address:
 *                 type: string
 *               maritalStatus:
 *                 type: string
 *                 enum: [SINGLE, MARRIED, DIVORCED, WIDOWED, SEPARATED]
 *     responses:
 *       200:
 *         description: Parent updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Parent updated successfully"
 *                 data:
 *                   accountEmail: "newemail@example.com"
 *                   accountPhone: "08161111111"
 *       400:
 *         description: Validation error or Firebase update failed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Parent not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/:id",
	authenticate,
	requireAdmin,
	validate(updateParentSchema),
	updateParent,
);

/**
 * @swagger
 * /api/admin/parents/{id}:
 *   delete:
 *     summary: Delete a parent (soft delete)
 *     description: |
 *       Soft deletes a parent record and disables their Firebase user.
 *       Cannot delete parents with linked students - students must be reassigned or deleted first.
 *     tags: [Admin - Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent UUID
 *     responses:
 *       200:
 *         description: Parent deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Parent deleted successfully"
 *       400:
 *         description: Cannot delete parent with linked students
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Parent not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
	"/:id",
	authenticate,
	requireAdmin,
	deleteParent,
);

module.exports = router;
