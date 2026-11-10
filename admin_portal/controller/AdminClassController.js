const AdminClassService = require("../services/AdminClass.service");
const PDFService = require("../../shared/services/PDFService");

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
		const data = await AdminClassService.getClassById(req.params.id);
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
			req.params.id,
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
		await AdminClassService.deleteClass(req.params.id);
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
			req.params.id,
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
			req.params.id,
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
			req.params.id,
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
		await AdminClassService.removeClassTeacher(req.params.id);
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
		await AdminClassService.removeAssistantTeacher(req.params.id);
		return res.status(200).json({
			success: true,
			message: "Assistant teacher removed successfully",
		});
	} catch (error) {
		return next(error);
	}
};

const downloadClassListPDF = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { academicYear, term } = req.query;

		// Get class details
		const classData = await AdminClassService.getClassById(id);

		// Get students in the class
		const studentsData = await AdminClassService.getStudentsByClass(id, {
			status: 'ACTIVE',
			academicYear: academicYear || '2026/2027',
			term: term || 'FIRST_TERM',
		});

		// Generate PDF
		const pdfBuffer = await PDFService.generateClassListPDF(
			{
				...classData,
				academicYear: academicYear || '2026/2027',
				term: term || 'FIRST_TERM',
			},
			studentsData.data || []
		);

		// Set response headers
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader(
			'Content-Disposition',
			`attachment; filename="${classData.name.replace(/\s+/g, '_')}_Class_List.pdf"`
		);
		res.setHeader('Content-Length', pdfBuffer.length);

		// Send PDF
		return res.send(pdfBuffer);
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
	downloadClassListPDF,
};
