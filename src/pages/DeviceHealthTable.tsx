import type { SimulationState } from '../hooks/useSimulation';
import { deviceTypeColor, deviceSymbol, deviceTypeLabel, formatPercent, formatLatency, formatdB } from '../utils/format';

interface Props {
  state: SimulationState;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
}

export function DeviceHealthTable({ state, selectedDeviceId, onSelectDevice }: Props) {
  const { devices } = state;
  const warnings = devices.filter(d => d.status === 'WARNING').length;
  const criticals = devices.filter(d => d.status === 'CRITICAL').length;
  const avgBattery = devices.reduce((s, d) => s + d.secondaryBattery, 0) / devices.length;
  const avgSignal = devices.reduce((s, d) => s + d.signalQuality, 0) / devices.length;

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 10 }}>
        <div className="stat-card"><div className="stat-label">Total Devices</div><div className="stat-value blue">{devices.length}</div></div>
        <div className="stat-card"><div className="stat-label">Warnings</div><div className={`stat-value ${warnings > 0 ? 'yellow' : 'green'}`}>{warnings}</div></div>
        <div className="stat-card"><div className="stat-label">Critical</div><div className={`stat-value ${criticals > 0 ? 'red' : 'green'}`}>{criticals}</div></div>
        <div className="stat-card"><div className="stat-label">Avg Battery</div><div className={`stat-value ${avgBattery > 80 ? 'green' : 'yellow'}`}>{formatPercent(avgBattery)}</div></div>
        <div className="stat-card"><div className="stat-label">Avg Signal</div><div className={`stat-value ${avgSignal > 80 ? 'green' : 'yellow'}`}>{formatPercent(avgSignal)}</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Device Health Table</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{devices.length} devices</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="health-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Type</th>
                <th>Status</th>
                <th>Primary</th>
                <th>Secondary</th>
                <th>Signal</th>
                <th>Strength</th>
                <th>Loss</th>
                <th>Latency</th>
                <th>Depth</th>
                <th>Temp</th>
                <th>Conn</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr
                  key={d.id}
                  onClick={() => onSelectDevice(selectedDeviceId === d.id ? null : d.id)}
                  className={selectedDeviceId === d.id ? 'selected' : ''}
                >
                  <td style={{ fontWeight: 600, color: deviceTypeColor(d.type) }}>
                    {deviceSymbol(d.type)} {d.id}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
                    {deviceTypeLabel(d.type)}
                  </td>
                  <td>
                    <span className={`status-badge ${d.status.toLowerCase()}`}>{d.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ minWidth: 36 }}>{formatPercent(d.primaryBattery)}</span>
                      <div style={{ width: 40, height: 3, background: 'var(--bg-ocean)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${d.primaryBattery}%`, background: 'var(--accent-green)', borderRadius: 2 }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ minWidth: 36, color: d.secondaryBattery > 80 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{formatPercent(d.secondaryBattery)}</span>
                      <div style={{ width: 40, height: 3, background: 'var(--bg-ocean)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${d.secondaryBattery}%`, background: d.secondaryBattery > 80 ? 'var(--accent-green)' : 'var(--accent-yellow)', borderRadius: 2 }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ color: d.signalQuality > 80 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{formatPercent(d.signalQuality)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatdB(d.signalStrength)}</td>
                  <td style={{ color: d.packetLoss > 3 ? 'var(--accent-yellow)' : 'var(--text-secondary)' }}>{formatPercent(d.packetLoss)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatLatency(d.latency)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{d.depth.toLocaleString()} m</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{d.temperature.toFixed(1)} °C</td>
                  <td style={{ fontSize: 10, color: d.connectedNodes.length > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {d.connectedNodes.length} node{d.connectedNodes.length !== 1 ? 's' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
