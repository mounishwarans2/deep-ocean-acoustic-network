import type { SimulationState } from '../hooks/useSimulation';
import { MiniChart } from '../components/charts/MiniChart';
import { formatdB, formatPercent, formatLatency, deviceTypeColor, deviceSymbol } from '../utils/format';

interface Props {
  state: SimulationState;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
}

export function AcousticPage({ state, selectedDeviceId, onSelectDevice }: Props) {
  const { devices, historySignalQuality } = state;
  const avgSignal = devices.reduce((s, d) => s + d.signalQuality, 0) / devices.length;
  const avgNoise = devices.reduce((s, d) => s + d.backgroundNoise, 0) / devices.length;
  const avgSNR = devices.reduce((s, d) => s + d.snr, 0) / devices.length;
  const avgProp = devices.reduce((s, d) => s + d.propagationDelay, 0) / devices.length;
  const avgFreq = devices.reduce((s, d) => s + d.frequency, 0) / devices.length;
  const avgBw = devices.reduce((s, d) => s + d.bandwidth, 0) / devices.length;
  const channelState = avgSignal > 85 ? 'EXCELLENT' : avgSignal > 70 ? 'GOOD' : avgSignal > 55 ? 'DEGRADED' : 'POOR';
  const channelColor = avgSignal > 85 ? 'var(--accent-green)' : avgSignal > 70 ? 'var(--accent-cyan)' : avgSignal > 55 ? 'var(--accent-yellow)' : 'var(--accent-red)';

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Acoustic Channel</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: channelColor }}>{channelState}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <div className="stat-card"><div className="stat-label">Frequency</div><div className="stat-value cyan">{avgFreq.toFixed(1)} kHz</div></div>
          <div className="stat-card"><div className="stat-label">Bandwidth</div><div className="stat-value">{avgBw.toFixed(1)} kHz</div></div>
          <div className="stat-card"><div className="stat-label">SNR</div><div className="stat-value">{formatdB(avgSNR)}</div></div>
          <div className="stat-card"><div className="stat-label">Propagation Delay</div><div className="stat-value">{formatLatency(avgProp)}</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Acoustic Signal</span></div>
        <div className="acoustic-signal-viz">
          <span>TRANSMIT</span>
          <span>→</span>
          <div className="signal-wave"><span /><span /><span /><span /><span /></div>
          <span>≈≈≈≈</span>
          <div className="signal-wave"><span /><span /><span /><span /><span /></div>
          <span>→</span>
          <span>RECEIVE</span>
        </div>
      </div>

      <div className="page-grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Signal Quality Trend</span></div>
          <MiniChart data={historySignalQuality} color="var(--accent-cyan)" height={60} showDots />
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Channel Overview</span></div>
          <div className="metric-row"><span className="metric-label">Avg Signal Strength</span><span className="metric-value">{formatdB(devices.reduce((s, d) => s + d.signalStrength, 0) / devices.length)}</span></div>
          <div className="metric-row"><span className="metric-label">Avg Noise Level</span><span className="metric-value">{formatdB(avgNoise)}</span></div>
          <div className="metric-row"><span className="metric-label">Avg Packet Loss</span><span className="metric-value">{formatPercent(devices.reduce((s, d) => s + d.packetLoss, 0) / devices.length)}</span></div>
          <div className="metric-row"><span className="metric-label">Avg Throughput</span><span className="metric-value cyan">{(devices.reduce((s, d) => s + d.throughput, 0) / devices.length).toFixed(1)} msg/s</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Per-Node Acoustic Metrics</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="health-table">
            <thead><tr><th>Node</th><th>Signal</th><th>SNR</th><th>Noise</th><th>Latency</th><th>Prop Delay</th><th>Channel</th></tr></thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id} onClick={() => onSelectDevice(selectedDeviceId === d.id ? null : d.id)} className={selectedDeviceId === d.id ? 'selected' : ''}>
                  <td style={{ fontWeight: 600, color: deviceTypeColor(d.type) }}>{deviceSymbol(d.type)} {d.id}</td>
                  <td style={{ color: d.signalQuality > 80 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{formatPercent(d.signalQuality)}</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>{formatdB(d.snr)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatdB(d.backgroundNoise)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatLatency(d.latency)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatLatency(d.propagationDelay)}</td>
                  <td><span className={`status-badge ${d.signalQuality > 80 ? 'normal' : d.signalQuality > 60 ? 'warning' : 'critical'}`}>{d.signalQuality > 80 ? 'GOOD' : d.signalQuality > 60 ? 'DEGRADED' : 'POOR'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
