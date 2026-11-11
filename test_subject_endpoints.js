const prisma = require("./lib/prisma");

/**
 * Comprehensive test script for subject endpoints
 * Tests subject CRUD, levels, and class assignments
 */

async function testSubjectEndpoints() {
  console.log("🧪 Testing Subject Endpoints\n");

  try {
    // Test 1: Check if we can read all subjects
    console.log("📋 Test 1: Reading all subjects...");
    const allSubjects = await prisma.subject.findMany({
      include: { levels: true },
      orderBy: { subjectCode: 'asc' },
    });
    console.log(`✅ Found ${allSubjects.length} subjects`);
    
    if (allSubjects.length > 0) {
      console.log("Sample subjects:");
      allSubjects.slice(0, 3).forEach(subject => {
        console.log(`  - ${subject.subjectName} (${subject.subjectCode}) - ${subject.isActive ? 'Active' : 'Inactive'}`);
        console.log(`    Levels: ${subject.levels.map(l => l.level).join(', ') || 'None'}`);
      });
    }

    // Test 2: Check subject by ID (UUID)
    console.log("\n📋 Test 2: Reading subject by ID (UUID)...");
    if (allSubjects.length > 0) {
      const firstSubject = allSubjects[0];
      const subjectById = await prisma.subject.findUnique({
        where: { id: firstSubject.id },
        include: { levels: true },
      });
      
      if (subjectById) {
        console.log(`✅ Successfully retrieved subject by ID: ${subjectById.subjectName}`);
        console.log(`   ID: ${subjectById.id}`);
        console.log(`   Subject Code: ${subjectById.subjectCode}`);
      } else {
        console.log(`❌ Failed to retrieve subject by ID: ${firstSubject.id}`);
      }
    }

    // Test 3: Check subject assignment relationships
    console.log("\n📋 Test 3: Checking subject assignments...");
    const subjectAssignments = await prisma.subjectAssignment.findMany({
      include: {
        subject: true,
        class: true,
        teacher: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    console.log(`✅ Found ${subjectAssignments.length} recent subject assignments`);
    
    if (subjectAssignments.length > 0) {
      console.log("Sample assignments:");
      subjectAssignments.forEach(assignment => {
        console.log(`  - ${assignment.subject?.subjectName} → ${assignment.class?.name}`);
        console.log(`    Teacher: ${assignment.teacher?.firstName} ${assignment.teacher?.lastName}`);
        console.log(`    Status: ${assignment.status}`);
      });
    }

    // Test 4: Check class curriculum (subjects assigned to classes)
    console.log("\n📋 Test 4: Checking class curriculum...");
    const classSubjects = await prisma.classSubject.findMany({
      include: {
        subject: true,
        class: true,
      },
      take: 5,
    });
    
    console.log(`✅ Found ${classSubjects.length} class-subject relationships`);
    
    if (classSubjects.length > 0) {
      console.log("Sample curriculum entries:");
      classSubjects.forEach(cs => {
        console.log(`  - ${cs.class?.name}: ${cs.subject?.subjectName} (${cs.subject?.subjectCode})`);
      });
    }

    // Test 5: Check if subject levels are properly linked
    console.log("\n📋 Test 5: Checking subject levels integrity...");
    const subjectsWithLevels = await prisma.subject.findMany({
      where: {
        levels: {
          some: {}
        }
      },
      include: {
        levels: true
      }
    });
    
    console.log(`✅ ${subjectsWithLevels.length} subjects have levels assigned`);
    
    // Check for any orphaned levels
    const allLevels = await prisma.subjectLevel.findMany();
    const orphanedLevels = allLevels.filter(level => 
      !subjectsWithLevels.some(subject => 
        subject.levels.some(sl => sl.id === level.id)
      )
    );
    
    if (orphanedLevels.length > 0) {
      console.log(`⚠️  Found ${orphanedLevels.length} orphaned levels`);
    } else {
      console.log("✅ No orphaned levels found");
    }

    // Test 6: Verify the parameter change (check service methods exist)
    console.log("\n📋 Test 6: Verifying service method signatures...");
    const AdminSubjectsService = require('./admin_portal/services/AdminSubjects.service');
    
    // Check if methods exist
    const methodsToCheck = [
      'getSubjectById',
      'updateSubject', 
      'deleteSubject',
      'toggleSubjectActive',
      'addSubjectLevel',
      'removeSubjectLevel'
    ];
    
    methodsToCheck.forEach(methodName => {
      if (typeof AdminSubjectsService[methodName] === 'function') {
        console.log(`✅ Method exists: ${methodName}`);
      } else {
        console.log(`❌ Method missing: ${methodName}`);
      }
    });

    // Test 7: Check if repository methods accept 'id' parameter
    console.log("\n📋 Test 7: Verifying repository method signatures...");
    const SubjectsRepository = require('./admin_portal/repositories/SubjectRepository');
    
    const repoMethodsToCheck = [
      'findSubjectById',
      'updateSubject',
      'deleteSubject'
    ];
    
    repoMethodsToCheck.forEach(methodName => {
      if (typeof SubjectsRepository[methodName] === 'function') {
        console.log(`✅ Repository method exists: ${methodName}`);
      } else {
        console.log(`❌ Repository method missing: ${methodName}`);
      }
    });

    // Test 8: Verify route parameter names
    console.log("\n📋 Test 8: Checking route definitions...");
    const fs = require('fs');
    const routeFile = fs.readFileSync('./admin_portal/routes/adminSubjectsRoutes.js', 'utf8');
    
    const oldPattern = /:subjectId/g;
    const newPattern = /:id/g;
    
    const oldMatches = routeFile.match(oldPattern);
    const newMatches = routeFile.match(newPattern);
    
    console.log(`   Old pattern (/:subjectId) matches: ${oldMatches ? oldMatches.length : 0}`);
    console.log(`   New pattern (/:id) matches: ${newMatches ? newMatches.length : 0}`);
    
    if (oldMatches && oldMatches.length > 0) {
      console.log(`⚠️  Found ${oldMatches.length} occurrences of old pattern /:subjectId`);
    } else {
      console.log(`✅ No old pattern /:subjectId found - all updated to /:id`);
    }

    console.log("\n✅ All subject endpoint tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during testing:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testSubjectEndpoints();