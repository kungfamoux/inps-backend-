require("dotenv").config();
const prisma = require("./lib/prisma");

async function comprehensiveCheck() {
  try {
    console.log("🔍 Comprehensive Subject Assignment Check");
    console.log("");

    // Check ClassSubject table
    console.log("1️⃣ Checking ClassSubject table...");
    const classSubjects = await prisma.classSubject.findMany({
      include: {
        subject: true,
        class: true,
        term: true
      }
    });
    console.log(`   Found ${classSubjects.length} class-subject assignments`);
    if (classSubjects.length > 0) {
      classSubjects.slice(0, 5).forEach(cs => {
        console.log(`   - Class: ${cs.class?.name} | Subject: ${cs.subject?.subjectName} | Term: ${cs.term?.term} (${cs.term?.status})`);
      });
    }

    // Check all terms
    console.log("\n2️⃣ Checking all academic terms...");
    const terms = await prisma.academicTerm.findMany();
    console.log(`   Found ${terms.length} terms:`);
    terms.forEach(t => {
      console.log(`   - ${t.term} (ID: ${t.id}) - Status: ${t.status}`);
    });

    // Check if there might be assignments in a different structure
    console.log("\n3️⃣ Checking if assignments might be in SubjectAssignment table...");
    const subjectAssignments = await prisma.subjectAssignment.findMany({
      include: {
        subject: true,
        class: true
      }
    });
    console.log(`   Found ${subjectAssignments.length} subject assignments`);
    if (subjectAssignments.length > 0) {
      subjectAssignments.slice(0, 5).forEach(sa => {
        console.log(`   - Class: ${sa.class?.name} | Subject: ${sa.subject?.subjectName} | Status: ${sa.status}`);
      });
    }

    // Check if class has subjects field directly
    console.log("\n4️⃣ Checking Class model structure...");
    const sampleClass = await prisma.class.findFirst();
    if (sampleClass) {
      console.log(`   Sample class: ${sampleClass.name}`);
      console.log(`   Fields: ${Object.keys(sampleClass).join(', ')}`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveCheck();
