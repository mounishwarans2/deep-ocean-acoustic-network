// MARISLINK: Spark & Big Data API Client
// Connects frontend to the real Apache Spark backend orchestrator

const RESOLVED_API_BASE = (() => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  // When running on production domain (e.g. Vercel), default to Render backend if no relative proxy or base URL configured
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://deep-ocean-acoustic-network.onrender.com';
  }
  return '';
})();

const API_BASE_URL = RESOLVED_API_BASE;

/**
 * Safe fetch helper that guarantees we never throw:
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 *
 * Validates:
 *  - Network connectivity
 *  - HTTP status codes (2xx vs error status)
 *  - Content-Type and response body length (reads text first)
 *  - Returns parsed JSON or structured error with diagnostic details
 */
async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  fallbackErrMsg = 'API request failed'
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: unknown) {
    const msg = netErr instanceof Error ? netErr.message : String(netErr);
    throw new Error(`Failed to connect to backend at ${url}: ${msg}`);
  }

  const rawText = await res.text();
  let parsed: any = null;

  if (rawText && rawText.trim().length > 0) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Body is not valid JSON (e.g. HTML 404/502/405 page from reverse proxy or server)
      const cleanSnippet = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
      throw new Error(
        `Server returned non-JSON response (HTTP ${res.status} ${res.statusText}): ${cleanSnippet || fallbackErrMsg}`
      );
    }
  }

  if (!res.ok) {
    const errorMsg =
      parsed?.error ||
      parsed?.message ||
      `Server returned HTTP ${res.status} (${res.statusText || fallbackErrMsg})`;
    throw new Error(errorMsg);
  }

  if (parsed === null) {
    // Empty body on a 2xx response
    return {} as T;
  }

  return parsed as T;
}

export interface SparkSampleDataset {
  id: string;
  name: string;
  filename: string;
  description: string;
  isDefault: boolean;
  path: string;
  sizeBytes: number;
  recordCount: number;
  columns: string[];
}

export interface SparkDatasetPreview {
  ok: boolean;
  path: string;
  filename: string;
  sizeBytes: number;
  columns: string[];
  preview: Record<string, string>[];
  totalRecords: number;
}

export interface SparkUploadResult {
  ok: boolean;
  filename: string;
  originalName: string;
  sizeBytes: number;
  path: string;
  columns: string[];
  preview: Record<string, string>[];
  totalRecords: number;
  validation: {
    isValidCsv: boolean;
    hasNodeId: boolean;
    hasLatency: boolean;
    hasBattery: boolean;
    hasPacketLoss: boolean;
    matchedColumnsRatio: number;
  };
}

export interface LiveDevice {
  id: string;
  nodeId: string;
  name: string;
  type: string;
  depth: number;
  temperature: number;
  pressure: number;
  battery: number;
  batteryLevel?: number;
  battery_level?: number;
  signalStrength: number;
  latency: number;
  packetLoss: number;
  communicationStatus: string;
  nodeStatus: string;
  lastUpdate: string;
  recordCount: number;
  sensors: string[];
  dataSource: string;
}

export interface FleetSummary {
  totalDevices: number;
  activeDevices: number;
  warningDevices: number;
  criticalDevices: number;
  averageLatency: number;
  averagePacketLoss: number;
  averageBattery: number;
  averageBatteryLevel?: number;
  totalRecordsProcessed: number;
  networkHealthIndex: number;
  telemetrySource: string;
}

export interface LiveFleetResponse {
  ok: boolean;
  dataSource: string;
  summary: FleetSummary;
  devices: LiveDevice[];
}

export interface NodeMetric {
  nodeId: string;
  recordCount: number;
  firstTimestamp?: string;
  latestTimestamp?: string;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  avgPacketLoss: number;
  avgBattery: number;
  avgBatteryLevel?: number;
  batteryLevel?: number;
  battery?: number;
  avgSignalStrength: number;
  avgDepth: number;
  avgTemperature: number;
  avgPressure: number;
  stabilityPercent?: number;
  availabilityPercent?: number;
  batteryTrend?: string;
  healthStatus: 'OPTIMAL' | 'STABLE' | 'DEGRADED' | 'CRITICAL';
}

