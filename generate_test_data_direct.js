require("dotenv").config();
const prisma = require('./lib/prisma');
const generateAdmissionNumber = require('./utils/generateAdmissionNumber');
const logger = require('./utils/logger');

// Nigerian Names Data
const NIGERIAN_FIRST_NAMES = {
  male: ['Chukwuemeka', 'Emeka', 'Chinedu', 'Obinna', 'Ifeanyi', 'Nnamdi', 'Chibuike', 'Oluwaseun', 'Tunde', 'Femi', 'Kayode', 'Bayo', 'Chima', 'Kelechi', 'Gideon', 'David', 'Michael', 'Peter', 'John', 'Paul', 'Samuel', 'Daniel', 'Gabriel', 'Raphael', 'Christopher', 'Anthony', 'Patrick', 'Matthew', 'Mark', 'Luke', 'Andrew'],
  female: ['Chidinma', 'Chisom', 'Adaeze', 'Ngozi', 'Ifunanya', 'Ijeoma', 'Obianuju', 'Olufunke', 'Tolulope', 'Bolanle', 'Funmilayo', 'Adewunmi', 'Chinyere', 'Chioma', 'Uchechi', 'Grace', 'Esther', 'Victoria', 'Patience', 'Mercy', 'Faith', 'Hope', 'Love', 'Peace', 'Joy', 'Blessing', 'Glory', 'Priscilla', 'Rebecca', 'Sarah']
};

const NIGERIAN_LAST_NAMES = ['Okonkwo', 'Nwachukwu', 'Eze', 'Okafor', 'Okoye', 'Nwosu', 'Ike', 'Obi', 'Eke', 'Okeke', 'Nwankwo', 'Madu', 'Njoku', 'Okoro', 'Okafor', 'Adeyemi', 'Babalola', 'Ogunleye', 'Oladipo', 'Adebiyi', 'Adegoke', 'Adebanjo', 'Ogundipe', 'Oyekanmi', 'Ogunbiyi', 'Adeola', 'Adewale', 'Oladapo', 'Adeosun', 'Ogunwale'];

const NIGERIAN_STATES = ['Lagos', 'Abuja', 'Rivers', 'Enugu', 'Anambra', 'Imo', 'Oyo', 'Ogun', 'Kano', 'Kaduna', 'Delta', 'Edo', 'Akwa Ibom', 'Cross River', 'Plateau', 'Benue', 'Niger', 'Kwara', 'Ondo', 'Ekiti', 'Osun', 'Ogun', 'Bayelsa', 'Sokoto', 'Zamfara', 'Katsina', 'Jigawa', 'Yobe', 'Borno', 'Gombe', 'Bauchi', 'Taraba', 'Nasarawa', 'Kogi', 'Plateau'];

