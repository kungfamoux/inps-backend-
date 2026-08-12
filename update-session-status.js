const prisma = require('./lib/prisma');

async function updateSessionStatus() {
  try {
    await prisma.academicSession.updateMany({
      where: { status: 'CURRENT' },
      data: { status: 'UPCOMING' }
    });
    console.log('Updated session status from CURRENT to UPCOMING');
  } catch (error) {
    console.error('Error updating session status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSessionStatus();