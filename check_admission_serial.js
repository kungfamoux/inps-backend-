const prisma = require("./lib/prisma");

/**
 * Script to check if student admission numbers are serial/sequential
 * and identify any gaps in the sequence.
 */

async function checkAdmissionSerial() {
  console.log("🔍 Checking admission number serial...\n");

  try {
    // Get all students (including soft-deleted) ordered by admission number
    const allStudents = await prisma.student.findMany({
      where: {},
      select: {
        admissionNumber: true,
        firstName: true,
        lastName: true,
        status: true,
        deletedAt: true,
        createdAt: true,
      },
      orderBy: {
        admissionNumber: 'asc',
      },
    });

    if (allStudents.length === 0) {
      console.log("❌ No students found in database");
      return;
    }

    console.log(`📊 Total students in database: ${allStudents.length}\n`);

    // Group by year
    const studentsByYear = {};
    const invalidNumbers = [];

    allStudents.forEach((student) => {
      const admissionNumber = student.admissionNumber;
      
      // Parse admission number format: INPS-YYYY-XXX
      const parts = admissionNumber.split('-');
      
      if (parts.length !== 3 || parts[0] !== 'INPS') {
        invalidNumbers.push({
          admissionNumber,
          student: `${student.firstName} ${student.lastName}`,
          reason: 'Invalid format (expected INPS-YYYY-XXX)',
        });
        return;
      }

      const year = parts[1];
      const sequence = parseInt(parts[2], 10);

      if (isNaN(sequence)) {
        invalidNumbers.push({
          admissionNumber,
          student: `${student.firstName} ${student.lastName}`,
          reason: 'Invalid sequence number',
        });
        return;
      }

      if (!studentsByYear[year]) {
        studentsByYear[year] = [];
      }

      studentsByYear[year].push({
        admissionNumber,
        sequence,
        student: `${student.firstName} ${student.lastName}`,
        status: student.status,
        deletedAt: student.deletedAt,
        createdAt: student.createdAt,
      });
    });

    // Check invalid numbers
    if (invalidNumbers.length > 0) {
      console.log("❌ Invalid admission numbers found:");
      invalidNumbers.forEach((item) => {
        console.log(`   ${item.admissionNumber} - ${item.student} (${item.reason})`);
      });
      console.log();
    }

    // Check serial nature for each year
    const years = Object.keys(studentsByYear).sort();
    
    console.log("📅 Analysis by admission year:\n");

    years.forEach((year) => {
      const yearStudents = studentsByYear[year];
      yearStudents.sort((a, b) => a.sequence - b.sequence);

      console.log(`Year ${year}:`);
      console.log(`  Total students: ${yearStudents.length}`);
      console.log(`  Active students: ${yearStudents.filter(s => !s.deletedAt).length}`);
      console.log(`  Deleted students: ${yearStudents.filter(s => s.deletedAt).length}`);

      // Find min and max sequence
      const sequences = yearStudents.map(s => s.sequence);
      const minSeq = Math.min(...sequences);
      const maxSeq = Math.max(...sequences);

      console.log(`  Sequence range: ${minSeq} to ${maxSeq}`);

      // Check for gaps
      const gaps = [];
      for (let i = minSeq; i <= maxSeq; i++) {
        if (!sequences.includes(i)) {
          gaps.push(i);
        }
      }

      const expectedCount = maxSeq - minSeq + 1;
      const actualCount = sequences.length;
      const gapCount = expectedCount - actualCount;

      if (gapCount > 0) {
        console.log(`  ⚠️  Gaps found: ${gapCount} missing number(s)`);
        if (gaps.length <= 20) {
          console.log(`     Missing sequences: ${gaps.join(', ')}`);
        } else {
          console.log(`     First 20 gaps: ${gaps.slice(0, 20).join(', ')}...`);
          console.log(`     Last 20 gaps: ...${gaps.slice(-20).join(', ')}`);
        }
      } else {
        console.log(`  ✅ No gaps - perfectly serial (${actualCount} students, ${expectedCount} possible numbers)`);
      }

      // Check for duplicates
      const sequenceCounts = {};
      sequences.forEach(seq => {
        sequenceCounts[seq] = (sequenceCounts[seq] || 0) + 1;
      });

      const duplicates = Object.entries(sequenceCounts)
        .filter(([seq, count]) => count > 1)
        .map(([seq, count]) => ({ seq: parseInt(seq), count }));

      if (duplicates.length > 0) {
        console.log(`  ❌ Duplicate sequences found:`);
        duplicates.forEach(({ seq, count }) => {
          const dupStudents = yearStudents.filter(s => s.sequence === seq);
          console.log(`     Sequence ${seq} (${count} occurrences):`);
          dupStudents.forEach(s => {
            console.log(`       - ${s.admissionNumber} (${s.student}) - ${s.deletedAt ? 'DELETED' : 'ACTIVE'}`);
          });
        });
      } else {
        console.log(`  ✅ No duplicate sequences`);
      }

      console.log();
    });

    // Check current counter value
    const counter = await prisma.counter.findUnique({
      where: { id: 'student_admission' },
    });

    if (counter) {
      console.log(`🔢 Current counter value: ${counter.value}`);
      console.log(`📈 Next admission number will be: INPS-${new Date().getFullYear()}-${String(counter.value + 1).padStart(3, '0')}`);
    } else {
      console.log("⚠️  Counter not found in database");
    }

    // Check if next number conflicts with existing
    if (counter) {
      const currentYear = new Date().getFullYear().toString();
      const nextSequence = counter.value + 1;
      const conflict = allStudents.find(s => 
        s.admissionNumber === `INPS-${currentYear}-${String(nextSequence).padStart(3, '0')}`
      );

      if (conflict) {
        console.log(`❌ CONFLICT: Next admission number INPS-${currentYear}-${String(nextSequence).padStart(3, '0')} already exists!`);
        console.log(`   Conflicting student: ${conflict.firstName} ${conflict.lastName} (${conflict.status})`);
      } else {
        console.log(`✅ Next admission number is safe to use`);
      }
    }

  } catch (error) {
    console.error("❌ Error checking admission serial:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkAdmissionSerial();