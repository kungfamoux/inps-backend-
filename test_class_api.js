require("dotenv").config();
const prisma = require("./lib/prisma");

async function testClassApi() {
  try {
    console.log('🧪 Testing class API...\n');

    const classId = '1f46a812-4959-4cd3-b66e-7b84102f629d';
    
    console.log(`Fetching class: ${classId}`);
    
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        classTeacher: {
          select: {
            staffId: true,
            firstName: true,
            lastName: true,
          },
        },
        assistantTeacher: {
          select: {
            staffId: true,
            firstName: true,
            lastName: true,
          },
        },
        classSubjects: true,
      },
    });

    if (!cls) {
      console.log('❌ Class not found');
      return;
    }

    console.log('✅ Class found:');
    console.log(`   Name: ${cls.name}`);
    console.log(`   Status: ${cls.status}`);
    console.log(`   Class Teacher: ${cls.classTeacher ? `${cls.classTeacher.firstName} ${cls.classTeacher.lastName}` : 'None'}`);
    console.log(`   Assistant Teacher: ${cls.assistantTeacher ? `${cls.assistantTeacher.firstName} ${cls.assistantTeacher.lastName}` : 'None'}`);
    console.log(`   Class Subjects: ${cls.classSubjects.length}`);

    // Test the sanitizer
    const sanitizeClass = (c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      roomNumber: c.roomNumber,
      status: c.status,
      currentEnrollment: c.currentEnrollment,
      classTeacher: c.classTeacher
        ? {
            staffId: c.classTeacher.staffId,
            firstName: c.classTeacher.firstName,
            lastName: c.classTeacher.lastName,
          }
        : null,
      assistantTeacher: c.assistantTeacher
        ? {
            staffId: c.assistantTeacher.staffId,
            firstName: c.assistantTeacher.firstName,
            lastName: c.assistantTeacher.lastName,
          }
        : null,
    });

    const sanitized = sanitizeClass(cls);
    console.log('\n✅ Sanitized class:', JSON.stringify(sanitized, null, 2));

  } catch (error) {
    console.error('❌ Error testing class API:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testClassApi();