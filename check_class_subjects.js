require("dotenv").config();
const prisma = require("./lib/prisma");

async function checkClassSubjects() {
  try {
    console.log("🔍 Checking ClassSubject data...");

    // Get all class subjects
    const classSubjects = await prisma.classSubject.findMany({
      include: {
        subject: true,
        class: true,
        term: true
      }
    });

    console.log(`Found ${classSubjects.length} class-subject assignments:`);
    
    classSubjects.forEach(cs => {
      console.log(`  - Class: ${cs.class?.name || cs.classId}`);
      console.log(`    Subject: ${cs.subject?.subjectName || cs.subjectId}`);
      console.log(`    Term: ${cs.term?.term} (${cs.termId})`);
      console.log(`    Status: ${cs.subject?.isActive ? 'ACTIVE' : 'INACTIVE'}`);
      console.log("");
    });

    // Get all classes
    const classes = await prisma.class.findMany();
    console.log(`\n📚 Available classes (${classes.length}):`);
    classes.forEach(c => {
      console.log(`  - ${c.name} (ID: ${c.id})`);
    });

    // Get current term
    const currentTerm = await prisma.academicTerm.findFirst({
      where: { status: 'CURRENT' }
    });

    if (currentTerm) {
      console.log(`\n📅 Current term: ${currentTerm.term} (ID: ${currentTerm.id})`);
    } else {
      console.log(`\n⚠️  No current term found`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkClassSubjects();
