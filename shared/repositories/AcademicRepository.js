const prisma = require("../../lib/prisma");
const SchoolConfigRepository = require("./SchoolConfigRepository");

// ACADEMIC SESSION

const createSession = (data) => prisma.academicSession.create({ data });

const findSessionByName = (session) =>
	prisma.academicSession.findUnique({
		where: { session },
		include: { terms: true },
	});

const findAllSessions = () =>
	prisma.academicSession.findMany({
		include: { terms: true },
		orderBy: { session: "desc" },
	});

const findSessionById = (id) =>
	prisma.academicSession.findUnique({
		where: { id },
		include: { terms: true },
	});

// ACADEMIC TERM

const createTerm = (data) => prisma.academicTerm.create({ data });

const findTermById = (id) =>
	prisma.academicTerm.findUnique({
		where: { id },
		include: { session: true },
	});

const findTermBySessionAndTerm = (sessionId, term) =>
	prisma.academicTerm.findUnique({
		where: { sessionId_term: { sessionId, term } },
	});

const findAllTermsBySession = (sessionId) =>
	prisma.academicTerm.findMany({
		where: { sessionId },
		orderBy: { startDate: "asc" },
	});

const updateTerm = (id, data) =>
	prisma.academicTerm.update({ where: { id }, data });

const updateSession = (id, data) =>
	prisma.academicSession.update({ where: { id }, data });

const deleteSession = (id) => prisma.academicSession.delete({ where: { id } });

const deleteTerm = (id) => prisma.academicTerm.delete({ where: { id } });

const countTermDependents = async (termId) => {
	const [classSubjects, results, termRemarks] = await Promise.all([
		prisma.classSubject.count({ where: { termId } }),
		prisma.result.count({ where: { termId } }),
		prisma.studentTermRemark.count({ where: { termId } }),
	]);
	return {
		classSubjects,
		results,
		termRemarks,
		total: classSubjects + results + termRemarks,
	};
};

const countSessionDependents = async (sessionId) => {
	const [terms, results, termRemarks, promotionRuns] = await Promise.all([
		prisma.academicTerm.count({ where: { sessionId } }),
		prisma.result.count({ where: { sessionId } }),
		prisma.studentTermRemark.count({ where: { sessionId } }),
		prisma.promotionRun.count({ where: { sessionId } }),
	]);
	return {
		terms,
		results,
		termRemarks,
		promotionRuns,
		total: terms + results + termRemarks + promotionRuns,
	};
};

// Sets one term as current and all others as not current
const setCurrentTerm = async (termId, sessionId) => {
	await prisma.academicTerm.updateMany({
		where: { sessionId },
		data: { status: "UPCOMING" },
	});
	const term = await prisma.academicTerm.update({
		where: { id: termId },
		data: { status: "CURRENT" },
	});
	
	// Update SchoolConfig when term is set to CURRENT
	await SchoolConfigRepository.setCurrentConfig(sessionId, termId);
	
	return term;
};

// Gets the current session via SchoolConfig
const getCurrentSession = async () => {
	const config = await SchoolConfigRepository.getCurrentConfig();
	if (!config || !config.currentSession) {
		return null;
	}
	return config.currentSession;
};

// Gets the current term
const getCurrentTerm = () =>
	prisma.academicTerm.findFirst({
		where: { status: "CURRENT" },
		include: { session: true },
	});

// SCHOOL CALENDAR

const createCalendar = (data) => prisma.schoolCalendar.create({ data });

const findCalendarByTerm = (academicYear, term) =>
	prisma.schoolCalendar.findUnique({
		where: { academicYear_term: { academicYear, term } },
		include: { holidays: true },
	});

const findAllCalendars = () =>
	prisma.schoolCalendar.findMany({
		include: { holidays: true },
		orderBy: { academicYear: "desc" },
	});

const findCalendarById = (id) =>
	prisma.schoolCalendar.findUnique({
		where: { id },
		include: { holidays: true },
	});

const updateCalendar = (id, data) =>
	prisma.schoolCalendar.update({ where: { id }, data });

const addHoliday = (data) => prisma.holiday.create({ data });

const findHolidayById = (id) => prisma.holiday.findUnique({ where: { id } });

const updateHoliday = (id, data) =>
	prisma.holiday.update({ where: { id }, data });

const deleteHoliday = (id) => prisma.holiday.delete({ where: { id } });

// SCHOOL CONFIGURATION

const createConfig = (data) => prisma.schoolConfiguration.create({ data });

const findConfig = (academicYear, term) =>
	prisma.schoolConfiguration.findUnique({
		where: { academicYear_term: { academicYear, term } },
	});

const updateConfig = (academicYear, term, data) =>
	prisma.schoolConfiguration.update({
		where: { academicYear_term: { academicYear, term } },
		data,
	});

const findAllConfigs = () =>
	prisma.schoolConfiguration.findMany({ orderBy: { academicYear: "desc" } });

const deleteConfig = (academicYear, term) =>
	prisma.schoolConfiguration.delete({
		where: { academicYear_term: { academicYear, term } },
	});

// Looks up a term by session name (e.g. "2024/2025") and term enum value.
// Used to validate that a term exists before creating bills or other records.
const findTermBySessionNameAndTerm = (academicYear, term) =>
	prisma.academicTerm.findFirst({
		where: {
			term,
			session: { session: academicYear },
		},
	});

module.exports = {
	findTermBySessionNameAndTerm,
	createSession,
	findSessionByName,
	findAllSessions,
	findSessionById,
	createTerm,
	findTermById,
	findTermBySessionAndTerm,
	findAllTermsBySession,
	updateSession,
	deleteSession,
	countSessionDependents,
	updateTerm,
	deleteTerm,
	countTermDependents,
	setCurrentTerm,
	getCurrentTerm,
	getCurrentSession,
	createCalendar,
	findCalendarByTerm,
	findAllCalendars,
	findCalendarById,
	updateCalendar,
	addHoliday,
	findHolidayById,
	updateHoliday,
	deleteHoliday,
	createConfig,
	findConfig,
	updateConfig,
	deleteConfig,
	findAllConfigs,
};