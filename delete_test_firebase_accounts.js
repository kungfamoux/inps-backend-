require("dotenv/config");
const admin = require('./lib/firebaseAdmin');

const auth = admin.auth();

async function listAllUsers() {
  try {
    const listUsersResult = await auth.listUsers(1000);
    const users = listUsersResult.users;

    console.log('=== ALL FIREBASE USERS ===\n');
    console.log(`Total users: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email || 'N/A'}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Display Name: ${user.displayName || 'N/A'}`);
      console.log(`   Phone: ${user.phoneNumber || 'N/A'}`);
      console.log(`   Created: ${user.metadata.creationTime}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log('');
    });

    // Check if there are more users
    if (listUsersResult.pageToken) {
      console.log('⚠️  More users exist (pagination not implemented in this script)');
    }

    return users;
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
}

async function deleteFirebaseUser(uid) {
  try {
    await auth.deleteUser(uid);
    console.log(`✅ Successfully deleted user with UID: ${uid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting user ${uid}:`, error.message);
    return false;
  }
}

async function deleteTestUsers() {
  try {
    const users = await listAllUsers();

    // UIDs to keep - these will NOT be deleted
    const protectedUIDs = [
      'jQWdCiH8JrQrfEEURbAAWIAIGps2', // Admin user 1
      'AF4fiukG9UZV017M7MhvwRRS3Dg1', // Admin user 2
    ];

    // Delete ALL users except protected ones
    const usersToDelete = users.filter(user => {
      const uid = user.uid;

      // Skip protected users
      if (protectedUIDs.includes(uid)) {
        console.log(`🛡️  Skipping protected user: ${user.email || 'N/A'} (UID: ${uid})`);
        return false;
      }

      return true; // Delete all others
    });

    console.log(`\n=== USERS TO DELETE: ${usersToDelete.length} ===\n`);

    if (usersToDelete.length === 0) {
      console.log('No users to delete (all are protected).');
      return;
    }

    usersToDelete.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || 'N/A'} (UID: ${user.uid})`);
    });

    // Ask for confirmation before deleting
    console.log('\n⚠️  WARNING: This will permanently delete these Firebase accounts!');
    console.log('To delete these users, run the script with delete mode:');
    console.log('node delete_test_firebase_accounts.js --delete');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await admin.app().delete();
  }
}

async function deleteTestUsersConfirmed() {
  try {
    const users = await listAllUsers();

    // UIDs to keep - these will NOT be deleted
    const protectedUIDs = [
      'jQWdCiH8JrQrfEEURbAAWIAIGps2', // Admin user 1
      'AF4fiukG9UZV017M7MhvwRRS3Dg1', // Admin user 2
    ];

    // Delete ALL users except protected ones
    const usersToDelete = users.filter(user => {
      const uid = user.uid;

      // Skip protected users
      if (protectedUIDs.includes(uid)) {
        console.log(`🛡️  Skipping protected user: ${user.email || 'N/A'} (UID: ${uid})`);
        return false;
      }

      return true; // Delete all others
    });

    console.log(`\n=== DELETING ${usersToDelete.length} USERS ===\n`);

    let deletedCount = 0;
    let failedCount = 0;

    for (const user of usersToDelete) {
      console.log(`Deleting: ${user.email || 'N/A'} (UID: ${user.uid})`);
      const success = await deleteFirebaseUser(user.uid);
      if (success) {
        deletedCount++;
      } else {
        failedCount++;
      }
    }

    console.log(`\n=== DELETION SUMMARY ===`);
    console.log(`✅ Successfully deleted: ${deletedCount}`);
    console.log(`❌ Failed to delete: ${failedCount}`);
    console.log(`🛡️  Protected users kept: ${protectedUIDs.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await admin.app().delete();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--delete')) {
  console.log('🗑️  DELETE MODE ENABLED\n');
  deleteTestUsersConfirmed();
} else {
  console.log('📋 LIST MODE (add --delete to actually delete users)\n');
  deleteTestUsers();
}
