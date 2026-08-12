require("dotenv").config();
const prisma = require("./lib/prisma");
const AuthRepository = require("./shared/repositories/AuthRepository");
const generateAdmissionNumber = require("./utils/generateAdmissionNumber");
const logger = require("./utils/logger");

// Sample data for realistic test data
const FIRST_NAMES = ['Chinedu', 'Ngozi', 'Emeka', 'Adaeze', 'Obinna', 'Chisom', 'Oluwaseun', 'Fatima', 'Ifeanyi', 'Chinedu', 'Oluwafemi', 'Amina', 'Chukwuemeka', 'Adaeze', 'Oluwatosin', 'Chioma', 'Ibrahim', 'Nkemakolam', 'Olamide', 'Rukayat'];
const LAST_NAMES = ['Okonkwo', 'Nwosu', 'Eze', 'Okafor', 'Ikechukwu', 'Okoro', 'Okafor', 'Adebayo', 'Yusuf', 'Nnamdi', 'Bello', 'Ogbonna', 'Okonkwo', 'Nwankwo', 'Adeyemi', 'Okeke', 'Ibrahim', 'Eze', 'Sullivan', 'Rahman'];
const RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandparent'];
const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Chief', 'Engr.', 'Pastor', 'Imam'];
const OCCUPATIONS = ['Teacher', 'Doctor', 'Engineer', 'Business Owner', 'Civil Servant', 'Banker', 'Lawyer', 'Farmer', 'Trader', 'Nurse'];
const MARITAL_STATUSES = ['MARRIED', 'SINGLE', 'DIVORCED', 'WIDOWED', 'SEPARATED'];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDateOfBirth(minAge, maxAge) {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - Math.floor(Math.random() * (maxAge - minAge + 1)) - minAge;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, month - 1, day);
}

async function setupAcademicSession() {
  try {
    console.log('🎓 Setting up academic session 2026/2027...\n');

    // Create or update academic session
    const session = await prisma.academicSession.upsert({
      where: { session: '2026/2027' },
      update: { status: 'UPCOMING' },
      create: {
        session: '2026/2027',
        status: 'UPCOMING',
      }
    });

    console.log(`✅ Academic session set: ${session.session} (${session.status})`);

    // Deactivate all terms for this session
    await prisma.academicTerm.updateMany({
      where: { sessionId: session.id },
      data: { status: 'COMPLETED' }
    });

    // Create or update First Term
    const term = await prisma.academicTerm.upsert({
      where: {
        sessionId_term: {
          sessionId: session.id,
          term: 'FIRST_TERM'
        }
      },
      update: { 
        status: 'UPCOMING',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-12-15')
      },
      create: {
        sessionId: session.id,
        term: 'FIRST_TERM',
        status: 'UPCOMING',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-12-15')
      }
    });

    console.log(`✅ Term set: ${term.term} (${term.status})`);
    console.log(`   Start Date: ${term.startDate.toISOString().split('T')[0]}`);
    console.log(`   End Date: ${term.endDate.toISOString().split('T')[0]}`);

    // Update school config
    await prisma.schoolConfig.upsert({
      where: { id: 'singleton' },
      update: {
        currentSessionId: session.id,
        currentTermId: term.id,
        academicYear: session.session,
        currentTerm: 'FIRST_TERM'
      },
      create: {
        id: 'singleton',
        currentSessionId: session.id,
        currentTermId: term.id,
        academicYear: session.session,
        currentTerm: 'FIRST_TERM'
      }
    });

    console.log('✅ School configuration updated\n');

    return { session, term };

  } catch (error) {
    console.error('❌ Error setting up academic session:', error);
    throw error;
  }
}

async function createClasses() {
  try {
    console.log('📚 Creating classes...\n');

    const classData = [
      { name: 'Daycare', color: 'YELLOW' },
      { name: 'Pre-nursery A', color: 'BLUE' },
      { name: 'Pre-nursery B', color: 'GREEN' },
      { name: 'Nursery 1A', color: 'RAINBOW' },
      { name: 'Nursery 1B', color: 'YELLOW' },
      { name: 'Nursery 2A', color: 'BLUE' },
      { name: 'Nursery 2B', color: 'GREEN' },
      { name: 'Nursery 2C', color: 'RAINBOW' },
      { name: 'Nursery 3A', color: 'YELLOW' },
      { name: 'Nursery 3B', color: 'BLUE' },
      { name: 'Nursery 3C', color: 'GREEN' },
      { name: 'Primary 1 Yellow', color: 'YELLOW' },
      { name: 'Primary 1 Blue', color: 'BLUE' },
      { name: 'Primary 1 Green', color: 'GREEN' },
      { name: 'Primary 2 Yellow', color: 'YELLOW' },
      { name: 'Primary 2 Blue', color: 'BLUE' },
      { name: 'Primary 2 Green', color: 'GREEN' },
      { name: 'Primary 3 Yellow', color: 'YELLOW' },
      { name: 'Primary 3 Blue', color: 'BLUE' },
      { name: 'Primary 3 Green', color: 'GREEN' },
      { name: 'Primary 4 Yellow', color: 'YELLOW' },
      { name: 'Primary 4 Blue', color: 'BLUE' },
      { name: 'Primary 4 Green', color: 'GREEN' },
      { name: 'Primary 5 Yellow', color: 'YELLOW' },
      { name: 'Primary 5 Blue', color: 'BLUE' },
      { name: 'Primary 5 Green', color: 'GREEN' },
      { name: 'Primary 6 Rainbow', color: 'RAINBOW' },
    ];

    const createdClasses = [];
    for (const cls of classData) {
      const existingClass = await prisma.class.findFirst({
        where: { name: cls.name }
      });

      if (!existingClass) {
        const newClass = await prisma.class.create({
          data: {
            name: cls.name,
            color: cls.color,
            status: 'ACTIVE',
            currentEnrollment: 0
          }
        });
        createdClasses.push(newClass);
        console.log(`✅ Created class: ${cls.name}`);
      } else {
        createdClasses.push(existingClass);
        console.log(`ℹ️  Class already exists: ${cls.name}`);
      }
    }

    console.log(`\n✅ Created ${createdClasses.length} classes\n`);
    return createdClasses;

  } catch (error) {
    console.error('❌ Error creating classes:', error);
    throw error;
  }
}

async function createParent(index) {
  try {
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);
    const relationship = getRandomItem(RELATIONSHIPS);
    const title = getRandomItem(TITLES);
    const occupation = getRandomItem(OCCUPATIONS);
    const maritalStatus = getRandomItem(MARITAL_STATUSES);
    
    // Generate unique phone and email to avoid duplicates
    const phone = `+2348${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 13);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${Date.now()}.test`;

    let firebaseUser;
    try {
      firebaseUser = await AuthRepository.createFirebaseUser(email, phone);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        // Generate new unique email if already exists
        const newEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}${Date.now()}@test.local`;
        firebaseUser = await AuthRepository.createFirebaseUser(newEmail, phone);
      } else {
        throw error;
      }
    }

    // Check if parent already exists with this Firebase UID
    const existingParent = await prisma.parent.findFirst({
      where: { firebaseUid: firebaseUser.uid }
    });

    if (existingParent) {
      console.log(`ℹ️  Parent already exists: ${firstName} ${lastName} (${email})`);
      return existingParent;
    }

    const parent = await prisma.parent.create({
      data: {
        firebaseUid: firebaseUser.uid,
        accountEmail: email,
        accountPhone: phone,
        primaryGuardian: JSON.stringify({
          relationship: relationship,
          title: title,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          email: email,
          occupation: occupation,
          address: `${Math.floor(Math.random() * 100) + 1} ${getRandomItem(LAST_NAMES)} Street, Lagos`
        }),
        secondaryGuardian: Math.random() > 0.3 ? JSON.stringify({
          relationship: 'Mother',
          firstName: getRandomItem(FIRST_NAMES),
          lastName: lastName,
          phone: `+2348${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 13),
          email: `${getRandomItem(FIRST_NAMES).toLowerCase()}.${lastName.toLowerCase()}@test.local`,
          occupation: getRandomItem(OCCUPATIONS)
        }) : null,
        address: `${Math.floor(Math.random() * 100) + 1} ${getRandomItem(LAST_NAMES)} Street, Lagos`,
        maritalStatus: maritalStatus
      }
    });

    console.log(`✅ Parent ${index + 1} created: ${firstName} ${lastName} (${email})`);
    return parent;

  } catch (error) {
    console.error(`❌ Error creating parent ${index + 1}:`, error.message);
    return null;
  }
}

