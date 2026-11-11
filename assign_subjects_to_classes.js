require("dotenv").config();
const prisma = require("./lib/prisma");
const logger = require("./utils/logger");

async function assignSubjectsToClasses() {
  try {
    logger.info("🎓 Starting subject assignment to classes...");

    // Get current academic session and term
    let currentSession = await prisma.academicSession.findFirst({
      where: { status: "CURRENT" },
    });

    if (!currentSession) {
      logger.warn("⚠️  No current academic session found. Creating one...");
      
      // Create current session if it doesn't exist
      currentSession = await prisma.academicSession.create({
        data: {
          session: "2026/2027",
          status: "CURRENT"
        }
      });
      logger.info(`✓ Created academic session: ${currentSession.session}`);
    }

    let currentTerm = await prisma.academicTerm.findFirst({
      where: { 
        sessionId: currentSession.id,
        status: "CURRENT" 
      },
    });

    if (!currentTerm) {
      logger.warn("⚠️  No current term found. Creating FIRST_TERM...");
      
      // Create current term if it doesn't exist
      currentTerm = await prisma.academicTerm.create({
        data: {
          term: "FIRST_TERM",
          status: "CURRENT",
          sessionId: currentSession.id,
          startDate: new Date("2026-08-15"),
          endDate: new Date("2026-12-15")
        }
      });
      logger.info(`✓ Created academic term: ${currentTerm.term}`);
    }

    logger.info(`Using current term: ${currentTerm.term} (ID: ${currentTerm.id})`);

    // Get all classes
    const classes = await prisma.class.findMany({
      where: { status: "ACTIVE" }
    });

    logger.info(`Found ${classes.length} active classes`);

    // Get all subjects
    const actualPrimarySubjects = await prisma.subject.findMany({
      where: { subjectCode: { not: { startsWith: "NRS-" } } },
      select: { id: true, subjectCode: true, subjectName: true }
    });

    const actualNurserySubjects = await prisma.subject.findMany({
      where: { subjectCode: { startsWith: "NRS-" } },
      select: { id: true, subjectCode: true, subjectName: true }
    });

    logger.info(`Found ${actualPrimarySubjects.length} primary subjects`);
    logger.info(`Found ${actualNurserySubjects.length} nursery subjects`);

    let totalAssignments = 0;
    let skippedAssignments = 0;

    for (const cls of classes) {
      const className = cls.name.toLowerCase();
      let subjectsToAssign = [];

      // Determine if class is nursery or primary based on name
      if (className.includes("daycare") || 
          className.includes("pre-nursery") || 
          className.includes("nursery")) {
        subjectsToAssign = actualNurserySubjects;
      } else {
        subjectsToAssign = actualPrimarySubjects;
      }

      // Assign subjects to class for current term
      for (const subject of subjectsToAssign) {
        // Check if assignment already exists
        const existing = await prisma.classSubject.findUnique({
          where: {
            classId_subjectId_termId: {
              classId: cls.id,
              subjectId: subject.id,
              termId: currentTerm.id
            }
          }
        });

        if (existing) {
          skippedAssignments++;
          continue; // Skip if already assigned
        }

        await prisma.classSubject.create({
          data: {
            classId: cls.id,
            subjectId: subject.id,
            termId: currentTerm.id
          }
        });

        totalAssignments++;
      }

      logger.info(`✓ Assigned ${subjectsToAssign.length} subjects to ${cls.name}`);
    }

    logger.info(`✅ Total subject assignments created: ${totalAssignments}`);
    logger.info(`ℹ️  Total subject assignments skipped (already exist): ${skippedAssignments}`);
    logger.info("🎉 Subject assignment complete!");

  } catch (error) {
    logger.error(`❌ Error: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

assignSubjectsToClasses();
