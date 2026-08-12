const express = require("express");
const router = express.Router();

const {
	getStudentsInMyClass,
	getStudentByAdmissionNumber,
	getTotalStudentsInMyClass,
	markAttendance,
	getAttendanceByDate,
	getAttendanceSummary,
	getPendingTasks,
	getSchedule,
	emailAllParents,
	emailOneParent,
} = require("../controller/TeacherStudentController");

const { authenticate, requireTeacher, validate } = require("../../middleware");

const {
	getStudentsQuerySchema,
	markAttendanceSchema,
	getAttendanceQuerySchema,
	getScheduleQuerySchema,
	emailParentSchema,
} = require("../validators/teacherStudent.validator");

/**
 * @swagger
 * tags:
 *   name: Teacher - Students
 *   description: Class management, attendance, schedule, and parent communication
 */

// STUDENTS

/**
 * @swagger
 * /api/teacher/students:
 *   get:
 *     summary: Get all students in the teacher's assigned class (paginated)
 *     description: |
 *       Returns students enrolled in the teacher's assigned section.
 *       Supports search by name or admission number.
 *       Requires the teacher to be assigned as class teacher of a section.
 *     tags: [Teacher - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by first name, last name, or admission number
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Paginated list of students with parent contact info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 section: { id: "sec_01", name: "Primary 5A" }
 *                 role: TEACHER
 *                 data:
 *                   - id: "stu_01"
 *                     admissionNumber: "INPSE-2024-001"
 *                     firstName: "Ada"
 *                     lastName: "Obi"
 *                     parent: { accountEmail: "parent@example.com", fatherFirstName: "Chuka", fatherPhone: "08160000000", motherFirstName: "Nneka", motherPhone: "08170000000" }
 *                 meta: { total: 28, page: 1, limit: 30, totalPages: 1 }
 *       400:
 *         description: Teacher not assigned to any class
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
	"/",
	authenticate,
	requireTeacher,
	validate(getStudentsQuerySchema, "query"),
	getStudentsInMyClass,
);

/**
 * @swagger
 * /api/teacher/students/total:
 *   get:
 *     summary: Get total number of students in the teacher's class
 *     tags: [Teacher - Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Section name and total student count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data: { section: "Primary 5A", role: TEACHER, total: 28 }
 *       400:
 *         description: Teacher not assigned to any class
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
	"/total",
	authenticate,
	requireTeacher,
	getTotalStudentsInMyClass,
);

/**
 * @swagger
 * /api/teacher/students/pending-tasks:
 *   get:
 *     summary: Get pending tasks for the teacher (dashboard widget)
 *     description: |
 *       Returns outstanding tasks for the active term:
 *       attendance not completed today, results not yet uploaded,
 *       and results awaiting head teacher verification.
 *     tags: [Teacher - Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending tasks with section, role, and total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   section: "Primary 5A"
 *                   role: TEACHER
 *                   tasks:
 *                     - type: ATTENDANCE
 *                       message: "Attendance not yet marked for today"
 *                       priority: HIGH
 *                   total: 1
 *       400:
 *         description: No assignment found for this teacher
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
router.get("/pending-tasks", authenticate, requireTeacher, getPendingTasks);

// ATTENDANCE

/**
 * @swagger
 * /api/teacher/students/attendance:
 *   post:
 *     summary: Mark attendance for the class (requires a class teacher assignment)
 *     description: |
 *       Marks attendance for one or more students in the teacher's section.
 *       Locked per student, not per date — a student who already has an
 *       attendance record for the given date cannot be re-submitted, but
 *       other students not yet marked for that date can still be added.
 *       Statuses: PRESENT, ABSENT, EXCUSED, LATE
 *     tags: [Teacher - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, records]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Strict YYYY-MM-DD (zero-padded). Other formats are rejected.
 *                 example: "2024-10-15"
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [admissionNumber, status]
 *                   properties:
 *                     admissionNumber:
 *                       type: string
 *                       example: "INPSE-2024-001"
 *                     status:
 *                       type: string
 *                       enum: [PRESENT, ABSENT, EXCUSED, LATE]
 *                     note:
 *                       type: string
 *                       example: "Parent called to excuse absence"
 *     responses:
 *       200:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Attendance marked for 2 student(s)"
 *                 data: { date: "2024-10-15", section: "Primary 5A", role: TEACHER, marked: 2 }
 *       400:
 *         description: >
 *           One or more submitted students already have attendance recorded
 *           for this date, invalid date format, invalid status, or student not in class
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
	"/attendance",
	authenticate,
	requireTeacher,
	validate(markAttendanceSchema),
	markAttendance,
);

/**
 * @swagger
 * /api/teacher/students/attendance:
 *   get:
 *     summary: Get attendance records or summary for the class
 *     description: |
 *       Controlled by the `filter` query parameter:
 *
 *       **filter=date** (default)
 *       Returns all attendance records for the class on a specific date.
 *       Requires `date` (YYYY-MM-DD).
 *
 *       **filter=summary**
 *       Returns attendance totals grouped by student and status over a date range.
 *       Accepts optional `startDate` and `endDate` (YYYY-MM-DD).
 *     tags: [Teacher - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         required: false
 *         schema:
 *           type: string
 *           enum: [date, summary]
 *           default: date
 *         description: Switch between single-date records and date-range summary
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         example: "2024-10-15"
 *         description: Required when filter=date. Strict YYYY-MM-DD (zero-padded).
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         example: "2024-09-09"
 *         description: Used when filter=summary. Strict YYYY-MM-DD (zero-padded).
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         example: "2024-12-13"
 *         description: Used when filter=summary. Strict YYYY-MM-DD (zero-padded).
 *     responses:
 *       200:
 *         description: Attendance records for the date, or summary grouped by student and status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               examples:
 *                 byDate:
 *                   summary: filter=date
 *                   value:
 *                     success: true
 *                     data:
 *                       date: "2024-10-15"
 *                       section: "Primary 5A"
 *                       role: TEACHER
 *                       records:
 *                         - id: "att_01"
 *                           status: PRESENT
 *                           note: null
 *                           student: { admissionNumber: "INPSE-2024-001", firstName: "Ada", lastName: "Obi" }
 *                 summary:
 *                   summary: filter=summary
 *                   value:
 *                     success: true
 *                     data:
 *                       section: "Primary 5A"
 *                       role: TEACHER
 *                       summary:
 *                         - studentId: "stu_01"
 *                           status: PRESENT
 *                           _count: { status: 18 }
 *       400:
 *         description: date is required when filter=date, invalid date format, or invalid filter value
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
	"/attendance",
	authenticate,
	requireTeacher,
	validate(getAttendanceQuerySchema, "query"),
	(req, res, next) => {
		const filter = req.query.filter ?? "date";
		if (filter === "summary") return getAttendanceSummary(req, res, next);
		return getAttendanceByDate(req, res, next);
	},
);

// SCHEDULE

/**
 * @swagger
 * /api/teacher/students/schedule:
 *   get:
 *     summary: Get teacher schedule by range
 *     description: |
 *       Returns the schedule based on the teacher's actual assignments.
 *       A section classroom assignment returns classSchedule; a subject
 *       assignment returns subjectSchedule. Teachers holding both receive both.
 *
 *       Use range=today, range=week, or range=month.
 *       If range is omitted, today is used.
 *     tags: [Teacher - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         required: false
 *         schema:
 *           type: string
 *           enum: [today, week, month]
 *           default: today
 *     responses:
 *       200:
 *         description: Schedule ordered by day/start time depending on range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   range: today
 *                   pagination: { page: 1, limit: 20 }
 *                   role: TEACHER
 *                   classSchedule:
 *                     section: "Primary 5A"
 *                     data:
 *                       - dayOfWeek: Monday
 *                         startTime: "08:00"
 *                         endTime: "08:40"
 *                         subject: { subjectName: Mathematics, subjectCode: MTH }
 *                     meta: { page: 1, limit: 20, total: 5, totalPages: 1 }
 *                   subjectSchedule:
 *                     data:
 *                       - dayOfWeek: Monday
 *                         startTime: "09:00"
 *                         endTime: "09:40"
 *                         subject: { subjectName: English, subjectCode: ENG }
 *                         section: { name: "Primary 4B", class: { name: "Primary 4", level: PRIMARY_4 } }
 *                     meta: { page: 1, limit: 20, total: 3, totalPages: 1 }
 *       400:
 *         description: Invalid range or schedule unavailable for teacher role
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
	"/schedule",
	authenticate,
	requireTeacher,
	validate(getScheduleQuerySchema, "query"),
	getSchedule,
);

// EMAIL PARENTS

/**
 * @swagger
 * /api/teacher/students/email/all:
 *   post:
 *     summary: Send an email to all parents in the class
 *     description: |
 *       Sends a branded INPS email to all parent email addresses
 *       linked to students in the teacher's section.
 *       Includes primary email, father email, and mother email where available.
 *       Requires the teacher to be assigned as class teacher of a section.
 *     tags: [Teacher - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, title, body]
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "End of Term Reminder"
 *               title:
 *                 type: string
 *                 example: "Important Notice - End of Term"
 *               body:
 *                 type: string
 *                 example: "Dear Parent, please be informed that the term ends on Friday..."
 *               footer:
 *                 type: string
 *                 example: "For enquiries contact the school office."
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Email sent to 24 parent address(es)"
 *                 data: { sent: 24, section: "Primary 5A", role: TEACHER }
 *       400:
 *         description: Missing fields or no parent emails found
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
	"/email/all",
	authenticate,
	requireTeacher,
	validate(emailParentSchema),
	emailAllParents,
);

/**
 * @swagger
 * /api/teacher/students/email/{admissionNumber}:
 *   post:
 *     summary: Send an email to one student's parent
 *     description: |
 *       Sends to all email addresses on record for the parent
 *       (primary email, father email, mother email).
 *       Student must be in the teacher's assigned class.
 *       Requires the teacher to be assigned as class teacher of a section.
 *     tags: [Teacher - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admissionNumber
 *         required: true
 *         schema: { type: string }
 *         example: INPSE-2024-001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, title, body]
 *             properties:
 *               subject: { type: string }
 *               title:   { type: string }
 *               body:    { type: string }
 *               footer:  { type: string }
 *     responses:
 *       200:
 *         description: Email sent to parent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Email sent to parent of INPSE-2024-001"
 *                 data: { sent: 2, student: "INPSE-2024-001", section: "Primary 5A", role: TEACHER }
 *       400:
 *         description: Student not in your class or no email on record
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
	"/email/:admissionNumber",
	authenticate,
	requireTeacher,
	validate(emailParentSchema),
	emailOneParent,
);

/**
 * @swagger
 * /api/teacher/students/{admissionNumber}:
 *   get:
 *     summary: Get a specific student in the teacher's class
 *     tags: [Teacher - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admissionNumber
 *         required: true
 *         schema: { type: string }
 *         example: INPSE-2024-001
 *     responses:
 *       200:
 *         description: Student record with parent contact info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   id: "stu_01"
 *                   admissionNumber: "INPSE-2024-001"
 *                   firstName: "Ada"
 *                   lastName: "Obi"
 *                   parent: { accountEmail: "parent@example.com", accountPhone: "08160000000", fatherFirstName: "Chuka", fatherLastName: "Obi", fatherPhone: "08160000000", fatherEmail: "chuka@example.com", motherFirstName: "Nneka", motherLastName: "Obi", motherPhone: "08170000000", motherEmail: "nneka@example.com" }
 *       400:
 *         description: Student not found in your class
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
	"/:admissionNumber",
	authenticate,
	requireTeacher,
	getStudentByAdmissionNumber,
);

module.exports = router;
