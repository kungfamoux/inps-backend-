const AcademicRepository = require("../../shared/repositories/AcademicRepository");
const AuditRepository = require("../../shared/repositories/AuditRepository");
const logger = require("../../utils/logger");
const {
	sanitizeCalendar,
	sanitizeConfig,
	sanitizeTerm,
	sanitizeSession,
} = require("../../utils/sanitizers");

const {
	TERM_STATUS_VALUES: UPDATABLE_TERM_STATUSES,
	SESSION_STATUS_VALUES,
} = require("../../utils/enums");

// Helper function to create audit logs
async function createAuditLog(data, userId = null) {
	try {
		await AuditRepository.createAuditLog({
			...data,
			userId: userId || null,
		});
	} catch (error) {
		logger.error("Failed to create audit log:", error);
		// Don't throw error - audit logging should not break main functionality
	}
}

class AdminSchoolConfigService {
	//  Academic Session

	async createSession(session) {
		logger.info(`Creating academic session: ${session}`);

		const existing = await AcademicRepository.findSessionByName(session);
		if (existing) throw new Error(`Session already exists: ${session}`);

		const created = await AcademicRepository.createSession({ session });
		logger.info(`Academic session created: ${session}`);
		return sanitizeSession(created);
	}

	async getAllSessions() {
		logger.info("Fetching all academic sessions");
		const sessions = await AcademicRepository.findAllSessions();
		return sessions.map(sanitizeSession);
	}

	async getSessionById(id) {
		logger.info(`Fetching session: ${id}`);
		const session = await AcademicRepository.findSessionById(id);
		if (!session) throw new Error("Session not found");
		return sanitizeSession(session);
	}

	async updateSession(id, data) {
		logger.info(`Updating session: ${id}`);
		const session = await AcademicRepository.findSessionById(id);
		if (!session) throw new Error("Session not found");

		const updated = await AcademicRepository.updateSession(id, data);
		logger.info(`Session ${id} updated`);
		return sanitizeSession(updated);
	}

	async deleteSession(id) {
		logger.info(`Deleting session: ${id}`);
		const session = await AcademicRepository.findSessionById(id);
		if (!session) throw new Error("Session not found");

		const dependents = await AcademicRepository.countSessionDependents(id);
		if (dependents.total > 0) {
			throw new Error(
				`Cannot delete session with ${dependents.total} dependent records (${dependents.terms} terms, ${dependents.results} results, ${dependents.termRemarks} term remarks, ${dependents.promotionRuns} promotion runs)`
			);
		}

		await AcademicRepository.deleteSession(id);
		logger.info(`Session ${id} deleted`);
		return { message: "Session deleted successfully" };
	}

	//  Academic Term

	async createTerm(data) {
		const { sessionId, term, startDate, endDate } = data;

		if (!sessionId || !term || !startDate || !endDate) {
			throw new Error("Fill all required fields");
		}

		logger.info(`Creating term: ${term} for session: ${sessionId}`);

		const existing = await AcademicRepository.findTermBySessionAndTerm(
			sessionId,
			term,
		);
		if (existing)
			throw new Error(`Term ${term} already exists for this session`);

		const created = await AcademicRepository.createTerm({
			sessionId,
			term,
			startDate: new Date(startDate),
			endDate: new Date(endDate),
			status: "UPCOMING",
		});

		logger.info(`Term created: ${term}`);
		return sanitizeTerm(created);
	}

	// Single method for both setCurrentTerm and completeTerm.
	// Pass status=CURRENT to activate a term, status=COMPLETED to close it.
	// sessionId is required when setting status=CURRENT so other terms
	// in the same session are reset to UPCOMING.
	async updateTermStatus(id, status, sessionId) {
		if (!UPDATABLE_TERM_STATUSES.includes(status)) {
			throw new Error(
				`Invalid status "${status}". Must be one of: ${UPDATABLE_TERM_STATUSES.join(", ")}`,
			);
		}

		logger.info(`Updating term ${id} status → ${status}`);

		const term = await AcademicRepository.findTermById(id);
		if (!term) throw new Error("Term not found");

		if (term.status === status) {
			throw new Error(`Term is already ${status.toLowerCase()}`);
		}

		let updated;

		if (status === "CURRENT") {
			if (!sessionId)
				throw new Error("sessionId is required when setting a term as current");
			updated = await AcademicRepository.setCurrentTerm(id, sessionId);
		} else {
			updated = await AcademicRepository.updateTerm(id, { status });
		}

		logger.info(`Term ${id} status updated to ${status}`);
		return sanitizeTerm(updated);
	}

	async getCurrentTerm() {
		logger.info("Fetching current term");
		const term = await AcademicRepository.getCurrentTerm();
		if (!term) throw new Error("No current term set");
		return sanitizeTerm(term);
	}

	async getCurrentSession() {
		logger.info("Fetching current session");
		const session = await AcademicRepository.getCurrentSession();
		if (!session) throw new Error("No current session set");
		return sanitizeSession(session);
	}

	async setCurrentSessionAndTerm(sessionId, termId, userId = null) {
		logger.info(`Setting current session: ${sessionId} and term: ${termId}`);

		const session = await AcademicRepository.findSessionById(sessionId);
		if (!session) throw new Error("Session not found");

		const term = await AcademicRepository.findTermById(termId);
		if (!term) throw new Error("Term not found");

		if (term.sessionId !== sessionId) {
			throw new Error("Term does not belong to the specified session");
		}

		// Get previous current session/term for audit
		const previousTerm = await AcademicRepository.getCurrentTerm();
		const previousSession = await AcademicRepository.getCurrentSession();

		// Set term to CURRENT (this will update SchoolConfig)
		const updatedTerm = await AcademicRepository.setCurrentTerm(termId, sessionId);
		
		logger.info(`Current session and term set: session=${sessionId}, term=${termId}`);

		// Create audit log
		await createAuditLog({
			action: "SET_CURRENT_SESSION_AND_TERM",
			entityType: "ACADEMIC_CONFIG",
			entityId: sessionId,
			oldValues: {
				session: previousSession ? sanitizeSession(previousSession) : null,
				term: previousTerm ? sanitizeTerm(previousTerm) : null,
			},
			newValues: {
				session: sanitizeSession(session),
				term: sanitizeTerm(updatedTerm),
			},
			sessionId: sessionId,
			termId: id,
		}, userId);

		return {
			session: sanitizeSession(session),
			term: sanitizeTerm(updatedTerm),
		};
	}

	async getTermsBySession(id) {
		logger.info(`Fetching terms for session: ${id}`);
		const terms = await AcademicRepository.findAllTermsBySession(id);
		return terms.map(sanitizeTerm);
	}

	async updateTerm(id, data) {
		logger.info(`Updating term: ${id}`);
		const term = await AcademicRepository.findTermById(id);
		if (!term) throw new Error("Term not found");

		const updated = await AcademicRepository.updateTerm(id, data);
		logger.info(`Term ${id} updated`);
		return sanitizeTerm(updated);
	}

	async deleteTerm(id) {
		logger.info(`Deleting term: ${id}`);
		const term = await AcademicRepository.findTermById(id);
		if (!term) throw new Error("Term not found");

		const dependents = await AcademicRepository.countTermDependents(id);
		if (dependents.total > 0) {
			throw new Error(
				`Cannot delete term with ${dependents.total} dependent records (${dependents.classSubjects} class subjects, ${dependents.results} results, ${dependents.termRemarks} term remarks)`
			);
		}

		await AcademicRepository.deleteTerm(id);
		logger.info(`Term ${id} deleted`);
		return { message: "Term deleted successfully" };
	}

	//  School Calendar

	async createCalendar(data) {
		const { academicYear, term, startDate, endDate } = data;

		if (!academicYear || !term || !startDate || !endDate) {
			throw new Error("Fill all required fields");
		}

		logger.info(`Creating calendar for ${academicYear} — ${term}`);

		const existing = await AcademicRepository.findCalendarByTerm(
			academicYear,
			term,
		);
		if (existing) throw new Error("Calendar already exists for this term");

		const created = await AcademicRepository.createCalendar({
			academicYear,
			term,
			startDate: new Date(startDate),
			endDate: new Date(endDate),
			isCurrentTerm: false,
		});

		logger.info(`Calendar created for ${academicYear} — ${term}`);
		return sanitizeCalendar(created);
	}

