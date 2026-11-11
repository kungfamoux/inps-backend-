require("dotenv").config();
const prisma = require("./lib/prisma");

async function checkSubjects() {
  try {
    console.log("🔍 Checking available subjects...");

    const subjects = await prisma.subject.findMany();
    console.log(`Found ${subjects.length} subjects:`);
    
    subjects.forEach(s => {
      console.log(`  - ${s.subjectName} (${s.subjectCode}) - ${s.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubjects();
