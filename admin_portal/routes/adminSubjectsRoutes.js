const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin, validate } = require("../../middleware");
const AdminSubjectsController = require("../controller/AdminSubjectsController");
const {
	createSubjectSchema,
	getAllSubjectsQuerySchema,
	getSubjectsByClassQuerySchema,
	updateSubjectSchema,
	addSubjectLevelSchema,
	termIdBodySchema,
	bulkAssignSubjectsSchema,
} = require("../validators/adminSubjects.validator");

/**
 * @swagger
 * tags:
 *   - name: Subjects
 *     description: Subject management
 *   - name: Class Curriculum
 *     description: Assigning subjects to classes
 */

//
// SUBJECTS
//

/**
 * @swagger
 * /api/admin/subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subjectName
 *               - subjectCode
 *               - levels
 *             properties:
 *               subjectName:
 *                 type: string
 *                 example: Mathematics
 *               subjectCode:
 *                 type: string
 *                 example: MTH101
 *               levels:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                 example: ["PRIMARY_1", "PRIMARY_2"]
 *     responses:
 *       201:
 *         description: Subject created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Subject created successfully"
 *                 data:
 *                   id: "sub_01"
 *                   subjectName: Mathematics
 *                   subjectCode: MTH101
 *                   isActive: true
 *                   levels: [{ level: PRIMARY_1 }, { level: PRIMARY_2 }]
 *       400:
 *         description: Missing required fields or subject code already exists
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
	validate(createSubjectSchema),
	AdminSubjectsController.createSubject,
);

/**
 * @swagger
 * /api/admin/subjects:
 *   get:
 *     summary: Get all subjects (paginated)
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Paginated list of subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "sub_01"
 *                     subjectName: Mathematics
 *                     subjectCode: MTH101
 *                     isActive: true
 *                     levels: [{ level: PRIMARY_1 }, { level: PRIMARY_2 }]
 *                 meta: { total: 14, page: 1, limit: 20, totalPages: 1 }
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
	validate(getAllSubjectsQuerySchema, "query"),
	AdminSubjectsController.getAllSubjects,
);

//  STATIC ROUTES — must come before /:id

/**
 * @swagger
 * /api/admin/subjects/classes/{id}/subjects:
 *   get:
 *     summary: Get all subjects assigned to a class for a term
 *     tags: [Class Curriculum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *         description: The academic term to scope the curriculum to
 *     responses:
 *       200:
 *         description: List of subjects assigned to the class for the given term
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "cs_01"
 *                     subject: { subjectName: Mathematics, subjectCode: MTH101 }
 *                     termId: "term_01"
 *       400:
 *         description: termId missing or bad request
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
	"/classes/:id/subjects",
	authenticate,
	requireAdmin,
	validate(getSubjectsByClassQuerySchema, "query"),
	AdminSubjectsController.getSubjectsByClass,
);

/**
 * @swagger
 * /api/admin/subjects/classes/{id}/subjects/bulk:
 *   post:
 *     summary: Assign multiple subjects to a class for a term in one call
 *     tags: [Class Curriculum]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Subjects already assigned to this class for this term are silently
 *       skipped, not treated as an error — safe to re-run. All subjects must
 *       exist and be active.
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
 *               - termId
 *               - subjectIds
 *             properties:
 *               termId:
 *                 type: string
 *                 example: clx1234abcd
 *               subjectIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Subjects added to class curriculum (added/skipped counts plus the resulting curriculum list)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "2 subject(s) added to class curriculum"
 *                 data:
 *                   added: 2
 *                   skipped: 0
 *                   curriculum:
 *                     - id: "cs_01"
 *                       subject: { subjectName: Mathematics, subjectCode: MTH101 }
 *       400:
 *         description: >
 *           classId, termId, or subjectIds missing; class not found;
 *           one or more subjectIds not found; or one or more subjects inactive
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
	"/classes/:id/subjects/bulk",
	authenticate,
	requireAdmin,
	validate(bulkAssignSubjectsSchema),
	AdminSubjectsController.bulkAssignSubjectsToClass,
);

/**
 * @swagger
 * /api/admin/subjects/classes/{id}/subjects/{subjectId}:
 *   post:
 *     summary: Assign a subject to a class for a term
 *     tags: [Class Curriculum]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       The subject must exist, be active, and not already be assigned to this
 *       class for the given term. termId is required — curriculum is scoped per term.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subjectId
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
 *               - termId
 *             properties:
 *               termId:
 *                 type: string
 *                 example: clx1234abcd
 *     responses:
 *       201:
 *         description: Subject assigned to class for the term
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Subject assigned to class"
 *                 data: { id: "cs_01", classId: "cls_01", subjectId: "sub_01", termId: "term_01" }
 *       400:
 *         description: >
 *           classId, subjectId, or termId missing; class or subject not found;
 *           subject inactive; or subject already assigned for this term
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
	"/classes/:id/subjects/:subjectId",
	authenticate,
	requireAdmin,
	validate(termIdBodySchema),
	AdminSubjectsController.assignSubjectToClass,
);

/**
 * @swagger
 * /api/admin/subjects/classes/{id}/subjects/{subjectId}:
 *   delete:
 *     summary: Remove a subject from a class curriculum for a term
 *     tags: [Class Curriculum]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       termId is required — removes the subject only for the specified term,
 *       not from other terms where it may also be assigned.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subjectId
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
 *               - termId
 *             properties:
 *               termId:
 *                 type: string
 *                 example: clx1234abcd
 *     responses:
 *       200:
 *         description: Subject removed from class for the term
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Subject removed from class"
 *       400:
 *         description: termId missing or subject not assigned to this class for this term
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
	"/classes/:id/subjects/:subjectId",
	authenticate,
	requireAdmin,
	validate(termIdBodySchema),
	AdminSubjectsController.removeSubjectFromClass,
);

//  DYNAMIC PARAM ROUTES

/**
 * @swagger
 * /api/admin/subjects/{id}:
 *   get:
 *     summary: Get a subject by ID
 *     tags: [Subjects]
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
 *         description: Subject found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "sub_01"
 *                   subjectName: Mathematics
 *                   subjectCode: MTH101
 *                   isActive: true
 *                   levels: [{ level: PRIMARY_1 }, { level: PRIMARY_2 }]
 *       400:
 *         description: Subject not found
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
	AdminSubjectsController.getSubjectById,
);

/**
 * @swagger
 * /api/admin/subjects/{id}:
 *   patch:
 *     summary: Update a subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Updates subject fields. subjectCode must be unique if changed.
 *       levels replaces the full set — send the complete desired list.

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
 *               subjectName:
 *                 type: string
 *                 example: Further Mathematics
 *               subjectCode:
 *                 type: string
 *                 example: MTH102
 *               levels:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["PRIMARY_1", "PRIMARY_3"]
 *                 description: Replaces the full set of levels for this subject
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Subject updated successfully"
 *                 data:
 *                   id: "sub_01"
 *                   subjectName: "Further Mathematics"
 *                   subjectCode: MTH102
 *                   isActive: true
 *                   levels: [{ level: PRIMARY_1 }, { level: PRIMARY_3 }]
 *       400:
 *         description: Subject not found, or subject code already in use
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
	validate(updateSubjectSchema),
	AdminSubjectsController.updateSubject,
);

/**
 * @swagger
 * /api/admin/subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     tags: [Subjects]
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
 *         description: Subject deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Subject deleted successfully"
 *       400:
 *         description: Subject not found
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
	AdminSubjectsController.deleteSubject,
);

/**
 * @swagger
 * /api/admin/subjects/{id}/toggle-active:
 *   patch:
 *     summary: Toggle a subject's active status on or off
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Activates an inactive subject or deactivates an active one.
 *       Inactive subjects cannot be assigned to classes or teachers.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject activated or deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Subject activated successfully"
 *                 data: { id: "sub_01", subjectName: Mathematics, subjectCode: MTH101, isActive: true }
 *       400:
 *         description: Subject not found
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
	"/:id/toggle-active",
	authenticate,
	requireAdmin,
	AdminSubjectsController.toggleSubjectActive,
);

/**
 * @swagger
 * /api/admin/subjects/{id}/levels:
 *   post:
 *     summary: Add a level to an existing subject
 *     tags: [Subjects]
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
 *               - level
 *             properties:
 *               level:
 *                 type: string
 *                 example: PRIMARY_3
 *     responses:
 *       201:
 *         description: Level added to subject
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Level added to subject"
 *                 data:
 *                   id: "sub_01"
 *                   subjectName: Mathematics
 *                   subjectCode: MTH101
 *                   levels: [{ level: PRIMARY_1 }, { level: PRIMARY_2 }, { level: PRIMARY_3 }]
 *       400:
 *         description: level missing, subject not found, or level already exists
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
	"/:id/levels",
	authenticate,
	requireAdmin,
	validate(addSubjectLevelSchema),
	AdminSubjectsController.addSubjectLevel,
);

/**
 * @swagger
 * /api/admin/subjects/{id}/levels/{level}:
 *   delete:
 *     summary: Remove a level from a subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *         example: PRIMARY_1
 *     responses:
 *       200:
 *         description: Level removed from subject
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Level removed from subject"
 *       400:
 *         description: Subject not found
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
	"/:id/levels/:level",
	authenticate,
	requireAdmin,
	AdminSubjectsController.removeSubjectLevel,
);

module.exports = router;
