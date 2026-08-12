const SchoolConfigRepository = require("../../shared/repositories/SchoolConfigRepository");
const AuditRepository = require("../../shared/repositories/AuditRepository");
const logger = require("../../utils/logger");

const createAuditLog = async (data, userId) => {
	try {
		await AuditRepository.createAuditLog({
			...data,
			userId,
		});
	} catch (error) {
		logger.error("Failed to create audit log:", error);
	}
};

const getCurrentConfig = async () => {
	try {
		logger.info("Fetching current school config");
		const config = await SchoolConfigRepository.getCurrentConfig();
		if (!config) {
			throw new Error("No current school config set");
		}
		return config;
	} catch (error) {
		logger.error("Error fetching current school config:", error);
		throw error;
	}
};

const setCurrentConfig = async (sessionId, termId, userId) => {
	try {
		logger.info(`Setting current config to session ${sessionId}, term ${termId}`);
		
		const oldConfig = await SchoolConfigRepository.getCurrentConfig();
		
		const newConfig = await SchoolConfigRepository.setCurrentConfig(sessionId, termId);
		
		// Create audit log
		await createAuditLog({
			action: "SET_CURRENT_CONFIG",
			entityType: "SCHOOL_CONFIG",
			entityId: newConfig.id,
			oldValues: oldConfig ? {
				currentSessionId: oldConfig.currentSessionId,
				currentTermId: oldConfig.currentTermId,
				academicYear: oldConfig.academicYear,
				currentTerm: oldConfig.currentTerm,
			} : null,
			newValues: {
				currentSessionId: newConfig.currentSessionId,
				currentTermId: newConfig.currentTermId,
				academicYear: newConfig.academicYear,
				currentTerm: newConfig.currentTerm,
			},
			sessionId: sessionId,
			termId: termId,
		}, userId);
		
		logger.info("Current school config set successfully");
		return newConfig;
	} catch (error) {
		logger.error("Error setting current school config:", error);
		throw error;
	}
};

module.exports = {
	getCurrentConfig,
	setCurrentConfig,
};