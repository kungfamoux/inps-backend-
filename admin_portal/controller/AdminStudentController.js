const AdminStudentService = require("../services/AdminStudent.service");

const STRIP_FIELDS = new Set([
	"firebaseUid",
	"deletedAt",
	"parentId",
	"studentId",
	"enrollments",
	"sections",
]);

const sanitize = (data) => {
	if (Array.isArray(data)) return data.map(sanitize);

	if (data !== null && typeof data === "object" && !(data instanceof Date)) {
		const clean = {};
		const isEnrollmentObject = 'studentId' in data && 'classId' in data && 'academicYear' in data;
		
		for (const [key, value] of Object.entries(data)) {
			// Always strip enrollments and sections fields at any level
			if (key === 'enrollments' || key === 'sections') {
				continue;
			}
			// Preserve 'class' field as it's the flattened enrollment class info
			if (key === 'class') {
				clean[key] = value;
				continue;
			}
			// Strip sensitive fields, but preserve 'id' for enrollment objects
			if (STRIP_FIELDS.has(key)) {
				// If this is an enrollment object and we're processing the 'id' field, keep it
				if (isEnrollmentObject && key === 'id') {
					clean[key] = value;
					continue;
				}
				continue;
			}
			clean[key] = sanitize(value);
		}
		return clean;
	}

	return data;
};

// Controllers

const createStudent = async (req, res, next) => {
	try {
		let parentData;

		try {
			parentData =
				typeof req.body.parentData === "string"
					? JSON.parse(req.body.parentData)
					: req.body.parentData;
		} catch {
			return res.status(400).json({
				success: false,
				message: "Invalid parentData format",
			});
		}

		const data = {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			middleName: req.body.middleName,
			gender: req.body.gender,
			dateOfBirth: req.body.dateOfBirth,
			nationality: req.body.nationality,
			state: req.body.state,
			lga: req.body.lga,
			religion: req.body.religion,
			healthInfo: req.body.healthInfo,
			bloodGroup: req.body.bloodGroup,
			sportHouse: req.body.sportHouse,
			address: req.body.address,
			accountPhone: req.body.accountPhone,
			accountEmail: req.body.accountEmail,
			intakeType: req.body.intakeType,
			studentType: req.body.studentType,
			admissionDate: req.body.admissionDate,
			graduationDate: req.body.graduationDate,
			parentData,
		};

		const student = await AdminStudentService.createStudent(data, req.files);

		return res.status(201).json({
			success: true,
			message: "Student registered successfully",
			data: sanitize(student),
		});
	} catch (error) {
		return next(error);
	}
};

const getAllStudents = async (req, res, next) => {
	try {
		const { status, page, limit, academicYear, term } = req.query;
		const result = await AdminStudentService.getAllStudents({
			status,
			page,
			limit,
			academicYear,
			term,
		});
		return res.status(200).json({
			success: true,
			data: sanitize(result.data),
			meta: result.meta,
		});
	} catch (error) {
		return next(error);
	}
};

const getStudentByAdmissionNumber = async (req, res, next) => {
	try {
		const student = await AdminStudentService.getStudentByAdmissionNumber(
			req.params.admissionNumber,
		);
		return res.status(200).json({ success: true, data: sanitize(student) });
	} catch (error) {
		return next(error);
	}
};

const updateStudent = async (req, res, next) => {
	try {
		const student = await AdminStudentService.updateStudent(
			req.params.admissionNumber,
			req.body,
		);
		return res.status(200).json({
			success: true,
			message: "Student updated successfully",
			data: sanitize(student),
		});
	} catch (error) {
		return next(error);
	}
};

const deleteStudent = async (req, res, next) => {
	try {
		const staffId = req.staff.id;
		await AdminStudentService.deleteStudent(req.params.admissionNumber, staffId);
		return res.status(200).json({
			success: true,
			message: "Student record deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
};

// Handles both filter=all (default) and filter=term (requires termId + sessionId).
// The service's getStudentResults method owns the branching logic.
const getStudentResults = async (req, res, next) => {
	try {
		const { filter, termId, sessionId } = req.query;
		const results = await AdminStudentService.getStudentResults(
			req.params.admissionNumber,
			{ filter, termId, sessionId },
		);
		return res.status(200).json({ success: true, data: sanitize(results) });
	} catch (error) {
		return next(error);
	}
};

const getAllResults = async (req, res, next) => {
	try {
		const { sessionId, termId, page, limit } = req.query;
		const result = await AdminStudentService.getAllResults({
			sessionId,
			termId,
			page,
			limit,
		});
		return res.status(200).json({
			success: true,
			data: sanitize(result.data),
			meta: result.meta,
		});
	} catch (error) {
		return next(error);
	}
};

const getStudentSubjects = async (req, res, next) => {
	try {
		const subjects = await AdminStudentService.getStudentSubjects(
			req.params.admissionNumber,
		);
		return res.status(200).json({ success: true, data: sanitize(subjects) });
	} catch (error) {
		return next(error);
	}
};

const getResultsBySubject = async (req, res, next) => {
	try {
		const { level, sessionId, termId, page, limit } = req.query;
		const result = await AdminStudentService.getResultsBySubject(
			req.params.subjectCode,
			{ level, sessionId, termId, page, limit },
		);
		return res.status(200).json({
			success: true,
			subject: result.subject,
			data: sanitize(result.data),
			meta: result.meta,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	createStudent,
	getAllStudents,
	getStudentByAdmissionNumber,
	updateStudent,
	deleteStudent,
	getStudentResults,
	getAllResults,
	getStudentSubjects,
	getResultsBySubject,
};
