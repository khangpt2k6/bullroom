
const http = require('http');

const API_BASE = 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test runner
async function runTest(name, testFn) {
  testResults.total++;
  process.stdout.write(`${colors.blue}[TEST ${testResults.total}]${colors.reset} ${name}... `);

  try {
    await testFn();
    testResults.passed++;
    console.log(`${colors.green}✓ PASSED${colors.reset}`);
    return true;
  } catch (error) {
    testResults.failed++;
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`${colors.red}  Error: ${error.message}${colors.reset}`);
    return false;
  }
}

// Assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Tests
async function runAllTests() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  🎓 BullRoom API Test Suite${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  // Health check
  await runTest('API Gateway Health Check', async () => {
    const res = await makeRequest('GET', '/health');
    assert(res.status === 200, 'Expected status 200');
    assert(res.data.status === 'healthy', 'Expected healthy status');
  });

  // Root endpoint
  await runTest('Root Endpoint', async () => {
    const res = await makeRequest('GET', '/');
    assert(res.status === 200, 'Expected status 200');
    assert(res.data.message.includes('BullRoom'), 'Expected BullRoom message');
  });

  console.log(`\n${colors.yellow}--- Room Endpoints ---${colors.reset}\n`);

  let allRooms = [];

  // Get all rooms
  await runTest('GET /api/rooms - Get all rooms', async () => {
    const res = await makeRequest('GET', '/api/rooms');
    assert(res.status === 200, 'Expected status 200');
    assert(res.data.success === true, 'Expected success: true');
    assert(Array.isArray(res.data.rooms), 'Expected rooms array');
    allRooms = res.data.rooms;
    console.log(`  ${colors.cyan}→ Found ${allRooms.length} rooms${colors.reset}`);
  });

  // Get rooms by building
  await runTest('GET /api/rooms?building=Library - Filter by building', async () => {
    const res = await makeRequest('GET', '/api/rooms?building=Library');
    assert(res.status === 200, 'Expected status 200');
    assert(res.data.success === true, 'Expected success: true');
    assert(res.data.rooms.every(r => r.building === 'Library'), 'All rooms should be Library');
    console.log(`  ${colors.cyan}→ Found ${res.data.rooms.length} Library rooms${colors.reset}`);
  });

  // Get rooms by type
  await runTest('GET /api/rooms?type=Group - Filter by type', async () => {
    const res = await makeRequest('GET', '/api/rooms?type=Group');
    assert(res.status === 200, 'Expected status 200');
    assert(res.data.success === true, 'Expected success: true');
    assert(res.data.rooms.every(r => r.type === 'Group'), 'All rooms should be Group type');
    console.log(`  ${colors.cyan}→ Found ${res.data.rooms.length} Group rooms${colors.reset}`);
  });

  // Get single room
  let testRoomId = 'LIB-224';
  await runTest(`GET /api/rooms/${testRoomId} - Get single room`, async () => {
    const res = await makeRequest('GET', `/api/rooms/${testRoomId}`);
    assert(res.status === 200, 'Expected status 200');
    assert(res.data.success === true, 'Expected success: true');
    assert(res.data.room._id === testRoomId, `Expected room ID ${testRoomId}`);
    console.log(`  ${colors.cyan}→ Room: ${res.data.room.description}${colors.reset}`);
  });

  // Check room availability
  const startTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
  const endTime = new Date(Date.now() + 7200000).toISOString(); // 2 hours from now

  await runTest('GET /api/rooms/:id/availability - Check availability', async () => {
    const res = await makeRequest('GET', `/api/rooms/${testRoomId}/availability?startTime=${startTime}&endTime=${endTime}`);
    assert(res.status === 200, 'Expected status 200');
    assert(res.data.success === true, 'Expected success: true');
    assert('available' in res.data, 'Expected available field');
    console.log(`  ${colors.cyan}→ Room ${testRoomId} is ${res.data.available ? 'AVAILABLE' : 'NOT AVAILABLE'}${colors.reset}`);
  });

  // Get buildings list
  await runTest('GET /api/rooms/buildings/list - Get buildings', async () => {
    const res = await makeRequest('GET', '/api/rooms/buildings/list');
    assert(res.status === 200, 'Expected status 200');
    assert(res.data.success === true, 'Expected success: true');
    assert(Array.isArray(res.data.buildings), 'Expected buildings array');
    console.log(`  ${colors.cyan}→ Buildings: ${res.data.buildings.join(', ')}${colors.reset}`);
  });

  console.log(`\n${colors.yellow}--- Booking Endpoints ---${colors.reset}\n`);

  let testUserId = '507f1f77bcf86cd799439011'; // Dummy ObjectId
  let bookingId = null;

  // Create booking
  await runTest('POST /api/bookings - Create booking request', async () => {
    const bookingData = {
      userId: testUserId,
      roomId: testRoomId,
      startTime: startTime,
      endTime: endTime
    };

    const res = await makeRequest('POST', '/api/bookings', bookingData);
    assert(res.status === 202 || res.status === 200, 'Expected status 202 or 200');
    assert(res.data.success === true, 'Expected success: true');
    assert(res.data.booking, 'Expected booking object');
    bookingId = res.data.booking.id;
    console.log(`  ${colors.cyan}→ Booking created: ${bookingId}${colors.reset}`);
    console.log(`  ${colors.cyan}→ Status: ${res.data.booking.status}${colors.reset}`);
  });

  // Get all bookings
  await runTest('GET /api/bookings - Get all bookings', async () => {
    const res = await makeRequest('GET', '/api/bookings');
    assert(res.status === 200, 'Expected status 200');
    assert(res.data.success === true, 'Expected success: true');
    assert(Array.isArray(res.data.bookings), 'Expected bookings array');
    console.log(`  ${colors.cyan}→ Found ${res.data.bookings.length} bookings${colors.reset}`);
  });

  // Get bookings by user
  await runTest(`GET /api/bookings?userId=${testUserId} - Filter by user`, async () => {
    const res = await makeRequest('GET', `/api/bookings?userId=${testUserId}`);
    assert(res.status === 200, 'Expected status 200');
    assert(res.data.success === true, 'Expected success: true');
  });

  // Get single booking
  if (bookingId) {
    await runTest(`GET /api/bookings/${bookingId} - Get single booking`, async () => {
      const res = await makeRequest('GET', `/api/bookings/${bookingId}`);
      assert(res.status === 200 || res.status === 404, 'Expected status 200 or 404');
      if (res.status === 200) {
        console.log(`  ${colors.cyan}→ Booking status: ${res.data.booking.status}${colors.reset}`);
      }
    });
  }

  console.log(`\n${colors.yellow}--- Error Handling Tests ---${colors.reset}\n`);

  // Test 404
  await runTest('GET /api/invalid-route - Should return 404', async () => {
    const res = await makeRequest('GET', '/api/invalid-route');
    assert(res.status === 404, 'Expected status 404');
  });

  // Test invalid room ID
  await runTest('GET /api/rooms/INVALID-ID - Should handle invalid room', async () => {
    const res = await makeRequest('GET', '/api/rooms/INVALID-ID');
    assert(res.status === 404, 'Expected status 404');
  });

  // Test missing booking fields
  await runTest('POST /api/bookings - Should reject missing fields', async () => {
    const res = await makeRequest('POST', '/api/bookings', { userId: '123' });
    assert(res.status === 400, 'Expected status 400');
  });

  // Print summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Test Results${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`  Total Tests:  ${testResults.total}`);
  console.log(`  ${colors.green}Passed:       ${testResults.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed:       ${testResults.failed}${colors.reset}`);
  console.log(`  ${colors.cyan}Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Check if services are running
async function checkServices() {
  console.log(`${colors.yellow}Checking if services are running...${colors.reset}\n`);

  try {
    const res = await makeRequest('GET', '/health');
    if (res.status === 200) {
      console.log(`${colors.green}✓ API Gateway is running on ${API_BASE}${colors.reset}\n`);
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}✗ API Gateway is NOT running on ${API_BASE}${colors.reset}`);
    console.log(`${colors.yellow}\nPlease start the services first:${colors.reset}`);
    console.log(`  1. cd backend/api-gateway && npm start`);
    console.log(`  2. cd backend/booking-service && npm start`);
    console.log(`  3. cd backend/notification-service && npm start\n`);
    process.exit(1);
  }
}

// Run tests
(async () => {
  await checkServices();
  await runAllTests();
})();
