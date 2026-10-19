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

const DEFAULT_SYNC_INTERVAL_MS = 20000; // 20 seconds
const MANUAL_COOLDOWN_MS = 4000; // 4 seconds cooldown for manual clicks

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
  const [manualCooldown, setManualCooldown] = useState(0);

  const isSyncingRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const lastManualSyncRef = useRef<number>(0);

  // Decrement manual cooldown timer
  useEffect(() => {
    if (manualCooldown <= 0) return;
    const timer = setTimeout(() => {
      setManualCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [manualCooldown]);

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
    try {
      const result = await fetchRecentTelemetry({ limit, nodeId });
      if (result.ok && result.data) {
        setCloudRecords(result.data);
        setSyncState(prev => ({ ...prev, error: null }));
      } else if (result.error) {
        setSyncState(prev => ({ ...prev, error: result.error || 'Failed to fetch telemetry' }));
      }
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  // 3. Sync current simulation state to Supabase
  const syncSnapshot = useCallback(async (options?: { isManual?: boolean; refreshFilter?: string }) => {
    const isManual = options?.isManual ?? false;
    const now = Date.now();

    if (isManual) {
      if (now - lastManualSyncRef.current < MANUAL_COOLDOWN_MS) {
        return;
      }
      lastManualSyncRef.current = now;
      setManualCooldown(Math.ceil(MANUAL_COOLDOWN_MS / 1000));
    }

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
        // Await the required refresh so callers have up-to-date data upon completion
        await loadCloudTelemetry(options?.refreshFilter);
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

  // 4. Periodic snapshot timer (pauses when document is hidden)
  useEffect(() => {
    if (!autoSync || !state) return;

    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return; // Pause periodic auto-sync while document is hidden
      }
      void syncSnapshot({ isManual: false });
    }, DEFAULT_SYNC_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        // Safely resume periodic snapshot upon returning to active tab
        void syncSnapshot({ isManual: false });
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [autoSync, state !== null, syncSnapshot]);

  // 5. Sync on emergency failure state transition
  const failureStartedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (state?.recovery && state.recovery.startedAt !== failureStartedAtRef.current) {
      failureStartedAtRef.current = state.recovery.startedAt;
      // Meaningful state change: persist immediate emergency snapshot
      void syncSnapshot({ isManual: false });
    }
  }, [state?.recovery, syncSnapshot]);

  return {
    syncState,
    cloudRecords,
    loadingRecords,
    manualCooldown,
    syncSnapshot,
    loadCloudTelemetry,
    refreshHealth,
  };
}

export type TelemetrySync = ReturnType<typeof useTelemetrySync>;
