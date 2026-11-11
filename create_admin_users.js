require("dotenv").config();
const prisma = require("./lib/prisma");
const AuthRepository = require("./shared/repositories/AuthRepository");
const generateStaffId = require("./utils/generateStaffId");
const logger = require("./utils/logger");

// Admin users to recover/create
const adminUsers = [
  {
    email: 'echika911@gmail.com',
    phone: '08152622017',
    firstName: 'Admin',
    lastName: 'User One',
    gender: 'MALE',
  },
  {
    email: 'orjichiomauka1@gmail.com',
    phone: '08166529629',
    firstName: 'Admin',
    lastName: 'User Two',
    gender: 'FEMALE',
  },
];

async function recoverAdminUsers() {
  try {
    logger.info('Recovering admin users from Firebase...');

    for (const adminData of adminUsers) {
      logger.info(`Processing user: ${adminData.email}`);

      // Check if user already exists in database
      const existingUser = await prisma.staff.findUnique({
        where: { email: adminData.email },
      });

      if (existingUser) {
        logger.info(`User ${adminData.email} already exists in database. Skipping...`);
        continue;
      }

      // First, try to get existing Firebase user
      let firebaseUser;
      try {
        firebaseUser = await AuthRepository.getFirebaseUserByEmail(adminData.email);
        logger.info(`✅ Found existing Firebase user: ${firebaseUser.uid}`);
      } catch (error) {
        logger.warn(`No existing Firebase user found for ${adminData.email}`);
        logger.info(`Creating new Firebase user...`);
        
        try {
          firebaseUser = await AuthRepository.createFirebaseUser(
            adminData.email,
            adminData.phone,
          );
          logger.info('✅ Firebase account created successfully');
        } catch (createError) {
          logger.error(`❌ Failed to create Firebase user: ${createError.message}`);
          throw createError;
        }
      }

      // Create staff record in database using the Firebase UID
      await prisma.$transaction(async (tx) => {
        const staffId = await generateStaffId("ADMIN", tx);
        const staff = await tx.staff.create({
          data: {
            staffId,
            firebaseUid: firebaseUser.uid,
            firstName: adminData.firstName,
            lastName: adminData.lastName,
            email: adminData.email,
            phone: adminData.phone,
            gender: adminData.gender,
            type: "NON_TEACHING",
            role: "ADMIN",
            status: "ACTIVE",
          },
        });

        logger.info(
          `✅ Admin user recovered/created successfully - staffId: ${staffId}, email: ${staff.email}`,
        );
        logger.info(`   Firebase UID: ${firebaseUser.uid}`);
        logger.info(`   Default Password: ${adminData.phone} (phone number)`);
      });
    }

    logger.info('✅ All admin users processed successfully!');
    logger.info('⚠️  IMPORTANT: Default password is their phone number!');
  } catch (error) {
    logger.error('❌ Error recovering admin users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

recoverAdminUsers()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
