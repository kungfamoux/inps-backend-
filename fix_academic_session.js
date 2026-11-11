require("dotenv").config();
const prisma = require("./lib/prisma");

async function fixAcademicSession() {
  try {
    console.log("🔧 Fixing academic session status...");
    
    // Update the academic session status to CURRENT
    const updatedSession = await prisma.academicSession.update({
      where: { id: "516d2a72-9a1a-4d0c-b3ca-b5fdeb8b6a39" },
      data: { 
        status: "CURRENT"
      }
    });

    console.log("✅ Academic session updated successfully:");
    console.log(`  Session: ${updatedSession.session}`);
    console.log(`  Status: ${updatedSession.status}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAcademicSession();
