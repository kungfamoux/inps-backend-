const TeacherResultService = require("../services/teacherResult.service");

//  MARK BOOK / ASSIGNED SUBJECTS

const getMyAssignedSubjects = async (req, res, next) => {
	try {
		const { academicYear, term } = req.query;
		const data = await TeacherResultService.getMyAssignedSubjects(
			req.staff.id,
			academicYear,
			term,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

//  STUDENT-CENTRIC UPLOAD FLOW

const getMyAssignedClasses = async (req, res, next) => {
	try {
		const { academicYear, term } = req.query;
		const data = await TeacherResultService.getMyAssignedClasses(
			req.staff.id,
			academicYear,
			term,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getStudentsInAssignedSection = async (req, res, next) => {
	try {
		const { sectionId } = req.params;
		const { academicYear, term, search, page, limit } = req.query;
		const result = await TeacherResultService.getStudentsInAssignedSection(
			req.staff.id,
			sectionId,
			{ academicYear, term, search, page, limit },
		);
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const getSubjectsForStudent = async (req, res, next) => {
	try {
		const { sectionId, studentId } = req.params;
		const { academicYear, term, termId, sessionId } = req.query;
		const data = await TeacherResultService.getSubjectsForStudent(
			req.staff.id,
			sectionId,
			studentId,
			{ academicYear, term, termId, sessionId },
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const uploadResultsForStudent = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const data = await TeacherResultService.uploadResultsForStudent(
			req.staff.id,
			studentId,
			req.body,
		);
		return res.status(201).json({
			success: true,
			message: `${data.uploaded} result(s) uploaded for student`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getStudentsWithResults = async (req, res, next) => {
	try {
		const { sectionId, subjectId } = req.params;
		const { termId, sessionId } = req.query;
		if (!termId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "termId and sessionId are required query params",
			});
		}
		const data = await TeacherResultService.getStudentsWithResults(
			req.staff.id,
			sectionId,
			subjectId,
			termId,
			sessionId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

//  UPLOAD RESULTS

const uploadResult = async (req, res, next) => {
	try {
		const data = await TeacherResultService.uploadResult(
			req.staff.id,
			req.body,
		);
		return res.status(201).json({
			success: true,
			message:
				"Result uploaded successfully. Rankings will update after recalculation.",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const bulkUploadResults = async (req, res, next) => {
	try {
		const data = await TeacherResultService.bulkUploadResults(
			req.staff.id,
			req.body,
		);
		return res.status(201).json({
			success: true,
			message: `${data.uploaded} result(s) uploaded successfully`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const recalculateResults = async (req, res, next) => {
	try {
		const { sectionId, subjectId, termId, sessionId } = req.body;

		if (!sectionId || !subjectId || !termId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "sectionId, subjectId, termId, and sessionId are required",
			});
		}

		const data = await TeacherResultService.recalculateResults(req.staff.id, {
			sectionId,
			subjectId,
			termId,
			sessionId,
		});

		return res.status(200).json({
			success: true,
			message: "Result rankings recalculated successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getStudentResultSheet = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { termId, sessionId } = req.query;
		if (!termId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "termId and sessionId are required",
			});
		}
		const data = await TeacherResultService.getStudentResultSheet(
			req.staff.id,
			studentId,
			termId,
			sessionId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

//  CLASS TEACHER REMARKS

const addClassTeacherRemark = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { termId, sessionId, remark } = req.body;
		if (!termId || !sessionId || !remark) {
			return res.status(400).json({
				success: false,
				message: "termId, sessionId, and remark are required",
			});
		}
		const data = await TeacherResultService.addClassTeacherRemark(
			req.staff.id,
			studentId,
			termId,
			sessionId,
			remark,
		);
		return res.status(200).json({
			success: true,
			message: "Class teacher remark added",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

//  BEHAVIORAL RATINGS

const getAllTraits = async (req, res, next) => {
	try {
		const data = await TeacherResultService.getAllTraits();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const submitBehavioralRatings = async (req, res, next) => {
	try {
		const data = await TeacherResultService.submitBehavioralRatings(
			req.staff.id,
			req.body,
		);
		return res.status(200).json({
			success: true,
			message: `${data.saved} behavioral rating(s) saved`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getBehavioralRatings = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { academicYear, term } = req.query;
		if (!academicYear || !term) {
			return res.status(400).json({
				success: false,
				message: "academicYear and term are required",
			});
		}
		const data = await TeacherResultService.getBehavioralRatings(
			req.staff.id,
			studentId,
			academicYear,
			term,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

//  NURSERY ASSESSMENTS

const getAllAssessmentItems = async (req, res, next) => {
	try {
		const data = await TeacherResultService.getAllAssessmentItems();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const submitNurseryAssessments = async (req, res, next) => {
	try {
		const data = await TeacherResultService.submitNurseryAssessments(
			req.staff.id,
			req.body,
		);
		return res.status(200).json({
			success: true,
			message: `${data.saved} nursery assessment(s) saved`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getNurseryAssessments = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { academicYear, term } = req.query;
		if (!academicYear || !term) {
			return res.status(400).json({
				success: false,
				message: "academicYear and term are required",
			});
		}
		const data = await TeacherResultService.getNurseryAssessments(
			req.staff.id,
			studentId,
			academicYear,
			term,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

//  HEAD TEACHER REMARKS

const addHeadTeacherRemark = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { termId, sessionId, remark } = req.body;
		if (!termId || !sessionId || !remark) {
			return res.status(400).json({
				success: false,
				message: "termId, sessionId, and remark are required",
			});
		}
		const data = await TeacherResultService.addHeadTeacherRemark(
			req.staff.id,
			studentId,
			termId,
			sessionId,
			remark,
		);
		return res.status(200).json({
			success: true,
			message: "Head teacher remark added",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getMyAssignedSubjects,
	getMyAssignedClasses,
	getStudentsInAssignedSection,
	getSubjectsForStudent,
	uploadResultsForStudent,
	getStudentsWithResults,
	uploadResult,
	bulkUploadResults,
	recalculateResults,
	getStudentResultSheet,
	addClassTeacherRemark,
	getAllTraits,
	submitBehavioralRatings,
	getBehavioralRatings,
	getAllAssessmentItems,
	submitNurseryAssessments,
	getNurseryAssessments,
	addHeadTeacherRemark,
};
