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

async function testSimplePost() {
  try {
    console.log("🧪 Getting auth token...");
    const token = await getAuthToken();
    console.log("✅ Got token");

    console.log("🧪 Testing simple POST request to /api/admin/students");
    
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/students",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
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

      req.write(JSON.stringify({ test: "data" }));
      req.end();
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testSimplePost();
