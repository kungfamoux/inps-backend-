const express = require("express");
const router = express.Router();

const {
	createSchedule,
	getSchedulesByClass,
	getSchedulesByTeacher,
	deleteSchedule,
} = require("../controller/AdminSchedulesController");

const { authenticate, requireAdmin, validate } = require("../../middleware");
const {
	createScheduleSchema,
} = require("../validators/adminSchedules.validator");

/**
 * @swagger
 * tags:
 *   name: Admin - Schedules
 *   description: Class timetable management
 */

/**
 * @swagger
 * /api/admin/schedules:
 *   post:
 *     summary: Create a timetable entry
 *     description: Teacher must already be assigned to the subject in the section.
 *     tags: [Admin - Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, subjectId, staffId, dayOfWeek, startTime, endTime]
 *             properties:
 *               sectionId:  { type: string }
 *               subjectId:  { type: string }
 *               staffId:    { type: string }
 *               dayOfWeek:  { type: string, example: "Monday" }
 *               startTime:  { type: string, example: "08:00" }
 *               endTime:    { type: string, example: "09:00" }
 *     responses:
 *       201:
 *         description: Schedule created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Schedule created successfully"
 *                 data: { id: "sch_01", classId: "cls_01", subjectId: "sub_01", staffId: "staff_01", dayOfWeek: Monday, startTime: "08:00", endTime: "09:00" }
 *       400:
 *         description: >
 *           Missing fields, startTime not before endTime, teacher not assigned to
 *           subject in this section, or a section/teacher time-slot clash
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
	requireAdmin,
	validate(createScheduleSchema),
	createSchedule,
);

/**
 * @swagger
 * /api/admin/schedules/section/{sectionId}:
 *   get:
 *     summary: Get full timetable for a section
 *     tags: [Admin - Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Section timetable ordered by day and time
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "sch_01"
 *                     dayOfWeek: Monday
 *                     startTime: "08:00"
 *                     endTime: "09:00"
 *                     subject: { subjectName: Mathematics, subjectCode: MTH101 }
 *                     staff: { firstName: "Ada", lastName: "Obi", staffId: "INPS-TCH-2024-001" }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/class/:classId",
	authenticate,
	requireAdmin,
	getSchedulesByClass,
);

/**
 * @swagger
 * /api/admin/schedules/teacher/{staffId}:
 *   get:
 *     summary: Get full timetable for a teacher
 *     tags: [Admin - Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Teacher timetable ordered by day and time
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "sch_01"
 *                     dayOfWeek: Monday
 *                     startTime: "08:00"
 *                     endTime: "09:00"
 *                     subject: { subjectName: Mathematics, subjectCode: MTH101 }
 *                     class: { name: "Primary 1 Yellow" }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/teacher/:staffId",
	authenticate,
	requireAdmin,
	getSchedulesByTeacher,
);

/**
 * @swagger
 * /api/admin/schedules/{scheduleId}:
 *   delete:
 *     summary: Delete a timetable entry
 *     tags: [Admin - Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Schedule deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Schedule deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:scheduleId", authenticate, requireAdmin, deleteSchedule);

module.exports = router;
