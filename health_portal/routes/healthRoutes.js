const express = require("express");
const router = express.Router();
const {
	submitDrugRequest,
	getDrugRequests,
	getDrugRequest,
	updateDrugRequestStatus,
	recordDrugPurchase,
	getDrugPurchases,
	recordSickbayVisit,
	getSickbayVisits,
	getSickbayVisit,
	updateSickbayVisit,
	uploadDailyVisitorLog,
	getDailyVisitorLog,
	getDailyVisits,
} = require("../controller/HealthController");

const { authenticate, requireRoles } = require("../../middleware");
const { upload } = require("../../utils/uploadToCloudinary");

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Health portal (Sickbay management)
 */

// ─────────────────────────────────────────────
// DRUG REQUESTS
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/health/drug-requests:
 *   post:
 *     summary: Submit a drug request
 *     description: Submit a new drug request with drug list image
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - listImage
 *             properties:
 *               listImage:
 *                 type: string
 *                 format: binary
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Drug request submitted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
	"/drug-requests",
	authenticate,
	requireRoles(["NURSE"]),
	upload.single("listImage"),
	submitDrugRequest
);

/**
 * @swagger
 * /api/health/drug-requests:
 *   get:
 *     summary: Get all drug requests
 *     description: Get list of all drug requests with purchase info
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Drug requests retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
	"/drug-requests",
	authenticate,
	requireRoles(["NURSE"]),
	getDrugRequests
);

/**
 * @swagger
 * /api/health/drug-requests/{id}:
 *   get:
 *     summary: Get a drug request by ID
 *     description: Get single drug request with details
 *     tags: [Health]
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
 *         description: Drug request retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Drug request not found
 */
router.get(
	"/drug-requests/:id",
	authenticate,
	requireRoles(["NURSE"]),
	getDrugRequest
);

/**
 * @swagger
 * /api/health/drug-requests/{id}/status:
 *   patch:
 *     summary: Update drug request status
 *     description: Update drug request status (PENDING/COMPLETED/CANCELLED)
 *     tags: [Health]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Drug request status updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch(
	"/drug-requests/:id/status",
	authenticate,
	requireRoles(["NURSE"]),
	updateDrugRequestStatus
);

// ─────────────────────────────────────────────
// DRUG PURCHASES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/health/drug-purchases:
 *   post:
 *     summary: Record a drug purchase
 *     description: Record drug purchase with invoice and receipt images
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *               - invoiceImage
 *               - receiptImage
 *             properties:
 *               requestId:
 *                 type: string
 *               invoiceImage:
 *                 type: string
 *                 format: binary
 *               receiptImage:
 *                 type: string
 *                 format: binary
 *               amount:
 *                 type: number
 *               supplier:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Drug purchase recorded successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
	"/drug-purchases",
	authenticate,
	requireRoles(["NURSE"]),
	upload.fields([
		{ name: "invoiceImage", maxCount: 1 },
		{ name: "receiptImage", maxCount: 1 },
	]),
	recordDrugPurchase
);

/**
 * @swagger
 * /api/health/drug-purchases/{requestId}:
 *   get:
 *     summary: Get purchases for a drug request
 *     description: Get all purchases for a specific drug request
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchases retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
	"/drug-purchases/:requestId",
	authenticate,
	requireRoles(["NURSE"]),
	getDrugPurchases
);

// ─────────────────────────────────────────────
// SICKBAY VISITS
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/health/sickbay-visits:
 *   post:
 *     summary: Record a sickbay visit
 *     description: Record a new sickbay visit for a student
 *     tags: [Health]
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
 *               - symptoms
 *               - treatment
 *             properties:
 *               studentId:
 *                 type: string
 *               symptoms:
 *                 type: string
 *               treatment:
 *                 type: string
 *               medication:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sickbay visit recorded successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
	"/sickbay-visits",
	authenticate,
	requireRoles(["NURSE"]),
	recordSickbayVisit
);

/**
 * @swagger
 * /api/health/sickbay-visits:
 *   get:
 *     summary: Get sickbay visits
 *     description: Get sickbay visits with optional filters
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Sickbay visits retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
	"/sickbay-visits",
	authenticate,
	requireRoles(["NURSE"]),
	getSickbayVisits
);

/**
 * @swagger
 * /api/health/sickbay-visits/{id}:
 *   get:
 *     summary: Get a sickbay visit by ID
 *     description: Get single sickbay visit with details
 *     tags: [Health]
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
 *         description: Sickbay visit retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Sickbay visit not found
 */
router.get(
	"/sickbay-visits/:id",
	authenticate,
	requireRoles(["NURSE"]),
	getSickbayVisit
);

/**
 * @swagger
 * /api/health/sickbay-visits/{id}:
 *   patch:
 *     summary: Update a sickbay visit
 *     description: Update sickbay visit details
 *     tags: [Health]
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
 *               symptoms:
 *                 type: string
 *               treatment:
 *                 type: string
 *               medication:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sickbay visit updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch(
	"/sickbay-visits/:id",
	authenticate,
	requireRoles(["NURSE"]),
	updateSickbayVisit
);

// ─────────────────────────────────────────────
// DAILY VISITOR LOG
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/health/daily-visitor-log:
 *   post:
 *     summary: Upload daily visitor log image
 *     description: Upload daily sickbay visitor log image
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - dailyVisitorLog
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               dailyVisitorLog:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Daily visitor log uploaded successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
	"/daily-visitor-log",
	authenticate,
	requireRoles(["NURSE"]),
	upload.single("dailyVisitorLog"),
	uploadDailyVisitorLog
);

/**
 * @swagger
 * /api/health/daily-visitor-log:
 *   get:
 *     summary: Get daily visitor log image
 *     description: Get daily sickbay visitor log image signed URL
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Daily visitor log retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
	"/daily-visitor-log",
	authenticate,
	requireRoles(["NURSE"]),
	getDailyVisitorLog
);

/**
 * @swagger
 * /api/health/daily-visits:
 *   get:
 *     summary: Get daily sickbay visits
 *     description: Get all sickbay visits for a specific date
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Daily visits retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
	"/daily-visits",
	authenticate,
	requireRoles(["NURSE"]),
	getDailyVisits
);

module.exports = router;
