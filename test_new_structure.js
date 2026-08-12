require("dotenv/config");
const prisma = require("./lib/prisma");

async function deleteAndRecreateData() {
  try {
    console.log('🗑️  Deleting existing data...');
    
    // Delete all students first (they depend on parents)
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`✅ Deleted ${deletedStudents.count} students`);
    
    // Delete all parents
    const deletedParents = await prisma.parent.deleteMany({});
    console.log(`✅ Deleted ${deletedParents.count} parents`);
    
    console.log('🎉 Data deletion complete');
    
  } catch (error) {
    console.error('❌ Error deleting data:', error);
    throw error;
  }
}

async function createTestParent() {
  try {
    console.log('👨‍👩‍👧 Creating test parent with new guardian structure...');
    
    const parent = await prisma.parent.create({
      data: {
        firebaseUid: 'test-parent-uid-' + Date.now(),
        accountEmail: 'test.parent@example.com',
        accountPhone: '+2348012345678',
        primaryGuardian: JSON.stringify({
          relationship: 'Father',
          title: 'Mr.',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+2348012345678',
          email: 'john.doe@example.com',
          occupation: 'Engineer',
          address: '123 Test Street, Lagos'
        }),
        secondaryGuardian: JSON.stringify({
          relationship: 'Mother',
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+2348023456789',
          email: 'jane.doe@example.com',
          occupation: 'Teacher'
        }),
        address: '123 Test Street, Lagos',
        maritalStatus: 'MARRIED'
      }
    });
    
    console.log('✅ Test parent created:', parent.id);
    console.log('📋 Parent details:', {
      id: parent.id,
      accountEmail: parent.accountEmail,
      primaryGuardian: JSON.parse(parent.primaryGuardian),
      secondaryGuardian: parent.secondaryGuardian ? JSON.parse(parent.secondaryGuardian) : null
    });
    
    return parent;
  } catch (error) {
    console.error('❌ Error creating test parent:', error);
    throw error;
  }
}

async function createTestStudent(parentId) {
  try {
    console.log('🎓 Creating test student...');
    
    const student = await prisma.student.create({
      data: {
        admissionNumber: 'ADM' + Date.now(),
        firstName: 'Michael',
        lastName: 'Doe',
        middleName: 'James',
        gender: 'MALE',
        dateOfBirth: new Date('2015-05-15'),
        nationality: 'Nigerian',
        state: 'Lagos',
        lga: 'Ikeja',
        religion: 'Christianity',
        bloodGroup: 'O+',
        studentType: 'Day',
        address: '123 Test Street, Lagos',
        status: 'ACTIVE',
        intakeType: 'NEW',
        admissionDate: new Date('2024-09-01'),
        parentId: parentId
      }
    });
    
    console.log('✅ Test student created:', student.admissionNumber);
    console.log('📋 Student details:', {
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      parentId: student.parentId
    });
    
    return student;
  } catch (error) {
    console.error('❌ Error creating test student:', error);
    throw error;
  }
}

async function main() {
  try {
    // Delete existing data
    await deleteAndRecreateData();
    
    // Create test parent with new structure
    const parent = await createTestParent();
    
    // Create test student linked to the parent
    const student = await createTestStudent(parent.id);
    
    console.log('🎉 All operations completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Parent ID: ${parent.id}`);
    console.log(`   - Student Admission Number: ${student.admissionNumber}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();