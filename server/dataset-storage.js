/**
 * ==============================================================================
 * MARISLINK: Automatic Dataset Storage & Date-Wise Organization Engine
 * ==============================================================================
 * Manages permanent, low-storage GZIP-compressed dataset persistence in:
 * `DATA _SETmarislink/`
 *
 * Folder Structure:
 * DATA _SETmarislink/
 *   YYYY-MM-DD/
 *     generated_datasets/    -> Descriptively named *.csv.gz
 *     uploaded_datasets/     -> Custom user uploads compressed to *.csv.gz
 *     spark_results/         -> Associated Spark results JSON
 *       archived_results/    -> Prior Spark run outputs
 *   dataset_metadata/
 *     dataset_manifest.json  -> Master catalog tracking all files & metrics
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CANONICAL_PROJECT_ROOT = '/home/mounish/project/ProjectAM/agile methology';
const PROJECT_ROOT = fs.existsSync(CANONICAL_PROJECT_ROOT) ? CANONICAL_PROJECT_ROOT : path.resolve(__dirname, '..');
const CANONICAL_STORAGE_ROOT = path.join(PROJECT_ROOT, 'DATA _SETmarislink');
const DATA_STORE_ROOT = CANONICAL_STORAGE_ROOT;
const METADATA_DIR = path.join(DATA_STORE_ROOT, 'dataset_metadata');
const MANIFEST_PATH = path.join(METADATA_DIR, 'dataset_manifest.json');
const LEGACY_DATASETS_DIR = path.join(PROJECT_ROOT, 'data', 'spark-datasets');

/**
 * Returns current timestamp in Asia/Kolkata timezone
 */
function getKolkataTime() {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // "YYYY-MM-DD"

  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(now)
    .replace(/:/g, ''); // "HHMMSS"

  const displayTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(now);

  return { dateStr, timeStr, displayTime, iso: now.toISOString() };
}

/**
 * Ensures date-wise directories exist for a given date string
 */
function ensureDateFoldersExist(dateStr) {
  const rootGenerated = path.join(DATA_STORE_ROOT, 'generated_datasets');
  const rootUploaded = path.join(DATA_STORE_ROOT, 'uploaded_datasets');
  const rootSparkResults = path.join(DATA_STORE_ROOT, 'spark_results');
  const rootArchivedResults = path.join(rootSparkResults, 'archived_results');

  const dateDir = path.join(DATA_STORE_ROOT, dateStr);
  const generatedDir = path.join(dateDir, 'generated_datasets');
  const uploadedDir = path.join(dateDir, 'uploaded_datasets');
  const resultsDir = path.join(dateDir, 'spark_results');
  const archiveDir = path.join(resultsDir, 'archived_results');

  [
    DATA_STORE_ROOT,
    METADATA_DIR,
    rootGenerated,
    rootUploaded,
    rootSparkResults,
    rootArchivedResults,
    dateDir,
    generatedDir,
    uploadedDir,
    resultsDir,
    archiveDir,
  ].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  return { dateDir, generatedDir, uploadedDir, resultsDir, archiveDir, rootGenerated, rootUploaded, rootSparkResults, rootArchivedResults };
}

/**
 * Loads the master manifest or returns default structure
 */
function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      const content = fs.readFileSync(MANIFEST_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (!parsed.summary || !parsed.summary.earliestDate || parsed.summary.processedDatasets === undefined) {
        return saveManifest(parsed);
      }
      return parsed;
    } catch (err) {
      console.warn('[STORAGE] Failed to parse manifest, re-initializing:', err.message);
    }
  }

  return {
    version: '1.0',
    description: 'MARISLINK Date-Wise Dataset & Spark Analytics Master Catalog',
    timezone: 'Asia/Kolkata',
    storageRoot: 'DATA _SETmarislink',
    updatedAt: new Date().toISOString(),
    datasets: [],
    summary: {
      totalDatasets: 0,
      totalGenerated: 0,
      totalUploaded: 0,
      totalRecords: 0,
      totalCompressedBytes: 0,
      totalRawBytes: 0,
      spaceSavedPercent: 0,
      datesAvailable: [],
      diskUsageByDate: {},
      diskUsageByCategory: { GENERATED: 0, UPLOADED: 0, SPARK_RESULTS: 0 },
    },
  };
}

