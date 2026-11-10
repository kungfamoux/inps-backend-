const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

/**
 * PDF Service for generating various PDF documents
 */
class PDFService {
	/**
	 * Generate a class list PDF
	 * @param {object} classData - Class information
	 * @param {array} students - Array of students in the class
	 * @param {object} options - Options for PDF generation
	 * @returns {Buffer} - PDF buffer
	 */
	static generateClassListPDF(classData, students, options = {}) {
		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: 'A4',
					margins: { top: 50, bottom: 50, left: 50, right: 50 },
				});

				const chunks = [];
				doc.on('data', (chunk) => chunks.push(chunk));
				doc.on('end', () => resolve(Buffer.concat(chunks)));
				doc.on('error', reject);

				// Add font (using default fonts for now)
				doc.font('Helvetica');

				// Header
				this.addHeader(doc, classData);

				// Table header
				this.addTableHeader(doc);

				// Student rows
				this.addStudentRows(doc, students);

				// Footer
				this.addFooter(doc, students.length);

				doc.end();
			} catch (error) {
				logger.error('[PDF Service] Error generating class list PDF:', error);
				reject(error);
			}
		});
	}

	/**
	 * Add header to PDF
	 */
	static addHeader(doc, classData) {
		// School name (would be configurable in production)
		doc.fontSize(20)
			.font('Helvetica-Bold')
			.text('INPS PORTAL', { align: 'center' })
			.moveDown(0.5);

		// Title
		doc.fontSize(16)
			.text('CLASS LIST', { align: 'center' })
			.moveDown(0.5);

		// Class information
		doc.fontSize(12)
			.font('Helvetica')
			.text(`Class: ${classData.name}`, { align: 'center' })
			.text(`Academic Year: ${classData.academicYear || '2026/2027'}`, { align: 'center' })
			.text(`Term: ${classData.term || 'FIRST TERM'}`, { align: 'center' })
			.moveDown(1);

		// Date
		doc.fontSize(10)
			.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'right' })
			.moveDown(1);
	}

	/**
	 * Add table header
	 */
	static addTableHeader(doc) {
		const tableTop = doc.y;
		const colWidths = [60, 80, 150, 80, 80]; // S/N, Admission No, Name, Gender, Status
		const startX = 50;

		// Draw header background
		doc.rect(startX, tableTop, 450, 25).fill('#4a5568');

		// Header text
		doc.fillColor('white')
			.fontSize(10)
			.font('Helvetica-Bold');

		const headers = ['S/N', 'Admission No', 'Name', 'Gender', 'Status'];
		headers.forEach((header, i) => {
			doc.text(header, startX + 5 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop + 8);
		});

		doc.fillColor('black').moveDown(0.5);
	}

	/**
	 * Add student rows
	 */
	static addStudentRows(doc, students) {
		const colWidths = [60, 80, 150, 80, 80];
		const startX = 50;
		const rowHeight = 20;

		students.forEach((student, index) => {
			const y = doc.y;

			// Alternate row background
			if (index % 2 === 0) {
				doc.rect(startX, y, 450, rowHeight).fill('#f7fafc');
			}

			// Draw row border
			doc.rect(startX, y, 450, rowHeight).stroke('#e2e8f0');

			// Student data
			doc.fillColor('black')
				.fontSize(9)
				.font('Helvetica');

			const sn = index + 1;
			const name = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim();
			const gender = student.gender || 'N/A';
			const status = student.status || 'ACTIVE';

			const data = [sn, student.admissionNumber, name, gender, status];
			data.forEach((text, i) => {
				doc.text(
					String(text),
					startX + 5 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
					y + 6,
					{ width: colWidths[i] - 10, ellipsis: true }
				);
			});

			doc.y = y + rowHeight;

			// Add new page if needed
			if (doc.y > 700) {
				doc.addPage();
				this.addHeader(doc, { name: students[0].class?.name || 'Class' });
				this.addTableHeader(doc);
			}
		});
	}

	/**
	 * Add footer with summary
	 */
	static addFooter(doc, totalStudents) {
		doc.moveDown(1);
		doc.fontSize(10)
			.text(`Total Students: ${totalStudents}`, { align: 'left' })
			.text('End of Class List', { align: 'right' });
	}
}

module.exports = PDFService;
