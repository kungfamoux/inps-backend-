const prisma = require("../../lib/prisma");
const logger = require("../../utils/logger");
const StaffRepository = require("../../admin_portal/repositories/StaffRepository");
const StudentRepository = require("../../admin_portal/repositories/StudentRepository");
const EnrollmentRepository = require("../../admin_portal/repositories/EnrollmentRepository");
const ClassRepository = require("../../admin_portal/repositories/ClassRepository");
const FinanceRepository = require("../../bursary_portal/repositories/FinanceRepository");

class ProprietorRepository {
	async getStaffStatistics() {
		try {
			logger.info("Fetching staff statistics for proprietor");

			// Get staff count by role
			const staffByRole = await prisma.staff.groupBy({
				by: ["role", "type"],
				where: {
					status: "ACTIVE",
					deletedAt: null,
				},
				_count: true,
			});

			// Get total staff
			const totalStaff = await StaffRepository.count({
				status: "ACTIVE",
			});

			// Get teaching staff
			const teachingStaff = await StaffRepository.count({
				status: "ACTIVE",
				role: "TEACHER",
			});

			const stats = {
				totalStaff,
				teachingStaff,
				nonTeachingStaff: totalStaff - teachingStaff,
				staffByRole,
				updatedAt: new Date(),
			};

			logger.info("Staff statistics fetched successfully");
			return stats;
		} catch (error) {
			logger.error("Error fetching staff statistics:", error);
			throw error;
		}
	}

	async getEnrollmentStats() {
		try {
			logger.info("Fetching enrollment statistics for proprietor");

			// Get total students
			const totalStudents = await StudentRepository.countStudents({
				status: "ACTIVE",
			});

			// Get active enrollments
			const activeEnrollments = await EnrollmentRepository.countEnrollments({
				status: "ACTIVE",
			});

			// Get class distribution
			const classes = await ClassRepository.findAllClasses();
			const classDistribution = await Promise.all(
				classes.map(async (classItem) => {
					const studentCount = await EnrollmentRepository.countEnrollments({
						classId: classItem.id,
						status: "ACTIVE",
					});
					return {
						id: classItem.id,
						name: classItem.name,
						studentCount: studentCount || 0,
					};
				})
			);

			const stats = {
				totalStudents,
				activeEnrollments,
				totalClasses: classes.length,
				classDistribution,
				updatedAt: new Date(),
			};

			logger.info("Enrollment statistics fetched successfully");
			return stats;
		} catch (error) {
			logger.error("Error fetching enrollment statistics:", error);
			throw error;
		}
	}

	async getFinancialSummary() {
		try {
			logger.info("Fetching financial summary for proprietor");

			// Reuse existing finance repository methods
			const [incomeAgg, expenseAgg, paymentsAgg] = await Promise.all([
				FinanceRepository.getTotalIncome(),
				FinanceRepository.getTotalExpenses(),
				FinanceRepository.getTotalPayments(),
			]);

			const totalIncome =
				(incomeAgg._sum.amount ?? 0) + (paymentsAgg._sum.amount ?? 0);
			const totalExpenses = expenseAgg._sum.amount ?? 0;
			const netBalance = totalIncome - totalExpenses;

			const summary = {
				totalIncome,
				totalExpenses,
				netBalance,
				totalFeePayments: paymentsAgg._sum.amount ?? 0,
				totalOtherIncome: incomeAgg._sum.amount ?? 0,
				updatedAt: new Date(),
			};

			logger.info("Financial summary fetched successfully");
			return summary;
		} catch (error) {
			logger.error("Error fetching financial summary:", error);
			throw error;
		}
	}

	async getSchoolInfo() {
		try {
			logger.info("Fetching school information for proprietor");

			// Get current school config
			const schoolConfig = await prisma.schoolConfig.findUnique({
				where: { id: "singleton" },
				include: {
					currentSession: true,
					currentTermRelation: true,
				},
			});

			if (!schoolConfig) {
				return {
					academicYear: null,
					currentTerm: null,
					currentSession: null,
				};
			}

			const info = {
				academicYear: schoolConfig.academicYear,
				currentTerm: schoolConfig.currentTerm,
				currentSession: schoolConfig.currentSession,
				updatedAt: new Date(),
			};

			logger.info("School information fetched successfully");
			return info;
		} catch (error) {
			logger.error("Error fetching school information:", error);
			throw error;
		}
	}

	async getStaffOverview(filters = {}) {
		try {
			logger.info("Fetching staff overview for proprietor");

			const { role, type, status = "ACTIVE" } = filters;

			const where = {
				status,
				deletedAt: null,
			};

			if (role) where.role = role;
			if (type) where.type = type;

			const staff = await prisma.staff.findMany({
				where,
				select: {
					id: true,
					staffId: true,
					firstName: true,
					lastName: true,
					middleName: true,
					email: true,
					phone: true,
					role: true,
					type: true,
					status: true,
					dateOfEmployment: true,
				},
				orderBy: { createdAt: "desc" },
			});

			logger.info("Staff overview fetched successfully");
			return staff;
		} catch (error) {
			logger.error("Error fetching staff overview:", error);
			throw error;
		}
	}

	async getRecentExpenses(limit = 10) {
		try {
			logger.info("Fetching recent expenses for proprietor");

			const expenses = await prisma.expense.findMany({
				take: limit,
				orderBy: { date: "desc" },
				select: {
					id: true,
					date: true,
					description: true,
					category: true,
					amount: true,
				},
			});

			logger.info("Recent expenses fetched successfully");
			return expenses;
		} catch (error) {
			logger.error("Error fetching recent expenses:", error);
			throw error;
		}
	}

	async getRecentIncome(limit = 10) {
		try {
			logger.info("Fetching recent income for proprietor");

			const income = await prisma.incomeRecord.findMany({
				take: limit,
				orderBy: { date: "desc" },
				select: {
					id: true,
					date: true,
					description: true,
					category: true,
					amount: true,
				},
			});

			logger.info("Recent income fetched successfully");
			return income;
		} catch (error) {
			logger.error("Error fetching recent income:", error);
			throw error;
		}
	}
}

module.exports = new ProprietorRepository();
