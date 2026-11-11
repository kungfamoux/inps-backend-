require("dotenv").config();
const prisma = require("./lib/prisma");

async function hardDeleteTestStaff() {
  try {
    const email = "ezejingozi21@gmail.com";
    
    console.log('🗑️  Hard deleting test staff account...');
    console.log(`📧 Email: ${email}\n`);

    const staff = await prisma.staff.findFirst({
      where: { email }
    });

    if (!staff) {
      console.log('⚠️  No staff account found with this email');
      return;
    }

    console.log(`Found staff: ${staff.firstName} ${staff.lastName} (${staff.staffId})`);
    console.log(`Firebase UID: ${staff.firebaseUid}`);
    
    // Hard delete
    await prisma.staff.delete({
      where: { id: staff.id }
    });

    console.log('✅ Staff account hard-deleted successfully');
    console.log(`   Staff ID: ${staff.id}`);
    console.log(`   Staff Number: ${staff.staffId}`);

  } catch (error) {
    console.error('❌ Error hard deleting test staff account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

hardDeleteTestStaff();