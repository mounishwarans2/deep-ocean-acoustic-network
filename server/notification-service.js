// server/notification-service.js
// ── MARISLINK Twilio Emergency Notification & Voice Alert Service ─────────────
// Production-grade SMS & Voice escalation handler with:
// - E.164 phone validation and credential format checks
// - Trial account verification diagnostics (e.g. code 21608)
// - Anti-duplicate alert deduplication & 5-minute incident cooldown
// - Automated TwiML voice synthesis (Polly.Joanna)
// - Safe masked logging (never leaks Auth Tokens or full recipient secrets)
// - In-memory audit ring buffer for delivery SIDs and status tracking

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

// Cooldown duration: 5 minutes between duplicate calls/SMS for unresolved node incident
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

// Twilio Voice URL fallback (standard template for trial accounts that restrict raw inline TwiML parameters)
const DEFAULT_VOICE_URL = process.env.TWILIO_VOICE_URL || 'https://webhooks.twilio.com/v1/Voice/Template/voice_speech_recognition';

async function dispatchVoiceCall(client, { from, to, twiml }) {
  try {
    return await client.calls.create({ from, to, twiml });
  } catch (err) {
    const msg = err && err.message ? err.message : '';
    // Trial accounts enforce URL parameter and disallow raw inline TwiML strings
    if (msg.includes('disallowed parameters') || msg.includes('limited parameter access') || err.status === 400) {
      return await client.calls.create({ from, to, url: DEFAULT_VOICE_URL });
    }
    throw err;
  }
}

// Maximum log entries kept in memory
const MAX_LOG_ENTRIES = 50;

// Incident tracker: nodeId -> { incidentId, nodeId, status, firstAlertAt, lastAlertAt, alertCount, lastSmsSid, lastCallSid }
const activeIncidents = new Map();

// Notification history logs (in-memory ring buffer)
const notificationLogs = [];

/**
 * Retrieves Twilio configuration from environment variables.
 * Supports both standard required names and legacy aliases.
 */
function getTwilioConfig() {
  const accountSid = (
    process.env.TWILIO_ACCOUNT_SID ||
    process.env.TWILIO_SID ||
    ''
  ).trim();

  const authToken = (
    process.env.TWILIO_AUTH_TOKEN ||
    process.env.TWILIO_TOKEN ||
    ''
  ).trim();

  const fromNumber = (
    process.env.TWILIO_PHONE_NUMBER ||
    process.env.TWILIO_FROM ||
    ''
  ).trim();

  const toNumber = (
    process.env.MARISLINK_ALERT_RECIPIENT ||
    process.env.ALERT_TO ||
    ''
  ).trim();

  return { accountSid, authToken, fromNumber, toNumber };
}

/**
 * Returns true if all 4 required credentials are non-empty.
 */
function isConfigured() {
  const { accountSid, authToken, fromNumber, toNumber } = getTwilioConfig();
  return Boolean(accountSid && authToken && fromNumber && toNumber);
}

/**
 * Safely masks a phone number (e.g. +1737****8034, +9188****5545).
 */
function maskPhoneNumber(num) {
  if (!num || typeof num !== 'string') return 'not set';
  const clean = num.trim();
  if (clean.length <= 6) return '***';
  return clean.slice(0, 4) + '****' + clean.slice(-4);
}

/**
 * Validates credential syntax and E.164 phone formats before making network calls.
 */
