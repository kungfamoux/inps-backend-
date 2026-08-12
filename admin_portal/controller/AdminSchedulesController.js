const AdminSubjectsService = require("../services/AdminSubjects.service");

const createSchedule = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.createSchedule(req.body);
		return res.status(201).json({
			success: true,
			message: "Schedule created successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getSchedulesByClass = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.getSchedulesByClass(
			req.params.classId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getSchedulesByTeacher = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.getSchedulesByTeacher(
			req.params.staffId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const deleteSchedule = async (req, res, next) => {
	try {
		await AdminSubjectsService.deleteSchedule(req.params.scheduleId);
		return res.status(200).json({
			success: true,
			message: "Schedule deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	createSchedule,
	getSchedulesByClass,
	getSchedulesByTeacher,
	deleteSchedule,
};
