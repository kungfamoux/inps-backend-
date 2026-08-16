const express = require("express");
const router = express.Router();

const {
	enrollStudent,
	getActiveEnrollment,
	getEnrollmentsByClass,
	transferStudent,
	bulkTransferStudents,
	assignFromPool,
	verifyResultsForPromotion,
	runPromotion,
} = require("../controller/AdminEnrollmentController");

const { authenticate, requireAdmin, validate } = require("../../middleware");
const {
	enrollStudentSchema,
	enrollmentListQuerySchema,
	transferStudentSchema,
	assignFromPoolSchema,
} = require("../validators/adminEnrollment.validator");

/**
 * @swagger
 * tags:
 *   name: Admin - Enrollment
 *   description: Student enrollment, transfers, and end-of-session promotion
 */

//  Enrollment

/**
 * @swagger
 * /api/admin/enrollment:
 *   post:
 *     summary: Enroll a student into a class and section for a term
 *     tags: [Admin - Enrollment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - classId
 *               - academicYear
 *               - term
 *             properties:
 *               studentId:
 *                 type: string
 *               classId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *                 description: Optional — can be assigned later via the assign endpoint
 *               academicYear:
 *                 type: string
 *                 example: "2024/2025"
 *               term:
 *                 type: string
 *                 enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM]
 *     responses:
 *       201:
 *         description: Student enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Student enrolled successfully"
 *                 data:
 *                   id: "enr_01"
 *                   studentId: "stu_01"
 *                   classId: "cls_01"
 *                   sectionId: null
 *                   academicYear: "2024/2025"
 *                   term: FIRST_TERM
 *                   status: ACTIVE
 *       400:
 *         description: Missing fields or already enrolled
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
	validate(enrollStudentSchema),
	enrollStudent,
);

/**
 * @swagger
 * /api/admin/enrollment/student/{studentId}:
 *   get:
 *     summary: Get a student's current active enrollment
 *     tags: [Admin - Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active enrollment record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "enr_01"
 *                   studentId: "stu_01"
 *                   classId: "cls_01"
 *                   sectionId: "sec_01"
 *                   academicYear: "2024/2025"
 *                   term: FIRST_TERM
 *                   status: ACTIVE
 *       400:
 *         description: No active enrollment found
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
	"/student/:studentId",
	authenticate,
	requireAdmin,
	getActiveEnrollment,
);

/**
 * @swagger
 * /api/admin/enrollment/class/{classId}:
 *   get:
 *     summary: Get enrollments for a class filtered by term and status
 *     description: |
 *       Defaults to status=ACTIVE.
 *       Pass status=PENDING to view the post-promotion pool awaiting section assignment.
 *       Pass status=COMPLETED to view historical enrollments.
 *     tags: [Admin - Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema:
 *           type: string
 *         example: "2024/2025"
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *           enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PENDING, COMPLETED]
 *         description: Defaults to ACTIVE
 *     responses:
 *       200:
 *         description: List of enrollments with student details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "enr_01"
 *                     student: { admissionNumber: "INPSE-2024-001", firstName: "Ada", lastName: "Obi" }
 *                     status: ACTIVE
 *       400:
 *         description: academicYear and term are required or invalid status
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
	validate(enrollmentListQuerySchema, "query"),
	getEnrollmentsByClass,
);



//  Transfer

/**
 * @swagger
 * /api/admin/enrollment/{enrollmentId}/transfer:
 *   patch:
 *     summary: Transfer a student to a different class mid-term
 *     tags: [Admin - Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
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
 *               - newClassId
 *             properties:
 *               newClassId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student transferred successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Student transferred successfully"
 *                 data: { id: "enr_01", classId: "cls_02", previousClassId: "cls_01", transferCount: 1 }
 *       400:
 *         description: newClassId missing or enrollment not found
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
	"/:enrollmentId/transfer",
	authenticate,
	requireAdmin,
	validate(transferStudentSchema),
	transferStudent,
);



/**
 * @swagger
 * /api/admin/enrollment/bulk-transfer:
 *   post:
 *     summary: Bulk transfer multiple students to different classes
 *     description: |
 *       Transfer multiple students in a single atomic transaction.
 *       All transfers will succeed or fail together.
 *       Each transfer specifies an enrollmentId and the target newClassId.
 *     tags: [Admin - Enrollment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transfers
 *             properties:
 *               transfers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - enrollmentId
 *                     - newClassId
 *                   properties:
 *                     enrollmentId:
 *                       type: string
 *                     newClassId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk transfer completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Bulk transfer completed"
 *                 data:
 *                   total: 5
 *                   succeeded: 4
 *                   failed: 1
 *                   results:
 *                     - enrollmentId: "enr_01"
 *                       success: true
 *                       data: { id: "enr_01", classId: "cls_02" }
 *                     - enrollmentId: "enr_02"
 *                       success: false
 *                       error: "Student already in this class"
 *       400:
 *         description: Invalid request or missing fields
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
	"/bulk-transfer",
	authenticate,
	requireAdmin,
	bulkTransferStudents,
);



/**
 * @swagger
 * /api/admin/enrollment/{enrollmentId}/assign:
 *   patch:
 *     summary: Assign a student from the pending pool into a class
 *     description: |
 *       Used after promotion runs.
 *       Students sit in PENDING status until the admin manually assigns
 *       them to a class for the new session.
 *       Use GET /class/:classId?status=PENDING to see who is in the pool.
 *     tags: [Admin - Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
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
 *               - classId
 *             properties:
 *               classId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student assigned to section
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Student assigned to section successfully"
 *                 data: { id: "enr_01", sectionId: "sec_01", status: ACTIVE }
 *       400:
 *         description: sectionId missing or student is not in the pending pool
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
	"/:enrollmentId/assign",
	authenticate,
	requireAdmin,
	validate(assignFromPoolSchema),
	assignFromPool,
);

//  Promotion

/**
 * @swagger
 * /api/admin/enrollment/promotion/{id}/verify:
 *   get:
 *     summary: Verify all results before running promotion (read-only)
 *     description: |
 *       Checks every active student for missing or incomplete results.
 *       Promotion is only allowed if canPromote is true.
 *       Safe to run multiple times during the term as a progress check.
 *     tags: [Admin - Enrollment]
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
 *         description: Verification report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   canPromote: false
 *                   total: 120
 *                   verified: 110
 *                   withIssues: 10
 *                   issues:
 *                     - studentId: "stu_01"
 *                       reason: "Missing results for Mathematics"
 *       400:
 *         description: Session not found or not all terms completed
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
	"/promotion/:id/verify",
	authenticate,
	requireAdmin,
	verifyResultsForPromotion,
);

/**
 * @swagger
 * /api/admin/enrollment/promotion/{id}/run:
 *   post:
 *     summary: Run promotion for all students in a session
 *     description: |
 *       Re-runs verification automatically before executing.
 *       Blocked if any result issues exist.
 *       Students who pass → PENDING in the next class up.
 *       Students who fail → PENDING in the same class (repeat).
 *       Primary 6 students who pass → GRADUATED.
 *       After running, use the assign endpoint to place students into sections.
 *     tags: [Admin - Enrollment]
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
 *         description: Promotion completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Promotion completed successfully"
 *                 data:
 *                   promotionRunId: "run_01"
 *                   session: "2024/2025"
 *                   processed: 120
 *                   promoted: 108
 *                   repeating: 12
 *       400:
 *         description: Result issues exist or promotion already completed for this session
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
	"/promotion/:id/run",
	authenticate,
	requireAdmin,
	runPromotion,
);

module.exports = router;
