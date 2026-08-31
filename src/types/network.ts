export type DeviceType =
  | 'ACOUSTIC_RELAY'
  | 'HYDROPHONE'
  | 'GATEWAY'
  | 'ENVIRONMENTAL_SENSOR'
  | 'NAVIGATION_RELAY'
  | 'SEAFLOOR_RELAY'
  | 'SURFACE_RECEIVER'
  | 'DATA_CENTER';

export type DeviceStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
export type LinkStatus = 'ACTIVE' | 'DEGRADED' | 'FAILED';
export type StabilityLevel = 'STABLE' | 'WARNING' | 'CRITICAL';

export interface UnderwaterDevice {
  id: string;
  name: string;
  type: DeviceType;
  latitude: number;
  longitude: number;
  depth: number;
  status: DeviceStatus;
  primaryBattery: number;
  secondaryBattery: number;
  powerLoad: number;
  temperature: number;
  pressure: number;
  salinity: number;
  dissolvedOxygen: number;
  backgroundNoise: number;
  currentSpeed: number;
  waterDensity: number;
  signalQuality: number;
  signalStrength: number;
  snr: number;
  frequency: number;
  bandwidth: number;
  propagationDelay: number;
  packetsSent: number;
  packetsReceived: number;
  packetLoss: number;
  throughput: number;
  latency: number;
  arrivalRate: number;
  serviceRate: number;
  trafficIntensity: number;
  averageDelay: number;
  delayBound: number;
  backlog: number;
  bufferUtilization: number;
  x: number;
  y: number;
  connectedNodes: string[];
  primaryRoute: string[];
  alternateRoutes: string[][];
  energyState: 'NORMAL' | 'SAVING' | 'LOW';
}

export interface NetworkLink {
  id: string;
  sourceNode: string;
  destinationNode: string;
  distanceMeters: number;
  signalStrength: number;
  signalQuality: number;
  latencyMs: number;
  packetLoss: number;
  throughput: number;
  status: LinkStatus;
}

export interface SNCMetrics {
  arrivalRate: number;
  serviceRate: number;
  trafficIntensity: number;
  averageDelay: number;
  delayBound: number;
  backlog: number;
  bufferUtilization: number;
  throughput: number;
  packetLoss: number;
  stability: StabilityLevel;
}

export interface AIDecision {
  timestamp: number;
  detected: string;
  prediction: string;
  recommendation: string;
  confidence: number;
  action: string;
  triggeredRouteRecalculation: boolean;
}

export interface KafkaMetrics {
  messagesPerSec: number;
  consumerLag: number;
  totalMessages: number;
  online: boolean;
}

export interface SparkMetrics {
  processingRate: number;
  batchDuration: number;
  activeJobs: number;
  online: boolean;
}

export interface CassandraMetrics {
  writesPerSec: number;
  storageGB: number;
  readLatency: number;
  online: boolean;
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  nodeId: string;
  message: string;
  details: string;
  acknowledged: boolean;
}

export interface PipelineStatus {
  kafka: boolean;
  spark: boolean;
  scala: boolean;
  cassandra: boolean;
  api: boolean;
}

export interface HistoryPoint {
  timestamp: number;
  value: number;
}
