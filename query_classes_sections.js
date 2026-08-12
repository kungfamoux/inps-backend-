const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryClassesAndSections() {
  try {
    // Get all classes with their sections
    const classes = await prisma.class.findMany({
      include: {
        sections: {
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        level: 'asc'
      }
    });

    console.log('=== ALL CLASSES AND SECTIONS ===\n');

    classes.forEach(cls => {
      console.log(`Class: ${cls.name} (Level: ${cls.level}, Status: ${cls.status})`);
      console.log(`  Sections (${cls.sections.length}):`);
      cls.sections.forEach(section => {
        console.log(`    - ${section.name} (ID: ${section.id}, Enrollment: ${section.currentEnrollment}, Status: ${section.status})`);
        if (section.color) {
          console.log(`      Color: ${section.color}`);
        }
        if (section.roomNumber) {
          console.log(`      Room: ${section.roomNumber}`);
        }
        if (section.classTeacherId) {
          console.log(`      Teacher ID: ${section.classTeacherId}`);
        }
      });
      console.log('');
    });

    // Summary
    const totalClasses = classes.length;
    const totalSections = classes.reduce((sum, cls) => sum + cls.sections.length, 0);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total Classes: ${totalClasses}`);
    console.log(`Total Sections: ${totalSections}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryClassesAndSections();
