// Comprehensive test suite for MARISLINK server endpoints, Supabase integration, and validation
const http = require('http');

const PORT = 5057;
process.env.PORT = PORT;
// Ensure Supabase is initially unconfigured to test missing credentials handling.
// Set to empty string so dotenv does not reload them from server/.env.
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SECRET_KEY = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.SUPABASE_KEY = '';

// Start server
require('./index.js');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== MARISLINK Server & Supabase Integration Test Suite ===\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, desc) => {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  };

  await new Promise(r => setTimeout(r, 600));

  try {
    // ── Phase 1: Unconfigured Credentials Behavior ──────────────────────────
    console.log('--- Phase 1: Unconfigured Credentials Handling ---');
    const healthUnconfigured = await request('GET', '/api/health');
    assert(healthUnconfigured.status === 200, 'GET /api/health returns 200 when unconfigured');
    assert(healthUnconfigured.data.databaseConfigured === false, 'databaseConfigured is false');
    assert(healthUnconfigured.data.databaseStatus === 'unconfigured', 'databaseStatus is "unconfigured"');

    const unconfiguredPost = await request('POST', '/api/telemetry', { node_id: 'MN-01', depth_m: 50 });
    assert(unconfiguredPost.status === 503, 'POST /api/telemetry returns 503 when DB is unconfigured');
    assert(unconfiguredPost.data.error.includes('Supabase database is not configured'), 'Error message clearly explains missing credentials');

    const unconfiguredBatch = await request('POST', '/api/telemetry/batch', { readings: [{ node_id: 'MN-01' }] });
    assert(unconfiguredBatch.status === 503, 'POST /api/telemetry/batch returns 503 when DB is unconfigured');

    const unconfiguredGet = await request('GET', '/api/telemetry');
    assert(unconfiguredGet.status === 503, 'GET /api/telemetry returns 503 when DB is unconfigured');

    // ── Phase 2: Input Validation with Credentials Configured ───────────────
    console.log('\n--- Phase 2: Input Validation & Sanitization ---');
    process.env.SUPABASE_URL = 'https://mock-proj.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'mock-secret-service-role-key';

    const healthConfigured = await request('GET', '/api/health');
    assert(healthConfigured.data.databaseConfigured === true, 'databaseConfigured reports true after configuring environment');

    // Missing node_id
    const missingNode = await request('POST', '/api/telemetry', { depth_m: 500 });
    assert(missingNode.status === 400 && missingNode.data.error.includes('node_id is required'), 'Rejects missing node_id with 400');

    // Excessive node_id length
    const longNode = await request('POST', '/api/telemetry', { node_id: 'X'.repeat(70) });
    assert(longNode.status === 400 && longNode.data.error.includes('exceeds maximum length of 64'), 'Rejects node_id > 64 chars with 400');

    // Battery level > 100
    const highBattery = await request('POST', '/api/telemetry', { node_id: 'MN-01', battery_level: 150 });
    assert(highBattery.status === 400 && highBattery.data.error.includes('battery_level must be <= 100'), 'Rejects battery_level > 100 with 400');

    // Battery level < 0
    const lowBattery = await request('POST', '/api/telemetry', { node_id: 'MN-01', battery_level: -5 });
    assert(lowBattery.status === 400 && lowBattery.data.error.includes('battery_level must be >= 0'), 'Rejects battery_level < 0 with 400');

    // Negative depth
    const negDepth = await request('POST', '/api/telemetry', { node_id: 'MN-01', depth_m: -10 });
    assert(negDepth.status === 400 && negDepth.data.error.includes('depth_m must be >= 0'), 'Rejects negative depth with 400');

    // Out-of-bounds temperature
    const hotTemp = await request('POST', '/api/telemetry', { node_id: 'MN-01', temperature_c: 105 });
    assert(hotTemp.status === 400 && hotTemp.data.error.includes('temperature_c must be <= 60'), 'Rejects temperature_c > 60 with 400');

    // Out-of-bounds pressure
    const badPressure = await request('POST', '/api/telemetry', { node_id: 'MN-01', pressure_mpa: -2 });
    assert(badPressure.status === 400 && badPressure.data.error.includes('pressure_mpa must be >= 0'), 'Rejects negative pressure with 400');

    // Out-of-bounds packet loss
    const highLoss = await request('POST', '/api/telemetry', { node_id: 'MN-01', packet_loss: 120 });
    assert(highLoss.status === 400 && highLoss.data.error.includes('packet_loss must be <= 100'), 'Rejects packet_loss > 100 with 400');

    // ── Phase 3: Batch Endpoint Validation ──────────────────────────────────
    console.log('\n--- Phase 3: Batch Endpoint Safeguards ---');

    // Non-array batch
    const notArray = await request('POST', '/api/telemetry/batch', { readings: 'not-an-array' });
    assert(notArray.status === 400, 'Rejects non-array batch with 400');

    // Empty batch array
    const emptyBatch = await request('POST', '/api/telemetry/batch', { readings: [] });
    assert(emptyBatch.status === 400, 'Rejects empty array with 400');

    // Batch exceeding 50 limit
    const hugeBatch = Array.from({ length: 55 }, (_, i) => ({
      node_id: `MN-${i}`,
      depth_m: 100,
    }));
    const badBatch = await request('POST', '/api/telemetry/batch', { readings: hugeBatch });
    assert(badBatch.status === 400 && badBatch.data.error.includes('maximum limit of 50'), 'Rejects batch size > 50 with 400');

    // Batch with one invalid item among valid ones
    const mixedBatch = [
      { node_id: 'MN-01', depth_m: 100 },
      { node_id: '', depth_m: 200 }, // invalid node_id
    ];
    const partialBad = await request('POST', '/api/telemetry/batch', { readings: mixedBatch });
    assert(partialBad.status === 400 && partialBad.data.error.includes('Item at index 1 is invalid'), 'Identifies invalid item index in batch');

    // ── Phase 4: Twilio System Failure Route Integrity ──────────────────────
    console.log('\n--- Phase 4: Twilio Workflow Preservation ---');

    // Missing nodeId
    const noNodeNotify = await request('POST', '/api/notify/failure', {});
    assert(noNodeNotify.status === 400 && noNodeNotify.data.error.includes('nodeId is required'), 'POST /api/notify/failure rejects empty payload with 400');

    // Oversized nodeId
    const longNodeNotify = await request('POST', '/api/notify/failure', { nodeId: 'A'.repeat(70) });
    assert(longNodeNotify.status === 400 && longNodeNotify.data.error.includes('nodeId is too long'), 'POST /api/notify/failure rejects nodeId > 64 chars with 400');

    console.log(`\n======================================================`);
    console.log(`Results: ${passed} passed, ${failed} failed.`);
    console.log(`======================================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
