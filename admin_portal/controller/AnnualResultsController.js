const AnnualResultService = require("../services/AnnualResult.service");
const AnnualReportCardService = require("../services/AnnualReportCard.service");
const logger = require("../../utils/logger");

// Get annual report card data (JSON preview)
const getAnnualReportCard = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { sessionId } = req.query;

		if (!sessionId) {
			return res.status(400).json({
				success: false,
				message: "sessionId is required",
			});
		}

		logger.info(`Fetching annual report card for student: ${studentId}, session: ${sessionId}`);

		const data = await AnnualResultService.generateAnnualReportCardData(
			studentId,
			sessionId,
		);

		return res.status(200).json({
			success: true,
			data,
		});
	} catch (error) {
		logger.error("Error fetching annual report card:", error);
		return next(error);
	}
};

// Get annual report card preview (JSON only, no PDF)
const getAnnualReportCardPreview = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { sessionId } = req.query;

		if (!sessionId) {
			return res.status(400).json({
				success: false,
				message: "sessionId is required",
			});
		}

		logger.info(`Fetching annual report card preview for student: ${studentId}, session: ${sessionId}`);

		const data = await AnnualResultService.generateAnnualReportCardData(
			studentId,
			sessionId,
		);

		return res.status(200).json({
			success: true,
			data,
		});
	} catch (error) {
		logger.error("Error fetching annual report card preview:", error);
		return next(error);
	}
};

// Generate batch annual report cards for a class
const generateBatchAnnualReportCards = async (req, res, next) => {
	try {
		const { classId, sessionId } = req.body;

		if (!classId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "classId and sessionId are required",
			});
		}

		logger.info(`Generating batch annual report cards for class: ${classId}, session: ${sessionId}`);

		const result = await AnnualResultService.generateBatchAnnualReportCards(
			classId,
			sessionId,
		);

		return res.status(200).json({
			success: true,
			message: `Generated ${result.successful} annual report cards successfully`,
			data: result,
		});
	} catch (error) {
		logger.error("Error generating batch annual report cards:", error);
		return next(error);
	}
};

// Get annual statistics for a class
const getAnnualStatistics = async (req, res, next) => {
	try {
		const { classId, sessionId } = req.query;

		if (!classId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "classId and sessionId are required",
			});
		}

		logger.info(`Fetching annual statistics for class: ${classId}, session: ${sessionId}`);

		const data = await AnnualResultService.generateClassAnnualStatistics(
			classId,
			sessionId,
		);

		return res.status(200).json({
			success: true,
			data,
		});
	} catch (error) {
		logger.error("Error fetching annual statistics:", error);
		return next(error);
	}
};

// Get annual results by class (for overview)
const getAnnualResultsByClass = async (req, res, next) => {
	try {
		const { classId, sessionId } = req.query;

		if (!classId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "classId and sessionId are required",
			});
		}

		logger.info(`Fetching annual results by class: ${classId}, session: ${sessionId}`);

		const data = await AnnualResultService.generateClassAnnualStatistics(
			classId,
			sessionId,
		);

		return res.status(200).json({
			success: true,
			data,
		});
	} catch (error) {
		logger.error("Error fetching annual results by class:", error);
		return next(error);
	}
};

// Generate annual report card PDF
const generateAnnualReportCardPDF = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { sessionId } = req.query;

		if (!sessionId) {
			return res.status(400).json({
				success: false,
				message: "sessionId is required",
			});
		}

		logger.info(`Generating annual report card PDF for student: ${studentId}, session: ${sessionId}`);

		const pdfBuffer = await AnnualReportCardService.generateAnnualReportCard(
			studentId,
			sessionId,
		);

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="AnnualReportCard_${studentId}.pdf"`,
		);
		res.send(pdfBuffer);
	} catch (error) {
		logger.error("Error generating annual report card PDF:", error);
		return next(error);
	}
};

// Generate batch annual report card PDFs
const generateBatchAnnualReportCardPDFs = async (req, res, next) => {
	try {
		const { classId, sessionId, format } = req.body;

		if (!classId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "classId and sessionId are required",
			});
		}

		const downloadFormat = format || "zip";

		if (downloadFormat === "zip") {
			const zipBuffer = await AnnualReportCardService.generateBatchAnnualReportCards(
				classId,
				sessionId,
				"zip",
			);

			res.setHeader("Content-Type", "application/zip");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="AnnualReportCards_Class_${classId}.zip"`,
			);
			res.send(zipBuffer);
		} else {
			// Return individual PDFs
			const pdfs = await AnnualReportCardService.generateBatchAnnualReportCards(
				classId,
				sessionId,
				"individual",
			);

			return res.status(200).json({
				success: true,
				message: "Annual report cards generated successfully",
				data: {
					count: pdfs.length,
					reportCards: pdfs.map((pdf) => ({
						studentId: pdf.studentId,
						studentName: pdf.studentName,
						admissionNumber: pdf.admissionNumber,
					})),
				},
			});
		}
	} catch (error) {
		logger.error("Error generating batch annual report card PDFs:", error);
		return next(error);
	}
};

module.exports = {
	getAnnualReportCard,
	getAnnualReportCardPreview,
	generateBatchAnnualReportCards,
	getAnnualStatistics,
	getAnnualResultsByClass,
	generateAnnualReportCardPDF,
	generateBatchAnnualReportCardPDFs,
};
