require("dotenv").config();
const prisma = require("./lib/prisma");

async function resetAdmissionCounter() {
  try {
    console.log('🔄 Resetting admission number counter...\n');

    const COUNTER_ID = "student_admission";

    // Check current counter value
    const currentCounter = await prisma.counter.findUnique({
      where: { id: COUNTER_ID }
    });

    if (currentCounter) {
      console.log(`📊 Current counter value: ${currentCounter.value}`);
    } else {
      console.log('📊 No counter found (this is unexpected)');
    }

    // Reset counter to 0 (next will be 1)
    console.log('🗑️  Resetting counter to 0...');
    await prisma.counter.upsert({
      where: { id: COUNTER_ID },
      create: { id: COUNTER_ID, value: 0 },
      update: { value: 0 }
    });

    // Verify the reset
    const updatedCounter = await prisma.counter.findUnique({
      where: { id: COUNTER_ID }
    });

    console.log(`✅ Counter reset to: ${updatedCounter.value}`);
    console.log('✅ Next admission number will be: INPS-2026-001\n');

    // Test the generation
    const generateAdmissionNumber = require("./utils/generateAdmissionNumber");
    const testNumber = await generateAdmissionNumber();
    console.log(`🧪 Test generation: ${testNumber}`);

    if (testNumber === 'INPS-2026-001') {
      console.log('✅ VERIFICATION PASSED: Admission number successfully reset to 001');
    } else {
      console.log('⚠️  VERIFICATION FAILED: Unexpected admission number generated');
    }

  } catch (error) {
    console.error('❌ Error resetting admission counter:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmissionCounter();