const express = require("express");
const router = express.Router();

const {
	assignSubjectToTeacher,
	getAllSubjectAssignments,
	getAssignmentsByTeacher,
	getAssignmentsByClass,
	removeSubjectAssignment,
	bulkAssignSubjectToTeacher,
} = require("../controller/AdminAssignmentsController");

const { authenticate, requireAdmin, validate } = require("../../middleware");
const {
	assignSubjectToTeacherSchema,
	bulkAssignSubjectToTeacherSchema,
	getAllSubjectAssignmentsQuerySchema,
	getAssignmentsByClassQuerySchema,
} = require("../validators/adminAssignment.validator");

/**
 * @swagger
 * tags:
 *   name: Admin - Assignments
 *   description: Subject-to-teacher assignments per section and term
 */

/**
 * @swagger
 * /api/admin/assignments:
 *   post:
 *     summary: Assign a subject to a teacher for a class and term
 *     tags: [Admin - Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, subjectId, teacherId, academicYear, term, termId]
 *             properties:
 *               classId:      { type: string }
 *               subjectId:    { type: string }
 *               teacherId:    { type: string }
 *               academicYear: { type: string, example: "2024/2025" }
 *               term:         { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *               termId:       { type: string }
 *     responses:
 *       201:
 *         description: Subject assigned to teacher
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Subject assigned to teacher successfully"
 *                 data:
 *                   id: "sa_01"
 *                   classId: "cls_01"
 *                   subjectId: "sub_01"
 *                   teacherId: "staff_01"
 *                   academicYear: "2024/2025"
 *                   term: FIRST_TERM
 *                   status: ACTIVE
 *       400:
 *         description: >
 *           Missing fields, teacher not found or not a TEACHER, subject not found/inactive,
 *           subject not on class curriculum, or already assigned for this class/term
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
	validate(assignSubjectToTeacherSchema),
	assignSubjectToTeacher,
);

/**
 * @swagger
 * /api/admin/assignments/bulk:
 *   post:
 *     summary: Assign a subject to a teacher for multiple classes
 *     tags: [Admin - Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classIds, subjectId, teacherId, academicYear, term, termId]
 *             properties:
 *               classIds:     { type: array, items: { type: string } }
 *               subjectId:    { type: string }
 *               teacherId:    { type: string }
 *               academicYear: { type: string, example: "2024/2025" }
 *               term:         { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *               termId:       { type: string }
 *     responses:
 *       201:
 *         description: Subject assigned to teacher for multiple classes
 *       400:
 *         description: Validation errors
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/bulk",
	authenticate,
	requireAdmin,
	validate(bulkAssignSubjectToTeacherSchema),
	bulkAssignSubjectToTeacher,
);

/**
 * @swagger
 * /api/admin/assignments:
 *   get:
 *     summary: Get all subject assignments with optional filters
 *     description: |
 *       Returns all active assignments by default.
 *       Filter by any combination of classId, subjectId, academicYear, term, or status.
 *     tags: [Admin - Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema: { type: string }
 *         description: Filter by class
 *       - in: query
 *         name: subjectId
 *         schema: { type: string }
 *         description: Filter by subject
 *       - in: query
 *         name: academicYear
 *         schema: { type: string, example: "2024/2025" }
 *       - in: query
 *         name: term
 *         schema: { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *         description: Defaults to ACTIVE
 *     responses:
 *       200:
 *         description: Filtered list of assignments with teacher and subject info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "sa_01"
 *                     academicYear: "2024/2025"
 *                     term: FIRST_TERM
 *                     status: ACTIVE
 *                     teacher: { firstName: "Ada", lastName: "Obi" }
 *                     subject: { subjectName: Mathematics, subjectCode: MTH101 }
 *                     class: { name: "Primary 1", level: PRIMARY_1 }
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
	validate(getAllSubjectAssignmentsQuerySchema, "query"),
	getAllSubjectAssignments,
);

/**
 * @swagger
 * /api/admin/assignments/teacher/{teacherId}:
 *   get:
 *     summary: Get all subject assignments for a teacher
 *     description: Teachers see these when they log into the teacher portal.
 *     tags: [Admin - Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of subject assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "sa_01"
 *                     subject: { subjectName: Mathematics, subjectCode: MTH101 }
 *                     section: { name: "Red" }
 *                     academicYear: "2024/2025"
 *                     term: FIRST_TERM
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/teacher/:teacherId",
	authenticate,
	requireAdmin,
	getAssignmentsByTeacher,
);

/**
 * @swagger
 * /api/admin/assignments/class/{classId}:
 *   get:
 *     summary: Get all subject assignments for a class and term
 *     tags: [Admin - Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: term
 *         required: true
 *         schema: { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *     responses:
 *       200:
 *         description: List of subject assignments with teacher info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "sa_01"
 *                     subject: { subjectName: Mathematics, subjectCode: MTH101 }
 *                     teacher: { firstName: "Ada", lastName: "Obi" }
 *       400:
 *         description: academicYear and term are required
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
	"/class/:classId",
	authenticate,
	requireAdmin,
	validate(getAssignmentsByClassQuerySchema, "query"),
	getAssignmentsByClass,
);

/**
 * @swagger
 * /api/admin/assignments/{assignmentId}:
 *   delete:
 *     summary: Remove a subject assignment (sets to INACTIVE)
 *     tags: [Admin - Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Assignment removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Subject assignment removed"
 *                 data: { id: "sa_01", status: INACTIVE }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
	"/:assignmentId",
	authenticate,
	requireAdmin,
	removeSubjectAssignment,
);

module.exports = router;
