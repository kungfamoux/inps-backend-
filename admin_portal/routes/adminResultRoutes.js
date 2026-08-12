const express = require("express");
const router = express.Router();

const {
	getUnverifiedResults,
	verifyResult,
	verifyAllResultsForStudent,
	verifyAllResultsForClass,
	bulkEntryScores,
	getEntryStatus,
	getResultsStatistics,
	getEntryStatusByClass,
	getRecentActivity,
	getResultsByClass,
} = require("../controller/AdminResultsController");

const {
	generateStudentReportCard,
	generateClassReportCards,
	previewReportCard,
} = require("../controller/AdminReportCardController");

const {
	authenticate,
	requireAdmin,
	requireRoles,
	validate,
} = require("../../middleware");
const {
	getUnverifiedResultsQuerySchema,
	verifyAllResultsSchema,
	bulkEntrySchema,
	reportCardQuerySchema,
	batchReportCardSchema,
} = require("../validators/adminResult.validator");

/**
 * @swagger
 * tags:
 *   name: Admin - Results
 *   description: Result verification — Head Teacher only
 */

/**
 * @swagger
 * /api/admin/results/unverified:
 *   get:
 *     summary: Get all unverified results (paginated)
 *     description: Head Teacher uses this to see what needs verification before parents can view results.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termId
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of unverified results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "res_01"
 *                     student: { admissionNumber: "INPSE-2024-001", firstName: "Ada", lastName: "Obi" }
 *                     subject: { subjectName: Mathematics, subjectCode: MTH101 }
 *                     scores: { ca1: 25, ca2: 27, exam: 35, total: 87, grade: C }
 *                     isVerified: false
 *                 meta: { total: 42, page: 1, limit: 20, totalPages: 3 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/unverified",
	authenticate,
	requireRoles(["HEAD_TEACHER", "ADMIN"]),
	validate(getUnverifiedResultsQuerySchema, "query"),
	getUnverifiedResults,
);

/**
 * @swagger
 * /api/admin/results/{resultId}/verify:
 *   patch:
 *     summary: Verify a single result
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Result verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Result verified successfully"
 *                 data: { id: "res_01", isVerified: true }
 *       400:
 *         description: Staff not found, not a head teacher, result not found, or already verified
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
	"/:resultId/verify",
	authenticate,
	requireRoles(["HEAD_TEACHER", "ADMIN"]),
	verifyResult,
);

/**
 * @swagger
 * /api/admin/results/student/{studentId}/verify-all:
 *   patch:
 *     summary: Verify all results for a student in a term
 *     description: >
 *       Route requires ADMIN, but the service additionally enforces that the
 *       authenticated staff member's role is HEAD_TEACHER — an ADMIN who is
 *       not also flagged HEAD_TEACHER receives a 400.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [termId, sessionId]
 *             properties:
 *               termId:    { type: string }
 *               sessionId: { type: string }
 *     responses:
 *       200:
 *         description: All results verified for student
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "6 result(s) verified for student"
 *                 data: { verified: 6 }
 *       400:
 *         description: termId/sessionId missing, staff not found, or not a head teacher
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
	"/student/:studentId/verify-all",
	authenticate,
	requireAdmin,
	validate(verifyAllResultsSchema),
	verifyAllResultsForStudent,
);

/**
 * @swagger
 * /api/admin/results/section/{sectionId}/verify-all:
 *   patch:
 *     summary: Verify all results for an entire section in a term
 *     description: >
 *       Bulk verification — verifies every unverified result for all students in the section.
 *       Route requires ADMIN, but the service additionally enforces that the
 *       authenticated staff member's role is HEAD_TEACHER — an ADMIN who is
 *       not also flagged HEAD_TEACHER receives a 400.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [termId, sessionId]
 *             properties:
 *               termId:    { type: string }
 *               sessionId: { type: string }
 *     responses:
 *       200:
 *         description: All results verified for section
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "112 result(s) verified for section"
 *                 data: { verified: 112, students: ["stu_01", "stu_02"] }
 *       400:
 *         description: termId/sessionId missing, staff not found, or not a head teacher
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
	"/class/:classId/verify-all",
	authenticate,
	requireAdmin,
	validate(verifyAllResultsSchema),
	verifyAllResultsForClass,
);

/**
 * @swagger
 * /api/admin/results/bulk-entry:
 *   post:
 *     summary: Bulk enter scores for students in a class
 *     description: >
 *       Admin or teacher can enter CA1, CA2, and Exam scores for multiple students
 *       in a single operation. Scores are validated, totals and grades auto-calculated,
 *       and positions recomputed. Supports both teachers (their assigned subjects) and admins.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, subjectId, termId, sessionId, scores]
 *             properties:
 *               classId: { type: string }
 *               subjectId: { type: string }
 *               termId: { type: string }
 *               sessionId: { type: string }
 *               staffId: { type: string }
 *               scores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [studentId]
 *                   properties:
 *                     studentId: { type: string }
 *                     ca1Score: { type: number, minimum: 0, maximum: 30 }
 *                     ca2Score: { type: number, minimum: 0, maximum: 30 }
 *                     examScore: { type: number, minimum: 0, maximum: 40 }
 *     responses:
 *       200:
 *         description: Scores entered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Successfully entered 30 scores"
 *                 data: { entered: 30 }
 *       400:
 *         description: Invalid request, validation errors, or unauthorized
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
	"/bulk-entry",
	authenticate,
	requireAdmin,
	validate(bulkEntrySchema),
	bulkEntryScores,
);

/**
 * @swagger
 * /api/admin/results/entry-status:
 *   get:
 *     summary: Get score entry status for a class/section/subject
 *     description: >
 *       Returns statistics about score entry progress including total students,
 *       completed entries, pending entries, and overall completion percentage.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema: { type: string }
 *       - in: query
 *         name: classId
 *         schema: { type: string }
 *       - in: query
 *         name: subjectId
 *         schema: { type: string }
 *       - in: query
 *         name: termId
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Entry status statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   totalStudents: 30
 *                   completedEntries: 25
 *                   pendingEntries: 5
 *                   entryStatus: "in_progress"
 *                   completionPercentage: 83.3
 *       400:
 *         description: Invalid query parameters
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
	"/entry-status",
	authenticate,
	requireAdmin,
	getEntryStatus,
);

/**
 * @swagger
 * /api/admin/results/statistics:
 *   get:
 *     summary: Get results statistics overview
 *     description: Returns overall statistics including total students, scores entered, pending verification, and completion percentage.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termId
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Results statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   totalStudents: 150
 *                   totalScores: 1200
 *                   pendingVerification: 45
 *                   completionPercentage: 80
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/statistics",
	authenticate,
	requireAdmin,
	getResultsStatistics,
);

/**
 * @swagger
 * /api/admin/results/entry-status-by-class:
 *   get:
 *     summary: Get entry status by class
 *     description: Returns entry completion status for each class in the school.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termId
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Entry status by class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - classId: "cls_001"
 *                     className: "Primary 1"
 *                     totalStudents: 30
 *                     completionPercentage: 80
 *                     entryStatus: "in_progress"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/entry-status-by-class",
	authenticate,
	requireAdmin,
	getEntryStatusByClass,
);

/**
 * @swagger
 * /api/admin/results/recent-activity:
 *   get:
 *     summary: Get recent results activity
 *     description: Returns recent score entry and verification activities.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termId
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Recent activity feed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - type: "entry"
 *                     action: "Scores entered for John Smith (STU001) - Mathematics"
 *                     time: "2024-01-15 14:30:00"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/recent-activity",
	authenticate,
	requireAdmin,
	getRecentActivity,
);

/**
 * @swagger
 * /api/admin/results/by-class:
 *   get:
 *     summary: Get results by class
 *     description: Returns all results for students in a specific class for the given term/session.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: termId
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       studentId:
 *                         type: string
 *                       student:
 *                         type: object
 *                       subjects:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/by-class",
	authenticate,
	requireAdmin,
	getResultsByClass,
);

/**
 * @swagger
 * /api/admin/results/report-card/{studentId}:
 *   get:
 *     summary: Generate single student report card PDF
 *     description: Generates a PDF report card for a specific student for the given term/session.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: termId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF report card generated
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing required parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/report-card/:studentId",
	authenticate,
	requireAdmin,
	validate(reportCardQuerySchema, "query"),
	generateStudentReportCard,
);

/**
 * @swagger
 * /api/admin/results/report-card/{studentId}/preview:
 *   get:
 *     summary: Get report card preview data
 *     description: Returns JSON data for report card preview without generating PDF.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: termId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Report card data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     student:
 *                       type: object
 *                     results:
 *                       type: array
 *                     summary:
 *                       type: object
 *       400:
 *         description: Missing required parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/report-card/:studentId/preview",
	authenticate,
	requireAdmin,
	validate(reportCardQuerySchema, "query"),
	previewReportCard,
);

/**
 * @swagger
 * /api/admin/results/report-cards/batch:
 *   post:
 *     summary: Generate batch report cards for a class
 *     description: Generates PDF report cards for all students in a class. Returns ZIP file by default.
 *     tags: [Admin - Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, termId, sessionId]
 *             properties:
 *               classId:
 *                 type: string
 *               termId:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [zip, individual]
 *                 default: zip
 *     responses:
 *       200:
 *         description: Report cards generated
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/report-cards/batch",
	authenticate,
	requireAdmin,
	validate(batchReportCardSchema),
	generateClassReportCards,
);

module.exports = router;
