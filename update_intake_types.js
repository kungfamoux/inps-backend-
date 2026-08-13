const prisma = require('./lib/prisma');

async function updateStudentIntakeTypes() {
  try {
    console.log('Updating all students intake type from NEW to CONTINUING...\n');

    const result = await prisma.student.updateMany({
      where: {
        intakeType: "NEW",
      },
      data: {
        intakeType: "CONTINUING",
      },
    });

    console.log(`✓ Successfully updated ${result.count} students`);
    console.log('\nNow all students have intake type "CONTINUING"');
    console.log('You can now generate invoices for the Tuition fee bill.\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error updating intake types:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateStudentIntakeTypes();
