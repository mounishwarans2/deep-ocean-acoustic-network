import type { SimulationState } from '../hooks/useSimulation';
import { deviceTypeColor, formatPercent, formatWatts, deviceSymbol } from '../utils/format';

interface Props {
  state: SimulationState;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
}

export function EnergyPage({ state, selectedDeviceId, onSelectDevice }: Props) {
  const { devices } = state;
  const avgPrimary = devices.reduce((s, d) => s + d.primaryBattery, 0) / devices.length;
  const avgSecondary = devices.reduce((s, d) => s + d.secondaryBattery, 0) / devices.length;
  const totalLoad = devices.reduce((s, d) => s + d.powerLoad, 0);
  const sorted = [...devices].sort((a, b) => a.secondaryBattery - b.secondaryBattery);

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 10 }}>
        <div className="stat-card"><div className="stat-label">Avg Primary Power</div><div className="stat-value green">{formatPercent(avgPrimary)}</div></div>
        <div className="stat-card"><div className="stat-label">Avg Secondary Battery</div><div className={`stat-value ${avgSecondary > 80 ? 'green' : 'yellow'}`}>{formatPercent(avgSecondary)}</div></div>
        <div className="stat-card"><div className="stat-label">Total Load</div><div className="stat-value cyan">{formatWatts(totalLoad)}</div></div>
        <div className="stat-card"><div className="stat-label">Low Batteries</div><div className={`stat-value ${devices.filter(d => d.secondaryBattery < 75).length > 0 ? 'yellow' : 'green'}`}>{devices.filter(d => d.secondaryBattery < 75).length}</div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Energy Management</span></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', flexWrap: 'wrap' }}>
          {['Primary Source', 'Energy Management', 'Secondary Storage', 'Communication Load'].map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 12px', textAlign: 'center', fontSize: 11.5, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
              {i < 3 && <span style={{ color: 'var(--text-muted)', fontSize: 16.5 }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Device Energy Status</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="health-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Type</th>
                <th>Primary</th>
                <th>Secondary</th>
                <th>Load</th>
                <th>Consumption</th>
                <th>Charge Rate</th>
                <th>Est. Remaining</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(d => {
                const consumption = d.powerLoad;
                const chargeRate = d.energyState === 'SAVING' ? 0.02 : d.energyState === 'LOW' ? 0.01 : 0.04;
                const estRemaining = d.secondaryBattery > 0 ? Math.round((d.secondaryBattery / Math.max(consumption, 0.1)) * 10) / 10 : 0;
                return (
                  <tr key={d.id} onClick={() => onSelectDevice(selectedDeviceId === d.id ? null : d.id)} className={selectedDeviceId === d.id ? 'selected' : ''}>
                    <td style={{ fontWeight: 600, color: deviceTypeColor(d.type) }}>{deviceSymbol(d.type)} {d.id}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{d.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).split(' ').slice(0, 2).join(' ')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ minWidth: 36, color: 'var(--accent-green)' }}>{formatPercent(d.primaryBattery)}</span>
                        <div style={{ width: 50, height: 3, background: 'var(--bg-ocean)', borderRadius: 2 }}><div style={{ height: '100%', width: `${d.primaryBattery}%`, background: 'var(--accent-green)', borderRadius: 2 }} /></div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ minWidth: 36, color: d.secondaryBattery > 80 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{formatPercent(d.secondaryBattery)}</span>
                        <div style={{ width: 50, height: 3, background: 'var(--bg-ocean)', borderRadius: 2 }}><div style={{ height: '100%', width: `${d.secondaryBattery}%`, background: d.secondaryBattery > 80 ? 'var(--accent-green)' : 'var(--accent-yellow)', borderRadius: 2 }} /></div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatWatts(d.powerLoad)}</td>
                    <td style={{ color: 'var(--accent-yellow)' }}>{consumption.toFixed(2)} W/h</td>
                    <td style={{ color: chargeRate > 0.03 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{(chargeRate * 100).toFixed(1)} %/h</td>
                    <td style={{ color: estRemaining > 48 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{estRemaining.toFixed(0)}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
