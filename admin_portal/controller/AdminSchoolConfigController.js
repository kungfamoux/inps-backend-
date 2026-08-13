const AdminSchoolConfigService = require("../services/AdminSchoolConfig.service");

//  Sessions

const createSession = async (req, res, next) => {
	try {
		const { session } = req.body;
		if (!session) {
			return res
				.status(400)
				.json({ success: false, message: "session is required" });
		}
		const data = await AdminSchoolConfigService.createSession(session);
		return res
			.status(201)
			.json({ success: true, message: "Session created", data });
	} catch (error) {
		return next(error);
	}
};

const getAllSessions = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.getAllSessions();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getSessionById = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.getSessionById(
			req.params.sessionId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const updateSession = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.updateSession(
			req.params.sessionId,
			req.body,
		);
		return res
			.status(200)
			.json({ success: true, message: "Session updated", data });
	} catch (error) {
		return next(error);
	}
};

const deleteSession = async (req, res, next) => {
	try {
		await AdminSchoolConfigService.deleteSession(req.params.sessionId);
		return res.status(200).json({ success: true, message: "Session deleted" });
	} catch (error) {
		return next(error);
	}
};

//  Terms

const createTerm = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.createTerm(req.body);
		return res
			.status(201)
			.json({ success: true, message: "Term created", data });
	} catch (error) {
		return next(error);
	}
};

// Handles both setCurrentTerm and completeTerm via a status body param.
// status=CURRENT → sets the term as active (requires sessionId)
// status=COMPLETED → closes the term
// status=UPCOMING → resets the term
const updateTermStatus = async (req, res, next) => {
	try {
		const { termId } = req.params;
		const { status, sessionId } = req.body;

		if (!status) {
			return res
				.status(400)
				.json({ success: false, message: "status is required" });
		}

		const data = await AdminSchoolConfigService.updateTermStatus(
			termId,
			status,
			sessionId,
		);
		return res.status(200).json({
			success: true,
			message: `Term status updated to ${status}`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getCurrentTerm = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.getCurrentTerm();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		// Return 404 instead of error when no current term is set
		if (error.message === "No current term set") {
			return res.status(404).json({ 
				success: false, 
				message: "No current term set" 
			});
		}
		return next(error);
	}
};

const getCurrentSession = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.getCurrentSession();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		// Return 404 instead of error when no current session is set
		if (error.message === "No current session set") {
			return res.status(404).json({ 
				success: false, 
				message: "No current session set" 
			});
		}
		return next(error);
	}
};

const setCurrentSessionAndTerm = async (req, res, next) => {
	try {
		const { sessionId, termId } = req.body;
		if (!sessionId || !termId) {
			return res
				.status(400)
				.json({ success: false, message: "sessionId and termId are required" });
		}
		const userId = req.user?.id || null;
		const data = await AdminSchoolConfigService.setCurrentSessionAndTerm(
			sessionId,
			termId,
			userId,
		);
		return res
			.status(200)
			.json({ success: true, message: "Current session and term set", data });
	} catch (error) {
		return next(error);
	}
};

const getTermsBySession = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.getTermsBySession(
			req.params.sessionId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const updateTerm = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.updateTerm(
			req.params.termId,
			req.body,
		);
		return res
			.status(200)
			.json({ success: true, message: "Term updated", data });
	} catch (error) {
		return next(error);
	}
};

const deleteTerm = async (req, res, next) => {
	try {
		await AdminSchoolConfigService.deleteTerm(req.params.termId);
		return res.status(200).json({ success: true, message: "Term deleted" });
	} catch (error) {
		return next(error);
	}
};

//  Calendar

const createCalendar = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.createCalendar(req.body);
		return res
			.status(201)
			.json({ success: true, message: "Calendar created", data });
	} catch (error) {
		return next(error);
	}
};

// Supports optional ?academicYear= and ?term= filters
const getAllCalendars = async (req, res, next) => {
	try {
		const filters = {};
		if (req.query.academicYear) filters.academicYear = req.query.academicYear;
		if (req.query.term) filters.term = req.query.term;
		const data = await AdminSchoolConfigService.getAllCalendars(filters);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getCalendarById = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.getCalendarById(
			req.params.calendarId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const updateCalendar = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.updateCalendar(
			req.params.calendarId,
			req.body,
		);
		return res
			.status(200)
			.json({ success: true, message: "Calendar updated", data });
	} catch (error) {
		return next(error);
	}
};

const addHoliday = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.addHoliday(req.body);
		return res
			.status(201)
			.json({ success: true, message: "Holiday added", data });
	} catch (error) {
		return next(error);
	}
};

const removeHoliday = async (req, res, next) => {
	try {
		await AdminSchoolConfigService.removeHoliday(req.params.holidayId);
		return res.status(200).json({ success: true, message: "Holiday removed" });
	} catch (error) {
		return next(error);
	}
};

const updateHoliday = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.updateHoliday(
			req.params.holidayId,
			req.body,
		);
		return res
			.status(200)
			.json({ success: true, message: "Holiday updated", data });
	} catch (error) {
		return next(error);
	}
};

//  School Configuration

const createConfig = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.createConfig(req.body);
		return res
			.status(201)
			.json({ success: true, message: "Configuration created", data });
	} catch (error) {
		return next(error);
	}
};

const getConfig = async (req, res, next) => {
	try {
		const { academicYear, term } = req.params;
		const data = await AdminSchoolConfigService.getConfig(academicYear, term);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getAllConfigs = async (req, res, next) => {
	try {
		const data = await AdminSchoolConfigService.getAllConfigs();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const updateConfig = async (req, res, next) => {
	try {
		const { academicYear, term } = req.params;
		const data = await AdminSchoolConfigService.updateConfig(
			academicYear,
			term,
			req.body,
		);
		return res
			.status(200)
			.json({ success: true, message: "Configuration updated", data });
	} catch (error) {
		return next(error);
	}
};

const deleteConfig = async (req, res, next) => {
	try {
		const { academicYear, term } = req.params;
		await AdminSchoolConfigService.deleteConfig(academicYear, term);
		return res.status(200).json({ success: true, message: "Configuration deleted" });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	createSession,
	getAllSessions,
	getSessionById,
	updateSession,
	deleteSession,
	createTerm,
	updateTermStatus,
	getCurrentTerm,
	getCurrentSession,
	setCurrentSessionAndTerm,
	getTermsBySession,
	updateTerm,
	deleteTerm,
	createCalendar,
	getAllCalendars,
	getCalendarById,
	updateCalendar,
	addHoliday,
	removeHoliday,
	updateHoliday,
	createConfig,
	getConfig,
	getAllConfigs,
	updateConfig,
	deleteConfig,
};