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

async function testStaffEmailSending() {
  console.log('🧪 Testing Staff Account Creation with Email Sending...\n');
  
  const BASE_URL = 'localhost';
  const PORT = process.env.PORT || 3000;
  
  // Step 1: Login as admin to get token
  console.log('1️⃣  Login as admin...');
  try {
    const loginOptions = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/staff/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const loginData = {
      email: 'i.inps@yahoo.com',
      password: '08162774990'
    };

    const loginResponse = await makeRequest(loginOptions, loginData);
    
    console.log('Login Response Status:', loginResponse.statusCode);
    console.log('Login Response Body:', JSON.stringify(loginResponse.body, null, 2));
    
    if (loginResponse.statusCode !== 200) {
      console.error('❌ Login failed:', loginResponse.body);
      return;
    }

    const token = loginResponse.body.data?.token || loginResponse.body.token;
    if (!token) {
      console.error('❌ No token found in response');
      return;
    }
    console.log('✅ Login successful! Token received.');
    console.log('   Token:', token.substring(0, 50) + '...\n');

    // Step 2: Create staff account with test email
    console.log('2️⃣  Creating staff account with ezejingozi21@gmail.com...');
    
    const createStaffOptions = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/admin/staff',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const staffData = {
      firstName: 'Eze',
      lastName: 'Jingozi',
      email: 'ezejingozi21@gmail.com',
      phone: '08012345678',
      role: 'TEACHER',
      gender: 'MALE',
      dateOfBirth: '1990-01-15',
      address: 'Test Address',
      maritalStatus: 'SINGLE',
      nationality: 'Nigerian',
      state: 'Lagos',
      lga: 'Ikeja',
      religion: 'Christianity',
      qualifications: ['B.Sc Computer Science'],
      yearsOfExperience: 5,
      previousEmployment: 'Previous School',
      dateOfEmployment: '2024-01-01',
      nextOfKinName: 'Next of Kin',
      nextOfKinPhone: '08098765432',
      nextOfKinRelationship: 'Sibling',
      nextOfKinAddress: 'Next of Kin Address'
    };

    const createResponse = await makeRequest(createStaffOptions, staffData);
    
    console.log('Status:', createResponse.statusCode);
    console.log('Response:', JSON.stringify(createResponse.body, null, 2));
    
    if (createResponse.statusCode === 201) {
      console.log('\n✅ Staff account created successfully!');
      console.log('📧 Email should have been sent to ezejingozi21@gmail.com');
      console.log('📧 Check your inbox (and spam folder) for the account creation email.');
    } else {
      console.log('\n❌ Staff account creation failed.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStaffEmailSending();