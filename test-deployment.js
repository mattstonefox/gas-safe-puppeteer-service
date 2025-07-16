#!/usr/bin/env node
import fetch from 'node-fetch';

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY;

console.log('🧪 Testing Gas Safe Puppeteer Service');
console.log(`📍 URL: ${DEPLOYMENT_URL}`);
console.log('');

async function runTests() {
  // Test 1: Health Check
  console.log('Test 1: Health Check');
  try {
    const healthRes = await fetch(`${DEPLOYMENT_URL}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health check passed:', healthData);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }
  console.log('');

  // Test 2: API without auth (if API_KEY is not set)
  if (!API_KEY) {
    console.log('Test 2: API Call without Authentication');
    try {
      const res = await fetch(`${DEPLOYMENT_URL}/api/gas-safe-scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gas_safe_number: '123456' })
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ API call successful');
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ API returned error:', res.status, await res.text());
      }
    } catch (error) {
      console.log('❌ API call failed:', error.message);
    }
  }

  // Test 3: API with auth
  if (API_KEY) {
    console.log('Test 3: API Call with Authentication');
    try {
      const res = await fetch(`${DEPLOYMENT_URL}/api/gas-safe-scrape`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({ gas_safe_number: '123456' })
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Authenticated API call successful');
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ API returned error:', res.status, await res.text());
      }
    } catch (error) {
      console.log('❌ API call failed:', error.message);
    }
  }
  console.log('');

  // Test 4: Invalid request
  console.log('Test 4: Invalid Request (no search parameters)');
  try {
    const res = await fetch(`${DEPLOYMENT_URL}/api/gas-safe-scrape`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(API_KEY && { 'X-API-Key': API_KEY })
      },
      body: JSON.stringify({})
    });
    
    if (res.status === 400) {
      console.log('✅ Correctly rejected invalid request');
    } else {
      console.log('❌ Should have returned 400 error');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  console.log('');

  console.log('🏁 Testing complete!');
}

runTests().catch(console.error);