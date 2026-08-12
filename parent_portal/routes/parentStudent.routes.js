const express = require("express");
const router = express.Router();

const {
	parentLogin,
	getMe,
	changePassword,
	getMyChildren,
	getChildProfile,
	getChildResults,
	getChildAttendanceRate,
	getChildTimetable,
	getAnnouncements,
	getUnreadAnnouncementCount,
	markAnnouncementRead,
	getOutstandingFees,
	getPaymentHistory,
} = require("../controller/ParentStudentController");

const {
	authenticateParent,
	loginLimiter,
	validate,
} = require("../../middleware");

// Import config functions for sessions/terms
const {
	getAllSessions,
	getCurrentTerm,
	getCurrentSession,
} = require("../../admin_portal/controller/AdminSchoolConfigController");

const {
	parentLoginSchema,
	changePasswordSchema,
	childResultsQuerySchema,
	childAttendanceQuerySchema,
	announcementsQuerySchema,
	paginationQuerySchema,
} = require("../validators/parentStudent.validator");

/**
 * @swagger
 * tags:
 *   name: Parent Portal
 *   description: Parent login, child profiles, results, attendance, fees, and announcements
 */

//  AUTH

/**
 * @swagger
 * /api/parent/login:
 *   post:
 *     summary: Parent login
 *     description: |
 *       Login with email and phone number as password.
 *       Default password is the phone number set by admin (digits only).
 *       Parents can change their password after login.
 *     tags: [Parent Portal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: parent@example.com
 *               password:
 *                 type: string
 *                 description: Default is phone number (digits only)
 *                 example: "08152622312"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user: { id: "parent_01", accountEmail: "parent@example.com", accountPhone: "08152622312" }
 *       400:
 *         description: Email and password are required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UnauthorizedResponse' }
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
	"/login",
	loginLimiter,
	validate(parentLoginSchema),
	parentLogin,
);

/**
 * @swagger
 * /api/parent/me:
 *   get:
 *     summary: Get the authenticated parent's profile
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parent profile with linked children
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "parent_01"
 *                   accountEmail: "parent@example.com"
 *                   accountPhone: "08152622312"
 *                   students: [{ admissionNumber: "INPSE-2024-001", firstName: "Ada", lastName: "Obi" }]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/me", authenticateParent, getMe);

/**
 * @swagger
 * /api/parent/change-password:
 *   patch:
 *     summary: Change password
 *     description: Parent can change their password from the default phone number to a private one.
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: The parent's current password, verified before the change is applied
 *               newPassword:
 *                 type: string
 *                 description: Minimum 6 characters, must differ from currentPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Password changed successfully"
 *       400:
 *         description: Missing fields, password too short, or current password incorrect
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/change-password",
	authenticateParent,
	validate(changePasswordSchema),
	changePassword,
);

//  CHILDREN

/**
 * @swagger
 * /api/parent/children:
 *   get:
 *     summary: Get all children linked to the parent
 *     description: Returns profile cards for each child with their current class.
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of children with class enrollment info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - admissionNumber: "INPSE-2024-001"
 *                     firstName: "Ada"
 *                     lastName: "Obi"
 *                     class: { name: "Primary 5", section: "Red" }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/children", authenticateParent, getMyChildren);

/**
 * @swagger
 * /api/parent/children/{studentId}:
 *   get:
 *     summary: Get a child's full profile
 *     description: |
 *       Returns name, class, section, session, term, admission number,
 *       date of birth, gender, home address, and parent (father/mother) info.
 *       Parents can view but not edit this data.
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full child profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   admissionNumber: "INPSE-2024-001"
 *                   firstName: "Ada"
 *                   lastName: "Obi"
 *                   gender: FEMALE
 *                   dateOfBirth: "2015-03-10T00:00:00.000Z"
 *                   address: "12 School Road"
 *                   class: { name: "Primary 5" }
 *                   section: { name: "Red" }
 *       400:
 *         description: Child not found or not linked to your account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/children/:studentId", authenticateParent, getChildProfile);

//  RESULTS

/**
 * @swagger
 * /api/parent/children/{studentId}/results:
 *   get:
 *     summary: View a child's results for a term
 *     description: |
 *       Only verified results are returned.
 *       Results are hidden if not yet released by admin (resultViewingEnabled = false).
 *
 *       Controlled by the `filter` query parameter:
 *
 *       **filter=detail** (default)
 *       Full subject-level results: CA1, CA2, Exam, Total, Grade, and teacher remarks.
 *
 *       **filter=summary**
 *       Aggregated view: total subjects, subjects passed, average score,
 *       overall class position, per-subject position, class average per subject,
 *       class teacher remark, and head teacher remark.
 *     tags: [Parent Portal]
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
 *       - in: query
 *         name: filter
 *         required: false
 *         schema:
 *           type: string
 *           enum: [detail, summary]
 *           default: detail
 *         description: Switch between full subject results and aggregated summary
 *     responses:
 *       200:
 *         description: Results for the term (detail or summary depending on filter)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               examples:
 *                 detail:
 *                   summary: filter=detail
 *                   value:
 *                     success: true
 *                     data:
 *                       results:
 *                         - subject: { subjectName: Mathematics, subjectCode: MTH }
 *                           scores: { ca1: 25, ca2: 27, exam: 35, total: 87, grade: C }
 *                           subjectTeacherRemark: "Excellent effort"
 *                       classTeacherRemark: "Very hardworking student"
 *                       headTeacherRemark: "A diligent student. Keep it up."
 *                 summary:
 *                   summary: filter=summary
 *                   value:
 *                     success: true
 *                     data:
 *                       totalSubjects: 9
 *                       subjectsPassed: 8
 *                       averageScore: 74.5
 *                       overallPosition: 3
 *       400:
 *         description: Results not yet released, invalid filter, missing params, or child not linked to your account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/children/:studentId/results",
	authenticateParent,
	validate(childResultsQuerySchema, "query"),
	getChildResults,
);

//  ATTENDANCE

/**
 * @swagger
 * /api/parent/children/{studentId}/attendance:
 *   get:
 *     summary: Get a child's attendance rate
 *     description: |
 *       Returns total days, days present, late, excused, absent,
 *       and an overall attendance rate percentage.
 *       Optionally filter by date range.
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         example: "2024-09-09"
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         example: "2024-12-13"
 *     responses:
 *       200:
 *         description: Attendance breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:          { type: integer }
 *                     present:        { type: integer }
 *                     late:           { type: integer }
 *                     excused:        { type: integer }
 *                     absent:         { type: integer }
 *                     attendanceRate: { type: number, example: 94.5 }
 *       400:
 *         description: Child not found or not linked to your account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/children/:studentId/attendance",
	authenticateParent,
	validate(childAttendanceQuerySchema, "query"),
	getChildAttendanceRate,
);

//  TIMETABLE

/**
 * @swagger
 * /api/parent/children/{studentId}/timetable:
 *   get:
 *     summary: View a child's class timetable
 *     description: |
 *       Returns the full weekly timetable for the child's enrolled section.
 *       Grouped by day of week.
 *       e.g. Primary 1 Yellow: Mathematics on Monday at 08:00 by Mr. Obi
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Timetable grouped by day
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         subject:   { type: string, example: "Mathematics" }
 *                         startTime: { type: string, example: "08:00" }
 *                         endTime:   { type: string, example: "09:00" }
 *                         teacher:   { type: string, example: "Mr. Obi" }
 *       400:
 *         description: Child not found or not linked to your account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/children/:studentId/timetable",
	authenticateParent,
	getChildTimetable,
);

//  ANNOUNCEMENTS

/**
 * @swagger
 * /api/parent/announcements:
 *   get:
 *     summary: Get all published announcements (paginated)
 *     description: |
 *       Returns school announcements visible to parents.
 *       Each item includes an isRead flag.
 *       Filter by category: GENERAL, URGENT, CLASS_UPDATE.
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [GENERAL, URGENT, CLASS_UPDATE]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of announcements with isRead flag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "comm_01"
 *                     title: "End of Term Notice"
 *                     content: "The term ends on Friday."
 *                     announcementCategory: GENERAL
 *                     isRead: false
 *                 meta: { total: 8, page: 1, limit: 20, totalPages: 1 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/announcements",
	authenticateParent,
	validate(announcementsQuerySchema, "query"),
	getAnnouncements,
);

/**
 * @swagger
 * /api/parent/announcements/unread:
 *   get:
 *     summary: Get unread announcement count (for badge/notification)
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     unread: { type: integer }
 *                     total:  { type: integer }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/announcements/unread",
	authenticateParent,
	getUnreadAnnouncementCount,
);

/**
 * @swagger
 * /api/parent/announcements/{announcementId}/read:
 *   patch:
 *     summary: Mark an announcement as read
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Announcement marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Announcement marked as read"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/announcements/:announcementId/read",
	authenticateParent,
	markAnnouncementRead,
);

//  FEES

/**
 * @swagger
 * /api/parent/children/{studentId}/fees:
 *   get:
 *     summary: Get outstanding fees for a child
 *     description: Returns all unpaid or partially paid invoices with the total balance due.
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Outstanding invoices and total amount due
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOutstanding: { type: number }
 *                     invoices:         { type: array }
 *       400:
 *         description: Child not found or not linked to your account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/children/:studentId/fees", authenticateParent, getOutstandingFees);

/**
 * @swagger
 * /api/parent/children/{studentId}/payments:
 *   get:
 *     summary: Get payment history for a child (paginated)
 *     description: Returns all completed payments with invoice details.
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated payment history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "pay_01"
 *                     amount: 50000
 *                     status: COMPLETED
 *                     invoice: { id: "inv_01", status: PARTIAL }
 *                 meta: { total: 4, page: 1, limit: 20, totalPages: 1 }
 *       400:
 *         description: Child not found or not linked to your account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/children/:studentId/payments",
	authenticateParent,
	validate(paginationQuerySchema, "query"),
	getPaymentHistory,
);

//  CONFIG (Sessions and Terms for parent dropdowns)

/**
 * @swagger
 * /api/parent/config/sessions:
 *   get:
 *     summary: Get all academic sessions
 *     description: Returns all academic sessions for parent dropdowns in results viewing
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all academic sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "sess_01"
 *                     session: "2024/2025"
 *                     status: ACTIVE
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/config/sessions", authenticateParent, getAllSessions);

/**
 * @swagger
 * /api/parent/config/terms/current:
 *   get:
 *     summary: Get current academic term
 *     description: Returns the currently active term for parent context
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current term information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "term_01"
 *                   name: "First Term"
 *                   status: ACTIVE
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/config/terms/current", authenticateParent, getCurrentTerm);

/**
 * @swagger
 * /api/parent/config/sessions/current:
 *   get:
 *     summary: Get current academic session
 *     description: Returns the currently active session for parent context
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current session information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "sess_01"
 *                   session: "2024/2025"
 *                   status: ACTIVE
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/config/sessions/current", authenticateParent, getCurrentSession);

module.exports = router;
