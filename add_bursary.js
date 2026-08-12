require("dotenv").config();
const prisma = require("./lib/prisma");
const AuthRepository = require("./shared/repositories/AuthRepository");
const generateStaffId = require("./utils/generateStaffId");
const logger = require("./utils/logger");

async function addBursaryAccount() {
  try {
    const email = "bursary@inps.edu.ng";
    const phone = "08123456789";
    const firstName = "Finance";
    const lastName = "Officer";
    const gender = "MALE";

    console.log('🔐 Adding bursary account...');
    console.log(`📧 Email: ${email}`);
    console.log(`📱 Phone: ${phone}`);

    // Check if bursary already exists
    const existingBursary = await prisma.staff.findFirst({
      where: {
        email: email
      }
    });

    if (existingBursary) {
      console.log('⚠️  Bursary account already exists');
      console.log(`   ID: ${existingBursary.id}`);
      console.log(`   Email: ${existingBursary.email}`);
      console.log(`   Phone: ${existingBursary.phone}`);
      console.log(`   Role: ${existingBursary.role}`);
      return;
    }

    // Create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await AuthRepository.createFirebaseUser(email, phone);
      console.log('✅ Firebase user created');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Firebase user already exists, fetching existing user...');
        firebaseUser = await AuthRepository.getUserByEmail(email);
        console.log('✅ Retrieved existing Firebase user');
      } else {
        throw error;
      }
    }

    // Generate staff ID
    const staffId = await generateStaffId('BURSARY');
    console.log(`🆔 Generated Staff ID: ${staffId}`);

    // Create bursary staff in database
    const bursary = await prisma.staff.create({
      data: {
        staffId: staffId,
        firebaseUid: firebaseUser.uid,
        email: email,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        role: 'BURSARY',
        type: 'NON_TEACHING',
        status: 'ACTIVE',
      }
    });

    console.log('✅ Bursary account created successfully');
    console.log(`   Staff ID: ${bursary.id}`);
    console.log(`   Name: ${bursary.firstName} ${bursary.lastName}`);
    console.log(`   Email: ${bursary.email}`);
    console.log(`   Phone: ${bursary.phone}`);
    console.log(`   Role: ${bursary.role}`);
    console.log(`   Default Password: ${phone.replace(/\D/g, '')}`);

  } catch (error) {
    console.error('❌ Error adding bursary account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addBursaryAccount();
