// MARISLINK: Telemetry Synchronization Hook
// Periodically snapshots simulated underwater telemetry to Supabase via the Express backend.
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SimulationState } from './useSimulation';
import {
  saveTelemetryBatch,
  fetchRecentTelemetry,
  mapDeviceToTelemetry,
  checkBackendHealth,
  type TelemetryRecord,
} from '../services/telemetryApi';

export interface TelemetrySyncState {
  syncing: boolean;
  lastSync: Date | null;
  error: string | null;
  totalSynced: number;
  databaseConfigured: boolean;
  databaseStatus: string;
}

const DEFAULT_SYNC_INTERVAL_MS = 20000; // 20 seconds (within requested 10-30s window)

export function useTelemetrySync(state: SimulationState | null, autoSync = true) {
  const [syncState, setSyncState] = useState<TelemetrySyncState>({
    syncing: false,
    lastSync: null,
    error: null,
    totalSynced: 0,
    databaseConfigured: false,
    databaseStatus: 'checking',
  });
  const [cloudRecords, setCloudRecords] = useState<TelemetryRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const isSyncingRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 1. Initial health check
  const refreshHealth = useCallback(async () => {
    const health = await checkBackendHealth();
    setSyncState(prev => ({
      ...prev,
      databaseConfigured: Boolean(health.databaseConfigured),
      databaseStatus: health.databaseStatus || (health.ok ? 'online' : 'unreachable'),
    }));
    return health;
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  // 2. Fetch recent records from Supabase
  const loadCloudTelemetry = useCallback(async (nodeId?: string, limit = 25) => {
    setLoadingRecords(true);
    const result = await fetchRecentTelemetry({ limit, nodeId });
    setLoadingRecords(false);
    if (result.ok && result.data) {
      setCloudRecords(result.data);
      setSyncState(prev => ({ ...prev, error: null }));
    } else if (result.error) {
      setSyncState(prev => ({ ...prev, error: result.error || 'Failed to fetch telemetry' }));
    }
  }, []);

  // 3. Sync current simulation state to Supabase
  const syncSnapshot = useCallback(async () => {
    const currentState = stateRef.current;
    if (!currentState || isSyncingRef.current) return;
    if (!currentState.devices || currentState.devices.length === 0) return;

    isSyncingRef.current = true;
    setSyncState(prev => ({ ...prev, syncing: true, error: null }));

    try {
      // Map active simulation nodes to database format
      const batch = currentState.devices.slice(0, 25).map(d => mapDeviceToTelemetry(d));
      const result = await saveTelemetryBatch(batch);

      if (result.ok) {
        setSyncState(prev => ({
          ...prev,
          syncing: false,
          lastSync: new Date(),
          totalSynced: prev.totalSynced + (result.count || batch.length),
          databaseConfigured: true,
          error: null,
        }));
        // Optionally refresh the cloud records view
        void loadCloudTelemetry();
      } else {
        setSyncState(prev => ({
          ...prev,
          syncing: false,
          error: result.error || 'Failed to persist snapshot',
        }));
      }
    } catch (err) {
      setSyncState(prev => ({
        ...prev,
        syncing: false,
        error: err instanceof Error ? err.message : 'Telemetry sync failed',
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [loadCloudTelemetry]);

  // 4. Periodic snapshot timer (every 20s, NOT on every frame or 3s tick)
  useEffect(() => {
    if (!autoSync || !state) return;

    const intervalId = setInterval(() => {
      void syncSnapshot();
    }, DEFAULT_SYNC_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [autoSync, state !== null, syncSnapshot]);

  // 5. Sync on emergency failure state transition
  const failureStartedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (state?.recovery && state.recovery.startedAt !== failureStartedAtRef.current) {
      failureStartedAtRef.current = state.recovery.startedAt;
      // Meaningful state change: persist immediate emergency snapshot
      void syncSnapshot();
    }
  }, [state?.recovery, syncSnapshot]);

  return {
    syncState,
    cloudRecords,
    loadingRecords,
    syncSnapshot,
    loadCloudTelemetry,
    refreshHealth,
  };
}

export type TelemetrySync = ReturnType<typeof useTelemetrySync>;
