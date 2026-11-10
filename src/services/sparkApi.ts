// MARISLINK: Spark & Big Data API Client
// Connects frontend to the real Apache Spark backend orchestrator

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

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
  const res = await fetch(`${API_BASE_URL}/api/spark/samples`);
  if (!res.ok) throw new Error(`Failed to load samples: ${res.statusText}`);
  const data = await res.json();
  return data.samples || [];
}

export async function fetchDatasetPreview(pathOrFilename: string): Promise<SparkDatasetPreview> {
  const param = encodeURIComponent(pathOrFilename);
  const res = await fetch(`${API_BASE_URL}/api/spark/dataset-preview?filename=${param}`);
  if (!res.ok) throw new Error(`Failed to preview dataset: ${res.statusText}`);
  return await res.json();
}

export async function uploadDatasetFile(file: File): Promise<SparkUploadResult> {
  const formData = new FormData();
  formData.append('dataset', file);
  const res = await fetch(`${API_BASE_URL}/api/spark/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return await res.json();
}

export async function executeSparkJob(datasetPath: string, datasetName?: string): Promise<{ ok: boolean; jobId: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/spark/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetPath, datasetName }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to start Spark job');
  }
  return data;
}

export async function fetchJobStatus(jobId: string): Promise<SparkJobStatus> {
  const res = await fetch(`${API_BASE_URL}/api/spark/status/${jobId}`);
  if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
  const data = await res.json();
  return data.job;
}

export async function fetchJobLogs(jobId: string, offset = 0): Promise<{ logs: string[]; totalLogs: number; status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/spark/logs/${jobId}?offset=${offset}`);
  if (!res.ok) throw new Error(`Log fetch failed: ${res.statusText}`);
  const data = await res.json();
  return {
    logs: data.logs || (data.lines ? data.lines : []),
    totalLogs: data.totalLogs || (data.totalLines ? data.totalLines : 0),
    status: data.status,
  };
}

export async function fetchScalaSource(): Promise<ScalaSourceResponse> {
  const res = await fetch(`${API_BASE_URL}/api/spark/scala-source`);
  if (!res.ok) throw new Error(`Failed to load Scala source: ${res.statusText}`);
  return await res.json();
}

export async function fetchLatestJob(): Promise<SparkJobStatus | null> {
  const res = await fetch(`${API_BASE_URL}/api/spark/latest`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.job || null;
}

export async function fetchKafkaStatus(): Promise<KafkaStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/spark/kafka-status`);
  if (!res.ok) throw new Error(`Failed to fetch Kafka status: ${res.statusText}`);
  return await res.json();
}

export async function fetchCassandraStatus(): Promise<CassandraStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/spark/cassandra-status`);
  if (!res.ok) throw new Error(`Failed to fetch Cassandra status: ${res.statusText}`);
  return await res.json();
}

export async function produceKafkaTestMessage(): Promise<{ ok: boolean; message: string; event: Record<string, unknown> }> {
  const res = await fetch(`${API_BASE_URL}/api/spark/kafka-test-produce`, { method: 'POST' });
  if (!res.ok) throw new Error(`Kafka produce test failed: ${res.statusText}`);
  return await res.json();
}

// ── Device-Based Automatic Big Data Analytics Methods ────────────────────────

export async function fetchLiveFleetDevices(): Promise<LiveFleetResponse> {
  const res = await fetch(`${API_BASE_URL}/api/spark/live-devices`);
  if (!res.ok) throw new Error(`Failed to fetch live fleet devices: ${res.statusText}`);
  return await res.json();
}

export async function ingestLiveTelemetry(readings: Record<string, unknown>[]): Promise<{ ok: boolean; recordsAppended: number }> {
  const res = await fetch(`${API_BASE_URL}/api/spark/ingest-live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ readings }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to ingest live telemetry');
  }
  return await res.json();
}

export async function executeDeviceAnalytics(): Promise<{ ok: boolean; jobId: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/spark/execute-device-analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to trigger device analytics');
  }
  return data;
}

export async function fetchDeviceHistory(nodeId: string, timeRange = 'all', date?: string): Promise<DeviceHistoryResponse> {
  let url = `${API_BASE_URL}/api/spark/device-history?nodeId=${encodeURIComponent(nodeId)}&timeRange=${encodeURIComponent(timeRange)}`;
  if (date && date !== 'LIVE') {
    url += `&date=${encodeURIComponent(date)}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Failed to fetch history for ${nodeId}`);
  }
  return await res.json();
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
  const res = await fetch(`${API_BASE_URL}/api/spark/storage/manifest`);
  if (!res.ok) throw new Error(`Failed to load storage manifest: ${res.statusText}`);
  const data = await res.json();
  return data.manifest;
}

export async function fetchStorageDatasetPreview(datasetPath: string, maxRows = 15): Promise<StoragePreviewResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/spark/storage/preview?path=${encodeURIComponent(datasetPath)}&maxRows=${maxRows}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to preview stored dataset');
  }
  return await res.json();
}

export function getStorageDownloadUrl(datasetPath: string): string {
  return `${API_BASE_URL}/api/spark/storage/download?path=${encodeURIComponent(datasetPath)}`;
}

export async function snapshotLiveTelemetryToStorage(): Promise<{
  ok: boolean;
  dataset: DatasetManifestEntry;
  manifest: DatasetStorageManifest;
}> {
  const res = await fetch(`${API_BASE_URL}/api/spark/storage/snapshot-telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to snapshot telemetry');
  }
  return await res.json();
}

export async function executeSparkOnDataset(params: {
  datasetPath?: string;
  datasetName?: string;
  datasetId?: string;
}): Promise<{ ok: boolean; jobId: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/spark/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to execute Spark on selected dataset');
  }
  return data;
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
  const res = await fetch(`${API_BASE_URL}/api/spark/scheduler/status`);
  if (!res.ok) throw new Error(`Failed to fetch scheduler status: ${res.statusText}`);
  return await res.json();
}

export async function sendSchedulerControl(
  action: 'start' | 'pause' | 'resume' | 'stop' | 'catchup' | 'retry_failed' | 'run_backfill'
): Promise<SchedulerStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/spark/scheduler/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Failed to execute scheduler action: ${action}`);
  return data;
}

export async function triggerHistoricalBackfill(): Promise<SchedulerStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/spark/scheduler/backfill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to trigger historical backfill');
  return data;
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
  const res = await fetch(`${API_BASE_URL}/api/spark/storage/compare?dates=${query}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to compare historical dates');
  }
  return await res.json();
}

export function getStorageExportCsvUrl(params: { date?: string; path?: string }): string {
  const query = params.date
    ? `date=${encodeURIComponent(params.date)}`
    : `path=${encodeURIComponent(params.path || '')}`;
  return `${API_BASE_URL}/api/spark/storage/export-csv?${query}`;
}