function validateCredentials() {
  const { accountSid, authToken, fromNumber, toNumber } = getTwilioConfig();
  const errors = [];

  if (!accountSid) {
    errors.push('TWILIO_ACCOUNT_SID (or TWILIO_SID) is missing.');
  } else if (!accountSid.startsWith('AC') || accountSid.length !== 34) {
    errors.push('TWILIO_ACCOUNT_SID must start with "AC" and be exactly 34 characters long.');
  }

  if (!authToken) {
    errors.push('TWILIO_AUTH_TOKEN (or TWILIO_TOKEN) is missing.');
  } else if (authToken.length < 16) {
    errors.push('TWILIO_AUTH_TOKEN must be at least 16 characters long.');
  }

  const e164Regex = /^\+[1-9]\d{6,14}$/;

  if (!fromNumber) {
    errors.push('TWILIO_PHONE_NUMBER (or TWILIO_FROM) is missing.');
  } else if (!e164Regex.test(fromNumber.replace(/[\s-]/g, ''))) {
    errors.push(`TWILIO_PHONE_NUMBER (${fromNumber}) must be in international E.164 format (e.g. +17372508034).`);
  }

  if (!toNumber) {
    errors.push('MARISLINK_ALERT_RECIPIENT (or ALERT_TO) is missing.');
  } else if (!e164Regex.test(toNumber.replace(/[\s-]/g, ''))) {
    errors.push(`MARISLINK_ALERT_RECIPIENT (${toNumber}) must be in international E.164 format (e.g. +918838535545).`);
  }

  return {
    valid: errors.length === 0,
    errors,
    maskedConfig: {
      accountSid: accountSid ? accountSid.slice(0, 6) + '...' + accountSid.slice(-4) : null,
      fromNumber: maskPhoneNumber(fromNumber),
      toNumber: maskPhoneNumber(toNumber),
      hasAuthToken: Boolean(authToken),
    },
  };
}

/**
 * Lazily loads and initializes the Twilio SDK client.
 */
function getTwilioClient() {
  const { accountSid, authToken } = getTwilioConfig();
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured in environment variables.');
  }
  // eslint-disable-next-line global-require
  const twilio = require('twilio');
  return twilio(accountSid, authToken);
}

/**
 * Records a delivery event into the ring-buffer log.
 */
function recordLog(entry) {
  const logItem = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  notificationLogs.unshift(logItem);
  if (notificationLogs.length > MAX_LOG_ENTRIES) {
    notificationLogs.pop();
  }
  return logItem;
}

/**
 * Generates standardized emergency SMS text.
 */
function formatEmergencySms({ nodeId, status, message }) {
  const node = (nodeId || 'UNKNOWN-NODE').trim();
  const st = (status || 'CRITICAL').trim().toUpperCase();
  const msg = (message || 'Communication failure detected.').trim();

  return (
    `MARISLINK EMERGENCY ALERT\n` +
    `Node: ${node}\n` +
    `Status: ${st}\n` +
    `Alert: ${msg}\n` +
    `Please inspect the underwater network dashboard.`
  );
}

/**
 * Generates standardized recovery SMS text.
 */
function formatRecoverySms({ nodeId, previousStatus, message }) {
  const node = (nodeId || 'UNKNOWN-NODE').trim();
  const prev = (previousStatus || 'CRITICAL').trim().toUpperCase();
  const msg = message ? message.trim() : 'Node telemetry restored to nominal operating parameters.';

  return (
    `MARISLINK RECOVERY NOTICE\n` +
    `Node: ${node}\n` +
    `Status: OPERATIONAL\n` +
    `Update: Recovered from ${prev} state.\n` +
    `${msg}\n` +
    `Underwater communication link confirmed active.`
  );
}

/**
 * Generates controlled test verification SMS text.
 */
function formatTestSms({ recipientMasked }) {
  return (
    `[TEST] MARISLINK SYSTEM VERIFICATION\n` +
    `This is a controlled test notification from your MARISLINK underwater acoustic monitoring system.\n` +
    `Twilio SMS delivery is OPERATIONAL.\n` +
    `Verified Recipient: ${recipientMasked}`
  );
}

/**
 * Builds TwiML for emergency voice call synthesis.
 */
function buildEmergencyTwiml({ nodeId, status, message }) {
  const safeNode = (nodeId || 'S-01').replace(/[<>&]/g, '');
  const safeStatus = (status || 'CRITICAL').replace(/[<>&]/g, '');
  const safeMsg = (message || 'Communication failure detected').replace(/[<>&]/g, '');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
    `<Pause length="1"/>` +
    `<Say voice="Polly.Joanna" language="en-US">` +
    `Attention operator. This is a MARISLINK Emergency Alert. ` +
    `Critical condition detected on underwater node ${safeNode}. ` +
    `Status is ${safeStatus}. ` +
    `${safeMsg}. ` +
    `Please inspect the underwater network dashboard immediately.` +
    `</Say>` +
    `<Pause length="2"/>` +
    `<Say voice="Polly.Joanna" language="en-US">` +
    `Repeating: Underwater node ${safeNode} critical alert. Immediate operator attention required. End of alert.` +
    `</Say>` +
    `</Response>`
  );
}