/**
 * Recalculates aggregate metrics and saves manifest
 */
function saveManifest(manifest) {
  ensureDateFoldersExist(getKolkataTime().dateStr);

  const datesSet = new Set();
  let totalRecords = 0;
  let totalCompBytes = 0;
  let totalRawBytes = 0;
  let genCount = 0;
  let upCount = 0;
  const usageByDate = {};
  const usageByCategory = { GENERATED: 0, UPLOADED: 0, SPARK_RESULTS: 0 };

  let processedCount = 0;
  const allNodesSet = new Set();

  manifest.datasets.forEach((ds) => {
    datesSet.add(ds.date);
    totalRecords += ds.recordCount || 0;
    const compSize = ds.compressedSizeBytes || 0;
    const rawSize = ds.rawSizeBytes || compSize;
    totalCompBytes += compSize;
    totalRawBytes += rawSize;

    if (ds.sparkStatus === 'COMPLETED') {
      processedCount++;
    }

    if (Array.isArray(ds.uniqueNodes)) {
      ds.uniqueNodes.forEach((n) => allNodesSet.add(n));
    }

    if (ds.category === 'GENERATED') {
      genCount++;
      usageByCategory.GENERATED += compSize;
    } else {
      upCount++;
      usageByCategory.UPLOADED += compSize;
    }

    if (!usageByDate[ds.date]) {
      usageByDate[ds.date] = { count: 0, records: 0, compressedBytes: 0, rawBytes: 0 };
    }
    usageByDate[ds.date].count++;
    usageByDate[ds.date].records += ds.recordCount || 0;
    usageByDate[ds.date].compressedBytes += compSize;
    usageByDate[ds.date].rawBytes += rawSize;
  });

  // Calculate results directory sizes
  try {
    const dates = fs.readdirSync(DATA_STORE_ROOT);
    dates.forEach((d) => {
      const resDir = path.join(DATA_STORE_ROOT, d, 'spark_results');
      if (fs.existsSync(resDir)) {
        const files = fs.readdirSync(resDir);
        files.forEach((f) => {
          if (f.endsWith('.json')) {
            const stat = fs.statSync(path.join(resDir, f));
            usageByCategory.SPARK_RESULTS += stat.size;
          }
        });
      }
    });
  } catch {}

  const spaceSaved = totalRawBytes > 0 ? Math.round(((totalRawBytes - totalCompBytes) / totalRawBytes) * 1000) / 10 : 0;
  const sortedDates = Array.from(datesSet).sort();

  manifest.updatedAt = new Date().toISOString();
  manifest.summary = {
    totalDatasets: manifest.datasets.length,
    totalGenerated: genCount,
    totalUploaded: upCount,
    totalRecords,
    totalCompressedBytes: totalCompBytes,
    totalRawBytes,
    spaceSavedPercent: Math.max(0, spaceSaved),
    processedDatasets: processedCount,
    pendingDatasets: manifest.datasets.length - processedCount,
    totalSimulatedNodes: allNodesSet.size > 0 ? allNodesSet.size : 20,
    earliestDate: sortedDates[0] || null,
    latestDate: sortedDates[sortedDates.length - 1] || null,
    datesAvailable: [...sortedDates].reverse(),
    diskUsageByDate: usageByDate,
    diskUsageByCategory: usageByCategory,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  return manifest;
}

/**
 * Analyzes raw CSV text for record count, unique nodes, and column headers
 */
function analyzeCsvContent(csvString) {
  const lines = csvString.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { recordCount: 0, columns: [], uniqueNodes: [], sampleRows: [] };
  }

  const columns = lines[0].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
  const nodeIdx = columns.findIndex((c) => /node_?id/i.test(c));
  const nodeSet = new Set();
  const sampleRows = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
    if (nodeIdx !== -1 && parts[nodeIdx]) {
      nodeSet.add(parts[nodeIdx]);
    }
    if (sampleRows.length < 10) {
      const rowObj = {};
      columns.forEach((col, idx) => {
        rowObj[col] = parts[idx] ?? '';
      });
      sampleRows.push(rowObj);
    }
  }

  return {
    recordCount: lines.length - 1,
    columns,
    uniqueNodes: Array.from(nodeSet).sort(),
    sampleRows,
  };
}

