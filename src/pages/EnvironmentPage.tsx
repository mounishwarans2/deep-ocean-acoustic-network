import type { SimulationState } from '../hooks/useSimulation';
import { deviceTypeColor, deviceSymbol } from '../utils/format';

interface Props {
  state: SimulationState;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
}

export function EnvironmentPage({ state, selectedDeviceId, onSelectDevice }: Props) {
  const { devices } = state;
  const maxDepth = Math.max(...devices.map(d => d.depth));
  const selectedDevice = selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) : null;

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 10 }}>
        <div className="stat-card"><div className="stat-label">Avg Temperature</div><div className="stat-value cyan">{(devices.reduce((s, d) => s + d.temperature, 0) / devices.length).toFixed(1)} °C</div></div>
        <div className="stat-card"><div className="stat-label">Avg Pressure</div><div className="stat-value">{(devices.reduce((s, d) => s + d.pressure, 0) / devices.length).toFixed(0)} bar</div></div>
        <div className="stat-card"><div className="stat-label">Avg Salinity</div><div className="stat-value blue">{(devices.reduce((s, d) => s + d.salinity, 0) / devices.length).toFixed(1)} PSU</div></div>
        <div className="stat-card"><div className="stat-label">Max Depth</div><div className="stat-value purple">{maxDepth.toLocaleString()} m</div></div>
      </div>

      <div className="page-grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Depth Profile</span></div>
          {[...devices].sort((a, b) => a.depth - b.depth).map(d => (
            <div key={d.id} onClick={() => onSelectDevice(selectedDeviceId === d.id ? null : d.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '2px 4px', borderRadius: 3, marginBottom: 2, background: selectedDeviceId === d.id ? 'rgba(37,99,235,0.06)' : 'transparent' }}>
              <span style={{ width: 32, fontSize: 9, fontWeight: 600, color: deviceTypeColor(d.type) }}>{d.id}</span>
              <div style={{ flex: 1, height: 10, background: 'var(--bg-ocean)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(d.depth / maxDepth) * 100}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))', borderRadius: 2, display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                  <span style={{ fontSize: 8, color: '#fff', fontWeight: 600 }}>{d.depth.toLocaleString()} m</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Environmental Conditions</span></div>
          <div style={{ overflowX: 'auto' }}>
            <table className="health-table">
              <thead><tr><th>Node</th><th>Depth</th><th>Temp</th><th>Pressure</th><th>Salinity</th><th>O₂</th><th>Density</th></tr></thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id} onClick={() => onSelectDevice(selectedDeviceId === d.id ? null : d.id)} className={selectedDeviceId === d.id ? 'selected' : ''}>
                    <td style={{ fontWeight: 600, color: deviceTypeColor(d.type) }}>{deviceSymbol(d.type)} {d.id}</td>
                    <td>{d.depth.toLocaleString()} m</td>
                    <td>{d.temperature.toFixed(1)} °C</td>
                    <td>{d.pressure.toFixed(0)} bar</td>
                    <td>{d.salinity.toFixed(1)} PSU</td>
                    <td>{d.dissolvedOxygen.toFixed(1)} mg/L</td>
                    <td>{d.waterDensity.toFixed(0)} kg/m³</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedDevice && (
        <div className="card" style={{ marginTop: 10 }}>
          <div className="card-header"><span className="card-title">{selectedDevice.id} — Environment Detail</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div className="stat-card"><div className="stat-label">Depth</div><div className="stat-value cyan">{selectedDevice.depth.toLocaleString()} m</div></div>
            <div className="stat-card"><div className="stat-label">Temperature</div><div className="stat-value">{selectedDevice.temperature.toFixed(1)} °C</div></div>
            <div className="stat-card"><div className="stat-label">Pressure</div><div className="stat-value">{selectedDevice.pressure.toFixed(0)} bar</div></div>
            <div className="stat-card"><div className="stat-label">Salinity</div><div className="stat-value blue">{selectedDevice.salinity.toFixed(1)} PSU</div></div>
            <div className="stat-card"><div className="stat-label">Dissolved O₂</div><div className="stat-value">{selectedDevice.dissolvedOxygen.toFixed(1)} mg/L</div></div>
            <div className="stat-card"><div className="stat-label">Background Noise</div><div className="stat-value yellow">{selectedDevice.backgroundNoise.toFixed(1)} dB</div></div>
            <div className="stat-card"><div className="stat-label">Current Speed</div><div className="stat-value">{selectedDevice.currentSpeed.toFixed(2)} m/s</div></div>
            <div className="stat-card"><div className="stat-label">Water Density</div><div className="stat-value">{selectedDevice.waterDensity.toFixed(0)} kg/m³</div></div>
            <div className="stat-card"><div className="stat-label">Coordinates</div><div className="stat-value" style={{ fontSize: 11 }}>{selectedDevice.latitude.toFixed(3)}°N / {selectedDevice.longitude.toFixed(3)}°W</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
