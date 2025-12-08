// Test signup endpoint
const https = require('https');

const data = JSON.stringify({
  email: 'testuser2025@example.com',
  password: 'Test123456',
  displayName: 'Test User 2025'
});

const options = {
  hostname: 'sangatamizh-music-backend.onrender.com',
  port: 443,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing signup...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', body);
    try {
      const json = JSON.parse(body);
      console.log('\n✅ SUCCESS! Signup worked!');
      console.log('User:', json.user);
      console.log('Token received:', json.accessToken ? 'Yes' : 'No');
    } catch (e) {
      console.log('\n❌ FAILED! Response:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
