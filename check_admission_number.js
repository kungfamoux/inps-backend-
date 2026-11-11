require("dotenv").config();
const prisma = require("./lib/prisma");
const generateAdmissionNumber = require("./utils/generateAdmissionNumber");

async function checkAdmissionNumber() {
  try {
    console.log('🔍 Checking admission number counter...\n');

    // Check the last admission number from deleted students if any exist in audit
    const lastStudent = await prisma.student.findFirst({
      orderBy: { admissionNumber: 'desc' }
    });

    console.log('📊 Current admission number state:');
    if (lastStudent) {
      console.log(`   Last admission number in database: ${lastStudent.admissionNumber}`);
    } else {
      console.log('   No students found in database');
    }

    // Test generating a new admission number
    console.log('\n🧪 Testing admission number generation...');
    const testNumber = await generateAdmissionNumber();
    console.log(`   Next admission number would be: ${testNumber}`);

    // Check if we can reset the counter manually if needed
    if (testNumber !== 'INPSE-2024-001') {
      console.log('\n⚠️  Admission number is not reset to 001');
      console.log('   Current system would start from:', testNumber);
      
      // Ask if user wants to reset
      console.log('\n💡 Note: Admission numbers are typically auto-incremented.');
      console.log('   To reset to 001, you may need to update the sequence or manually set it.');
    } else {
      console.log('\n✅ Admission number is reset to 001');
    }

  } catch (error) {
    console.error('❌ Error checking admission number:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmissionNumber();