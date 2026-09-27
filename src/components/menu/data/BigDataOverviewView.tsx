import { DataViewHeader, type DataViewProps } from './shared';

const ARCHITECTURE = [
  { title: 'UNDERWATER DEVICES', desc: 'Sensor + acoustic communication nodes' },
  { title: 'SENSOR / ACOUSTIC TELEMETRY', desc: 'Environmental, acoustic and network measurements' },
  { title: 'KAFKA STREAMING', desc: 'Event streams per telemetry category' },
  { title: 'SPARK ANALYTICS', desc: 'Distributed telemetry processing' },
  { title: 'SCALA PROCESSING', desc: 'Typed transformation logic' },
  { title: 'CASSANDRA STORAGE', desc: 'Time-series and historical records' },
  { title: 'NETWORK METRICS / DASHBOARD / AI ASSISTANT', desc: 'Monitoring, visualization and decision support' },
];

export function BigDataOverviewView({ option, state }: DataViewProps) {
  const devices = state?.devices ?? [];
  const links = state?.links ?? [];
  const sensorNodes = devices.filter(d => d.type === 'HYDROPHONE' || d.type === 'ENVIRONMENTAL_SENSOR').length;

  return (
    <div className="menu-content-view">
      <DataViewHeader
        option={option}
        subtitle="Distributed data architecture for underwater communication monitoring and analytics"
      />
      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">Architecture</span></div>
          <div className="mc-flow">
            {ARCHITECTURE.map((step, j, arr) => (
              <div className="mc-flow-item" key={step.title}>
                <span className="mc-flow-box">{step.title}<br /><small style={{ fontWeight: 400, fontSize: 11 }}>{step.desc}</small></span>
                {j < arr.length - 1 && <span className="mc-flow-arrow">↓</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="da-grid-3">
          <div className="card">
            <div className="card-header"><span className="card-title">Data Sources</span></div>
            <ul className="da-card-list">
              <li>Underwater nodes, environmental sensors, acoustic communication, network telemetry</li>
              <li><strong>{devices.length} devices · {links.length} links · {sensorNodes} sensor nodes</strong></li>
            </ul>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Streaming Layer</span></div>
            <ul className="da-card-list"><li>Apache Kafka — event streams for continuous telemetry and network events</li></ul>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Processing Layer</span></div>
            <ul className="da-card-list"><li>Apache Spark — distributed processing of telemetry and network events</li></ul>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Processing Language</span></div>
            <ul className="da-card-list"><li>Scala — typed transformation logic for the Spark processing layer</li></ul>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Storage Layer</span></div>
            <ul className="da-card-list"><li>Apache Cassandra — time-series telemetry and historical records</li></ul>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Analytics Layer</span></div>
            <ul className="da-card-list">
              <li>Network performance, acoustic communication, environmental measurements, energy, device health and historical trends</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Visualization Layer</span></div>
          <ul className="da-card-list"><li>Dashboard, charts, device monitoring and AI assistant</li></ul>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Data Categories</span></div>
          <div className="da-grid-2">
            <div>
              <div className="big-metric-label">Environmental</div>
              <ul className="da-card-list"><li>Temperature · Pressure · Depth · Salinity · Dissolved Oxygen · pH · Turbidity</li></ul>
            </div>
            <div>
              <div className="big-metric-label">Acoustic</div>
              <ul className="da-card-list"><li>Acoustic frequency · Signal strength · Acoustic communication events · Hydrophone observations</li></ul>
            </div>
            <div>
              <div className="big-metric-label">Network</div>
              <ul className="da-card-list"><li>Packet transmission · Packet loss · Latency · Throughput · Link quality · Node connectivity</li></ul>
            </div>
            <div>
              <div className="big-metric-label">Device</div>
              <ul className="da-card-list"><li>Battery / energy · Device health · Storage · Node status · Failure events</li></ul>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Why Big Data?</span></div>
          <p className="da-lead">
            The underwater network generates continuous data from multiple nodes. The Big Data
            architecture provides a structured way to stream, process, store and analyze these
            measurements for network monitoring and intelligent decision support.
          </p>
        </div>
      </div>
    </div>
  );
}
