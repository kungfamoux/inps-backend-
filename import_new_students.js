const prisma = require('./lib/prisma');
const generateAdmissionNumber = require('./utils/generateAdmissionNumber');
const UserManagementService = require('./shared/services/UserManagementService');
const { sendParentAccountCreationEmail } = require('./utils/resend');

const houses = ['Blue', 'Green', 'Orange', 'Red', 'Yellow'];

function getRandomHouse() {
  return houses[Math.floor(Math.random() * houses.length)];
}

const students = [
  // Primary 5 Blue
  {
    class: 'Primary 5 Blue',
    firstName: 'Chibudom',
    middleName: 'Louis',
    lastName: 'Nnaji',
    gender: 'MALE',
    dateOfBirth: '2016-09-19',
    admissionDate: new Date().toISOString(),
    nationality: 'Nigeria',
    state: 'Enugu',
    lga: 'Nkanu East',
    religion: 'Christian',
    healthInfo: 'None',
    bloodGroup: 'O+',
    studentType: 'DAY',
    sportHouse: getRandomHouse(),
    address: '3 Fidelis Ezelagu Street DCC Qtrs, T/E Enugu',
    parent: {
      accountEmail: 'louisnnaji@gmail.com',
      accountPhone: '07037412901',
      address: '3 Fidelis Ezelagu Street DCC Qtrs, T/E Enugu',
      maritalStatus: 'Married',
      primaryGuardian: {
        relationship: 'Father',
        title: 'Engr',
        fullName: 'Louis Nnaji',
        occupation: 'Business'
      }
    }
  },
  // Primary 2 Yellow
  {
    class: 'Primary 2 Yellow',
    firstName: 'Ifeoma',
    middleName: 'Maris-Stella',
    lastName: 'Anyansi',
    gender: 'FEMALE',
    dateOfBirth: '2018-11-29',
    admissionDate: new Date().toISOString(),
    nationality: 'Nigerian',
    state: 'Anambra',
    lga: 'Njikoka',
    religion: 'Christian',
    healthInfo: 'None',
    bloodGroup: 'O+',
    studentType: 'DAY',
    sportHouse: getRandomHouse(),
    address: '17 Ojoto Crescent Trans Ekulu',
    parent: {
      accountEmail: 'onyonline2007@yahoo.com',
      accountPhone: '08033913293',
      address: '17 Ojoto Crescent Trans Ekulu',
      maritalStatus: 'Married',
      primaryGuardian: {
        relationship: 'Father',
        title: 'MR.',
        fullName: 'Onyebuchi Anyansi',
        occupation: 'Civil Servant'
      }
    }
  },
  {
    class: 'Primary 2 Yellow',
    firstName: 'Okoye',
    middleName: 'Oluebubechukwu',
    lastName: 'Oluebubechukwu Faith',
    gender: 'FEMALE',
    dateOfBirth: '2020-01-03',
    admissionDate: new Date().toISOString(),
    nationality: 'Nigeria',
    state: 'Anambra',
    lga: 'Dunukofia',
    religion: 'Christian',
    healthInfo: 'None',
    bloodGroup: 'O+',
    studentType: 'DAY',
    sportHouse: getRandomHouse(),
    address: 'House 4A Rd 12 Trans-Ekulu',
    residentialAddress: 'House 4A Road 12, Trans-Ekulu',
    parent: {
      accountEmail: 'ametonny_203@gmail.com',
      accountPhone: '08147641921',
      address: 'House 4A Rd 12 Trans-Ekulu',
      maritalStatus: 'Married',
      primaryGuardian: {
        relationship: 'Mother',
        title: 'MRS',
        fullName: 'Mrs Okoye Amaka J.',
        occupation: 'Self Employed'
      }
    }
  },
  {
    class: 'Primary 2 Yellow',
    firstName: 'Esedo',
    middleName: 'Ikenna',
    lastName: 'Ebenezer',
    gender: 'MALE',
    dateOfBirth: '2020-04-10',
    admissionDate: new Date().toISOString(),
    nationality: 'Nigerian',
    state: 'Anambra',
    lga: 'Oji',
    religion: 'Christian',
    healthInfo: 'Healthy',
    bloodGroup: 'O+',
    studentType: 'DAY',
    sportHouse: 'Red',
    address: '173 Medical Road Phase 7/E',
    parent: {
      accountEmail: 'singamenamiy@gmail.com',
      accountPhone: '08034939561',
      address: '173 Medical Road Phase 7/E',
      maritalStatus: 'Married',
      primaryGuardian: {
        relationship: 'Mother',
        title: '',
        fullName: 'Esedo Amaka Maureen',
        occupation: 'Business'
      }
    }
  },
  {
    class: 'Primary 2 Yellow',
    firstName: 'Sopuluchukwu',
    middleName: "God'sglory",
    lastName: 'Anumba',
    gender: 'FEMALE',
    dateOfBirth: '2020-02-27',
    admissionDate: new Date().toISOString(),
    nationality: 'Nigeria',
    state: 'Anambra',
    lga: 'Njikoka',
    religion: 'Christianity',
    healthInfo: 'None',
    bloodGroup: 'O+',
    studentType: 'DAY',
    sportHouse: 'Yellow',
    address: 'Rd 16/3 Trans-Ekulu',
    parent: {
      accountEmail: 'patobyanumba@gmail.com',
      accountPhone: '08096102366',
      address: 'Rd 16/3 Trans-Ekulu',
      maritalStatus: 'Married',
      primaryGuardian: {
        relationship: 'Mother',
        title: '',
        fullName: 'Patricia Anumba',
        occupation: 'Teaching'
      }
    }
  },
  {
    class: 'Primary 2 Yellow',
    firstName: 'Anthony Dominion',
    middleName: 'Dominion',
    lastName: 'Kamsiyochukwu',
    gender: 'MALE',
    dateOfBirth: '2019-07-23',
    admissionDate: new Date().toISOString(),
    nationality: 'Nigeria',
    state: 'Enugu State',
    lga: 'Enugu South',
    religion: 'Christianity',
    healthInfo: 'Healthy',
    bloodGroup: 'O+',
    studentType: 'DAY',
    sportHouse: getRandomHouse(),
    address: 'No 8/42 Hill View Street T/E',
    residentialAddress: 'No 8/42 Hill View Street T/E',
    parent: {
      accountEmail: 'chidinmapriska@gmail.com',
      accountPhone: '08164641100',
      address: 'No 8/42 Hill View Street T/E',
      maritalStatus: 'Married',
      primaryGuardian: {
        relationship: 'Mother',
        title: 'MRS',
        fullName: 'Anthony Chidimma Priska',
        occupation: 'Student'
      }
    }
  }
];

