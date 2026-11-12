const express = require("express");
const router = express.Router();

const {
	getDashboardStats,
	getFinancialAnalytics,
	getStaffOverview,
	getStaffStatistics,
	getStudentEnrollmentOverview,
	getAcademicPerformanceMetrics,
	getSchoolConfiguration,
} = require("../controller/ProprietorController");

const { authenticate, requireRoles, validate } = require("../../middleware");
const {
	financialAnalyticsQuerySchema,
	staffOverviewQuerySchema,
	enrollmentQuerySchema,
} = require("../validators/proprietor.validator");

/**
 * @swagger
 * tags:
 *   name: Proprietor
 *   description: Proprietor portal for financial analytics and school overview
 */

/**
 * @swagger
 * /api/proprietor/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Returns aggregated statistics for the proprietor dashboard including staff, enrollment, and financial data
 *     tags: [Proprietor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Proprietor access required
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard", authenticate, requireRoles(["PROPRIETOR"]), getDashboardStats);

/**
 * @swagger
 * /api/proprietor/financial-analytics:
 *   get:
 *     summary: Get financial analytics
 *     description: Returns detailed financial data including income, expenses, and recent transactions
 *     tags: [Proprietor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent transactions to return
 *     responses:
 *       200:
 *         description: Financial analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Proprietor access required
 *       500:
 *         description: Internal server error
 */
router.get(
	"/financial-analytics",
	authenticate,
	requireRoles(["PROPRIETOR"]),
	validate(financialAnalyticsQuerySchema, "query"),
	getFinancialAnalytics
);

/**
 * @swagger
 * /api/proprietor/staff:
 *   get:
 *     summary: Get staff overview
 *     description: Returns staff roster with basic information
 *     tags: [Proprietor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by staff role
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [TEACHING, NON_TEACHING]
 *         description: Filter by staff type
 *     responses:
 *       200:
 *         description: Staff overview retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Proprietor access required
 *       500:
 *         description: Internal server error
 */
router.get(
	"/staff",
	authenticate,
	requireRoles(["PROPRIETOR"]),
	validate(staffOverviewQuerySchema, "query"),
	getStaffOverview
);

/**
 * @swagger
 * /api/proprietor/staff/statistics:
 *   get:
 *     summary: Get staff statistics
 *     description: Returns staff count by role and department
 *     tags: [Proprietor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Proprietor access required
 *       500:
 *         description: Internal server error
 */
router.get("/staff/statistics", authenticate, requireRoles(["PROPRIETOR"]), getStaffStatistics);

/**
 * @swagger
 * /api/proprietor/students/enrollment:
 *   get:
 *     summary: Get student enrollment overview
 *     description: Returns enrollment statistics by session, term, and class
 *     tags: [Proprietor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Filter by academic year
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *         description: Filter by term
 *     responses:
 *       200:
 *         description: Enrollment overview retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Proprietor access required
 *       500:
 *         description: Internal server error
 */
router.get(
	"/students/enrollment",
	authenticate,
	requireRoles(["PROPRIETOR"]),
	validate(enrollmentQuerySchema, "query"),
	getStudentEnrollmentOverview
);

/**
 * @swagger
 * /api/proprietor/academic-performance:
 *   get:
 *     summary: Get academic performance metrics
 *     description: Returns overall academic performance metrics
 *     tags: [Proprietor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Academic performance metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Proprietor access required
 *       500:
 *         description: Internal server error
 */
router.get(
	"/academic-performance",
	authenticate,
	requireRoles(["PROPRIETOR"]),
	getAcademicPerformanceMetrics
);

/**
 * @swagger
 * /api/proprietor/school-info:
 *   get:
 *     summary: Get school configuration
 *     description: Returns current school configuration details
 *     tags: [Proprietor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: School configuration retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Proprietor access required
 *       500:
 *         description: Internal server error
 */
router.get("/school-info", authenticate, requireRoles(["PROPRIETOR"]), getSchoolConfiguration);

module.exports = router;
