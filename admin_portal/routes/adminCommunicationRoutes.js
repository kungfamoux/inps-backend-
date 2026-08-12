const express = require("express");
const router = express.Router();
const ctrl = require("../controller/AdminCommunicationController");
const { authenticate, requireRoles, validate } = require("../../middleware");
const {
	createCommunicationSchema,
	updateCommunicationSchema,
	getAllCommunicationsQuerySchema,
} = require("../validators/adminCommunication.validator");

const adminOnly = requireRoles(["ADMIN", "HEAD_TEACHER"]);

/**
 * @swagger
 * tags:
 *   name: Communications
 *   description: Newsletter and announcement management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Communication:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         type:
 *           type: string
 *           enum: [NEWSLETTER, ANNOUNCEMENT]
 *         target:
 *           type: string
 *           enum: [ALL, PARENTS, STAFF]
 *         announcementCategory:
 *           type: string
 *           enum: [GENERAL, URGENT, CLASS_UPDATE]
 *           nullable: true
 *           description: Only set when type is ANNOUNCEMENT
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         sentAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CommunicationInput:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - type
 *         - target
 *       properties:
 *         title:
 *           type: string
 *           example: End of Term Notice
 *         content:
 *           type: string
 *           example: Dear parents, the third term ends on July 18th.
 *         type:
 *           type: string
 *           enum: [NEWSLETTER, ANNOUNCEMENT]
 *           example: ANNOUNCEMENT
 *         target:
 *           type: string
 *           enum: [ALL, PARENTS, STAFF]
 *           example: PARENTS
 *         announcementCategory:
 *           type: string
 *           enum: [GENERAL, URGENT, CLASS_UPDATE]
 *           description: Required when type is ANNOUNCEMENT; omit for NEWSLETTER
 *           example: URGENT
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *           example: DRAFT
 *
 *     PaginatedCommunications:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Communication'
 *         meta:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @swagger
 * /api/admin/communications:
 *   post:
 *     summary: Create a newsletter or announcement
 *     tags: [Communications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommunicationInput'
 *     responses:
 *       201:
 *         description: Communication created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 *       400:
 *         description: Validation error or missing fields
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
	adminOnly,
	validate(createCommunicationSchema),
	ctrl.create,
);

/**
 * @swagger
 * /api/admin/communications:
 *   get:
 *     summary: Get all newsletters and announcements
 *     tags: [Communications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [NEWSLETTER, ANNOUNCEMENT]
 *         description: Filter by type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *         description: Filter by status
 *       - in: query
 *         name: target
 *         schema:
 *           type: string
 *           enum: [ALL, PARENTS, STAFF]
 *         description: Filter by target audience
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
 *         description: List of communications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedCommunications'
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
	adminOnly,
	validate(getAllCommunicationsQuerySchema, "query"),
	ctrl.getAll,
);

/**
 * @swagger
 * /api/admin/communications/{id}:
 *   get:
 *     summary: Get a single communication by ID
 *     tags: [Communications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Communication ID
 *     responses:
 *       200:
 *         description: Communication found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 *       400:
 *         description: Communication not found
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
router.get("/:id", authenticate, adminOnly, ctrl.getById);

/**
 * @swagger
 * /api/admin/communications/{id}:
 *   put:
 *     summary: Update a newsletter or announcement
 *     tags: [Communications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Communication ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               target:
 *                 type: string
 *                 enum: [ALL, PARENTS, STAFF]
 *               announcementCategory:
 *                 type: string
 *                 enum: [GENERAL, URGENT, CLASS_UPDATE]
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ARCHIVED]
 *     responses:
 *       200:
 *         description: Communication updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 *       400:
 *         description: Communication not found, or cannot edit a communication that has already been sent
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
router.put(
	"/:id",
	authenticate,
	adminOnly,
	validate(updateCommunicationSchema),
	ctrl.update,
);

/**
 * @swagger
 * /api/admin/communications/{id}:
 *   delete:
 *     summary: Delete a newsletter or announcement
 *     tags: [Communications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Communication ID
 *     responses:
 *       200:
 *         description: Communication deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Communication deleted
 *       400:
 *         description: Communication not found, or cannot delete a communication that has already been sent
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
router.delete("/:id", authenticate, adminOnly, ctrl.deleteOne);

/**
 * @swagger
 * /api/admin/communications/{id}/publish:
 *   patch:
 *     summary: Publish a newsletter or announcement
 *     description: Marks the communication as PUBLISHED and sets publishedAt. Used for announcements shown on the parent/teacher dashboard.
 *     tags: [Communications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Communication ID
 *     responses:
 *       200:
 *         description: Communication published
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 *       400:
 *         description: Communication not found or already published
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
router.patch("/:id/publish", authenticate, adminOnly, ctrl.publish);

/**
 * @swagger
 * /api/admin/communications/{id}/send:
 *   patch:
 *     summary: Send a newsletter via email
 *     description: Dispatches the communication to all recipients in the target group via Resend. Marks it as sent — cannot be sent again.
 *     tags: [Communications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Communication ID
 *     responses:
 *       200:
 *         description: Communication sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Communication'
 *       400:
 *         description: Communication not found, already sent, or no recipients found
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
router.patch("/:id/send", authenticate, adminOnly, ctrl.send);

module.exports = router;
