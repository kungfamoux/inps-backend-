require("dotenv").config();
const prisma = require("./lib/prisma");

async function checkAcademicSessions() {
  try {
    console.log("🔍 Checking academic sessions...");
    
    const sessions = await prisma.academicSession.findMany();
    console.log(`Found ${sessions.length} academic sessions:`);
    
    sessions.forEach(session => {
      console.log(`  - ID: ${session.id}`);
      console.log(`    Session: ${session.session}`);
      console.log(`    Status: ${session.status}`);
      console.log(`    Start Date: ${session.startDate}`);
      console.log(`    End Date: ${session.endDate}`);
      console.log("");
    });

    console.log("🔍 Checking academic terms...");
    
    const terms = await prisma.academicTerm.findMany();
    console.log(`Found ${terms.length} academic terms:`);
    
    terms.forEach(term => {
      console.log(`  - ID: ${term.id}`);
      console.log(`    Session ID: ${term.sessionId}`);
      console.log(`    Term: ${term.term}`);
      console.log(`    Status: ${term.status}`);
      console.log(`    Start Date: ${term.startDate}`);
      console.log(`    End Date: ${term.endDate}`);
      console.log("");
    });

    console.log("🔍 Checking SchoolConfig...");
    
    const schoolConfig = await prisma.schoolConfig.findUnique({
      where: { id: "singleton" }
    });
    
    if (schoolConfig) {
      console.log("SchoolConfig found:");
      console.log(`  Current Session ID: ${schoolConfig.currentSessionId}`);
      console.log(`  Current Term ID: ${schoolConfig.currentTermId}`);
      console.log(`  Academic Year: ${schoolConfig.academicYear}`);
      console.log(`  Current Term: ${schoolConfig.currentTerm}`);
    } else {
      console.log("❌ No SchoolConfig found");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAcademicSessions();