/**
 * Saves a CSV dataset as GZIP-compressed .csv.gz in DATA _SETmarislink
 */
function saveGzippedDataset({
  rawContent,
  category = 'GENERATED', // 'GENERATED' | 'UPLOADED'
  descriptivePrefix = 'telemetry',
  customFilename = null,
  sourceLabel = 'SIMULATION DATA (MARISLINK Acoustic Propagation Engine)',
  dateOverride = null,
}) {
  const { dateStr, timeStr, displayTime, iso } = getKolkataTime();
  const activeDate = dateOverride || dateStr;
  const folders = ensureDateFoldersExist(activeDate);

  const targetDir = category === 'UPLOADED' ? folders.uploadedDir : folders.generatedDir;

  let finalFilename;
  if (customFilename) {
    const base = customFilename.endsWith('.csv.gz')
      ? customFilename.slice(0, -7)
      : customFilename.endsWith('.csv')
        ? customFilename.slice(0, -4)
        : customFilename;
    const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, '_');
    finalFilename = `${safeBase}_${timeStr}.csv.gz`;
  } else {
    finalFilename = `${descriptivePrefix}_${timeStr}.csv.gz`;
  }

  const absoluteFilePath = path.join(targetDir, finalFilename);
  const relativeFilePath = path.relative(PROJECT_ROOT, absoluteFilePath);

  // Analyze CSV content before compression
  const analysis = analyzeCsvContent(rawContent);

  // Compress using GZIP
  const rawBuffer = Buffer.from(rawContent, 'utf8');
  const gzippedBuffer = zlib.gzipSync(rawBuffer, { level: 9 });

  fs.writeFileSync(absoluteFilePath, gzippedBuffer);

  // Ensure top-level directory also contains the dataset file for direct access
  try {
    const rootTargetDir = category === 'UPLOADED' ? folders.rootUploaded : folders.rootGenerated;
    const rootTargetPath = path.join(rootTargetDir, finalFilename);
    if (!fs.existsSync(rootTargetPath)) {
      try {
        fs.linkSync(absoluteFilePath, rootTargetPath);
      } catch {
        fs.copyFileSync(absoluteFilePath, rootTargetPath);
      }
    }
  } catch (err) {}

  const datasetId = `ds_${activeDate.replace(/-/g, '')}_${timeStr}_${Math.random().toString(36).substring(2, 6)}`;

  const newEntry = {
    id: datasetId,
    filename: finalFilename,
    relativePath: relativeFilePath,
    absolutePath: absoluteFilePath,
    date: activeDate,
    time: timeStr,
    displayTime,
    createdAt: iso,
    category,
    source: sourceLabel,
    recordCount: analysis.recordCount,
    uniqueNodeCount: analysis.uniqueNodes.length,
    uniqueNodes: analysis.uniqueNodes,
    columns: analysis.columns,
    rawSizeBytes: rawBuffer.length,
    compressedSizeBytes: gzippedBuffer.length,
    compressionRatioPercent:
      rawBuffer.length > 0 ? Math.round(((rawBuffer.length - gzippedBuffer.length) / rawBuffer.length) * 1000) / 10 : 0,
    sparkStatus: 'PENDING',
    resultFilename: null,
    resultPath: null,
    lastProcessedAt: null,
  };

  const manifest = loadManifest();
  // Filter out any identical existing relative path
  manifest.datasets = [newEntry, ...manifest.datasets.filter((d) => d.relativePath !== relativeFilePath)];
  saveManifest(manifest);

  console.log(`[STORAGE] Saved ${category} dataset: ${relativeFilePath} (${analysis.recordCount} records, ${gzippedBuffer.length} bytes gzipped)`);
  return newEntry;
}

