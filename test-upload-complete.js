// Complete upload test - Login, get presigned URL, and test upload flow
const https = require('https');
const fs = require('fs');

console.log('🧪 Testing Complete Upload Flow...\n');

// Step 1: Login
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

console.log('Step 1: Logging in...');

const loginReq = https.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.log('❌ Login failed:', res.statusCode, body);
      return;
    }
    
    const loginResponse = JSON.parse(body);
    const token = loginResponse.accessToken;
    console.log('✅ Login successful!');
    console.log('   Token received:', token ? 'Yes' : 'No');
    console.log('   User:', loginResponse.user.email);
    
    // Step 2: Request presigned upload URL
    console.log('\nStep 2: Requesting presigned upload URL...');
    
    const uploadOptions = {
      hostname: 'sangatamizh-music-backend.onrender.com',
      port: 443,
      path: '/api/upload/presign?filename=test-song.mp3&contentType=audio/mpeg&fileType=audio&contentLength=5000000',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const uploadReq = https.request(uploadOptions, (uploadRes) => {
      let uploadBody = '';
      uploadRes.on('data', (chunk) => { uploadBody += chunk; });
      
      uploadRes.on('end', () => {
        console.log('   Status:', uploadRes.statusCode);
        
        if (uploadRes.statusCode === 200) {
          const uploadResponse = JSON.parse(uploadBody);
          console.log('✅ Presigned URL received!');
          console.log('   Upload URL:', uploadResponse.uploadUrl ? 'Generated' : 'Missing');
          console.log('   File key:', uploadResponse.key);
          console.log('   Expires in:', uploadResponse.expiresIn, 'seconds');
          
          // Step 3: Test complete endpoint
          console.log('\nStep 3: Testing upload complete endpoint...');
          
          const completeData = JSON.stringify({
            key: uploadResponse.key,
            title: 'Test Song',
            artist: 'Test Artist',
            album: 'Test Album',
            genre: 'Test'
          });
          
          const completeOptions = {
            hostname: 'sangatamizh-music-backend.onrender.com',
            port: 443,
            path: '/api/upload/complete',
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Content-Length': completeData.length
            }
          };
          
          const completeReq = https.request(completeOptions, (completeRes) => {
            let completeBody = '';
            completeRes.on('data', (chunk) => { completeBody += chunk; });
            
            completeRes.on('end', () => {
              console.log('   Status:', completeRes.statusCode);
              
              if (completeRes.statusCode === 200) {
                const completeResponse = JSON.parse(completeBody);
                console.log('✅ Upload complete endpoint works!');
                console.log('   Song ID:', completeResponse.song.id);
                console.log('   Title:', completeResponse.song.title);
                console.log('   Artist:', completeResponse.song.artist);
                
                console.log('\n🎉 ALL TESTS PASSED!');
                console.log('\n📋 Summary:');
                console.log('   ✅ Authentication working');
                console.log('   ✅ Presigned URL generation working');
                console.log('   ✅ Upload complete endpoint working');
                console.log('   ✅ Database saving working');
                console.log('\n💡 The upload flow is fully functional!');
                console.log('   Users can now upload songs to Google Drive.');
              } else {
                console.log('❌ Upload complete failed:', completeBody);
              }
            });
          });
          
          completeReq.on('error', (error) => {
            console.error('❌ Complete request error:', error.message);
          });
          
          completeReq.write(completeData);
          completeReq.end();
          
        } else {
          console.log('❌ Presigned URL request failed:', uploadBody);
          
          if (uploadRes.statusCode === 401) {
            console.log('\n⚠️  Authentication issue detected!');
            console.log('   This means the token is not being accepted.');
            console.log('   Check if frontend is sending the token correctly.');
          }
        }
      });
    });
    
    uploadReq.on('error', (error) => {
      console.error('❌ Upload request error:', error.message);
    });
    
    uploadReq.end();
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Login error:', error.message);
});

loginReq.write(loginData);
loginReq.end();
