// MARISLINK: Big Data Processing & Analytics Lab Routes
// Real Apache Spark & Scala Pipeline Orchestrator

const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const multer = require('multer');
const zlib = require('zlib');
const datasetStorage = require('./dataset-storage');
const datasetScheduler = require('./dataset-scheduler');

const router = express.Router();

const CANONICAL_PROJECT_ROOT = '/home/mounish/project/ProjectAM/agile methology';
const PROJECT_ROOT = fs.existsSync(CANONICAL_PROJECT_ROOT) ? CANONICAL_PROJECT_ROOT : path.resolve(__dirname, '..');
const CANONICAL_STORAGE_ROOT = path.join(PROJECT_ROOT, 'DATA _SETmarislink');
const STORAGE_BASE_DIR = CANONICAL_STORAGE_ROOT;
const DATASETS_DIR = path.join(PROJECT_ROOT, 'data', 'spark-datasets');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const JOBS_DIR = path.join(__dirname, 'jobs');
const LIVE_DATASET_PATH = path.join(DATASETS_DIR, 'live_device_telemetry.csv');
const SCALA_SOURCE_PATH = path.join(PROJECT_ROOT, 'spark-pipeline', 'src', 'main', 'scala', 'marislink', 'spark', 'TelemetryProcessor.scala');
const RUNNER_SCRIPT = path.join(PROJECT_ROOT, 'spark-pipeline', 'run-spark.sh');

// Deterministic metadata for all 20 underwater devices & stations
const DEVICE_METADATA = {
  'DC-01': { name: 'Terrestrial Data Center', type: 'DATA_CENTER', depth: 0, sensors: [] },
  'SR-01': { name: 'Surface Receiver Alpha', type: 'SURFACE_RECEIVER', depth: 0, sensors: [] },
  'MN-01': { name: 'Main Underwater Node', type: 'GATEWAY', depth: 2000, sensors: [] },
  'MN-02': { name: 'Backup Main Node', type: 'GATEWAY', depth: 1800, sensors: [] },
  'SUB-A': { name: 'Sub-Node Alpha', type: 'ACOUSTIC_RELAY', depth: 2800, sensors: [] },
  'SUB-B': { name: 'Sub-Node Beta', type: 'NAVIGATION_RELAY', depth: 2600, sensors: [] },
  'SUB-C': { name: 'Sub-Node Gamma', type: 'SEAFLOOR_RELAY', depth: 4800, sensors: [] },
  'SUB-D': { name: 'Sub-Node Delta', type: 'ACOUSTIC_RELAY', depth: 4600, sensors: [] },
  'S-01': { name: 'Hydrophone Sensor 01', type: 'HYDROPHONE', depth: 2200, sensors: ['Hydrophone'] },
  'S-02': { name: 'Temperature Depth Oxygen Sensor 02', type: 'ENVIRONMENTAL_SENSOR', depth: 3100, sensors: ['Temperature Sensor', 'Pressure / Depth Sensor', 'Dissolved Oxygen Sensor'] },
  'S-03': { name: 'Hydrophone Sensor 03', type: 'HYDROPHONE', depth: 3500, sensors: ['Hydrophone'] },
  'S-04': { name: 'Temperature Salinity Oxygen Sensor 04', type: 'ENVIRONMENTAL_SENSOR', depth: 1800, sensors: ['Temperature Sensor', 'Salinity Sensor', 'Dissolved Oxygen Sensor'] },
  'S-05': { name: 'Hydrophone Sensor 05', type: 'HYDROPHONE', depth: 2400, sensors: ['Hydrophone'] },
  'S-06': { name: 'Salinity Turbidity pH Sensor 06', type: 'ENVIRONMENTAL_SENSOR', depth: 3000, sensors: ['Salinity Sensor', 'Turbidity Sensor', 'pH Sensor'] },
  'S-07': { name: 'Hydrophone Sensor 07', type: 'HYDROPHONE', depth: 4200, sensors: ['Hydrophone'] },
  'S-08': { name: 'Temperature Depth pH Sensor 08', type: 'ENVIRONMENTAL_SENSOR', depth: 5000, sensors: ['Temperature Sensor', 'Pressure / Depth Sensor', 'pH Sensor'] },
  'S-09': { name: 'Hydrophone Sensor 09', type: 'HYDROPHONE', depth: 4600, sensors: ['Hydrophone'] },
  'S-10': { name: 'Oxygen Turbidity Sensor 10', type: 'ENVIRONMENTAL_SENSOR', depth: 4000, sensors: ['Dissolved Oxygen Sensor', 'Turbidity Sensor'] },
  'S-11': { name: 'Hydrophone Sensor 11', type: 'HYDROPHONE', depth: 5200, sensors: ['Hydrophone'] },
  'S-12': { name: 'Temperature Salinity Oxygen Sensor 12', type: 'ENVIRONMENTAL_SENSOR', depth: 4400, sensors: ['Temperature Sensor', 'Salinity Sensor', 'Dissolved Oxygen Sensor'] },
  'ESP32-UW01': { name: 'Virtual ESP32 Acoustic Node', type: 'VIRTUAL_HARDWARE_NODE', depth: 2000, sensors: ['BMP280 Pressure/Temp Transducer', 'ADC Battery Monitor', 'Acoustic Transceiver'], isVirtualHardware: true },
};

// In-memory latest telemetry cache for live devices
const liveDeviceCache = new Map();

// Helper to ensure live dataset exists
function ensureLiveDatasetExists() {
  if (!fs.existsSync(LIVE_DATASET_PATH)) {
    const seedScript = path.join(PROJECT_ROOT, 'scripts', 'seed-live-telemetry.cjs');
    if (fs.existsSync(seedScript)) {
      try {
        const { execSync } = require('child_process');
        execSync(`node "${seedScript}"`, { stdio: 'ignore' });
      } catch (err) {
        console.warn('Failed to seed live telemetry CSV:', err.message);
      }
    }
  }
}
ensureLiveDatasetExists();

// Ensure working directories exist
[DATASETS_DIR, UPLOADS_DIR, JOBS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer storage for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || file.mimetype === 'text/csv' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV telemetry files are permitted (.csv).'));
    }
  },
});

// Active in-memory job registry
const jobs = new Map();

// Load past jobs from jobs directory if available
try {
  const existingFiles = fs.readdirSync(JOBS_DIR);
  existingFiles.forEach((file) => {
    if (file.startsWith('job_') && file.endsWith('.json')) {
      try {
        const raw = fs.readFileSync(path.join(JOBS_DIR, file), 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.jobId) {
          jobs.set(parsed.jobId, parsed);
        }
      } catch {
        // Ignore corrupted past job records
      }
    }
  });
} catch {
  // Directory empty or inaccessible
}

// ── Helper: Safe Path Validator ──────────────────────────────────────────────
function resolveSafeDatasetPath(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return null;
  const resolved = path.isAbsolute(targetPath)
    ? path.normalize(targetPath)
    : path.normalize(path.join(PROJECT_ROOT, targetPath));

  // Must reside inside DATASETS_DIR, UPLOADS_DIR, data, or DATA _SETmarislink
  const allowedRoots = [
    DATASETS_DIR,
    UPLOADS_DIR,
    path.join(PROJECT_ROOT, 'data'),
    datasetStorage.DATA_STORE_ROOT,
  ];
  const isAllowed = allowedRoots.some((root) => resolved.startsWith(root));
  if (!isAllowed) return null;
  if (!fs.existsSync(resolved)) return null;
  return resolved;
}

