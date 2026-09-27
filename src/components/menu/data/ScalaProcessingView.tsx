import { formatLatency, formatPercent, formatTimestamp } from '../../../utils/format';
import { DataViewHeader, avg, type DataViewProps } from './shared';

const FLOW = ['RAW TELEMETRY', 'DATA VALIDATION', 'TRANSFORMATION', 'AGGREGATION', 'NETWORK ANALYSIS', 'OUTPUT'];

const TASKS = [
  'Telemetry transformation',
  'Sensor data normalization',
  'Network metric aggregation',
  'Packet-loss calculation',
  'Latency aggregation',
  'Device-state processing',
  'Acoustic event processing',
  'Historical data transformation',
];

export function ScalaProcessingView({ option, state }: DataViewProps) {
  const device = state?.devices.find(d => d.id === 'S-02') ?? state?.devices[0] ?? null;

  return (
    <div className="menu-content-view">
      <DataViewHeader option={option} subtitle="Typed processing logic for underwater telemetry and network analytics" />
      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">Role</span></div>
          <p className="da-lead">
            Scala is the processing component of the proposed Spark architecture: typed
            transformation logic applied to underwater telemetry and network analytics.
          </p>
          <div className="da-hflow">
            {FLOW.map((step, i, arr) => (
              <div className="da-hflow-step" key={step}>
                <div className="da-hflow-box">{step}</div>
                {i < arr.length - 1 && <div className="da-hflow-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Processing Tasks</span></div>
          <ul className="da-card-list">
            {TASKS.map(t => <li key={t}>• {t}</li>)}
          </ul>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Example Processing Model</span></div>
          {!state || !device ? (
            <p className="da-loading">Telemetry is still initialising — please try again in a few seconds.</p>
          ) : (
            <div className="da-grid-2">
              <div>
                <div className="big-metric-label">Telemetry Record</div>
                <ul className="da-card-list">
                  <li><strong>Node ID:</strong> {device.id}</li>
                  <li><strong>Timestamp:</strong> {formatTimestamp(state.lastUpdate)}</li>
                  <li><strong>Depth:</strong> {device.depth.toLocaleString()} m</li>
                  <li><strong>Sensor Values:</strong> {device.temperature.toFixed(1)} °C · {device.salinity.toFixed(2)} PSU · {device.dissolvedOxygen.toFixed(2)} mg/L</li>
                  <li><strong>Signal Metrics:</strong> {device.signalQuality.toFixed(1)}% · {device.signalStrength.toFixed(1)} dB</li>
                  <li><strong>Network Status:</strong> {device.status} · loss {formatPercent(device.packetLoss)} · {formatLatency(device.latency)}</li>
                </ul>
              </div>
              <div>
                <div className="big-metric-label">Processed Record</div>
                <ul className="da-card-list">
                  <li><strong>Aggregated Metrics:</strong> avg loss {formatPercent(avg(state.devices.map(d => d.packetLoss)))} · avg latency {formatLatency(avg(state.devices.map(d => d.latency)))}</li>
                  <li><strong>Device Health:</strong> {state.devices.filter(d => d.status === 'NORMAL').length} normal · {state.devices.filter(d => d.status === 'WARNING').length} warning · {state.devices.filter(d => d.status === 'CRITICAL').length} critical</li>
                  <li><strong>Network Performance:</strong> {formatPercent(avg(state.devices.map(d => d.signalQuality)))} quality · {state.snc.throughput.toFixed(1)} msg/s throughput</li>
                  <li><strong>Analytics Output:</strong> SNC {state.snc.stability} · {state.alerts.filter(a => !a.acknowledged).length} open alerts</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
