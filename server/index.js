// MARISLINK: Intelligent Underwater Acoustic Communication & Digital Twin
// Express backend:
// 1. Relays dashboard System Failure events to Twilio SMS + voice call.
// 2. Persists and queries underwater telemetry readings via Supabase PostgreSQL.
// All credentials remain server-side (dotenv). Never exposed to frontend.

const path = require('path');
// Canonical location is server/.env; fall back to cwd .env / real env vars.
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const PORT = Number(process.env.PORT || 5000);
const { TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM, ALERT_TO } = process.env;

const app = express();
app.use(cors());
app.use(express.json({ limit: '128kb' }));

// ── Twilio helpers ────────────────────────────────────────────────────────────
function credentialsConfigured() {
  return Boolean(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM && ALERT_TO);
}

function getTwilioClient() {
  // Required lazily so the server boots (and serves health/validation)
  // even when Twilio env vars are not configured.
  // eslint-disable-next-line global-require
  const twilio = require('twilio');
  return twilio(TWILIO_SID, TWILIO_TOKEN);
}

// ── Supabase configuration & client helper ────────────────────────────────────
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  return { url, key };
}

function isDatabaseConfigured() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

let supabaseClient = null;
let cachedClientKey = null;

class NoopWebSocket {}

function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  const clientKey = `${url}:::${key}`;
  if (!supabaseClient || cachedClientKey !== clientKey) {
    const { createClient } = require('@supabase/supabase-js');
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: NoopWebSocket },
    });
    cachedClientKey = clientKey;
  }
  return supabaseClient;
}

// ── Telemetry validation helper ───────────────────────────────────────────────
function validateTelemetryReading(item) {
  if (!item || typeof item !== 'object') {
    return { valid: false, error: 'Telemetry reading must be an object.' };
  }

  const rawNodeId = item.node_id || item.nodeId;
  if (typeof rawNodeId !== 'string' || rawNodeId.trim() === '') {
    return { valid: false, error: 'node_id is required and must be a non-empty string.' };
  }
  if (rawNodeId.length > 64) {
    return { valid: false, error: 'node_id exceeds maximum length of 64 characters.' };
  }

  const parseNum = (val, min, max, name) => {
    if (val === undefined || val === null || val === '') return { val: null };
    const num = Number(val);
    if (Number.isNaN(num)) return { error: `${name} must be a valid number.` };
    if (min !== null && num < min) return { error: `${name} must be >= ${min}.` };
    if (max !== null && num > max) return { error: `${name} must be <= ${max}.` };
    return { val: Math.round(num * 100) / 100 };
  };

  const depthRes = parseNum(item.depth_m ?? item.depth, 0, 15000, 'depth_m');
  if (depthRes.error) return { valid: false, error: depthRes.error };

  const tempRes = parseNum(item.temperature_c ?? item.temperature, -10, 60, 'temperature_c');
  if (tempRes.error) return { valid: false, error: tempRes.error };

  const pressRes = parseNum(item.pressure_mpa ?? item.pressure, 0, 1500, 'pressure_mpa');
  if (pressRes.error) return { valid: false, error: pressRes.error };

  const batteryRes = parseNum(item.battery_level ?? item.batteryLevel ?? item.secondaryBattery, 0, 100, 'battery_level');
  if (batteryRes.error) return { valid: false, error: batteryRes.error };

  const sigRes = parseNum(item.signal_strength ?? item.signalStrength, -200, 100, 'signal_strength');
  if (sigRes.error) return { valid: false, error: sigRes.error };

  const latRes = parseNum(item.latency_ms ?? item.latency, 0, 100000, 'latency_ms');
  if (latRes.error) return { valid: false, error: latRes.error };

  const lossRes = parseNum(item.packet_loss ?? item.packetLoss, 0, 100, 'packet_loss');
  if (lossRes.error) return { valid: false, error: lossRes.error };

  const commStatus = item.communication_status ?? item.communicationStatus ?? item.energyState ?? null;
  const nodeStatus = item.node_status ?? item.nodeStatus ?? item.status ?? null;
  const source = typeof item.source === 'string' && item.source.trim() ? item.source.trim().slice(0, 32) : 'simulation';

  let recordedAt = new Date().toISOString();
  if (item.recorded_at || item.recordedAt) {
    const parsedDate = new Date(item.recorded_at || item.recordedAt);
    if (!Number.isNaN(parsedDate.getTime())) {
      recordedAt = parsedDate.toISOString();
    }
  }

  return {
    valid: true,
    data: {
      node_id: rawNodeId.trim(),
      recorded_at: recordedAt,
      depth_m: depthRes.val,
      temperature_c: tempRes.val,
      pressure_mpa: pressRes.val,
      battery_level: batteryRes.val,
      signal_strength: sigRes.val,
      latency_ms: latRes.val,
      packet_loss: lossRes.val,
      communication_status: typeof commStatus === 'string' ? commStatus.slice(0, 64) : null,
      node_status: typeof nodeStatus === 'string' ? nodeStatus.slice(0, 64) : null,
      source,
    },
  };
}

