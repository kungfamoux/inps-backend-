const TeacherStudentRepository = require("../../shared/repositories/TeacherStudentRepository");
const CommunicationRepository = require("../../shared/repositories/CommunicationRepository");
const { resolveTeacherSection } = require("../../utils/teacher");
const { sendBrandedEmail } = require("../../utils/resend");
const logger = require("../../utils/logger");

const {
	ATTENDANCE_STATUS_VALUES: ATTENDANCE_STATUSES,
} = require("../../utils/enums");
const SCHEDULE_RANGES = ["today", "week", "month"];

const normalizeScheduleRange = (range = "today") => {
	const normalized = String(range).trim().toLowerCase();
	if (!SCHEDULE_RANGES.includes(normalized)) {
		throw new Error(
			`Invalid schedule range "${range}". Must be one of: ${SCHEDULE_RANGES.join(", ")}`,
		);
	}
	return normalized;
};

class TeacherStudentService {
	async _getTeacherContext(staffId, role) {
		const ctx = await resolveTeacherSection(staffId, role);

		if (!ctx) {
			throw new Error("No assignment found for this teacher");
		}

		return ctx;
	}

	async _getClassTeacherContext(staffId, role) {
		const ctx = await this._getTeacherContext(staffId, role);

		if (!ctx.isClassTeacher) {
			throw new Error("This action is only available to class teachers");
		}

		if (!ctx.classAssigned) {
			throw new Error("Class not yet assigned for this teacher");
		}

		return ctx;
	}

	// STUDENTS

	async getStudentsInMyClass(staffId, role, filters = {}) {
		logger.info(`Fetching students for teacher: ${staffId}`);

		const ctx = await this._getClassTeacherContext(staffId, role);

		const result = await TeacherStudentRepository.findStudentsInSection(
			ctx.classSection.id,
			filters,
		);

		return {
			section: { id: ctx.classSection.id, name: ctx.classSection.name },
			role: ctx.role,
			data: result.data,
			meta: result.meta,
		};
	}

	async getStudentByAdmissionNumber(staffId, role, admissionNumber) {
		const ctx = await this._getClassTeacherContext(staffId, role);

		const student = await TeacherStudentRepository.findStudentInSection(
			admissionNumber,
			ctx.classSection.id,
		);

		if (!student) {
			throw new Error(`Student ${admissionNumber} not found in this class`);
		}

		return student;
	}

	async getTotalStudentsInMyClass(staffId, role) {
		const ctx = await this._getClassTeacherContext(staffId, role);

		const total = await TeacherStudentRepository.countStudentsInSection(
			ctx.classSection.id,
		);

		return {
			section: ctx.classSection.name,
			role: ctx.role,
			total,
		};
	}

	// ATTENDANCE

	async markAttendance(staffId, role, data = {}) {
		const { date, records } = data || {};

		if (!date || !Array.isArray(records) || records.length === 0) {
			throw new Error("date and records are required");
		}

		const ctx = await this._getClassTeacherContext(staffId, role);

		// "YYYY-MM-DD" already parses as UTC midnight — setUTCHours (not
		// setHours) keeps it there instead of shifting the calendar day by
		// the server's local timezone offset.
		const attendanceDate = new Date(date);
		if (isNaN(attendanceDate.getTime())) {
			throw new Error("Invalid date format");
		}
		attendanceDate.setUTCHours(0, 0, 0, 0);

		for (const record of records) {
			if (!ATTENDANCE_STATUSES.includes(record.status)) {
				throw new Error(`Invalid status "${record.status}"`);
			}
			if (!record.admissionNumber) {
				throw new Error("Missing admission number in record");
			}
		}

		const uniqueRecords = Array.from(
			new Map(records.map((r) => [r.admissionNumber, r])).values(),
		);

		const admissionNumbers = uniqueRecords.map((r) => r.admissionNumber);

		const students =
			await TeacherStudentRepository.findEnrolledStudentsByAdmissionNumbers(
				admissionNumbers,
				ctx.classSection.id,
			);

		const map = new Map(students.map((s) => [s.admissionNumber, s]));

		const payload = uniqueRecords.map(({ admissionNumber, status, note }) => {
			const student = map.get(admissionNumber);

			if (!student) {
				throw new Error(`Student ${admissionNumber} not in class`);
			}

			return {
				studentId: student.id,
				sectionId: ctx.classSection.id,
				staffId,
				date: attendanceDate,
				status,
				note: note ?? null,
			};
		});

		// Locked per student, not per section — a partial submission earlier
		// in the day shouldn't block marking students who weren't included.
		const existing =
			await TeacherStudentRepository.findAttendanceForStudentsOnDate(
				payload.map((p) => p.studentId),
				attendanceDate,
			);

		if (existing.length > 0) {
			const already = existing
				.map((e) => e.student.admissionNumber)
				.join(", ");
			throw new Error(
				`Attendance already recorded for this date for: ${already}`,
			);
		}

		const results =
			await TeacherStudentRepository.bulkUpsertAttendance(payload);

		return {
			date,
			section: ctx.classSection.name,
			role: ctx.role,
			marked: results.length,
		};
	}

	async getAttendanceByDate(staffId, role, date) {
		const ctx = await this._getClassTeacherContext(staffId, role);

		const records = await TeacherStudentRepository.findAttendanceByDate(
			ctx.classSection.id,
			date,
		);

		return {
			date,
			section: ctx.classSection.name,
			role: ctx.role,
			records,
		};
	}

