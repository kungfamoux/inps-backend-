const fs = require('fs');
const PDFDocument = require('pdfkit');
const logger = require('../../utils/logger');

const PAGE_MARGIN = 50;
const TABLE_WIDTH = 495; // A4 (595.28pt) minus 50pt left and 50pt right margins
const COL_WIDTHS = [50, 120, 265, 60]; // S/N, Admission No, Name, Gender
const HEADERS = ['S/N', 'Admission No', 'Name', 'Gender'];

/**
 * PDF Service for generating various PDF documents
 */
class PDFService {
	/**
	 * Generate a class list PDF
	 * @param {object} classData - Class information
	 * @param {array} students - Array of students in the class
	 * @param {object} options - Options for PDF generation
	 * @returns {Promise<Buffer>} - PDF buffer
	 */
	static generateClassListPDF(classData = {}, students = [], options = {}) {
		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: options.size || 'A4',
					margins: {
						top: PAGE_MARGIN,
						bottom: PAGE_MARGIN,
						left: PAGE_MARGIN,
						right: PAGE_MARGIN,
					},
				});

				const chunks = [];
				doc.on('data', (chunk) => chunks.push(chunk));
				doc.on('end', () => resolve(Buffer.concat(chunks)));
				doc.on('error', reject);

				doc.font('Helvetica');

				this.addHeader(doc, classData);
				this.addTableHeader(doc);
				this.addStudentRows(doc, students, classData);
				this.addFooter(doc, students.length);

				doc.end();
			} catch (error) {
				logger.error('[PDF Service] Error generating class list PDF:', error);
				reject(error);
			}
		});
	}

	/**
	 * Add organized school and class header to PDF
	 */
	static addHeader(doc, classData = {}) {
		const startX = PAGE_MARGIN;
		const headerTop = doc.y;
		const className = classData.name || 'N/A';
		const academicYear = classData.academicYear || '2026/2027';
		const term = classData.term || 'FIRST TERM';
		const generatedDate = new Date().toLocaleDateString();

		// Optional logo on top-left if file exists
		let textStartX = startX;
		let textWidth = TABLE_WIDTH;
		if (classData.logoPath && fs.existsSync(classData.logoPath)) {
			const logoSize = 48;
			doc.image(classData.logoPath, startX, headerTop, {
				fit: [logoSize, logoSize],
			});
			textStartX = startX + logoSize + 12;
			textWidth = TABLE_WIDTH - (logoSize + 12);
		}

		// School name & motto
		doc.fontSize(17)
			.font('Helvetica-Bold')
			.fillColor('#1a252f')
			.text('INTERNATIONAL NURSERY & PRIMARY SCHOOL', textStartX, headerTop, {
				width: textWidth,
				align: classData.logoPath ? 'left' : 'center',
			});

		doc.moveDown(0.2);
		doc.fontSize(10.5)
			.font('Helvetica-Oblique')
			.fillColor('#5c6b73')
			.text('Excellence in Education', textStartX, doc.y, {
				width: textWidth,
				align: classData.logoPath ? 'left' : 'center',
			});

		doc.moveDown(0.45);
		doc.fontSize(13)
			.font('Helvetica-Bold')
			.fillColor('#2c3e50')
			.text('CLASS ROSTER', textStartX, doc.y, {
				width: textWidth,
				align: classData.logoPath ? 'left' : 'center',
			});

		// Ensure Y moves past both text block and logo
		const blockBottomY = Math.max(doc.y, headerTop + (classData.logoPath ? 52 : 0)) + 8;

		// Two-column metadata strip
		const metaHeight = 44;
		const midX = startX + TABLE_WIDTH / 2;

		doc.rect(startX, blockBottomY, TABLE_WIDTH, metaHeight)
			.fillAndStroke('#f4f6f8', '#d0d7de');

		// Center vertical divider inside metadata strip
		doc.moveTo(midX, blockBottomY + 6)
			.lineTo(midX, blockBottomY + metaHeight - 6)
			.lineWidth(1)
			.stroke('#d0d7de');

		doc.fontSize(10).fillColor('#1f2937');

		// Left column: Class & Academic Year
		doc.font('Helvetica-Bold').text('Class: ', startX + 12, blockBottomY + 8, { continued: true });
		doc.font('Helvetica').text(className);

		doc.font('Helvetica-Bold').text('Session: ', startX + 12, blockBottomY + 24, { continued: true });
		doc.font('Helvetica').text(academicYear);

		// Right column: Term & Date Generated
		doc.font('Helvetica-Bold').text('Term: ', midX + 12, blockBottomY + 8, { continued: true });
		doc.font('Helvetica').text(term);

		doc.font('Helvetica-Bold').text('Date: ', midX + 12, blockBottomY + 24, { continued: true });
		doc.font('Helvetica').text(generatedDate);

		doc.y = blockBottomY + metaHeight + 12;
	}

	/**
	 * Add table header row
	 */
	static addTableHeader(doc) {
		const tableTop = doc.y;
		const startX = PAGE_MARGIN;
		const rowHeight = 25;

		doc.rect(startX, tableTop, TABLE_WIDTH, rowHeight).fill('#2c3e50');

		doc.fillColor('white')
			.fontSize(10.5)
			.font('Helvetica-Bold');

		HEADERS.forEach((header, i) => {
			const xOffset = COL_WIDTHS.slice(0, i).reduce((sum, w) => sum + w, 0);
			doc.text(header, startX + 6 + xOffset, tableTop + 7, {
				width: COL_WIDTHS[i] - 12,
				ellipsis: true,
			});
		});

		doc.y = tableTop + rowHeight;
		doc.fillColor('black');
	}

	/**
	 * Add student rows to table
	 */
	static addStudentRows(doc, students = [], classData = {}) {
		const startX = PAGE_MARGIN;
		const rowHeight = 22;
		const bottomLimit = doc.page.height - PAGE_MARGIN - 40;

		if (!students.length) {
			doc.moveDown(0.6)
				.fontSize(11)
				.fillColor('#555555')
				.text('No students found in this class.', startX, doc.y);
			return;
		}

		students.forEach((student, index) => {
			if (doc.y + rowHeight > bottomLimit) {
				doc.addPage();
				this.addHeader(doc, classData);
				this.addTableHeader(doc);
			}

			const y = doc.y;
			const studentData = student.student || student;

			if (index % 2 === 0) {
				doc.rect(startX, y, TABLE_WIDTH, rowHeight).fill('#f8f9fa');
			}

			doc.rect(startX, y, TABLE_WIDTH, rowHeight).stroke('#dee2e6');

			const sn = index + 1;
			const admissionNumber = studentData.admissionNumber || student.admissionNumber || 'N/A';
			const fullName = [studentData.firstName, studentData.middleName, studentData.lastName]
				.filter(Boolean)
				.join(' ')
				.trim() || 'N/A';
			const gender = studentData.gender || 'N/A';

			doc.fillColor('#1a1a1a')
				.fontSize(10)
				.font('Helvetica');

			const rowValues = [sn, admissionNumber, fullName, gender];
			rowValues.forEach((value, i) => {
				const xOffset = COL_WIDTHS.slice(0, i).reduce((sum, w) => sum + w, 0);
				doc.text(String(value), startX + 6 + xOffset, y + 6, {
					width: COL_WIDTHS[i] - 12,
					ellipsis: true,
				});
			});

			doc.y = y + rowHeight;
		});
	}

	/**
	 * Add summary footer
	 */
	static addFooter(doc, totalStudents) {
		doc.moveDown(1.2)
			.fontSize(11)
			.font('Helvetica-Bold')
			.fillColor('#1a1a1a')
			.text(`Total Students: ${totalStudents}`, PAGE_MARGIN, doc.y, {
				align: 'left',
			});
	}
}

module.exports = PDFService;