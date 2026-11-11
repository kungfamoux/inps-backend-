require("dotenv").config();
const http = require("http");
const FormData = require("form-data");

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = "echika911@gmail.com";
const ADMIN_PHONE = "08152622017";

// Student data templates
const students = [
  {
    firstName: "John",
    lastName: "Doe",
    middleName: "Michael",
    gender: "MALE",
    dateOfBirth: "2015-03-15",
    nationality: "Nigerian",
    state: "Lagos",
    lga: "Ikeja",
    religion: "Christianity",
    healthInfo: "No known allergies",
    bloodGroup: "O+",
    sportHouse: "YELLOW",
    address: "123 Main Street, Lagos",
    intakeType: "NEW",
    studentType: "BOARDING",
    admissionDate: "2026-09-01",
    accountEmail: "parent1@example.com",
    accountPhone: "08012345678",
    parentData: JSON.stringify({
      relationship: "FATHER",
      title: "Mr",
      firstName: "James",
      lastName: "Doe",
      phone: "08012345678",
      email: "parent1@example.com",
      occupation: "Engineer",
      address: "123 Main Street, Lagos"
    })
  },
  {
    firstName: "Mary",
    lastName: "Smith",
    middleName: "Jane",
    gender: "FEMALE",
    dateOfBirth: "2016-07-20",
    nationality: "Nigerian",
    state: "Lagos",
    lga: "Alimosho",
    religion: "Christianity",
    healthInfo: "No known allergies",
    bloodGroup: "A+",
    sportHouse: "BLUE",
    address: "456 Oak Avenue, Lagos",
    intakeType: "NEW",
    studentType: "DAY",
    admissionDate: "2026-09-01",
    accountEmail: "parent2@example.com",
    accountPhone: "08087654321",
    parentData: JSON.stringify({
      relationship: "MOTHER",
      title: "Mrs",
      firstName: "Sarah",
      lastName: "Smith",
      phone: "08087654321",
      email: "parent2@example.com",
      occupation: "Teacher",
      address: "456 Oak Avenue, Lagos"
    })
  }
];

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function getAuthToken() {
  try {
    console.log("🔐 Getting authentication token...");

    const password = ADMIN_PHONE.replace(/\D/g, '');

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/staff/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    };

    const response = await makeRequest(options, {
      email: ADMIN_EMAIL,
      password: password
    });

    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.status}`);
    }

    console.log("✅ Authentication successful");
    return response.data.token;
  } catch (error) {
    console.error("❌ Error getting auth token:", error.message);
    throw error;
  }
}

async function getClasses(token) {
  try {
    console.log("📚 Fetching available classes...");

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/classes",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    };

    const response = await makeRequest(options);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch classes: ${response.status}`);
    }

    console.log(`✅ Found ${response.data.data.length} classes`);
    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching classes:", error.message);
    throw error;
  }
}

async function createStudent(token, studentData, classId) {
  try {
    console.log(`📝 Creating student: ${studentData.firstName} ${studentData.lastName}...`);

    // Use FormData for multipart/form-data
    const form = new FormData();
    
    // Add all student fields
    Object.keys(studentData).forEach(key => {
      form.append(key, studentData[key]);
    });
    
    // Add classId (required field)
    form.append("classId", classId);

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/students",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        ...form.getHeaders()
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
          try {
            const response = JSON.parse(body);
            if (res.statusCode !== 201) {
              console.error(`❌ Failed to create student: ${res.statusCode}`);
              console.error("Error details:", JSON.stringify(response, null, 2));
              console.error("Full response:", JSON.stringify({ status: res.statusCode, data: response }, null, 2));
              resolve({ success: false, error: response });
            } else {
              console.log(`✅ Student created successfully`);
              console.log(`   Admission Number: ${response.data.admissionNumber}`);
              console.log(`   Name: ${response.data.firstName} ${response.data.lastName}`);
              resolve({ success: true, data: response.data });
            }
          } catch (e) {
            console.error(`❌ Failed to parse response: ${e.message}`);
            console.error("Raw response:", body);
            resolve({ success: false, error: { message: "Failed to parse response", raw: body } });
          }
        });
      });

      req.on("error", (error) => {
        console.error("❌ Error creating student:", error.message);
        console.error("Error stack:", error.stack);
        resolve({ success: false, error: error.message });
      });

      form.pipe(req);
    });
  } catch (error) {
    console.error("❌ Error creating student:", error.message);
    console.error("Error stack:", error.stack);
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    console.log("🚀 Starting student creation test script");
    console.log(`📧 Admin Email: ${ADMIN_EMAIL}`);
    console.log(`📱 Admin Phone: ${ADMIN_PHONE}`);
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
    console.log("");

    // Get authentication token
    const token = await getAuthToken();
    console.log("");

    // Get available classes
    const classes = await getClasses(token);
    console.log("");

    if (classes.length === 0) {
      console.error("❌ No classes available. Please create a class first.");
      process.exit(1);
    }

    // Use the first available class
    const selectedClass = classes[0];
    console.log(`📋 Using class: ${selectedClass.name} (ID: ${selectedClass.id})`);
    console.log("");

    // Create students
    const results = [];
    for (const student of students) {
      const result = await createStudent(token, student, selectedClass.id);
      results.push(result);
      console.log("");
    }

    // Summary
    console.log("📊 Summary:");
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log("\n❌ Some student creations failed. Check the error details above.");
      process.exit(1);
    }

    console.log("\n✅ All students created successfully!");

  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

main();
