const AdminDashboardService = require("../services/AdminDashboard.service");

const getDashboardStats = async (req, res, next) => {
	try {
		const stats = await AdminDashboardService.getDashboardStats();
		return res.status(200).json({ success: true, data: stats });
	} catch (error) {
		return next(error);
	}
};

const getUpcomingBirthdays = async (req, res, next) => {
	try {
		const birthdays = await AdminDashboardService.getUpcomingBirthdays();
		return res.status(200).json({ success: true, data: birthdays });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getDashboardStats,
	getUpcomingBirthdays,
};
