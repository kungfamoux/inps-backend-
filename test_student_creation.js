require("dotenv").config();
const prisma = require("./lib/prisma");
const AuthRepository = require("./shared/repositories/AuthRepository");
const generateAdmissionNumber = require("./utils/generateAdmissionNumber");

async function testStudentCreation() {
  try {
    console.log('🧪 Testing student creation with new guardian structure...\n');

    const testData = {
      firstName: "Test",
      lastName: "Student",
      gender: "MALE",
      dateOfBirth: "2020-01-01",
      admissionDate: "2026-09-01",
      accountEmail: "test.parent2@test.com",
      accountPhone: "+2348123456789",
      parentData: JSON.stringify({
        primaryGuardian: {
          relationship: "Father",
          title: "Mr.",
          firstName: "Test",
          lastName: "Parent",
          phone: "+2348123456789",
          email: "test.parent2@test.com",
          occupation: "Engineer",
          address: "123 Test Street"
        },
        secondaryGuardian: null,
        address: "123 Test Street",
        maritalStatus: "MARRIED"
      })
    };

    console.log('Test data:', JSON.stringify(testData, null, 2));

    // Create Firebase user first
    let firebaseUser;
    try {
      firebaseUser = await AuthRepository.createFirebaseUser(testData.accountEmail, testData.accountPhone);
      console.log('✅ Firebase user created');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Firebase user already exists, fetching...');
        firebaseUser = await AuthRepository.getUserByEmail(testData.accountEmail);
        console.log('✅ Retrieved existing Firebase user');
      } else {
        throw error;
      }
    }

    // Create parent
    const parent = await prisma.parent.create({
      data: {
        firebaseUid: firebaseUser.uid,
        accountEmail: testData.accountEmail,
        accountPhone: testData.accountPhone,
        primaryGuardian: JSON.stringify(JSON.parse(testData.parentData).primaryGuardian),
        secondaryGuardian: JSON.parse(testData.parentData).secondaryGuardian ? JSON.stringify(JSON.parse(testData.parentData).secondaryGuardian) : null,
        address: JSON.parse(testData.parentData).address,
        maritalStatus: JSON.parse(testData.parentData).maritalStatus
      }
    });

    console.log('✅ Parent created successfully');
    console.log(`   Parent ID: ${parent.id}`);
    console.log(`   Email: ${parent.accountEmail}`);

    // Generate admission number using the proper utility
    const admissionNumber = await generateAdmissionNumber(prisma);

    // Create student
    const student = await prisma.student.create({
      data: {
        admissionNumber: admissionNumber,
        firstName: testData.firstName,
        lastName: testData.lastName,
        gender: testData.gender,
        dateOfBirth: new Date(testData.dateOfBirth),
        admissionDate: new Date(testData.admissionDate),
        nationality: "Nigerian",
        state: "Lagos",
        status: "ACTIVE",
        intakeType: "NEW",
        parentId: parent.id
      }
    });

    console.log('✅ Student created successfully');
    console.log(`   Admission Number: ${student.admissionNumber}`);
    console.log(`   Name: ${student.firstName} ${student.lastName}`);

    // Cleanup test data
    await prisma.student.delete({ where: { id: student.id } });
    await prisma.parent.delete({ where: { id: parent.id } });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Student creation test passed!');

  } catch (error) {
    console.error('❌ Student creation test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testStudentCreation();