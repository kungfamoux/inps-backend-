const prisma = require("../../lib/prisma");

const createAuditLog = async (data) => {
	return prisma.auditLog.create({
		data: {
			action: data.action,
			entityType: data.entityType,
			entityId: data.entityId,
			oldValues: data.oldValues || null,
			newValues: data.newValues || null,
			userId: data.userId || null,
			sessionId: data.sessionId || null,
			termId: data.termId || null,
			reason: data.reason || null,
			ipAddress: data.ipAddress || null,
			userAgent: data.userAgent || null,
		},
	});
};

const getAuditLogsByEntity = (entityType, entityId, limit = 50) => {
	return prisma.auditLog.findMany({
		where: { entityType, entityId },
		orderBy: { createdAt: "desc" },
		take: limit,
	});
};

const getAuditLogsByUser = (userId, limit = 50) => {
	return prisma.auditLog.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		take: limit,
	});
};

const getAuditLogsBySession = (sessionId, limit = 50) => {
	return prisma.auditLog.findMany({
		where: { sessionId },
		orderBy: { createdAt: "desc" },
		take: limit,
	});
};

const getRecentAuditLogs = (limit = 100) => {
	return prisma.auditLog.findMany({
		orderBy: { createdAt: "desc" },
		take: limit,
	});
};

module.exports = {
	createAuditLog,
	getAuditLogsByEntity,
	getAuditLogsByUser,
	getAuditLogsBySession,
	getRecentAuditLogs,
};