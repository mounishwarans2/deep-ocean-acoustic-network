/**
 * ==============================================================================
 * MARISLINK: Historical Dataset Backfill & Permanent Daily Generation Engine
 * ==============================================================================
 * Manages deterministic simulation telemetry generation for:
 * 1. Historical Backfill: 2026-09-01 through 2026-11-05 (66 daily datasets)
 * 2. Permanent Daily Scheduler: 00:05 Asia/Kolkata cron generation
 * 3. Startup Recovery & Catch-up: Auto-generates missed dates on server restart
 * 4. Persistent Configuration: DATA _SETmarislink/dataset_metadata/scheduler_config.json
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
let cron = null;
try {
  cron = require('node-cron');
} catch {
  console.warn('[SCHEDULER] node-cron not available yet, will use interval fallback if needed.');
}

const datasetStorage = require('./dataset-storage');

const CANONICAL_PROJECT_ROOT = '/home/mounish/project/ProjectAM/agile methology';
const PROJECT_ROOT = fs.existsSync(CANONICAL_PROJECT_ROOT) ? CANONICAL_PROJECT_ROOT : path.resolve(__dirname, '..');
const CANONICAL_STORAGE_ROOT = path.join(PROJECT_ROOT, 'DATA _SETmarislink');
const DATA_STORE_ROOT = CANONICAL_STORAGE_ROOT;
const METADATA_DIR = path.join(DATA_STORE_ROOT, 'dataset_metadata');
const SCHEDULER_CONFIG_PATH = path.join(METADATA_DIR, 'scheduler_config.json');

const TIMEZONE = 'Asia/Kolkata';
const START_DATE = '2026-09-01';
const INITIAL_END_DATE = '2026-11-05';
const CRON_SCHEDULE = '5 0 * * *'; // 00:05 daily

// Deterministic specifications for all 20 underwater devices & stations
const FLEET_SPECS = [
  { id: 'DC-01', name: 'Terrestrial Data Center', type: 'DATA_CENTER', depth: 0.0, baseTemp: 24.5, basePress: 0.1, baseBat: 100.0, baseSig: -32.0, baseLat: 14.5, baseLoss: 0.4, baseComm: 'OPTIMAL', baseStatus: 'ACTIVE' },
  { id: 'SR-01', name: 'Surface Receiver Alpha', type: 'SURFACE_RECEIVER', depth: 2.5, baseTemp: 22.0, basePress: 0.12, baseBat: 98.5, baseSig: -48.0, baseLat: 38.0, baseLoss: 0.8, baseComm: 'OPTIMAL', baseStatus: 'ACTIVE' },
  { id: 'MN-01', name: 'Main Underwater Node', type: 'GATEWAY', depth: 2000.0, baseTemp: 3.1, basePress: 20.4, baseBat: 95.0, baseSig: -68.0, baseLat: 140.0, baseLoss: 2.8, baseComm: 'STABLE', baseStatus: 'ACTIVE' },
  { id: 'MN-02', name: 'Backup Main Node', type: 'GATEWAY', depth: 1800.0, baseTemp: 3.4, basePress: 18.3, baseBat: 96.0, baseSig: -71.0, baseLat: 155.0, baseLoss: 3.2, baseComm: 'STABLE', baseStatus: 'ACTIVE' },
  { id: 'SUB-A', name: 'Sub-Node Alpha', type: 'ACOUSTIC_RELAY', depth: 2800.0, baseTemp: 2.3, basePress: 28.7, baseBat: 93.0, baseSig: -79.0, baseLat: 210.0, baseLoss: 4.8, baseComm: 'STABLE', baseStatus: 'ACTIVE' },
  { id: 'SUB-B', name: 'Sub-Node Beta', type: 'NAVIGATION_RELAY', depth: 2600.0, baseTemp: 2.5, basePress: 26.6, baseBat: 94.5, baseSig: -75.0, baseLat: 190.0, baseLoss: 4.2, baseComm: 'STABLE', baseStatus: 'ACTIVE' },
  { id: 'SUB-C', name: 'Sub-Node Gamma', type: 'SEAFLOOR_RELAY', depth: 4800.0, baseTemp: 1.8, basePress: 49.1, baseBat: 91.0, baseSig: -84.0, baseLat: 265.0, baseLoss: 6.8, baseComm: 'DEGRADED', baseStatus: 'ACTIVE' },
  { id: 'SUB-D', name: 'Sub-Node Delta', type: 'ACOUSTIC_RELAY', depth: 4600.0, baseTemp: 1.9, basePress: 47.1, baseBat: 92.5, baseSig: -82.0, baseLat: 250.0, baseLoss: 5.9, baseComm: 'DEGRADED', baseStatus: 'ACTIVE' },
  { id: 'S-01', name: 'Hydrophone Sensor 01', type: 'HYDROPHONE', depth: 2200.0, baseTemp: 2.9, basePress: 22.5, baseBat: 95.5, baseSig: -64.0, baseLat: 95.0, baseLoss: 2.2, baseComm: 'OPTIMAL', baseStatus: 'ACTIVE' },
  { id: 'S-02', name: 'Temperature Depth Oxygen Sensor 02', type: 'ENVIRONMENTAL_SENSOR', depth: 3100.0, baseTemp: 2.1, basePress: 31.7, baseBat: 94.0, baseSig: -70.0, baseLat: 120.0, baseLoss: 3.0, baseComm: 'STABLE', baseStatus: 'ACTIVE' },
  { id: 'S-03', name: 'Hydrophone Sensor 03', type: 'HYDROPHONE', depth: 3500.0, baseTemp: 2.0, basePress: 35.8, baseBat: 93.5, baseSig: -77.0, baseLat: 175.0, baseLoss: 3.9, baseComm: 'STABLE', baseStatus: 'ACTIVE' },
  { id: 'S-04', name: 'Temperature Salinity Oxygen Sensor 04', type: 'ENVIRONMENTAL_SENSOR', depth: 1800.0, baseTemp: 3.5, basePress: 18.3, baseBat: 96.0, baseSig: -78.0, baseLat: 225.0, baseLoss: 6.2, baseComm: 'DEGRADED', baseStatus: 'ACTIVE' },
  { id: 'S-05', name: 'Hydrophone Sensor 05', type: 'HYDROPHONE', depth: 2400.0, baseTemp: 2.7, basePress: 24.5, baseBat: 95.0, baseSig: -72.0, baseLat: 132.0, baseLoss: 2.9, baseComm: 'STABLE', baseStatus: 'ACTIVE' },
  { id: 'S-06', name: 'Salinity Turbidity pH Sensor 06', type: 'ENVIRONMENTAL_SENSOR', depth: 3000.0, baseTemp: 2.2, basePress: 30.7, baseBat: 94.0, baseSig: -75.0, baseLat: 160.0, baseLoss: 4.1, baseComm: 'STABLE', baseStatus: 'ACTIVE' },
  { id: 'S-07', name: 'Hydrophone Sensor 07', type: 'HYDROPHONE', depth: 4200.0, baseTemp: 1.9, basePress: 42.9, baseBat: 92.0, baseSig: -81.0, baseLat: 235.0, baseLoss: 5.5, baseComm: 'DEGRADED', baseStatus: 'ACTIVE' },
  { id: 'S-08', name: 'Temperature Depth pH Sensor 08', type: 'ENVIRONMENTAL_SENSOR', depth: 5000.0, baseTemp: 1.7, basePress: 51.2, baseBat: 89.0, baseSig: -86.0, baseLat: 280.0, baseLoss: 7.8, baseComm: 'DEGRADED', baseStatus: 'ACTIVE' },
  { id: 'S-09', name: 'Hydrophone Sensor 09', type: 'HYDROPHONE', depth: 4600.0, baseTemp: 1.8, basePress: 47.0, baseBat: 91.5, baseSig: -83.0, baseLat: 255.0, baseLoss: 6.5, baseComm: 'DEGRADED', baseStatus: 'ACTIVE' },
  { id: 'S-10', name: 'Oxygen Turbidity Sensor 10', type: 'ENVIRONMENTAL_SENSOR', depth: 4000.0, baseTemp: 2.0, basePress: 40.9, baseBat: 94.0, baseSig: -78.0, baseLat: 210.0, baseLoss: 4.8, baseComm: 'STABLE', baseStatus: 'ACTIVE' },
  { id: 'S-11', name: 'Hydrophone Sensor 11', type: 'HYDROPHONE', depth: 5200.0, baseTemp: 1.6, basePress: 53.2, baseBat: 88.0, baseSig: -88.0, baseLat: 305.0, baseLoss: 8.9, baseComm: 'DEGRADED', baseStatus: 'ACTIVE' },
  { id: 'S-12', name: 'Temperature Salinity Oxygen Sensor 12', type: 'ENVIRONMENTAL_SENSOR', depth: 4400.0, baseTemp: 1.8, basePress: 45.1, baseBat: 92.5, baseSig: -81.0, baseLat: 240.0, baseLoss: 5.6, baseComm: 'DEGRADED', baseStatus: 'ACTIVE' },
];

/**
 * Deterministic pseudo-random number generator (Mulberry32) seeded by string
 */
