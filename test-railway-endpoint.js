import https from 'https';

// Update this with your actual Railway URL once you find it
const RAILWAY_URL = process.env.RAILWAY_URL || 'your-service.up.railway.app';
const API_KEY = process.env.API_KEY || 'your-api-key';

async function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null,
        });
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testEndpoints() {
  console.log(`🚀 Testing Railway deployment at: https://${RAILWAY_URL}\n`);
  
  // Test 1: Health check
  console.log('1️⃣ Testing health endpoint...');
  try {
    const health = await makeRequest({
      hostname: RAILWAY_URL,
      path: '/health',
      method: 'GET',
    });
    
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, health.data);
    console.log(`   ✅ Health check ${health.status === 200 ? 'passed' : 'failed'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Test 2: API endpoint without auth
  console.log('2️⃣ Testing API endpoint without auth...');
  try {
    const noAuth = await makeRequest({
      hostname: RAILWAY_URL,
      path: '/api/gas-safe-scrape',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      business_name: 'Test Company',
    });
    
    console.log(`   Status: ${noAuth.status}`);
    console.log(`   Response:`, noAuth.data);
    console.log(`   ${noAuth.status === 401 ? '✅ Auth check working' : '⚠️  No auth required'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Test 3: API endpoint with auth
  if (API_KEY && API_KEY !== 'your-api-key') {
    console.log('3️⃣ Testing API endpoint with auth...');
    try {
      const withAuth = await makeRequest({
        hostname: RAILWAY_URL,
        path: '/api/gas-safe-scrape',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
      }, {
        business_name: 'Test Plumbing Ltd',
      });
      
      console.log(`   Status: ${withAuth.status}`);
      console.log(`   Response:`, withAuth.data);
      console.log(`   ${withAuth.status === 200 ? '✅ API working' : '❌ API error'}\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  } else {
    console.log('3️⃣ Skipping auth test (no API_KEY set)\n');
  }
  
  // Test 4: Check response time
  console.log('4️⃣ Testing response time...');
  const start = Date.now();
  try {
    await makeRequest({
      hostname: RAILWAY_URL,
      path: '/health',
      method: 'GET',
    });
    
    const duration = Date.now() - start;
    console.log(`   Response time: ${duration}ms`);
    console.log(`   ${duration < 1000 ? '✅ Good response time' : '⚠️  Slow response'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
}

// Usage instructions
console.log('📝 Usage:\n');
console.log('1. Find your Railway URL from the dashboard or CLI:');
console.log('   railway domain\n');
console.log('2. Run this test with your URL:');
console.log('   RAILWAY_URL=your-service.up.railway.app node test-railway-endpoint.js\n');
console.log('3. With API key:');
console.log('   RAILWAY_URL=your-service.up.railway.app API_KEY=your-key node test-railway-endpoint.js\n');

if (RAILWAY_URL === 'your-service.up.railway.app') {
  console.log('⚠️  Please set RAILWAY_URL environment variable first!\n');
  process.exit(1);
}

testEndpoints().catch(console.error);