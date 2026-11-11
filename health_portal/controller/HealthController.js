const HealthService = require("../services/HealthService");
const {
	createDrugRequestSchema,
	updateDrugRequestStatusSchema,
	createDrugPurchaseSchema,
	createSickbayVisitSchema,
	updateSickbayVisitSchema,
	uploadDailyVisitorLogSchema,
	getSickbayVisitsQuerySchema,
	getDailyVisitorLogQuerySchema,
} = require("../validators/health.validator");
const { getPassportPhotoUrl } = require("../../utils/uploadToCloudinary");

// Drug Request Controllers
const submitDrugRequest = async (req, res, next) => {
	try {
		const { notes } = req.body;
		const listImage = getPassportPhotoUrl(req);

		await createDrugRequestSchema.parseAsync({
			listImage,
			notes,
		});

		const data = await HealthService.submitDrugRequest(
			req.staff.id,
			listImage,
			notes
		);
		return res.status(201).json({
			success: true,
			message: "Drug request submitted successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getDrugRequests = async (req, res, next) => {
	try {
		const data = await HealthService.getDrugRequestsList();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getDrugRequest = async (req, res, next) => {
	try {
		const data = await HealthService.getDrugRequest(req.params.id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const updateDrugRequestStatus = async (req, res, next) => {
	try {
		const { status } = req.body;
		await updateDrugRequestStatusSchema.parseAsync({ status });

		const data = await HealthService.updateRequestStatus(
			req.params.id,
			status
		);
		return res.status(200).json({
			success: true,
			message: "Drug request status updated successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

// Drug Purchase Controllers
const recordDrugPurchase = async (req, res, next) => {
	try {
		const { requestId, amount, supplier, notes } = req.body;
		const invoiceImage = req.files?.invoiceImage?.[0]?.path;
		const receiptImage = req.files?.receiptImage?.[0]?.path;

		await createDrugPurchaseSchema.parseAsync({
			requestId,
			invoiceImage,
			receiptImage,
			amount,
			supplier,
			notes,
		});

		const data = await HealthService.recordDrugPurchase(
			requestId,
			invoiceImage,
			receiptImage,
			amount,
			supplier,
			notes
		);
		return res.status(201).json({
			success: true,
			message: "Drug purchase recorded successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getDrugPurchases = async (req, res, next) => {
	try {
		const data = await HealthService.getDrugPurchases(req.params.requestId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

// Sickbay Visit Controllers
const recordSickbayVisit = async (req, res, next) => {
	try {
		const { studentId, symptoms, treatment, medication, notes } = req.body;

		await createSickbayVisitSchema.parseAsync({
			studentId,
			symptoms,
			treatment,
			medication,
			notes,
		});

		const data = await HealthService.recordSickbayVisit(
			studentId,
			req.staff.id,
			symptoms,
			treatment,
			medication,
			notes
		);
		return res.status(201).json({
			success: true,
			message: "Sickbay visit recorded successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getSickbayVisits = async (req, res, next) => {
	try {
		const { studentId, startDate, endDate } = req.query;

		await getSickbayVisitsQuerySchema.parseAsync({
			studentId,
			startDate,
			endDate,
		});

		const data = await HealthService.getSickbayVisitsHistory(
			studentId,
			startDate,
			endDate
		);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getSickbayVisit = async (req, res, next) => {
	try {
		const data = await HealthService.getSickbayVisitsHistory(req.params.id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const updateSickbayVisit = async (req, res, next) => {
	try {
		const { symptoms, treatment, medication, notes } = req.body;

		await updateSickbayVisitSchema.parseAsync({
			symptoms,
			treatment,
			medication,
			notes,
		});

		const data = await HealthService.updateSickbayVisit(
			req.params.id,
			symptoms,
			treatment,
			medication,
			notes
		);
		return res.status(200).json({
			success: true,
			message: "Sickbay visit updated successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

// Daily Visitor Log Controllers
const uploadDailyVisitorLog = async (req, res, next) => {
	try {
		const { date } = req.body;
		const image = req.files?.dailyVisitorLog?.[0]?.path;

		await uploadDailyVisitorLogSchema.parseAsync({ date, image });

		const data = await HealthService.uploadDailyVisitorLog(date, image);
		return res.status(200).json({
			success: true,
			message: "Daily visitor log uploaded successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const getDailyVisitorLog = async (req, res, next) => {
	try {
		const { date } = req.query;

		await getDailyVisitorLogQuerySchema.parseAsync({ date });

		const data = await HealthService.getDailyVisitorLog(date);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const getDailyVisits = async (req, res, next) => {
	try {
		const { date } = req.query;

		await getDailyVisitorLogQuerySchema.parseAsync({ date });

		const data = await HealthService.getDailyVisits(date);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	// Drug Request
	submitDrugRequest,
	getDrugRequests,
	getDrugRequest,
	updateDrugRequestStatus,
	// Drug Purchase
	recordDrugPurchase,
	getDrugPurchases,
	// Sickbay Visit
	recordSickbayVisit,
	getSickbayVisits,
	getSickbayVisit,
	updateSickbayVisit,
	// Daily Visitor Log
	uploadDailyVisitorLog,
	getDailyVisitorLog,
	getDailyVisits,
};
