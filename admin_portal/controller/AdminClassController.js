const AdminClassService = require("../services/AdminClass.service");

// CLASSES
const createClass = async (req, res, next) => {
	try {
		const data = await AdminClassService.createClass(req.body);
		return res.status(201).json({
			success: true,
			message: "Class created successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getAllClasses = async (req, res, next) => {
	try {
		const { status, color } = req.query;
		const data = await AdminClassService.getAllClasses({ status, color });
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getClassById = async (req, res, next) => {
	try {
		const data = await AdminClassService.getClassById(req.params.classId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getClassByName = async (req, res, next) => {
	try {
		const data = await AdminClassService.getClassByName(req.params.name);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const updateClass = async (req, res, next) => {
	try {
		const data = await AdminClassService.updateClass(
			req.params.classId,
			req.body,
		);
		return res.status(200).json({
			success: true,
			message: "Class updated successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const deleteClass = async (req, res, next) => {
	try {
		await AdminClassService.deleteClass(req.params.classId);
		return res.status(200).json({
			success: true,
			message: "Class deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
};

const getStudentsByClass = async (req, res, next) => {
	try {
		const { status, academicYear, term } = req.query;
		const data = await AdminClassService.getStudentsByClass(
			req.params.classId,
			{ status, academicYear, term },
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const assignClassTeacher = async (req, res, next) => {
	try {
		const data = await AdminClassService.assignClassTeacher(
			req.params.classId,
			req.body.teacherId,
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

const assignAssistantTeacher = async (req, res, next) => {
	try {
		const data = await AdminClassService.assignAssistantTeacher(
			req.params.classId,
			req.body.teacherId,
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

const removeClassTeacher = async (req, res, next) => {
	try {
		await AdminClassService.removeClassTeacher(req.params.classId);
		return res.status(200).json({
			success: true,
			message: "Class teacher removed successfully",
		});
	} catch (error) {
		return next(error);
	}
};

const removeAssistantTeacher = async (req, res, next) => {
	try {
		await AdminClassService.removeAssistantTeacher(req.params.classId);
		return res.status(200).json({
			success: true,
			message: "Assistant teacher removed successfully",
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	createClass,
	getAllClasses,
	getClassById,
	getClassByName,
	updateClass,
	deleteClass,
	getStudentsByClass,
	assignClassTeacher,
	assignAssistantTeacher,
	removeClassTeacher,
	removeAssistantTeacher,
};
