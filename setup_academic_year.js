require("dotenv").config();
const prisma = require("./lib/prisma");
const logger = require("./utils/logger");

async function setupAcademicYear() {
  try {
    logger.info('Setting up academic year 2026/2027...');
    
    // Create academic session
    const session = await prisma.academicSession.upsert({
      where: { session: '2026/2027' },
      update: {},
      create: {
        session: '2026/2027',
        status: 'UPCOMING',
      },
    });
    logger.info(`✅ Academic session created: ${session.session}`);
    
    // Create terms for the session
    const termDates = {
      'FIRST_TERM': { start: '2026-09-01', end: '2026-12-15', status: 'CURRENT' },
      'SECOND_TERM': { start: '2027-01-05', end: '2027-03-28', status: 'UPCOMING' },
      'THIRD_TERM': { start: '2027-04-19', end: '2027-07-25', status: 'UPCOMING' },
    };
    
    for (const [term, dates] of Object.entries(termDates)) {
      const academicTerm = await prisma.academicTerm.upsert({
        where: {
          sessionId_term: {
            sessionId: session.id,
            term: term,
          },
        },
        update: {},
        create: {
          sessionId: session.id,
          term: term,
          status: dates.status,
          startDate: new Date(dates.start),
          endDate: new Date(dates.end),
        },
      });
      logger.info(`✅ Term created: ${term} - Status: ${academicTerm.status}`);
    }
    
    // Set current session and term in SchoolConfig
    const currentTerm = await prisma.academicTerm.findFirst({
      where: {
        sessionId: session.id,
        term: 'FIRST_TERM',
      },
    });
    
    const schoolConfig = await prisma.schoolConfig.upsert({
      where: { id: 'singleton' },
      update: {
        currentSessionId: session.id,
        currentTermId: currentTerm.id,
        academicYear: '2026/2027',
        currentTerm: 'FIRST_TERM',
      },
      create: {
        id: 'singleton',
        currentSessionId: session.id,
        currentTermId: currentTerm.id,
        academicYear: '2026/2027',
        currentTerm: 'FIRST_TERM',
      },
    });
    
    logger.info('✅ School config updated with current session and term');
    logger.info(`   Current Session: ${session.session}`);
    logger.info(`   Current Term: ${currentTerm.term}`);
    
    logger.info('\n✅ Academic year setup complete!');
    
  } catch (error) {
    logger.error('❌ Error setting up academic year:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupAcademicYear()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
