import { formatDecimal, formatDistance, formatLatency, formatPercent, formatdB } from '../../../utils/format';
import { BarChart } from '../../charts/BarChart';
import { DataViewHeader, avg, type DataViewProps } from './shared';

const FACTORS = [
  'Acoustic propagation delay',
  'Packet loss',
  'Signal attenuation',
  'Node distance',
  'Link quality',
  'Energy availability',
  'Environmental conditions',
];

const NA = 'Not available';

export function NetworkMetricsView({ option, state }: DataViewProps) {
  if (!state) {
    return (
      <div className="menu-content-view">
        <DataViewHeader option={option} subtitle="Performance monitoring for the underwater acoustic communication network" />
        <div className="menu-content-body"><p className="da-loading">{NA} — telemetry is still initialising.</p></div>
      </div>
    );
  }

  const { devices, links } = state;
  const activeNodes = devices.filter(d => d.status === 'NORMAL').length;
  const connectedNodes = devices.filter(d => d.connectedNodes.length > 0).length;
  const activeLinks = links.filter(l => l.status === 'ACTIVE').length;

  const healthy = devices.filter(d => d.status === 'NORMAL').length;
  const warning = devices.filter(d => d.status === 'WARNING').length;
  const critical = devices.filter(d => d.status === 'CRITICAL' || d.status === 'OFFLINE').length;
  const total = devices.length || 1;

  const lossBars = devices.map(d => ({ label: d.id, value: d.packetLoss }));
  const latencyBars = devices.map(d => ({ label: d.id, value: d.latency }));
  const signalBars = devices.map(d => ({ label: d.id, value: d.signalStrength }));
  const throughputBars = devices.map(d => ({ label: d.id, value: d.throughput }));

  return (
    <div className="menu-content-view">
      <DataViewHeader option={option} subtitle="Performance monitoring for the underwater acoustic communication network" />
      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">Metrics</span></div>
          <div className="stat-grid" style={{ marginTop: 8 }}>
            <div className="stat-card"><div className="stat-value blue">{activeNodes}/{devices.length}</div><div className="stat-label">Active Nodes</div></div>
            <div className="stat-card"><div className="stat-value cyan">{connectedNodes}</div><div className="stat-label">Connected Nodes</div></div>
            <div className="stat-card"><div className="stat-value yellow">{formatPercent(avg(devices.map(d => d.packetLoss)))}</div><div className="stat-label">Packet Loss</div></div>
            <div className="stat-card"><div className="stat-value yellow">{formatLatency(avg(devices.map(d => d.latency)))}</div><div className="stat-label">Latency</div></div>
            <div className="stat-card"><div className="stat-value">{formatDecimal(state.snc.throughput)} msg/s</div><div className="stat-label">Throughput</div></div>
            <div className="stat-card"><div className="stat-value green">{formatdB(avg(devices.map(d => d.signalStrength)))}</div><div className="stat-label">Signal Strength</div></div>
            <div className="stat-card"><div className="stat-value green">{formatPercent(avg(devices.map(d => d.signalQuality)))}</div><div className="stat-label">Link Quality</div></div>
            <div className="stat-card"><div className="stat-value blue">{formatPercent((activeLinks / (links.length || 1)) * 100)}</div><div className="stat-label">Network Availability</div></div>
          </div>
        </div>

        <div className="da-grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">A. Packet Loss by Node</span></div>
            <BarChart data={lossBars} color="var(--accent-yellow)" height={240} xAxisLabel="Node" yAxisLabel="Packet Loss (%)" formatValue={v => v.toFixed(1)} />
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">B. Latency by Node</span></div>
            <BarChart data={latencyBars} color="var(--accent-blue)" height={240} xAxisLabel="Node" yAxisLabel="Latency (ms)" formatValue={v => v.toFixed(0)} />
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">C. Signal Strength by Node</span></div>
            <BarChart data={signalBars} color="var(--accent-cyan)" height={240} xAxisLabel="Node" yAxisLabel="Signal (dB)" formatValue={v => v.toFixed(1)} />
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">D. Throughput by Node</span></div>
            <BarChart data={throughputBars} color="var(--accent-green)" height={240} xAxisLabel="Node" yAxisLabel="Throughput (msg/s)" formatValue={v => v.toFixed(1)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">E. Node Health</span></div>
          <ul className="da-card-list">
            <li><strong>{healthy}</strong> healthy · <strong>{warning}</strong> warning · <strong>{critical}</strong> critical</li>
          </ul>
          <div className="da-distro" aria-label="Node health distribution">
            <div style={{ width: `${(healthy / total) * 100}%`, background: 'var(--accent-green)' }} />
            <div style={{ width: `${(warning / total) * 100}%`, background: 'var(--accent-yellow)' }} />
            <div style={{ width: `${(critical / total) * 100}%`, background: 'var(--accent-red)' }} />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">F. Network Connectivity</span></div>
          <div className="da-table-wrap">
            <table className="health-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Distance</th>
                  <th>Latency</th>
                  <th>Loss</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {links.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.sourceNode}</td>
                    <td style={{ fontWeight: 600 }}>{l.destinationNode}</td>
                    <td>{formatDistance(l.distanceMeters)}</td>
                    <td>{formatLatency(l.latencyMs)}</td>
                    <td>{formatPercent(l.packetLoss)}</td>
                    <td>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Network Performance Factors</span></div>
          <ul className="da-card-list">
            {FACTORS.map(f => <li key={f}>• {f}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
