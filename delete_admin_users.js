require("dotenv").config();
const prisma = require("./lib/prisma");
const logger = require("./utils/logger");

const adminEmails = [
  'echika911@gmail.com',
  'orjichiomauka1@gmail.com',
];

async function deleteAdminUsers() {
  try {
    logger.info('Deleting admin users from database...');

    for (const email of adminEmails) {
      logger.info(`Deleting user: ${email}`);

      const user = await prisma.staff.findUnique({
        where: { email },
      });

      if (!user) {
        logger.info(`User ${email} not found in database. Skipping...`);
        continue;
      }

      await prisma.staff.delete({
        where: { email },
      });

      logger.info(`✅ Deleted user from database: ${email}`);
      logger.info(`   Firebase UID: ${user.firebaseUid} (Firebase user still exists)`);
    }

    logger.info('✅ All admin users deleted from database!');
    logger.info('ℹ️  Firebase users are preserved and can be recovered');
  } catch (error) {
    logger.error('❌ Error deleting admin users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAdminUsers()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
