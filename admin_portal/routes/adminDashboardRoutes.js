const express = require("express");
const router = express.Router();

const { getDashboardStats } = require("../controller/AdminDashboardController");

const { authenticate, requireAdmin } = require("../../middleware");

/**
 * @swagger
 * tags:
 *   name: Admin - Dashboard
 *   description: Dashboard statistics and overview
 */

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Returns aggregated statistics for the admin dashboard including student, staff, and enrollment counts
 *     tags: [Admin - Dashboard]
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
 *                   properties:
 *                     totalStudents:
 *                       type: number
 *                     totalStaff:
 *                       type: number
 *                     teachingStaff:
 *                       type: number
 *                     activeEnrollments:
 *                       type: number
 *                     classStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           level:
 *                             type: string
 *                           studentCount:
 *                             type: number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get("/stats", authenticate, requireAdmin, getDashboardStats);

module.exports = router;