export interface SparkExecutionSummary {
  totalRecords: number;
  duplicateRecords?: number;
  validRecords: number;
  invalidRecords: number;
  nodesDetected: number;
  activeNodes?: number;
  warningNodes?: number;
  criticalNodes?: number;
  availabilityScore?: number;
  networkHealthScore?: number;
  healthFormula?: string;
  overallAvgLatency: number;
  overallAvgPacketLoss: number;
  overallAvgBattery: number;
  overallAvgBatteryLevel?: number;
  overallAvgSignalStrength: number;
}

export interface DeviceHistoryPoint {
  timestamp: string;
  timeLabel: string;
  latency: number;
  packetLoss: number;
  battery: number;
  batteryLevel?: number;
  battery_level?: number;
  signalStrength: number;
  temperature: number;
  pressure: number;
  depth: number;
  status: string;
}

export interface DeviceHistoryMetrics {
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  avgPacketLoss: number;
  avgBattery: number;
  avgBatteryLevel?: number;
  batteryLevel?: number;
  battery?: number;
  batteryDrop: number;
  batteryTrend: string;
  avgSignalStrength: number;
  avgTemperature: number;
  avgPressure: number;
  stabilityPercent: number;
  availabilityPercent: number;
  statusCounts: Record<string, number>;
}

export interface DeviceHistoryResponse {
  ok: boolean;
  nodeId: string;
  name: string;
  type: string;
  sensors: string[];
  timeRangeApplied: string;
  firstTimestamp: string;
  latestTimestamp: string;
  totalRecords: number;
  totalFleetRecordsForNode: number;
  metrics: DeviceHistoryMetrics;
  sparkOutput: NodeMetric | null;
  historyPoints: DeviceHistoryPoint[];
  dataSource: string;
}

export interface SparkResultsPayload {
  metadata: {
    engine: string;
    language: string;
    executedAt: string;
    executionTimeMs: number;
    inputDataset: string;
    status: string;
  };
  summary: SparkExecutionSummary;
  nodeMetrics: NodeMetric[];
  sampleCleanRecords: Record<string, unknown>[];
  sampleInvalidRecords: Record<string, unknown>[];
}

export interface SparkJobStatus {
  jobId: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';
  datasetName: string;
  datasetPath?: string;
  startTime: number;
  endTime: number | null;
  durationMs: number | null;
  logCount?: number;
  latestLog?: string;
  results: SparkResultsPayload | null;
  error: string | null;
}

export interface ScalaSourceResponse {
  ok: boolean;
  filename: string;
  language: string;
  sourceCode: string;
  lineCount: number;
  path: string;
  modules: { name: string; lines: string; description: string }[];
}

export interface KafkaStatusResponse {
  ok: boolean;
  status: string;
  stage: string;
  broker: string;
  topic: string;
  consumerGroup: string;
  partitions: number;
  replicationFactor: number;
  schemaRegistry: string;
  description: string;
  isLive: boolean;
  reason: string;
}

export interface CassandraStatusResponse {
  ok: boolean;
  status: string;
  stage: string;
  keyspace: string;
  table: string;
  contactPoints: string[];
  replicationStrategy: string;
  replicationFactor: number;
  cqlSchema: string;
  description: string;
  isLive: boolean;
  reason: string;
}

// ── API Fetchers ─────────────────────────────────────────────────────────────

export async function fetchSampleDatasets(): Promise<SparkSampleDataset[]> {
  const data = await safeFetchJson<{ ok: boolean; samples: SparkSampleDataset[] }>(
    `${API_BASE_URL}/api/spark/samples`,
    undefined,
    'Failed to load sample datasets'
  );
  return data.samples || [];
}

export async function fetchDatasetPreview(pathOrFilename: string): Promise<SparkDatasetPreview> {
  const param = encodeURIComponent(pathOrFilename);
  return await safeFetchJson<SparkDatasetPreview>(
    `${API_BASE_URL}/api/spark/dataset-preview?filename=${param}`,
    undefined,
    'Failed to preview dataset'
  );
}

