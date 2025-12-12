#!/usr/bin/env node

/**
 * Detailed diagnostic script to debug 404 issues
 * This will help identify if the route is actually registered
 */

const BASE_URL = process.env.API_URL || 'http://localhost:4000';

async function debugRoute() {
  console.log('🔍 Detailed Route Debugging\n');
  console.log('='.repeat(60));
  
  // Test 1: Check if server is running
  console.log('\n1️⃣  Testing server connectivity...');
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    if (healthRes.ok) {
      console.log('   ✅ Server is running and accessible');
    } else {
      console.log(`   ❌ Server returned ${healthRes.status}`);
      console.log('   💡 Make sure the backend server is running on port 4000');
      return;
    }
  } catch (error) {
    console.log(`   ❌ Cannot connect to server: ${error.message}`);
    console.log('   💡 Make sure the backend server is running: npm run dev');
    return;
  }

  // Test 2: Check root endpoint for route documentation
  console.log('\n2️⃣  Checking route documentation...');
  try {
    const rootRes = await fetch(`${BASE_URL}/`);
    const rootData = await rootRes.json();
    
    if (rootData.data?.endpoints?.transitions) {
      console.log('   ✅ Transitions routes are documented');
      console.log(`   📋 POST ${rootData.data.endpoints.transitions.generate.path}`);
    } else {
      console.log('   ❌ Transitions routes NOT found in documentation');
      console.log('   💡 Routes may not be registered properly');
    }
  } catch (error) {
    console.log(`   ❌ Error checking root: ${error.message}`);
  }

  // Test 3: Test POST /transitions/generate without auth
  console.log('\n3️⃣  Testing POST /transitions/generate (no auth)...');
  try {
    const res = await fetch(`${BASE_URL}/transitions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackA: { id: 'test1', name: 'Test Track A' },
        trackB: { id: 'test2', name: 'Test Track B' },
      }),
    });

    const status = res.status;
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    console.log(`   Status: ${status}`);
    
    if (status === 404) {
      console.log('   ❌ ROUTE NOT FOUND (404)');
      console.log('   💡 The route is NOT registered in the running server');
      console.log('   💡 Solution: Restart the backend server');
      console.log('      - Stop server (Ctrl+C)');
      console.log('      - Run: npm run build (if using compiled code)');
      console.log('      - Run: npm run dev (to restart)');
      console.log('\n   📋 Check server console for these messages:');
      console.log('      "Registering transitions routes at /transitions"');
      console.log('      "Transitions routes registered"');
    } else if (status === 401) {
      console.log('   ✅ Route EXISTS (401 = auth required)');
      console.log('   ✅ Route is properly registered!');
      if (json?.error) {
        console.log(`   📝 Error message: ${json.error.message}`);
      }
    } else if (status === 400) {
      console.log('   ⚠️  Route exists but validation failed (400)');
      if (json?.error) {
        console.log(`   📝 Error: ${json.error.message}`);
      }
    } else {
      console.log(`   ⚠️  Unexpected status: ${status}`);
      if (json) {
        console.log(`   📝 Response: ${JSON.stringify(json, null, 2)}`);
      } else {
        console.log(`   📝 Response: ${text.substring(0, 200)}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: Test with invalid path
  console.log('\n4️⃣  Testing invalid path (should return 404)...');
  try {
    const res = await fetch(`${BASE_URL}/transitions/invalid-path-test-12345`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`   Status: ${res.status} (expected: 404)`);
    if (res.status === 404) {
      console.log('   ✅ 404 handler working correctly');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 5: Check GET route
  console.log('\n5️⃣  Testing GET /transitions/test-id...');
  try {
    const res = await fetch(`${BASE_URL}/transitions/test-id`);
    console.log(`   Status: ${res.status} (expected: 404 for non-existent transition)`);
    if (res.status === 404) {
      console.log('   ✅ GET route is registered');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Next Steps:');
  console.log('1. Check your SERVER console (not browser console)');
  console.log('2. Look for these messages when server starts:');
  console.log('   - "Registering transitions routes at /transitions"');
  console.log('   - "Transitions routes registered"');
  console.log('3. When making a request, look for:');
  console.log('   - "Transitions router - Request received"');
  console.log('   - "POST /transitions/generate route hit"');
  console.log('\n4. If you DON\'T see these messages:');
  console.log('   - The server is running old code');
  console.log('   - Restart the server: npm run dev');
  console.log('\n5. The Chrome extension error is unrelated (ignore it)');
  console.log('   Focus on the SERVER console logs, not browser console');
}

debugRoute();

