import { MiniChart } from '../charts/MiniChart';
import type { SimulationState } from '../../hooks/useSimulation';
import type { ResolvedSensor } from './sensorData';

interface Props {
  sensor: ResolvedSensor;
  state: SimulationState;
  onClose: () => void;
}

export function SensorDetail({ sensor, state, onClose }: Props) {
  const { def } = sensor;
  const trendData = def.trend === 'battery'
    ? state.historyBattery
    : def.trend === 'signal'
      ? state.historySignalQuality
      : null;
  const trendLabel = def.trend === 'battery'
    ? 'Secondary energy trend (telemetry)'
    : def.trend === 'signal'
      ? 'Signal quality trend (telemetry)'
      : null;

  return (
    <div className="card sensor-detail" role="region" aria-label={`${def.name} details`}>
      <div className="card-header">
        <span className="card-title">{def.icon} {def.name}</span>
        <button type="button" className="sensor-close" onClick={onClose} aria-label="Close sensor details">✕</button>
      </div>
      <div className="sensor-detail-grid">
        <div>
          <div className="big-metric-label">Current Reading</div>
          <div className="big-metric">{sensor.reading} <span className="sensor-unit">{sensor.unit ?? def.unit}</span></div>
          {sensor.detail && <div className="sensor-sub">{sensor.detail}</div>}
        </div>
        <div className="sensor-facts">
          <div className="sensor-fact"><span>Status</span><strong>{sensor.status}</strong></div>
          <div className="sensor-fact"><span>Location on Prototype</span><strong>{def.location}</strong></div>
          <div className="sensor-fact"><span>Measures</span><strong>{def.measurement}</strong></div>
        </div>
      </div>
      {sensor.observation && (
        <div className="sensor-observation" aria-label="Observation record">
          <div className="sensor-fact"><span>Observed</span><strong>{sensor.observation.observationDate.replace('T', ' ').replace('Z', ' UTC')}</strong></div>
          <div className="sensor-fact"><span>Observation depth</span><strong>{sensor.observation.depthM} m</strong></div>
          <div className="sensor-fact"><span>Location</span><strong>{sensor.observation.latitude.toFixed(4)}°N, {Math.abs(sensor.observation.longitude).toFixed(4)}°W</strong></div>
          {sensor.observation.pressureDerived && (
            <div className="sensor-fact"><span>Note</span><strong>Pressure derived from depth (1 dbar ≈ 1 m)</strong></div>
          )}
        </div>
      )}
      {trendData && trendData.length >= 2 && (
        <div style={{ marginTop: 12 }}>
          <div className="big-metric-label">{trendLabel}</div>
          <MiniChart data={trendData} color="var(--accent-cyan)" height={56} showDots />
        </div>
      )}
      <div className="sensor-detail-text">
        <div><strong>Why it matters in the ocean:</strong> {def.oceanPurpose}</div>
        <div><strong>How the system uses the data:</strong> {def.systemUse}</div>
      </div>
    </div>
  );
}
