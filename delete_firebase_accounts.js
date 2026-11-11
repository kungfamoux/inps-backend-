require("dotenv").config();
const admin = require("./lib/firebaseAdmin");
const logger = require("./utils/logger");

// Firebase users to delete
const usersToDelete = [
  'tosanwumiae@gmail.com',
  'i.inps@yahoo.com',
  'tosanwumime@gmail.com',
  'liosnzewunwa@gmail.com',
  'rokafor@hotmail.com',
];

// Admin users to keep (for verification)
const adminUsersToKeep = [
  'echika911@gmail.com',
  'orjichiomauka1@gmail.com',
];

async function deleteFirebaseAccounts() {
  try {
    logger.info('Deleting Firebase accounts...');
    
    let deletedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    
    for (const email of usersToDelete) {
      logger.info(`Deleting Firebase account: ${email}`);
      
      try {
        // Get user by email
        const user = await admin.auth().getUserByEmail(email);
        
        // Delete the user
        await admin.auth().deleteUser(user.uid);
        
        logger.info(`  ✅ Deleted Firebase account: ${email} (UID: ${user.uid})`);
        deletedCount++;
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          logger.info(`  ℹ️  User not found in Firebase: ${email}`);
          notFoundCount++;
        } else {
          logger.error(`  ❌ Error deleting ${email}: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    // Verify admin users are still in Firebase
    logger.info('\nVerifying admin users are still in Firebase...');
    for (const email of adminUsersToKeep) {
      try {
        const user = await admin.auth().getUserByEmail(email);
        logger.info(`✅ Admin account still exists: ${email} (UID: ${user.uid})`);
      } catch (error) {
        logger.warn(`⚠️  Admin not found in Firebase: ${email}`);
      }
    }
    
    logger.info('\n=== Deletion Summary ===');
    logger.info(`Deleted: ${deletedCount} Firebase accounts`);
    logger.info(`Not found: ${notFoundCount} accounts`);
    logger.info(`Errors: ${errorCount} accounts`);
    logger.info('\n✅ Firebase cleanup complete!');
    
  } catch (error) {
    logger.error('❌ Error deleting Firebase accounts:', error);
    throw error;
  }
}

deleteFirebaseAccounts()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
