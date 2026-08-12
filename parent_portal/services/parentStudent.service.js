const axios = require("axios");
const ParentStudentRepository = require("../repositories/ParentRepository");
const ParentFeeRepository = require("../repositories/ParentFeeRepository");
const AuthRepository = require("../../shared/repositories/AuthRepository");
const {
	sanitizeParent,
	sanitizeResult,
	sanitizeStudent,
} = require("../../utils/sanitizers");
const logger = require("../../utils/logger");
const { AUTH_ERRORS, SAFE_LOGIN_ERRORS } = require("../../utils/firebaseAuthErrors");
const { generateSignedUrl } = require("../../utils/uploadToCloudinary");

// Signs private Cloudinary file URLs before sending to the parent portal.
const signStudentFiles = (student) => {
	if (!student) return student;
	if (student.passportPhoto) {
		student.passportPhoto = generateSignedUrl(student.passportPhoto, {
			expiresInSeconds: 3600,
			resourceType: "image",
		});
	}
	return student;
};

// RESULT FILTER VALUES
const RESULT_FILTERS = ["detail", "summary"];

class ParentStudentService {
	// AUTH
	// Parent logs in with email + phone number as password.
	async parentLogin(email, password) {
		try {
			const response = await axios.post(
				`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
				{ email, password, returnSecureToken: true },
			);

			const { idToken, refreshToken, localId } = response.data;

			if (!idToken || !localId) {
				logger.warn("Firebase login response missing credentials");
				throw new Error("Authentication failed");
			}

			const parent =
				await ParentStudentRepository.findParentByFirebaseUid(localId);

			if (!parent) {
				logger.warn(`Unauthorized login attempt for ${email}.`);
				throw new Error("Invalid email or password");
			}

			if (parent.deletedAt) {
				logger.warn(
					`Parent login blocked — account deleted: ${parent.accountEmail}`,
				);
				throw new Error(
					"Your account has been deactivated. Contact the school.",
				);
			}

			logger.info(`Parent login successful — ${parent.accountEmail}`);

			return {
				success: true,
				token: idToken,
				refreshToken,
				user: sanitizeParent(parent),
			};
		} catch (err) {
			// Our own deliberate throws above are already safe, specific
			// messages — let them through unchanged instead of flattening
			// them into the generic fallback below.
			if (err.constructor === Error && SAFE_LOGIN_ERRORS.includes(err.message)) {
				throw err;
			}

			if (err.response) {
				logger.error(`Firebase auth error — status: ${err.response.status}`);
			} else {
				logger.error(`Parent login failed: ${err.message}`);
			}

			const firebaseError = err.response?.data?.error?.message;
			if (AUTH_ERRORS.includes(firebaseError)) {
				throw new Error("Invalid email or password");
			}

			throw new Error("Unable to login. Please try again.");
		}
	}

	async getMe(parentId) {
		logger.info(`getMe — parentId: ${parentId}`);
		const parent = await ParentStudentRepository.findParentById(parentId);
		if (!parent) throw new Error("Parent account not found");
		return sanitizeParent(parent);
	}

	// Password change — parent provides current and new password
	async changePassword(parentId, currentPassword, newPassword) {
		if (!currentPassword || !newPassword) {
			throw new Error("Current password and new password are required");
		}
		if (newPassword.length < 6) {
			throw new Error("New password must be at least 6 characters");
		}
		if (currentPassword === newPassword) {
			throw new Error(
				"New password must be different from the current password",
			);
		}

		const parent = await ParentStudentRepository.findParentById(parentId);
		if (!parent) throw new Error("Parent account not found");

		logger.info(`Parent ${parentId} changing password`);

		// Verify the caller actually knows the current password before
		// allowing the change — a valid session token alone isn't enough,
		// since a compromised/shared-device token could otherwise lock the
		// real owner out permanently.
		try {
			await axios.post(
				`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
				{
					email: parent.accountEmail,
					password: currentPassword,
					returnSecureToken: true,
				},
			);
		} catch (err) {
			throw new Error("Current password is incorrect");
		}

		await AuthRepository.updatePassword(parent.firebaseUid, newPassword);

		logger.info(`Password changed for parent: ${parentId}`);
	}

	// CHILDREN

	async getMyChildren(parentId) {
		logger.info(`Fetching children for parent: ${parentId}`);
		const children = await ParentStudentRepository.findChildren(parentId);
		return children.map((c) => {
			const sanitized = signStudentFiles(sanitizeStudent(c));
			// Flatten class information from enrollments
			if (sanitized.enrollments && sanitized.enrollments.length > 0) {
				sanitized.class = sanitized.enrollments[0].class;
			}
			delete sanitized.enrollments;
			return sanitized;
		});
	}