export async function uploadDatasetFile(file: File): Promise<SparkUploadResult> {
  const formData = new FormData();
  formData.append('dataset', file);
  return await safeFetchJson<SparkUploadResult>(
    `${API_BASE_URL}/api/spark/upload`,
    {
      method: 'POST',
      body: formData,
    },
    'Upload failed'
  );
}

export async function executeSparkJob(
  datasetPath: string,
  datasetName?: string
): Promise<{ ok: boolean; jobId: string; status: string; message: string }> {
  return await safeFetchJson<{ ok: boolean; jobId: string; status: string; message: string }>(
    `${API_BASE_URL}/api/spark/execute`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasetPath, datasetName }),
    },
    'Failed to start Spark job'
  );
}

export async function fetchJobStatus(jobId: string): Promise<SparkJobStatus> {
  const data = await safeFetchJson<{ ok: boolean; job: SparkJobStatus }>(
    `${API_BASE_URL}/api/spark/status/${encodeURIComponent(jobId)}`,
    undefined,
    'Status check failed'
  );
  return data.job;
}

export async function fetchJobLogs(
  jobId: string,
  offset = 0
): Promise<{ logs: string[]; totalLogs: number; status: string }> {
  const data = await safeFetchJson<{
    logs?: string[];
    lines?: string[];
    totalLogs?: number;
    totalLines?: number;
    status: string;
  }>(
    `${API_BASE_URL}/api/spark/logs/${encodeURIComponent(jobId)}?offset=${offset}`,
    undefined,
    'Log fetch failed'
  );
  return {
    logs: data.logs || (data.lines ? data.lines : []),
    totalLogs: data.totalLogs || (data.totalLines ? data.totalLines : 0),
    status: data.status,
  };
}

export async function fetchScalaSource(): Promise<ScalaSourceResponse> {
  return await safeFetchJson<ScalaSourceResponse>(
    `${API_BASE_URL}/api/spark/scala-source`,
    undefined,
    'Failed to load Scala source'
  );
}

export async function fetchLatestJob(): Promise<SparkJobStatus | null> {
  try {
    const data = await safeFetchJson<{ ok: boolean; job: SparkJobStatus | null }>(
      `${API_BASE_URL}/api/spark/latest`,
      undefined,
      'Failed to load latest job'
    );
    return data.job || null;
  } catch {
    return null;
  }
}

export async function fetchKafkaStatus(): Promise<KafkaStatusResponse> {
  return await safeFetchJson<KafkaStatusResponse>(
    `${API_BASE_URL}/api/spark/kafka-status`,
    undefined,
    'Failed to fetch Kafka status'
  );
}

export async function fetchCassandraStatus(): Promise<CassandraStatusResponse> {
  return await safeFetchJson<CassandraStatusResponse>(
    `${API_BASE_URL}/api/spark/cassandra-status`,
    undefined,
    'Failed to fetch Cassandra status'
  );
}

export async function produceKafkaTestMessage(): Promise<{ ok: boolean; message: string; event: Record<string, unknown> }> {
  return await safeFetchJson<{ ok: boolean; message: string; event: Record<string, unknown> }>(
    `${API_BASE_URL}/api/spark/kafka-test-produce`,
    { method: 'POST' },
    'Kafka produce test failed'
  );
}

// ── Device-Based Automatic Big Data Analytics Methods ────────────────────────

export async function fetchLiveFleetDevices(): Promise<LiveFleetResponse> {
  return await safeFetchJson<LiveFleetResponse>(
    `${API_BASE_URL}/api/spark/live-devices`,
    undefined,
    'Failed to fetch live fleet devices'
  );
}

export async function ingestLiveTelemetry(
  readings: Record<string, unknown>[]
): Promise<{ ok: boolean; recordsAppended: number }> {
  return await safeFetchJson<{ ok: boolean; recordsAppended: number }>(
    `${API_BASE_URL}/api/spark/ingest-live`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readings }),
    },
    'Failed to ingest live telemetry'
  );
}

export async function executeDeviceAnalytics(): Promise<{ ok: boolean; jobId: string; status: string; message: string }> {
  return await safeFetchJson<{ ok: boolean; jobId: string; status: string; message: string }>(
    `${API_BASE_URL}/api/spark/execute-device-analytics`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    'Failed to trigger device analytics'
  );
}

