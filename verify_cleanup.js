require("dotenv").config();
const prisma = require("./lib/prisma");

async function verifyCleanup() {
  try {
    console.log('🔍 Verifying database cleanup...\n');

    // Check for any remaining records including soft-deleted ones
    const allStaff = await prisma.staff.findMany();
    const allParents = await prisma.parent.findMany();
    const allStudents = await prisma.student.findMany();
    const allEnrollments = await prisma.enrollment.findMany();
    const allInvoices = await prisma.invoice.findMany();
    const allResults = await prisma.result.findMany();

    console.log('📊 Current database records (including soft-deleted):');
    console.log(`   Staff: ${allStaff.length}`);
    console.log(`   Parents: ${allParents.length}`);
    console.log(`   Students: ${allStudents.length}`);
    console.log(`   Enrollments: ${allEnrollments.length}`);
    console.log(`   Invoices: ${allInvoices.length}`);
    console.log(`   Results: ${allResults.length}\n`);

    // Check for soft-deleted records specifically
    const softDeletedStaff = allStaff.filter(s => s.deletedAt !== null);
    const softDeletedStudents = allStudents.filter(s => s.deletedAt !== null);

    console.log('🕵️  Soft-deleted records check:');
    console.log(`   Soft-deleted staff: ${softDeletedStaff.length}`);
    console.log(`   Soft-deleted students: ${softDeletedStudents.length}\n`);

    // Show remaining staff details
    if (allStaff.length > 0) {
      console.log('👑 Remaining staff records:');
      allStaff.forEach(staff => {
        const status = staff.deletedAt ? '(SOFT DELETED)' : '(ACTIVE)';
        console.log(`   - ${staff.firstName} ${staff.lastName} (${staff.staffId}) - ${staff.role} ${status}`);
      });
    }

    // Show remaining student details
    if (allStudents.length > 0) {
      console.log('\n🎓 Remaining student records:');
      allStudents.forEach(student => {
        const status = student.deletedAt ? '(SOFT DELETED)' : '(ACTIVE)';
        console.log(`   - ${student.firstName} ${student.lastName} (${student.admissionNumber}) ${status}`);
      });
    }

    // Show remaining parent details
    if (allParents.length > 0) {
      console.log('\n👨‍👩‍👧 Remaining parent records:');
      allParents.forEach(parent => {
        const status = parent.deletedAt ? '(SOFT DELETED)' : '(ACTIVE)';
        console.log(`   - ${parent.primaryGuardian?.firstName || 'Unknown'} ${parent.primaryGuardian?.lastName || ''} ${status}`);
      });
    }

    if (allStaff.length === 1 && allStaff[0].role === 'ADMIN' && 
        allParents.length === 0 && allStudents.length === 0 &&
        allEnrollments.length === 0 && allInvoices.length === 0 && allResults.length === 0) {
      console.log('\n✅ VERIFICATION PASSED: Database is clean with only admin staff remaining');
      console.log('✅ All deletions were HARD DELETES (records permanently removed)');
    } else {
      console.log('\n⚠️  VERIFICATION WARNING: Database may still contain records');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCleanup();