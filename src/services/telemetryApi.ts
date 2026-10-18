// MARISLINK: Underwater Telemetry API Service
// Communicates with the Express backend to persist and fetch Supabase telemetry readings.
import type { UnderwaterDevice } from '../types/network';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export interface TelemetryRecord {
  id?: number;
  node_id: string;
  recorded_at: string;
  depth_m: number | null;
  temperature_c: number | null;
  pressure_mpa: number | null;
  battery_level: number | null;
  signal_strength: number | null;
  latency_ms: number | null;
  packet_loss: number | null;
  communication_status: string | null;
  node_status: string | null;
  source: string;
  created_at?: string;
}

export interface BackendHealthResponse {
  ok: boolean;
  service?: string;
  twilioConfigured?: boolean;
  databaseConfigured?: boolean;
  databaseStatus?: string;
  timestamp?: string;
}

/** Check backend and database connectivity */
export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, databaseConfigured: false, databaseStatus: `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    return {
      ok: false,
      databaseConfigured: false,
      databaseStatus: err instanceof Error ? err.message : 'Server unreachable',
    };
  }
}

/** Map existing UnderwaterDevice simulation object to standard database telemetry record */
export function mapDeviceToTelemetry(device: UnderwaterDevice): Partial<TelemetryRecord> {
  return {
    node_id: device.id,
    recorded_at: new Date().toISOString(),
    depth_m: Math.round(device.depth * 10) / 10,
    temperature_c: Math.round(device.temperature * 10) / 10,
    pressure_mpa: Math.round(device.pressure * 100) / 100,
    battery_level: Math.round(device.secondaryBattery * 10) / 10,
    signal_strength: Math.round(device.signalStrength * 10) / 10,
    latency_ms: Math.round(device.latency * 10) / 10,
    packet_loss: Math.round(device.packetLoss * 100) / 100,
    communication_status: device.energyState || 'NORMAL',
    node_status: device.status || 'NORMAL',
    source: 'simulation',
  };
}

/** Persist a single telemetry reading */
export async function saveTelemetryReading(
  reading: Partial<TelemetryRecord>,
): Promise<{ ok: boolean; data?: TelemetryRecord; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: result.error || `Failed (HTTP ${res.status})` };
    }
    return { ok: true, data: result.data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error saving telemetry',
    };
  }
}

/** Persist a bounded batch of telemetry readings (e.g., node network snapshot) */
export async function saveTelemetryBatch(
  readings: Partial<TelemetryRecord>[],
): Promise<{ ok: boolean; count?: number; error?: string }> {
  if (readings.length === 0) return { ok: true, count: 0 };
  try {
    const res = await fetch(`${API_BASE_URL}/api/telemetry/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readings: readings.slice(0, 50) }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: result.error || `Batch failed (HTTP ${res.status})` };
    }
    return { ok: true, count: result.count };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error in batch save',
    };
  }
}

/** Fetch recent telemetry readings from Supabase */
export async function fetchRecentTelemetry(params?: {
  limit?: number;
  nodeId?: string;
}): Promise<{ ok: boolean; data?: TelemetryRecord[]; error?: string; count?: number }> {
  try {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.nodeId) query.set('nodeId', params.nodeId);

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/telemetry${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: result.error || `Fetch failed (HTTP ${res.status})` };
    }
    return { ok: true, data: result.data || [], count: result.count || 0 };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error retrieving telemetry',
    };
  }
}
