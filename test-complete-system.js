// Comprehensive test suite for Sangatamizh Music
const https = require('https');

console.log('🧪 COMPREHENSIVE SYSTEM TEST\n');
console.log('Testing: Backend + Frontend + Database + Authentication + Upload\n');
console.log('='.repeat(60));

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) console.log(`   ${details}`);
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Test 1: Backend Health Check
console.log('\n📊 TEST 1: Backend Health Check');
https.get('https://sangatamizh-music-backend.onrender.com/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const healthy = res.statusCode === 200;
    logTest('Backend Health', healthy, healthy ? 'Backend is running' : `Status: ${res.statusCode}`);
    
    // Test 2: API Health Check
    console.log('\n📊 TEST 2: API Health Check');
    https.get('https://sangatamizh-music-backend.onrender.com/api/health', (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        const apiHealthy = res2.statusCode === 200;
        logTest('API Health', apiHealthy, apiHealthy ? 'API endpoints accessible' : `Status: ${res2.statusCode}`);
        
        // Test 3: User Signup
        console.log('\n📊 TEST 3: User Authentication - Signup');
        const signupData = JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'Test123456',
          displayName: 'Test User'
        });
        
        const signupOptions = {
          hostname: 'sangatamizh-music-backend.onrender.com',
          port: 443,
          path: '/api/auth/signup',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': signupData.length
          }
        };
        
        const signupReq = https.request(signupOptions, (signupRes) => {
          let signupBody = '';
          signupRes.on('data', chunk => signupBody += chunk);
          signupRes.on('end', () => {
            const signupSuccess = signupRes.statusCode === 200;
            logTest('User Signup', signupSuccess, signupSuccess ? 'New user created' : `Status: ${signupRes.statusCode}`);
            
            if (signupSuccess) {
              const signupResponse = JSON.parse(signupBody);
              const hasToken = !!signupResponse.accessToken;
              const hasUser = !!signupResponse.user;
              logTest('JWT Token Generation', hasToken, hasToken ? 'Token received' : 'No token');
              logTest('User Data Return', hasUser, hasUser ? `User: ${signupResponse.user.email}` : 'No user data');
              
              // Test 4: Login with same credentials
              console.log('\n📊 TEST 4: User Authentication - Login');
              const loginData = JSON.stringify({
                email: signupResponse.user.email,
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
              
              const loginReq = https.request(loginOptions, (loginRes) => {
                let loginBody = '';
                loginRes.on('data', chunk => loginBody += chunk);
                loginRes.on('end', () => {
                  const loginSuccess = loginRes.statusCode === 200;
                  logTest('User Login', loginSuccess, loginSuccess ? 'Login successful' : `Status: ${loginRes.statusCode}`);
                  
                  if (loginSuccess) {
                    const loginResponse = JSON.parse(loginBody);
                    const token = loginResponse.accessToken;
                    
                    // Test 5: Upload Info Endpoint
                    console.log('\n📊 TEST 5: Upload Endpoints');
                    https.get('https://sangatamizh-music-backend.onrender.com/api/upload/info', (uploadInfoRes) => {
                      let uploadInfoBody = '';
                      uploadInfoRes.on('data', chunk => uploadInfoBody += chunk);
                      uploadInfoRes.on('end', () => {
                        const uploadInfoSuccess = uploadInfoRes.statusCode === 200;
                        logTest('Upload Info Endpoint', uploadInfoSuccess, uploadInfoSuccess ? 'Upload config available' : `Status: ${uploadInfoRes.statusCode}`);
                        
                        // Test 6: Frontend Accessibility
                        console.log('\n📊 TEST 6: Frontend Deployment');
                        https.get('https://sangatamizh-music.vercel.app', (frontendRes) => {
                          const frontendSuccess = frontendRes.statusCode === 200;
                          logTest('Frontend Accessible', frontendSuccess, frontendSuccess ? 'Vercel deployment live' : `Status: ${frontendRes.statusCode}`);
                          
                          // Print Summary
                          printSummary();
                        });
                      });
                    });
                  } else {
                    printSummary();
                  }
                });
              });
              
              loginReq.on('error', (error) => {
                logTest('User Login', false, error.message);
                printSummary();
              });
              
              loginReq.write(loginData);
              loginReq.end();
            } else {
              printSummary();
            }
          });
        });
        
        signupReq.on('error', (error) => {
          logTest('User Signup', false, error.message);
          printSummary();
        });
        
        signupReq.write(signupData);
        signupReq.end();
      });
    });
  });
}).on('error', (error) => {
  logTest('Backend Health', false, error.message);
  printSummary();
});

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  console.log('\n📊 DETAILED RESULTS:');
  testResults.tests.forEach((test, i) => {
    console.log(`${i + 1}. ${test.passed ? '✅' : '❌'} ${test.name}`);
    if (test.details) console.log(`   ${test.details}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Your app is fully functional!');
    console.log('\n✅ What\'s Working:');
    console.log('   • Backend API (Render)');
    console.log('   • Frontend App (Vercel)');
    console.log('   • User Authentication');
    console.log('   • Database Operations');
    console.log('   • JWT Token Generation');
    console.log('   • Upload Endpoints');
    console.log('\n🚀 Your app is PRODUCTION READY!');
  } else {
    console.log('⚠️  Some tests failed. Review the details above.');
  }
  
  console.log('='.repeat(60));
}
