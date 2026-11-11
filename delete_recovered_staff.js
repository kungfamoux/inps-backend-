require("dotenv").config();
const prisma = require("./lib/prisma");
const logger = require("./utils/logger");

// Staff to delete (excluding the two admin users)
const staffToDelete = [
  'tosanwumiae@gmail.com',
  'i.inps@yahoo.com',
  'tosanwumime@gmail.com',
  'liosnzewunwa@gmail.com',
  'rokafor@hotmail.com',
];

// Admin users to keep
const adminUsersToKeep = [
  'echika911@gmail.com',
  'orjichiomauka1@gmail.com',
];

async function deleteRecoveredStaff() {
  try {
    logger.info('Deleting recovered staff members (keeping only admins)...');
    
    let deletedCount = 0;
    let keptCount = 0;
    
    for (const email of staffToDelete) {
      logger.info(`Deleting: ${email}`);
      
      const staff = await prisma.staff.findUnique({
        where: { email },
      });
      
      if (!staff) {
        logger.info(`  Staff not found: ${email}`);
        continue;
      }
      
      await prisma.staff.delete({
        where: { email },
      });
      
      logger.info(`  ✅ Deleted: ${staff.staffId} - ${email}`);
      deletedCount++;
    }
    
    // Verify admin users are still there
    for (const email of adminUsersToKeep) {
      const admin = await prisma.staff.findUnique({
        where: { email },
      });
      
      if (admin) {
        logger.info(`✅ Kept admin: ${admin.staffId} - ${email}`);
        keptCount++;
      } else {
        logger.warn(`⚠️  Admin not found: ${email}`);
      }
    }
    
    logger.info('\n=== Deletion Summary ===');
    logger.info(`Deleted: ${deletedCount} staff members`);
    logger.info(`Kept: ${keptCount} admin users`);
    logger.info('\n✅ Cleanup complete!');
    
  } catch (error) {
    logger.error('❌ Error deleting staff:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteRecoveredStaff()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
