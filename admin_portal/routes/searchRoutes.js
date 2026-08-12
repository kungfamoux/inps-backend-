const express = require("express");
const router = express.Router();
const {
	authenticate,
	requireAdmin,
	requireTeacher,
	reportLimiter,
	validate,
} = require("../../middleware");
const AdminSearchController = require("../controller/SearchController");
const { searchQuerySchema } = require("../validators/search.validator");

/**
 * @swagger
 * tags:
 *   - name: Search
 *     description: Global search across staff, students, subjects, and classes
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search across staff, students, subjects, and classes
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Runs a case-insensitive search against all entity types by default.
 *       Pass a comma-separated `types` param to narrow results to specific
 *       entities. Returns up to 10 matches per type.
 *       Minimum query length is 2 characters.
 *       Only active, non-deleted records are returned.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: >
 *           Search term. Matched against:
 *           staff (firstName, lastName, staffId, email),
 *           students (firstName, lastName, admissionNumber),
 *           subjects (subjectName, subjectCode),
 *           classes (name, section name)
 *         example: ade
 *       - in: query
 *         name: types
 *         required: false
 *         schema:
 *           type: string
 *         description: >
 *           Comma-separated list of entity types to search.
 *           Omit to search all. Valid values: staff, students, subjects, classes
 *         example: staff,students
 *     responses:
 *       200:
 *         description: Search results grouped by entity type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     staff:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           staffId: { type: string }
 *                           firstName: { type: string }
 *                           lastName: { type: string }
 *                           email: { type: string }
 *                           role: { type: string }
 *                           type: { type: string }
 *                           status: { type: string }
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           admissionNumber: { type: string }
 *                           firstName: { type: string }
 *                           lastName: { type: string }
 *                           status: { type: string }
 *                           passportPhoto: { type: string, nullable: true }
 *                           enrollments:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 class:
 *                                   type: object
 *                                   properties:
 *                                     name: { type: string }
 *                                     level: { type: string }
 *                                 section:
 *                                   type: object
 *                                   properties:
 *                                     name: { type: string }
 *                     subjects:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           subjectName: { type: string }
 *                           subjectCode: { type: string }
 *                           isActive: { type: boolean }
 *                           levels:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 level: { type: string }
 *                     classes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                           level: { type: string }
 *                           status: { type: string }
 *                           sections:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 name: { type: string }
 *                                 status: { type: string }
 *                                 currentEnrollment: { type: integer }
 *       400:
 *         description: Query too short or missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Search query must be at least 2 characters
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
	reportLimiter,
	validate(searchQuerySchema, "query"),
	AdminSearchController.search,
);

// Entity-specific search endpoints
router.get(
	"/students",
	authenticate,
	requireAdmin,
	reportLimiter,
	validate(searchQuerySchema, "query"),
	AdminSearchController.searchStudents,
);

router.get(
	"/staff",
	authenticate,
	requireAdmin,
	reportLimiter,
	validate(searchQuerySchema, "query"),
	AdminSearchController.searchStaff,
);

router.get(
	"/parents",
	authenticate,
	requireAdmin,
	reportLimiter,
	validate(searchQuerySchema, "query"),
	AdminSearchController.searchParents,
);

router.get(
	"/classes",
	authenticate,
	requireAdmin,
	reportLimiter,
	validate(searchQuerySchema, "query"),
	AdminSearchController.searchClasses,
);

router.get(
	"/subjects",
	authenticate,
	requireAdmin,
	reportLimiter,
	validate(searchQuerySchema, "query"),
	AdminSearchController.searchSubjects,
);

module.exports = router;