// ── GET /api/health ───────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const dbConfigured = isDatabaseConfigured();
  let dbStatus = dbConfigured ? 'configured' : 'unconfigured';

  if (dbConfigured) {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('telemetry_readings').select('id').limit(1);
      if (error) {
        dbStatus = `error: ${error.message}`;
      } else {
        dbStatus = 'connected';
      }
    } catch (err) {
      dbStatus = `error: ${err && err.message ? err.message : 'connection failed'}`;
    }
  }

  res.json({
    ok: true,
    service: 'marislink-backend',
    twilioConfigured: credentialsConfigured(),
    databaseConfigured: dbConfigured,
    databaseStatus: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ── POST /api/telemetry (single reading) ──────────────────────────────────────
app.post('/api/telemetry', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'Supabase database is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in server environment.',
    });
  }

  const validation = validateTelemetryReading(req.body);
  if (!validation.valid) {
    return res.status(400).json({ ok: false, error: validation.error });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('telemetry_readings')
      .insert([validation.data])
      .select();

    if (error) {
      return res.status(500).json({ ok: false, error: `Database insert failed: ${error.message}` });
    }

    return res.status(201).json({
      ok: true,
      message: 'Telemetry reading persisted successfully.',
      data: data && data.length > 0 ? data[0] : validation.data,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: `Unexpected database error: ${err && err.message ? err.message : err}`,
    });
  }
});

// ── POST /api/telemetry/batch (bounded batch insertion) ───────────────────────
app.post('/api/telemetry/batch', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'Supabase database is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in server environment.',
    });
  }

  const rawList = Array.isArray(req.body) ? req.body : req.body?.readings;
  if (!Array.isArray(rawList)) {
    return res.status(400).json({ ok: false, error: 'Request body must be an array or contain a readings array.' });
  }

  if (rawList.length === 0) {
    return res.status(400).json({ ok: false, error: 'Readings array cannot be empty.' });
  }

  // Bound batch size to prevent payload exhaustion
  const MAX_BATCH = 50;
  if (rawList.length > MAX_BATCH) {
    return res.status(400).json({ ok: false, error: `Batch size exceeds maximum limit of ${MAX_BATCH} items.` });
  }

  const validatedRows = [];
  for (let i = 0; i < rawList.length; i++) {
    const result = validateTelemetryReading(rawList[i]);
    if (!result.valid) {
      return res.status(400).json({ ok: false, error: `Item at index ${i} is invalid: ${result.error}` });
    }
    validatedRows.push(result.data);
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('telemetry_readings')
      .insert(validatedRows)
      .select();

    if (error) {
      return res.status(500).json({ ok: false, error: `Batch insert failed: ${error.message}` });
    }

    return res.status(201).json({
      ok: true,
      count: validatedRows.length,
      data: data || validatedRows,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: `Unexpected database error: ${err && err.message ? err.message : err}`,
    });
  }
});

// ── GET /api/telemetry (retrieve recent telemetry readings) ───────────────────
app.get('/api/telemetry', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'Supabase database is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in server environment.',
    });
  }

  const rawLimit = Number(req.query.limit || 20);
  const limit = Math.max(1, Math.min(100, Number.isNaN(rawLimit) ? 20 : rawLimit));
  const nodeId = typeof req.query.nodeId === 'string' ? req.query.nodeId.trim() : typeof req.query.node_id === 'string' ? req.query.node_id.trim() : null;

  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('telemetry_readings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (nodeId) {
      query = query.eq('node_id', nodeId);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ ok: false, error: `Query failed: ${error.message}` });
    }

    return res.json({
      ok: true,
      count: data ? data.length : 0,
      limit,
      nodeId: nodeId || null,
      data: data || [],
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: `Unexpected database error: ${err && err.message ? err.message : err}`,
    });
  }
});

// ── POST /api/notify/failure (Twilio notification workflow) ───────────────────
app.post('/api/notify/failure', async (req, res) => {
  const { nodeId, status, message } = req.body || {};

  // ---- backend validation ----
  if (typeof nodeId !== 'string' || nodeId.trim() === '') {
    return res.status(400).json({ ok: false, error: 'nodeId is required and must be a non-empty string.' });
  }
  if (nodeId.length > 64) {
    return res.status(400).json({ ok: false, error: 'nodeId is too long (max 64 characters).' });
  }

  const safeNode = nodeId.trim();
  const safeStatus = typeof status === 'string' && status ? status.slice(0, 32) : 'CRITICAL';
  const safeMessage = typeof message === 'string' && message ? message.slice(0, 500) : 'Underwater node failure detected';

  if (!credentialsConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'Twilio is not configured on the server. Set TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM and ALERT_TO.',
    });
  }

  void safeNode;
  void safeStatus;
  void safeMessage;
  const smsBody = 'sms_appointment_reminders';
  const VOICE_TEMPLATE_URL = 'https://webhooks.twilio.com/v1/Voice/Template/voice_speech_recognition';

  const result = { ok: true, sms: null, call: null };
  const errors = [];

  try {
    const client = getTwilioClient();
    const sms = await client.messages.create({ from: TWILIO_FROM, to: ALERT_TO, body: smsBody });
    result.sms = { sid: sms.sid, status: sms.status };
  } catch (err) {
    errors.push(`SMS failed: ${err && err.message ? err.message : err}`);
  }

  try {
    const client = getTwilioClient();
    const call = await client.calls.create({
      from: TWILIO_FROM,
      to: ALERT_TO,
      url: VOICE_TEMPLATE_URL,
    });
    result.call = { sid: call.sid, status: call.status };
  } catch (err) {
    errors.push(`Call failed: ${err && err.message ? err.message : err}`);
  }

  if (!result.sms && !result.call) {
    return res.status(502).json({ ok: false, error: errors.join(' | ') || 'Twilio request failed.' });
  }
  if (errors.length > 0) {
    result.warning = errors.join(' | ');
  }
  return res.json(result);
});

// ── Server listen ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[marislink-server] listening on http://localhost:${PORT} ` +
    `(twilio: ${credentialsConfigured()}, database: ${isDatabaseConfigured()})`
  );
});