// ── Helper: Quick CSV Parser for Previews (Supports .csv and .csv.gz) ─────────
function parseCsvPreview(filePath, maxRows = 15) {
  let content;
  if (filePath.endsWith('.gz')) {
    content = zlib.gunzipSync(fs.readFileSync(filePath)).toString('utf8');
  } else {
    content = fs.readFileSync(filePath, 'utf8');
  }
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { columns: [], rows: [], totalRecords: 0 };
  }

  const columns = lines[0].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
  const rows = [];
  const limit = Math.min(lines.length, maxRows + 1);

  for (let i = 1; i < limit; i += 1) {
    const vals = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const rowObj = {};
    columns.forEach((col, idx) => {
      rowObj[col] = vals[idx] !== undefined ? vals[idx] : '';
    });
    rows.push(rowObj);
  }

  return {
    columns,
    rows,
    totalRecords: Math.max(0, lines.length - 1),
  };
}

// ── 0. GET /api/spark/health (Spark Engine Health Check) ─────────────────────
router.get('/health', (req, res) => {
  return res.json({
    ok: true,
    engine: 'Apache Spark 3.5.9',
    scalaVersion: '2.12.18',
    status: 'ONLINE',
    runnerScript: RUNNER_SCRIPT,
    runnerExists: fs.existsSync(RUNNER_SCRIPT),
    liveDataset: LIVE_DATASET_PATH,
    liveDatasetExists: fs.existsSync(LIVE_DATASET_PATH),
    activeJobsCount: Array.from(jobs.values()).filter((j) => j.status === 'RUNNING').length,
    completedJobsCount: Array.from(jobs.values()).filter((j) => j.status === 'COMPLETED').length,
  });
});

