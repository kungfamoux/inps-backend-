require("dotenv").config();
const prisma = require("./lib/prisma");
const AuthRepository = require("./shared/repositories/AuthRepository");
const StaffRepository = require("./admin_portal/repositories/StaffRepository");
const StaffFinancialRepository = require("./admin_portal/repositories/StaffFinancialRepository");
const generateStaffId = require("./utils/generateStaffId");
const logger = require("./utils/logger");
const { sendStaffAccountCreationEmail } = require("./utils/resend");

async function createTestStaff() {
  try {
    const email = "ezejingozi21@gmail.com";
    const phone = "08012345678";
    const firstName = "Eze";
    const lastName = "Jingozi";
    const role = "TEACHER";

    console.log('🧪 Creating test staff account...');
    console.log(`📧 Email: ${email}`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log(`🎯 Role: ${role}\n`);

    // Check if staff already exists
    const existingStaff = await StaffRepository.findByEmail(email);
    if (existingStaff) {
      console.log('⚠️  Staff account already exists');
      console.log(`   ID: ${existingStaff.id}`);
      console.log(`   Email: ${existingStaff.email}`);
      console.log(`   Phone: ${existingStaff.phone}`);
      return;
    }

    console.log('🔐 Creating Firebase user...');
    let firebaseUser;
    try {
      firebaseUser = await AuthRepository.createFirebaseUser(email, phone);
      console.log('✅ Firebase user created');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Firebase user already exists, fetching existing user...');
        const existingUser = await AuthRepository.getFirebaseUserByEmail(email);
        const existingStaffByUid = await StaffRepository.findByFirebaseUid(existingUser.uid);
        
        if (existingStaffByUid) {
          console.log('❌ Staff account already exists with this Firebase account');
          return;
        }
        
        firebaseUser = existingUser;
        console.log('✅ Retrieved existing Firebase user (will link to new staff account)');
      } else {
        throw error;
      }
    }

    console.log('🆔 Generating Staff ID...');
    const staffId = await generateStaffId(role);
    console.log(`✅ Generated Staff ID: ${staffId}`);

    console.log('💾 Creating staff record in database...');
    const staff = await prisma.$transaction(async (tx) => {
      return StaffRepository.create(
        {
          staffId,
          firebaseUid: firebaseUser.uid,
          firstName,
          lastName,
          middleName: null,
          email,
          phone,
          gender: 'MALE',
          dateOfBirth: new Date('1990-01-15'),
          address: 'Test Address',
          maritalStatus: 'SINGLE',
          nationality: 'Nigerian',
          state: 'Lagos',
          lga: 'Ikeja',
          religion: 'Christianity',
          qualifications: JSON.stringify(['B.Sc Computer Science']),
          yearsOfExperience: 5,
          previousEmployment: JSON.stringify('Previous School'),
          dateOfEmployment: new Date('2024-01-01'),
          nextOfKinName: 'Next of Kin',
          nextOfKinPhone: '08098765432',
          nextOfKinRelationship: 'Sibling',
          nextOfKinAddress: 'Next of Kin Address',
          type: 'TEACHING',
          role,
          status: 'ACTIVE',
        },
        tx,
      );
    });

    console.log('✅ Staff account created successfully');
    console.log(`   Staff ID: ${staff.id}`);
    console.log(`   Staff Number: ${staff.staffId}`);
    console.log(`   Name: ${staff.firstName} ${staff.lastName}`);
    console.log(`   Email: ${staff.email}`);
    console.log(`   Phone: ${staff.phone}`);
    console.log(`   Role: ${staff.role}`);
    console.log(`   Default Password: ${phone.replace(/\D/g, '')}\n`);

    console.log('📧 Sending account creation email...');
    try {
      await sendStaffAccountCreationEmail({
        to: staff.email,
        staffName: `${staff.firstName} ${staff.lastName}`,
        staffEmail: staff.email,
        phoneNumber: staff.phone,
      });
      console.log('✅ Email sent successfully to ezejingozi21@gmail.com');
      console.log('📧 Please check your inbox (and spam folder) for the account creation email.');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      console.log('   Staff account was created successfully, but email could not be sent.');
    }

  } catch (error) {
    console.error('❌ Error creating test staff account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestStaff();