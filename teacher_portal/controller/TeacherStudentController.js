const TeacherStudentService = require("../services/teacherStudent.service");

// STUDENTS

const getStudentsInMyClass = async (req, res, next) => {
	try {
		const { role } = req.staff;
		const { search, page, limit } = req.query;
		const result = await TeacherStudentService.getStudentsInMyClass(
			req.staff.id,
			role,
			{ search, page, limit },
		);
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const getStudentByAdmissionNumber = async (req, res, next) => {
	try {
		const { role } = req.staff;
		const data = await TeacherStudentService.getStudentByAdmissionNumber(
			req.staff.id,
			role,
			req.params.admissionNumber,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getTotalStudentsInMyClass = async (req, res, next) => {
	try {
		const { role } = req.staff;
		const data = await TeacherStudentService.getTotalStudentsInMyClass(
			req.staff.id,
			role,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

// ATTENDANCE

const markAttendance = async (req, res, next) => {
	try {
		const { role } = req.staff;

		const data = await TeacherStudentService.markAttendance(
			req.staff.id,
			role,
			req.body,
		);

		return res.status(200).json({
			success: true,
			message: `Attendance marked for ${data.marked} student(s)`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getAttendanceByDate = async (req, res, next) => {
	try {
		const { role } = req.staff;
		const { date } = req.query;
		if (!date) {
			return res.status(400).json({
				success: false,
				message: "date query param is required (YYYY-MM-DD)",
			});
		}
		const data = await TeacherStudentService.getAttendanceByDate(
			req.staff.id,
			role,
			date,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getAttendanceSummary = async (req, res, next) => {
	try {
		const { role } = req.staff;
		const { startDate, endDate } = req.query;
		const data = await TeacherStudentService.getAttendanceSummary(
			req.staff.id,
			role,
			{ startDate, endDate },
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

// PENDING TASKS

const getPendingTasks = async (req, res, next) => {
	try {
		const { role } = req.staff;
		const data = await TeacherStudentService.getPendingTasks(
			req.staff.id,
			role,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

// SCHEDULE

const getSchedule = async (req, res, next) => {
	try {
		const { role } = req.staff;
		const data = await TeacherStudentService.getSchedule(
			req.staff.id,
			role,
			req.query,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

// EMAIL PARENTS

const emailAllParents = async (req, res, next) => {
	try {
		const { role } = req.staff;
		const data = await TeacherStudentService.emailAllParents(
			req.staff.id,
			role,
			req.body,
		);
		return res.status(200).json({
			success: true,
			message: `Email sent to ${data.sent} parent address(es)`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const emailOneParent = async (req, res, next) => {
	try {
		const { role } = req.staff;
		const data = await TeacherStudentService.emailOneParent(
			req.staff.id,
			role,
			req.params.admissionNumber,
			req.body,
		);
		return res.status(200).json({
			success: true,
			message: `Email sent to parent of ${data.student}`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getStudentsInMyClass,
	getStudentByAdmissionNumber,
	getTotalStudentsInMyClass,
	markAttendance,
	getAttendanceByDate,
	getAttendanceSummary,
	getPendingTasks,
	getSchedule,
	emailAllParents,
	emailOneParent,
};
