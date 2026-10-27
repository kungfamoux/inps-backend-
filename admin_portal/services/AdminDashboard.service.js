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

	async getUpcomingBirthdays() {
		try {
			logger.info("Fetching upcoming student birthdays");

			const today = new Date();
			const todayMonth = today.getMonth();
			const todayDay = today.getDate();

			// Get students with birthdays in the next 30 days
			const students = await StudentRepository.getUpcomingBirthdays(5);

			const upcomingBirthdays = students.map(student => {
				const birthDate = new Date(student.dateOfBirth);
				const birthMonth = birthDate.getMonth();
				const birthDay = birthDate.getDate();

				// Calculate days until birthday
				let daysUntilBirthday;
				const nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);

				if (nextBirthday < today) {
					// Birthday already passed this year, calculate for next year
					nextBirthday.setFullYear(today.getFullYear() + 1);
				}

				const diffTime = nextBirthday - today;
				daysUntilBirthday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

				return {
					studentId: student.id,
					admissionNumber: student.admissionNumber,
					firstName: student.firstName,
					middleName: student.middleName,
					lastName: student.lastName,
					dateOfBirth: student.dateOfBirth,
					class: student.class?.name || null,
					daysUntilBirthday,
					birthdayDate: nextBirthday.toISOString().split('T')[0],
				};
			});

			logger.info(`Found ${upcomingBirthdays.length} upcoming birthdays`);
			return upcomingBirthdays;
		} catch (error) {
			logger.error("Error fetching upcoming birthdays:", error);
			throw error;
		}
	}
}

module.exports = new AdminDashboardService();
