import type { ResolvedSensor } from './sensorData';

interface Props {
  sensor: ResolvedSensor;
  selected: boolean;
  onSelect: (id: string) => void;
}

const STATUS_CLASS: Record<ResolvedSensor['status'], string> = {
  ACTIVE: 'normal',
  WARNING: 'warning',
  OFFLINE: 'critical',
};

export function SensorCard({ sensor, selected, onSelect }: Props) {
  const { def } = sensor;
  return (
    <button
      type="button"
      className={`sensor-card${selected ? ' selected' : ''}`}
      onClick={() => onSelect(def.id)}
      aria-pressed={selected}
      aria-label={`${def.name}, ${sensor.status}, reading ${sensor.reading}`}
    >
      <div className="sensor-card-top">
        <span className="sensor-icon" aria-hidden="true">{def.icon}</span>
        <span className={`status-badge ${STATUS_CLASS[sensor.status]}`}>{sensor.status}</span>
      </div>
      <div className="sensor-name">{def.name}</div>
      <div className="sensor-category">{def.category}</div>
      <div className="sensor-reading">{sensor.reading}</div>
      {sensor.detail && <div className="sensor-sub">{sensor.detail}</div>}
    </button>
  );
}