function createPrng(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an array of all dates (YYYY-MM-DD) between start and end (inclusive)
 */
function getDateRange(startStr, endStr) {
  const dates = [];
  const current = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);

  while (current <= end) {
    dates.push(current.toISOString().substring(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Returns today's date in Asia/Kolkata
 */
function getTodayKolkata() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Calculate the next scheduled run timestamp (00:05 Asia/Kolkata)
 */
function getNextScheduledTime() {
  const now = new Date();
  const kolkataDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Check if today 00:05 has passed in Kolkata
  const parts = kolkataDate.split('-');
  const tomorrow = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) + 1));
  const tomorrowStr = tomorrow.toISOString().substring(0, 10);

  return `${tomorrowStr} 00:05:00 ${TIMEZONE}`;
}

// Global scheduler state
let scheduledJob = null;
let isBackfillRunning = false;

/**
 * Load or initialize scheduler configuration
 */
function loadSchedulerConfig() {
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }

  if (fs.existsSync(SCHEDULER_CONFIG_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(SCHEDULER_CONFIG_PATH, 'utf8'));
      return data;
    } catch (err) {
      console.warn('[SCHEDULER] Corrupt config, regenerating:', err.message);
    }
  }

  const initialConfig = {
    version: '1.0',
    status: 'ACTIVE', // ACTIVE | PAUSED | STOPPED | RUNNING_BACKFILL
    cronExpression: CRON_SCHEDULE,
    timezone: TIMEZONE,
    startDate: START_DATE,
    initialEndDate: INITIAL_END_DATE,
    lastGeneratedDate: null,
    nextScheduledRun: getNextScheduledTime(),
    backfillCompleted: false,
    totalDatesTarget: 66,
    totalDatesGenerated: 0,
    failedDates: [],
    history: [],
    catchupPolicy: 'AUTO_ON_RESTART',
    updatedAt: new Date().toISOString(),
    deploymentNote: 'Persistent generation continues daily at 00:05 Asia/Kolkata while backend runs. If the server was stopped, missed dates are automatically backfilled on startup. For permanent 24/7 generation without local machine running, deploy as a daemon or worker service (PM2 / systemd / Cloud VM).',
  };

  saveSchedulerConfig(initialConfig);
  return initialConfig;
}