export async function fetchDeviceHistory(nodeId: string, timeRange = 'all', date?: string): Promise<DeviceHistoryResponse> {
  let url = `${API_BASE_URL}/api/spark/device-history?nodeId=${encodeURIComponent(nodeId)}&timeRange=${encodeURIComponent(timeRange)}`;
  if (date && date !== 'LIVE') {
    url += `&date=${encodeURIComponent(date)}`;
  }
  return await safeFetchJson<DeviceHistoryResponse>(url, undefined, `Failed to fetch history for ${nodeId}`);
}

// ── Permanent Date-Wise DATA _SETmarislink Storage Methods ───────────────────

export interface DatasetManifestEntry {
  id: string;
  filename: string;
  relativePath: string;
  absolutePath: string;
  date: string;
  time: string;
  displayTime: string;
  createdAt: string;
  category: 'GENERATED' | 'UPLOADED';
  source: string;
  recordCount: number;
  uniqueNodeCount: number;
  uniqueNodes: string[];
  columns: string[];
  rawSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatioPercent: number;
  sparkStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  resultFilename?: string | null;
  resultPath?: string | null;
  lastProcessedAt?: string | null;
  lastJobId?: string | null;
}

export interface DatasetStorageSummary {
  totalDatasets: number;
  totalGenerated: number;
  totalUploaded: number;
  totalRecords: number;
  totalCompressedBytes: number;
  totalRawBytes: number;
  spaceSavedPercent: number;
  processedDatasets?: number;
  pendingDatasets?: number;
  totalSimulatedNodes?: number;
  earliestDate?: string | null;
  latestDate?: string | null;
  datesAvailable: string[];
  diskUsageByDate: Record<string, { count: number; records: number; compressedBytes: number; rawBytes: number }>;
  diskUsageByCategory: { GENERATED: number; UPLOADED: number; SPARK_RESULTS: number };
}

export interface DatasetStorageManifest {
  version: string;
  description: string;
  timezone: string;
  storageRoot: string;
  updatedAt: string;
  datasets: DatasetManifestEntry[];
  summary: DatasetStorageSummary;
}

export interface StoragePreviewResponse {
  ok: boolean;
  filename: string;
  relativePath: string;
  totalRecords: number;
  columns: string[];
  uniqueNodes: string[];
  preview: Record<string, string>[];
  fileSizeBytes: number;
  isGzipped: boolean;
}

export async function fetchStorageManifest(): Promise<DatasetStorageManifest> {
  const data = await safeFetchJson<{ ok: boolean; manifest: DatasetStorageManifest }>(
    `${API_BASE_URL}/api/spark/storage/manifest`,
    undefined,
    'Failed to load storage manifest'
  );
  return data.manifest;
}

export async function fetchStorageDatasetPreview(datasetPath: string, maxRows = 15): Promise<StoragePreviewResponse> {
  return await safeFetchJson<StoragePreviewResponse>(
    `${API_BASE_URL}/api/spark/storage/preview?path=${encodeURIComponent(datasetPath)}&maxRows=${maxRows}`,
    undefined,
    'Failed to preview stored dataset'
  );
}

export function getStorageDownloadUrl(datasetPath: string): string {
  return `${API_BASE_URL}/api/spark/storage/download?path=${encodeURIComponent(datasetPath)}`;
}

export async function snapshotLiveTelemetryToStorage(): Promise<{
  ok: boolean;
  dataset: DatasetManifestEntry;
  manifest: DatasetStorageManifest;
}> {
  return await safeFetchJson<{
    ok: boolean;
    dataset: DatasetManifestEntry;
    manifest: DatasetStorageManifest;
  }>(
    `${API_BASE_URL}/api/spark/storage/snapshot-telemetry`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    'Failed to snapshot telemetry'
  );
}

export async function executeSparkOnDataset(params: {
  datasetPath?: string;
  datasetName?: string;
  datasetId?: string;
}): Promise<{ ok: boolean; jobId: string; status: string; message: string }> {
  return await safeFetchJson<{ ok: boolean; jobId: string; status: string; message: string }>(
    `${API_BASE_URL}/api/spark/execute`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Failed to execute Spark on selected dataset'
  );
}

// ── Dataset Scheduler & Historical Backfill Client APIs ───────────────────────

