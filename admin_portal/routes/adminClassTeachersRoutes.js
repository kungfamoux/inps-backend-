const express = require("express");
const router = express.Router();

const { authenticate, requireAdmin, validate } = require("../../middleware");
const {
	assignTeacherSchema,
} = require("../validators/adminClassTeachers.validator");

const {
	assignClassTeacher,
	removeClassTeacher,
	assignAssistantTeacher,
	removeAssistantTeacher,
} = require("../controller/AdminClassTeachersController");

/**
 * @swagger
 * /api/admin/classes/{classId}/teacher:
 *   patch:
 *     summary: Assign a class teacher to a class
 *     tags: [Admin - Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [staffId]
 *             properties:
 *               staffId: { type: string }
 *     responses:
 *       200:
 *         description: Class teacher assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Class teacher assigned successfully"
 *                 data: { id: "cls_01", name: "Primary 1 Red", classTeacherId: "staff_01" }
 *       400:
 *         description: staffId missing, staff not found, not a TEACHER, or already the class teacher of a different class
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
	"/:classId/teacher",
	authenticate,
	requireAdmin,
	validate(assignTeacherSchema),
	assignClassTeacher,
);

/**
 * @swagger
 * /api/admin/classes/{classId}/teacher:
 *   delete:
 *     summary: Remove the class teacher from a class
 *     tags: [Admin - Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Class teacher removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Class teacher removed"
 *                 data: { id: "cls_01", name: "Primary 1 Red", classTeacherId: null }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
	"/:classId/teacher",
	authenticate,
	requireAdmin,
	removeClassTeacher,
);

/**
 * @swagger
 * /api/admin/classes/{classId}/assistant:
 *   patch:
 *     summary: Assign an assistant teacher to a class
 *     tags: [Admin - Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [staffId]
 *             properties:
 *               staffId: { type: string }
 *     responses:
 *       200:
 *         description: Assistant teacher assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Assistant teacher assigned successfully"
 *                 data: { id: "cls_01", name: "Primary 1 Red", assistantTeacherId: "staff_02" }
 *       400:
 *         description: staffId missing, staff not found, not a TEACHER, or already the assistant teacher of a different class
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
	"/:classId/assistant",
	authenticate,
	requireAdmin,
	validate(assignTeacherSchema),
	assignAssistantTeacher,
);

/**
 * @swagger
 * /api/admin/classes/{classId}/assistant:
 *   delete:
 *     summary: Remove the assistant teacher from a class
 *     tags: [Admin - Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Assistant teacher removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Assistant teacher removed"
 *                 data: { id: "cls_01", name: "Primary 1 Red", assistantTeacherId: null }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
	"/:classId/assistant",
	authenticate,
	requireAdmin,
	removeAssistantTeacher,
);

module.exports = router;
