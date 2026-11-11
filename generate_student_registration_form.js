const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateStudentRegistrationForm() {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = fs.createWriteStream('Student_Registration_Form.pdf');
  doc.pipe(stream);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('INPS STUDENT REGISTRATION FORM', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text('Please complete this form and submit to the school administration', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text('Academic Year: _______________   Date: _______________', { align: 'center' });
  doc.moveDown();

  // Function to draw section header
  function drawSectionHeader(title) {
    doc.fontSize(14).font('Helvetica-Bold').text(title);
    doc.moveDown(0.5);
  }

  // Function to draw form field
  function drawField(label, width = 200, required = false) {
    const labelText = required ? `${label} *` : label;
    doc.fontSize(11).font('Helvetica').text(labelText);
    doc.rect(doc.x, doc.y, width, 25).stroke();
    doc.moveDown(0.5);
  }

  // Function to draw inline fields
  function drawInlineField(label, width = 100, required = false) {
    const labelText = required ? `${label} *` : label;
    doc.fontSize(11).font('Helvetica').text(labelText);
    doc.rect(doc.x, doc.y, width, 25).stroke();
    doc.moveDown(0.5);
  }

  // STUDENT INFORMATION SECTION
  drawSectionHeader('STUDENT INFORMATION');
  
  // Personal Information
  doc.fontSize(12).font('Helvetica-Bold').text('Personal Information');
  doc.moveDown(0.3);
  
  drawField('First Name', 150, true);
  drawField('Last Name', 150, true);
  drawField('Middle Name', 150, true);
  
  doc.moveDown(0.3);
  drawField('Gender (Male/Female)', 200, true);
  drawField('Date of Birth', 150, true);
  drawField('Admission Date', 150, true);

  // Additional Information
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold').text('Additional Information');
  doc.moveDown(0.3);
  
  drawField('Nationality', 150, true);
  drawField('State', 150, true);
  drawField('LGA', 150, true);
  drawField('Religion', 150, true);
  drawField('Health Information', 200, true);
  drawField('Blood Group', 100, true);
  drawField('Student Type (Day/Boarding)', 150, true);
  drawField('Sport House', 100, true);

  // ACCOUNT INFORMATION SECTION
  doc.addPage();
  drawSectionHeader('ACCOUNT INFORMATION');
  doc.fontSize(10).font('Helvetica').text('These credentials will be used for parent portal login', { align: 'center' });
  doc.moveDown(0.5);
  
  drawField('Account Email', 250, true);
  drawField('Account Phone', 150, true);

  // PRIMARY GUARDIAN SECTION
  doc.moveDown(0.5);
  drawSectionHeader('PRIMARY GUARDIAN (ACCOUNT HOLDER)');
  doc.fontSize(10).font('Helvetica').text('This guardian will receive portal login credentials, invoices, and SMS alerts', { align: 'center' });
  doc.moveDown(0.5);
  
  drawField('Relationship (Father/Mother/Guardian/Uncle/Aunt/Grandparent)', 200, true);
  drawField('Title (Mr./Mrs./Ms./Dr./Chief/Engr./Pastor/Imam)', 200);
  drawField('First Name', 150, true);
  drawField('Last Name', 150, true);
  drawField('Phone Number', 150);
  drawField('Email Address', 200);
  drawField('Occupation', 150);
  drawField('Address', 300);

  // SECONDARY GUARDIAN SECTION
  doc.addPage();
  drawSectionHeader('SECONDARY GUARDIAN (OPTIONAL)');
  doc.moveDown(0.5);
  
  drawField('Relationship (Father/Mother/Guardian/Uncle/Aunt/Grandparent)', 200, true);
  drawField('First Name', 150, true);
  drawField('Last Name', 150, true);
  drawField('Phone Number', 150);
  drawField('Email Address', 200, true);
  drawField('Occupation', 150, true);
  drawField('Address', 300);

  // HOUSEHOLD INFORMATION SECTION
  doc.moveDown(0.5);
  drawSectionHeader('HOUSEHOLD INFORMATION');
  doc.moveDown(0.5);
  
  drawField('Residential Address', 300, true);
  drawField('Marital Status (Married/Single/Divorced/Widowed/Separated)', 200);

  // MEDICAL INFORMATION SECTION
  doc.addPage();
  drawSectionHeader('MEDICAL INFORMATION & EMERGENCY CONTACTS');
  doc.moveDown(0.5);
  
  doc.fontSize(11).font('Helvetica').text('Please provide any important medical information:');
  doc.rect(doc.x, doc.y, 450, 100).stroke();
  doc.moveDown(0.5);
  
  doc.fontSize(11).font('Helvetica').text('Emergency Contact 1:');
  drawField('Name', 150);
  drawField('Phone', 150);
  drawField('Relationship', 150);
  
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica').text('Emergency Contact 2:');
  drawField('Name', 150);
  drawField('Phone', 150);
  drawField('Relationship', 150);

  // DECLARATION SECTION
  doc.addPage();
  drawSectionHeader('DECLARATION');
  doc.moveDown(0.5);
  
  doc.fontSize(11).font('Helvetica').text('I hereby declare that the information provided above is true and correct to the best of my knowledge.');
  doc.moveDown();
  doc.text('I understand that any false information may result in the rejection of this application.');
  doc.moveDown();
  
  doc.fontSize(11).font('Helvetica').text('Parent/Guardian Signature: ________________________________');
  doc.moveDown(0.5);
  doc.text('Date: ________________________________');
  doc.moveDown();
  doc.text('School Official Signature: ________________________________');
  doc.moveDown(0.5);
  doc.text('Date: ________________________________');

  // Footer
  doc.moveDown(2);
  doc.fontSize(9).font('Helvetica').text('INPS - International Nursery & Primary School', { align: 'center' });
  doc.text('Contact: info@inpse.com | Phone: +234 XXX XXX XXXX', { align: 'center' });

  doc.end();
  
  console.log('Student Registration Form PDF generated successfully!');
  console.log('File saved as: Student_Registration_Form.pdf');
}

generateStudentRegistrationForm();
