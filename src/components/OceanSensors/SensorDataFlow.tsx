const STAGES = [
  'SENSORS',
  'AI / PROCESSING UNIT',
  'LOCAL STORAGE',
  'UNDERWATER COMMUNICATION',
  'DIGITAL TWIN',
  'SNC / PRISM / ANALYTICS',
];

export function SensorDataFlow() {
  return (
    <div className="card">
      <div className="card-header"><span className="card-title">Sensor Data Flow</span></div>
      <div className="sensor-flow" aria-label="Sensor data flow stages">
        {STAGES.map((stage, i) => (
          <div key={stage} className="sensor-flow-step">
            <div className="sensor-flow-box">{stage}</div>
            {i < STAGES.length - 1 && <div className="sensor-flow-arrow" aria-hidden="true" />}
          </div>
        ))}
      </div>
      <p className="sensor-flow-note">
        Sensor data is collected by the underwater node, processed locally, stored when necessary,
        and used by the communication and analytics systems.
      </p>
    </div>
  );
}