export interface SchedulerConfig {
  version: string;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'RUNNING_BACKFILL';
  cronExpression: string;
  timezone: string;
  startDate: string;
  initialEndDate: string;
  lastGeneratedDate: string | null;
  nextScheduledRun: string;
  backfillCompleted: boolean;
  totalDatesTarget: number;
  totalDatesGenerated: number;
  failedDates: Array<{ date: string; error: string; timestamp?: string } | string>;
  history: Array<{ action?: string; timestamp?: string; status?: string; [key: string]: any }>;
  catchupPolicy: string;
  updatedAt: string;
  deploymentNote?: string;
}

export interface SchedulerSummary {
  totalDailyDatasets: number;
  datesAvailableCount: number;
  earliestDate: string | null;
  latestDate: string | null;
  totalCompressedBytes: number;
  totalRawBytes: number;
  spaceSavedPercent: number;
  failedDatesCount: number;
}

export interface SchedulerStatusResponse {
  ok: boolean;
  config: SchedulerConfig;
  isBackfillRunning: boolean;
  summary: SchedulerSummary;
  error?: string;
}

export async function fetchSchedulerStatus(): Promise<SchedulerStatusResponse> {
  return await safeFetchJson<SchedulerStatusResponse>(
    `${API_BASE_URL}/api/spark/scheduler/status`,
    undefined,
    'Failed to fetch scheduler status'
  );
}

export async function sendSchedulerControl(
  action: 'start' | 'pause' | 'resume' | 'stop' | 'catchup' | 'retry_failed' | 'run_backfill'
): Promise<SchedulerStatusResponse> {
  return await safeFetchJson<SchedulerStatusResponse>(
    `${API_BASE_URL}/api/spark/scheduler/control`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    },
    `Failed to execute scheduler action: ${action}`
  );
}

export async function triggerHistoricalBackfill(): Promise<SchedulerStatusResponse> {
  return await safeFetchJson<SchedulerStatusResponse>(
    `${API_BASE_URL}/api/spark/scheduler/backfill`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    'Failed to trigger historical backfill'
  );
}

// ── Historical Date Comparison & CSV Export Client APIs ───────────────────────

export interface DateComparisonItem {
  date: string;
  isProcessed: boolean;
  datasetFilename: string;
  datasetPath?: string;
  resultFilename?: string;
  resultPath?: string;
  recordCount: number;
  jobId?: string;
  executedAt?: string | null;
  executionTimeMs?: number;
  overallAvgLatency?: number;
  overallAvgPacketLoss?: number;
  overallAvgBatteryLevel?: number;
  overallAvgSignalStrength?: number;
  networkHealthScore?: number;
  availabilityScore?: number;
  nodesDetected?: number;
  activeNodes?: number;
  warningNodes?: number;
  criticalNodes?: number;
  healthDistribution?: {
    OPTIMAL: number;
    STABLE: number;
    DEGRADED: number;
    CRITICAL: number;
  };
  nodeMetrics?: Array<{
    nodeId: string;
    healthClassification: string;
    avgLatencyMs: number;
    avgPacketLoss: number;
    avgBatteryLevel: number;
    avgSignalStrength: number;
    avgTemperature: number;
    avgPressureMpa: number;
    stabilityPercent: number;
  }>;
  message?: string | null;
}

export interface HistoricalComparisonResponse {
  ok: boolean;
  datesRequested: string[];
  comparisons: DateComparisonItem[];
  totalProcessed: number;
  totalPending: number;
  error?: string;
}

export async function compareStoredDates(dates: string[]): Promise<HistoricalComparisonResponse> {
  const query = encodeURIComponent(dates.join(','));
  return await safeFetchJson<HistoricalComparisonResponse>(
    `${API_BASE_URL}/api/spark/storage/compare?dates=${query}`,
    undefined,
    'Failed to compare historical dates'
  );
}

export function getStorageExportCsvUrl(params: { date?: string; path?: string }): string {
  const query = params.date
    ? `date=${encodeURIComponent(params.date)}`
    : `path=${encodeURIComponent(params.path || '')}`;
  return `${API_BASE_URL}/api/spark/storage/export-csv?${query}`;
}
