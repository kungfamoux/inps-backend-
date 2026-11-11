require("dotenv").config();
const prisma = require("./lib/prisma");
const admin = require("./lib/firebaseAdmin");
const generateStaffId = require("./utils/generateStaffId");
const logger = require("./utils/logger");

// Manual mapping for users we have information about
const knownUsers = {
  'echika911@gmail.com': {
    firstName: 'Admin',
    lastName: 'User One',
    phone: '08152622017',
    gender: 'MALE',
    role: 'ADMIN',
  },
  'orjichiomauka1@gmail.com': {
    firstName: 'Admin',
    lastName: 'User Two',
    phone: '08166529629',
    gender: 'FEMALE',
    role: 'ADMIN',
  },
  'tosanwumiae@gmail.com': {
    firstName: 'Staff',
    lastName: 'User 1',
    phone: '08000000001', // Placeholder - needs update
    gender: 'FEMALE',
    role: 'TEACHER',
  },
  'i.inps@yahoo.com': {
    firstName: 'Staff',
    lastName: 'User 2',
    phone: '08000000002', // Placeholder - needs update
    gender: 'MALE',
    role: 'TEACHER',
  },
  'tosanwumime@gmail.com': {
    firstName: 'Staff',
    lastName: 'User 3',
    phone: '08000000003', // Placeholder - needs update
    gender: 'FEMALE',
    role: 'TEACHER',
  },
  'liosnzewunwa@gmail.com': {
    firstName: 'Staff',
    lastName: 'User 4',
    phone: '08000000004', // Placeholder - needs update
    gender: 'FEMALE',
    role: 'TEACHER',
  },
  'rokafor@hotmail.com': {
    firstName: 'Staff',
    lastName: 'User 5',
    phone: '08000000005', // Placeholder - needs update
    gender: 'MALE',
    role: 'TEACHER',
  },
};

// Test accounts to skip
const testAccounts = [
  'testparent@inps.com',
  'teststaff@inps.com',
];

async function recoverAllFirebaseUsers() {
  try {
    logger.info('Recovering all Firebase users to Prisma...');
    
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users;
    
    logger.info(`Found ${users.length} users in Firebase`);
    
    let recoveredCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const firebaseUser of users) {
      const email = firebaseUser.email;
      
      // Skip test accounts
      if (testAccounts.includes(email)) {
        logger.info(`⏭️  Skipping test account: ${email}`);
        skippedCount++;
        continue;
      }
      
      // Check if user already exists in database
      const existingUser = await prisma.staff.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        logger.info(`✅ User already exists: ${email}`);
        recoveredCount++;
        continue;
      }
      
      // Get user info from mapping or use placeholder
      const userInfo = knownUsers[email] || {
        firstName: 'Unknown',
        lastName: 'User',
        phone: '00000000000', // Placeholder - needs update
        gender: 'MALE',
        role: 'TEACHER',
      };
      
      logger.info(`Processing: ${email}`);
      
      try {
        await prisma.$transaction(async (tx) => {
          const staffId = await generateStaffId(userInfo.role, tx);
          const staff = await tx.staff.create({
            data: {
              staffId,
              firebaseUid: firebaseUser.uid,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              email: email,
              phone: userInfo.phone,
              gender: userInfo.gender,
              type: userInfo.role === 'ADMIN' ? 'NON_TEACHING' : 'TEACHING',
              role: userInfo.role,
              status: 'ACTIVE',
            },
          });
          
          logger.info(`✅ Created staff record: ${staffId} - ${email}`);
          if (!knownUsers[email]) {
            logger.warn(`⚠️  Using placeholder data - needs manual update`);
          }
        });
        
        recoveredCount++;
      } catch (error) {
        logger.error(`❌ Failed to create record for ${email}: ${error.message}`);
        errorCount++;
      }
    }
    
    logger.info('\n=== Recovery Summary ===');
    logger.info(`Total Firebase users: ${users.length}`);
    logger.info(`Successfully recovered: ${recoveredCount}`);
    logger.info(`Skipped (test accounts): ${skippedCount}`);
    logger.info(`Errors: ${errorCount}`);
    
    logger.info('\n⚠️  IMPORTANT:');
    logger.info('1. Users with placeholder data need manual updates');
    logger.info('2. Phone numbers need to be corrected');
    logger.info('3. Names need to be updated with real data');
    logger.info('4. Roles may need adjustment');
    
  } catch (error) {
    logger.error('❌ Error recovering users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

recoverAllFirebaseUsers()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
