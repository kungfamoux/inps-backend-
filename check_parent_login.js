const prisma = require('./lib/prisma');
const axios = require('axios');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

async function checkParentLogin() {
  const testEmail = 'eugeneoibe2303@gmail.com';
  const testPhone = '08039290401';

  console.log('=== Parent Login Diagnostic ===\n');

  // Step 1: Check if parent exists in database
  console.log('1. Checking parent in database...');
  const parent = await prisma.parent.findFirst({
    where: { accountEmail: testEmail, deletedAt: null },
  });

  if (!parent) {
    console.log('❌ Parent NOT found in database');
    console.log(`   Email: ${testEmail}`);
    return;
  }

  console.log('✅ Parent found in database');
  console.log(`   ID: ${parent.id}`);
  console.log(`   Email: ${parent.accountEmail}`);
  console.log(`   Phone: ${parent.accountPhone}`);
  console.log(`   Firebase UID: ${parent.firebaseUid || 'NOT SET'}`);
  console.log(`   Status: ${parent.deletedAt ? 'DELETED' : 'ACTIVE'}`);

  if (!parent.firebaseUid) {
    console.log('\n❌ ERROR: Parent has no Firebase UID - cannot login');
    console.log('   This means the Firebase account was not created during registration');
    return;
  }

  // Step 2: Test Firebase login
  console.log('\n2. Testing Firebase login...');
  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      { email: testEmail, password: testPhone, returnSecureToken: true }
    );

    console.log('✅ Firebase login successful');
    console.log(`   Firebase UID: ${response.data.localId}`);
    console.log(`   ID Token: ${response.data.idToken ? 'Present' : 'Missing'}`);
    console.log(`   Refresh Token: ${response.data.refreshToken ? 'Present' : 'Missing'}`);

    // Step 3: Verify Firebase UID matches database
    console.log('\n3. Verifying Firebase UID match...');
    if (response.data.localId === parent.firebaseUid) {
      console.log('✅ Firebase UID matches database');
    } else {
      console.log('❌ Firebase UID MISMATCH');
      console.log(`   Database UID: ${parent.firebaseUid}`);
      console.log(`   Firebase UID: ${response.data.localId}`);
    }

    // Step 4: Check if parent has students
    console.log('\n4. Checking linked students...');
    const students = await prisma.student.findMany({
      where: { parentId: parent.id, deletedAt: null },
      select: {
        admissionNumber: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    if (students.length === 0) {
      console.log('⚠️  No students linked to this parent');
    } else {
      console.log(`✅ ${students.length} student(s) linked:`);
      students.forEach(student => {
        console.log(`   - ${student.admissionNumber}: ${student.firstName} ${student.lastName} (${student.status})`);
      });
    }

  } catch (error) {
    console.log('❌ Firebase login failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error Code: ${error.response.data.error?.code}`);
      console.log(`   Error Message: ${error.response.data.error?.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }

    // Check if Firebase user exists at all
    console.log('\n5. Checking if Firebase user exists...');
    try {
      const lookupResponse = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
        { idToken: 'dummy' }
      );
    } catch (lookupError) {
      if (lookupError.response?.data?.error?.message === 'INVALID_ID_TOKEN') {
        console.log('   (Lookup requires valid token, skipping)');
      }
    }

    // Try to get user by email
    try {
      console.log('\n6. Attempting to lookup Firebase user by email...');
      const userResponse = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
        { email: testEmail }
      );
      console.log('✅ Firebase user exists in Firebase');
      console.log(`   UID: ${userResponse.data.users?.[0]?.localId || 'Unknown'}`);
    } catch (lookupError) {
      console.log('❌ Firebase user NOT found in Firebase');
      console.log('   This means the account needs to be created in Firebase');
    }
  }

  console.log('\n=== Diagnostic Complete ===');
}

checkParentLogin()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
