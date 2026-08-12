const AdminReportCardService = require("../services/AdminReportCard.service");

// Generate single student report card PDF
const generateStudentReportCard = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { termId, sessionId } = req.query;

		if (!termId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "termId and sessionId are required",
			});
		}

		const pdfBuffer = await AdminReportCardService.generateStudentReportCard(
			studentId,
			termId,
			sessionId,
		);

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="ReportCard_${studentId}.pdf"`,
		);
		res.send(pdfBuffer);
	} catch (error) {
		return next(error);
	}
};

// Generate batch report cards for a class
const generateClassReportCards = async (req, res, next) => {
	try {
		const { classId, termId, sessionId, format } = req.body;

		if (!classId || !termId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "classId, termId, and sessionId are required",
			});
		}

		const downloadFormat = format || "zip";

		if (downloadFormat === "zip") {
			const zipBuffer = await AdminReportCardService.generateClassReportCards(
				classId,
				termId,
				sessionId,
				"zip",
			);

			res.setHeader("Content-Type", "application/zip");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="ReportCards_Class_${classId}.zip"`,
			);
			res.send(zipBuffer);
		} else {
			// Return individual PDFs
			const pdfs = await AdminReportCardService.generateClassReportCards(
				classId,
				termId,
				sessionId,
				"individual",
			);

			return res.status(200).json({
				success: true,
				message: "Report cards generated successfully",
				data: {
					count: pdfs.length,
					reportCards: pdfs.map((pdf) => ({
						studentId: pdf.studentId,
						studentName: pdf.studentName,
						// Note: PDF data is included but might be large
						// In production, consider returning URLs instead
					})),
				},
			});
		}
	} catch (error) {
		return next(error);
	}
};

// Get report card preview data (JSON)
const previewReportCard = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { termId, sessionId } = req.query;

		if (!termId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "termId and sessionId are required",
			});
		}

		const data = await AdminReportCardService.getReportCardPreview(
			studentId,
			termId,
			sessionId,
		);

		return res.status(200).json({
			success: true,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	generateStudentReportCard,
	generateClassReportCards,
	previewReportCard,
};