	async getAttendanceSummary(staffId, role, filters = {}) {
		const ctx = await this._getClassTeacherContext(staffId, role);

		const summary = await TeacherStudentRepository.findAttendanceSummary(
			ctx.classSection.id,
			filters,
		);

		return {
			section: ctx.classSection.name,
			role: ctx.role,
			summary,
		};
	}

	// PENDING TASKS

	async getPendingTasks(staffId, role) {
		const ctx = await this._getTeacherContext(staffId, role);

		const tasks = [];

		if (ctx.isClassTeacher && ctx.classAssigned) {
			const today = new Date();
			today.setUTCHours(0, 0, 0, 0);

			const attendanceToday =
				await TeacherStudentRepository.checkAttendanceExists(
					ctx.classSection.id,
					today,
				);

			if (attendanceToday === 0) {
				tasks.push({
					type: "ATTENDANCE",
					message: "Attendance not yet marked for today",
					priority: "HIGH",
				});
			}
		} else if (ctx.isClassTeacher && !ctx.classAssigned) {
			tasks.push({
				type: "CLASS_ASSIGNMENT",
				message: "Class not yet assigned for this teacher",
				priority: "HIGH",
			});
		}

		return {
			section: ctx.classSection?.name ?? null,
			role: ctx.role,
			tasks,
			total: tasks.length,
		};
	}

	// SCHEDULE

	async getSchedule(staffId, role, filters = {}) {
		const ctx = await this._getTeacherContext(staffId, role);

		const range = normalizeScheduleRange(filters.range);
		const page = Number(filters.page) || 1;
		const limit = Number(filters.limit) || 20;

		const result = {
			range,
			pagination: { page, limit },
			role: ctx.role,
			classSchedule: null,
			subjectSchedule: null,
		};

		const classPromise =
			ctx.isClassTeacher && ctx.classAssigned
				? TeacherStudentRepository.findClassSchedule({
						sectionId: ctx.classSection.id,
						range,
						page,
						limit,
					})
						.then((data) => {
							result.classSchedule = {
								section: ctx.classSection.name,
								...data,
							};
						})
						.catch((err) => {
							logger.warn(`Class schedule error: ${err.message}`);
							result.classSchedule = [];
						})
				: Promise.resolve();

		const subjectPromise = ctx.isSubjectTeacher
			? TeacherStudentRepository.findTeacherSchedule({
					teacherId: staffId,
					range,
					page,
					limit,
				})
					.then((data) => {
						result.subjectSchedule = data;
					})
					.catch((err) => {
						logger.error(`Subject schedule error: ${err.message}`);
					})
			: Promise.resolve();

		await Promise.all([classPromise, subjectPromise]);

		return result;
	}

	// EMAIL

	async emailAllParents(staffId, role, data) {
		const { subject, title, body, footer } = data;

		if (!subject || !title || !body) {
			throw new Error("subject, title, and body are required");
		}

		const ctx = await this._getClassTeacherContext(staffId, role);

		const students =
			await TeacherStudentRepository.findStudentsWithParentEmails(
				ctx.classSection.id,
			);

		const emails = new Set();

		students.forEach(({ parent }) => {
			if (!parent) return;
			if (parent.accountEmail) emails.add(parent.accountEmail);
			if (parent.fatherEmail) emails.add(parent.fatherEmail);
			if (parent.motherEmail) emails.add(parent.motherEmail);
		});

		const list = Array.from(emails).filter(Boolean);

		if (!list.length) {
			throw new Error("No parent email addresses found");
		}

		await sendBrandedEmail({ to: list, subject, title, body, footer });

		// Also record this as a section-scoped announcement so parents see it
		// in their in-app announcement feed, not just as an email. Scoped to
		// this section only — never shown to parents outside this class.
		try {
			await CommunicationRepository.create({
				title,
				content: body,
				type: "ANNOUNCEMENT",
				target: "PARENTS",
				announcementCategory: "CLASS_UPDATE",
				status: "PUBLISHED",
				publishedAt: new Date(),
				sentAt: new Date(),
				sectionId: ctx.classSection.id,
			});
		} catch (recordError) {
			logger.error(
				`Failed to record class announcement for section ${ctx.classSection.id}: ${recordError.message}`,
			);
		}

		return {
			sent: list.length,
			section: ctx.classSection.name,
			role: ctx.role,
		};
	}

	async emailOneParent(staffId, role, admissionNumber, data) {
		const { subject, title, body, footer } = data;

		if (!subject || !title || !body) {
			throw new Error("subject, title, and body are required");
		}

		const ctx = await this._getClassTeacherContext(staffId, role);

		const student = await TeacherStudentRepository.findStudentWithParentEmails(
			admissionNumber,
			ctx.classSection.id,
		);

		if (!student) {
			throw new Error(`Student ${admissionNumber} not found in this class`);
		}

		const { parent } = student;

		if (!parent) {
			throw new Error(`No parent record found for student ${admissionNumber}`);
		}

		const emails = [
			parent.accountEmail,
			parent.fatherEmail,
			parent.motherEmail,
		].filter(Boolean);

		if (!emails.length) {
			throw new Error(
				`No parent email addresses found for student ${admissionNumber}`,
			);
		}

		await sendBrandedEmail({ to: emails, subject, title, body, footer });

		return {
			sent: emails.length,
			student: admissionNumber,
			section: ctx.classSection.name,
			role: ctx.role,
		};
	}
}

module.exports = new TeacherStudentService();
