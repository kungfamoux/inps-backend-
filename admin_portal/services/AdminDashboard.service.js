const StudentRepository = require("../repositories/StudentRepository");
const StaffRepository = require("../repositories/StaffRepository");
const ClassRepository = require("../repositories/ClassRepository");
const EnrollmentRepository = require("../repositories/EnrollmentRepository");
const logger = require("../../utils/logger");

class AdminDashboardService {
	async getDashboardStats() {
		try {
			logger.info("Fetching dashboard statistics");

			// Get total students (active only)
			const totalStudents = await StudentRepository.countStudents({
				status: "ACTIVE",
			});

			// Get total staff (active only)
			const totalStaff = await StaffRepository.count({
				status: "ACTIVE",
			});

			// Get active enrollments for current term
			const activeEnrollments = await EnrollmentRepository.countEnrollments({
				status: "ACTIVE",
			});

			// Get classes with student counts
			const classes = await ClassRepository.findAllClasses();
			const classStats = await Promise.all(
				classes.map(async (classItem) => {
					const studentCount = await EnrollmentRepository.countEnrollments({
						classId: classItem.id
					});
					return {
						id: classItem.id,
						name: classItem.name,
						studentCount: studentCount || 0,
					};
				})
			);

			// Calculate teaching staff count
			const teachingStaff = await StaffRepository.count({
				status: "ACTIVE",
				role: "TEACHER",
			});

			const stats = {
				totalStudents,
				totalStaff,
				teachingStaff,
				totalClasses: classes.length,
				activeEnrollments,
				classStats,
				updatedAt: new Date(),
			};

			logger.info("Dashboard statistics fetched successfully");
			return stats;
		} catch (error) {
			logger.error("Error fetching dashboard statistics:", error);
			throw error;
		}
	}
}

module.exports = new AdminDashboardService();
