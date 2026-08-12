require("dotenv/config");
const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers, 
            body: JSON.parse(body) 
          });
        } catch (e) {
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers, 
            body: body 
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testParentEndpoints() {
  console.log('🧪 Testing Parent Admin API Endpoints...\n');
  
  const BASE_URL = 'localhost';
  const PORT = process.env.PORT || 3000;
  
  // Test 1: Get all parents
  console.log('1️⃣  Testing GET /api/admin/parents');
  try {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/admin/parents',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real token
      }
    };
    
    const response = await makeRequest(options);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response:`, JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Create a new parent with guardian structure
  console.log('\n2️⃣  Testing POST /api/admin/parents (create parent)');
  try {
    const newParent = {
      accountEmail: 'new.parent@example.com',
      accountPhone: '+2348034567890',
      primaryGuardian: {
        relationship: 'Father',
        title: 'Dr.',
        firstName: 'Robert',
        lastName: 'Smith',
        phone: '+2348034567890',
        email: 'robert.smith@example.com',
        occupation: 'Doctor',
        address: '456 Medical Road, Abuja'
      },
      secondaryGuardian: {
        relationship: 'Mother',
        firstName: 'Sarah',
        lastName: 'Smith',
        phone: '+2348045678901',
        email: 'sarah.smith@example.com',
        occupation: 'Nurse'
      },
      address: '456 Medical Road, Abuja',
      maritalStatus: 'MARRIED'
    };
    
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/admin/parents',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real token
      }
    };
    
    const response = await makeRequest(options, newParent);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response:`, JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 201 && response.body.data) {
      return response.body.data.id; // Return parent ID for next test
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  return null;
}

async function testStudentEndpoints() {
  console.log('\n🧪 Testing Student Admin API Endpoints...\n');
  
  const BASE_URL = 'localhost';
  const PORT = process.env.PORT || 3000;
  
  // Test 1: Get all students
  console.log('1️⃣  Testing GET /api/admin/students');
  try {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/admin/students',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real token
      }
    };
    
    const response = await makeRequest(options);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response:`, JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Create a new student with guardian structure
  console.log('\n2️⃣  Testing POST /api/admin/students (create student)');
  try {
    const newStudent = {
      firstName: 'Emma',
      lastName: 'Johnson',
      middleName: 'Grace',
      gender: 'FEMALE',
      dateOfBirth: '2016-03-20',
      nationality: 'Nigerian',
      state: 'Lagos',
      lga: 'Ikeja',
      religion: 'Christianity',
      bloodGroup: 'A+',
      studentType: 'Day',
      address: '789 School Lane, Lagos',
      admissionDate: '2024-09-01',
      accountEmail: 'emma.parent@example.com',
      accountPhone: '+2348056789012',
      parentData: JSON.stringify({
        primaryGuardian: {
          relationship: 'Father',
          title: 'Mr.',
          firstName: 'David',
          lastName: 'Johnson',
          phone: '+2348056789012',
          email: 'david.johnson@example.com',
          occupation: 'Accountant',
          address: '789 School Lane, Lagos'
        },
        secondaryGuardian: {
          relationship: 'Mother',
          firstName: 'Mary',
          lastName: 'Johnson',
          phone: '+2348067890123',
          email: 'mary.johnson@example.com',
          occupation: 'Banker'
        },
        address: '789 School Lane, Lagos',
        maritalStatus: 'MARRIED'
      })
    };
    
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/admin/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real token
      }
    };
    
    const response = await makeRequest(options, newStudent);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response:`, JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting Admin API Tests...\n');
    
    await testParentEndpoints();
    await testStudentEndpoints();
    
    console.log('\n✅ API Tests Complete');
    console.log('⚠️  Note: These tests require valid authentication tokens');
    console.log('📝 To run with real authentication, update the tokens in the script');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

main();