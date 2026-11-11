// MARISLINK: Virtual Hardware & Telemetry Client
// Interfaces with /api/hardware endpoints for live embedded microcontroller streaming

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export interface HardwareTelemetryRecord {
  node_id: string;
  device_name: string;
  sequence: number;
  timestamp: string;
  depth_m: number;
  temperature_c: number;
  pressure_mpa: number;
  raw_sensor_hpa: number;
  battery_voltage_v: number;
  battery_level: number;
  signal_strength: number;
  latency_ms: number;
  packet_loss: number;
  communication_status: string;
  node_status: string;
  source: string;
  source_label?: string;
  is_actual_wokwi?: boolean;
  firmware_type?: string;
  hardware_execution?: string;
  measurement_type: string;
  calibration_model: string;
  leds?: {
    tx_green: boolean;
    sync_yellow: boolean;
    alert_red: boolean;
  };
  received_at?: string;
}

export interface HardwareStatusResponse {
  ok: boolean;
  nodeId: string;
  deviceName: string;
  connectionStatus: 'ONLINE' | 'STALE' | 'DISCONNECTED';
  isLiveStreaming: boolean;
  lastHeartbeat: string | null;
  secondsSinceHeartbeat: number | null;
  packetCount: number;
  wokwiPacketCount: number;
  fallbackPacketCount: number;
  isActualWokwi: boolean;
  currentSource: string | null;
  currentSourceLabel: string | null;
  duplicateCount: number;
  historySize: number;
  latestReading: HardwareTelemetryRecord | null;
  calibration: {
    sensorModel: string;
    physicalSensorRange: string;
    calibratedHydrostaticRange: string;
    transferFunction: string;
    measurementType: string;
  };
  systemUptimeSec: number;
}

export interface HardwareHistoryResponse {
  ok: boolean;
  nodeId: string;
  count: number;
  limit: number;
  readings: HardwareTelemetryRecord[];
}

/**
 * Fetch current live hardware node status
 */
export async function fetchHardwareStatus(): Promise<HardwareStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/hardware/status`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch hardware status (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Fetch recent hardware telemetry history for charting
 */
export async function fetchHardwareHistory(limit = 40): Promise<HardwareHistoryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/hardware/history?limit=${limit}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch hardware history (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Send simulated packet from browser if reviewer wants one-click test
 */
export async function sendSimulatedHardwarePacket(payload: Partial<HardwareTelemetryRecord>): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/hardware/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * Reset hardware monitor state
 */
export async function resetHardwareState(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/hardware/reset`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  return res.json();
}
