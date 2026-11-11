require("dotenv").config();
const prisma = require("./lib/prisma");
const logger = require("./utils/logger");

async function checkAdminData() {
  try {
    logger.info('Checking admin users data...');
    
    const admins = await prisma.staff.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        staffId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        gender: true,
        status: true,
      },
    });
    
    logger.info(`Found ${admins.length} admin users`);
    
    admins.forEach((admin, index) => {
      logger.info(`\n${index + 1}. ${admin.email}`);
      logger.info(`   Staff ID: ${admin.staffId}`);
      logger.info(`   Name: ${admin.firstName} ${admin.lastName}`);
      logger.info(`   Phone: ${admin.phone}`);
      logger.info(`   Role: ${admin.role}`);
      logger.info(`   Gender: ${admin.gender || 'NOT SET'}`);
      logger.info(`   Status: ${admin.status}`);
    });
    
  } catch (error) {
    logger.error('Error checking admin data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminData()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
