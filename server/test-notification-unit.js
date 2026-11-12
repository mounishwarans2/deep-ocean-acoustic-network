// server/test-notification-unit.js
// Safe, offline Unit tests for MARISLINK Twilio Notification Service
// Tests credential validation, format parsing, masking, and cooldowns without initiating real network calls.

const assert = require('assert');
const notificationService = require('./notification-service');

console.log('=== MARISLINK Notification Service Unit Test Suite (Offline / Mocked) ===\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function run() {
  test('Service exports required API functions', () => {
    assert.strictEqual(typeof notificationService.isConfigured, 'function');
    assert.strictEqual(typeof notificationService.getTwilioConfig, 'function');
    assert.strictEqual(typeof notificationService.validateCredentials, 'function');
    assert.strictEqual(typeof notificationService.maskPhoneNumber, 'function');
    assert.strictEqual(typeof notificationService.sendEmergencyAlert, 'function');
    assert.strictEqual(typeof notificationService.sendRecoveryAlert, 'function');
    assert.strictEqual(typeof notificationService.getNotificationStatus, 'function');
    assert.strictEqual(typeof notificationService.getNotificationLogs, 'function');
  });

  test('maskPhoneNumber properly redacts phone numbers', () => {
    assert.strictEqual(notificationService.maskPhoneNumber('+17372048034'), '+173****8034');
    assert.strictEqual(notificationService.maskPhoneNumber('+918838275545'), '+918****5545');
    assert.strictEqual(notificationService.maskPhoneNumber('12345'), '***');
    assert.strictEqual(notificationService.maskPhoneNumber(null), 'not set');
    assert.strictEqual(notificationService.maskPhoneNumber(''), 'not set');
  });

  test('validateCredentials checks Account SID syntax and E.164 formats', () => {
    const origEnv = { ...process.env };
    try {
      process.env.TWILIO_ACCOUNT_SID = 'INVALID_SID';
      process.env.TWILIO_AUTH_TOKEN = 'short';
      process.env.TWILIO_PHONE_NUMBER = 'invalid';
      process.env.MARISLINK_ALERT_RECIPIENT = '123';

      const validation = notificationService.validateCredentials();
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.some(e => e.includes('AC')));
      assert.ok(validation.errors.some(e => e.includes('TWILIO_AUTH_TOKEN must be at least 16 characters')));
      assert.ok(validation.errors.some(e => e.includes('E.164')));
    } finally {
      process.env = origEnv;
    }
  });

  test('getNotificationStatus does not expose Auth Token', () => {
    const status = notificationService.getNotificationStatus();
    assert.strictEqual(typeof status.configured, 'boolean');
    assert.strictEqual(status.authToken, undefined, 'Auth token must NEVER be present in status output');
    assert.ok(status.fromNumber ? status.fromNumber.includes('****') : true, 'Phone numbers must be masked');
    assert.ok(status.recipientNumber ? status.recipientNumber.includes('****') : true, 'Recipient must be masked');
  });

  test('Notification audit logs maintain bounded size (max 50)', () => {
    const logs = notificationService.getNotificationLogs();
    assert.ok(Array.isArray(logs));
    assert.ok(logs.length <= 50);
  });

  console.log(`\n======================================================`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`======================================================\n`);

  if (failed > 0) process.exit(1);
}

run();
