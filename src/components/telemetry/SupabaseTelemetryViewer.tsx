// MARISLINK: Supabase Cloud Telemetry Viewer Component
// Displays live and historical telemetry readings persisted in Supabase PostgreSQL.
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { SimulationState } from '../../hooks/useSimulation';
import { useTelemetrySync } from '../../hooks/useTelemetrySync';
import { formatPercent, formatLatency, formatDecimal } from '../../utils/format';

interface Props {
  state: SimulationState;
  selectedDeviceId?: string | null;
  telemetrySync?: ReturnType<typeof useTelemetrySync>;
}

export const SupabaseTelemetryViewer: FC<Props> = ({ state, selectedDeviceId, telemetrySync: externalSync }) => {
  const localSync = useTelemetrySync(state, !externalSync);
  const {
    syncState,
    cloudRecords,
    loadingRecords,
    manualCooldown,
    syncSnapshot,
    loadCloudTelemetry,
  } = externalSync || localSync;

  const [selectedNodeFilter, setSelectedNodeFilter] = useState<string>(selectedDeviceId || 'ALL');
  const [prevSelectedDeviceId, setPrevSelectedDeviceId] = useState<string | null | undefined>(selectedDeviceId);

  if (selectedDeviceId !== prevSelectedDeviceId) {
    setPrevSelectedDeviceId(selectedDeviceId);
    if (selectedDeviceId) {
      setSelectedNodeFilter(selectedDeviceId);
    }
  }

  useEffect(() => {
    void loadCloudTelemetry(selectedNodeFilter === 'ALL' ? undefined : selectedNodeFilter);
  }, [loadCloudTelemetry, selectedNodeFilter]);

  const handleManualSync = async () => {
    await syncSnapshot({ isManual: true });
  };

  const getStatusBadge = () => {
    if (syncState.databaseStatus === 'connected') {
      return <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: 11 }}>● Supabase Connected</span>;
    }
    if (syncState.databaseConfigured) {
      return <span style={{ color: 'var(--accent-yellow)', fontWeight: 600, fontSize: 11 }}>● Supabase Configured</span>;
    }
    return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>○ Database Unconfigured</span>;
  };

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="card-title">☁️ Supabase Cloud Telemetry</span>
          {getStatusBadge()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="node-select-filter" style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            Node:
          </label>
          <select
            id="node-select-filter"
            value={selectedNodeFilter}
            onChange={(e) => setSelectedNodeFilter(e.target.value)}
            style={{
              padding: '3px 8px',
              fontSize: 11.5,
              borderRadius: 4,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <option value="ALL">All Nodes</option>
            {state.devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} ({d.name})
              </option>
            ))}
          </select>

          <button
            onClick={() => void loadCloudTelemetry(selectedNodeFilter === 'ALL' ? undefined : selectedNodeFilter)}
            disabled={loadingRecords}
            style={{
              padding: '4px 10px',
              fontSize: 11.5,
              borderRadius: 4,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              cursor: loadingRecords ? 'not-allowed' : 'pointer',
            }}
          >
            {loadingRecords ? 'Fetching...' : '🔄 Refresh'}
          </button>

          <button
            onClick={() => void handleManualSync()}
            disabled={syncState.syncing || (manualCooldown ?? 0) > 0}
            style={{
              padding: '4px 12px',
              fontSize: 11.5,
              borderRadius: 4,
              border: 'none',
              background: syncState.syncing || (manualCooldown ?? 0) > 0 ? 'var(--bg-tertiary)' : 'var(--accent-blue)',
              color: syncState.syncing || (manualCooldown ?? 0) > 0 ? 'var(--text-muted)' : '#fff',
              fontWeight: 600,
              cursor: syncState.syncing || (manualCooldown ?? 0) > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {syncState.syncing
              ? 'Syncing...'
              : (manualCooldown ?? 0) > 0
                ? `Cooldown (${manualCooldown}s)`
                : '⬆ Sync Snapshot'}
          </button>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <span>
          Auto-sync: every 20s &middot; Snapshot source: <code>simulation</code> &middot; Batch size: up to 25 nodes
        </span>
        <span>
          {syncState.lastSync
            ? `Last sync: ${syncState.lastSync.toLocaleTimeString()} (${syncState.totalSynced} records sent)`
            : 'No sync in this session'}
        </span>
      </div>

      {syncState.error && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: 10,
            borderRadius: 4,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--accent-red)',
            fontSize: 11.5,
            color: 'var(--accent-red)',
          }}
        >
          <strong>Database Notice:</strong> {syncState.error}
          {!syncState.databaseConfigured && (
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
              Configure <code>SUPABASE_URL</code> and <code>SUPABASE_SECRET_KEY</code> in Render / <code>server/.env</code> and run <code>server/sql/001_telemetry.sql</code> in the Supabase SQL editor.
            </div>
          )}
        </div>
      )}

      {/* Telemetry Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="health-table">
          <thead>
            <tr>
              <th>Recorded Time</th>
              <th>Node ID</th>
              <th>Depth (m)</th>
              <th>Temp (°C)</th>
              <th>Pressure (MPa)</th>
              <th>Battery</th>
              <th>Signal</th>
              <th>Latency</th>
              <th>Loss</th>
              <th>Status</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {loadingRecords && cloudRecords.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  Loading telemetry records from Supabase...
                </td>
              </tr>
            ) : cloudRecords.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  {syncState.databaseConfigured
                    ? 'No telemetry records found. Click "Sync Snapshot" to persist current simulation state.'
                    : 'Supabase credentials unconfigured. Telemetry persistence will activate once SUPABASE_URL and SUPABASE_SECRET_KEY are set.'}
                </td>
              </tr>
            ) : (
              cloudRecords.map((r, idx) => (
                <tr key={r.id || `${r.node_id}-${idx}`}>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {r.recorded_at ? new Date(r.recorded_at).toLocaleTimeString() : '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{r.node_id}</td>
                  <td>{r.depth_m !== null ? `${formatDecimal(r.depth_m)} m` : '—'}</td>
                  <td>{r.temperature_c !== null ? `${r.temperature_c}°C` : '—'}</td>
                  <td>{r.pressure_mpa !== null ? `${r.pressure_mpa} MPa` : '—'}</td>
                  <td style={{ color: (r.battery_level ?? 100) > 80 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
                    {r.battery_level !== null ? formatPercent(r.battery_level) : '—'}
                  </td>
                  <td>{r.signal_strength !== null ? `${r.signal_strength} dBm` : '—'}</td>
                  <td>{r.latency_ms !== null ? formatLatency(r.latency_ms) : '—'}</td>
                  <td style={{ color: (r.packet_loss ?? 0) > 5 ? 'var(--accent-red)' : 'inherit' }}>
                    {r.packet_loss !== null ? formatPercent(r.packet_loss) : '—'}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 600,
                        background: r.node_status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                        color: r.node_status === 'CRITICAL' ? 'var(--accent-red)' : 'var(--accent-green)',
                      }}
                    >
                      {r.node_status || 'NORMAL'}
                    </span>
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {r.source || 'simulation'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
