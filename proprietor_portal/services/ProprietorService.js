const ProprietorRepository = require("../repositories/ProprietorRepository");
const logger = require("../../utils/logger");

class ProprietorService {
	async getDashboardStats() {
		try {
			logger.info("Fetching dashboard stats for proprietor");

			const [staffStats, enrollmentStats, financialSummary, schoolInfo] =
				await Promise.all([
					ProprietorRepository.getStaffStatistics(),
					ProprietorRepository.getEnrollmentStats(),
					ProprietorRepository.getFinancialSummary(),
					ProprietorRepository.getSchoolInfo(),
				]);

			const dashboardStats = {
				staff: staffStats,
				enrollment: enrollmentStats,
				finance: financialSummary,
				school: schoolInfo,
				updatedAt: new Date(),
			};

			logger.info("Dashboard stats fetched successfully");
			return dashboardStats;
		} catch (error) {
			logger.error("Error fetching dashboard stats:", error);
			throw error;
		}
	}

	async getFinancialAnalytics(filters = {}) {
		try {
			logger.info("Fetching financial analytics for proprietor");

			const financialSummary = await ProprietorRepository.getFinancialSummary();
			const recentExpenses = await ProprietorRepository.getRecentExpenses(
				filters.limit || 10
			);
			const recentIncome = await ProprietorRepository.getRecentIncome(
				filters.limit || 10
			);

			const analytics = {
				summary: financialSummary,
				recentExpenses,
				recentIncome,
				updatedAt: new Date(),
			};

			logger.info("Financial analytics fetched successfully");
			return analytics;
		} catch (error) {
			logger.error("Error fetching financial analytics:", error);
			throw error;
		}
	}

	async getStaffOverview(filters = {}) {
		try {
			logger.info("Fetching staff overview for proprietor");

			const staff = await ProprietorRepository.getStaffOverview(filters);
			const statistics = await ProprietorRepository.getStaffStatistics();

			const overview = {
				staff,
				statistics,
				updatedAt: new Date(),
			};

			logger.info("Staff overview fetched successfully");
			return overview;
		} catch (error) {
			logger.error("Error fetching staff overview:", error);
			throw error;
		}
	}

	async getStaffStatistics() {
		try {
			logger.info("Fetching staff statistics for proprietor");
			const stats = await ProprietorRepository.getStaffStatistics();
			logger.info("Staff statistics fetched successfully");
			return stats;
		} catch (error) {
			logger.error("Error fetching staff statistics:", error);
			throw error;
		}
	}

	async getStudentEnrollmentOverview(filters = {}) {
		try {
			logger.info("Fetching student enrollment overview for proprietor");

			const enrollmentStats = await ProprietorRepository.getEnrollmentStats();

			const overview = {
				enrollment: enrollmentStats,
				updatedAt: new Date(),
			};

			logger.info("Student enrollment overview fetched successfully");
			return overview;
		} catch (error) {
			logger.error("Error fetching student enrollment overview:", error);
			throw error;
		}
	}

	async getAcademicPerformanceMetrics() {
		try {
			logger.info("Fetching academic performance metrics for proprietor");

			// For now, return basic metrics - can be expanded later
			const enrollmentStats = await ProprietorRepository.getEnrollmentStats();

			const metrics = {
				totalStudents: enrollmentStats.totalStudents,
				totalClasses: enrollmentStats.totalClasses,
				averageClassSize: enrollmentStats.totalClasses > 0
					? Math.round(enrollmentStats.activeEnrollments / enrollmentStats.totalClasses)
					: 0,
				updatedAt: new Date(),
			};

			logger.info("Academic performance metrics fetched successfully");
			return metrics;
		} catch (error) {
			logger.error("Error fetching academic performance metrics:", error);
			throw error;
		}
	}

	async getSchoolConfiguration() {
		try {
			logger.info("Fetching school configuration for proprietor");
			const config = await ProprietorRepository.getSchoolInfo();
			logger.info("School configuration fetched successfully");
			return config;
		} catch (error) {
			logger.error("Error fetching school configuration:", error);
			throw error;
		}
	}
}

module.exports = new ProprietorService();
