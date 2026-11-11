require("dotenv").config();
const prisma = require("./lib/prisma");
const logger = require("./utils/logger");

async function createMissingCounters() {
  try {
    logger.info('Creating missing staff role counters...');
    
    // Create counters for new roles that might be missing
    const missingCounters = [
      { id: "staff_NUR" },
      { id: "staff_ICT" },
      { id: "staff_CLN" },
      { id: "staff_SEC" },
      { id: "staff_OTH" },
    ];
    
    for (const counter of missingCounters) {
      try {
        await prisma.counter.create({
          data: {
            id: counter.id,
            value: 1
          }
        });
        logger.info(`✅ Created counter: ${counter.id}`);
      } catch (error) {
        if (error.code === 'P2002') {
          logger.info(`ℹ️  Counter already exists: ${counter.id}`);
        } else {
          logger.error(`❌ Error creating counter ${counter.id}:`, error.message);
        }
      }
    }
    
    logger.info('✅ Missing counters created successfully');
    
  } catch (error) {
    logger.error('Error creating counters:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createMissingCounters()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
