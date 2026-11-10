/**
 * ==============================================================================
 * MARISLINK: Real-Time Virtual Hardware & IoT Telemetry Subsystem
 * ==============================================================================
 * Manages virtual ESP32 hardware telemetry ingestion, validation, deduplication,
 * persistent storage (CSV, DATA _SETmarislink, Supabase), and live status tracking.
 * ==============================================================================
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const datasetStorage = require('./dataset-storage');

const router = express.Router();

const CANONICAL_PROJECT_ROOT = '/home/mounish/project/ProjectAM/agile methology';
const PROJECT_ROOT = fs.existsSync(CANONICAL_PROJECT_ROOT) ? CANONICAL_PROJECT_ROOT : path.resolve(__dirname, '..');
const LIVE_DATASET_PATH = path.join(PROJECT_ROOT, 'data', 'spark-datasets', 'live_device_telemetry.csv');
const HARDWARE_ARCHIVE_DIR = path.join(datasetStorage.DATA_STORE_ROOT, 'hardware_telemetry');

// Ensure hardware archive directory exists
if (!fs.existsSync(HARDWARE_ARCHIVE_DIR)) {
  try {
    fs.mkdirSync(HARDWARE_ARCHIVE_DIR, { recursive: true });
  } catch (err) {
    console.warn('[HARDWARE] Could not create archive dir:', err.message);
  }
}

// In-memory real-time sliding buffer and node metrics
const MAX_HISTORY = 120;
const history = [];
let latestReading = null;
let lastHeartbeat = null;
let packetCount = 0;
let wokwiPacketCount = 0;
let fallbackPacketCount = 0;
let duplicateCount = 0;
let lastSequenceNumber = null;
let lastTimestampString = null;
const serverStartTime = Date.now();

/**
 * Validates incoming hardware sensor telemetry payload
 */
function validateHardwarePayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Hardware payload must be a JSON object.' };
  }

  const rawNodeId = body.node_id || body.nodeId;
  if (!rawNodeId || typeof rawNodeId !== 'string' || rawNodeId.trim() === '') {
    return { valid: false, error: 'node_id is required and must be a non-empty string.' };
  }

  const parseNum = (val, min, max, name, def = 0) => {
    if (val === undefined || val === null || val === '') return { val: def };
    const num = Number(val);
    if (Number.isNaN(num)) return { error: `${name} must be a valid number.` };
    if (min !== null && num < min) return { error: `${name} must be >= ${min}.` };
    if (max !== null && num > max) return { error: `${name} must be <= ${max}.` };
    return { val: Math.round(num * 1000) / 1000 };
  };

  const tempRes = parseNum(body.temperature_c ?? body.temperature, -10, 60, 'temperature_c', 3.4);
  if (tempRes.error) return { valid: false, error: tempRes.error };

  const pressRes = parseNum(body.pressure_mpa ?? body.pressure, 0, 1500, 'pressure_mpa', 20.35);
  if (pressRes.error) return { valid: false, error: pressRes.error };

  const rawPressRes = parseNum(body.raw_sensor_hpa ?? body.raw_pressure, 100, 2000, 'raw_sensor_hpa', 1013.25);
  if (rawPressRes.error) return { valid: false, error: rawPressRes.error };

  const depthRes = parseNum(body.depth_m ?? body.depth, 0, 12000, 'depth_m', 2000.0);
  if (depthRes.error) return { valid: false, error: depthRes.error };

  const batVoltRes = parseNum(body.battery_voltage_v ?? body.battery_voltage, 0, 12, 'battery_voltage_v', 4.10);
  if (batVoltRes.error) return { valid: false, error: batVoltRes.error };

  const batLvlRes = parseNum(body.battery_level ?? body.batteryLevel, 0, 100, 'battery_level', 95.0);
  if (batLvlRes.error) return { valid: false, error: batLvlRes.error };

  const sigRes = parseNum(body.signal_strength ?? body.signalStrength, -150, 0, 'signal_strength', -68.0);
  if (sigRes.error) return { valid: false, error: sigRes.error };

  const latRes = parseNum(body.latency_ms ?? body.latency, 0, 100000, 'latency_ms', 140.0);
  if (latRes.error) return { valid: false, error: latRes.error };

  const lossRes = parseNum(body.packet_loss ?? body.packetLoss, 0, 100, 'packet_loss', 2.5);
  if (lossRes.error) return { valid: false, error: lossRes.error };

  const sequence = typeof body.sequence === 'number' ? body.sequence : (packetCount + 1);
  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const timestamp = body.timestamp || body.recorded_at || body.recordedAt || nowIso;
  const commStatus = body.communication_status || body.communicationStatus || 'OPTIMAL';
  const nodeStatus = body.node_status || body.nodeStatus || 'ACTIVE';

  return {
    valid: true,
    data: {
      node_id: rawNodeId.trim(),
      device_name: body.device_name || 'Virtual ESP32 Acoustic Node',
      sequence,
      timestamp,
      depth_m: depthRes.val,
      temperature_c: tempRes.val,
      pressure_mpa: pressRes.val,
      raw_sensor_hpa: rawPressRes.val,
      battery_voltage_v: batVoltRes.val,
      battery_level: batLvlRes.val,
      signal_strength: sigRes.val,
      latency_ms: latRes.val,
      packet_loss: lossRes.val,
      communication_status: String(commStatus).slice(0, 32),
      node_status: String(nodeStatus).slice(0, 32),
      source: (body.source === 'wokwi-esp32-firmware' || body.firmware_type === 'EMBEDDED_C_CPP')
        ? 'wokwi-esp32-firmware'
        : 'nodejs-virtual-hardware-fallback',
      source_label: (body.source === 'wokwi-esp32-firmware' || body.firmware_type === 'EMBEDDED_C_CPP')
        ? 'ACTUAL WOKWI FIRMWARE TELEMETRY'
        : 'NODE.JS VIRTUAL HARDWARE FALLBACK',
      is_actual_wokwi: Boolean(body.source === 'wokwi-esp32-firmware' || body.firmware_type === 'EMBEDDED_C_CPP'),
      firmware_type: body.firmware_type || ((body.source === 'wokwi-esp32-firmware') ? 'EMBEDDED_C_CPP' : 'NODEJS_ENGINE_FALLBACK'),
      hardware_execution: body.hardware_execution || ((body.source === 'wokwi-esp32-firmware') ? 'WOKWI_SIMULATED_CHIP' : 'HOST_ENGINE_FALLBACK'),
      measurement_type: 'SIMULATED_VIRTUAL_HARDWARE',
      calibration_model: 'BMP_ATMOSPHERIC_TO_HYDROSTATIC_TRANSFER_FN',
      leds: body.leds || { tx_green: true, sync_yellow: true, alert_red: false },
      received_at: new Date().toISOString(),
    },
  };
}