async function importStudents() {
  console.log('Starting student import...\n');

  try {
    const currentSession = await prisma.academicSession.findFirst({
      where: { status: 'CURRENT' }
    });

    const currentTerm = await prisma.academicTerm.findFirst({
      where: {
        sessionId: currentSession.id,
        status: 'CURRENT'
      }
    });

    let successCount = 0;
    let failCount = 0;
    const failed = [];

    for (const studentData of students) {
      try {
        console.log(`Processing: ${studentData.firstName} ${studentData.lastName} (${studentData.class})`);

        // Get class ID
        const classRecord = await prisma.class.findFirst({
          where: { name: studentData.class }
        });

        if (!classRecord) {
          throw new Error(`Class not found: ${studentData.class}`);
        }

        console.log(`  ✓ Class ID: ${classRecord.id}`);

        // Check if parent already exists
        let parent = await prisma.parent.findUnique({
          where: { accountEmail: studentData.parent.accountEmail }
        });

        let parentWasJustCreated = false;

        if (parent) {
          console.log(`  ✓ Parent already exists, linking to existing account`);
        } else {
          // Create parent with Firebase
          parent = await UserManagementService.createParent({
            accountEmail: studentData.parent.accountEmail,
            accountPhone: studentData.parent.accountPhone,
            address: studentData.parent.address,
            maritalStatus: studentData.parent.maritalStatus,
            primaryGuardian: JSON.stringify(studentData.parent.primaryGuardian)
          });
          console.log(`  ✓ Parent created with Firebase`);
          parentWasJustCreated = true;
        }

        // Create student
        const admissionNumber = await generateAdmissionNumber();
        const student = await prisma.student.create({
          data: {
            admissionNumber,
            firstName: studentData.firstName,
            middleName: studentData.middleName,
            lastName: studentData.lastName,
            gender: studentData.gender,
            dateOfBirth: new Date(studentData.dateOfBirth + 'T00:00:00.000Z').toISOString(),
            nationality: studentData.nationality,
            state: studentData.state,
            lga: studentData.lga,
            religion: studentData.religion,
            healthInfo: studentData.healthInfo || 'None',
            bloodGroup: studentData.bloodGroup || 'O+',
            sportHouse: studentData.sportHouse,
            address: studentData.residentialAddress || studentData.address,
            status: 'ACTIVE',
            intakeType: 'CONTINUING',
            studentType: studentData.studentType,
            admissionDate: studentData.admissionDate.includes('T') ? studentData.admissionDate : new Date(studentData.admissionDate + 'T00:00:00.000Z').toISOString(),
            parentId: parent.id
          }
        });

        console.log(`  ✓ Student created: ${admissionNumber}`);

        // Create enrollment
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            classId: classRecord.id,
            academicYear: currentSession.session,
            term: currentTerm.term,
            status: 'ACTIVE'
          }
        });

        console.log(`  ✓ Enrolled in ${studentData.class}`);

        // Send welcome email only for new parents
        if (parentWasJustCreated) {
          await sendParentAccountCreationEmail({
            to: studentData.parent.accountEmail,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            admissionNumber,
            accountEmail: studentData.parent.accountEmail,
            accountPhone: studentData.parent.accountPhone
          });
          console.log(`  ✓ Welcome email sent`);
        } else {
          console.log(`  ✓ Skipped email (parent already exists)`);
        }
        console.log(`  ✅ Success\n`);
        successCount++;

      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}\n`);
        failCount++;
        failed.push({
          name: `${studentData.firstName} ${studentData.lastName}`,
          error: error.message
        });
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total: ${students.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);

    if (failed.length > 0) {
      console.log('\nFailed students:');
      failed.forEach(f => {
        console.log(`  - ${f.name}: ${f.error}`);
      });
    }

  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importStudents()
  .then(() => {
    console.log('\n✅ Import completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
