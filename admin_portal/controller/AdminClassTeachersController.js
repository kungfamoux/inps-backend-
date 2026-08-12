const AdminSubjectsService = require("../services/AdminSubjects.service");

const assignClassTeacher = async (req, res, next) => {
	try {
		const { classId } = req.params;
		const { staffId } = req.body;
		if (!staffId) {
			return res
				.status(400)
				.json({ success: false, message: "staffId is required" });
		}
		const data = await AdminSubjectsService.assignClassTeacher(
			classId,
			staffId,
		);
		return res.status(200).json({
			success: true,
			message: "Class teacher assigned successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const removeClassTeacher = async (req, res, next) => {
	try {
		const { classId } = req.params;
		const data = await AdminSubjectsService.removeClassTeacher(
			classId,
		);
		return res.status(200).json({
			success: true,
			message: "Class teacher removed",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const assignAssistantTeacher = async (req, res, next) => {
	try {
		const { classId } = req.params;
		const { staffId } = req.body;
		if (!staffId) {
			return res
				.status(400)
				.json({ success: false, message: "staffId is required" });
		}
		const data = await AdminSubjectsService.assignAssistantTeacher(
			classId,
			staffId,
		);
		return res.status(200).json({
			success: true,
			message: "Assistant teacher assigned successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const removeAssistantTeacher = async (req, res, next) => {
	try {
		const { classId } = req.params;
		const data = await AdminSubjectsService.removeAssistantTeacher(
			classId,
		);
		return res.status(200).json({
			success: true,
			message: "Assistant teacher removed",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	assignClassTeacher,
	removeClassTeacher,
	assignAssistantTeacher,
	removeAssistantTeacher,
};