/**
 * Appends a validated hardware reading to the live CSV dataset for Apache Spark
 */
function appendToLiveSparkCsv(record) {
  try {
    const csvRow = `${record.node_id},${record.timestamp},${record.depth_m},${record.temperature_c},${record.pressure_mpa},${record.battery_level},${record.signal_strength},${record.latency_ms},${record.packet_loss},${record.communication_status},${record.node_status}\n`;
    
    // Ensure header exists if file doesn't
    if (!fs.existsSync(LIVE_DATASET_PATH)) {
      const header = 'node_id,timestamp,depth_m,temperature_c,pressure_mpa,battery_level,signal_strength,latency_ms,packet_loss,communication_status,node_status\n';
      fs.writeFileSync(LIVE_DATASET_PATH, header, 'utf8');
    }
    fs.appendFileSync(LIVE_DATASET_PATH, csvRow, 'utf8');
  } catch (err) {
    console.warn('[HARDWARE] Failed to append to live Spark CSV:', err.message);
  }
}

/**
 * Periodically or on each batch, syncs records to permanent date-wise storage
 */
let pendingArchiveRecords = [];
function archiveHardwareRecord(record) {
  pendingArchiveRecords.push(record);
  if (pendingArchiveRecords.length >= 3) {
    flushPendingArchive();
  }
}
setInterval(flushPendingArchive, 5000);

function flushPendingArchive() {
  if (pendingArchiveRecords.length === 0) return;
  const recordsToFlush = [...pendingArchiveRecords];
  pendingArchiveRecords = [];

  try {
    const { dateStr } = datasetStorage.getKolkataTime();
    const folders = datasetStorage.ensureDateFoldersExist(dateStr);
    const archiveFile = path.join(folders.generatedDir, `esp32_hardware_telemetry_${dateStr.replace(/-/g, '')}.csv`);

    const hasHeader = fs.existsSync(archiveFile);
    let csvContent = '';
    if (!hasHeader) {
      csvContent += 'node_id,timestamp,depth_m,temperature_c,pressure_mpa,raw_sensor_hpa,battery_voltage_v,battery_level,signal_strength,latency_ms,packet_loss,communication_status,node_status,source,measurement_type\n';
    }

    recordsToFlush.forEach((r) => {
      csvContent += `${r.node_id},${r.timestamp},${r.depth_m},${r.temperature_c},${r.pressure_mpa},${r.raw_sensor_hpa},${r.battery_voltage_v},${r.battery_level},${r.signal_strength},${r.latency_ms},${r.packet_loss},${r.communication_status},${r.node_status},${r.source},${r.measurement_type}\n`;
    });

    fs.appendFileSync(archiveFile, csvContent, 'utf8');
  } catch (err) {
    console.warn('[HARDWARE] Failed to write date archive:', err.message);
  }
}

/**
 * Safely attempts Supabase persistence without failing if offline
 */
