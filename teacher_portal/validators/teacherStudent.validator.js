const { z } = require("zod");
const { ATTENDANCE_STATUS_VALUES } = require("../../utils/enums");

const SCHEDULE_RANGE_VALUES = ["today", "week", "month"];
const ATTENDANCE_FILTER_VALUES = ["date", "summary"];

// Strict YYYY-MM-DD (zero-padded) — a loose format like "2026-07-6" fails
// the ISO 8601 fast path in Date parsing and silently falls back to
// local-time parsing, which can shift the stored calendar day by one.
const isoDateString = (message) =>
	z
		.string()
		.trim()
		.regex(/^\d{4}-\d{2}-\d{2}$/, message)
		.refine((s) => !isNaN(new Date(s).getTime()), message);

// GET /api/teacher/students
const getStudentsQuerySchema = z.object({
	search: z.string().trim().min(1).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).optional(),
});

// POST /api/teacher/students/attendance
const attendanceRecordSchema = z.object({
	admissionNumber: z.string().trim().min(1, "admissionNumber is required"),
	status: z.enum(ATTENDANCE_STATUS_VALUES),
	note: z.string().trim().min(1).optional(),
});

const markAttendanceSchema = z.object({
	date: isoDateString("date must be in YYYY-MM-DD format"),
	records: z
		.array(attendanceRecordSchema)
		.min(1, "records must not be empty"),
});

// GET /api/teacher/students/attendance
const getAttendanceQuerySchema = z.object({
	filter: z.enum(ATTENDANCE_FILTER_VALUES).optional(),
	date: isoDateString("date must be in YYYY-MM-DD format").optional(),
	startDate: isoDateString("startDate must be in YYYY-MM-DD format").optional(),
	endDate: isoDateString("endDate must be in YYYY-MM-DD format").optional(),
});

// GET /api/teacher/students/schedule
const getScheduleQuerySchema = z.object({
	range: z.enum(SCHEDULE_RANGE_VALUES).optional(),
});

// POST /api/teacher/students/email/all
// POST /api/teacher/students/email/:admissionNumber
const emailParentSchema = z.object({
	subject: z.string().trim().min(1, "subject is required"),
	title: z.string().trim().min(1, "title is required"),
	body: z.string().trim().min(1, "body is required"),
	footer: z.string().trim().min(1).optional(),
});

module.exports = {
	getStudentsQuerySchema,
	markAttendanceSchema,
	getAttendanceQuerySchema,
	getScheduleQuerySchema,
	emailParentSchema,
};
