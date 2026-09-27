import { useMemo } from 'react';
import { useNoaaWod } from '../../../services/noaaWodService';
import { DataViewHeader, type DataViewProps } from './shared';

const TABLES: { name: string; fields: string[] }[] = [
  { name: 'node_telemetry', fields: ['node_id', 'timestamp', 'depth', 'temperature', 'pressure', 'salinity', 'dissolved_oxygen', 'pH', 'turbidity'] },
  { name: 'acoustic_events', fields: ['node_id', 'timestamp', 'frequency', 'signal_strength', 'event_type', 'link_quality'] },
  { name: 'network_metrics', fields: ['source_node', 'destination_node', 'timestamp', 'latency', 'packet_loss', 'throughput', 'link_quality'] },
  { name: 'device_health', fields: ['node_id', 'timestamp', 'status', 'energy_level', 'storage_status', 'communication_status'] },
  { name: 'alerts', fields: ['alert_id', 'node_id', 'timestamp', 'severity', 'message', 'status'] },
  { name: 'environmental_observations', fields: ['timestamp', 'latitude', 'longitude', 'depth', 'temperature', 'salinity', 'oxygen'] },
];

export function CassandraStorageView({ option, state }: DataViewProps) {
  const provider = useNoaaWod();
  const cast = provider.getProfile();
  const levels = useMemo(() => provider.getObservations(), [provider]);
  const sample = levels.slice(0, 5);

  return (
    <div className="menu-content-view">
      <DataViewHeader option={option} subtitle="Distributed storage model for underwater telemetry and historical data" />
      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">Architecture</span></div>
          <div className="mc-flow">
            {['DATA STREAMS', 'CASSANDRA', 'TIME-SERIES / NODE DATA', 'ANALYTICS + DASHBOARD'].map((step, j, arr) => (
              <div className="mc-flow-item" key={step}>
                <span className="mc-flow-box">{step}</span>
                {j < arr.length - 1 && <span className="mc-flow-arrow">↓</span>}
              </div>
            ))}
          </div>
          <p className="da-note">Conceptual Cassandra data models for the project.</p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Data Models</span></div>
          <div className="da-grid-2">
            {TABLES.map(t => (
              <div key={t.name}>
                <div className="big-metric-label" style={{ fontFamily: 'ui-monospace, monospace' }}>{t.name}</div>
                <div style={{ marginTop: 6 }}>
                  {t.fields.map(f => <span className="da-field" key={f}>{f}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Environmental Observations</span></div>
          {!cast ? (
            <p className="da-loading">Ocean observation unavailable</p>
          ) : (
            <>
              <div className="da-table-wrap">
                <table className="health-table">
                  <thead>
                    <tr>
                      <th>timestamp</th>
                      <th>latitude</th>
                      <th>longitude</th>
                      <th>depth</th>
                      <th>temperature</th>
                      <th>salinity</th>
                      <th>oxygen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.map((l, i) => (
                      <tr key={`${l.depthM}-${i}`}>
                        <td>{cast.observationDate.slice(0, 10)}</td>
                        <td>{cast.latitude.toFixed(4)}</td>
                        <td>{cast.longitude.toFixed(4)}</td>
                        <td>{l.depthM}</td>
                        <td>{l.temperatureC !== null ? l.temperatureC.toFixed(2) : '—'}</td>
                        <td>{l.salinityPsu !== null ? l.salinityPsu.toFixed(2) : '—'}</td>
                        <td>{l.oxygenMlL !== null ? l.oxygenMlL.toFixed(2) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="da-note">
                Stored observation records from {cast.source} — {cast.dataset}, cast {cast.castId}.
                Showing {sample.length} of {levels.length} levels.
              </p>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Storage Telemetry</span></div>
          {!state ? (
            <p className="da-loading">Telemetry is still initialising — please try again in a few seconds.</p>
          ) : (
            <div className="stat-grid" style={{ marginTop: 8 }}>
              <div className="stat-card"><div className="stat-value blue">{state.cassandra.writesPerSec.toFixed(1)}</div><div className="stat-label">Writes / sec</div></div>
              <div className="stat-card"><div className="stat-value cyan">{state.cassandra.storageGB.toFixed(1)} GB</div><div className="stat-label">Stored</div></div>
              <div className="stat-card"><div className="stat-value green">{state.cassandra.readLatency.toFixed(1)} ms</div><div className="stat-label">Read Latency</div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
