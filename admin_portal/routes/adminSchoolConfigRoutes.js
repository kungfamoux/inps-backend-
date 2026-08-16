const express = require("express");
const router = express.Router();

const {
	createSession,
	getAllSessions,
	getSessionById,
	updateSession,
	deleteSession,
	createTerm,
	updateTermStatus,
	updateTerm,
	deleteTerm,
	getCurrentTerm,
	getCurrentSession,
	setCurrentSessionAndTerm,
	getTermsBySession,
	createCalendar,
	getAllCalendars,
	updateCalendar,
	addHoliday,
	removeHoliday,
	updateHoliday,
	createConfig,
	updateConfig,
	getConfig,
	getAllConfigs,
	deleteConfig,
} = require("../controller/AdminSchoolConfigController");

const {
	getCurrentConfig: getCurrentSchoolConfig,
	setCurrentConfig: setCurrentSchoolConfig,
} = require("../controller/SchoolConfigController");

const { authenticate, requireAdmin, validate } = require("../../middleware");
const {
	createSessionSchema,
	updateSessionSchema,
	createTermSchema,
	updateTermStatusSchema,
	updateTermSchema,
	createCalendarSchema,
	getAllCalendarsQuerySchema,
	addHolidaySchema,
	updateHolidaySchema,
	updateCalendarSchema,
	createConfigSchema,
	updateConfigSchema,
} = require("../validators/adminSchoolConfig.validator");

/**
 * @swagger
 * tags:
 *   name: Admin - School Config
 *   description: Academic sessions, terms, calendar, and promotion policy
 */

// ─── Sessions ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/config/sessions:
 *   post:
 *     summary: Create a new academic session
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session]
 *             properties:
 *               session:
 *                 type: string
 *                 example: "2024/2025"
 *     responses:
 *       201:
 *         description: Session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Session created"
 *                 data: { id: "sess_01", session: "2024/2025", status: UPCOMING }
 *       400:
 *         description: Session already exists or missing fields
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
	"/sessions",
	authenticate,
	requireAdmin,
	validate(createSessionSchema),
	createSession,
);

