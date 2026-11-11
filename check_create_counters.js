require("dotenv").config();
const prisma = require("./lib/prisma");
const logger = require("./utils/logger");

const ROLE_ABBREVIATIONS = {
	TEACHER: "TCH",
	ADMIN: "ADM",
	HEAD_TEACHER: "HTR",
	BURSARY: "BUR",
	STOREKEEPER: "STK",
	NURSE: "NUR",
	SUPERVISOR: "SUP",
	ICT: "ICT",
	CLEANERS: "CLN",
	SECURITY: "SEC",
	OTHERS: "OTH",
};

async function checkAndCreateCounters() {
  try {
    logger.info('Checking and creating staff role counters...');
    
    let created = 0;
    let existing = 0;
    
    for (const [role, abbr] of Object.entries(ROLE_ABBREVIATIONS)) {
      const counterId = `staff_${abbr}`;
      
      // Check if counter exists
      const existingCounter = await prisma.counter.findUnique({
        where: { id: counterId }
      });
      
      if (existingCounter) {
        logger.info(`✅ Counter exists: ${counterId} (value: ${existingCounter.value})`);
        existing++;
      } else {
        // Create the counter
        await prisma.counter.create({
          data: {
            id: counterId,
            value: 1
          }
        });
        logger.info(`✅ Created counter: ${counterId}`);
        created++;
      }
    }
    
    logger.info(`\n=== Summary ===`);
    logger.info(`Existing counters: ${existing}`);
    logger.info(`Created counters: ${created}`);
    logger.info(`Total counters: ${existing + created}`);
    
  } catch (error) {
    logger.error('Error checking/creating counters:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateCounters()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
