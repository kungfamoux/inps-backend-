require("dotenv").config();
const prisma = require("./lib/prisma");
const AuthRepository = require("./shared/repositories/AuthRepository");
const generateStaffId = require("./utils/generateStaffId");
const logger = require("./utils/logger");

async function addNurseAccount() {
  try {
    const email = "nurseinps@gmail.com";
    const phone = "09033709446";
    const firstName = "obi";
    const lastName = "ada";
    const gender = "FEMALE";

    console.log('🏥 Adding nurse account...');
    console.log(`📧 Email: ${email}`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);

    // Check if nurse already exists
    const existingNurse = await prisma.staff.findFirst({
      where: {
        email: email
      }
    });

    if (existingNurse) {
      console.log('⚠️  Nurse account already exists');
      console.log(`   ID: ${existingNurse.id}`);
      console.log(`   Staff ID: ${existingNurse.staffId}`);
      console.log(`   Email: ${existingNurse.email}`);
      console.log(`   Phone: ${existingNurse.phone}`);
      console.log(`   Role: ${existingNurse.role}`);
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
    const staffId = await generateStaffId('NURSE');
    console.log(`🆔 Generated Staff ID: ${staffId}`);

    // Create nurse in database
    const nurse = await prisma.staff.create({
      data: {
        staffId: staffId,
        firebaseUid: firebaseUser.uid,
        email: email,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        role: 'NURSE',
        type: 'NON_TEACHING',
        status: 'ACTIVE',
      }
    });

    console.log('✅ Nurse account created successfully');
    console.log(`   Staff ID: ${nurse.staffId}`);
    console.log(`   Database ID: ${nurse.id}`);
    console.log(`   Name: ${nurse.firstName} ${nurse.lastName}`);
    console.log(`   Email: ${nurse.email}`);
    console.log(`   Phone: ${nurse.phone}`);
    console.log(`   Role: ${nurse.role}`);
    console.log(`   Firebase UID: ${nurse.firebaseUid}`);
    console.log(`   Default Password: ${phone.replace(/\D/g, '')}`);

  } catch (error) {
    console.error('❌ Error adding nurse account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addNurseAccount();
