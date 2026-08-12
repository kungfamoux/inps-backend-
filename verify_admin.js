require("dotenv").config();
const prisma = require("./lib/prisma");

async function verifyAdminAccount() {
  try {
    console.log('🔍 Verifying admin account...\n');
    
    const admin = await prisma.staff.findFirst({
      where: {
        email: 'i.inps@yahoo.com'
      }
    });

    if (admin) {
      console.log('✅ Admin account found:');
      console.log(`   Staff ID: ${admin.staffId}`);
      console.log(`   Database ID: ${admin.id}`);
      console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Phone: ${admin.phone}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Type: ${admin.type}`);
      console.log(`   Status: ${admin.status}`);
      console.log(`   Firebase UID: ${admin.firebaseUid}`);
      console.log(`   Default Password: ${admin.phone.replace(/\D/g, '')}`);
    } else {
      console.log('❌ Admin account not found');
    }

  } catch (error) {
    console.error('❌ Error verifying admin account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminAccount();