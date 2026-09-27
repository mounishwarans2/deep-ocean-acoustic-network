import { useMemo } from 'react';
import { useNoaaWod } from '../../../services/noaaWodService';
import type { WodLevel } from '../../../types/oceanData';
import { formatDecimal, formatLatency, formatPercent, formatdB } from '../../../utils/format';
import { BarChart } from '../../charts/BarChart';
import { DataViewHeader, avg, type DataViewProps } from './shared';

const OPS_FLOW = ['INGEST', 'FILTER', 'TRANSFORM', 'AGGREGATE', 'ANALYZE', 'VISUALIZE'];

const OPERATIONS = [
  'Average temperature by depth',
  'Average signal strength by node',
  'Packet-loss aggregation',
  'Latency analysis',
  'Node health aggregation',
  'Energy trend analysis',
  'Acoustic signal analysis',
];

export function SparkAnalyticsView({ option, state }: DataViewProps) {
  const provider = useNoaaWod();
  const cast = provider.getProfile();
  const levels = useMemo(() => provider.getObservations(), [provider]);

  const bars = (pick: (l: WodLevel) => number | null) =>
    levels.map(l => ({ label: String(l.depthM), value: pick(l) }));

  if (!state) {
    return (
      <div className="menu-content-view">
        <DataViewHeader option={option} subtitle="Distributed processing and analytics for underwater network telemetry" />
        <div className="menu-content-body"><p className="da-loading">Telemetry is still initialising — please try again in a few seconds.</p></div>
      </div>
    );
  }

  const { devices, links, snc, spark } = state;
  const activeNodes = devices.filter(d => d.status === 'NORMAL').length;
  const connectedNodes = devices.filter(d => d.connectedNodes.length > 0).length;

  return (
    <div className="menu-content-view">
      <DataViewHeader option={option} subtitle="Distributed processing and analytics for underwater network telemetry" />
      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">Role</span></div>
          <p className="da-lead">
            Apache Spark is used as the distributed analytics layer for processing large volumes
            of underwater telemetry and network events.
          </p>
          <ul className="da-card-list">
            <li>Processing rate <strong>{formatDecimal(spark.processingRate)} records/s</strong> · Batch <strong>{formatDecimal(spark.batchDuration)} s</strong> · Active jobs <strong>{spark.activeJobs}</strong></li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">A. Telemetry Processing</span></div>
          <ul className="da-card-list">
            <li>Sensor measurements · Acoustic measurements · Device telemetry · Network events · Historical observations</li>
            <li><strong>{devices.length} devices · {links.length} links · {state.historyLatency.length} buffered history points per metric</strong></li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">B. Network Analytics</span></div>
          <div className="stat-grid" style={{ marginTop: 8 }}>
            <div className="stat-card"><div className="stat-value blue">{activeNodes}/{devices.length}</div><div className="stat-label">Active Nodes</div></div>
            <div className="stat-card"><div className="stat-value cyan">{connectedNodes}</div><div className="stat-label">Connected Nodes</div></div>
            <div className="stat-card"><div className="stat-value yellow">{formatPercent(avg(devices.map(d => d.packetLoss)))}</div><div className="stat-label">Packet Loss</div></div>
            <div className="stat-card"><div className="stat-value yellow">{formatLatency(avg(devices.map(d => d.latency)))}</div><div className="stat-label">Latency</div></div>
            <div className="stat-card"><div className="stat-value">{formatDecimal(snc.throughput)} msg/s</div><div className="stat-label">Throughput</div></div>
            <div className="stat-card"><div className="stat-value green">{formatdB(avg(devices.map(d => d.signalStrength)))}</div><div className="stat-label">Signal Strength</div></div>
            <div className="stat-card"><div className="stat-value green">{formatPercent(avg(devices.map(d => d.signalQuality)))}</div><div className="stat-label">Link Quality</div></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">C. Environmental Analytics</span></div>
          {!cast ? (
            <p className="da-loading">Ocean observation unavailable</p>
          ) : (
            <div className="da-grid-3">
              <div>
                <div className="big-metric-label">Temperature vs Depth</div>
                <BarChart data={bars(l => l.temperatureC)} color="var(--accent-cyan)" height={220} xAxisLabel="Depth (m)" yAxisLabel="Temperature (°C)" formatValue={v => v.toFixed(1)} />
              </div>
              <div>
                <div className="big-metric-label">Salinity vs Depth</div>
                <BarChart data={bars(l => l.salinityPsu)} color="var(--accent-blue)" height={220} xAxisLabel="Depth (m)" yAxisLabel="Salinity (PSU)" formatValue={v => v.toFixed(2)} />
              </div>
              <div>
                <div className="big-metric-label">Dissolved Oxygen vs Depth</div>
                <BarChart data={bars(l => l.oxygenMlL)} color="var(--accent-green)" height={220} xAxisLabel="Depth (m)" yAxisLabel="Dissolved Oxygen (mL/L)" formatValue={v => v.toFixed(2)} />
              </div>
            </div>
          )}
          <p className="da-note">Source: {cast ? `${cast.source} — ${cast.dataset}, cast ${cast.castId}` : 'Ocean observation unavailable'}</p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">D. Analytics Operations</span></div>
          <div className="da-hflow">
            {OPS_FLOW.map((op, i, arr) => (
              <div className="da-hflow-step" key={op}>
                <div className="da-hflow-box">{op}</div>
                {i < arr.length - 1 && <div className="da-hflow-arrow">→</div>}
              </div>
            ))}
          </div>
          <ul className="da-card-list" style={{ marginTop: 10 }}>
            {OPERATIONS.map(op => <li key={op}>• {op}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
