const prisma = require('./lib/prisma');

async function migrateCurrentStatus() {
  console.log('Starting migration of CURRENT status to SchoolConfig...');

  try {
    // Step 1: Find the current term with session
    const currentTerm = await prisma.academicTerm.findFirst({
      where: { status: 'CURRENT' },
      include: { session: true },
    });

    if (!currentTerm) {
      console.log('No current term found. Skipping migration.');
      return;
    }

    console.log(`Found current term: ${currentTerm.term} in session: ${currentTerm.session.session}`);

    // Step 2: Get or create SchoolConfig
    let schoolConfig = await prisma.schoolConfig.findFirst();

    if (schoolConfig) {
      console.log('SchoolConfig already exists. Updating...');
      schoolConfig = await prisma.schoolConfig.update({
        where: { id: schoolConfig.id },
        data: {
          currentSessionId: currentTerm.sessionId,
          currentTermId: currentTerm.id,
          academicYear: currentTerm.session.session,
          currentTerm: currentTerm.term,
        },
      });
    } else {
      console.log('Creating new SchoolConfig...');
      schoolConfig = await prisma.schoolConfig.create({
        data: {
          id: 'singleton',
          currentSessionId: currentTerm.sessionId,
          currentTermId: currentTerm.id,
          academicYear: currentTerm.session.session,
          currentTerm: currentTerm.term,
        },
      });
    }

    console.log('SchoolConfig updated successfully:', schoolConfig);

    // Step 3: Session status is now removed from CURRENT enum, so no need to update
    console.log('Session status CURRENT already removed from enum');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateCurrentStatus()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));