/**
 * Saves Spark execution JSON results in DATA _SETmarislink/<date>/spark_results/
 */
function saveSparkResultForDataset({ datasetPath, sparkResultsJson, jobId, durationMs }) {
  const { dateStr, timeStr, iso } = getKolkataTime();
  const manifest = loadManifest();

  // Find corresponding dataset in manifest if known
  const normPath = path.normalize(datasetPath);
  const matchedEntry = manifest.datasets.find(
    (d) =>
      path.normalize(d.absolutePath) === normPath ||
      path.normalize(path.join(PROJECT_ROOT, d.relativePath)) === normPath ||
      normPath.endsWith(d.filename)
  );

  const targetDate = matchedEntry?.date || dateStr;
  const folders = ensureDateFoldersExist(targetDate);

  const baseName = matchedEntry
    ? matchedEntry.filename.replace(/\.csv(\.gz)?$/, '')
    : path.basename(datasetPath).replace(/\.csv(\.gz)?$/, '');

  const resultFilename = `${baseName}_${timeStr}_results.json`;
  const resultAbsolutePath = path.join(folders.resultsDir, resultFilename);
  const resultRelativePath = path.relative(PROJECT_ROOT, resultAbsolutePath);

  // If previous active result existed, archive it
  if (matchedEntry && matchedEntry.resultPath) {
    const prevAbsPath = path.join(PROJECT_ROOT, matchedEntry.resultPath);
    if (fs.existsSync(prevAbsPath) && prevAbsPath !== resultAbsolutePath) {
      const archPath = path.join(folders.archiveDir, path.basename(prevAbsPath));
      try {
        fs.renameSync(prevAbsPath, archPath);
      } catch {}
    }
  }

  // Ensure JSON has rich metadata
  const payloadToSave = {
    storageMetadata: {
      storageFolder: 'DATA _SETmarislink',
      date: targetDate,
      savedAt: iso,
      timezone: 'Asia/Kolkata',
      jobId,
      sourceDataset: datasetPath,
      datasetFilename: matchedEntry?.filename || path.basename(datasetPath),
      recordCount: sparkResultsJson.summary?.totalRecords || matchedEntry?.recordCount || 0,
      nodesDetected: sparkResultsJson.summary?.nodesDetected || matchedEntry?.uniqueNodeCount || 0,
      executionDurationMs: durationMs,
      sparkStatus: 'COMPLETED',
    },
    ...sparkResultsJson,
  };

  fs.writeFileSync(resultAbsolutePath, JSON.stringify(payloadToSave, null, 2), 'utf8');
  try {
    const rootArchiveDir = path.join(DATA_STORE_ROOT, 'spark_results', 'archived_results');
    if (fs.existsSync(rootArchiveDir)) {
      fs.copyFileSync(resultAbsolutePath, path.join(rootArchiveDir, resultFilename));
    }
  } catch {}

  // Update manifest entry
  if (matchedEntry) {
    matchedEntry.sparkStatus = 'COMPLETED';
    matchedEntry.resultFilename = resultFilename;
    matchedEntry.resultPath = resultRelativePath;
    matchedEntry.lastProcessedAt = iso;
    matchedEntry.lastJobId = jobId;
    saveManifest(manifest);
  }

  console.log(`[STORAGE] Saved Spark results JSON: ${resultRelativePath}`);
  return { resultFilename, resultRelativePath, resultAbsolutePath };
}

/**
 * Reads and decompresses sample rows from a .csv.gz file
 */
function previewGzippedDataset(requestedPath, maxRows = 15) {
  const safeAbsPath = resolveSecurePath(requestedPath);
  if (!fs.existsSync(safeAbsPath)) {
    throw new Error(`File does not exist: ${requestedPath}`);
  }

  let rawContent;
  if (safeAbsPath.endsWith('.gz')) {
    const fileBuf = fs.readFileSync(safeAbsPath);
    rawContent = zlib.gunzipSync(fileBuf).toString('utf8');
  } else {
    rawContent = fs.readFileSync(safeAbsPath, 'utf8');
  }

  const analysis = analyzeCsvContent(rawContent);
  const stat = fs.statSync(safeAbsPath);

  return {
    filename: path.basename(safeAbsPath),
    relativePath: path.relative(PROJECT_ROOT, safeAbsPath),
    totalRecords: analysis.recordCount,
    columns: analysis.columns,
    uniqueNodes: analysis.uniqueNodes,
    preview: analysis.sampleRows.slice(0, maxRows),
    fileSizeBytes: stat.size,
    isGzipped: safeAbsPath.endsWith('.gz'),
  };
}

