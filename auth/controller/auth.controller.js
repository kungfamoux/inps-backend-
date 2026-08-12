const AuthService = require("../services/auth.service");

const staffLogin = async (req, res) => {
	try {
		const { email, password } = req.body;
		const result = await AuthService.staffLogin(email, password);
		return res.status(200).json(result);
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: error.message,
		});
	}
};

const refreshToken = async (req, res) => {
	try {
		const { refreshToken } = req.body;
		const result = await AuthService.refreshToken(refreshToken);
		return res.status(200).json(result);
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: error.message,
		});
	}
};

const changePassword = async (req, res, next) => {
	try {
		const { currentPassword, newPassword } = req.body;
		await AuthService.changePassword(
			req.staff.staffId,
			currentPassword,
			newPassword,
		);
		return res.status(200).json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		const isClientError = [
			"Current password and new password are required",
			"New password must be at least 6 characters",
			"New password must be different from the current password",
			"Current password is incorrect",
			"Staff member not found",
		].includes(error.message);
		if (isClientError) {
			return res.status(400).json({ success: false, message: error.message });
		}
		return next(error);
	}
};

const getMe = async (req, res, next) => {
	try {
		const data = await AuthService.getMe(req.staff.staffId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	staffLogin,
	refreshToken,
	changePassword,
	getMe,
};