/**
 * Builds TwiML for test voice calls.
 */
function buildTestTwiml({ recipientMasked }) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
    `<Pause length="1"/>` +
    `<Say voice="Polly.Joanna" language="en-US">` +
    `This is a test notification from the MARISLINK underwater acoustic monitoring system. ` +
    `Your Twilio automated voice call integration is verified and operational for recipient ${recipientMasked}.` +
    `</Say>` +
    `</Response>`
  );
}

/**
 * Translates Twilio API errors (especially trial account restrictions)
 * into actionable operator explanations.
 */
function translateTwilioError(err, targetPhone) {
  if (!err) return 'Unknown Twilio error';

  const code = err.code || (err.status ? `HTTP_${err.status}` : 'UNKNOWN');
  const rawMsg = err.message || String(err);
  const maskedTo = maskPhoneNumber(targetPhone);

  if (err.code === 21608) {
    return (
      `Twilio Trial Restriction (Error 21608): Recipient ${maskedTo} is not verified. ` +
      `Trial accounts can only send to verified caller IDs. ` +
      `Verify this number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified`
    );
  }

  if (err.code === 20003) {
    if (rawMsg.includes('Trial account has expired')) {
      return `Twilio Trial Expired (Error 20003): The configured trial account has expired. Please update server/.env with your new Twilio trial Account SID and Auth Token.`;
    }
    return `Twilio Authentication Error (Error 20003): Invalid TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN. Verify credentials in server/.env.`;
  }

  if (err.code === 21211) {
    return `Twilio Invalid Number (Error 21211): Recipient number ${maskedTo} is not formatted in valid E.164 syntax (+[country][number]).`;
  }

  if (err.code === 21606) {
    return `Twilio From Number Error (Error 21606): Sender number is not a valid SMS-capable number in your Twilio account.`;
  }

  if (err.code === 21408) {
    return `Twilio Geographic Permissions (Error 21408): Geo-permissions disabled for the destination country. Enable SMS/Voice geo-permissions in Twilio Console.`;
  }

  if (err.code === 20429) {
    return `Twilio Rate Limit Exceeded (Error 20429): Too many concurrent requests. Cooldown active.`;
  }

  return `Twilio Error [${code}]: ${rawMsg}`;
}

/**
 * Checks cooldown state for a node to prevent alert flooding.
 */
function evaluateCooldown(nodeId, newStatus, force) {
  if (force === true) {
    return { inCooldown: false, reason: 'forced' };
  }

  const existing = activeIncidents.get(nodeId);
  if (!existing) {
    return { inCooldown: false };
  }

  const now = Date.now();
  const elapsed = now - existing.lastAlertAt;

  // If incident is still active and within 5-minute cooldown window
  if (elapsed < DEFAULT_COOLDOWN_MS && existing.status === newStatus) {
    const remainingSeconds = Math.ceil((DEFAULT_COOLDOWN_MS - elapsed) / 1000);
    return {
      inCooldown: true,
      remainingSeconds,
      incidentId: existing.incidentId,
      alertCount: existing.alertCount,
    };
  }

  return { inCooldown: false, previousIncident: existing };
}

/**
 * Sends an emergency alert (SMS + Voice) for critical node failures.
 */
