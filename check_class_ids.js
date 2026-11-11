require('dotenv').config();
const prisma = require('./lib/prisma');

async function checkClassIds() {
  try {
    const classes = await prisma.class.findMany({
      where: {
        name: {
          contains: '5'
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log('Primary 5 classes:');
    classes.forEach(c => {
      console.log(`  ${c.name}: ${c.id}`);
    });

    const classes2 = await prisma.class.findMany({
      where: {
        name: {
          contains: '2'
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log('\nPrimary 2 classes:');
    classes2.forEach(c => {
      console.log(`  ${c.name}: ${c.id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClassIds();