/**
 * Persist scheduler configuration
 */
function saveSchedulerConfig(config) {
  config.updatedAt = new Date().toISOString();
  if (config.status === 'ACTIVE') {
    config.nextScheduledRun = getNextScheduledTime();
  } else {
    config.nextScheduledRun = 'PAUSED / STOPPED';
  }
  fs.writeFileSync(SCHEDULER_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * Generates a realistic, deterministic daily telemetry CSV for the given date (YYYY-MM-DD).
 * Output path: DATA _SETmarislink/YYYY-MM-DD/generated_datasets/marislink_telemetry_YYYYMMDD.csv.gz
 */
function generateDailyTelemetryDataset(dateStr, isBackfill = true) {
  const dateFormatted = dateStr.replace(/-/g, '');
  const targetFolders = datasetStorage.ensureDateFoldersExist(dateStr);
  const filename = `marislink_telemetry_${dateFormatted}.csv.gz`;
  const absolutePath = path.join(targetFolders.generatedDir, filename);
  const relativePath = path.relative(PROJECT_ROOT, absolutePath);

  // Check if file already exists
  if (fs.existsSync(absolutePath)) {
    const stat = fs.statSync(absolutePath);
    if (stat.size > 500) {
      // Already validly generated
      return {
        alreadyExists: true,
        filename,
        absolutePath,
        relativePath,
        date: dateStr,
        sizeBytes: stat.size,
      };
    }
  }

  // Calculate day index from START_DATE (2026-09-01) for progressive battery and seasonal drift
  const dStart = new Date(`${START_DATE}T00:00:00Z`).getTime();
  const dCur = new Date(`${dateStr}T00:00:00Z`).getTime();
  const dayIndex = Math.max(0, Math.floor((dCur - dStart) / (1000 * 60 * 60 * 24)));

  // Deterministic PRNG seeded by date
  const prng = createPrng(`${dateStr}_MARISLINK_ACOUSTIC_SIMULATION_V1`);

  const rows = ['node_id,timestamp,depth_m,temperature_c,pressure_mpa,battery_level,signal_strength,latency_ms,packet_loss,communication_status,node_status'];

  // 24 hourly time steps across the day in Asia/Kolkata
  const HOURS_PER_DAY = 24;

  for (let h = 0; h < HOURS_PER_DAY; h++) {
    const hh = String(h).padStart(2, '0');
    // Random minute / second within the hour for realistic transmission jitter
    const mm = String(Math.floor(prng() * 10)).padStart(2, '0');
    const ss = String(Math.floor(prng() * 60)).padStart(2, '0');
    const timestamp = `${dateStr} ${hh}:${mm}:${ss}`;

    // Diurnal temperature cycle for surface layers (peaks around 14:00, coolest at 04:00)
    const diurnalFactor = Math.sin(((h - 8) / 24) * 2 * Math.PI);

    // Seasonal cooling factor (September slightly warmer, November slightly cooler)
    const seasonalFactor = (1.0 - dayIndex / 100.0) * 0.4;

    for (const dev of FLEET_SPECS) {
      // Acoustic spreading and channel jitter
      const latJitter = (prng() - 0.5) * 8.0;
      const lossJitter = (prng() - 0.5) * 0.6;
      const sigJitter = (prng() - 0.5) * 2.0;

      // Depth drift (tidal fluctuations ±0.6m)
      const depth = Math.max(0, Math.round((dev.depth + (prng() - 0.5) * 0.6) * 100) / 100);

      // Temperature based on depth layering + diurnal + seasonal
      let tempDelta = (prng() - 0.5) * 0.15;
      if (dev.depth < 50) {
        tempDelta += diurnalFactor * 0.8 + seasonalFactor;
      }
      const temp = Math.round((dev.baseTemp + tempDelta) * 100) / 100;

      // Hydrostatic Pressure: depth * 0.0102 + 0.1013 MPa
      const press = Math.round((dev.basePress + (depth * 0.0102 - dev.basePress * 0.05) + (prng() - 0.5) * 0.01) * 1000) / 1000;

      // Battery level: progressive drain over the 66 days, surface units have trickle recharge
      let batDrain = dayIndex * 0.06;
      if (dev.type === 'DATA_CENTER') batDrain = 0;
      if (dev.type === 'SURFACE_RECEIVER') batDrain *= 0.2; // solar trickle
      const bat = Math.max(15, Math.min(100, Math.round((dev.baseBat - batDrain + (prng() - 0.5) * 0.4) * 100) / 100));

      // Signal strength (Thorp attenuation with distance)
      const sig = Math.round((dev.baseSig + sigJitter) * 10) / 10;

      // Latency (Acoustic propagation ~1500 m/s in seawater + channel processing)
      const lat = Math.max(10, Math.round((dev.baseLat + latJitter) * 10) / 10);

      // Packet loss
      const loss = Math.max(0, Math.min(100, Math.round((dev.baseLoss + lossJitter) * 100) / 100));

      // Communication status
      let comm = dev.baseComm;
      if (loss > 8.0 || lat > 280.0) comm = 'DEGRADED';
      if (loss > 15.0 || bat < 20.0) comm = 'CRITICAL';
      if (loss < 3.0 && lat < 120.0) comm = 'OPTIMAL';

      let nodeStatus = dev.baseStatus;
      if (comm === 'CRITICAL' || bat < 25.0) nodeStatus = 'CRITICAL';
      else if (comm === 'DEGRADED') nodeStatus = 'WARNING';

      rows.push(`${dev.id},${timestamp},${depth},${temp},${press},${bat},${sig},${lat},${loss},${comm},${nodeStatus}`);
    }
  }

  const rawCsv = rows.join('\n') + '\n';
  const rawSizeBytes = Buffer.byteLength(rawCsv, 'utf8');

  // Compress using GZIP (.csv.gz)
  const gzippedBuffer = zlib.gzipSync(rawCsv, { level: 9 });
  const compressedSizeBytes = gzippedBuffer.length;
  const compressionRatioPercent = Math.round(((rawSizeBytes - compressedSizeBytes) / rawSizeBytes) * 1000) / 10;

  // Write directly as .csv.gz
  fs.writeFileSync(absolutePath, gzippedBuffer);

  // Ensure top-level generated_datasets directory also contains the file
  try {
    const rootGenDir = path.join(DATA_STORE_ROOT, 'generated_datasets');
    if (!fs.existsSync(rootGenDir)) fs.mkdirSync(rootGenDir, { recursive: true });
    const rootGenFile = path.join(rootGenDir, filename);
    if (!fs.existsSync(rootGenFile)) {
      try {
        fs.linkSync(absolutePath, rootGenFile);
      } catch {
        fs.copyFileSync(absolutePath, rootGenFile);
      }
    }
  } catch (err) {}

  // Register in master dataset_manifest.json
  const sourceLabel = isBackfill
    ? 'BACKFILLED SIMULATION DATA (Deterministic Acoustic Propagation Engine)'
    : 'DAILY AUTOMATIC SIMULATION DATA (Acoustic Propagation Engine)';

  const entry = {
    id: `ds_${dateFormatted}_daily`,
    filename,
    relativePath,
    absolutePath,
    date: dateStr,
    time: '000500',
    displayTime: `${dateStr}, 00:05:00`,
    createdAt: new Date().toISOString(),
    category: 'GENERATED',
    source: sourceLabel,
    recordCount: rows.length - 1,
    uniqueNodeCount: FLEET_SPECS.length,
    uniqueNodes: FLEET_SPECS.map((d) => d.id),
    columns: rows[0].split(','),
    rawSizeBytes,
    compressedSizeBytes,
    compressionRatioPercent,
    sparkStatus: 'PENDING',
    resultFilename: null,
    resultPath: null,
    lastProcessedAt: null,
  };

  // Upsert into manifest
  const manifest = datasetStorage.loadManifest();
  const existingIdx = manifest.datasets.findIndex((d) => d.filename === filename || d.id === entry.id);
  if (existingIdx >= 0) {
    manifest.datasets[existingIdx] = { ...manifest.datasets[existingIdx], ...entry };
  } else {
    manifest.datasets.unshift(entry);
  }
  datasetStorage.saveManifest(manifest);

  return {
    alreadyExists: false,
    ...entry,
  };
}

/**
 * Runs historical backfill for all dates from 2026-09-01 to 2026-11-05 (66 dates)
 */
function runHistoricalBackfill(onProgress = null) {
  if (isBackfillRunning) {
    throw new Error('Historical backfill is already running.');
  }

  isBackfillRunning = true;
  const config = loadSchedulerConfig();
  config.status = 'RUNNING_BACKFILL';
  saveSchedulerConfig(config);

  const dates = getDateRange(START_DATE, INITIAL_END_DATE);
  const total = dates.length; // 66
  let generatedCount = 0;
  let skippedCount = 0;
  const failedDates = [];
  const generatedEntries = [];

  console.log(`[BACKFILL] Commencing historical simulation backfill for ${total} dates (${START_DATE} -> ${INITIAL_END_DATE})...`);

  try {
    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      try {
        const result = generateDailyTelemetryDataset(dateStr, true);
        if (result.alreadyExists) {
          skippedCount++;
        } else {
          generatedCount++;
          generatedEntries.push(result);
        }

        if (onProgress) {
          onProgress({
            currentDate: dateStr,
            index: i + 1,
            total,
            percent: Math.round(((i + 1) / total) * 100),
            generatedCount,
            skippedCount,
          });
        }
      } catch (err) {
        console.error(`[BACKFILL] Error on date ${dateStr}:`, err.message);
        failedDates.push({ date: dateStr, error: err.message, timestamp: new Date().toISOString() });
      }
    }

    config.backfillCompleted = failedDates.length === 0;
    config.totalDatesTarget = total;
    config.totalDatesGenerated = total - failedDates.length;
    config.lastGeneratedDate = dates[dates.length - 1];
    config.failedDates = failedDates;
    config.status = 'ACTIVE';
    config.lastRunAt = new Date().toISOString();
    config.lastRunStatus = failedDates.length === 0 ? 'SUCCESS' : 'PARTIAL';

    config.history.unshift({
      action: 'HISTORICAL_BACKFILL',
      timestamp: new Date().toISOString(),
      datesProcessed: total,
      newlyGenerated: generatedCount,
      alreadyExisted: skippedCount,
      failed: failedDates.length,
      status: failedDates.length === 0 ? 'SUCCESS' : 'FAILED',
    });

    saveSchedulerConfig(config);
    console.log(`[BACKFILL] Completed: ${generatedCount} newly generated, ${skippedCount} already existed, ${failedDates.length} failed.`);

    return {
      ok: true,
      totalDates: total,
      generatedCount,
      skippedCount,
      failedDates,
      config,
    };
  } finally {
    isBackfillRunning = false;
  }
}

/**
 * Checks for any missing dates between START_DATE and today, generating them as catch-up
 */
function catchupMissingDates() {
  const config = loadSchedulerConfig();
  const todayKolkata = getTodayKolkata();
  const targetEnd = todayKolkata > INITIAL_END_DATE ? todayKolkata : INITIAL_END_DATE;
  const dates = getDateRange(START_DATE, targetEnd);

  const missing = [];
  for (const dateStr of dates) {
    const targetFolders = datasetStorage.ensureDateFoldersExist(dateStr);
    const dateFormatted = dateStr.replace(/-/g, '');
    const filename = `marislink_telemetry_${dateFormatted}.csv.gz`;
    const fullPath = path.join(targetFolders.generatedDir, filename);

    if (!fs.existsSync(fullPath)) {
      missing.push(dateStr);
    }
  }

  if (missing.length === 0) {
    console.log(`[SCHEDULER] Catch-up verified: all ${dates.length} dates from ${START_DATE} to ${targetEnd} are present.`);
    return { ok: true, missingCount: 0, generatedCount: 0 };
  }

  console.log(`[SCHEDULER] Catch-up detected ${missing.length} missing dates. Generating...`);
  let generated = 0;
  const failed = [];

  for (const dateStr of missing) {
    try {
      generateDailyTelemetryDataset(dateStr, dateStr <= INITIAL_END_DATE);
      generated++;
    } catch (err) {
      failed.push({ date: dateStr, error: err.message });
    }
  }

  config.totalDatesGenerated = dates.length - failed.length;
  config.lastGeneratedDate = targetEnd;
  config.failedDates = failed;
  config.lastRunAt = new Date().toISOString();
  saveSchedulerConfig(config);

  return {
    ok: true,
    missingCount: missing.length,
    generatedCount: generated,
    failed,
  };
}

/**
 * Retries generation for any dates recorded in failedDates
 */
function retryFailedDates() {
  const config = loadSchedulerConfig();
  if (!config.failedDates || config.failedDates.length === 0) {
    return { ok: true, retriedCount: 0, failedDates: [] };
  }

  const toRetry = [...config.failedDates];
  const stillFailed = [];
  let successful = 0;

  for (const item of toRetry) {
    const dateStr = typeof item === 'string' ? item : item.date;
    try {
      generateDailyTelemetryDataset(dateStr, dateStr <= INITIAL_END_DATE);
      successful++;
    } catch (err) {
      stillFailed.push({ date: dateStr, error: err.message, timestamp: new Date().toISOString() });
    }
  }

  config.failedDates = stillFailed;
  saveSchedulerConfig(config);

  return {
    ok: true,
    retriedCount: toRetry.length,
    successfulCount: successful,
    stillFailed,
  };
}

/**
 * Daily cron execution callback (Runs at 00:05 Asia/Kolkata)
 */
function onDailyScheduledRun() {
  const config = loadSchedulerConfig();
  if (config.status !== 'ACTIVE') {
    console.log(`[SCHEDULER] Skipping daily run because status is ${config.status}.`);
    return;
  }

  const todayStr = getTodayKolkata();
  console.log(`[SCHEDULER] Executing daily scheduled telemetry generation for ${todayStr} (Asia/Kolkata)...`);

  try {
    const result = generateDailyTelemetryDataset(todayStr, false);
    config.lastGeneratedDate = todayStr;
    config.lastRunAt = new Date().toISOString();
    config.lastRunStatus = 'SUCCESS';

    config.history.unshift({
      action: 'DAILY_SCHEDULED_RUN',
      date: todayStr,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      filename: result.filename,
    });

    if (config.history.length > 50) config.history.pop();
    saveSchedulerConfig(config);
    console.log(`[SCHEDULER] Daily dataset generated successfully: ${result.filename} (${result.compressedSizeBytes} bytes gzipped)`);
  } catch (err) {
    console.error(`[SCHEDULER] Daily generation failed for ${todayStr}:`, err.message);
    config.lastRunAt = new Date().toISOString();
    config.lastRunStatus = 'FAILED';
    config.failedDates.push({ date: todayStr, error: err.message, timestamp: new Date().toISOString() });
    saveSchedulerConfig(config);
  }
}

/**
 * Arm or re-arm the daily cron job
 */
function armCronJob() {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
  }

  if (!cron) {
    console.warn('[SCHEDULER] node-cron not available; cron scheduling bypassed.');
    return;
  }

  scheduledJob = cron.schedule(CRON_SCHEDULE, onDailyScheduledRun, {
    scheduled: true,
    timezone: TIMEZONE,
  });

  console.log(`[SCHEDULER] Daily cron job armed for ${CRON_SCHEDULE} (${TIMEZONE}). Next scheduled run: ${getNextScheduledTime()}`);
}

