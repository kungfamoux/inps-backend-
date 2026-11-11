require('dotenv').config();
const prisma = require('./lib/prisma');
const firebase = require('./lib/firebaseAdmin');

const failedEmails = [
  'tonynebechi09@gmail.com',
  'jerryambi@gmail.com',
  'gracenwankwo111@gmail.com',
  'uce2mice@gmail.com',
  'gracethoma3766@gmail.com'
];

async function cleanup() {
  try {
    console.log('Cleaning up failed imports...\n');

    for (const email of failedEmails) {
      try {
        console.log(`Processing: ${email}`);

        const parent = await prisma.parent.findUnique({
          where: { accountEmail: email },
          include: { students: true }
        });

        if (!parent) {
          console.log(`  Parent not found, skipping\n`);
          continue;
        }

        // Delete students
        for (const student of parent.students) {
          await prisma.student.delete({
            where: { id: student.id }
          });
          console.log(`  Deleted student: ${student.admissionNumber}`);
        }

        // Delete Firebase user
        if (parent.firebaseUid) {
          try {
            await firebase.auth().deleteUser(parent.firebaseUid);
            console.log(`  Deleted Firebase user`);
          } catch (error) {
            console.log(`  Firebase user deletion failed: ${error.message}`);
          }
        }

        // Delete parent
        await prisma.parent.delete({
          where: { id: parent.id }
        });
        console.log(`  Deleted parent\n`);

      } catch (error) {
        console.log(`  Error: ${error.message}\n`);
      }
    }

    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
