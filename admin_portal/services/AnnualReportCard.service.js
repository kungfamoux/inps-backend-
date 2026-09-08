const PDFDocument = require("pdfkit");
const archiver = require("archiver");
const path = require("path");
const fs = require("fs");
const AnnualResultService = require("./AnnualResult.service");
const logger = require("../../utils/logger");

class AnnualReportCardService {
	// Generate single student annual report card PDF
	async generateAnnualReportCard(studentId, sessionId) {
		try {
			logger.info(
				`Generating annual report card PDF for student: ${studentId}, session: ${sessionId}`,
			);

			const data = await AnnualResultService.generateAnnualReportCardData(
				studentId,
				sessionId,
			);

			if (!data.results || data.results.length === 0) {
				throw new Error("No results found for this student in the session");
			}

			return new Promise((resolve, reject) => {
				const doc = new PDFDocument({
					size: "A4",
					margins: { top: 50, bottom: 50, left: 50, right: 50 },
				});
				const chunks = [];

				doc.on("data", (chunk) => chunks.push(chunk));
				doc.on("end", () => {
					resolve(Buffer.concat(chunks));
				});
				doc.on("error", reject);

				// Generate PDF content
				this.generateAnnualPDFContent(doc, data);

				doc.end();
			});
		} catch (error) {
			logger.error("Error generating annual report card PDF:", error);
			throw error;
		}
	}

	// Generate annual PDF content
	generateAnnualPDFContent(doc, data) {
		const { student, results, classStats, remarks, summary, sessionName } = data;

		// School Header
		this.addSchoolHeader(doc);

		// Report Card Title
		doc.moveDown(2);
		doc.fontSize(18).font("Helvetica-Bold").text("ANNUAL REPORT CARD", {
			align: "center",
		});
		doc.moveDown(1);

		// Student Information
		this.addAnnualStudentInfo(doc, student, sessionName, classStats);

		// Academic Performance Table
		this.addAnnualResultsTable(doc, results);

		// Summary Statistics
		this.addAnnualSummary(doc, summary);

		// Remarks
		this.addAnnualRemarks(doc, remarks, student);

		// Grading Scale
		this.addAnnualGradingScale(doc);

		// Footer
		this.addFooter(doc);
	}

	// Add school header
	addSchoolHeader(doc) {
		// Add logo from local file to avoid timeout
		try {
			const logoPath = path.join(__dirname, "../../../public/assets/logo.png");
			if (fs.existsSync(logoPath)) {
				doc.image(logoPath, {
					fit: [100, 100],
					align: "center",
				});
			}
		} catch (error) {
			console.log("Could not load logo:", error);
		}

		doc.fontSize(16).font("Helvetica-Bold").text("International Nursery and Primary School", {
			align: "center",
		});
		doc.fontSize(10).font("Helvetica").text("Trans-Ekulu Enugu", {
			align: "center",
		});
	}

	// Add student information with annual data
	addAnnualStudentInfo(doc, student, sessionName, classStats) {
		doc.moveDown(1);
		doc.fontSize(12).font("Helvetica-Bold").text("Student Information:");
		doc.moveDown(0.5);

		const info = [
			`Name: ${student.firstName} ${student.middleName || ""} ${student.lastName}`,
			`Admission Number: ${student.admissionNumber}`,
			`Class: ${student.className || "N/A"}`,
			`Academic Session: ${sessionName || "N/A"}`,
			`Age: ${student.age || "N/A"}`,
		];

		if (classStats) {
			info.push(`Class Age Average: ${classStats.ageAverage}`);
			info.push(`No. in Class: ${classStats.classSize}`);
		}

		doc.fontSize(10).font("Helvetica");
		info.forEach((line) => doc.text(line));
		doc.moveDown(1);
	}