/**
 * Initialize scheduler on backend startup
 */
function initScheduler() {
  console.log('[SCHEDULER] Initializing MARISLINK Dataset Generation Engine...');
  const config = loadSchedulerConfig();

  // If status was ACTIVE, perform automatic catch-up on server start
  if (config.status === 'ACTIVE') {
    try {
      console.log('[SCHEDULER] Auto catch-up on startup active. Checking date coverage...');
      catchupMissingDates();
    } catch (err) {
      console.warn('[SCHEDULER] Startup catch-up encountered issue:', err.message);
    }
    armCronJob();
  } else {
    console.log(`[SCHEDULER] Scheduler status is ${config.status}. Standing by.`);
  }

  return config;
}

/**
 * Start or resume scheduler
 */
function startScheduler() {
  const config = loadSchedulerConfig();
  config.status = 'ACTIVE';
  saveSchedulerConfig(config);

  // Catch up any missing dates immediately
  catchupMissingDates();
  armCronJob();

  return config;
}

/**
 * Pause scheduler without resetting settings
 */
function pauseScheduler() {
  const config = loadSchedulerConfig();
  config.status = 'PAUSED';
  if (scheduledJob) {
    scheduledJob.stop();
  }
  saveSchedulerConfig(config);
  console.log('[SCHEDULER] Daily generation PAUSED by operator.');
  return config;
}

