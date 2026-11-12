const ProprietorService = require("../services/ProprietorService");
const logger = require("../../utils/logger");

const getDashboardStats = async (req, res, next) => {
	try {
		const stats = await ProprietorService.getDashboardStats();
		return res.status(200).json({ success: true, data: stats });
	} catch (error) {
		return next(error);
	}
};

const getFinancialAnalytics = async (req, res, next) => {
	try {
		const analytics = await ProprietorService.getFinancialAnalytics(req.query);
		return res.status(200).json({ success: true, data: analytics });
	} catch (error) {
		return next(error);
	}
};

const getStaffOverview = async (req, res, next) => {
	try {
		const overview = await ProprietorService.getStaffOverview(req.query);
		return res.status(200).json({ success: true, data: overview });
	} catch (error) {
		return next(error);
	}
};

const getStaffStatistics = async (req, res, next) => {
	try {
		const stats = await ProprietorService.getStaffStatistics();
		return res.status(200).json({ success: true, data: stats });
	} catch (error) {
		return next(error);
	}
};

const getStudentEnrollmentOverview = async (req, res, next) => {
	try {
		const overview = await ProprietorService.getStudentEnrollmentOverview(req.query);
		return res.status(200).json({ success: true, data: overview });
	} catch (error) {
		return next(error);
	}
};

const getAcademicPerformanceMetrics = async (req, res, next) => {
	try {
		const metrics = await ProprietorService.getAcademicPerformanceMetrics();
		return res.status(200).json({ success: true, data: metrics });
	} catch (error) {
		return next(error);
	}
};

const getSchoolConfiguration = async (req, res, next) => {
	try {
		const config = await ProprietorService.getSchoolConfiguration();
		return res.status(200).json({ success: true, data: config });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getDashboardStats,
	getFinancialAnalytics,
	getStaffOverview,
	getStaffStatistics,
	getStudentEnrollmentOverview,
	getAcademicPerformanceMetrics,
	getSchoolConfiguration,
};