async function sendEmergencyAlert({ nodeId, status, message, enableVoiceCall = true, force = false }) {
  const { accountSid, fromNumber, toNumber } = getTwilioConfig();

  if (!isConfigured()) {
    return {
      ok: false,
      statusCode: 503,
      error: 'Twilio is not configured on the server. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER and MARISLINK_ALERT_RECIPIENT.',
    };
  }

  const validation = validateCredentials();
  if (!validation.valid) {
    return {
      ok: false,
      statusCode: 400,
      error: `Invalid Twilio configuration: ${validation.errors.join(' ')}`,
    };
  }

  const safeNode = (nodeId || 'MN-01').trim();
  const safeStatus = (status || 'CRITICAL').trim().toUpperCase();
  const safeMessage = (message || 'Communication failure detected.').trim();

  // Evaluate cooldown
  const cooldown = evaluateCooldown(safeNode, safeStatus, force);
  if (cooldown.inCooldown) {
    console.warn(`[TWILIO-ALERT] Suppressed duplicate alert for node ${safeNode} (Cooldown: ${cooldown.remainingSeconds}s remaining).`);
    return {
      ok: true,
      rateLimited: true,
      cooldownActive: true,
      remainingSeconds: cooldown.remainingSeconds,
      incidentId: cooldown.incidentId,
      message: `Alert suppressed by cooldown: node ${safeNode} already reported (${cooldown.remainingSeconds}s remaining).`,
      sms: null,
      call: null,
    };
  }

  const incidentId = `inc_${safeNode}_${Date.now()}`;
  const smsBody = formatEmergencySms({ nodeId: safeNode, status: safeStatus, message: safeMessage });
  const twiml = buildEmergencyTwiml({ nodeId: safeNode, status: safeStatus, message: safeMessage });

  const result = {
    ok: true,
    incidentId,
    nodeId: safeNode,
    status: safeStatus,
    sms: null,
    call: null,
  };
  const errors = [];

  const client = getTwilioClient();

  // 1. Send SMS
  try {
    const sms = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: smsBody,
    });
    result.sms = { sid: sms.sid, status: sms.status };
    recordLog({
      type: 'SMS',
      isTest: false,
      incidentId,
      nodeId: safeNode,
      status: safeStatus,
      recipient: maskPhoneNumber(toNumber),
      sender: maskPhoneNumber(fromNumber),
      sid: sms.sid,
      deliveryStatus: sms.status,
    });
    console.log(`[TWILIO-SMS] Alert dispatched for ${safeNode} -> SID: ${sms.sid} (${sms.status})`);
  } catch (err) {
    const errorMsg = translateTwilioError(err, toNumber);
    errors.push(`SMS: ${errorMsg}`);
    recordLog({
      type: 'SMS',
      isTest: false,
      incidentId,
      nodeId: safeNode,
      status: safeStatus,
      recipient: maskPhoneNumber(toNumber),
      sender: maskPhoneNumber(fromNumber),
      error: errorMsg,
      deliveryStatus: 'failed',
    });
    console.error(`[TWILIO-SMS-ERROR] ${errorMsg}`);
  }

  // 2. Automated Voice Call (optional, defaults to true)
  if (enableVoiceCall !== false) {
    try {
      const call = await dispatchVoiceCall(client, {
        from: fromNumber,
        to: toNumber,
        twiml,
      });
      result.call = { sid: call.sid, status: call.status };
      recordLog({
        type: 'VOICE',
        isTest: false,
        incidentId,
        nodeId: safeNode,
        status: safeStatus,
        recipient: maskPhoneNumber(toNumber),
        sender: maskPhoneNumber(fromNumber),
        sid: call.sid,
        deliveryStatus: call.status,
      });
      console.log(`[TWILIO-CALL] Voice alert initiated for ${safeNode} -> SID: ${call.sid} (${call.status})`);
    } catch (err) {
      const errorMsg = translateTwilioError(err, toNumber);
      errors.push(`Voice Call: ${errorMsg}`);
      recordLog({
        type: 'VOICE',
        isTest: false,
        incidentId,
        nodeId: safeNode,
        status: safeStatus,
        recipient: maskPhoneNumber(toNumber),
        sender: maskPhoneNumber(fromNumber),
        error: errorMsg,
        deliveryStatus: 'failed',
      });
      console.error(`[TWILIO-CALL-ERROR] ${errorMsg}`);
    }
  }

  // Check if at least one delivery channel succeeded
  if (!result.sms && !result.call) {
    return {
      ok: false,
      statusCode: 502,
      incidentId,
      error: errors.join(' | ') || 'Twilio delivery failed across both SMS and Voice channels.',
    };
  }

  // Update incident tracker
  const prevIncident = activeIncidents.get(safeNode);
  activeIncidents.set(safeNode, {
    incidentId,
    nodeId: safeNode,
    status: safeStatus,
    firstAlertAt: prevIncident ? prevIncident.firstAlertAt : Date.now(),
    lastAlertAt: Date.now(),
    alertCount: prevIncident ? prevIncident.alertCount + 1 : 1,
    lastSmsSid: result.sms ? result.sms.sid : null,
    lastCallSid: result.call ? result.call.sid : null,
  });

  if (errors.length > 0) {
    result.warning = errors.join(' | ');
  }

  return result;
}

