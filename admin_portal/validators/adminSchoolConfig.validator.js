const { z } = require("zod");
const {
	TERM_VALUES,
	SESSION_STATUS_VALUES,
	TERM_STATUS_VALUES,
	HOLIDAY_TYPE_VALUES,
} = require("../../utils/enums");

// Sessions

const createSessionSchema = z.object({
	session: z.string().trim().min(1, "session is required"),
});

const updateSessionStatusSchema = z.object({
	status: z.enum(SESSION_STATUS_VALUES),
});

const updateSessionSchema = z.object({
	session: z.string().trim().min(1).optional(),
});

// Terms

const createTermSchema = z.object({
	sessionId: z.string().trim().min(1, "sessionId is required"),
	term: z.enum(TERM_VALUES),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
});

const updateTermStatusSchema = z.object({
	status: z.enum(TERM_STATUS_VALUES),
	sessionId: z.string().trim().min(1).optional(),
});

const updateTermSchema = z.object({
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

// Calendar

const createCalendarSchema = z.object({
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
});

const getAllCalendarsQuerySchema = z.object({
	academicYear: z.string().trim().min(1).optional(),
	term: z.enum(TERM_VALUES).optional(),
});

const addHolidaySchema = z.object({
	calendarId: z.string().trim().min(1, "calendarId is required"),
	name: z.string().trim().min(1, "name is required"),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	type: z.enum(HOLIDAY_TYPE_VALUES),
});

const updateHolidaySchema = z.object({
	name: z.string().trim().min(1).optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	type: z.enum(HOLIDAY_TYPE_VALUES).optional(),
});

const updateCalendarSchema = z.object({
	academicYear: z.string().trim().min(1).optional(),
	term: z.enum(TERM_VALUES).optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	isCurrentTerm: z.boolean().optional(),
});

// School Configuration (promotion policy + grading)

const createConfigSchema = z.object({
	academicYear: z.string().trim().min(1, "academicYear is required"),
	term: z.enum(TERM_VALUES),
	maxStudentsPerClass: z.coerce.number().int().positive().optional(),
	minAverageScore: z.coerce.number().min(0).max(100).optional(),
	minAttendancePercentage: z.coerce.number().min(0).max(100).optional(),
	maxFailedSubjects: z.coerce.number().int().min(0).optional(),
	passMark: z.coerce.number().min(0).max(100).optional(),
	creditMark: z.coerce.number().min(0).max(100).optional(),
	distinctionMark: z.coerce.number().min(0).max(100).optional(),
});

const updateConfigSchema = z.object({
	maxStudentsPerClass: z.coerce.number().int().positive().optional(),
	minAverageScore: z.coerce.number().min(0).max(100).optional(),
	minAttendancePercentage: z.coerce.number().min(0).max(100).optional(),
	maxFailedSubjects: z.coerce.number().int().min(0).optional(),
	passMark: z.coerce.number().min(0).max(100).optional(),
	creditMark: z.coerce.number().min(0).max(100).optional(),
	distinctionMark: z.coerce.number().min(0).max(100).optional(),
});

module.exports = {
	createSessionSchema,
	updateSessionStatusSchema,
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
};
