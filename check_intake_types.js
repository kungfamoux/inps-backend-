const prisma = require('./lib/prisma');

async function checkStudentIntakeTypes() {
  try {
    const students = await prisma.student.groupBy({
      by: ['intakeType'],
      where: {
        deletedAt: null,
        status: "ACTIVE",
        enrollments: {
          some: {
            academicYear: "2026/2027",
            term: "FIRST_TERM",
            status: "ACTIVE",
          },
        },
      },
      _count: {
        intakeType: true,
      },
    });

    console.log(`\n=== Student Intake Types for 2026/2027 FIRST_TERM ===\n`);

    if (students.length === 0) {
      console.log('No students found');
    } else {
      students.forEach((stat) => {
        console.log(`${stat.intakeType || 'NULL'}: ${stat._count.intakeType} students`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking intake types:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkStudentIntakeTypes();
