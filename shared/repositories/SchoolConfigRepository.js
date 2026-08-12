const prisma = require("../../lib/prisma");

const getCurrentConfig = () =>
	prisma.schoolConfig.findFirst({
		include: {
			currentSession: {
				include: { terms: true },
			},
			currentTermRelation: {
				include: { session: true },
			},
		},
	});

const setCurrentConfig = async (sessionId, termId) => {
	// Validate that term belongs to session
	const term = await prisma.academicTerm.findUnique({
		where: { id: termId },
		include: { session: true },
	});

	if (!term) {
		throw new Error("Term not found");
	}

	if (term.sessionId !== sessionId) {
		throw new Error("Term does not belong to the specified session");
	}

	// Update or create SchoolConfig
	const config = await prisma.schoolConfig.upsert({
		where: { id: "singleton" },
		create: {
			id: "singleton",
			currentSessionId: sessionId,
			currentTermId: termId,
			academicYear: term.session.session,
			currentTerm: term.term,
		},
		update: {
			currentSessionId: sessionId,
			currentTermId: termId,
			academicYear: term.session.session,
			currentTerm: term.term,
		},
	});

	return config;
};

const updateCurrentConfig = (data) =>
	prisma.schoolConfig.update({
		where: { id: "singleton" },
		data,
	});

module.exports = {
	getCurrentConfig,
	setCurrentConfig,
	updateCurrentConfig,
};