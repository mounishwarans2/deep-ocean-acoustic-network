import { useMemo, useState } from 'react';
import type { SimulationState } from '../hooks/useSimulation';
import { resolveSensors } from '../components/OceanSensors/sensorData';
import { SensorCard } from '../components/OceanSensors/SensorCard';
import { SensorDetail } from '../components/OceanSensors/SensorDetail';
import { SensorDataFlow } from '../components/OceanSensors/SensorDataFlow';
import { useNoaaWod } from '../services/noaaWodService';
import './OceanSensorsPage.css';

interface Props {
  state: SimulationState;
}

export function OceanSensorsPage({ state }: Props) {
  const provider = useNoaaWod();
  const cast = provider.getProfile();
  const sensors = useMemo(() => resolveSensors(state, cast), [state, cast]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sensors.find(s => s.def.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="ocean-sensors-page">
      <div className="card">
        <div className="card-header"><span className="card-title">🌊 Ocean Sensors</span></div>
        <p className="sensor-lead">Environmental and system sensing for the underwater communication node</p>
        <div className="stat-grid" style={{ marginTop: 12 }}>
          <div className="stat-card"><div className="stat-value blue">9</div><div className="stat-label">Active Sensor Systems</div></div>
          <div className="stat-card"><div className="stat-value cyan">1</div><div className="stat-label">Acoustic Communication Interface</div></div>
          <div className="stat-card"><div className="stat-value green">1</div><div className="stat-label">Underwater Prototype Node</div></div>
        </div>
      </div>

      <div className="sensor-grid" role="list" aria-label="Ocean sensor systems">
        {sensors.map(s => (
          <SensorCard key={s.def.id} sensor={s} selected={s.def.id === selectedId} onSelect={handleSelect} />
        ))}
      </div>

      {selected && (
        <SensorDetail sensor={selected} state={state} onClose={() => setSelectedId(null)} />
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">📡 Acoustic Communication</span></div>
        <div className="sensor-transducer">
          <span className="sensor-icon" aria-hidden="true">📡</span>
          <div>
            <div className="sensor-name">Acoustic Communication Transducer</div>
            <div className="sensor-category">Communication Hardware — not counted as a sensor</div>
            <p className="sensor-lead" style={{ marginTop: 6 }}>
              <strong>Function:</strong> Transmits underwater acoustic communication signals.
              The page therefore shows <strong>9 sensor systems + 1 acoustic communication transducer</strong>.
            </p>
          </div>
          <span className="status-badge normal">ACTIVE</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Prototype Sensor Package</span></div>
        <p className="sensor-lead">
          The physical prototype is designed as a modular underwater sensing and acoustic communication
          node. The dashboard represents the sensor telemetry and digital-twin behavior of the node.
        </p>
        <p className="sensor-lead sensor-disclaimer">
          9-sensor modular ocean sensing package.
        </p>
      </div>

      <SensorDataFlow />
    </div>
  );
}
