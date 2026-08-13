const prisma = require('./lib/prisma');

async function checkBillDetails() {
  try {
    const bill = await prisma.bill.findFirst({
      where: {
        academicYear: "2026/2027",
        term: "FIRST_TERM",
      },
      include: {
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        students: {
          select: {
            studentId: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
                admissionNumber: true,
              },
            },
          },
        },
      },
    });

    console.log(`\n=== Bill Details ===\n`);

    if (!bill) {
      console.log('No bill found for 2026/2027 FIRST_TERM');
    } else {
      console.log(`Name: ${bill.name}`);
      console.log(`Amount: ₦${bill.amount.toLocaleString()}`);
      console.log(`Scope: ${bill.scope}`);
      console.log(`Intake Type: ${bill.intakeType || 'Not set (applies to all)'}`);
      console.log(`Is Compulsory: ${bill.isCompulsory}`);
      console.log(`\n=== Assigned Classes (${bill.classes.length}) ===`);
      if (bill.classes.length === 0) {
        console.log('No classes assigned');
      } else {
        bill.classes.forEach((bc, i) => {
          console.log(`${i + 1}. ${bc.class.name} (ID: ${bc.class.id})`);
        });
      }
      console.log(`\n=== Assigned Students (${bill.students.length}) ===`);
      if (bill.students.length === 0) {
        console.log('No students assigned');
      } else {
        bill.students.forEach((bs, i) => {
          console.log(`${i + 1}. ${bs.student.firstName} ${bs.student.lastName} (${bs.student.admissionNumber})`);
        });
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking bill details:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkBillDetails();
