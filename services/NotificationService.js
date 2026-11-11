const prisma = require("../lib/prisma");
const logger = require("../utils/logger");

class NotificationService {
	async createNotification(data) {
		try {
			const { userId, type, title, message, metadata } = data;
			logger.info(`Creating notification for user: ${userId}, type: ${type}`);

			const notification = await prisma.notification.create({
				data: {
					userId,
					type,
					title,
					message,
					metadata: metadata || {},
				},
			});

			logger.info(`Notification created: ${notification.id}`);
			return notification;
		} catch (error) {
			logger.error("Create notification failed:", error.message);
			throw error;
		}
	}

	async getUserNotifications(userId, filters = {}) {
		try {
			const { unreadOnly = false, limit = 50 } = filters;
			const where = { userId };
			if (unreadOnly) {
				where.isRead = false;
			}

			const notifications = await prisma.notification.findMany({
				where,
				orderBy: { createdAt: "desc" },
				take: limit,
			});

			return notifications;
		} catch (error) {
			logger.error("Get user notifications failed:", error.message);
			throw error;
		}
	}

	async markAsRead(notificationId, userId) {
		try {
			const notification = await prisma.notification.findUnique({
				where: { id: notificationId },
			});

			if (!notification) {
				throw new Error("Notification not found");
			}

			if (notification.userId !== userId) {
				throw new Error("Cannot mark notification as read - not owner");
			}

			const updated = await prisma.notification.update({
				where: { id: notificationId },
				data: {
					isRead: true,
					readAt: new Date(),
				},
			});

			logger.info(`Notification marked as read: ${notificationId}`);
			return updated;
		} catch (error) {
			logger.error("Mark notification as read failed:", error.message);
			throw error;
		}
	}

	async markAllAsRead(userId) {
		try {
			const result = await prisma.notification.updateMany({
				where: {
					userId,
					isRead: false,
				},
				data: {
					isRead: true,
					readAt: new Date(),
				},
			});

			logger.info(`Marked ${result.count} notifications as read for user: ${userId}`);
			return result;
		} catch (error) {
			logger.error("Mark all notifications as read failed:", error.message);
			throw error;
		}
	}

	async getUnreadCount(userId) {
		try {
			const count = await prisma.notification.count({
				where: {
					userId,
					isRead: false,
				},
			});

			return count;
		} catch (error) {
			logger.error("Get unread count failed:", error.message);
			throw error;
		}
	}
}

module.exports = new NotificationService();
