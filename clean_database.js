require("dotenv").config();
const prisma = require("./lib/prisma");

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    console.log('⚠️  This will HARD DELETE all users except admin staff\n');

    // Get current counts before deletion
    const staffCount = await prisma.staff.count();
    const parentCount = await prisma.parent.count();
    const studentCount = await prisma.student.count();

    console.log('📊 Current database state:');
    console.log(`   Staff: ${staffCount}`);
    console.log(`   Parents: ${parentCount}`);
    console.log(`   Students: ${studentCount}\n`);

    // Get admin staff IDs to preserve them
    const adminStaff = await prisma.staff.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, staffId: true, firstName: true, lastName: true }
    });

    console.log(`👑 Found ${adminStaff.length} admin staff to preserve:`);
    adminStaff.forEach(admin => {
      console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.staffId})`);
    });
    console.log('');

    const adminIds = adminStaff.map(admin => admin.id);

    // Delete non-admin staff
    console.log('🗑️  Deleting non-admin staff...');
    const deletedStaff = await prisma.staff.deleteMany({
      where: {
        id: { notIn: adminIds }
      }
    });
    console.log(`✅ Deleted ${deletedStaff.count} staff members`);

    // Delete in correct order to handle foreign key constraints
    
    // 1. Delete enrollments first (depend on students)
    console.log('🗑️  Deleting all enrollments...');
    const deletedEnrollments = await prisma.enrollment.deleteMany({});
    console.log(`✅ Deleted ${deletedEnrollments.count} enrollments`);

    // 2. Delete invoices (depend on students)
    console.log('🗑️  Deleting all invoices...');
    const deletedInvoices = await prisma.invoice.deleteMany({});
    console.log(`✅ Deleted ${deletedInvoices.count} invoices`);

    // 3. Delete results (depend on students)
    console.log('🗑️  Deleting all results...');
    const deletedResults = await prisma.result.deleteMany({});
    console.log(`✅ Deleted ${deletedResults.count} results`);

    // 4. Delete students (depend on parents)
    console.log('🗑️  Deleting all students...');
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`✅ Deleted ${deletedStudents.count} students`);

    // 5. Delete all parents
    console.log('🗑️  Deleting all parents...');
    const deletedParents = await prisma.parent.deleteMany({});
    console.log(`✅ Deleted ${deletedParents.count} parents`);

    // Get final counts
    const finalStaffCount = await prisma.staff.count();
    const finalParentCount = await prisma.parent.count();
    const finalStudentCount = await prisma.student.count();

    console.log('\n📊 Final database state:');
    console.log(`   Staff: ${finalStaffCount} (admins only)`);
    console.log(`   Parents: ${finalParentCount}`);
    console.log(`   Students: ${finalStudentCount}`);

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('👑 Only admin staff remain in the system.');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();