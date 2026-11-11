require("dotenv").config();
const prisma = require("./lib/prisma");

async function deleteTestStaff() {
  try {
    const email = "ezejingozi21@gmail.com";
    
    console.log('🗑️  Deleting test staff account...');
    console.log(`📧 Email: ${email}\n`);

    const staff = await prisma.staff.findFirst({
      where: { email, deletedAt: null }
    });

    if (!staff) {
      console.log('⚠️  No staff account found with this email');
      return;
    }

    console.log(`Found staff: ${staff.firstName} ${staff.lastName} (${staff.staffId})`);
    
    // Soft delete
    await prisma.staff.update({
      where: { id: staff.id },
      data: { deletedAt: new Date() }
    });

    console.log('✅ Staff account soft-deleted successfully');
    console.log(`   Staff ID: ${staff.id}`);
    console.log(`   Staff Number: ${staff.staffId}`);

  } catch (error) {
    console.error('❌ Error deleting test staff account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestStaff();