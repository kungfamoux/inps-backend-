require("dotenv").config();
const prisma = require("./lib/prisma");
const AuthRepository = require("./shared/repositories/AuthRepository");
const generateStaffId = require("./utils/generateStaffId");
const logger = require("./utils/logger");

async function addProprietorAccount() {
  try {
    const email = "proprietor@inps.com";
    const phone = "08012345678";
    const firstName = "John";
    const lastName = "Proprietor";
    const gender = "MALE";

    console.log('🏢 Adding proprietor account...');
    console.log(`📧 Email: ${email}`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);

    // Check if proprietor already exists
    const existingProprietor = await prisma.staff.findFirst({
      where: {
        email: email
      }
    });

    if (existingProprietor) {
      console.log('⚠️  Proprietor account already exists');
      console.log(`   ID: ${existingProprietor.id}`);
      console.log(`   Staff ID: ${existingProprietor.staffId}`);
      console.log(`   Email: ${existingProprietor.email}`);
      console.log(`   Phone: ${existingProprietor.phone}`);
      console.log(`   Role: ${existingProprietor.role}`);
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
    const staffId = await generateStaffId('PROPRIETOR');
    console.log(`🆔 Generated Staff ID: ${staffId}`);

    // Create proprietor in database
    const proprietor = await prisma.staff.create({
      data: {
        staffId: staffId,
        firebaseUid: firebaseUser.uid,
        email: email,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        role: 'PROPRIETOR',
        type: 'NON_TEACHING',
        status: 'ACTIVE',
      }
    });

    console.log('✅ Proprietor account created successfully');
    console.log(`   Staff ID: ${proprietor.staffId}`);
    console.log(`   Database ID: ${proprietor.id}`);
    console.log(`   Name: ${proprietor.firstName} ${proprietor.lastName}`);
    console.log(`   Email: ${proprietor.email}`);
    console.log(`   Phone: ${proprietor.phone}`);
    console.log(`   Role: ${proprietor.role}`);
    console.log(`   Firebase UID: ${proprietor.firebaseUid}`);
    console.log(`   Default Password: ${phone.replace(/\D/g, '')}`);

  } catch (error) {
    console.error('❌ Error adding proprietor account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addProprietorAccount();