async function createStudent(parent, classInfo, index) {
  try {
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = parent.primaryGuardian ? JSON.parse(parent.primaryGuardian).lastName : getRandomItem(LAST_NAMES);
    const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
    const dob = getRandomDateOfBirth(3, 12); // Students aged 3-12

    const student = await prisma.student.create({
      data: {
        admissionNumber: await generateAdmissionNumber(prisma),
        firstName: firstName,
        lastName: lastName,
        middleName: Math.random() > 0.5 ? getRandomItem(FIRST_NAMES) : null,
        gender: gender,
        dateOfBirth: dob,
        nationality: 'Nigerian',
        state: 'Lagos',
        lga: 'Ikeja',
        religion: 'Christianity',
        bloodGroup: getRandomItem(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
        studentType: 'Day',
        address: parent.address,
        status: 'ACTIVE',
        intakeType: 'NEW',
        admissionDate: new Date('2026-09-01'),
        parentId: parent.id
      }
    });

    console.log(`✅ Student created: ${firstName} ${lastName} (${student.admissionNumber})`);
    return student;

  } catch (error) {
    console.error(`❌ Error creating student:`, error.message);
    return null;
  }
}

async function createEnrollment(student, classInfo, term) {
  try {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classId: classInfo.id,
        academicYear: '2026/2027',
        term: 'FIRST_TERM',
        status: 'ACTIVE'
      }
    });

    console.log(`✅ Enrolled ${student.admissionNumber} in ${classInfo.name}`);

  } catch (error) {
    console.error(`❌ Error enrolling student:`, error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive student and parent setup...\n');

    // Setup academic session
    const { session, term } = await setupAcademicSession();

    // Create classes
    const classes = await createClasses();

    console.log(`\n📚 Found ${classes.length} classes:`);
    classes.forEach(cls => console.log(`   - ${cls.name}`));

    // Create parents (fewer parents than students to allow multiple children per parent)
    const totalClasses = classes.length;
    const studentsPerClass = 10;
    const totalStudents = totalClasses * studentsPerClass;
    const totalParents = Math.ceil(totalStudents / 2); // Average 2 children per parent

    console.log(`\n👨‍👩‍👧 Creating ${totalParents} parents for ${totalStudents} students...\n`);

    const parents = [];
    for (let i = 0; i < totalParents; i++) {
      const parent = await createParent(i);
      if (parent) parents.push(parent);
    }

    console.log(`\n🎓 Creating ${studentsPerClass} students per class...\n`);

    let studentCount = 0;
    for (const classInfo of classes) {
      console.log(`\n📚 Class: ${classInfo.name}`);
      
      for (let i = 0; i < studentsPerClass; i++) {
        // Assign random parent (some parents will have multiple children)
        const parent = parents[Math.floor(Math.random() * parents.length)];
        
        const student = await createStudent(parent, classInfo, i);
        if (student) {
          await createEnrollment(student, classInfo, term);
          studentCount++;
        }
      }
    }

    console.log(`\n🎉 Setup complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Academic Session: 2026/2027 (First Term)`);
    console.log(`   - Classes: ${classes.length}`);
    console.log(`   - Parents Created: ${parents.length}`);
    console.log(`   - Students Created: ${studentCount}`);
    console.log(`   - Enrollments Created: ${studentCount}`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();