/**
 * @swagger
 * /api/admin/config/sessions:
 *   get:
 *     summary: Get all academic sessions (includes terms)
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "sess_01"
 *                     session: "2024/2025"
 *                     status: CURRENT
 *                     terms: [{ id: "term_01", term: FIRST_TERM, status: CURRENT }]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/sessions", authenticate, requireAdmin, getAllSessions);

/**
 * @swagger
 * /api/admin/config/sessions/current:
 *   get:
 *     summary: Get the current academic session
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current session with terms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "sess_01"
 *                   session: "2024/2025"
 *                   status: CURRENT
 *                   terms: [{ id: "term_01", term: FIRST_TERM, status: CURRENT }]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: No current session set
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/sessions/current", authenticate, requireAdmin, getCurrentSession);

/**
 * @swagger
 * /api/admin/config/sessions/{id}:
 *   get:
 *     summary: Get a single session by ID
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session record with terms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "sess_01"
 *                   session: "2024/2025"
 *                   status: CURRENT
 *                   terms: [{ id: "term_01", term: FIRST_TERM, status: CURRENT }]
 *       400:
 *         description: Session not found
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
router.get("/sessions/:id", authenticate, requireAdmin, getSessionById);

/**
 * @swagger
 * /api/admin/config/sessions/{id}/terms:
 *   get:
 *     summary: Get all terms for a session
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of terms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "term_01"
 *                     term: FIRST_TERM
 *                     status: CURRENT
 *                     startDate: "2024-09-09T00:00:00.000Z"
 *                     endDate: "2024-12-13T00:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/sessions/:id/terms",
	authenticate,
	requireAdmin,
	getTermsBySession,
);

/**
 * @swagger
 * /api/admin/config/sessions/{id}:
 *   patch:
 *     summary: Update a session's details
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session: { type: string, example: "2025/2026" }
 *     responses:
 *       200:
 *         description: Session updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Session updated"
 *                 data: { id: "sess_01", session: "2025/2026", status: UPCOMING }
 *       400:
 *         description: Session not found
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
	"/sessions/:id",
	authenticate,
	requireAdmin,
	validate(updateSessionSchema),
	updateSession,
);

/**
 * @swagger
 * /api/admin/config/sessions/{id}:
 *   delete:
 *     summary: Delete a session
 *     description: Cannot delete a session that is currently active.
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Session deleted"
 *       400:
 *         description: Session not found or currently active
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
	"/sessions/:id",
	authenticate,
	requireAdmin,
	deleteSession,
);

// ─── Terms ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/config/terms:
 *   post:
 *     summary: Create a new term under a session
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, term, startDate, endDate]
 *             properties:
 *               sessionId:  { type: string }
 *               term:       { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *               startDate:  { type: string, format: date, example: "2024-09-09" }
 *               endDate:    { type: string, format: date, example: "2024-12-13" }
 *     responses:
 *       201:
 *         description: Term created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Term created"
 *                 data: { id: "term_01", term: FIRST_TERM, status: UPCOMING, startDate: "2024-09-09T00:00:00.000Z", endDate: "2024-12-13T00:00:00.000Z" }
 *       400:
 *         description: Term already exists or missing fields
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
	"/terms",
	authenticate,
	requireAdmin,
	validate(createTermSchema),
	createTerm,
);

/**
 * @swagger
 * /api/admin/config/terms/current:
 *   get:
 *     summary: Get the current active term
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current term
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data: { id: "term_01", term: FIRST_TERM, status: CURRENT, session: { session: "2024/2025" } }
 *       400:
 *         description: No current term set
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
router.get("/terms/current", authenticate, requireAdmin, getCurrentTerm);

/**
 * @swagger
 * /api/admin/config/school/current:
 *   get:
 *     summary: Get current school configuration
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current school config
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "singleton"
 *                   currentSessionId: "sess_01"
 *                   currentTermId: "term_01"
 *                   academicYear: "2024/2025"
 *                   currentTerm: "FIRST_TERM"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: No current config set
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/school/current", authenticate, requireAdmin, getCurrentSchoolConfig);

/**
 * @swagger
 * /api/admin/config/school/current:
 *   post:
 *     summary: Set current school configuration
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, termId]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "sess_01"
 *               termId:
 *                 type: string
 *                 example: "term_01"
 *     responses:
 *       200:
 *         description: Current school config set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Current config set"
 *                 data:
 *                   id: "singleton"
 *                   currentSessionId: "sess_01"
 *                   currentTermId: "term_01"
 *                   academicYear: "2024/2025"
 *                   currentTerm: "FIRST_TERM"
 *       400:
 *         description: Missing parameters, not found, or term doesn't belong to session
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
router.post("/school/current", authenticate, requireAdmin, setCurrentSchoolConfig);

/**
 * @swagger
 * /api/admin/config/current:
 *   put:
 *     summary: Set both current session and term atomically
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, termId]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "sess_01"
 *               termId:
 *                 type: string
 *                 example: "term_01"
 *     responses:
 *       200:
 *         description: Current session and term set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Current session and term set"
 *                 data:
 *                   session: { id: "sess_01", session: "2024/2025", status: CURRENT }
 *                   term: { id: "term_01", term: FIRST_TERM, status: CURRENT }
 *       400:
 *         description: Missing parameters, not found, or term doesn't belong to session
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
router.put("/current", authenticate, requireAdmin, setCurrentSessionAndTerm);

/**
 * @swagger
 * /api/admin/config/terms/{id}/status:
 *   patch:
 *     summary: Update a term's status
 *     description: |
 *       Single endpoint replacing the old separate set-current and complete endpoints.
 *       - status=CURRENT → activates the term (sessionId required)
 *       - status=COMPLETED → closes the term
 *       - status=UPCOMING → resets the term
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CURRENT, COMPLETED, UPCOMING]
 *               sessionId:
 *                 type: string
 *                 description: Required when setting status to CURRENT
 *     responses:
 *       200:
 *         description: Term status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Term status updated to CURRENT"
 *                 data: { id: "term_01", term: FIRST_TERM, status: CURRENT }
 *       400:
 *         description: status missing, term not found, or invalid status
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
	"/terms/:id/status",
	authenticate,
	requireAdmin,
	validate(updateTermStatusSchema),
	updateTermStatus,
);

/**
 * @swagger
 * /api/admin/config/terms/{id}:
 *   patch:
 *     summary: Update a term's details (dates)
 *     description: Does not update status — use PATCH /terms/{id}/status for that.
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate: { type: string, format: date }
 *               endDate:   { type: string, format: date }
 *     responses:
 *       200:
 *         description: Term updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Term updated"
 *                 data: { id: "term_01", term: FIRST_TERM, startDate: "2024-09-09T00:00:00.000Z", endDate: "2024-12-20T00:00:00.000Z" }
 *       400:
 *         description: Term not found
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
	"/terms/:id",
	authenticate,
	requireAdmin,
	validate(updateTermSchema),
	updateTerm,
);

/**
 * @swagger
 * /api/admin/config/terms/{id}:
 *   delete:
 *     summary: Delete a term
 *     description: Cannot delete a term that is currently active.
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Term deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Term deleted"
 *       400:
 *         description: Term not found or currently active
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
router.delete("/terms/:id", authenticate, requireAdmin, deleteTerm);

// ─── Calendar ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/config/calendars:
 *   post:
 *     summary: Create a school calendar for a term
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [academicYear, term, startDate, endDate]
 *             properties:
 *               academicYear: { type: string, example: "2024/2025" }
 *               term:         { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *               startDate:    { type: string, format: date }
 *               endDate:      { type: string, format: date }
 *     responses:
 *       201:
 *         description: Calendar created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Calendar created"
 *                 data: { id: "cal_01", academicYear: "2024/2025", term: FIRST_TERM, startDate: "2024-09-09T00:00:00.000Z", endDate: "2024-12-13T00:00:00.000Z" }
 *       400:
 *         description: Already exists or missing fields
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
	"/calendars",
	authenticate,
	requireAdmin,
	validate(createCalendarSchema),
	createCalendar,
);

/**
 * @swagger
 * /api/admin/config/calendars:
 *   get:
 *     summary: Get all school calendars with holidays
 *     description: |
 *       Optionally filter by academicYear and/or term.
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema: { type: string, example: "2024/2025" }
 *       - in: query
 *         name: term
 *         schema: { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *     responses:
 *       200:
 *         description: List of calendars with holidays
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "cal_01"
 *                     academicYear: "2024/2025"
 *                     term: FIRST_TERM
 *                     holidays: [{ id: "hol_01", name: "Christmas Break", type: SCHOOL }]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/calendars",
	authenticate,
	requireAdmin,
	validate(getAllCalendarsQuerySchema, "query"),
	getAllCalendars,
);

/**
 * @swagger
 * /api/admin/config/calendars/holidays:
 *   post:
 *     summary: Add a holiday to a calendar
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [calendarId, name, startDate, endDate, type]
 *             properties:
 *               calendarId: { type: string }
 *               name:       { type: string, example: "Christmas Break" }
 *               startDate:  { type: string, format: date }
 *               endDate:    { type: string, format: date }
 *               type:       { type: string, enum: [PUBLIC, SCHOOL, RELIGIOUS, EXAM] }
 *     responses:
 *       201:
 *         description: Holiday added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Holiday added"
 *                 data: { id: "hol_01", name: "Christmas Break", type: SCHOOL, startDate: "2024-12-16T00:00:00.000Z", endDate: "2025-01-06T00:00:00.000Z" }
 *       400:
 *         description: Missing fields
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
	"/calendars/holidays",
	authenticate,
	requireAdmin,
	validate(addHolidaySchema),
	addHoliday,
);

/**
 * @swagger
 * /api/admin/config/calendars/holidays/{holidayId}:
 *   patch:
 *     summary: Update a holiday
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: holidayId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:      { type: string, example: "Easter Break" }
 *               startDate: { type: string, format: date }
 *               endDate:   { type: string, format: date }
 *               type:      { type: string, enum: [PUBLIC, SCHOOL, RELIGIOUS, EXAM] }
 *     responses:
 *       200:
 *         description: Holiday updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Holiday updated"
 *                 data: { id: "hol_01", name: "Easter Break", type: RELIGIOUS }
 *       400:
 *         description: Holiday not found
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
	"/calendars/holidays/:holidayId",
	authenticate,
	requireAdmin,
	validate(updateHolidaySchema),
	updateHoliday,
);

/**
 * @swagger
 * /api/admin/config/calendars/holidays/{holidayId}:
 *   delete:
 *     summary: Remove a holiday
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: holidayId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Holiday removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Holiday removed"
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
	"/calendars/holidays/:holidayId",
	authenticate,
	requireAdmin,
	removeHoliday,
);

/**
 * @swagger
 * /api/admin/config/calendars/{calendarId}:
 *   patch:
 *     summary: Update a school calendar
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: calendarId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               academicYear:  { type: string, example: "2024/2025" }
 *               term:          { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *               startDate:     { type: string, format: date }
 *               endDate:       { type: string, format: date }
 *               isCurrentTerm: { type: boolean }
 *     responses:
 *       200:
 *         description: Calendar updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Calendar updated"
 *                 data: { id: "cal_01", academicYear: "2024/2025", term: FIRST_TERM }
 *       400:
 *         description: Calendar not found
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
	"/calendars/:calendarId",
	authenticate,
	requireAdmin,
	validate(updateCalendarSchema),
	updateCalendar,
);

// ─── School Configuration (Promotion Policy + Grading) ──────────────────────

/**
 * @swagger
 * /api/admin/config/policy:
 *   post:
 *     summary: Create promotion policy and grading config for a term
 *     description: |
 *       Grading thresholds from report card:
 *       A = Distinction (90+), C = Credit (70-89), P = Pass (55-69), F = Fail (below 54)
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [academicYear, term]
 *             properties:
 *               academicYear:            { type: string, example: "2024/2025" }
 *               term:                    { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *               maxStudentsPerClass:     { type: integer, default: 30 }
 *               minAverageScore:         { type: number,  default: 40 }
 *               minAttendancePercentage: { type: number,  default: 75 }
 *               maxFailedSubjects:       { type: integer, default: 3 }
 *               passMark:                { type: number,  default: 55 }
 *               creditMark:              { type: number,  default: 70 }
 *               distinctionMark:         { type: number,  default: 90 }
 *     responses:
 *       201:
 *         description: Configuration created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Configuration created"
 *                 data: { id: "cfg_01", academicYear: "2024/2025", term: FIRST_TERM, passMark: 55, creditMark: 70, distinctionMark: 90 }
 *       400:
 *         description: Config already exists or missing fields
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
	"/policy",
	authenticate,
	requireAdmin,
	validate(createConfigSchema),
	createConfig,
);

/**
 * @swagger
 * /api/admin/config/policy:
 *   get:
 *     summary: Get all promotion policy configurations
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "cfg_01"
 *                     academicYear: "2024/2025"
 *                     term: FIRST_TERM
 *                     passMark: 55
 *                     creditMark: 70
 *                     distinctionMark: 90
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/policy", authenticate, requireAdmin, getAllConfigs);

/**
 * @swagger
 * /api/admin/config/policy/{academicYear}/{term}:
 *   get:
 *     summary: Get promotion policy for a specific term
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: academicYear
 *         required: true
 *         schema: { type: string }
 *         example: "2024/2025"
 *       - in: path
 *         name: term
 *         required: true
 *         schema: { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *     responses:
 *       200:
 *         description: Configuration record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data: { id: "cfg_01", academicYear: "2024/2025", term: FIRST_TERM, passMark: 55, creditMark: 70, distinctionMark: 90 }
 *       400:
 *         description: Configuration not found
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
	"/policy/:academicYear/:term",
	authenticate,
	requireAdmin,
	getConfig,
);

/**
 * @swagger
 * /api/admin/config/policy/{academicYear}/{term}:
 *   patch:
 *     summary: Update promotion policy for a term
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: academicYear
 *         required: true
 *         schema: { type: string }
 *         example: "2024/2025"
 *       - in: path
 *         name: term
 *         required: true
 *         schema: { type: string }
 *         example: "FIRST_TERM"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxStudentsPerClass:     { type: integer, example: 30 }
 *               minAverageScore:         { type: number,  example: 40 }
 *               minAttendancePercentage: { type: number,  example: 75 }
 *               maxFailedSubjects:       { type: integer, example: 3 }
 *               passMark:                { type: number,  example: 55 }
 *               creditMark:              { type: number,  example: 70 }
 *               distinctionMark:         { type: number,  example: 90 }
 *     responses:
 *       200:
 *         description: Configuration updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Configuration updated"
 *                 data: { id: "cfg_01", academicYear: "2024/2025", term: FIRST_TERM, passMark: 55 }
 *       400:
 *         description: Not found or validation error
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
	"/policy/:academicYear/:term",
	authenticate,
	requireAdmin,
	validate(updateConfigSchema),
	updateConfig,
);

/**
 * @swagger
 * /api/admin/config/policy/{academicYear}/{term}:
 *   delete:
 *     summary: Delete a promotion policy configuration
 *     tags: [Admin - School Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: academicYear
 *         required: true
 *         schema: { type: string }
 *         example: "2024/2025"
 *       - in: path
 *         name: term
 *         required: true
 *         schema: { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *     responses:
 *       200:
 *         description: Configuration deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Configuration deleted"
 *       400:
 *         description: Configuration not found
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
	"/policy/:academicYear/:term",
	authenticate,
	requireAdmin,
	deleteConfig,
);

module.exports = router;
