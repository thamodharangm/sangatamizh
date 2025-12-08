// Test Google Drive upload endpoint
const https = require('https');

// First, we need to login to get a token
const loginData = JSON.stringify({
  email: 'testuser2025@example.com',
  password: 'Test123456'
});

const loginOptions = {
  hostname: 'sangatamizh-music-backend.onrender.com',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('1. Logging in...');

const loginReq = https.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.log('❌ Login failed:', body);
      return;
    }
    
    const loginResponse = JSON.parse(body);
    const token = loginResponse.accessToken;
    console.log('✅ Logged in successfully!');
    
    // Now test the upload presign endpoint
    console.log('\n2. Requesting upload URL...');
    
    const uploadOptions = {
      hostname: 'sangatamizh-music-backend.onrender.com',
      port: 443,
      path: '/api/upload/presign?filename=test-song.mp3&contentType=audio/mpeg&fileType=audio&contentLength=1000000',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const uploadReq = https.request(uploadOptions, (uploadRes) => {
      let uploadBody = '';
      uploadRes.on('data', (chunk) => { uploadBody += chunk; });
      
      uploadRes.on('end', () => {
        console.log(`Status: ${uploadRes.statusCode}`);
        
        if (uploadRes.statusCode === 200) {
          const uploadResponse = JSON.parse(uploadBody);
          console.log('\n✅ SUCCESS! Upload endpoint is working!');
          console.log('Upload URL received:', uploadResponse.uploadUrl ? 'Yes' : 'No');
          console.log('File key:', uploadResponse.key);
          console.log('\n🎉 Google Drive integration is working!');
        } else {
          console.log('\n❌ FAILED! Response:', uploadBody);
        }
      });
    });
    
    uploadReq.on('error', (error) => {
      console.error('❌ Error:', error.message);
    });
    
    uploadReq.end();
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Login error:', error.message);
});

loginReq.write(loginData);
loginReq.end();