/**
 * Resume scheduler from paused state
 */
function resumeScheduler() {
  return startScheduler();
}

/**
 * Stop scheduler permanently (disables future runs, preserves all existing datasets)
 */
function stopScheduler() {
  const config = loadSchedulerConfig();
  config.status = 'STOPPED';
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
  }
  saveSchedulerConfig(config);
  console.log('[SCHEDULER] Daily generation STOPPED by operator. Existing datasets preserved.');
  return config;
}

/**
 * Get comprehensive scheduler and backfill status
 */
function getSchedulerStatus() {
  const config = loadSchedulerConfig();
  const manifest = datasetStorage.loadManifest();

  // Calculate actual backfilled / daily datasets count from manifest
  const dailyDatasets = manifest.datasets.filter((d) => d.filename.startsWith('marislink_telemetry_'));
  const datesGenerated = Array.from(new Set(dailyDatasets.map((d) => d.date))).sort();
  const totalCompressedBytes = dailyDatasets.reduce((sum, d) => sum + (d.compressedSizeBytes || 0), 0);
  const totalRawBytes = dailyDatasets.reduce((sum, d) => sum + (d.rawSizeBytes || 0), 0);

  return {
    config,
    isBackfillRunning,
    summary: {
      totalDailyDatasets: dailyDatasets.length,
      datesAvailableCount: datesGenerated.length,
      earliestDate: datesGenerated[0] || null,
      latestDate: datesGenerated[datesGenerated.length - 1] || null,
      totalCompressedBytes,
      totalRawBytes,
      spaceSavedPercent: totalRawBytes > 0 ? Math.round(((totalRawBytes - totalCompressedBytes) / totalRawBytes) * 1000) / 10 : 0,
      failedDatesCount: config.failedDates.length,
    },
  };
}

module.exports = {
  START_DATE,
  INITIAL_END_DATE,
  TIMEZONE,
  CRON_SCHEDULE,
  loadSchedulerConfig,
  saveSchedulerConfig,
  generateDailyTelemetryDataset,
  runHistoricalBackfill,
  catchupMissingDates,
  retryFailedDates,
  initScheduler,
  startScheduler,
  pauseScheduler,
  resumeScheduler,
  stopScheduler,
  getSchedulerStatus,
};
