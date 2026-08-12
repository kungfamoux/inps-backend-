const http = require('http');

// First login to get a fresh token
const loginData = JSON.stringify({
  email: 'i.inps@yahoo.com',
  password: '08162774990'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/staff/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const loginReq = http.request(loginOptions, (loginRes) => {
  let loginData = '';
  loginRes.on('data', (chunk) => {
    loginData += chunk;
  });
  loginRes.on('end', () => {
    try {
      const loginResponse = JSON.parse(loginData);
      if (loginResponse.data && loginResponse.data.token) {
        const token = loginResponse.data.token;
        
        // Now test the current term API
        const options = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/admin/config/terms/current',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Response:', data);
          });
        });

        req.on('error', (error) => {
          console.error('Error:', error.message);
        });

        req.end();
      }
    } catch (e) {
      console.log('Failed to parse login response');
    }
  });
});

loginReq.on('error', (error) => {
  console.error('Login Error:', error.message);
});

loginReq.write(loginData);
loginReq.end();
