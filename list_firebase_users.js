require("dotenv").config();
const admin = require("./lib/firebaseAdmin");
const logger = require("./utils/logger");

async function listAllFirebaseUsers() {
  try {
    logger.info('Fetching all Firebase users...');
    
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users;
    
    logger.info(`Found ${users.length} users in Firebase`);
    logger.info('\n=== Firebase Users ===\n');
    
    users.forEach((user, index) => {
      logger.info(`${index + 1}. Email: ${user.email}`);
      logger.info(`   UID: ${user.uid}`);
      logger.info(`   Phone: ${user.phoneNumber || 'Not set'}`);
      logger.info(`   Display Name: ${user.displayName || 'Not set'}`);
      logger.info(`   Email Verified: ${user.emailVerified}`);
      logger.info(`   Created: ${new Date(user.metadata.creationTime).toISOString()}`);
      logger.info(`   Last Sign In: ${user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toISOString() : 'Never'}`);
      logger.info('');
    });
    
    logger.info(`\nTotal users: ${users.length}`);
    logger.info('\nNext steps:');
    logger.info('1. Review the user list above');
    logger.info('2. Run recovery script to recreate Prisma records');
    logger.info('3. For users without complete info, you may need to update them manually');
    
  } catch (error) {
    logger.error('❌ Error listing Firebase users:', error);
    throw error;
  }
}

listAllFirebaseUsers()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
