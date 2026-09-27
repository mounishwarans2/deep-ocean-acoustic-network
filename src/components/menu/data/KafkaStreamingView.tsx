import { DataViewHeader, type DataViewProps } from './shared';

const ARCHITECTURE = [
  'UNDERWATER NODES',
  'TELEMETRY EVENTS',
  'KAFKA PRODUCER',
  'KAFKA TOPICS',
  'STREAM PROCESSING',
  'SPARK / ANALYTICS',
  'DASHBOARD',
];

const TOPICS: { name: string; purpose: string; example: string }[] = [
  { name: 'telemetry', purpose: 'Sensor and device measurements', example: 'Depth, temperature and battery reading from S-02' },
  { name: 'acoustic-signals', purpose: 'Acoustic communication events and signal information', example: 'Signal-quality update on the SUB-A uplink' },
  { name: 'network-events', purpose: 'Packet transmission, latency and connectivity events', example: 'Packet-loss reading crossing its threshold' },
  { name: 'device-health', purpose: 'Node health and device status', example: 'Status transition of MN-01' },
  { name: 'environment', purpose: 'Temperature, pressure, salinity, oxygen, pH and turbidity', example: 'CTD level observation at 100 m' },
  { name: 'energy', purpose: 'Battery and energy state', example: 'Secondary-battery drift on S-08' },
  { name: 'alerts', purpose: 'Warning and critical system events', example: 'Critical failure notification for a node' },
];

const STREAM_FLOW = ['PRODUCER', 'KAFKA TOPIC', 'CONSUMER', 'PROCESSING', 'STORAGE / DASHBOARD'];

export function KafkaStreamingView({ option, state }: DataViewProps) {
  return (
    <div className="menu-content-view">
      <DataViewHeader option={option} subtitle="Real-time event streaming for underwater communication telemetry" />
      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">Architecture</span></div>
          <div className="mc-flow">
            {ARCHITECTURE.map((step, j, arr) => (
              <div className="mc-flow-item" key={step}>
                <span className="mc-flow-box">{step}</span>
                {j < arr.length - 1 && <span className="mc-flow-arrow">↓</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Topics</span></div>
          <div className="da-grid-2">
            {TOPICS.map(t => (
              <div key={t.name}>
                <div className="big-metric-label" style={{ fontFamily: 'ui-monospace, monospace' }}>{t.name}</div>
                <ul className="da-card-list">
                  <li>{t.purpose}</li>
                  <li style={{ color: 'var(--text-muted)' }}>Example: {t.example}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Streaming Flow</span></div>
          <div className="da-hflow">
            {STREAM_FLOW.map((step, i, arr) => (
              <div className="da-hflow-step" key={step}>
                <div className="da-hflow-box">{step}</div>
                {i < arr.length - 1 && <div className="da-hflow-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Pipeline Telemetry</span></div>
          {!state ? (
            <p className="da-loading">Telemetry is still initialising — please try again in a few seconds.</p>
          ) : (
            <div className="stat-grid" style={{ marginTop: 8 }}>
              <div className="stat-card"><div className="stat-value blue">{state.kafka.messagesPerSec.toFixed(1)}</div><div className="stat-label">Messages / sec</div></div>
              <div className="stat-card"><div className="stat-value cyan">{state.kafka.consumerLag}</div><div className="stat-label">Consumer Lag</div></div>
              <div className="stat-card"><div className="stat-value green">{state.kafka.totalMessages.toLocaleString()}</div><div className="stat-label">Total Messages</div></div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Why Kafka?</span></div>
          <p className="da-lead">
            Kafka provides an event-streaming architecture for handling continuous telemetry
            and network events from multiple underwater nodes.
          </p>
        </div>
      </div>
    </div>
  );
}