/**
 * Resolves a requested path and ensures no path traversal outside project root
 */
function resolveSecurePath(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('Invalid path provided.');
  }

  // Prevent path traversal
  const normalized = path.normalize(inputPath);
  const absPath = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(PROJECT_ROOT, normalized);

  const allowedPrefixes = [
    DATA_STORE_ROOT,
    LEGACY_DATASETS_DIR,
    path.join(PROJECT_ROOT, 'server', 'jobs'),
    path.join(PROJECT_ROOT, 'server', 'uploads'),
  ];

  const isAllowed = allowedPrefixes.some((prefix) => absPath.startsWith(prefix));
  if (!isAllowed) {
    throw new Error('Access denied: Path is outside permitted project dataset repositories.');
  }

  return absPath;
}

/**
 * Initial Seeding: Pre-populates DATA _SETmarislink with existing benchmark datasets
 */
function seedInitialStorage() {
  const { dateStr } = getKolkataTime();
  ensureDateFoldersExist(dateStr);
  const manifest = loadManifest();

  // If already seeded with 4+ datasets, do not duplicate
  if (manifest.datasets.length >= 5) {
    return;
  }

  const benchmarks = [
    {
      sourceFile: 'live_device_telemetry.csv',
      prefix: 'live_device_telemetry',
      label: 'SIMULATION DATA (Live Fleet Telemetry Snapshot)',
    },
    {
      sourceFile: 'marislink_underwater_telemetry_primary.csv',
      prefix: 'primary_fleet_telemetry',
      label: 'SIMULATION DATA (Primary 12-Node Nominal Telemetry)',
    },
    {
      sourceFile: 'marislink_telemetry_with_anomalies.csv',
      prefix: 'anomalies_dataset',
      label: 'SIMULATION DATA (Out-of-Bounds Fault Injected Telemetry)',
    },
    {
      sourceFile: 'marislink_deep_sea_stress_test.csv',
      prefix: 'deep_sea_stress_test',
      label: 'SIMULATION DATA (Deep Ocean 5000m Pressure Telemetry)',
    },
    {
      sourceFile: 'marislink_verification_second_dataset.csv',
      prefix: 'verification_dataset',
      label: 'SIMULATION DATA (Dynamic Verification Multi-Node Telemetry)',
    },
  ];

  benchmarks.forEach((bm) => {
    const srcPath = path.join(LEGACY_DATASETS_DIR, bm.sourceFile);
    if (fs.existsSync(srcPath)) {
      try {
        const raw = fs.readFileSync(srcPath, 'utf8');
        // Check if already in manifest
        const exists = manifest.datasets.some((d) => d.filename.startsWith(bm.prefix));
        if (!exists) {
          saveGzippedDataset({
            rawContent: raw,
            category: 'GENERATED',
            descriptivePrefix: bm.prefix,
            sourceLabel: bm.label,
          });
        }
      } catch (err) {
        console.warn(`[STORAGE] Seeding failed for ${bm.sourceFile}:`, err.message);
      }
    }
  });

  console.log('[STORAGE] Initial date-wise dataset repository verified in DATA _SETmarislink/');
}

// Automatically seed on module load
seedInitialStorage();

module.exports = {
  PROJECT_ROOT,
  DATA_STORE_ROOT,
  METADATA_DIR,
  MANIFEST_PATH,
  getKolkataTime,
  ensureDateFoldersExist,
  loadManifest,
  saveManifest,
  saveGzippedDataset,
  saveSparkResultForDataset,
  previewGzippedDataset,
  resolveSecurePath,
  seedInitialStorage,
};
