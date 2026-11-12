require("dotenv").config();
const prisma = require("./lib/prisma");

async function addProprietorToEnum() {
  try {
    console.log('Adding PROPRIETOR to StaffRole enum...');

    await prisma.$executeRaw`ALTER TYPE "StaffRole" ADD VALUE 'PROPRIETOR'`;

    console.log('✅ PROPRIETOR added to StaffRole enum');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  PROPRIETOR already exists in enum');
    } else {
      console.error('❌ Error adding to enum:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

addProprietorToEnum()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
