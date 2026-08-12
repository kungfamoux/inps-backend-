require("dotenv").config();
const prisma = require("./lib/prisma");
const logger = require("./utils/logger");

// Subject assignments based on class levels
const SUBJECT_ASSIGNMENTS = {
  // Nursery levels get nursery subjects
  DAYCARE: [
    "NRS-ENG", "NRS-MTH", "NRS-IGB", "NRS-SCI", "NRS-SOC", 
    "NRS-CRS", "NRS-HLT", "NRS-CRT", "NRS-HWR", "NRS-PHO", 
    "NRS-GNK", "NRS-COL"
  ],
  PRENURSERY: [
    "NRS-ENG", "NRS-MTH", "NRS-IGB", "NRS-SCI", "NRS-SOC", 
    "NRS-CRS", "NRS-HLT", "NRS-CRT", "NRS-HWR", "NRS-PHO", 
    "NRS-GNK", "NRS-COL"
  ],
  NURSERY_1: [
    "NRS-ENG", "NRS-MTH", "NRS-IGB", "NRS-SCI", "NRS-SOC", 
    "NRS-CRS", "NRS-HLT", "NRS-CRT", "NRS-HWR", "NRS-PHO", 
    "NRS-GNK", "NRS-COL"
  ],
  NURSERY_2: [
    "NRS-ENG", "NRS-MTH", "NRS-IGB", "NRS-SCI", "NRS-SOC", 
    "NRS-CRS", "NRS-HLT", "NRS-CRT", "NRS-HWR", "NRS-PHO", 
    "NRS-GNK", "NRS-COL"
  ],
  NURSERY_3: [
    "NRS-ENG", "NRS-MTH", "NRS-IGB", "NRS-SCI", "NRS-SOC", 
    "NRS-CRS", "NRS-HLT", "NRS-CRT", "NRS-HWR", "NRS-PHO", 
    "NRS-GNK", "NRS-COL"
  ],
  // Primary levels get primary subjects
  PRIMARY_1: [
    "ENG", "MTH", "CRS", "BSC", "PHE", "HEC", "IGB", "SST", 
    "CIV", "AGR", "CCA", "HWD", "CMP", "MUS", "PHO", "FRN"
  ],
  PRIMARY_2: [
    "ENG", "MTH", "CRS", "BSC", "PHE", "HEC", "IGB", "SST", 
    "CIV", "AGR", "CCA", "HWD", "CMP", "MUS", "PHO", "FRN"
  ],
  PRIMARY_3: [
    "ENG", "MTH", "CRS", "BSC", "PHE", "HEC", "IGB", "SST", 
    "CIV", "AGR", "CCA", "HWD", "CMP", "MUS", "PHO", "FRN"
  ],
  PRIMARY_4: [
    "ENG", "MTH", "CRS", "BSC", "PHE", "HEC", "IGB", "SST", 
    "CIV", "AGR", "CCA", "HWD", "CMP", "MUS", "PHO", "FRN"
  ],
  PRIMARY_5: [
    "ENG", "MTH", "CRS", "BSC", "PHE", "HEC", "IGB", "SST", 
    "CIV", "AGR", "CCA", "HWD", "CMP", "MUS", "PHO", "FRN"
  ],
  PRIMARY_6: [
    "ENG", "MTH", "CRS", "BSC", "PHE", "HEC", "IGB", "SST", 
    "CIV", "AGR", "CCA", "HWD", "CMP", "MUS", "PHO", "FRN"
  ],
};

