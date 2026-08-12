require("dotenv").config();
const prisma = require("./lib/prisma");
const AuthRepository = require("./shared/repositories/AuthRepository");
const generateStaffId = require("./utils/generateStaffId");
const logger = require("./utils/logger");

async function addAdminAccount() {
  try {
    const email = "i.inps@yahoo.com";
    const phone = "08162774990";
    const firstName = "Admin";
    const lastName = "User";
    const gender = "MALE";

    console.log('🔐 Adding admin account...');
    console.log(`📧 Email: ${email}`);
    console.log(`📱 Phone: ${phone}`);

    // Check if admin already exists
    const existingAdmin = await prisma.staff.findFirst({
      where: {
        email: email
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Phone: ${existingAdmin.phone}`);
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
    const staffId = await generateStaffId('ADMIN');
    console.log(`🆔 Generated Staff ID: ${staffId}`);

    // Create admin in database
    const admin = await prisma.staff.create({
      data: {
        staffId: staffId,
        firebaseUid: firebaseUser.uid,
        email: email,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        role: 'ADMIN',
        type: 'NON_TEACHING',
        status: 'ACTIVE',
      }
    });

    console.log('✅ Admin account created successfully');
    console.log(`   Staff ID: ${admin.id}`);
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Phone: ${admin.phone}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Default Password: ${phone.replace(/\D/g, '')}`);

  } catch (error) {
    console.error('❌ Error adding admin account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminAccount();