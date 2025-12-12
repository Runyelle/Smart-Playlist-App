#!/usr/bin/env node

/**
 * Diagnostic script to check if transitions routes are properly registered
 * Run this while the server is running to verify routes are accessible
 */

const BASE_URL = process.env.API_URL || 'http://localhost:4000';

async function checkRoutes() {
  console.log('🔍 Checking API routes...\n');

  try {
    // Check health endpoint
    console.log('1. Checking /health endpoint...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    if (healthRes.ok) {
      console.log('   ✅ Health endpoint is accessible\n');
    } else {
      console.log(`   ❌ Health endpoint returned ${healthRes.status}\n`);
      return;
    }

    // Check root endpoint for route documentation
    console.log('2. Checking root endpoint for route info...');
    const rootRes = await fetch(`${BASE_URL}/`);
    if (rootRes.ok) {
      const data = await rootRes.json();
      if (data.data?.endpoints?.transitions) {
        console.log('   ✅ Transitions routes are documented in API\n');
        console.log('   Transitions endpoints:', JSON.stringify(data.data.endpoints.transitions, null, 2));
      } else {
        console.log('   ⚠️  Transitions routes not found in API documentation\n');
      }
    }

    // Check if transitions route exists (should return 401 without auth, not 404)
    console.log('\n3. Checking POST /transitions/generate (should return 401, not 404)...');
    const transitionRes = await fetch(`${BASE_URL}/transitions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackA: { id: 'test', name: 'Test A' },
        trackB: { id: 'test2', name: 'Test B' },
      }),
    });

    if (transitionRes.status === 404) {
      console.log('   ❌ Route returned 404 - Route is NOT registered!\n');
      console.log('   💡 Solution: Restart the backend server');
      console.log('      - If using npm run dev: Stop and restart');
      console.log('      - If using npm start: Run npm run build then npm start\n');
    } else if (transitionRes.status === 401) {
      console.log('   ✅ Route returned 401 - Route IS registered (auth required)\n');
    } else {
      console.log(`   ⚠️  Route returned ${transitionRes.status} - Unexpected status\n`);
    }

    // Check transitions route with GET (should return 404 for non-existent transition)
    console.log('4. Checking GET /transitions/test-id...');
    const getRes = await fetch(`${BASE_URL}/transitions/test-id`);
    if (getRes.status === 404) {
      console.log('   ✅ GET route is registered (404 for non-existent transition)\n');
    } else {
      console.log(`   ⚠️  GET route returned ${getRes.status}\n`);
    }

    console.log('✅ Route check complete!\n');
    console.log('If routes are not working:');
    console.log('1. Make sure backend server is running');
    console.log('2. Restart the backend server to load latest code');
    console.log('3. Check server logs for "Registering transitions routes" message');
    console.log('4. Verify dist/routes/transitions.routes.js exists and is up to date');

  } catch (error) {
    console.error('❌ Error checking routes:', error.message);
    console.log('\n💡 Make sure the backend server is running on', BASE_URL);
  }
}

checkRoutes();