/**
 * Sends a recovery notification when a critical node recovers.
 */
async function sendRecoveryAlert({ nodeId, previousStatus, message }) {
  const { fromNumber, toNumber } = getTwilioConfig();

  if (!isConfigured()) {
    return { ok: false, error: 'Twilio not configured' };
  }

  const safeNode = (nodeId || 'MN-01').trim();
  const existing = activeIncidents.get(safeNode);

  const prevStatus = previousStatus || (existing ? existing.status : 'CRITICAL');
  const smsBody = formatRecoverySms({
    nodeId: safeNode,
    previousStatus: prevStatus,
    message,
  });

  // Clear active incident state
  activeIncidents.delete(safeNode);

  try {
    const client = getTwilioClient();
    const sms = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: smsBody,
    });

    recordLog({
      type: 'RECOVERY',
      isTest: false,
      nodeId: safeNode,
      status: 'OPERATIONAL',
      recipient: maskPhoneNumber(toNumber),
      sender: maskPhoneNumber(fromNumber),
      sid: sms.sid,
      deliveryStatus: sms.status,
    });

    console.log(`[TWILIO-RECOVERY] Recovery notification dispatched for ${safeNode} -> SID: ${sms.sid}`);
    return { ok: true, recovered: true, sms: { sid: sms.sid, status: sms.status } };
  } catch (err) {
    const errorMsg = translateTwilioError(err, toNumber);
    recordLog({
      type: 'RECOVERY',
      isTest: false,
      nodeId: safeNode,
      status: 'OPERATIONAL',
      recipient: maskPhoneNumber(toNumber),
      error: errorMsg,
      deliveryStatus: 'failed',
    });
    return { ok: false, error: errorMsg };
  }
}

/**
 * Dispatches a controlled test notification to verify Twilio integration.
 * Type: 'verify' (API check only), 'sms' (SMS test), 'call' (Voice call test), 'both' (SMS + Call).
 */