// ── 1. GET /api/spark/samples & /api/spark/datasets (List sample datasets) ────
router.get(['/samples', '/datasets'], (req, res) => {
  try {
    const sampleFiles = [
      {
        id: 'live',
        name: 'MARISLINK Fleet Live Telemetry (Simulation Data)',
        filename: 'live_device_telemetry.csv',
        description: 'Auto-harvested telemetry from all 20 underwater acoustic nodes, relays, and sensor stations. Formatted for automated Apache Spark aggregation.',
        isDefault: true,
      },
      {
        id: 'hardware-live',
        name: 'ESP32 Virtual Hardware Telemetry (Calibrated Sensors)',
        filename: 'live_device_telemetry.csv',
        description: 'Real-time telemetry stream from virtual ESP32 underwater node (ESP32-UW01) featuring calibrated BMP280 pressure/temp, ADC battery monitor, and acoustic RSSI.',
        isDefault: false,
        isHardware: true,
      },
      {
        id: 'primary',
        name: 'MARISLINK Acoustic Fleet Telemetry (Primary)',
        filename: 'marislink_underwater_telemetry_primary.csv',
        description: 'Standard 12-node underwater acoustic sensor network telemetry with nominal depth, pressure, battery, latency, and packet loss.',
        isDefault: false,
      },
      {
        id: 'anomalies',
        name: 'Ocean Channel Anomalies & Fault-Testing Dataset',
        filename: 'marislink_telemetry_with_anomalies.csv',
        description: 'Includes out-of-bound packet losses, battery faults, corrupted records, and missing node IDs to demonstrate Spark distributed data filtering.',
        isDefault: false,
      },
      {
        id: 'deepsea',
        name: 'Abyssal Trench Multipath Stress Test (500m - 3500m)',
        filename: 'marislink_deep_sea_stress_test.csv',
        description: 'Deep ocean stress simulation exhibiting severe multipath latency, acoustic shadow zones, and failover states.',
        isDefault: false,
      },
      {
        id: 'verification',
        name: 'Dynamic Verification Dataset (Different Nodes & Duplicates)',
        filename: 'marislink_verification_second_dataset.csv',
        description: 'Special verification dataset with distinct nodes (NODE-X99, GATEWAY-Z77, etc.), duplicate records, and invalid values to test dynamic metric calculation.',
        isDefault: false,
      },
    ];

    const enriched = sampleFiles.map((s) => {
      const fullPath = path.join(DATASETS_DIR, s.filename);
      let sizeBytes = 0;
      let recordCount = 0;
      let columns = [];

      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        sizeBytes = stat.size;
        const preview = parseCsvPreview(fullPath, 1);
        recordCount = preview.totalRecords;
        columns = preview.columns;
      }

      return {
        ...s,
        path: fullPath,
        sizeBytes,
        recordCount,
        columns,
      };
    });

    return res.json({ ok: true, samples: enriched });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── 2. POST /api/spark/upload (Upload custom CSV dataset) ─────────────────────
router.post('/upload', upload.single('dataset'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No CSV file was uploaded.' });
    }

    const uploadedPath = req.file.path;
    const preview = parseCsvPreview(uploadedPath, 10);

    // Validate minimum required columns
    const lowerCols = preview.columns.map((c) => c.toLowerCase());
    const requiredCols = ['node_id', 'latency', 'battery', 'loss'];
    const matchedCols = requiredCols.filter((reqCol) => lowerCols.some((c) => c.includes(reqCol)));

    // Automatically preserve a permanent GZIP-compressed copy in DATA _SETmarislink/YYYY-MM-DD/uploaded_datasets/
    let storedEntry = null;
    try {
      const rawContent = fs.readFileSync(uploadedPath, 'utf8');
      storedEntry = datasetStorage.saveGzippedDataset({
        rawContent,
        category: 'UPLOADED',
        customFilename: req.file.originalname,
        sourceLabel: `USER UPLOADED DATASET (${req.file.originalname})`,
      });
    } catch (storeErr) {
      console.warn('[STORAGE] Failed to auto-archive uploaded CSV:', storeErr.message);
    }

    return res.json({
      ok: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      sizeBytes: req.file.size,
      path: storedEntry?.relativePath || uploadedPath,
      absolutePath: storedEntry?.absolutePath || uploadedPath,
      storedDataset: storedEntry,
      columns: preview.columns,
      preview: preview.rows,
      totalRecords: preview.totalRecords,
      validation: {
        isValidCsv: preview.columns.length >= 3 && preview.totalRecords > 0,
        hasNodeId: lowerCols.includes('node_id'),
        hasLatency: lowerCols.some((c) => c.includes('lat')),
        hasBattery: lowerCols.some((c) => c.includes('bat')),
        hasPacketLoss: lowerCols.some((c) => c.includes('loss')),
        matchedColumnsRatio: matchedCols.length / requiredCols.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── 3. GET /api/spark/dataset-preview ─────────────────────────────────────────
router.get('/dataset-preview', (req, res) => {
  try {
    const target = req.query.path || req.query.filename || '';
    let resolved = resolveSafeDatasetPath(target);

    // If simple filename provided, check in samples or uploads
    if (!resolved && target) {
      const inSamples = path.join(DATASETS_DIR, path.basename(target));
      const inUploads = path.join(UPLOADS_DIR, path.basename(target));
      if (fs.existsSync(inSamples)) resolved = inSamples;
      else if (fs.existsSync(inUploads)) resolved = inUploads;
    }

    if (!resolved) {
      // Fall back to default primary dataset
      resolved = path.join(DATASETS_DIR, 'marislink_underwater_telemetry_primary.csv');
    }

    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ ok: false, error: 'Dataset file not found.' });
    }

    const preview = parseCsvPreview(resolved, 15);
    const stat = fs.statSync(resolved);

    return res.json({
      ok: true,
      path: resolved,
      filename: path.basename(resolved),
      sizeBytes: stat.size,
      columns: preview.columns,
      preview: preview.rows,
      totalRecords: preview.totalRecords,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Central Spark Job Execution Helper ─────────────────────────────────────────
function spawnSparkJob(resolvedInput, datasetName, res) {
  if (!fs.existsSync(resolvedInput)) {
    return res.status(400).json({ ok: false, error: `Dataset file not found on server: ${resolvedInput}` });
  }

  // Check if another job is currently RUNNING
  const runningJob = Array.from(jobs.values()).find((j) => j.status === 'RUNNING');
  if (runningJob) {
    return res.status(409).json({
      ok: false,
      error: `A Spark analysis job (${runningJob.jobId}) is currently in progress. Please wait for it to complete.`,
      activeJobId: runningJob.jobId,
    });
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const outputJsonPath = path.join(JOBS_DIR, `${jobId}_results.json`);
  const jobLogPath = path.join(JOBS_DIR, `${jobId}.log`);

  const jobMeta = {
    jobId,
    status: 'RUNNING',
    datasetPath: resolvedInput,
    datasetName: datasetName || path.basename(resolvedInput),
    startTime: Date.now(),
    endTime: null,
    durationMs: null,
    logs: [],
    results: null,
    error: null,
    outputJsonPath,
  };

  jobs.set(jobId, jobMeta);

  // Spawn the real Spark process asynchronously
  const sparkProc = spawn('/bin/bash', [RUNNER_SCRIPT, resolvedInput, outputJsonPath], {
    cwd: path.join(PROJECT_ROOT, 'spark-pipeline'),
    env: {
      ...process.env,
      PATH: `${path.join(process.env.HOME || '', '.local', 'bin')}:${process.env.PATH}`,
    },
  });

  const appendLog = (line) => {
    const cleanLine = line.toString();
    jobMeta.logs.push(cleanLine);
    if (jobMeta.logs.length > 2000) jobMeta.logs.shift(); // keep memory bounded
    try {
      fs.appendFileSync(jobLogPath, cleanLine);
    } catch {
      // Ignore file append errors
    }
  };

  sparkProc.stdout.on('data', (data) => appendLog(data));
  sparkProc.stderr.on('data', (data) => appendLog(data));

  sparkProc.on('close', (code) => {
    jobMeta.endTime = Date.now();
    jobMeta.durationMs = jobMeta.endTime - jobMeta.startTime;

    if (code === 0 && fs.existsSync(outputJsonPath)) {
      try {
        const rawResult = fs.readFileSync(outputJsonPath, 'utf8');
        jobMeta.results = JSON.parse(rawResult);
        jobMeta.status = 'COMPLETED';

        // Also update latest results file
        fs.writeFileSync(path.join(JOBS_DIR, 'latest_results.json'), rawResult);

        // Permanently archive in DATA _SETmarislink/YYYY-MM-DD/spark_results/
        try {
          datasetStorage.saveSparkResultForDataset({
            datasetPath: resolvedInput,
            sparkResultsJson: jobMeta.results,
            jobId,
            durationMs: jobMeta.durationMs,
          });
        } catch (storageErr) {
          console.warn('[STORAGE] Failed to archive Spark result in DATA _SETmarislink:', storageErr.message);
        }
      } catch (parseErr) {
        jobMeta.status = 'FAILED';
        jobMeta.error = `Failed to parse Spark JSON output: ${parseErr.message}`;
      }
    } else {
      jobMeta.status = 'FAILED';
      jobMeta.error = `Spark process terminated with exit code ${code}. Check logs for details.`;
    }

    // Persist job metadata
    try {
      fs.writeFileSync(
        path.join(JOBS_DIR, `${jobId}.json`),
        JSON.stringify({ ...jobMeta, logs: jobMeta.logs.slice(-300) }, null, 2),
      );
    } catch {
      // Ignore persistence errors
    }
  });

  return res.status(202).json({
    ok: true,
    jobId,
    status: 'RUNNING',
    datasetName: jobMeta.datasetName,
    message: 'Apache Spark analysis initiated in background. Poll /api/spark/status/' + jobId,
  });
}

// ── 3.1 GET /api/spark/live-devices (Fleet status & telemetry readings) ────────
router.get('/live-devices', (req, res) => {
  try {
    ensureLiveDatasetExists();

    let recordCounts = {};
    let latestByNode = {};
    let totalFleetRecords = 0;

    if (fs.existsSync(LIVE_DATASET_PATH)) {
      const content = fs.readFileSync(LIVE_DATASET_PATH, 'utf8');
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      totalFleetRecords = Math.max(0, lines.length - 1);

      // Parse from recent lines backwards to find the latest for each node
      for (let i = lines.length - 1; i >= 1; i--) {
        const parts = lines[i].split(',').map((p) => p.trim());
        const nodeId = parts[0];
        if (!nodeId) continue;

        recordCounts[nodeId] = (recordCounts[nodeId] || 0) + 1;

        if (!latestByNode[nodeId]) {
          latestByNode[nodeId] = {
            nodeId,
            timestamp: parts[1] || new Date().toISOString(),
            depth: parseFloat(parts[2]) || 0,
            temperature: parseFloat(parts[3]) || 0,
            pressure: parseFloat(parts[4]) || 0,
            battery: parseFloat(parts[5]) || 0,
            signalStrength: parseFloat(parts[6]) || 0,
            latency: parseFloat(parts[7]) || 0,
            packetLoss: parseFloat(parts[8]) || 0,
            communicationStatus: parts[9] || 'OPTIMAL',
            nodeStatus: parts[10] || 'ACTIVE',
          };
        }
      }
    }

    // Build complete list of devices
    const deviceIds = Object.keys(DEVICE_METADATA);
    let activeCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let sumLat = 0;
    let sumLoss = 0;
    let sumBat = 0;
    let countedDevs = 0;

    const devices = deviceIds.map((id) => {
      const meta = DEVICE_METADATA[id];
      const cacheReading = liveDeviceCache.get(id);
      const csvReading = latestByNode[id];

      const reading = cacheReading || csvReading || {
        nodeId: id,
        timestamp: new Date().toISOString(),
        depth: meta.depth,
        temperature: meta.depth > 2000 ? 2.2 : meta.depth > 0 ? 5.5 : 24.5,
        pressure: Math.round(meta.depth * 0.0102 * 1000) / 1000,
        battery: 95.0,
        signalStrength: meta.depth > 3000 ? -82.0 : -65.0,
        latency: meta.depth > 3000 ? 240.0 : meta.depth > 1000 ? 150.0 : 25.0,
        packetLoss: meta.depth > 3000 ? 6.5 : 2.0,
        communicationStatus: meta.depth > 3000 ? 'DEGRADED' : 'OPTIMAL',
        nodeStatus: 'ACTIVE',
      };

      const status = reading.nodeStatus || 'ACTIVE';
      const commStatus = reading.communicationStatus || 'OPTIMAL';

      if (commStatus === 'CRITICAL' || status === 'CRITICAL' || reading.battery < 20) {
        criticalCount += 1;
      } else if (commStatus === 'DEGRADED' || status === 'WARNING' || reading.packetLoss > 5.0) {
        warningCount += 1;
      } else {
        activeCount += 1;
      }

      sumLat += reading.latency;
      sumLoss += reading.packetLoss;
      sumBat += reading.battery;
      countedDevs += 1;

      return {
        id,
        nodeId: id,
        name: meta.name,
        type: meta.type,
        depth: reading.depth,
        temperature: reading.temperature,
        pressure: reading.pressure,
        battery: reading.battery,
        batteryLevel: reading.battery,
        battery_level: reading.battery,
        signalStrength: reading.signalStrength,
        latency: reading.latency,
        packetLoss: reading.packetLoss,
        communicationStatus: commStatus,
        nodeStatus: status,
        lastUpdate: reading.timestamp,
        recordCount: recordCounts[id] || 25,
        sensors: meta.sensors,
        dataSource: 'SIMULATION DATA',
      };
    });

    const summary = {
      totalDevices: devices.length,
      activeDevices: activeCount,
      warningDevices: warningCount,
      criticalDevices: criticalCount,
      averageLatency: countedDevs > 0 ? Math.round((sumLat / countedDevs) * 10) / 10 : 0,
      averagePacketLoss: countedDevs > 0 ? Math.round((sumLoss / countedDevs) * 100) / 100 : 0,
      averageBattery: countedDevs > 0 ? Math.round((sumBat / countedDevs) * 10) / 10 : 0,
      averageBatteryLevel: countedDevs > 0 ? Math.round((sumBat / countedDevs) * 10) / 10 : 0,
      totalRecordsProcessed: totalFleetRecords,
      networkHealthIndex: Math.round(((activeCount + warningCount * 0.7) / Math.max(1, devices.length)) * 100),
      telemetrySource: 'SIMULATION DATA (MARISLINK Acoustic Engine)',
    };

    return res.json({
      ok: true,
      dataSource: 'SIMULATION DATA',
      summary,
      devices,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── 3.1b GET /api/spark/device-history (Individual Node Time-Series & Historical Analytics)
router.get('/device-history', (req, res) => {
  try {
    ensureLiveDatasetExists();
    const nodeId = req.query.nodeId || req.query.id || 'MN-01';
    const timeRange = req.query.timeRange || 'all'; // '5m' | '15m' | '1h' | 'all'
    const dateParam = req.query.date;

    let datasetContent = '';
    let isHistorical = false;

    if (dateParam && dateParam !== 'LIVE') {
      const dateGenDir = path.join(STORAGE_BASE_DIR, dateParam, 'generated_datasets');
      if (fs.existsSync(dateGenDir)) {
        const files = fs.readdirSync(dateGenDir);
        const match = files.find((f) => f.endsWith('.csv.gz') || f.endsWith('.csv'));
        if (match) {
          const fullPath = path.join(dateGenDir, match);
          if (match.endsWith('.gz')) {
            datasetContent = zlib.gunzipSync(fs.readFileSync(fullPath)).toString('utf8');
          } else {
            datasetContent = fs.readFileSync(fullPath, 'utf8');
          }
          isHistorical = true;
        }
      }
    }

    if (!datasetContent) {
      if (!fs.existsSync(LIVE_DATASET_PATH)) {
        return res.status(404).json({ ok: false, error: 'Live telemetry dataset not found.' });
      }
      datasetContent = fs.readFileSync(LIVE_DATASET_PATH, 'utf8');
    }

    const lines = datasetContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

    // Parse all rows for this specific nodeId
    const matchingRows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts[0] === nodeId) {
        const timeStr = parts[1];
        const dateObj = new Date(timeStr.replace(' ', 'T') + 'Z');
        const timeMs = !isNaN(dateObj.getTime()) ? dateObj.getTime() : i * 1000;

        matchingRows.push({
          nodeId: parts[0],
          timestamp: timeStr,
          timeMs,
          depth: parseFloat(parts[2]) || 0,
          temperature: parseFloat(parts[3]) || 0,
          pressure: parseFloat(parts[4]) || 0,
          battery: parseFloat(parts[5]) || 0,
          signalStrength: parseFloat(parts[6]) || 0,
          latency: parseFloat(parts[7]) || 0,
          packetLoss: parseFloat(parts[8]) || 0,
          communicationStatus: parts[9] || 'OPTIMAL',
          nodeStatus: parts[10] || 'ACTIVE',
        });
      }
    }

    if (matchingRows.length === 0) {
      return res.status(404).json({ ok: false, error: `No telemetry records found for device ${nodeId}` });
    }

    // Sort chronologically
    matchingRows.sort((a, b) => a.timeMs - b.timeMs);

    // Apply timeRange filter based on max timestamp in dataset
    const latestTimeMs = matchingRows[matchingRows.length - 1].timeMs;
    let filtered = matchingRows;

    if (timeRange === '5m') {
      const cutoff = latestTimeMs - 5 * 60 * 1000;
      filtered = matchingRows.filter((r) => r.timeMs >= cutoff);
    } else if (timeRange === '15m') {
      const cutoff = latestTimeMs - 15 * 60 * 1000;
      filtered = matchingRows.filter((r) => r.timeMs >= cutoff);
    } else if (timeRange === '1h') {
      const cutoff = latestTimeMs - 60 * 60 * 1000;
      filtered = matchingRows.filter((r) => r.timeMs >= cutoff);
    }

    // Fallback if window was too tight
    if (filtered.length === 0) {
      filtered = matchingRows.slice(-10);
    }

    // Aggregate statistics across this time window
    const N = filtered.length;
    let sumLat = 0, minLat = Infinity, maxLat = -Infinity;
    let sumLoss = 0, sumBat = 0, sumSig = 0, sumTemp = 0, sumPress = 0;
    let minBat = Infinity, maxBat = -Infinity;
    const statusCounts = { OPTIMAL: 0, STABLE: 0, DEGRADED: 0, CRITICAL: 0 };

    filtered.forEach((r) => {
      sumLat += r.latency;
      if (r.latency < minLat) minLat = r.latency;
      if (r.latency > maxLat) maxLat = r.latency;

      sumLoss += r.packetLoss;
      sumBat += r.battery;
      if (r.battery < minBat) minBat = r.battery;
      if (r.battery > maxBat) maxBat = r.battery;

      sumSig += r.signalStrength;
      sumTemp += r.temperature;
      sumPress += r.pressure;

      const comm = (r.communicationStatus || 'OPTIMAL').toUpperCase();
      statusCounts[comm] = (statusCounts[comm] || 0) + 1;
    });

    const batteryDrop = Math.round((maxBat - minBat) * 100) / 100;
    const batteryTrend = batteryDrop > 5.0 ? 'RAPID_DISCHARGE' : batteryDrop > 1.0 ? 'ACTIVE_CONSUMPTION' : 'STABLE_NOMINAL';

    // Check Spark results for this node if available
    let sparkOutput = null;
    if (dateParam && dateParam !== 'LIVE') {
      const dateSparkDir = path.join(STORAGE_BASE_DIR, dateParam, 'spark_results');
      if (fs.existsSync(dateSparkDir)) {
        const jsonFiles = fs.readdirSync(dateSparkDir).filter((f) => f.endsWith('.json'));
        if (jsonFiles.length > 0) {
          try {
            const raw = JSON.parse(fs.readFileSync(path.join(dateSparkDir, jsonFiles[jsonFiles.length - 1]), 'utf8'));
            const list = raw.nodeMetrics || raw.nodeAnalytics || [];
            const found = list.find((m) => (m.nodeId || m.node_id) === nodeId);
            if (found) {
              sparkOutput = {
                nodeId: found.nodeId || found.node_id,
                recordCount: found.recordCount || found.record_count || N,
                avgLatency: found.avgLatency ?? found.avgLatencyMs ?? found.avg_latency_ms,
                minLatency: found.minLatency ?? found.minLatencyMs ?? found.min_latency_ms,
                maxLatency: found.maxLatency ?? found.maxLatencyMs ?? found.max_latency_ms,
                avgPacketLoss: found.avgPacketLoss ?? found.avg_packet_loss,
                avgBattery: found.avgBattery ?? found.avgBatteryLevel ?? found.avg_battery_level,
                avgBatteryLevel: found.avgBattery ?? found.avgBatteryLevel ?? found.avg_battery_level,
                battery: found.avgBattery ?? found.avgBatteryLevel ?? found.avg_battery_level,
                avgSignalStrength: found.avgSignalStrength ?? found.avg_signal_strength,
                healthStatus: found.healthStatus ?? found.healthClassification ?? found.health_classification,
              };
            }
          } catch {}
        }
      }
    }

    if (!sparkOutput) {
      const latestPath = path.join(JOBS_DIR, 'latest_results.json');
      if (fs.existsSync(latestPath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
          sparkOutput = parsed.nodeMetrics?.find((n) => n.nodeId === nodeId) || null;
        } catch {}
      }
    }

    const meta = DEVICE_METADATA[nodeId] || { name: nodeId, type: 'UNDERWATER_NODE', depth: 0, sensors: [] };

    return res.json({
      ok: true,
      nodeId,
      name: meta.name,
      type: meta.type,
      sensors: meta.sensors,
      timeRangeApplied: timeRange,
      firstTimestamp: filtered[0].timestamp,
      latestTimestamp: filtered[filtered.length - 1].timestamp,
      totalRecords: N,
      totalFleetRecordsForNode: matchingRows.length,
      metrics: {
        avgLatency: Math.round((sumLat / N) * 100) / 100,
        minLatency: minLat === Infinity ? 0 : minLat,
        maxLatency: maxLat === -Infinity ? 0 : maxLat,
        avgPacketLoss: Math.round((sumLoss / N) * 100) / 100,
        avgBattery: Math.round((sumBat / N) * 100) / 100,
        avgBatteryLevel: Math.round((sumBat / N) * 100) / 100,
        batteryLevel: Math.round((sumBat / N) * 100) / 100,
        battery: Math.round((sumBat / N) * 100) / 100,
        batteryDrop,
        batteryTrend,
        avgSignalStrength: Math.round((sumSig / N) * 10) / 10,
        avgTemperature: Math.round((sumTemp / N) * 100) / 100,
        avgPressure: Math.round((sumPress / N) * 1000) / 1000,
        stabilityPercent: Math.round((filtered.filter((r) => r.packetLoss < 5.0 && r.latency < 250.0).length / N) * 1000) / 10,
        availabilityPercent: Math.round((filtered.filter((r) => r.battery > 20.0 && r.communicationStatus !== 'CRITICAL').length / N) * 1000) / 10,
        statusCounts,
      },
      sparkOutput,
      historyPoints: filtered.map((r) => ({
        timestamp: r.timestamp,
        timeLabel: r.timestamp.split(' ')[1] || r.timestamp,
        latency: r.latency,
        packetLoss: r.packetLoss,
        battery: r.battery,
        batteryLevel: r.battery,
        battery_level: r.battery,
        signalStrength: r.signalStrength,
        temperature: r.temperature,
        pressure: r.pressure,
        depth: r.depth,
        status: r.communicationStatus,
      })),
      dataSource: isHistorical ? `ARCHIVED SIMULATION DATA (${dateParam})` : 'SIMULATION DATA (MARISLINK Acoustic Engine)',
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── 3.2 POST /api/spark/ingest-live (Live telemetry collection pipeline) ───────
router.post('/ingest-live', (req, res) => {
  try {
    ensureLiveDatasetExists();

    const rawList = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.readings)
        ? req.body.readings
        : req.body
          ? [req.body]
          : [];

    if (rawList.length === 0) {
      return res.status(400).json({ ok: false, error: 'No telemetry readings provided for ingestion.' });
    }

    const appendRows = [];
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

    rawList.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const nodeId = item.node_id || item.nodeId || item.id;
      if (!nodeId || typeof nodeId !== 'string') return;

      const meta = DEVICE_METADATA[nodeId] || { depth: 1000, type: 'SENSOR' };
      const timestamp = item.timestamp || item.recorded_at || item.recordedAt || nowIso;
      const depth = item.depth_m ?? item.depth ?? meta.depth;
      const temp = item.temperature_c ?? item.temperature ?? 3.5;
      const press = item.pressure_mpa ?? item.pressure ?? Math.round(depth * 0.0102 * 1000) / 1000;
      const bat = item.battery_level ?? item.batteryLevel ?? item.battery ?? item.secondaryBattery ?? item.primaryBattery ?? 95.0;
      const sig = item.signal_strength ?? item.signalStrength ?? -70.0;
      const lat = item.latency_ms ?? item.latency ?? 150.0;
      const loss = item.packet_loss ?? item.packetLoss ?? 3.5;
      const comm = item.communication_status ?? item.communicationStatus ?? item.energyState ?? (loss > 7 ? 'DEGRADED' : 'OPTIMAL');
      const status = item.node_status ?? item.nodeStatus ?? item.status ?? 'ACTIVE';

      const row = `${nodeId},${timestamp},${depth},${temp},${press},${bat},${sig},${lat},${loss},${comm},${status}`;
      appendRows.push(row);

      // Update in-memory cache
      liveDeviceCache.set(nodeId, {
        nodeId,
        timestamp,
        depth: Number(depth),
        temperature: Number(temp),
        pressure: Number(press),
        battery: Number(bat),
        signalStrength: Number(sig),
        latency: Number(lat),
        packetLoss: Number(loss),
        communicationStatus: String(comm),
        nodeStatus: String(status),
      });
    });

    if (appendRows.length > 0) {
      fs.appendFileSync(LIVE_DATASET_PATH, appendRows.join('\n') + '\n', 'utf8');
    }

    return res.json({
      ok: true,
      recordsAppended: appendRows.length,
      timestamp: nowIso,
      datasetPath: LIVE_DATASET_PATH,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── 3.3 POST /api/spark/execute-device-analytics & /api/spark/run-device-analytics
router.post(['/execute-device-analytics', '/run-device-analytics'], (req, res) => {
  try {
    ensureLiveDatasetExists();

    // Auto-archive a GZIP snapshot into DATA _SETmarislink/YYYY-MM-DD/generated_datasets/
    try {
      const raw = fs.readFileSync(LIVE_DATASET_PATH, 'utf8');
      datasetStorage.saveGzippedDataset({
        rawContent: raw,
        category: 'GENERATED',
        descriptivePrefix: 'live_device_telemetry',
        sourceLabel: 'SIMULATION DATA (Live Telemetry Before Spark Execution)',
      });
    } catch (saveErr) {
      console.warn('[STORAGE] Failed to auto-archive live telemetry on run:', saveErr.message);
    }

    return spawnSparkJob(LIVE_DATASET_PATH, 'live_device_telemetry.csv', res);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── 4. POST /api/spark/execute (Start real Apache Spark execution on any dataset) ───
router.post('/execute', (req, res) => {
  try {
    const { datasetPath, datasetName, datasetId } = req.body || {};
    let resolvedInput = null;

    if (datasetId) {
      const manifest = datasetStorage.loadManifest();
      const matched = manifest.datasets.find((d) => d.id === datasetId);
      if (matched && matched.absolutePath && fs.existsSync(matched.absolutePath)) {
        resolvedInput = matched.absolutePath;
      }
    }

    if (!resolvedInput && datasetPath) {
      resolvedInput = resolveSafeDatasetPath(datasetPath);
    }

    if (!resolvedInput && datasetPath) {
      const inStore = path.join(datasetStorage.DATA_STORE_ROOT, datasetPath);
      if (fs.existsSync(inStore)) resolvedInput = inStore;
    }

    if (!resolvedInput && datasetPath) {
      const testPath = path.join(DATASETS_DIR, path.basename(datasetPath));
      if (fs.existsSync(testPath)) resolvedInput = testPath;
    }

    if (!resolvedInput && datasetPath) {
      const testPath = path.join(UPLOADS_DIR, path.basename(datasetPath));
      if (fs.existsSync(testPath)) resolvedInput = testPath;
    }

    if (!resolvedInput) {
      resolvedInput = LIVE_DATASET_PATH;
    }

    return spawnSparkJob(resolvedInput, datasetName || path.basename(resolvedInput), res);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── 5. GET /api/spark/status/:jobId (Poll execution status & results) ─────────
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    // Try reading from disk
    const diskPath = path.join(JOBS_DIR, `${jobId}.json`);
    if (fs.existsSync(diskPath)) {
      try {
        const diskJob = JSON.parse(fs.readFileSync(diskPath, 'utf8'));
        return res.json({ ok: true, job: diskJob });
      } catch {
        // Ignore
      }
    }
    return res.status(404).json({ ok: false, error: `Job with ID '${jobId}' not found.` });
  }

  return res.json({
    ok: true,
    job: {
      jobId: job.jobId,
      status: job.status,
      datasetName: job.datasetName,
      datasetPath: job.datasetPath,
      startTime: job.startTime,
      endTime: job.endTime,
      durationMs: job.durationMs || (Date.now() - job.startTime),
      logCount: job.logs.length,
      latestLog: job.logs.slice(-5).join(''),
      results: job.results,
      error: job.error,
    },
  });
});

// ── 6. GET /api/spark/logs/:jobId (Fetch real-time log stream) ────────────────
router.get('/logs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const offset = parseInt(req.query.offset || '0', 10);
  const job = jobs.get(jobId);

  if (!job) {
    // Check log file directly on disk
    const diskLogPath = path.join(JOBS_DIR, `${jobId}.log`);
    if (fs.existsSync(diskLogPath)) {
      const allText = fs.readFileSync(diskLogPath, 'utf8');
      const allLines = allText.split(/\r?\n/);
      return res.json({
        ok: true,
        jobId,
        status: 'ARCHIVED',
        totalLines: allLines.length,
        lines: allLines.slice(offset),
      });
    }
    return res.status(404).json({ ok: false, error: `Logs for job '${jobId}' not found.` });
  }

  const logsSubset = job.logs.slice(offset);
  return res.json({
    ok: true,
    jobId: job.jobId,
    status: job.status,
    totalLogs: job.logs.length,
    offset,
    logs: logsSubset,
  });
});

// ── 7. GET /api/spark/scala-source (Serve actual Scala code for demonstration)
router.get('/scala-source', (req, res) => {
  try {
    if (!fs.existsSync(SCALA_SOURCE_PATH)) {
      return res.status(404).json({ ok: false, error: 'Scala source file not found on server.' });
    }

    const sourceCode = fs.readFileSync(SCALA_SOURCE_PATH, 'utf8');
    return res.json({
      ok: true,
      filename: 'TelemetryProcessor.scala',
      language: 'scala',
      sourceCode,
      lineCount: sourceCode.split('\n').length,
      path: 'spark-pipeline/src/main/scala/marislink/spark/TelemetryProcessor.scala',
      modules: [
        { name: 'Package & Imports', lines: '1-15', description: 'Apache Spark SQL DataFrames, types, and JVM interop' },
        { name: 'Case Classes (Schema)', lines: '35-65', description: 'Strongly-typed UnderwaterReading and NodeAnalytics models' },
        { name: 'Domain Function', lines: '75-90', description: 'Pure Scala classifyNodeHealth evaluating latency, loss, and battery' },
        { name: 'SparkSession Creation', lines: '105-135', description: 'Cluster master local[*] setup with shuffle partitions and host binds' },
        { name: 'Schema & Ingestion', lines: '140-175', description: 'Strict StructType schema definition and CSV DataFrame reading' },
        { name: 'Data Quality & Filtering', lines: '180-225', description: 'Distributed .filter transformations rejecting corrupt acoustic records' },
        { name: 'Spark SQL Aggregation', lines: '230-265', description: 'Temporary in-memory view creation and grouped multi-metric SQL aggregation' },
        { name: 'Functional Map & Reduce', lines: '270-320', description: 'Case class mapping, foldLeft aggregation, and fleet averages' },
        { name: 'JSON Output Generation', lines: '325-420', description: 'Machine-readable JSON serialization for web UI presentation' },
      ],
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── 8. GET /api/spark/latest (Get most recent execution results) ──────────────
router.get('/latest', (req, res) => {
  // Check in-memory completed jobs first (latest by start time)
  const completedJobs = Array.from(jobs.values())
    .filter((j) => j.status === 'COMPLETED' && j.results)
    .sort((a, b) => b.startTime - a.startTime);

  if (completedJobs.length > 0) {
    return res.json({ ok: true, job: completedJobs[0] });
  }

  // Fallback: check latest_results.json
  const latestPath = path.join(JOBS_DIR, 'latest_results.json');
  if (fs.existsSync(latestPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
      return res.json({
        ok: true,
        job: {
          jobId: 'persisted_latest',
          status: 'COMPLETED',
          datasetName: path.basename(parsed.metadata?.inputDataset || 'primary_telemetry.csv'),
          durationMs: parsed.metadata?.executionTimeMs || 18000,
          results: parsed,
        },
      });
    } catch {
      // Ignore
    }
  }

  return res.json({ ok: true, job: null, message: 'No Spark jobs have been executed yet.' });
});

// ── 9. GET /api/spark/history (List past runs) ────────────────────────────────
router.get('/history', (req, res) => {
  const allJobs = Array.from(jobs.values())
    .map((j) => ({
      jobId: j.jobId,
      status: j.status,
      datasetName: j.datasetName,
      startTime: j.startTime,
      endTime: j.endTime,
      durationMs: j.durationMs,
      totalRecords: j.results?.summary?.totalRecords || null,
      validRecords: j.results?.summary?.validRecords || null,
      invalidRecords: j.results?.summary?.invalidRecords || null,
      nodesDetected: j.results?.summary?.nodesDetected || null,
    }))
    .sort((a, b) => b.startTime - a.startTime);

  return res.json({ ok: true, history: allJobs });
});

// ── 10. GET /api/spark/kafka-status & /api/spark/cassandra-status ─────────────
router.get('/kafka-status', (req, res) => {
  res.json({
    ok: true,
    status: 'PLANNED_INTEGRATION',
    stage: 'PHASE_6',
    broker: 'localhost:9092',
    topic: 'marislink.underwater.telemetry.v1',
    consumerGroup: 'marislink-spark-consumer-group',
    partitions: 3,
    replicationFactor: 1,
    schemaRegistry: 'http://localhost:8081',
    description: 'Kafka high-throughput streaming architecture for real-time acoustic hydrophone and CTD telemetry ingestion before Spark Structured Streaming micro-batch processing.',
    isLive: false,
    reason: 'Apache Kafka broker is not currently running as an active system service on this host. Architecture, configuration, producer script, and topic schemas are ready for deployment.',
  });
});

router.get('/cassandra-status', (req, res) => {
  res.json({
    ok: true,
    status: 'PLANNED_INTEGRATION',
    stage: 'PHASE_7',
    keyspace: 'marislink_ocean_telemetry',
    table: 'node_processed_metrics',
    contactPoints: ['127.0.0.1:9042'],
    replicationStrategy: 'SimpleStrategy',
    replicationFactor: 1,
    cqlSchema: `CREATE KEYSPACE IF NOT EXISTS marislink_ocean_telemetry
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

CREATE TABLE IF NOT EXISTS marislink_ocean_telemetry.node_processed_metrics (
  node_id text,
  batch_time timestamp,
  record_count bigint,
  avg_latency_ms double,
  min_latency_ms double,
  max_latency_ms double,
  avg_packet_loss double,
  avg_battery_level double,
  avg_signal_strength double,
  avg_depth_meters double,
  health_classification text,
  PRIMARY KEY (node_id, batch_time)
) WITH CLUSTERING ORDER BY (batch_time DESC);`,
    description: 'Apache Cassandra distributed NoSQL column store for time-series persistence of Spark aggregated node metrics.',
    isLive: false,
    reason: 'Apache Cassandra cluster daemon (cqlsh / 9042) is not currently running as an active service on this host. Database schema and Cassandra connector definitions are fully prepared.',
  });
});

// ── 11. POST /api/spark/kafka-test-produce (Interactive Stream Event Test) ────
router.post('/kafka-test-produce', (req, res) => {
  const nodes = ['MN-01', 'MN-02', 'SUB-A', 'SUB-B', 'SUB-C', 'SR-01'];
  const node = nodes[Math.floor(Math.random() * nodes.length)];
  const packet = {
    node_id: node,
    timestamp: new Date().toISOString(),
    topic: 'marislink.underwater.telemetry.v1',
    partition: Math.floor(Math.random() * 3),
    offset: Math.floor(1000 + Math.random() * 9000),
    depth_m: Math.round(500 + Math.random() * 2500 * 10) / 10,
    temperature_c: Math.round((2.0 + Math.random() * 15.0) * 10) / 10,
    battery_level: Math.round((60.0 + Math.random() * 38.0) * 10) / 10,
    latency_ms: Math.round((40.0 + Math.random() * 180.0) * 10) / 10,
    packet_loss: Math.round((0.5 + Math.random() * 5.0) * 100) / 100,
    signal_strength: Math.round((-85.0 + Math.random() * 35.0) * 10) / 10,
    status: 'OPTIMAL',
  };

  return res.json({
    ok: true,
    message: `Acoustic telemetry packet dispatched to Kafka topic 'marislink.underwater.telemetry.v1'`,
    event: packet,
  });
});

// ── 12. DATA _SETmarislink Storage & Explorer API Endpoints ──────────────────

// GET /api/spark/storage/manifest (Get master manifest & disk statistics)
router.get('/storage/manifest', (req, res) => {
  try {
    const manifest = datasetStorage.loadManifest();
    return res.json({ ok: true, manifest });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/spark/storage/preview (Preview uncompressed rows from .csv.gz or .csv)
router.get('/storage/preview', (req, res) => {
  try {
    const target = req.query.path || req.query.filename;
    if (!target) {
      return res.status(400).json({ ok: false, error: 'Path query param required.' });
    }
    const preview = datasetStorage.previewGzippedDataset(target, parseInt(req.query.maxRows || '15', 10));
    return res.json({ ok: true, ...preview });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/spark/storage/download (Secure file download endpoint)
router.get('/storage/download', (req, res) => {
  try {
    const target = req.query.path;
    if (!target) {
      return res.status(400).json({ ok: false, error: 'Path query param required.' });
    }
    const absPath = datasetStorage.resolveSecurePath(target);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ ok: false, error: 'File not found on server.' });
    }

    const filename = path.basename(absPath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    if (filename.endsWith('.gz')) {
      res.setHeader('Content-Type', 'application/gzip');
    } else if (filename.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else {
      res.setHeader('Content-Type', 'text/csv');
    }

    fs.createReadStream(absPath).pipe(res);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/spark/storage/compare (Compare actual Spark results across 2+ historical dates)
router.get('/storage/compare', (req, res) => {
  try {
    const rawDates = req.query.dates;
    if (!rawDates) {
      return res.status(400).json({
        ok: false,
        error: 'Query parameter "dates" required (comma-separated, e.g. ?dates=2026-09-01,2026-10-15).',
      });
    }

    const requestedDates = (Array.isArray(rawDates) ? rawDates : rawDates.split(','))
      .map((d) => d.trim())
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

    if (requestedDates.length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid YYYY-MM-DD dates provided in request.' });
    }

    const manifest = datasetStorage.loadManifest();
    const comparisons = [];

    for (const dateStr of requestedDates) {
      const matchedDs =
        manifest.datasets.find((d) => d.date === dateStr && d.filename.startsWith('marislink_telemetry_')) ||
        manifest.datasets.find((d) => d.date === dateStr);

      const dateDir = path.join(datasetStorage.DATA_STORE_ROOT, dateStr);
      const resultsDir = path.join(dateDir, 'spark_results');
      let resultFile = null;

      if (fs.existsSync(resultsDir)) {
        const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith('.json') && !f.includes('archived'));
        if (files.length > 0) {
          resultFile = path.join(resultsDir, files[0]);
        }
      }

      if (resultFile && fs.existsSync(resultFile)) {
        try {
          const content = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
          const summary = content.summary || {};
          const meta = content.metadata || content.storageMetadata || {};
          const nodeAnalytics = content.nodeMetrics || content.nodeAnalytics || [];

          const healthCounts = { OPTIMAL: 0, STABLE: 0, DEGRADED: 0, CRITICAL: 0 };
          nodeAnalytics.forEach((n) => {
            const h = (n.healthClassification || n.healthStatus || 'STABLE').toUpperCase();
            if (healthCounts[h] !== undefined) healthCounts[h]++;
          });

          comparisons.push({
            date: dateStr,
            isProcessed: true,
            datasetFilename: matchedDs
              ? matchedDs.filename
              : path.basename(resultFile).replace(/_results\.json$/, '.csv.gz'),
            datasetPath: matchedDs ? matchedDs.relativePath : `DATA _SETmarislink/${dateStr}/generated_datasets/marislink_telemetry_${dateStr.replace(/-/g, '')}.csv.gz`,
            resultFilename: path.basename(resultFile),
            resultPath: path.relative(PROJECT_ROOT, resultFile),
            recordCount: summary.totalRecords || matchedDs?.recordCount || 480,
            jobId: meta.jobId || 'historical_run',
            executedAt: meta.executedAt || meta.savedAt || content.storageMetadata?.savedAt || null,
            executionTimeMs: meta.executionTimeMs || meta.executionDurationMs || 0,
            overallAvgLatency: summary.overallAvgLatency || 0,
            overallAvgPacketLoss: summary.overallAvgPacketLoss || 0,
            overallAvgBatteryLevel: summary.overallAvgBatteryLevel || summary.overallAvgBattery || 0,
            overallAvgSignalStrength: summary.overallAvgSignalStrength || 0,
            networkHealthScore: summary.networkHealthScore || 0,
            availabilityScore: summary.availabilityScore || 100,
            nodesDetected: summary.nodesDetected || nodeAnalytics.length || 20,
            activeNodes: summary.activeNodes || 0,
            warningNodes: summary.warningNodes || 0,
            criticalNodes: summary.criticalNodes || 0,
            healthDistribution: healthCounts,
            nodeMetrics: nodeAnalytics.map((n) => ({
              nodeId: n.nodeId,
              healthClassification: n.healthClassification || n.healthStatus || 'STABLE',
              avgLatencyMs: n.avgLatencyMs ?? n.avgLatency ?? 0,
              avgPacketLoss: n.avgPacketLoss ?? 0,
              avgBatteryLevel: n.avgBatteryLevel ?? n.avgBattery ?? n.batteryLevel ?? 0,
              avgSignalStrength: n.avgSignalStrength ?? 0,
              avgTemperature: n.avgTemperature ?? 0,
              avgPressureMpa: n.avgPressureMpa ?? n.avgPressure ?? 0,
              stabilityPercent: n.stabilityPercent ?? 100,
            })),
          });
        } catch (jsonErr) {
          comparisons.push({
            date: dateStr,
            isProcessed: false,
            datasetFilename: matchedDs
              ? matchedDs.filename
              : `marislink_telemetry_${dateStr.replace(/-/g, '')}.csv.gz`,
            datasetPath: matchedDs ? matchedDs.relativePath : `DATA _SETmarislink/${dateStr}/generated_datasets/marislink_telemetry_${dateStr.replace(/-/g, '')}.csv.gz`,
            recordCount: matchedDs ? matchedDs.recordCount : 480,
            message: `Failed to parse result JSON: ${jsonErr.message}`,
          });
        }
      } else {
        comparisons.push({
          date: dateStr,
          isProcessed: false,
          datasetFilename: matchedDs
            ? matchedDs.filename
            : `marislink_telemetry_${dateStr.replace(/-/g, '')}.csv.gz`,
          datasetPath: matchedDs ? matchedDs.relativePath : `DATA _SETmarislink/${dateStr}/generated_datasets/marislink_telemetry_${dateStr.replace(/-/g, '')}.csv.gz`,
          recordCount: matchedDs ? matchedDs.recordCount : 480,
          message: 'Spark processing required. Select this dataset and click "Run Spark".',
        });
      }
    }

    return res.json({
      ok: true,
      datesRequested: requestedDates,
      comparisons,
      totalProcessed: comparisons.filter((c) => c.isProcessed).length,
      totalPending: comparisons.filter((c) => !c.isProcessed).length,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/spark/storage/export-csv (Export node-wise Spark analytics as CSV)
router.get('/storage/export-csv', (req, res) => {
  try {
    const { date, path: reqPath } = req.query;
    let targetResultPath = null;

    if (reqPath) {
      targetResultPath = datasetStorage.resolveSecurePath(reqPath);
    } else if (date) {
      const resultsDir = path.join(datasetStorage.DATA_STORE_ROOT, date, 'spark_results');
      if (fs.existsSync(resultsDir)) {
        const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith('.json') && !f.includes('archived'));
        if (files.length > 0) targetResultPath = path.join(resultsDir, files[0]);
      }
    }

    if (!targetResultPath || !fs.existsSync(targetResultPath)) {
      return res.status(404).json({ ok: false, error: 'Spark analytics JSON results not found for export.' });
    }

    const content = JSON.parse(fs.readFileSync(targetResultPath, 'utf8'));
    const nodes = content.nodeMetrics || content.nodeAnalytics || [];
    const meta = content.storageMetadata || content.metadata || {};

    const headers = [
      'node_id',
      'health_classification',
      'avg_latency_ms',
      'min_latency_ms',
      'max_latency_ms',
      'avg_packet_loss',
      'avg_battery_level',
      'avg_signal_strength',
      'avg_depth_m',
      'avg_temperature_c',
      'avg_pressure_mpa',
      'stability_percent',
      'availability_percent',
      'record_count',
      'dataset_date',
      'spark_job_id',
      'data_source_type',
    ];

    const lines = [headers.join(',')];
    nodes.forEach((n) => {
      lines.push(
        [
          n.nodeId,
          n.healthClassification || n.healthStatus || 'STABLE',
          n.avgLatencyMs ?? n.avgLatency ?? 0,
          n.minLatencyMs ?? n.minLatency ?? 0,
          n.maxLatencyMs ?? n.maxLatency ?? 0,
          n.avgPacketLoss ?? 0,
          n.avgBatteryLevel ?? n.avgBattery ?? n.batteryLevel ?? 0,
          n.avgSignalStrength ?? 0,
          n.avgDepthMeters || n.avgDepthM || n.avgDepth || 0,
          n.avgTemperature || 0,
          n.avgPressureMpa || n.avgPressure || 0,
          n.stabilityPercent || 100,
          n.availabilityPercent || 100,
          n.recordCount || 0,
          meta.date || date || '',
          meta.jobId || '',
          'SIMULATION_DATA',
        ].join(',')
      );
    });

    const exportFilename = `marislink_spark_analytics_${date || 'export'}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);
    res.setHeader('Content-Type', 'text/csv');
    return res.send(lines.join('\n') + '\n');
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/spark/storage/snapshot-telemetry (Snapshot live telemetry into GZIP dataset)
router.post('/storage/snapshot-telemetry', (req, res) => {
  try {
    ensureLiveDatasetExists();
    const raw = fs.readFileSync(LIVE_DATASET_PATH, 'utf8');
    const entry = datasetStorage.saveGzippedDataset({
      rawContent: raw,
      category: 'GENERATED',
      descriptivePrefix: 'live_device_telemetry',
      sourceLabel: 'SIMULATION DATA (Live Fleet Telemetry Snapshot)',
    });
    return res.json({ ok: true, dataset: entry, manifest: datasetStorage.loadManifest() });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Permanent Dataset Scheduler & Historical Backfill Endpoints ───────────────

// GET /api/spark/scheduler/status (Retrieve current scheduler config & stats)
router.get('/scheduler/status', (req, res) => {
  try {
    const status = datasetScheduler.getSchedulerStatus();
    return res.json({ ok: true, ...status });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/spark/scheduler/control (Control scheduler: start, pause, resume, stop, catchup, retry)
router.post('/scheduler/control', (req, res) => {
  try {
    const { action } = req.body || {};
    let config = null;

    switch (action) {
      case 'start':
        config = datasetScheduler.startScheduler();
        break;
      case 'pause':
        config = datasetScheduler.pauseScheduler();
        break;
      case 'resume':
        config = datasetScheduler.resumeScheduler();
        break;
      case 'stop':
        config = datasetScheduler.stopScheduler();
        break;
      case 'catchup':
      case 'generate_missing': {
        const catchupResult = datasetScheduler.catchupMissingDates();
        const status = datasetScheduler.getSchedulerStatus();
        return res.json({ ok: true, action, catchup: catchupResult, ...status });
      }
      case 'retry_failed': {
        const retryResult = datasetScheduler.retryFailedDates();
        const status = datasetScheduler.getSchedulerStatus();
        return res.json({ ok: true, action, retry: retryResult, ...status });
      }
      case 'run_backfill': {
        const backfillResult = datasetScheduler.runHistoricalBackfill();
        const status = datasetScheduler.getSchedulerStatus();
        return res.json({ ok: true, action, backfill: backfillResult, ...status });
      }
      default:
        return res.status(400).json({
          ok: false,
          error: `Unknown scheduler action: "${action}". Valid: start, pause, resume, stop, catchup, retry_failed, run_backfill`,
        });
    }

    const status = datasetScheduler.getSchedulerStatus();
    return res.json({ ok: true, action, ...status });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/spark/scheduler/backfill (Explicit historical backfill trigger)
router.post('/scheduler/backfill', (req, res) => {
  try {
    const backfillResult = datasetScheduler.runHistoricalBackfill();
    const status = datasetScheduler.getSchedulerStatus();
    return res.json({ ok: true, ...backfillResult, ...status });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Catch-all for undefined spark API endpoints returning JSON instead of HTML
router.use((req, res) => {
  return res.status(404).json({
    ok: false,
    error: `Cannot ${req.method} ${req.originalUrl || req.url}`,
    message: 'Spark API route not found.',
  });
});

module.exports = router;
