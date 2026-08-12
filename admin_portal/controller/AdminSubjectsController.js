const AdminSubjectsService = require("../services/AdminSubjects.service");

// SUBJECTS

const createSubject = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.createSubject(req.body);
		return res.status(201).json({
			success: true,
			message: "Subject created successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getAllSubjects = async (req, res, next) => {
	try {
		const { page, limit } = req.query;
		const result = await AdminSubjectsService.getAllSubjects({ page, limit });
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const getSubjectById = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.getSubjectById(
			req.params.subjectId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const updateSubject = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.updateSubject(
			req.params.subjectId,
			req.body,
		);
		return res.status(200).json({
			success: true,
			message: "Subject updated successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const deleteSubject = async (req, res, next) => {
	try {
		await AdminSubjectsService.deleteSubject(req.params.subjectId);
		return res.status(200).json({
			success: true,
			message: "Subject deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
};

const toggleSubjectActive = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.toggleSubjectActive(
			req.params.subjectId,
		);
		return res.status(200).json({
			success: true,
			message: `Subject ${data.isActive ? "activated" : "deactivated"} successfully`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const addSubjectLevel = async (req, res, next) => {
	try {
		const { subjectId } = req.params;
		const { level } = req.body;
		if (!level) {
			return res
				.status(400)
				.json({ success: false, message: "level is required" });
		}
		const data = await AdminSubjectsService.addSubjectLevel(subjectId, level);
		return res.status(201).json({
			success: true,
			message: "Level added to subject",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const removeSubjectLevel = async (req, res, next) => {
	try {
		const { subjectId, level } = req.params;
		await AdminSubjectsService.removeSubjectLevel(subjectId, level);
		return res.status(200).json({
			success: true,
			message: "Level removed from subject",
		});
	} catch (error) {
		return next(error);
	}
};

// CLASS CURRICULUM

const assignSubjectToClass = async (req, res, next) => {
	try {
		const { classId, subjectId } = req.params;
		const { termId } = req.body;
		const data = await AdminSubjectsService.assignSubjectToClass(
			classId,
			subjectId,
			termId,
		);
		return res.status(201).json({
			success: true,
			message: "Subject assigned to class",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const removeSubjectFromClass = async (req, res, next) => {
	try {
		const { classId, subjectId } = req.params;
		const { termId } = req.body;
		await AdminSubjectsService.removeSubjectFromClass(
			classId,
			subjectId,
			termId,
		);
		return res.status(200).json({
			success: true,
			message: "Subject removed from class",
		});
	} catch (error) {
		return next(error);
	}
};

const getSubjectsByClass = async (req, res, next) => {
	try {
		const { classId } = req.params;
		const { termId } = req.query;
		const data = await AdminSubjectsService.getSubjectsByClass(
			classId,
			termId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const bulkAssignSubjectsToClass = async (req, res, next) => {
	try {
		const { classId } = req.params;
		const { termId, subjectIds } = req.body;
		const data = await AdminSubjectsService.bulkAssignSubjectsToClass(
			classId,
			termId,
			subjectIds,
		);
		return res.status(201).json({
			success: true,
			message: `${data.added} subject(s) added to class curriculum`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	createSubject,
	getAllSubjects,
	getSubjectById,
	updateSubject,
	deleteSubject,
	toggleSubjectActive,
	addSubjectLevel,
	removeSubjectLevel,
	assignSubjectToClass,
	removeSubjectFromClass,
	getSubjectsByClass,
	bulkAssignSubjectsToClass,
};