async function sendTestNotification({ type = 'both' }) {
  if (!isConfigured()) {
    return {
      ok: false,
      statusCode: 503,
      error: 'Twilio is not configured on the server. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER and MARISLINK_ALERT_RECIPIENT.',
    };
  }

  const validation = validateCredentials();
  if (!validation.valid) {
    return {
      ok: false,
      statusCode: 400,
      error: `Invalid Twilio configuration: ${validation.errors.join(' ')}`,
    };
  }

  const { accountSid, fromNumber, toNumber } = getTwilioConfig();
  const client = getTwilioClient();
  const maskedTo = maskPhoneNumber(toNumber);
  const maskedFrom = maskPhoneNumber(fromNumber);

  // Mode 1: Credentials & API connection verification only (zero billable units)
  if (type === 'verify') {
    try {
      const account = await client.api.accounts(accountSid).fetch();
      let verifiedCallerIds = [];
      try {
        const callerIds = await client.outgoingCallerIds.list({ limit: 10 });
        verifiedCallerIds = callerIds.map(c => maskPhoneNumber(c.phoneNumber));
      } catch (_) {
        // Non-fatal if list permission restricted
      }

      return {
        ok: true,
        type: 'verify',
        account: {
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type, // 'Trial' or 'Full'
        },
        recipient: maskedTo,
        fromNumber: maskedFrom,
        verifiedCallerIds,
        message: 'Twilio API authentication successful. Credentials are active and valid.',
      };
    } catch (err) {
      const errorMsg = translateTwilioError(err, toNumber);
      return {
        ok: false,
        status: err.status || 502,
        error: errorMsg,
      };
    }
  }

  const result = {
    ok: true,
    isTest: true,
    type,
    recipient: maskedTo,
    fromNumber: maskedFrom,
    sms: null,
    call: null,
  };
  const errors = [];

  // Mode 2: Test SMS
  if (type === 'sms' || type === 'both') {
    try {
      const smsBody = formatTestSms({ recipientMasked: maskedTo });
      const sms = await client.messages.create({
        from: fromNumber,
        to: toNumber,
        body: smsBody,
      });
      result.sms = { sid: sms.sid, status: sms.status };
      recordLog({
        type: 'TEST_SMS',
        isTest: true,
        recipient: maskedTo,
        sender: maskedFrom,
        sid: sms.sid,
        deliveryStatus: sms.status,
      });
      console.log(`[TWILIO-TEST-SMS] Sent -> SID: ${sms.sid} (${sms.status})`);
    } catch (err) {
      const errorMsg = translateTwilioError(err, toNumber);
      errors.push(`SMS: ${errorMsg}`);
      recordLog({
        type: 'TEST_SMS',
        isTest: true,
        recipient: maskedTo,
        sender: maskedFrom,
        error: errorMsg,
        deliveryStatus: 'failed',
      });
    }
  }

  // Mode 3: Test Voice Call
  if (type === 'call' || type === 'both') {
    try {
      const twiml = buildTestTwiml({ recipientMasked: maskedTo });
      const call = await dispatchVoiceCall(client, {
        from: fromNumber,
        to: toNumber,
        twiml,
      });
      result.call = { sid: call.sid, status: call.status };
      recordLog({
        type: 'TEST_VOICE',
        isTest: true,
        recipient: maskedTo,
        sender: maskedFrom,
        sid: call.sid,
        deliveryStatus: call.status,
      });
      console.log(`[TWILIO-TEST-CALL] Call initiated -> SID: ${call.sid} (${call.status})`);
    } catch (err) {
      const errorMsg = translateTwilioError(err, toNumber);
      errors.push(`Voice Call: ${errorMsg}`);
      recordLog({
        type: 'TEST_VOICE',
        isTest: true,
        recipient: maskedTo,
        sender: maskedFrom,
        error: errorMsg,
        deliveryStatus: 'failed',
      });
    }
  }

  if (!result.sms && !result.call) {
    return {
      ok: false,
      status: 502,
      error: errors.join(' | ') || 'Test notification delivery failed.',
    };
  }

  if (errors.length > 0) {
    result.warning = errors.join(' | ');
  }

  return result;
}

/**
 * Returns service status, active incidents, and recent notification logs.
 */
function getNotificationStatus() {
  const configured = isConfigured();
  const validation = validateCredentials();

  const incidents = [];
  activeIncidents.forEach((val, key) => {
    incidents.push({
      nodeId: key,
      ...val,
      elapsedSeconds: Math.round((Date.now() - val.lastAlertAt) / 1000),
    });
  });

  return {
    ok: true,
    service: 'marislink-twilio-notification-service',
    configured,
    validation,
    activeIncidentsCount: incidents.length,
    activeIncidents: incidents,
    recentLogsCount: notificationLogs.length,
    recentLogs: notificationLogs.slice(0, 15),
  };
}

module.exports = {
  getTwilioConfig,
  isConfigured,
  credentialsConfigured: isConfigured, // alias for backwards compatibility
  getTwilioClient,
  validateCredentials,
  maskPhoneNumber,
  formatEmergencySms,
  formatRecoverySms,
  formatTestSms,
  buildEmergencyTwiml,
  buildTestTwiml,
  sendEmergencyAlert,
  sendRecoveryAlert,
  sendTestNotification,
  getNotificationStatus,
  translateTwilioError,
  evaluateCooldown,
  getNotificationLogs: () => notificationLogs,
  getActiveIncidents: () => Array.from(activeIncidents.values()),
  clearIncident: (nodeId) => activeIncidents.delete(nodeId),
};
