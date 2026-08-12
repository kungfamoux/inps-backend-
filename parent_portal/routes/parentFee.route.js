const express = require("express");
const router = express.Router();

const {
	verifyFeePayment,
	initializeFeePayment,
	getFeeOverview,
	getPaymentHistory,
	getOutstandingInvoiceIds,
} = require("../controller/ParentFeeController");

const {
	authenticateParent,
	verifyPaystackSignature,
	webhookLimiter,
	validate,
} = require("../../middleware");

const {
	verifyPaymentSchema,
	initializeFeePaymentSchema,
	paymentHistoryQuerySchema,
} = require("../validators/parentFee.validator");

/**
 * @swagger
 * tags:
 *   name: Parent Fees
 *   description: Fee overview, payment history, and Paystack payment flow for parents
 */

/**
 * @swagger
 * /api/parent/fees/pay/verify:
 *   post:
 *     summary: Verify a Paystack payment after frontend callback
 *     description: >
 *       Verifies a completed Paystack transaction using the payment reference.
 *       Called by the frontend after Paystack redirects back to the app.
 *       On success this endpoint:
 *         - Applies the payment amount to each selected invoice
 *         - Creates a Payment record per invoice
 *         - Creates a single IncomeRecord for the full transaction amount
 *       If the reference has already been processed, a 200 response is returned
 *       with `alreadyProcessed: true` — no duplicate records are created.
 *     tags: [Parent Fees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reference
 *             properties:
 *               reference:
 *                 type: string
 *                 description: The Paystack transaction reference returned from the initialize step
 *                 example: "pstk_ref_xyz789"
 *     responses:
 *       200:
 *         description: Payment verified and applied (or already processed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Payment verified and applied successfully"
 *                 data:
 *                   status: success
 *                   reference: "pstk_ref_xyz789"
 *                   amount: 75000
 *                   studentId: "stu_abc123"
 *                   alreadyProcessed: false
 *       400:
 *         description: Payment reference missing or invalid, or verification failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/pay/verify",
	authenticateParent,
	validate(verifyPaymentSchema),
	verifyFeePayment,
);

/**
 * @swagger
 * /api/parent/fees/webhook/verify:
 *   post:
 *     summary: Paystack server-to-server webhook — verify payment
 *     description: >
 *       Receives Paystack's server-to-server payment notification.
 *       Validates the `x-paystack-signature` header before processing.
 *       Do NOT call this from the frontend — it is for Paystack's servers only.
 *       No bearer token required.
 *     tags: [Parent Fees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reference
 *             properties:
 *               reference:
 *                 type: string
 *                 example: "pstk_ref_xyz789"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Payment verified and applied successfully"
 *                 data: { status: success, reference: "pstk_ref_xyz789", amount: 75000 }
 *       400:
 *         description: Payment reference missing or verification failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid Paystack signature
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UnauthorizedResponse' }
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/webhook/verify",
	webhookLimiter,
	verifyPaystackSignature,
	validate(verifyPaymentSchema),
	verifyFeePayment,
);

/**
 * @swagger
 * /api/parent/fees/{studentId}/overview:
 *   get:
 *     summary: Get fee overview for a student
 *     description: >
 *       Returns total fees charged, total amount paid, total outstanding balance,
 *       and a full invoice-by-invoice breakdown for the given student.
 *       Only the authenticated parent who owns the student may access this endpoint.
 *     tags: [Parent Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the student whose fee overview is being requested
 *     responses:
 *       200:
 *         description: Fee overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Fee overview retrieved successfully"
 *                 data:
 *                   totalFees: 250000
 *                   totalPaid: 150000
 *                   totalOutstanding: 100000
 *                   breakdown:
 *                     - id: "inv_abc123"
 *                       status: PARTIAL
 *                       amount: 75000
 *                       amountPaid: 25000
 *       400:
 *         description: Student not found or not linked to your account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:studentId/overview", authenticateParent, getFeeOverview);
/**
 * @swagger
 * /api/parent/fees/{studentId}/outstanding:
 *   get:
 *     summary: Get all outstanding invoice IDs and total for a student
 *     description: >
 *       Returns all unpaid or partially paid invoice IDs for the student,
 *       along with the total outstanding amount and invoice count.
 *       Designed for the "Pay All" flow — pass the returned invoiceIds directly
 *       into the initialize payment endpoint to pay everything at once.
 *     tags: [Parent Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the student
 *     responses:
 *       200:
 *         description: Outstanding invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Outstanding invoices retrieved successfully"
 *                 data:
 *                   invoiceIds: ["inv_abc123", "inv_def456", "inv_ghi789"]
 *                   total: 125000
 *                   count: 3
 *       400:
 *         description: Student not found or not linked to your account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/:studentId/outstanding",
	authenticateParent,
	getOutstandingInvoiceIds,
);

/**
 * @swagger
 * /api/parent/fees/{studentId}/payments:
 *   get:
 *     summary: Get paginated payment history for a student
 *     description: >
 *       Returns a paginated list of fee payments made for the given student.
 *       Supports filtering by date range and payment status, sorting by field,
 *       and a free-text search. All query parameters are optional.
 *     tags: [Parent Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the student
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of records per page (max 100)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [paymentDate, amount, createdAt]
 *           default: paymentDate
 *         description: Field to sort results by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *         description: Filter by payment status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-01"
 *         description: Filter payments from this date (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-06-30"
 *         description: Filter payments up to this date (inclusive)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "paystack"
 *         description: Free-text search against payment reference or description
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Payment history retrieved successfully"
 *                 data:
 *                   - id: "pay_01"
 *                     amount: 75000
 *                     status: COMPLETED
 *                     paymentDate: "2025-01-15T00:00:00.000Z"
 *                     invoice: { id: "inv_abc123", status: PAID }
 *                 pagination: { total: 4, page: 1, limit: 20, totalPages: 1 }
 *       400:
 *         description: Invalid startDate/endDate, or student not found/not linked to your account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/:studentId/payments",
	authenticateParent,
	validate(paymentHistoryQuerySchema, "query"),
	getPaymentHistory,
);

/**
 * @swagger
 * /api/parent/fees/{studentId}/pay/initialize:
 *   post:
 *     summary: Initialize a Paystack fee payment
 *     description: >
 *       Starts a Paystack payment session for one or more outstanding invoices.
 *       Returns a Paystack authorization URL that the frontend should redirect the user to.
 *       Only unpaid or partially paid invoices belonging to the student are accepted.
 *     tags: [Parent Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the student on whose behalf payment is being made
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceIds
 *             properties:
 *               invoiceIds:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                 description: One or more invoice IDs to pay in this transaction
 *                 example: ["inv_abc123", "inv_def456"]
 *     responses:
 *       200:
 *         description: Paystack transaction initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Payment initialized successfully"
 *                 data:
 *                   authorizationUrl: "https://checkout.paystack.com/abc123"
 *                   reference: "pstk_ref_xyz789"
 *                   amount: 75000
 *                   invoices:
 *                     - id: "inv_abc123"
 *                       status: PARTIAL
 *       400:
 *         description: invoiceIds missing or empty, invoice not found, or invoice does not belong to student
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/:studentId/pay/initialize",
	authenticateParent,
	validate(initializeFeePaymentSchema),
	initializeFeePayment,
);

module.exports = router;
