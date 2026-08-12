require("dotenv/config");
const prisma = require("./lib/prisma");

async function verifyCreatedData() {
  try {
    console.log('🔍 Verifying created data...\n');
    
    // Get all parents
    const parents = await prisma.parent.findMany();
    console.log(`📊 Found ${parents.length} parent(s):`);
    
    parents.forEach(parent => {
      console.log(`\n👨‍👩‍👧 Parent ID: ${parent.id}`);
      console.log(`   Account Email: ${parent.accountEmail}`);
      console.log(`   Account Phone: ${parent.accountPhone}`);
      
      const primaryGuardian = JSON.parse(parent.primaryGuardian);
      console.log(`   Primary Guardian: ${primaryGuardian.title} ${primaryGuardian.firstName} ${primaryGuardian.lastName} (${primaryGuardian.relationship})`);
      console.log(`   - Phone: ${primaryGuardian.phone}`);
      console.log(`   - Email: ${primaryGuardian.email}`);
      console.log(`   - Occupation: ${primaryGuardian.occupation}`);
      
      if (parent.secondaryGuardian) {
        const secondaryGuardian = JSON.parse(parent.secondaryGuardian);
        console.log(`   Secondary Guardian: ${secondaryGuardian.firstName} ${secondaryGuardian.lastName} (${secondaryGuardian.relationship})`);
        console.log(`   - Phone: ${secondaryGuardian.phone}`);
        console.log(`   - Email: ${secondaryGuardian.email}`);
        console.log(`   - Occupation: ${secondaryGuardian.occupation}`);
      }
      
      console.log(`   Address: ${parent.address}`);
      console.log(`   Marital Status: ${parent.maritalStatus}`);
    });
    
    // Get all students
    const students = await prisma.student.findMany({
      include: {
        parent: true
      }
    });
    
    console.log(`\n📊 Found ${students.length} student(s):`);
    
    students.forEach(student => {
      console.log(`\n🎓 Student Admission Number: ${student.admissionNumber}`);
      console.log(`   Name: ${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`);
      console.log(`   Gender: ${student.gender}`);
      console.log(`   Date of Birth: ${student.dateOfBirth?.toISOString().split('T')[0]}`);
      console.log(`   Blood Group: ${student.bloodGroup}`);
      console.log(`   Student Type: ${student.studentType}`);
      console.log(`   Status: ${student.status}`);
      console.log(`   Intake Type: ${student.intakeType}`);
      console.log(`   Parent ID: ${student.parentId}`);
      
      if (student.parent) {
        const primaryGuardian = JSON.parse(student.parent.primaryGuardian);
        console.log(`   Parent: ${primaryGuardian.firstName} ${primaryGuardian.lastName}`);
      }
    });
    
    console.log('\n✅ Data verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    process.exit(1);
  }
}

verifyCreatedData();