async function trySupabasePersist(record, supabaseClient) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('telemetry_readings').insert([{
      node_id: record.node_id,
      recorded_at: new Date(record.timestamp).toISOString(),
      depth_m: record.depth_m,
      temperature_c: record.temperature_c,
      pressure_mpa: record.pressure_mpa,
      battery_level: record.battery_level,
      signal_strength: record.signal_strength,
      latency_ms: record.latency_ms,
      packet_loss: record.packet_loss,
      communication_status: record.communication_status,
      node_status: record.node_status,
      source: record.source,
    }]);
  } catch {
    // Gracefully ignore network or sandbox transport errors
  }
}

// ── 1. POST /api/hardware/telemetry (Live Hardware Ingestion) ─────────────────
router.post('/telemetry', async (req, res) => {
  const validation = validateHardwarePayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ ok: false, error: validation.error });
  }

  const record = validation.data;

  // Deduplication check: compare sequence & timestamp
  if (record.sequence === lastSequenceNumber && record.timestamp === lastTimestampString) {
    duplicateCount++;
    return res.status(200).json({
      ok: true,
      deduplicated: true,
      message: 'Duplicate reading ignored.',
      sequence: record.sequence,
    });
  }

  lastSequenceNumber = record.sequence;
  lastTimestampString = record.timestamp;
  lastHeartbeat = Date.now();
  packetCount++;
  if (record.is_actual_wokwi) {
    wokwiPacketCount++;
  } else {
    fallbackPacketCount++;
  }
  latestReading = record;

  // Add to sliding historical window
  history.push(record);
  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  // 1. Append to Spark live CSV
  appendToLiveSparkCsv(record);

  // 2. Archive to permanent dataset storage
  archiveHardwareRecord(record);

  // 3. Try Supabase asynchronously (non-blocking)
  const getSupabase = req.app.get('getSupabaseClient');
  if (typeof getSupabase === 'function') {
    const client = getSupabase();
    if (client) {
      trySupabasePersist(record, client).catch(() => {});
    }
  }

  return res.status(201).json({
    ok: true,
    message: 'Virtual hardware telemetry ingested successfully.',
    sequence: record.sequence,
    packetCount,
    timestamp: record.timestamp,
    data: record,
  });
});

// ── 2. GET /api/hardware/status (Hardware Connection & Health State) ──────────
router.get('/status', (req, res) => {
  const now = Date.now();
  let connectionStatus = 'DISCONNECTED';
  let secondsSinceHeartbeat = null;

  if (lastHeartbeat) {
    secondsSinceHeartbeat = Math.round((now - lastHeartbeat) / 100) / 10;
    if (secondsSinceHeartbeat <= 10.0) {
      connectionStatus = 'ONLINE';
    } else if (secondsSinceHeartbeat <= 30.0) {
      connectionStatus = 'STALE';
    } else {
      connectionStatus = 'DISCONNECTED';
    }
  }

  return res.json({
    ok: true,
    nodeId: 'ESP32-UW01',
    deviceName: 'Virtual ESP32 Deep Acoustic Node',
    connectionStatus,
    isLiveStreaming: connectionStatus === 'ONLINE',
    lastHeartbeat: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : null,
    secondsSinceHeartbeat,
    packetCount,
    wokwiPacketCount,
    fallbackPacketCount,
    isActualWokwi: latestReading ? Boolean(latestReading.is_actual_wokwi) : false,
    currentSource: latestReading ? latestReading.source : null,
    currentSourceLabel: latestReading ? latestReading.source_label : null,
    duplicateCount,
    historySize: history.length,
    latestReading,
    calibration: {
      sensorModel: 'BMP280 Digital Barometric / Pressure Transducer',
      physicalSensorRange: '300 - 1100 hPa (Atmospheric Chamber)',
      calibratedHydrostaticRange: '18 - 22 MPa (Modeled 2000m Depth)',
      transferFunction: 'P_ocean = (Depth * rho * g) / 10^7 + Delta(P_sensor)',
      measurementType: 'SIMULATED_VIRTUAL_HARDWARE',
    },
    systemUptimeSec: Math.round((now - serverStartTime) / 1000),
  });
});

// ── 3. GET /api/hardware/history (Time-Series Readings for Charts) ─────────────
router.get('/history', (req, res) => {
  const limit = Math.min(MAX_HISTORY, Math.max(1, Number(req.query.limit || 50)));
  const sliced = history.slice(-limit);

  return res.json({
    ok: true,
    nodeId: 'ESP32-UW01',
    count: sliced.length,
    limit,
    readings: sliced,
  });
});

// ── 4. POST /api/hardware/reset (Reset State For Fresh Demonstration) ──────────
router.post('/reset', (req, res) => {
  flushPendingArchive();
  history.length = 0;
  latestReading = null;
  lastHeartbeat = null;
  packetCount = 0;
  wokwiPacketCount = 0;
  fallbackPacketCount = 0;
  duplicateCount = 0;
  lastSequenceNumber = null;
  lastTimestampString = null;

  return res.json({
    ok: true,
    message: 'Virtual hardware monitoring state has been reset.',
  });
});

module.exports = router;
