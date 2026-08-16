const AdminEnrollmentService = require("../services/AdminEnrollment.service");

const enrollStudent = async (req, res, next) => {
	try {
		const data = await AdminEnrollmentService.enrollStudent(req.body);
		return res.status(201).json({
			success: true,
			message: "Student enrolled successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getActiveEnrollment = async (req, res, next) => {
	try {
		const data = await AdminEnrollmentService.getActiveEnrollment(
			req.params.studentId,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

// Handles both active enrollments and the pending pool via ?status=PENDING.
// Replaces the old separate getPendingEnrollments endpoint.
const getEnrollmentsByClass = async (req, res, next) => {
	try {
		const { classId } = req.params;
		const { academicYear, term, status } = req.query;

		if (!academicYear || !term) {
			return res.status(400).json({
				success: false,
				message: "academicYear and term are required query params",
			});
		}

		const data = await AdminEnrollmentService.getEnrollmentsByClass(
			classId,
			academicYear,
			term,
			{ status },
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const transferStudent = async (req, res, next) => {
	try {
		const { enrollmentId } = req.params;
		const { newClassId } = req.body;

		if (!newClassId) {
			return res.status(400).json({
				success: false,
				message: "newClassId is required",
			});
		}

		const data = await AdminEnrollmentService.transferStudent(
			enrollmentId,
			newClassId,
		);
		return res.status(200).json({
			success: true,
			message: "Student transferred successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const bulkTransferStudents = async (req, res, next) => {
	try {
		const { transfers } = req.body;

		if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
			return res.status(400).json({
				success: false,
				message: "transfers array is required",
			});
		}

		// Validate each transfer has enrollmentId and newClassId
		for (const transfer of transfers) {
			if (!transfer.enrollmentId || !transfer.newClassId) {
				return res.status(400).json({
					success: false,
					message: "Each transfer must have enrollmentId and newClassId",
				});
			}
		}

		const data = await AdminEnrollmentService.bulkTransferStudents(transfers);
		return res.status(200).json({
			success: true,
			message: "Bulk transfer completed",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const assignFromPool = async (req, res, next) => {
	try {
		const { enrollmentId } = req.params;
		const { classId } = req.body;

		if (!classId) {
			return res.status(400).json({
				success: false,
				message: "classId is required",
			});
		}

		const data = await AdminEnrollmentService.assignFromPool(
			enrollmentId,
			classId,
		);
		return res.status(200).json({
			success: true,
			message: "Student assigned to class successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const verifyResultsForPromotion = async (req, res, next) => {
	try {
		const data = await AdminEnrollmentService.verifyResultsForPromotion(
			req.params.id,
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const runPromotion = async (req, res, next) => {
	try {
		const { id } = req.params;
		const staffId = req.staff.id;

		const data = await AdminEnrollmentService.runPromotion(id, staffId);
		return res.status(200).json({
			success: true,
			message: "Promotion completed successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	enrollStudent,
	getActiveEnrollment,
	getEnrollmentsByClass,
	transferStudent,
	bulkTransferStudents,
	assignFromPool,
	verifyResultsForPromotion,
	runPromotion,
};
