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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const PORT = Number(process.env.PORT || 5000);

const app = express();

// ── Application Firewall & Security Headers ──────────────────────────────────
// Helmet adds HTTP security headers (XSS filtering, Content-Type sniffing prevention, Frameguard)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible dashboard visual assets
    crossOriginEmbedderPolicy: false,
  })
);

// ── Controlled CORS Policy (Prevents Cross-Site Exploitation) ──────────────────
const allowedOriginRegex = /^(https:\/\/deep-ocean-acoustic-network[a-z0-9-]*\.vercel\.app|http:\/\/localhost:[0-9]+|http:\/\/127\.0\.0\.1:[0-9]+)$/;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, health checks, or authorized origins
      if (!origin || allowedOriginRegex.test(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Cross-Origin Request Blocked by MARISLINK Firewall'));
      }
    },
    credentials: true,
  })
);

// ── Rate Limiter (Defends Against DDoS, Brute Force & API Abuse) ───────────────
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // Limit each IP to 600 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', globalApiLimiter);

// Dedicated strict limiter for Twilio notification endpoints (prevents spam calls & cost abuse)
const emergencyAlertLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Max 20 notification triggers per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Emergency alert dispatch rate limit reached. Please wait before retrying.' },
});
app.use('/api/notify/failure', emergencyAlertLimiter);
app.use('/api/notify/test', emergencyAlertLimiter);

app.use(express.json({ limit: '128kb' }));

// ── Twilio Emergency Notification Service ────────────────────────────────────
const notificationService = require('./notification-service');

function credentialsConfigured() {
  return notificationService.isConfigured();
}

function getTwilioClient() {
  return notificationService.getTwilioClient();
}

// ── Big Data & Spark Pipeline Routes ──────────────────────────────────────────
const sparkRouter = require('./spark-routes');
app.use('/api/spark', sparkRouter);

// ── Virtual Hardware & IoT Telemetry Routes ───────────────────────────────────
const hardwareRouter = require('./hardware-telemetry');
app.use('/api/hardware', hardwareRouter);

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
app.set('getSupabaseClient', getSupabaseClient);

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

// ── POST /api/notify/failure (Twilio emergency alert workflow) ────────────────
app.post('/api/notify/failure', async (req, res) => {
  const { nodeId, status, message, enableVoiceCall, force } = req.body || {};

  // ---- backend validation ----
  if (typeof nodeId !== 'string' || nodeId.trim() === '') {
    return res.status(400).json({ ok: false, error: 'nodeId is required and must be a non-empty string.' });
  }
  if (nodeId.length > 64) {
    return res.status(400).json({ ok: false, error: 'nodeId is too long (max 64 characters).' });
  }

  if (!credentialsConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'Twilio is not configured on the server. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER and MARISLINK_ALERT_RECIPIENT.',
    });
  }

  const result = await notificationService.sendEmergencyAlert({
    nodeId,
    status,
    message,
    enableVoiceCall: enableVoiceCall !== false,
    force: force === true,
  });

  const httpStatus = typeof result.statusCode === 'number'
    ? result.statusCode
    : (typeof result.status === 'number' ? result.status : (result.ok ? 200 : 502));
  return res.status(httpStatus).json(result);
});

// ── GET /api/notify/status (Inspect Twilio connection & active incident states) ─
app.get('/api/notify/status', (req, res) => {
  const status = notificationService.getNotificationStatus();
  return res.json(status);
});

// ── POST /api/notify/test (Controlled non-disruptive integration verification) ─
app.post('/api/notify/test', async (req, res) => {
  const { type = 'both' } = req.body || {};
  const allowed = ['verify', 'sms', 'call', 'both'];
  if (!allowed.includes(type)) {
    return res.status(400).json({
      ok: false,
      error: `Invalid test type '${type}'. Allowed: ${allowed.join(', ')}`,
    });
  }

  const result = await notificationService.sendTestNotification({ type });
  const httpStatus = typeof result.statusCode === 'number'
    ? result.statusCode
    : (typeof result.status === 'number' ? result.status : (result.ok ? 200 : 502));
  return res.status(httpStatus).json(result);
});

// ── POST /api/notify/recovery (Node operational recovery notice) ───────────────
app.post('/api/notify/recovery', async (req, res) => {
  const { nodeId, previousStatus, message } = req.body || {};
  if (typeof nodeId !== 'string' || nodeId.trim() === '') {
    return res.status(400).json({ ok: false, error: 'nodeId is required and must be a non-empty string.' });
  }

  const result = await notificationService.sendRecoveryAlert({
    nodeId: nodeId.trim(),
    previousStatus,
    message,
  });

  const httpStatus = typeof result.statusCode === 'number'
    ? result.statusCode
    : (typeof result.status === 'number' ? result.status : (result.ok ? 200 : 500));
  return res.status(httpStatus).json(result);
});

// ── GET /api/notify/logs (Recent audit logs with masked phone numbers) ────────
app.get('/api/notify/logs', (req, res) => {
  const logs = notificationService.getNotificationLogs();
  const rawLimit = Number(req.query.limit || 50);
  const limit = Math.max(1, Math.min(100, Number.isNaN(rawLimit) ? 50 : rawLimit));
  return res.json({
    ok: true,
    total: logs.length,
    limit,
    logs: logs.slice(0, limit),
  });
});

// ── Server listen ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[marislink-server] listening on http://localhost:${PORT} ` +
    `(twilio: ${credentialsConfigured()}, database: ${isDatabaseConfigured()})`
  );

  // Initialize MARISLINK Permanent Dataset Scheduler & Catch-up Engine
  try {
    const datasetScheduler = require('./dataset-scheduler');
    datasetScheduler.initScheduler();
  } catch (schedErr) {
    console.warn('[marislink-server] Scheduler init warning:', schedErr.message);
  }
});
