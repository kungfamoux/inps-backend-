const PDFDocument = require("pdfkit");
const archiver = require("archiver");
const path = require("path");
const fs = require("fs");
const prisma = require("../../lib/prisma");
const ReportCardRepository = require("../repositories/ReportCardRepository");
const logger = require("../../utils/logger");

class AdminReportCardService {
	// Grade scale for display
	getGradeDisplay(grade) {
		const gradeDescriptions = {
			A: "Excellent",
			C: "Good",
			D: "Fair",
			F: "Fail",
		};
		return gradeDescriptions[grade] || grade;
	}

	// Generate single student report card PDF
	async generateStudentReportCard(studentId, termId, sessionId) {
		try {
			logger.info(
				`Generating report card for student: ${studentId}, term: ${termId}`,
			);

			const data = await ReportCardRepository.getReportCardData(
				studentId,
				termId,
				sessionId,
			);

			if (!data.results || data.results.length === 0) {
				throw new Error("No verified results found for this student");
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
				this.generatePDFContent(doc, data);

				doc.end();
			});
		} catch (error) {
			logger.error("Error generating report card:", error);
			throw error;
		}
	}

	// Generate PDF content
	generatePDFContent(doc, data) {
		const { student, session, term, results, termRemarks, summary } = data;

		// School Header
		this.addSchoolHeader(doc);

		// Report Card Title
		doc.moveDown(2);
		doc.fontSize(18).font("Helvetica-Bold").text("STUDENT REPORT CARD", {
			align: "center",
		});
		doc.moveDown(1);

		// Student Information
		this.addStudentInfo(doc, student, session, term);

		// Academic Performance Table
		this.addResultsTable(doc, results);

		// Summary Statistics
		this.addSummary(doc, summary);

		// Remarks
		this.addRemarks(doc, termRemarks, student);

		// Grading Scale
		this.addGradingScale(doc);

		// Footer
		this.addFooter(doc);
	}

	// Add school header
	addSchoolHeader(doc) {
		// Add logo
		try {
			doc.image("https://res.cloudinary.com/dligmvsem/image/upload/v1786435836/logoo_ddwy4c.png", {
				fit: [100, 100],
				align: "center",
			});
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

	// Add student information
	addStudentInfo(doc, student, session, term) {
		doc.moveDown(1);
		doc.fontSize(12).font("Helvetica-Bold").text("Student Information:");
		doc.moveDown(0.5);

		const info = [
			`Name: ${student.firstName} ${student.middleName || ""} ${student.lastName}`,
			`Admission Number: ${student.admissionNumber}`,
			`Class: ${student.className || "N/A"}`,
			`Academic Session: ${session}`,
			`Term: ${term}`,
			`Class Teacher: ${student.classTeacher ? `${student.classTeacher.firstName} ${student.classTeacher.lastName}` : "N/A"}`,
		];

		doc.fontSize(10).font("Helvetica");
		info.forEach((line) => doc.text(line));
		doc.moveDown(1);
	}

	// Add results table
	addResultsTable(doc, results) {
		doc.moveDown(1);
		doc.fontSize(12).font("Helvetica-Bold").text("Academic Performance:");
		doc.moveDown(0.5);

		// Table header
		const tableTop = doc.y;
		const colWidths = [150, 40, 40, 40, 40, 40, 50, 80];
		const headers = [
			"Subject",
			"CA1",
			"CA2",
			"Exam",
			"Total",
			"Grade",
			"Position",
			"Remark",
		];

		doc.fontSize(9).font("Helvetica-Bold");
		headers.forEach((header, i) => {
			doc.text(header, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop);
		});

		// Draw header line
		doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

		// Table rows
		doc.fontSize(9).font("Helvetica");
		results.forEach((result, index) => {
			const rowY = tableTop + 25 + index * 20;
			const values = [
				result.subject.subjectName,
				result.ca1Score?.toFixed(0) || "-",
				result.ca2Score?.toFixed(0) || "-",
				result.examScore?.toFixed(0) || "-",
				result.total?.toFixed(0) || "-",
				result.grade || "-",
				result.position?.toString() || "-",
				result.subjectTeacherRemark || "-",
			];

			values.forEach((value, i) => {
				doc.text(
					value,
					50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
					rowY,
				);
			});

			// Draw row line
			doc.moveTo(50, rowY + 15).lineTo(550, rowY + 15).stroke();
		});
	}

	// Add summary statistics
	addSummary(doc, summary) {
		doc.moveDown(1);
		doc.fontSize(12).font("Helvetica-Bold").text("Summary Statistics:");
		doc.moveDown(0.5);

		const summaryInfo = [
			`Total Subjects: ${summary.totalSubjects}`,
			`Average Score: ${summary.averageScore.toFixed(2)}`,
			`Subjects Passed: ${summary.passedSubjects}/${summary.totalSubjects}`,
			`Class Size: ${summary.classEnrollmentCount} students`,
		];

		doc.fontSize(10).font("Helvetica");
		summaryInfo.forEach((line) => doc.text(line));
		doc.moveDown(1);
	}

	// Add remarks
	addRemarks(doc, termRemarks, student) {
		doc.moveDown(1);
		doc.fontSize(12).font("Helvetica-Bold").text("Remarks:");
		doc.moveDown(0.5);

		doc.fontSize(10).font("Helvetica");
		if (termRemarks.classTeacherRemark) {
			doc.text(`Class Teacher: ${termRemarks.classTeacherRemark}`);
		} else {
			doc.text("Class Teacher: No remark");
		}
		doc.moveDown(0.5);

		if (termRemarks.headTeacherRemark) {
			doc.text(`Head Teacher: ${termRemarks.headTeacherRemark}`);
		} else {
			doc.text("Head Teacher: No remark");
		}
		doc.moveDown(1);
	}

	// Add grading scale
	addGradingScale(doc) {
		doc.moveDown(1);
		doc.fontSize(12).font("Helvetica-Bold").text("Grading Scale:");
		doc.moveDown(0.5);

		const gradingScale = [
			{ grade: "A", range: "70-100", description: "Excellent" },
			{ grade: "C", range: "55-59", description: "Good" },
			{ grade: "D", range: "50-54", description: "Fair" },
			{ grade: "F", range: "0-44", description: "Fail" },
		];

		doc.fontSize(9).font("Helvetica");
		gradingScale.forEach((item) => {
			doc.text(
				`${item.grade}: ${item.range} - ${item.description}`,
				50,
				doc.y,
				{ width: 200 },
			);
		});
		doc.moveDown(1);
	}

	// Add footer
	addFooter(doc) {
		doc.moveDown(2);
		doc.fontSize(8).font("Helvetica").text(
			"This is an official document from International Nursery and Primary School",
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

	// Generate batch report cards for a class
	async generateClassReportCards(classId, termId, sessionId, format = "zip") {
		try {
			logger.info(
				`Generating batch report cards for class: ${classId}, term: ${termId}`,
			);

			const schoolConfig = await ReportCardRepository.findSchoolConfig();
			const academicYear = schoolConfig?.academicYear || "";
			const term = await prisma.academicTerm.findUnique({
				where: { id: termId },
				select: { term: true },
			});

			const students = await ReportCardRepository.findClassStudents(
				classId,
				academicYear,
				term?.term,
			);

			if (students.length === 0) {
				throw new Error("No students found in this class");
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

					students.forEach((student) => {
						const pdfBuffer = this.generateStudentReportCard(
							student.id,
							termId,
							sessionId,
						);
						archive.append(
							pdfBuffer,
							{ name: `ReportCard_${student.admissionNumber}.pdf` },
						);
					});

					archive.finalize();
				});
			} else {
				const pdfs = [];
				for (const student of students) {
					const pdfBuffer = await this.generateStudentReportCard(
						student.id,
						termId,
						sessionId,
					);
					pdfs.push({
						studentId: student.id,
						studentName: `${student.firstName} ${student.lastName}`,
						pdf: pdfBuffer,
					});
				}
				return pdfs;
			}
		} catch (error) {
			logger.error("Error generating batch report cards:", error);
			throw error;
		}
	}

	// Get report card preview data
	async getReportCardPreview(studentId, termId, sessionId) {
		try {
			logger.info(
				`Getting report card preview for student: ${studentId}, term: ${termId}`,
			);

			const data = await ReportCardRepository.getReportCardData(
				studentId,
				termId,
				sessionId,
			);

			if (!data.results || data.results.length === 0) {
				throw new Error("No verified results found for this student");
			}

			return data;
		} catch (error) {
			logger.error("Error getting report card preview:", error);
			throw error;
		}
	}
}

module.exports = new AdminReportCardService();