	async getChildProfile(parentId, studentId) {
		logger.info(
			`Fetching child profile — student: ${studentId}, parent: ${parentId}`,
		);

		const student = await ParentStudentRepository.findChildProfile(
			studentId,
			parentId,
		);
		if (!student)
			throw new Error("Child not found or not linked to your account");

		const sanitized = signStudentFiles(sanitizeStudent(student));
		// Flatten class information from enrollments
		if (sanitized.enrollments && sanitized.enrollments.length > 0) {
			sanitized.class = sanitized.enrollments[0].class;
		}
		delete sanitized.enrollments;
		return sanitized;
	}

	// RESULTS
	// Only verified results are shown.
	//
	// Controlled by filter query param:
	//   filter=detail  (default) — full subject-level results with scores
	//   filter=summary           — totals, overall position, class average,
	//                              per-subject position, pass/fail breakdown

	async getChildResults(parentId, studentId, termId, sessionId, filters = {}) {
		const filter = filters.filter ?? "detail";

		if (!RESULT_FILTERS.includes(filter)) {
			throw new Error(
				`Invalid result filter "${filter}". Must be one of: ${RESULT_FILTERS.join(", ")}`,
			);
		}

		logger.info(
			`Fetching results [${filter}] for student: ${studentId} — term: ${termId}`,
		);

		const student = await ParentStudentRepository.findChildProfile(
			studentId,
			parentId,
		);
		if (!student)
			throw new Error("Child not found or not linked to your account");

		if (filter === "summary") {
			const config = await ParentStudentRepository.findLatestSchoolConfig();
			const passMark = config?.passMark ?? 55;

			const summary = await ParentStudentRepository.findResultSummary(
				studentId,
				termId,
				sessionId,
				passMark,
			);

			return {
				filter,
				...summary,
				results: summary.results.map(sanitizeResult),
			};
		}

		const results = await ParentStudentRepository.findVerifiedResults(
			studentId,
			termId,
			sessionId,
		);

		return {
			filter,
			results: results.map(sanitizeResult),
		};
	}
	// ATTENDANCE

	async getChildAttendanceRate(parentId, studentId, filters = {}) {
		logger.info(`Fetching attendance rate for student: ${studentId}`);

		const student = await ParentStudentRepository.findChildProfile(
			studentId,
			parentId,
		);
		if (!student)
			throw new Error("Child not found or not linked to your account");

		return ParentStudentRepository.findAttendanceRate(studentId, filters);
	}

	// TIMETABLE
	// Shows the class schedule for the child's enrolled section.
	// e.g. Primary 1 Yellow: Mathematics on Monday at 08:00 by Mr. Obi

	async getChildTimetable(parentId, studentId) {
		logger.info(`Fetching timetable for student: ${studentId}`);

		const student = await ParentStudentRepository.findChildProfile(
			studentId,
			parentId,
		);
		if (!student)
			throw new Error("Child not found or not linked to your account");

		const timetable = await ParentStudentRepository.findTimetableForStudent(
			studentId,
			parentId,
		);

		const grouped = timetable.reduce((acc, entry) => {
			const day = entry.dayOfWeek;
			if (!acc[day]) acc[day] = [];
			acc[day].push({
				subject: entry.subject.subjectName,
				code: entry.subject.subjectCode,
				startTime: entry.startTime,
				endTime: entry.endTime,
				teacher:
					`${entry.staff.firstName ?? ""} ${entry.staff.lastName ?? ""}`.trim(),
			});
			return acc;
		}, {});

		return grouped;
	}

	// ANNOUNCEMENTS

	async getAnnouncements(parentId, filters = {}) {
		logger.info(`Fetching announcements for parent: ${parentId}`);
		return ParentStudentRepository.findAnnouncements(parentId, filters);
	}

	async getUnreadAnnouncementCount(parentId) {
		logger.info(`Fetching unread announcement count for parent: ${parentId}`);
		return ParentStudentRepository.countUnreadAnnouncements(parentId);
	}

	async markAnnouncementRead(parentId, communicationId) {
		logger.info(
			`Marking announcement read — parent: ${parentId}, announcement: ${communicationId}`,
		);
		await ParentStudentRepository.markAnnouncementRead(
			communicationId,
			parentId,
		);
	}

	// FEES

	async getOutstandingFees(parentId, studentId) {
		logger.info(`Fetching outstanding fees for student: ${studentId}`);

		const student = await ParentStudentRepository.findChildProfile(
			studentId,
			parentId,
		);
		if (!student)
			throw new Error("Child not found or not linked to your account");

		const invoices =
			await ParentFeeRepository.findOutstandingInvoices(studentId);

		const totalOutstanding = invoices.reduce(
			(sum, inv) => sum + inv.balance,
			0,
		);

		return { totalOutstanding, invoices };
	}

	async getPaymentHistory(parentId, studentId, filters = {}) {
		logger.info(`Fetching payment history for student: ${studentId}`);

		const student = await ParentStudentRepository.findChildProfile(
			studentId,
			parentId,
		);
		if (!student)
			throw new Error("Child not found or not linked to your account");

		return ParentFeeRepository.findPaymentHistory(studentId, filters);
	}
}

module.exports = new ParentStudentService();