	// Add annual results table with cumulative data
	addAnnualResultsTable(doc, results) {
		doc.moveDown(1);
		doc.fontSize(12).font("Helvetica-Bold").text("Academic Performance (Annual):");
		doc.moveDown(0.5);

		// Table header
		const tableTop = doc.y;
		const colWidths = [120, 35, 35, 35, 40, 40, 40, 50, 40, 50, 80];
		const headers = [
			"Subject",
			"Test1",
			"Test2",
			"Exam",
			"Total",
			"2nd",
			"1st",
			"Cumul",
			"Avg",
			"Grade",
			"Position",
			"Remark",
		];

		doc.fontSize(8).font("Helvetica-Bold");
		headers.forEach((header, i) => {
			doc.text(header, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop);
		});

		// Draw header line
		doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).stroke();

		// Table rows
		doc.fontSize(7).font("Helvetica");
		results.forEach((result, index) => {
			const rowY = tableTop + 20 + index * 18;
			const values = [
				result.subjectName,
				"-", // Test1 (current term - would need current term data)
				"-", // Test2 (current term - would need current term data)
				"-", // Exam (current term - would need current term data)
				result.thirdTerm?.toFixed(0) || "-", // Current term total
				result.secondTerm?.toFixed(0) || "-",
				result.firstTerm?.toFixed(0) || "-",
				result.cumulative?.toFixed(0) || "-",
				result.weightedAverage?.toFixed(1) || "-",
				result.annualGrade || "-",
				result.annualPosition?.toString() || "-",
				result.remark || "-",
			];

			values.forEach((value, i) => {
				doc.text(
					value,
					50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
					rowY,
				);
			});

			// Draw row line
			doc.moveTo(50, rowY + 14).lineTo(550, rowY + 14).stroke();
		});
	}

	// Add annual summary statistics
	addAnnualSummary(doc, summary) {
		doc.moveDown(1);
		doc.fontSize(12).font("Helvetica-Bold").text("Summary Statistics:");
		doc.moveDown(0.5);

		const summaryInfo = [
			`Total Subjects: ${summary.totalSubjects}`,
			`Total Cumulative Score: ${summary.totalCumulative.toFixed(0)}`,
			`Average Cumulative: ${summary.averageCumulative.toFixed(2)}`,
			`Overall Percentage: ${summary.overallPercentage.toFixed(2)}%`,
			`Subjects Passed: ${summary.passedSubjects}/${summary.totalSubjects}`,
		];

		doc.fontSize(10).font("Helvetica");
		summaryInfo.forEach((line) => doc.text(line));
		doc.moveDown(1);
	}

	// Add annual remarks
	addAnnualRemarks(doc, remarks, student) {
		doc.moveDown(1);
		doc.fontSize(12).font("Helvetica-Bold").text("Remarks:");
		doc.moveDown(0.5);

		doc.fontSize(9).font("Helvetica");
		
		// Class teacher remarks by term
		if (remarks.classTeacherRemarks && remarks.classTeacherRemarks.length > 0) {
			doc.text("Class Teacher Remarks:");
			remarks.classTeacherRemarks.forEach((remark) => {
				doc.text(`  ${remark.term}: ${remark.remark}`, 50, doc.y);
			});
		} else {
			doc.text("Class Teacher: No remarks available");
		}
		
		doc.moveDown(0.5);

		// Head teacher remarks by term
		if (remarks.headTeacherRemarks && remarks.headTeacherRemarks.length > 0) {
			doc.text("Head Teacher Remarks:");
			remarks.headTeacherRemarks.forEach((remark) => {
				doc.text(`  ${remark.term}: ${remark.remark}`, 50, doc.y);
			});
		} else {
			doc.text("Head Teacher: No remarks available");
		}
		
		doc.moveDown(1);
	}

	// Add annual grading scale
	addAnnualGradingScale(doc) {
		doc.moveDown(1);
		doc.fontSize(12).font("Helvetica-Bold").text("Annual Grading Scale:");
		doc.moveDown(0.5);

		const gradingScale = [
			{ grade: "A", range: "270-300", description: "Distinction (90%+)" },
			{ grade: "C", range: "210-269", description: "Credit (70-89%)" },
			{ grade: "P", range: "165-209", description: "Pass (55-69%)" },
			{ grade: "F", range: "0-164", description: "Fail (Below 55%)" },
		];

		doc.fontSize(9).font("Helvetica");
		gradingScale.forEach((item) => {
			doc.text(
				`${item.grade}: ${item.range} - ${item.description}`,
				50,
				doc.y,
				{ width: 300 },
			);
		});
		doc.moveDown(1);
	}

	// Add footer
	addFooter(doc) {
		doc.moveDown(2);
		doc.fontSize(8).font("Helvetica").text(
			"This is an official annual report card from International Nursery and Primary School",
			{ align: "center" },
		);
		doc.text(`Generated on: ${new Date().toLocaleDateString()}`, {
			align: "center",
		});

		// Signature placeholders
		doc.moveDown(1);
		doc.text("_________________", 100, doc.y);
		doc.text("Class Teacher", 100, doc.y + 15);

		doc.text("_________________", 350, doc.y - 20);
		doc.text("Head Teacher", 350, doc.y + 15);
	}

	// Generate batch annual report cards for a class
	async generateBatchAnnualReportCards(classId, sessionId, format = "zip") {
		try {
			logger.info(
				`Generating batch annual report cards for class: ${classId}, session: ${sessionId}`,
			);

			const batchData = await AnnualResultService.generateBatchAnnualReportCards(
				classId,
				sessionId,
			);

			if (batchData.successful === 0) {
				throw new Error("No report cards generated successfully");
			}

			if (format === "zip") {
				return new Promise((resolve, reject) => {
					const archive = archiver("zip", { zlib: { level: 9 } });
					const chunks = [];

					archive.on("data", (chunk) => chunks.push(chunk));
					archive.on("end", () => {
						resolve(Buffer.concat(chunks));
					});
					archive.on("error", reject);

					// Generate PDFs and add to archive
					const pdfPromises = batchData.reportCards.map(async (reportCard) => {
						try {
							const pdfBuffer = await this.generateAnnualReportCard(
								reportCard.studentId,
								sessionId,
							);
							return {
								admissionNumber: reportCard.admissionNumber,
								pdfBuffer,
							};
						} catch (error) {
							logger.error(
								`Error generating PDF for student ${reportCard.studentId}:`,
								error,
							);
							return null;
						}
					});

					Promise.all(pdfPromises).then((pdfs) => {
						pdfs.forEach((pdf) => {
							if (pdf) {
								archive.append(
									pdf.pdfBuffer,
									{ name: `AnnualReportCard_${pdf.admissionNumber}.pdf` },
								);
							}
						});
						archive.finalize();
					});
				});
			} else {
				// Return individual PDFs
				const pdfs = [];
				for (const reportCard of batchData.reportCards) {
					try {
						const pdfBuffer = await this.generateAnnualReportCard(
							reportCard.studentId,
							sessionId,
						);
						pdfs.push({
							studentId: reportCard.studentId,
							studentName: reportCard.studentName,
							admissionNumber: reportCard.admissionNumber,
							pdf: pdfBuffer,
						});
					} catch (error) {
						logger.error(
							`Error generating PDF for student ${reportCard.studentId}:`,
							error,
						);
					}
				}
				return pdfs;
			}
		} catch (error) {
			logger.error("Error generating batch annual report cards:", error);
			throw error;
		}
	}

	// Get annual report card preview data
	async getAnnualReportCardPreview(studentId, sessionId) {
		try {
			logger.info(
				`Getting annual report card preview for student: ${studentId}, session: ${sessionId}`,
			);

			const data = await AnnualResultService.generateAnnualReportCardData(
				studentId,
				sessionId,
			);

			if (!data.results || data.results.length === 0) {
				throw new Error("No results found for this student in the session");
			}

			return data;
		} catch (error) {
			logger.error("Error getting annual report card preview:", error);
			throw error;
		}
	}
}

module.exports = new AnnualReportCardService();
