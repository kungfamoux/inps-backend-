const prisma = require('./lib/prisma');

async function checkParentEmail() {
  try {
    const student = await prisma.student.findUnique({
      where: {
        id: "0074d64b-f7d5-4c6d-95dc-0afe6c37a633",
      },
      include: {
        parent: true,
      },
    });

    console.log(`\n=== Student and Parent Data ===\n`);

    if (!student) {
      console.log('Student not found');
    } else {
      console.log(`Student: ${student.firstName} ${student.lastName}`);
      console.log(`Parent ID: ${student.parentId}`);
      console.log(`\n=== Parent Data ===`);
      console.log(`Parent ID: ${student.parent?.id}`);
      console.log(`Account Email: ${student.parent?.accountEmail}`);
      console.log(`Email: ${student.parent?.email}`);
      console.log(`Primary Guardian: ${JSON.stringify(student.parent?.primaryGuardian)}`);
      console.log(`Secondary Guardian: ${JSON.stringify(student.parent?.secondaryGuardian)}`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking parent email:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkParentEmail();
