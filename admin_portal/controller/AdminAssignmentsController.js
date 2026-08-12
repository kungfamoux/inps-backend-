const AdminSubjectsService = require("../services/AdminSubjects.service");

const assignSubjectToTeacher = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.assignSubjectToTeacher(req.body);
		return res.status(201).json({
			success: true,
			message: "Subject assigned to teacher successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getAllSubjectAssignments = async (req, res, next) => {
	try {
		const { classId, subjectId, academicYear, term, status } =
			req.query;
		const data = await AdminSubjectsService.getAllSubjectAssignments({
			classId,
			subjectId,
			academicYear,
			term,
			status,
		});
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getAssignmentsByTeacher = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.getAssignmentsByTeacher(
			req.params.teacherId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getAssignmentsByClass = async (req, res, next) => {
	try {
		const { classId } = req.params;
		const { academicYear, term } = req.query;
		if (!academicYear || !term) {
			return res.status(400).json({
				success: false,
				message: "academicYear and term are required",
			});
		}
		const data = await AdminSubjectsService.getAssignmentsByClass(
			classId,
			academicYear,
			term,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const removeSubjectAssignment = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.removeSubjectAssignment(
			req.params.assignmentId,
		);
		return res.status(200).json({
			success: true,
			message: "Subject assignment removed",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const bulkAssignSubjectToTeacher = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.bulkAssignSubjectToTeacher(req.body);
		return res.status(201).json({
			success: true,
			message: "Subject assigned to teacher for multiple classes successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	assignSubjectToTeacher,
	getAllSubjectAssignments,
	getAssignmentsByTeacher,
	getAssignmentsByClass,
	removeSubjectAssignment,
	bulkAssignSubjectToTeacher,
};
