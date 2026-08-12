const ParentStudentService = require("../services/parentStudent.service");
const logger = require("../../utils/logger");

//  AUTH

const parentLogin = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "Email and password are required",
			});
		}
		const result = await ParentStudentService.parentLogin(email, password);
		return res.status(200).json(result);
	} catch (error) {
		logger.error(`parentLogin: ${error.message}`);
		return res.status(401).json({ success: false, message: error.message });
	}
};

const getMe = async (req, res, next) => {
	try {
		const data = await ParentStudentService.getMe(req.parent.id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const changePassword = async (req, res, next) => {
	try {
		const { currentPassword, newPassword } = req.body;
		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				message: "currentPassword and newPassword are required",
			});
		}
		await ParentStudentService.changePassword(
			req.parent.id,
			currentPassword,
			newPassword,
		);
		return res.status(200).json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		return next(error);
	}
};

//  CHILDREN

const getMyChildren = async (req, res, next) => {
	try {
		const data = await ParentStudentService.getMyChildren(req.parent.id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getChildProfile = async (req, res, next) => {
	try {
		const data = await ParentStudentService.getChildProfile(
			req.parent.id,
			req.params.studentId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

//  RESULTS

const getChildResults = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { termId, sessionId, filter } = req.query;
		if (!termId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "termId and sessionId are required",
			});
		}
		const data = await ParentStudentService.getChildResults(
			req.parent.id,
			studentId,
			termId,
			sessionId,
			{ filter },
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

//  ATTENDANCE

const getChildAttendanceRate = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { startDate, endDate } = req.query;
		const data = await ParentStudentService.getChildAttendanceRate(
			req.parent.id,
			studentId,
			{ startDate, endDate },
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

//  TIMETABLE

const getChildTimetable = async (req, res, next) => {
	try {
		const data = await ParentStudentService.getChildTimetable(
			req.parent.id,
			req.params.studentId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

//  ANNOUNCEMENTS

const getAnnouncements = async (req, res, next) => {
	try {
		const { category, page, limit } = req.query;
		const result = await ParentStudentService.getAnnouncements(req.parent.id, {
			category,
			page,
			limit,
		});
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const getUnreadAnnouncementCount = async (req, res, next) => {
	try {
		const data = await ParentStudentService.getUnreadAnnouncementCount(
			req.parent.id,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const markAnnouncementRead = async (req, res, next) => {
	try {
		await ParentStudentService.markAnnouncementRead(
			req.parent.id,
			req.params.announcementId,
		);
		return res.status(200).json({
			success: true,
			message: "Announcement marked as read",
		});
	} catch (error) {
		return next(error);
	}
};

//  FEES

const getOutstandingFees = async (req, res, next) => {
	try {
		const data = await ParentStudentService.getOutstandingFees(
			req.parent.id,
			req.params.studentId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getPaymentHistory = async (req, res, next) => {
	try {
		const { page, limit } = req.query;
		const result = await ParentStudentService.getPaymentHistory(
			req.parent.id,
			req.params.studentId,
			{ page, limit },
		);
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	parentLogin,
	getMe,
	changePassword,
	getMyChildren,
	getChildProfile,
	getChildResults,
	getChildAttendanceRate,
	getChildTimetable,
	getAnnouncements,
	getUnreadAnnouncementCount,
	markAnnouncementRead,
	getOutstandingFees,
	getPaymentHistory,
};