const RELIGIONS = ['Christianity', 'Islam', 'Traditional'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SPORT_HOUSES = ['Red', 'Blue', 'Green', 'Yellow'];
const OCCUPATIONS = ['Teacher', 'Doctor', 'Engineer', 'Lawyer', 'Banker', 'Business Owner', 'Civil Servant', 'Farmer', 'Trader', 'Artist', 'Accountant', 'Architect', 'Nurse', 'Pharmacist', 'Journalist'];

// Utility Functions
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFirebaseUid() {
  return 'firebase_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generatePhoneNumber() {
  return '+234' + getRandomInt(7000000000, 9999999999).toString();
}

function generateEmail(firstName, lastName) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomInt(1, 999)}@gmail.com`;
}

function generateDateOfBirth(minAge, maxAge) {
  const currentYear = new Date().getFullYear();
  const year = currentYear - getRandomInt(minAge, maxAge);
  const month = getRandomInt(1, 12);
  const day = getRandomInt(1, 28);
  return new Date(year, month - 1, day);
}

function generateNigerianName(gender) {
  const firstNames = gender === 'MALE' ? NIGERIAN_FIRST_NAMES.male : NIGERIAN_FIRST_NAMES.female;
  return {
    firstName: getRandomItem(firstNames),
    lastName: getRandomItem(NIGERIAN_LAST_NAMES)
  };
}

// Class Structure
const CLASS_STRUCTURE = [
  { name: "Daycare", ageRange: [2, 3] },
  { name: "Pre-nursery A", ageRange: [3, 4] },
  { name: "Pre-nursery B", ageRange: [3, 4] },
  { name: "Nursery 1A", ageRange: [4, 5] },
  { name: "Nursery 1B", ageRange: [4, 5] },
  { name: "Nursery 2A", ageRange: [5, 6] },
  { name: "Nursery 2B", ageRange: [5, 6] },
  { name: "Nursery 2C", ageRange: [5, 6] },
  { name: "Nursery 3A", ageRange: [6, 7] },
  { name: "Nursery 3B", ageRange: [6, 7] },
  { name: "Nursery 3C", ageRange: [6, 7] },
  { name: "Primary 1 Yellow", ageRange: [7, 8] },
  { name: "Primary 1 Blue", ageRange: [7, 8] },
  { name: "Primary 1 Green", ageRange: [7, 8] },
  { name: "Primary 2 Yellow", ageRange: [8, 9] },
  { name: "Primary 2 Blue", ageRange: [8, 9] },
  { name: "Primary 2 Green", ageRange: [8, 9] },
  { name: "Primary 3 Yellow", ageRange: [9, 10] },
  { name: "Primary 3 Blue", ageRange: [9, 10] },
  { name: "Primary 3 Green", ageRange: [9, 10] },
  { name: "Primary 4 Yellow", ageRange: [10, 11] },
  { name: "Primary 4 Blue", ageRange: [10, 11] },
  { name: "Primary 4 Green", ageRange: [10, 11] },
  { name: "Primary 5 Yellow", ageRange: [11, 12] },
  { name: "Primary 5 Blue", ageRange: [11, 12] },
  { name: "Primary 5 Green", ageRange: [11, 12] },
  { name: "Primary 6 Rainbow", ageRange: [12, 13] },
];

// Main Generation Functions
async function setupAcademicConfiguration() {
  logger.info('Setting up academic configuration...');
  
  let session = await prisma.academicSession.findFirst({
    where: { session: '2026/2027' }
  });
  
  if (!session) {
    logger.info('Creating session 2026/2027');
    session = await prisma.academicSession.create({
      data: {
        session: '2026/2027',
        status: 'ACTIVE'
      }
    });
  } else {
    logger.info(`Found existing session: ${session.id}`);
  }
  
  let term = await prisma.academicTerm.findFirst({
    where: {
      term: 'FIRST_TERM',
      sessionId: session.id
    }
  });
  
  if (!term) {
    logger.info('Creating FIRST_TERM for session');
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 8, 1); // September 1st
    const endDate = new Date(today.getFullYear(), 11, 15); // December 15th
    
    term = await prisma.academicTerm.create({
      data: {
        term: 'FIRST_TERM',
        status: 'ACTIVE',
        startDate,
        endDate,
        sessionId: session.id
      }
    });
  } else {
    logger.info(`Found existing term: ${term.id}`);
  }
  
  // Set up school config
  let config = await prisma.schoolConfig.findUnique({
    where: { id: 'singleton' }
  });
  
  if (!config) {
    logger.info('Creating school config');
    config = await prisma.schoolConfig.create({
      data: {
        id: 'singleton',
        currentSessionId: session.id,
        currentTermId: term.id,
        academicYear: '2026/2027',
        currentTerm: 'FIRST_TERM'
      }
    });
  } else {
    logger.info('Updating school config');
    config = await prisma.schoolConfig.update({
      where: { id: 'singleton' },
      data: {
        currentSessionId: session.id,
        currentTermId: term.id,
        academicYear: '2026/2027',
        currentTerm: 'FIRST_TERM'
      }
    });
  }
  
  return { session, term, config };
}

async function generateParents(count) {
  logger.info(`Generating ${count} parents...`);
  const parents = [];
  
  for (let i = 0; i < count; i++) {
    const fatherName = generateNigerianName('MALE');
    const motherName = generateNigerianName('FEMALE');
    
    const parentData = {
      firebaseUid: generateFirebaseUid(),
      accountEmail: generateEmail(fatherName.firstName, fatherName.lastName),
      accountPhone: generatePhoneNumber(),
      fatherFirstName: fatherName.firstName,
      fatherLastName: fatherName.lastName,
      fatherPhone: generatePhoneNumber(),
      fatherEmail: generateEmail(fatherName.firstName, fatherName.lastName),
      fatherOccupation: getRandomItem(OCCUPATIONS),
      motherFirstName: motherName.firstName,
      motherLastName: motherName.lastName,
      motherPhone: generatePhoneNumber(),
      motherEmail: generateEmail(motherName.firstName, motherName.lastName),
      motherOccupation: getRandomItem(OCCUPATIONS),
      address: `${getRandomInt(1, 100)} ${getRandomItem(NIGERIAN_LAST_NAMES)} Street, ${getRandomItem(NIGERIAN_STATES)}`,
      maritalStatus: getRandomItem(['Married', 'Married', 'Single', 'Divorced', 'Widowed'])
    };
    
    try {
      const parent = await prisma.parent.create({ data: parentData });
      parents.push(parent);
      logger.info(`Created parent ${i + 1}/${count}: ${fatherName.firstName} ${fatherName.lastName}`);
    } catch (error) {
      logger.error(`Failed to create parent ${i + 1}:`, error.message);
    }
  }
  
  return parents;
}

async function generateStudentsAndEnrollments(classes, parents) {
  logger.info('Generating students and enrollments...');
  const students = [];
  let parentIndex = 0;
  
  for (const classInfo of classes) {
    logger.info(`Processing class: ${classInfo.name}`);
    
    // Find age range from CLASS_STRUCTURE based on class name
    const classStructure = CLASS_STRUCTURE.find(c => c.name === classInfo.name);
    const ageRange = classStructure ? classStructure.ageRange : [6, 12]; // Default age range
    
    for (let i = 0; i < 10; i++) {
      // Assign parent (some parents will have multiple children)
      const parent = parents[parentIndex % parents.length];
      
      // 25% chance to reuse parent for next student (siblings)
      if (Math.random() > 0.75) {
        parentIndex++;
      }
      
      const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
      const name = generateNigerianName(gender);
      
      const studentData = {
        admissionNumber: await generateAdmissionNumber(),
        firstName: name.firstName,
        lastName: name.lastName,
        gender: gender,
        dateOfBirth: generateDateOfBirth(ageRange[0], ageRange[1]),
        nationality: 'Nigerian',
        state: getRandomItem(NIGERIAN_STATES),
        lga: getRandomItem(NIGERIAN_STATES),
        religion: getRandomItem(RELIGIONS),
        healthInfo: 'No known allergies',
        sportHouse: getRandomItem(SPORT_HOUSES),
        address: parent.address,
        status: 'ACTIVE',
        intakeType: 'NEW',
        bloodGroup: getRandomItem(BLOOD_GROUPS),
        parentId: parent.id
      };
      
      try {
        const student = await prisma.student.create({ data: studentData });
        students.push(student);
        logger.info(`Created student ${i + 1}/10 for ${classInfo.name}: ${name.firstName} ${name.lastName}`);
        
        // Enroll the student
        const enrollmentData = {
          studentId: student.id,
          classId: classInfo.id,
          academicYear: '2026/2027',
          term: 'FIRST_TERM',
          status: 'ACTIVE'
        };
        
        await prisma.enrollment.create({ data: enrollmentData });
        
        // Update class enrollment count
        await prisma.class.update({
          where: { id: classInfo.id },
          data: { currentEnrollment: { increment: 1 } }
        });
        
        logger.info(`Enrolled ${name.firstName} ${name.lastName} in ${classInfo.name}`);
        
      } catch (error) {
        logger.error(`Failed to create/enroll student:`, error.message);
      }
    }
  }
  
  return students;
}

// Main Execution
async function main() {
  try {
    logger.info('Starting test data generation...');
    
    // Setup academic configuration
    await setupAcademicConfiguration();
    
    // Get classes
    const classes = await prisma.class.findMany({ where: { status: 'ACTIVE' } });
    logger.info(`Found ${classes.length} classes`);
    
    // Generate parents (calculate number of parents needed for 270 students with some having multiple children)
    // For 270 students with ~25% having siblings, we need approximately 220 parents
    const parentCount = 220;
    const parents = await generateParents(parentCount);
    logger.info(`Generated ${parents.length} parents`);
    
    // Generate students and enrollments
    const students = await generateStudentsAndEnrollments(classes, parents);
    logger.info(`Generated ${students.length} students`);
    
    logger.info('Test data generation completed successfully!');
    logger.info(`Summary: ${students.length} students, ${parents.length} parents, ${classes.length} classes`);
    
  } catch (error) {
    logger.error('Test data generation failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
