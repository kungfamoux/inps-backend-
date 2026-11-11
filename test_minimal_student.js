require("dotenv").config();
const http = require("http");

async function getAuthToken() {
  const ADMIN_EMAIL = "echika911@gmail.com";
  const ADMIN_PHONE = "08152622017";
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

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          resolve(response.token);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(JSON.stringify({ email: ADMIN_EMAIL, password }));
    req.end();
  });
}

async function getClasses(token) {
  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/admin/classes",
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          resolve(response.data[0].id);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function testStudentCreation() {
  try {
    console.log("🧪 Getting auth token...");
    const token = await getAuthToken();
    console.log("✅ Got token");

    console.log("🧪 Getting class ID...");
    const classId = await getClasses(token);
    console.log(`✅ Got class ID: ${classId}`);

    console.log("🧪 Testing student creation with minimal data (skipping file upload)");
    
    // Create a manual multipart/form-data boundary request
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const formData = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="firstName"`,
      ``,
      `Test`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="lastName"`,
      ``,
      `Student`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="gender"`,
      ``,
      `MALE`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="dateOfBirth"`,
      ``,
      `2015-01-01`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="admissionDate"`,
      ``,
      `2026-09-01`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="accountEmail"`,
      ``,
      `test@example.com`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="accountPhone"`,
      ``,
      `08012345678`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="parentData"`,
      ``,
      JSON.stringify({
        relationship: "FATHER",
        title: "Mr",
        firstName: "Test",
        lastName: "Parent",
        phone: "08012345678",
        email: "test@example.com",
        occupation: "Engineer",
        address: "Test Address"
      }),
      `--${boundary}`,
      `Content-Disposition: form-data; name="classId"`,
      ``,
      classId,
      `--${boundary}--`,
      ``
    ].join('\r\n');

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/students",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": Buffer.byteLength(formData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
          console.log(`Response status: ${res.status}`);
          console.log(`Response body: ${body}`);
          resolve({ status: res.status, body });
        });
      });

      req.on("error", (error) => {
        console.error("Request error:", error.message);
        reject(error);
      });

      req.write(formData);
      req.end();
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testStudentCreation();
