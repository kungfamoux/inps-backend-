const EnrollmentRepository = require("../repositories/EnrollmentRepository");
const AcademicRepository = require("../../shared/repositories/AcademicRepository");
const {
	sanitizeEnrollment,
	sanitizeStudent,
} = require("../../utils/sanitizers");
const logger = require("../../utils/logger");

const {
	ENROLLMENT_STATUS_VALUES: ENROLLMENT_STATUSES,
} = require("../../utils/enums");

const throwSafeError = (err, context) => {
	logger.error(`${context} failed`, { message: err.message });

	const safeMessages = new Set([
		"Fill all required fields",
		"Student already enrolled for this term",
		"No active enrollment found for this student",
		"Enrollment not found",
		"Student is not in the pending pool",
		"Session not found",
		"Promotion already completed",
		"Only active students can be enrolled",
		"Invalid enrollment status filter",
		"Not all terms are completed",
		"Promotion blocked due to result issues",
		"Promotion configuration error",
		"Student not found",
		"No active class found for next level",
	]);

	if (safeMessages.has(err.message)) throw new Error(err.message);

	throw new Error("Operation failed. Please try again.");
};

class AdminEnrollmentService {
	// ENROLL

	async enrollStudent(data) {
		try {
			const { studentId, classId, academicYear, term } = data;

			if (!studentId || !classId || !academicYear || !term) {
				throw new Error("Fill all required fields");
			}

			logger.info(`Enrolling student ${studentId} — ${academicYear} ${term}`);

			const enrollment = await EnrollmentRepository.enrollStudentWithCount({
				studentId,
				classId,
				academicYear,
				term,
				status: "ACTIVE",
			});

			logger.info(`Student enrolled — enrollmentId: ${enrollment.id}`);
			return sanitizeEnrollment(enrollment);
		} catch (err) {
			throwSafeError(err, "Enroll student");
		}
	}

	// READ

	async getActiveEnrollment(studentId) {
		try {
			const enrollment =
				await EnrollmentRepository.findActiveEnrollment(studentId);
			if (!enrollment)
				throw new Error("No active enrollment found for this student");
			return sanitizeEnrollment(enrollment);
		} catch (err) {
			throwSafeError(err, "Get active enrollment");
		}
	}

	async getEnrollmentsByClass(classId, academicYear, term, filters = {}) {
		try {
			const status = filters.status
				? String(filters.status).toUpperCase()
				: "ACTIVE";

			if (!ENROLLMENT_STATUSES.includes(status)) {
				throw new Error("Invalid enrollment status filter");
			}

			logger.info(
				`Fetching enrollments — class: ${classId}, ${academicYear} ${term}, status: ${status}`,
			);

			return EnrollmentRepository.findEnrollmentsByClass(
				classId,
				academicYear,
				term,
				status,
			);
		} catch (err) {
			throwSafeError(err, "Get class enrollments");
		}
	}

	// TRANSFER

	async transferStudent(enrollmentId, newClassId) {
		try {
			logger.info(
				`Transferring enrollment ${enrollmentId} to class ${newClassId}`,
			);

			const updated = await EnrollmentRepository.transferStudent(
				enrollmentId,
				newClassId,
			);

			logger.info(`Transfer complete — enrollmentId: ${enrollmentId}`);
			return sanitizeEnrollment(updated);
		} catch (err) {
			throwSafeError(err, "Transfer student");
		}
	}

	async bulkTransferStudents(transfers) {
		try {
			logger.info(
				`Bulk transferring ${transfers.length} students`,
			);

			const results = await EnrollmentRepository.bulkTransferStudents(
				transfers,
			);

			const successCount = results.filter(r => r.success).length;
			const failureCount = results.filter(r => !r.success).length;

			logger.info(
				`Bulk transfer complete — ${successCount} succeeded, ${failureCount} failed`,
			);

			return {
				success: true,
				total: transfers.length,
				succeeded: successCount,
				failed: failureCount,
				results,
			};
		} catch (err) {
			throwSafeError(err, "Bulk transfer students");
		}
	}

	// POOL ASSIGNMENT

	async assignFromPool(enrollmentId, classId) {
		try {
			const enrollment =
				await EnrollmentRepository.findEnrollmentById(enrollmentId);

			if (!enrollment) throw new Error("Enrollment not found");
			if (enrollment.status !== "PENDING")
				throw new Error("Student is not in the pending pool");

			logger.info(
				`Assigning student from pool — enrollmentId: ${enrollmentId}`,
			);

			const updated = await EnrollmentRepository.updateEnrollment(
				enrollmentId,
				{ classId, status: "ACTIVE" },
			);

			logger.info(`Student assigned to class: ${classId}`);
			return sanitizeEnrollment(updated);
		} catch (err) {
			throwSafeError(err, "Assign from pool");
		}
	}

	// VERIFY

	async verifyResultsForPromotion(id) {
		try {
			const session = await AcademicRepository.findSessionById(id);

			if (!session) throw new Error("Session not found");

			const completed = session.terms.filter((t) => t.status === "COMPLETED");
			if (completed.length < 3) {
				throw new Error("Not all terms are completed");
			}

			const students = await EnrollmentRepository.findActiveStudentsForSession(
				session.session,
			);

			return {
				sessionId: id,
				totalStudents: students.length,
				canPromote: true,
				readyToPromote: students.length,
			};
		} catch (err) {
			throwSafeError(err, "Verify results for promotion");
		}
	}

	// PROMOTE

	async runPromotion(id, staffId) {
		try {
			const session = await AcademicRepository.findSessionById(id);

			if (!session) throw new Error("Session not found");

			// Check if promotion already completed
			const existingRun = await EnrollmentRepository.findPromotionRunBySession(id);
			if (existingRun && existingRun.status === "COMPLETED") {
				throw new Error("Promotion already completed");
			}

			const completed = session.terms.filter((t) => t.status === "COMPLETED");
			if (completed.length < 3) {
				throw new Error("Not all terms are completed");
			}

			logger.info(`Starting promotion for session: ${id}`);

			const results = await EnrollmentRepository.promoteStudentsToNextSession(
				id,
				staffId,
			);

			logger.info(`Promotion complete — ${results.promoted} promoted, ${results.graduated} graduated, ${results.skipped} skipped`);

			return {
				sessionId: id,
				...results,
				completedAt: new Date(),
			};
		} catch (err) {
			throwSafeError(err, "Run promotion");
		}
	}
}

module.exports = new AdminEnrollmentService();
