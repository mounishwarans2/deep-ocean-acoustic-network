import { DataViewHeader, type DataViewProps } from './shared';

const PIPELINE: { title: string; desc: string }[] = [
  { title: 'UNDERWATER NODES', desc: 'Sensors + Acoustic Communication' },
  { title: 'DATA INGESTION', desc: 'Telemetry / Events' },
  { title: 'KAFKA STREAMING', desc: 'Event Streams' },
  { title: 'SPARK ANALYTICS', desc: 'Processing' },
  { title: 'SCALA PROCESSING', desc: 'Transformations' },
  { title: 'CASSANDRA STORAGE', desc: 'Historical Data' },
  { title: 'ANALYTICS', desc: 'SNC / Network Performance' },
  { title: 'DASHBOARD + AI', desc: 'Visualization · Alerts / Insights' },
];

const STAGES: { num: string; icon: string; title: string; desc: string }[] = [
  { num: '1', icon: '🌊', title: 'COLLECTION', desc: 'Underwater nodes capture environmental, acoustic and network measurements.' },
  { num: '2', icon: '📥', title: 'INGESTION', desc: 'Telemetry and network events enter the streaming layer.' },
  { num: '3', icon: '📨', title: 'STREAMING', desc: 'Kafka topics carry continuous event streams per category.' },
  { num: '4', icon: '⚙️', title: 'PROCESSING', desc: 'Spark analytics with Scala transformations aggregate the streams.' },
  { num: '5', icon: '🗄️', title: 'STORAGE', desc: 'Cassandra models persist time-series and historical records.' },
  { num: '6', icon: '📊', title: 'ANALYTICS', desc: 'SNC and network analytics evaluate performance and health.' },
  { num: '7', icon: '🖥️', title: 'VISUALIZATION', desc: 'Dashboard charts, device monitoring and AI assistant present the results.' },
];

export function DataPipelineView({ option, state }: DataViewProps) {
  const devices = state?.devices ?? [];
  const links = state?.links ?? [];

  return (
    <div className="menu-content-view">
      <DataViewHeader option={option} subtitle="End-to-end flow of underwater telemetry from sensing to analytics" />
      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">Pipeline</span></div>
          <div className="da-pipe">
            {PIPELINE.map((step, j, arr) => (
              <div key={step.title} style={{ display: 'contents' }}>
                <div className="da-pipe-box"><b>{step.title}</b><span>{step.desc}</span></div>
                {j < arr.length - 1 && <div className="da-pipe-arrow">↓</div>}
              </div>
            ))}
          </div>
          <p className="da-note">
            {devices.length > 0
              ? `Currently carrying telemetry from ${devices.length} devices across ${links.length} links.`
              : 'Telemetry is still initialising.'}
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Data Flow Categories</span></div>
          <div className="da-grid-2">
            <div>
              <div className="big-metric-label">Environmental Data</div>
              <ul className="da-card-list"><li>Temperature · Pressure · Depth · Salinity · Dissolved Oxygen · pH · Turbidity</li></ul>
            </div>
            <div>
              <div className="big-metric-label">Acoustic Data</div>
              <ul className="da-card-list"><li>Frequency · Signal Strength · Acoustic Events · Hydrophone Data</li></ul>
            </div>
            <div>
              <div className="big-metric-label">Network Data</div>
              <ul className="da-card-list"><li>Packets · Latency · Packet Loss · Throughput · Link Quality</li></ul>
            </div>
            <div>
              <div className="big-metric-label">Device Data</div>
              <ul className="da-card-list"><li>Energy · Health · Storage · Status</li></ul>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Processing Stages</span></div>
          <div className="da-grid-2">
            {STAGES.map(s => (
              <div key={s.num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22 }} aria-hidden="true">{s.icon}</span>
                <div>
                  <div className="big-metric-label">{s.num}. {s.title}</div>
                  <ul className="da-card-list"><li>{s.desc}</li></ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