async function assignSubjectsToClasses() {
  try {
    logger.info("Starting subject assignment to classes...");

    // Get current academic session and term from SchoolConfig
    const schoolConfig = await prisma.schoolConfig.findFirst({
      where: {
        id: "singleton"
      },
      include: {
        currentSession: {
          include: {
            terms: true
          }
        },
        currentTermRelation: true
      }
    });

    if (!schoolConfig || !schoolConfig.currentSessionId || !schoolConfig.currentTermId) {
      throw new Error("No current session/term set in SchoolConfig. Please set current session and term first.");
    }

    const academicTerm = schoolConfig.currentTermRelation;
    logger.info(`Using current term: ${academicTerm.term} (Session: ${schoolConfig.currentSession.session}) - Term ID: ${academicTerm.id}`);

    // Get all active subjects
    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      include: { levels: true },
    });

    logger.info(`Found ${subjects.length} active subjects`);

    // Create a map of subject code to subject ID
    const subjectCodeToId = {};
    subjects.forEach(subject => {
      subjectCodeToId[subject.subjectCode] = subject.id;
    });

    // Get all classes
    const classes = await prisma.class.findMany();

    logger.info(`Found ${classes.length} classes`);

    let totalAssignments = 0;
    let skippedAssignments = 0;

    for (const cls of classes) {
      // Determine the appropriate level for this class
      let classLevel = null;
      
      // Try to match class name to level
      const className = cls.name.toLowerCase();
      
      if (className.includes("daycare")) classLevel = "DAYCARE";
      else if (className.includes("pre-nursery") || className.includes("prenursery")) classLevel = "PRENURSERY";
      else if (className.includes("nursery 1") || className.includes("nursery1")) classLevel = "NURSERY_1";
      else if (className.includes("nursery 2") || className.includes("nursery2")) classLevel = "NURSERY_2";
      else if (className.includes("nursery 3") || className.includes("nursery3")) classLevel = "NURSERY_3";
      else if (className.includes("primary 1") || className.includes("primary1")) classLevel = "PRIMARY_1";
      else if (className.includes("primary 2") || className.includes("primary2")) classLevel = "PRIMARY_2";
      else if (className.includes("primary 3") || className.includes("primary3")) classLevel = "PRIMARY_3";
      else if (className.includes("primary 4") || className.includes("primary4")) classLevel = "PRIMARY_4";
      else if (className.includes("primary 5") || className.includes("primary5")) classLevel = "PRIMARY_5";
      else if (className.includes("primary 6") || className.includes("primary6")) classLevel = "PRIMARY_6";

      if (!classLevel) {
        logger.warn(`Could not determine level for class: ${cls.name}. Skipping.`);
        continue;
      }

      const subjectCodes = SUBJECT_ASSIGNMENTS[classLevel];
      if (!subjectCodes) {
        logger.warn(`No subject assignments defined for level: ${classLevel}. Skipping class: ${cls.name}`);
        continue;
      }

      // Convert subject codes to subject IDs
      const subjectIds = subjectCodes
        .map(code => subjectCodeToId[code])
        .filter(id => id !== undefined); // Filter out undefined if subject doesn't exist

      if (subjectIds.length === 0) {
        logger.warn(`No valid subjects found for class: ${cls.name} (level: ${classLevel})`);
        continue;
      }

      logger.info(`Assigning ${subjectIds.length} subjects to class: ${cls.name} (level: ${classLevel})`);

      // Assign subjects to class
      for (const subjectId of subjectIds) {
        // Check if already assigned
        const existing = await prisma.classSubject.findFirst({
          where: {
            classId: cls.id,
            subjectId: subjectId,
            termId: academicTerm.id,
          },
        });

        if (existing) {
          skippedAssignments++;
          continue;
        }

        // Create assignment
        await prisma.classSubject.create({
          data: {
            classId: cls.id,
            subjectId: subjectId,
            termId: academicTerm.id,
          },
        });

        totalAssignments++;
      }

      logger.info(`✓ Completed assignments for ${cls.name}`);
    }

    logger.info(`Subject assignment complete:`);
    logger.info(`  - New assignments: ${totalAssignments}`);
    logger.info(`  - Skipped (already assigned): ${skippedAssignments}`);

  } catch (error) {
    logger.error(`Error assigning subjects to classes: ${error.message}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the assignment
assignSubjectsToClasses()
  .then(() => {
    logger.info("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Script failed:", error);
    process.exit(1);
  });
