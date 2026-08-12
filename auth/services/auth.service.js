const axios = require("axios");
const StaffRepository = require("../../admin_portal/repositories/StaffRepository");
const { sanitizeStaff } = require("../../utils/sanitizers");
const logger = require("../../utils/logger");
const { AUTH_ERRORS } = require("../../utils/firebaseAuthErrors");

if (!process.env.FIREBASE_API_KEY) {
	throw new Error("FIREBASE_API_KEY is not set in environment variables");
}

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

class AuthService {
	async staffLogin(email, password) {
		try {
			const response = await axios.post(
				`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
				{ email, password, returnSecureToken: true },
			);

			const { idToken, refreshToken, localId } = response.data;

			if (!idToken || !localId) {
				logger.warn("Firebase login response missing credentials");
				throw new Error("Authentication failed");
			}

			const staff = await StaffRepository.findByFirebaseUid(localId);

			if (!staff || staff.status === "INACTIVE") {
				logger.warn(`Unauthorized login attempt for: ${email}`);
				throw new Error("Invalid email or password");
			}

			logger.info(`Staff login successful — ${staff.email} (${staff.role})`);

			return {
				success: true,
				token: idToken,
				refreshToken,
				role: staff.role,
				user: sanitizeStaff(staff),
			};
		} catch (err) {
			logger.error("Staff login failed", {
				message: err.message,
				code: err.response?.data?.error?.message,
			});

			const firebaseError = err.response?.data?.error?.message;

			if (AUTH_ERRORS.includes(firebaseError)) {
				throw new Error("Invalid email or password");
			}

			throw new Error("Unable to login. Please try again.");
		}
	}

	// Exchanges a refresh token for a new ID token.
	// Call this when any API request returns 401 (token expired).
	// The refresh token itself does not expire unless the account
	// is deleted, disabled, or the user signs out.
	async refreshToken(refreshToken) {
		if (!refreshToken) throw new Error("Refresh token is required");

		try {
			logger.info("Refreshing Firebase token");

			const response = await axios.post(
				`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
				{
					grant_type: "refresh_token",
					refresh_token: refreshToken,
				},
			);

			const { id_token, refresh_token } = response.data;

			if (!id_token) throw new Error("Failed to refresh token");

			logger.info("Token refreshed successfully");

			return {
				success: true,
				token: id_token,
				refreshToken: refresh_token,
			};
		} catch (err) {
			const firebaseError = err.response?.data?.error?.message;
			logger.error(`Token refresh failed: ${firebaseError ?? err.message}`);

			if (
				firebaseError === "TOKEN_EXPIRED" ||
				firebaseError === "USER_DISABLED"
			) {
				throw new Error("Session expired. Please log in again.");
			}

			throw new Error("Unable to refresh session. Please log in again.");
		}
	}

	// Staff changes their own password.
	// Step 1 — verify current password is correct via Firebase sign-in.
	// Step 2 — use the returned idToken to update to the new password.
	// This ensures only the account owner can change the password.
	async changePassword(staffId, currentPassword, newPassword) {
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

		const staff = await StaffRepository.findByStaffId(staffId);
		if (!staff) throw new Error("Staff member not found");

		logger.info(`Password change attempt for staffId: ${staffId}`);

		// Step 1 — verify current password
		let idToken;
		try {
			const signInRes = await axios.post(
				`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
				{
					email: staff.email,
					password: currentPassword,
					returnSecureToken: true,
				},
			);
			idToken = signInRes.data.idToken;
		} catch (err) {
			const firebaseError = err.response?.data?.error?.message;
			if (AUTH_ERRORS.includes(firebaseError)) {
				throw new Error("Current password is incorrect");
			}
			throw new Error("Unable to verify current password. Please try again.");
		}

		// Step 2 — update to new password using the verified idToken
		try {
			await axios.post(
				`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
				{ idToken, password: newPassword, returnSecureToken: false },
			);
		} catch (err) {
			const firebaseError = err.response?.data?.error?.message;
			logger.error(`Password update failed: ${firebaseError ?? err.message}`);
			throw new Error("Failed to update password. Please try again.");
		}

		logger.info(`Password changed successfully for staffId: ${staffId}`);
	}

	async getMe(staffId) {
		logger.info(`getMe — staffId: ${staffId}`);

		const staff = await StaffRepository.findByStaffId(staffId);
		if (!staff) throw new Error("Profile not found");

		return sanitizeStaff(staff);
	}
}

module.exports = new AuthService();