	// Returns all calendars. Optionally filter by academicYear and/or term
	// using query params — replaces the old separate getCalendarByTerm endpoint.
	async getAllCalendars(filters = {}) {
		logger.info("Fetching all calendars");
		const calendars = await AcademicRepository.findAllCalendars(filters);
		return calendars.map(sanitizeCalendar);
	}

	async addHoliday(data) {
		const { calendarId, name, startDate, endDate, type } = data;

		if (!calendarId || !name || !startDate || !endDate || !type) {
			throw new Error("Fill all required fields");
		}

		logger.info(`Adding holiday: ${name} to calendar: ${calendarId}`);

		const holiday = await AcademicRepository.addHoliday({
			calendarId,
			name,
			startDate: new Date(startDate),
			endDate: new Date(endDate),
			type,
		});

		logger.info(`Holiday added: ${name}`);
		return holiday;
	}

	async removeHoliday(holidayId) {
		logger.info(`Removing holiday: ${holidayId}`);
		const holiday = await AcademicRepository.findHolidayById(holidayId);
		if (!holiday) throw new Error("Holiday not found");

		await AcademicRepository.deleteHoliday(holidayId);
		logger.info(`Holiday ${holidayId} removed`);
		return { message: "Holiday removed successfully" };
	}

	async updateHoliday(holidayId, data) {
		logger.info(`Updating holiday: ${holidayId}`);
		const holiday = await AcademicRepository.findHolidayById(holidayId);
		if (!holiday) throw new Error("Holiday not found");

		const updated = await AcademicRepository.updateHoliday(holidayId, data);
		logger.info(`Holiday ${holidayId} updated`);
		return updated;
	}

	//  School Configuration

	async createConfig(data) {
		const {
			academicYear,
			term,
			maxStudentsPerClass,
			minAverageScore,
			minAttendancePercentage,
			maxFailedSubjects,
			passMark,
			creditMark,
			distinctionMark,
		} = data;

		if (!academicYear || !term) {
			throw new Error("academicYear and term are required");
		}

		logger.info(`Creating configuration for ${academicYear} — ${term}`);

		const existing = await AcademicRepository.findConfig(academicYear, term);
		if (existing)
			throw new Error(
				"Configuration already exists for this academic year and term"
			);

		const created = await AcademicRepository.createConfig({
			academicYear,
			term,
			maxStudentsPerClass,
			minAverageScore,
			minAttendancePercentage,
			maxFailedSubjects,
			passMark,
			creditMark,
			distinctionMark,
		});

		logger.info(`Configuration created for ${academicYear} — ${term}`);
		return sanitizeConfig(created);
	}

	async getConfig(academicYear, term) {
		logger.info(`Fetching configuration for ${academicYear} — ${term}`);
		const config = await AcademicRepository.findConfig(academicYear, term);
		if (!config) throw new Error("Configuration not found");
		return sanitizeConfig(config);
	}

	async getAllConfigs() {
		logger.info("Fetching all configurations");
		const configs = await AcademicRepository.findAllConfigs();
		return configs.map(sanitizeConfig);
	}

	async updateConfig(academicYear, term, data) {
		logger.info(`Updating configuration for ${academicYear} — ${term}`);
		const config = await AcademicRepository.findConfig(academicYear, term);
		if (!config) throw new Error("Configuration not found");

		const updated = await AcademicRepository.updateConfig(academicYear, term, data);
		logger.info(`Configuration updated for ${academicYear} — ${term}`);
		return sanitizeConfig(updated);
	}

	async deleteConfig(academicYear, term) {
		logger.info(`Deleting configuration for ${academicYear} — ${term}`);
		const config = await AcademicRepository.findConfig(academicYear, term);
		if (!config) throw new Error("Configuration not found");

		await AcademicRepository.deleteConfig(academicYear, term);
		logger.info(`Configuration deleted for ${academicYear} — ${term}`);
		return { message: "Configuration deleted successfully" };
	}
}

const adminSchoolConfigService = new AdminSchoolConfigService();
module.exports = adminSchoolConfigService;