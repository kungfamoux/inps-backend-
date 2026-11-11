const prisma = require("./lib/prisma");

/**
 * Script to investigate the gap at sequence 691 in admission numbers
 */

async function investigateGap() {
  console.log("🔍 Investigating gap at sequence 691...\n");

  try {
    // Get students around the gap
    const studentsAroundGap = await prisma.student.findMany({
      where: {
        admissionNumber: {
          in: ['INPS-2026-690', 'INPS-2026-691', 'INPS-2026-692'],
        },
      },
      select: {
        admissionNumber: true,
        firstName: true,
        lastName: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        admissionNumber: 'asc',
      },
    });

    console.log("📋 Students around sequence 691:");
    if (studentsAroundGap.length === 0) {
      console.log("  No students found in this range");
    } else {
      studentsAroundGap.forEach(student => {
        console.log(`  ${student.admissionNumber}:`);
        console.log(`    Student: ${student.firstName} ${student.lastName}`);
        console.log(`    Status: ${student.status}`);
        console.log(`    Created: ${student.createdAt.toISOString()}`);
        console.log(`    Updated: ${student.updatedAt.toISOString()}`);
        console.log(`    Deleted: ${student.deletedAt ? student.deletedAt.toISOString() : 'No'}`);
        console.log();
      });
    }

    // Check if sequence 691 exists anywhere (including deleted)
    const existing691 = await prisma.student.findFirst({
      where: {
        admissionNumber: 'INPS-2026-691',
      },
      select: {
        admissionNumber: true,
        firstName: true,
        lastName: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (existing691) {
      console.log("✅ Sequence 691 EXISTS in database:");
      console.log(`  ${existing691.admissionNumber}: ${existing691.firstName} ${existing691.lastName}`);
      console.log(`  Status: ${existing691.status}`);
      console.log(`  Deleted: ${existing691.deletedAt ? 'Yes' : 'No'}`);
      console.log(`  Created: ${existing691.createdAt.toISOString()}`);
    } else {
      console.log("❌ Sequence 691 does NOT exist in database (including deleted records)");
    }

    // Check all students to see if any have unusual admission numbers
    const allStudents = await prisma.student.findMany({
      select: {
        admissionNumber: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
      orderBy: {
        admissionNumber: 'asc',
      },
    });

    // Look for any students created around the same time as 690 and 692
    const student690 = allStudents.find(s => s.admissionNumber === 'INPS-2026-690');
    const student692 = allStudents.find(s => s.admissionNumber === 'INPS-2026-692');

    if (student690 && student692) {
      console.log("\n⏰ Time analysis:");
      console.log(`  Student 690 created: ${student690.createdAt.toISOString()}`);
      console.log(`  Student 692 created: ${student692.createdAt.toISOString()}`);
      
      const timeDiff = student692.createdAt.getTime() - student690.createdAt.getTime();
      console.log(`  Time difference: ${timeDiff}ms (${Math.round(timeDiff / 1000)}s)`);
      
      // Look for any students created between these two
      const studentsBetween = allStudents.filter(s => 
        s.createdAt > student690.createdAt && s.createdAt < student692.createdAt
      );
      
      if (studentsBetween.length > 0) {
        console.log(`  ⚠️  ${studentsBetween.length} student(s) created between 690 and 692:`);
        studentsBetween.forEach(s => {
          console.log(`    ${s.admissionNumber}: ${s.firstName} ${s.lastName} (${s.createdAt.toISOString()})`);
        });
      } else {
        console.log("  No students created between 690 and 692");
      }
    }

    // Check counter history by looking at all students created on the same day
    if (student690) {
      const sameDayStudents = allStudents.filter(s => 
        s.createdAt.toDateString() === student690.createdAt.toDateString()
      );
      
      console.log(`\n📅 Students created on ${student690.createdAt.toDateString()}:`);
      console.log(`  Total: ${sameDayStudents.length}`);
      sameDayStudents.forEach(s => {
        console.log(`    ${s.admissionNumber}: ${s.firstName} ${s.lastName} (${s.createdAt.toISOString()})`);
      });
    }

    // Check for any database anomalies
    console.log("\n🔍 Database anomaly checks:");
    
    // Skip null/empty checks since admissionNumber is required field
    console.log("  Skipping null/empty admission number checks (field is required)");
    
    // Check for duplicate admission numbers
    const admissionNumbers = allStudents.map(s => s.admissionNumber);
    const uniqueAdmissionNumbers = [...new Set(admissionNumbers)];
    const duplicates = admissionNumbers.length - uniqueAdmissionNumbers.length;
    console.log(`  Duplicate admission numbers: ${duplicates}`);

    // Check the current counter value
    const counter = await prisma.counter.findUnique({
      where: { id: 'student_admission' },
    });
    
    if (counter) {
      console.log(`\n🔢 Current counter status:`);
      console.log(`  Counter value: ${counter.value}`);
      console.log(`  Next admission number: INPS-2026-${String(counter.value + 1).padStart(3, '0')}`);
    }

  } catch (error) {
    console.error("❌ Error investigating gap:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the investigation
investigateGap();