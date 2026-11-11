/**
 * Test script for subject admin API endpoints
 * Tests the actual HTTP endpoints to verify parameter fixes work correctly
 */

const BASE_URL = 'http://localhost:3000'; // Adjust if your backend runs on different port

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function testSubjectEndpoints() {
  console.log("🧪 Testing Subject Admin API Endpoints\n");

  // Test 1: Get all subjects
  console.log("📋 Test 1: GET /api/admin/subjects");
  const result1 = await apiCall('/api/admin/subjects');
  console.log(`   Status: ${result1.status}`);
  if (result1.data) {
    console.log(`   Success: ${result1.data.success}`);
    if (result1.data.data) {
      console.log(`   Subjects count: ${result1.data.data.length}`);
    }
  } else {
    console.log(`   Error: ${result1.error}`);
  }

  // Test 2: Get subject by ID (using UUID)
  console.log("\n📋 Test 2: GET /api/admin/subjects/{id}");
  if (result1.data && result1.data.data && result1.data.data.length > 0) {
    const subjectId = result1.data.data[0].id;
    const result2 = await apiCall(`/api/admin/subjects/${subjectId}`);
    console.log(`   Subject ID: ${subjectId}`);
    console.log(`   Status: ${result2.status}`);
    if (result2.data) {
      console.log(`   Success: ${result2.data.success}`);
    } else {
      console.log(`   Error: ${result2.error}`);
    }
  }

  // Test 3: Get subject by class
  console.log("\n📋 Test 3: GET /api/admin/subjects/classes/{id}/subjects");
  const result3 = await apiCall('/api/admin/classes');
  if (result3.data && result3.data.data && result3.data.data.length > 0) {
    const classId = result3.data.data[0].id;
    console.log(`   Class ID: ${classId}`);
    const result4 = await apiCall(`/api/admin/subjects/classes/${classId}/subjects?termId=test-term`);
    console.log(`   Status: ${result4.status}`);
    if (result4.data) {
      console.log(`   Success: ${result4.data.success}`);
    } else {
      console.log(`   Error: ${result4.error}`);
    }
  }

  // Test 4: Get subject assignments
  console.log("\n📋 Test 4: GET /api/admin/assignments");
  const result5 = await apiCall('/api/admin/assignments');
  console.log(`   Status: ${result5.status}`);
  if (result5.data) {
    console.log(`   Success: ${result5.data.success}`);
  } else {
    console.log(`   Error: ${result5.error}`);
  }

  // Test 5: Get subjects by teacher
  console.log("\n📋 Test 5: GET /api/admin/assignments/teacher/{teacherId}");
  const result6 = await apiCall('/api/admin/staff');
  if (result6.data && result6.data.data && result6.data.data.length > 0) {
    const teacherId = result6.data.data[0].id;
    console.log(`   Teacher ID: ${teacherId}`);
    const result7 = await apiCall(`/api/admin/assignments/teacher/${teacherId}`);
    console.log(`   Status: ${result7.status}`);
    if (result7.data) {
      console.log(`   Success: ${result7.data.success}`);
    } else {
      console.log(`   Error: ${result7.error}`);
    }
  }

  console.log("\n✅ API endpoint tests completed!");
  console.log("\n💡 Note: For full testing with authentication, you'll need to:");
  console.log("   1. Start the backend server");
  console.log("   2. Get an auth token from login endpoint");
  console.log("   3. Pass the token in the Authorization header");
}

// Run the tests
testSubjectEndpoints().catch(console.error);