import https from 'https';
import http from 'http';

// Common Railway URL patterns to test
const railwayPatterns = [
  // Standard Railway patterns
  'gas-safe-puppeteer-service.up.railway.app',
  'gas-safe-puppeteer-service-production.up.railway.app',
  'puppeteer-service.up.railway.app',
  'puppeteer-service-production.up.railway.app',
  
  // With project prefix (common pattern)
  'tradepro-gas-safe-puppeteer-service.up.railway.app',
  'tradepro-puppeteer-service.up.railway.app',
  
  // With random suffix (Railway sometimes adds these)
  'gas-safe-puppeteer-service-production-[a-z0-9]{4}.up.railway.app',
  
  // Legacy patterns
  'gas-safe-puppeteer-service.railway.app',
  'puppeteer-service.railway.app',
];

// Test endpoints
const endpoints = [
  { path: '/health', method: 'GET', expectedStatus: 200 },
  { path: '/', method: 'GET', expectedStatus: [200, 404] },
  { path: '/api/gas-safe-scrape', method: 'POST', expectedStatus: [400, 401] }, // Should return 400 without body or 401 without API key
];

async function testUrl(hostname, endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      path: endpoint.path,
      method: endpoint.method,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Railway-Deployment-Checker/1.0',
      },
    };

    const protocol = hostname.includes('localhost') ? http : https;
    
    console.log(`\n🔍 Testing ${endpoint.method} ${hostname}${endpoint.path}`);
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
          ? endpoint.expectedStatus 
          : [endpoint.expectedStatus];
          
        const success = expectedStatuses.includes(res.statusCode);
        
        console.log(`   Status: ${res.statusCode} ${success ? '✅' : '❌'}`);
        console.log(`   Headers:`, JSON.stringify(res.headers, null, 2));
        
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`   Response:`, JSON.stringify(parsed, null, 2));
          } catch {
            console.log(`   Response (text):`, data.substring(0, 200));
          }
        }
        
        resolve({
          hostname,
          endpoint: endpoint.path,
          status: res.statusCode,
          success,
          headers: res.headers,
          data,
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve({
        hostname,
        endpoint: endpoint.path,
        error: error.message,
        success: false,
      });
    });
    
    req.on('timeout', () => {
      console.log(`   ⏱️  Timeout after 10s`);
      req.destroy();
      resolve({
        hostname,
        endpoint: endpoint.path,
        error: 'Timeout',
        success: false,
      });
    });
    
    if (endpoint.method === 'POST') {
      req.write(JSON.stringify({}));
    }
    
    req.end();
  });
}

async function checkDNS(hostname) {
  const { promises: dns } = await import('dns');
  
  try {
    const addresses = await dns.resolve4(hostname);
    console.log(`✅ DNS resolves to: ${addresses.join(', ')}`);
    return true;
  } catch (error) {
    console.log(`❌ DNS resolution failed: ${error.message}`);
    return false;
  }
}

async function checkAllUrls() {
  console.log('🚀 Checking Railway deployment URLs...\n');
  
  const results = {
    working: [],
    notFound: [],
    errors: [],
  };
  
  // First, let's check if we can find the actual deployment URL
  console.log('📋 Checking common Railway URL patterns:\n');
  
  for (const pattern of railwayPatterns) {
    // Skip regex patterns for now
    if (pattern.includes('[')) {
      console.log(`⏭️  Skipping regex pattern: ${pattern}`);
      continue;
    }
    
    console.log(`\n🌐 Checking: https://${pattern}`);
    
    // Check DNS first
    const dnsResolves = await checkDNS(pattern);
    
    if (dnsResolves) {
      // Test health endpoint first
      const healthResult = await testUrl(pattern, endpoints[0]);
      
      if (healthResult.success) {
        results.working.push(pattern);
        
        // Test other endpoints
        for (let i = 1; i < endpoints.length; i++) {
          await testUrl(pattern, endpoints[i]);
        }
      } else if (healthResult.status === 404) {
        results.notFound.push(pattern);
      } else {
        results.errors.push({ url: pattern, error: healthResult.error || `Status ${healthResult.status}` });
      }
    } else {
      results.errors.push({ url: pattern, error: 'DNS not found' });
    }
  }
  
  // Summary
  console.log('\n\n📊 Summary:\n');
  
  if (results.working.length > 0) {
    console.log('✅ Working URLs:');
    results.working.forEach(url => console.log(`   - https://${url}`));
  }
  
  if (results.notFound.length > 0) {
    console.log('\n🔍 URLs that resolve but return 404:');
    results.notFound.forEach(url => console.log(`   - https://${url}`));
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Failed URLs:');
    results.errors.forEach(({ url, error }) => console.log(`   - https://${url} (${error})`));
  }
  
  // Common issues
  console.log('\n\n🔧 Common Railway deployment issues:\n');
  console.log('1. Service name mismatch - Check Railway dashboard for exact service name');
  console.log('2. Not deployed yet - Ensure deployment completed successfully');
  console.log('3. Build failures - Check Railway build logs');
  console.log('4. Health check failures - Service might be crashing on startup');
  console.log('5. Environment variables - Missing required env vars can cause startup failures');
  console.log('6. Port binding - Ensure service listens on process.env.PORT');
  console.log('7. DNS propagation - New deployments can take a few minutes');
  
  console.log('\n📝 Next steps:');
  console.log('1. Check Railway dashboard for the exact URL');
  console.log('2. Check deployment logs: railway logs');
  console.log('3. Check service status: railway status');
  console.log('4. Verify environment variables are set');
  console.log('5. Test locally with: PORT=3000 node server.js');
}

// Also test localhost to ensure service works
async function testLocal() {
  console.log('\n\n🏠 Testing local deployment...\n');
  
  for (const endpoint of endpoints) {
    await testUrl('localhost:3000', endpoint);
  }
}

// Run checks
console.log('Starting Railway deployment checks...\n');

// First test if it works locally
await testLocal();

// Then check Railway URLs
await checkAllUrls();