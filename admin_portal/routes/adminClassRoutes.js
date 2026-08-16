const express = require("express");
const router = express.Router();
const {
	createClass,
	getAllClasses,
	getClassById,
	getClassByName,
	updateClass,
	deleteClass,
	getStudentsByClass,
	assignClassTeacher,
	assignAssistantTeacher,
	removeClassTeacher,
	removeAssistantTeacher,
} = require("../controller/AdminClassController");

const { authenticate, requireAdmin, validate } = require("../../middleware");
const {
	createClassSchema,
	getAllClassesQuerySchema,
	updateClassSchema,
} = require("../validators/adminClass.validator");

/**
 * @swagger
 * tags:
 *   - name: Classes
 *     description: Class management
 */

// ─────────────────────────────────────────────
// CLASSES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/classes:
 *   post:
 *     summary: Create a new class
 *     description: Creates a new class with the specified name and optional properties
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Primary 1 Yellow
 *               color:
 *                 type: string
 *                 example: YELLOW
 *               roomNumber:
 *                 type: string
 *                 example: Room 4
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Class created successfully"
 *                 data: { id: "cls_01", name: "Primary 1 Yellow", color: "YELLOW", roomNumber: "Room 4", status: ACTIVE }
 *       400:
 *         description: Missing required fields or a class with this name already exists
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
	validate(createClassSchema),
	createClass,
);

/**
 * @swagger
 * /api/admin/classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by class status
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter by class color
 *     responses:
 *       200:
 *         description: List of all classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "cls_01"
 *                     name: "Primary 1 Yellow"
 *                     color: YELLOW
 *                     status: ACTIVE
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
	validate(getAllClassesQuerySchema, "query"),
	getAllClasses,
);

/**
 * @swagger
 * /api/admin/classes/{id}:
 *   get:
 *     summary: Get a class by ID
 *     tags: [Classes]
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
 *         description: Class record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "cls_01"
 *                   name: "Primary 1 Yellow"
 *                   color: YELLOW
 *                   status: ACTIVE
 *       404:
 *         description: Class not found
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
router.get(
	"/:id",
	authenticate,
	requireAdmin,
	getClassById,
);

/**
 * @swagger
 * /api/admin/classes/name/{name}:
 *   get:
 *     summary: Get a class by name
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "cls_01"
 *                   name: "Primary 1 Yellow"
 *                   color: YELLOW
 *                   status: ACTIVE
 *       404:
 *         description: Class not found
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
router.get(
	"/name/:name",
	authenticate,
	requireAdmin,
	getClassByName,
);

/**
 * @swagger
 * /api/admin/classes/{id}:
 *   patch:
 *     summary: Update a class
 *     description: >
 *       name cannot be changed. If renaming, the new name must not already exist.
 *       classTeacherId and assistantTeacherId are validated against existing staff records.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               color:
 *                 type: string
 *               roomNumber:
 *                 type: string
 *               classTeacherId:
 *                 type: string
 *               assistantTeacherId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Class updated successfully"
 *                 data: { id: "cls_01", name: "Primary 1 Yellow", color: "BLUE", roomNumber: "Room 5" }
 *       400:
 *         description: Class not found, name clash, or teacher ID not found
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
	"/:id",
	authenticate,
	requireAdmin,
	validate(updateClassSchema),
	updateClass,
);

/**
 * @swagger
 * /api/admin/classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     description: Cannot delete a class that has enrolled students or other dependencies
 *     tags: [Classes]
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
 *         description: Class deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Class deleted successfully"
 *       400:
 *         description: Class not found or has enrolled students/dependencies
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
router.delete(
	"/:id",
	authenticate,
	requireAdmin,
	deleteClass,
);

/**
 * @swagger
 * /api/admin/classes/{id}/students:
 *   get:
 *     summary: Get students in a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of students in the class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/:id/students",
	authenticate,
	requireAdmin,
	getStudentsByClass,
);

/**
 * @swagger
 * /api/admin/classes/{id}/class-teacher:
 *   post:
 *     summary: Assign a class teacher
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *             properties:
 *               teacherId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class teacher assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/:id/class-teacher",
	authenticate,
	requireAdmin,
	assignClassTeacher,
);

/**
 * @swagger
 * /api/admin/classes/{id}/assistant-teacher:
 *   post:
 *     summary: Assign an assistant teacher
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *             properties:
 *               teacherId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assistant teacher assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/:id/assistant-teacher",
	authenticate,
	requireAdmin,
	assignAssistantTeacher,
);

/**
 * @swagger
 * /api/admin/classes/{id}/class-teacher:
 *   delete:
 *     summary: Remove class teacher
 *     tags: [Classes]
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
 *         description: Class teacher removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
	"/:id/class-teacher",
	authenticate,
	requireAdmin,
	removeClassTeacher,
);

/**
 * @swagger
 * /api/admin/classes/{id}/assistant-teacher:
 *   delete:
 *     summary: Remove assistant teacher
 *     tags: [Classes]
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
 *         description: Assistant teacher removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
	"/:id/assistant-teacher",
	authenticate,
	requireAdmin,
	removeAssistantTeacher,
);

module.exports = router;
