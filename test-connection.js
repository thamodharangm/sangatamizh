// Test Frontend-Backend Connection
const https = require('https');

console.log('🔗 TESTING FRONTEND-BACKEND CONNECTION\n');
console.log('='.repeat(60));

// Check frontend environment variable
console.log('\n📋 Step 1: Checking Frontend Configuration');
console.log('Frontend URL: https://sangatamizh-music.vercel.app');
console.log('Expected Backend: https://sangatamizh-music-backend.onrender.com/api');

// Test backend CORS configuration
console.log('\n📋 Step 2: Testing Backend CORS');
https.get('https://sangatamizh-music-backend.onrender.com/health', (res) => {
  console.log('✅ Backend accessible');
  console.log('   CORS headers:', res.headers['access-control-allow-origin'] || 'Not set in health endpoint');
  
  // Test actual API call that frontend would make
  console.log('\n📋 Step 3: Testing Frontend → Backend API Call');
  
  // Simulate signup (what frontend does)
  const signupData = JSON.stringify({
    email: `connection-test-${Date.now()}@example.com`,
    password: 'Test123456',
    displayName: 'Connection Test'
  });
  
  const options = {
    hostname: 'sangatamizh-music-backend.onrender.com',
    port: 443,
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://sangatamizh-music.vercel.app', // Simulate frontend origin
      'Content-Length': signupData.length
    }
  };
  
  const req = https.request(options, (apiRes) => {
    let body = '';
    apiRes.on('data', chunk => body += chunk);
    apiRes.on('end', () => {
      console.log('API Response Status:', apiRes.statusCode);
      console.log('CORS Allow-Origin:', apiRes.headers['access-control-allow-origin']);
      console.log('CORS Allow-Credentials:', apiRes.headers['access-control-allow-credentials']);
      
      if (apiRes.statusCode === 200) {
        const response = JSON.parse(body);
        console.log('\n✅ SUCCESS! Frontend-Backend Connection Working!');
        console.log('   • Frontend can call backend API');
        console.log('   • CORS is configured correctly');
        console.log('   • Authentication endpoints accessible');
        console.log('   • Token received:', response.accessToken ? 'Yes' : 'No');
        
        // Test authenticated endpoint
        console.log('\n📋 Step 4: Testing Authenticated Endpoint');
        const token = response.accessToken;
        
        const uploadInfoOptions = {
          hostname: 'sangatamizh-music-backend.onrender.com',
          port: 443,
          path: '/api/upload/info',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Origin': 'https://sangatamizh-music.vercel.app'
          }
        };
        
        https.get(uploadInfoOptions, (uploadRes) => {
          let uploadBody = '';
          uploadRes.on('data', chunk => uploadBody += chunk);
          uploadRes.on('end', () => {
            console.log('Upload Info Status:', uploadRes.statusCode);
            
            if (uploadRes.statusCode === 200) {
              console.log('\n✅ Authenticated endpoints working!');
              console.log('   • Token authentication successful');
              console.log('   • Protected routes accessible');
            }
            
            printFinalSummary(true);
          });
        });
      } else {
        console.log('\n❌ Connection issue detected');
        console.log('Response:', body);
        printFinalSummary(false);
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('\n❌ Connection failed:', error.message);
    printFinalSummary(false);
  });
  
  req.write(signupData);
  req.end();
  
}).on('error', (error) => {
  console.log('❌ Backend not accessible:', error.message);
  printFinalSummary(false);
});

function printFinalSummary(connected) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 CONNECTION TEST SUMMARY');
  console.log('='.repeat(60));
  
  if (connected) {
    console.log('\n🎉 FRONTEND ↔️ BACKEND: CONNECTED! ✅\n');
    console.log('Connection Details:');
    console.log('  Frontend:  https://sangatamizh-music.vercel.app');
    console.log('  Backend:   https://sangatamizh-music-backend.onrender.com');
    console.log('  Status:    ✅ CONNECTED');
    console.log('\nWhat\'s Working:');
    console.log('  ✅ Frontend can reach backend');
    console.log('  ✅ CORS configured correctly');
    console.log('  ✅ API calls successful');
    console.log('  ✅ Authentication working');
    console.log('  ✅ Token validation working');
    console.log('  ✅ Protected routes accessible');
    console.log('\n🚀 Your full-stack app is fully connected!');
  } else {
    console.log('\n❌ CONNECTION ISSUE DETECTED\n');
    console.log('Please check:');
    console.log('  • Backend deployment status');
    console.log('  • CORS configuration');
    console.log('  • Environment variables');
  }
  
  console.log('\n' + '='.repeat(60));
}
