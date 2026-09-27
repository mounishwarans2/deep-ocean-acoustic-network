import type { MenuOption } from '../../data/menuContent';
import { BackButton } from './BackButton';
import '../menu/Menu.css';
import './SystemArchitectureView.css';

interface Props {
  option: MenuOption;
}

const MAIN_LAYERS: { title: string; lines: string[] }[] = [
  { title: 'DASHBOARD LAYER', lines: ['Digital Twin • Visualization • AI Assistant'] },
  { title: 'DATA STORAGE LAYER', lines: ['Historical Data • Telemetry • Events', 'Cassandra / Structured Data Storage'] },
  { title: 'ANALYTICS LAYER', lines: ['SNC • Spark • Scala • Network Analytics'] },
  { title: 'COMMUNICATION NODE LAYER', lines: ['Acoustic Communication • PRISM Routing', 'AI Processing • Energy • Local Storage'] },
  { title: 'UNDERWATER SENSOR LAYER', lines: ['Temperature • Pressure • Salinity', 'Oxygen • pH • Turbidity • Hydrophone'] },
];

const NODE_COMPONENTS = [
  'Acoustic Transducer',
  'Hydrophone',
  'AI Processing Unit',
  'SNC Processing',
  'PRISM Routing',
  'Primary Power',
  'Secondary Lithium-Polymer Battery',
  'Local Storage',
  'Device Health Monitoring',
  'Emergency Recovery / Ballast System',
];

const COMM_FLOW = [
  'SOURCE NODE',
  'ACOUSTIC TRANSMISSION',
  'UNDERWATER RELAY NODE',
  'ACOUSTIC TRANSMISSION',
  'DESTINATION NODE',
];

const ANALYTICS_COMPONENTS = [
  'Stochastic Network Calculus (SNC)',
  'Spark Analytics',
  'Scala Processing',
  'Network Analytics',
  'Acoustic Analysis',
  'Environmental Analysis',
  'Device Health Analysis',
  'AI Intelligence',
];

const ANALYTICS_FLOW = [
  'RAW TELEMETRY',
  'PROCESSING',
  'AGGREGATION',
  'NETWORK ANALYSIS',
  'SYSTEM INSIGHTS',
];

const ANALYTICS_METRICS = [
  'Latency',
  'Packet Loss',
  'Throughput',
  'Signal Strength',
  'Link Quality',
  'Network Load',
  'Device Health',
  'Energy State',
];

const DASHBOARD_CAPS = [
  'Digital Twin Visualization',
  'Device Monitoring',
  'Ocean Sensors',
  'Network Topology',
  'Network Metrics',
  'Data Visualization',
  'Historical Ocean Data',
  'Data & Analytics',
  'System Alerts',
  'Emergency Recovery',
  'AI Assistant',
];

const END_TO_END = [
  'SENSORS',
  'UNDERWATER NODE',
  'ACOUSTIC COMMUNICATION',
  'TELEMETRY',
  'ANALYTICS',
  'STORAGE',
  'DIGITAL TWIN',
  'DASHBOARD',
  'AI INSIGHTS / ALERTS',
];

const RESPONSIBILITIES: { layer: string; responsibility: string }[] = [
  { layer: 'Underwater Sensor', responsibility: 'Collect environmental and acoustic information' },
  { layer: 'Communication Node', responsibility: 'Process and transmit underwater data' },
  { layer: 'Analytics', responsibility: 'Analyze telemetry and network behavior' },
  { layer: 'Data Storage', responsibility: 'Organize and retain system information' },
  { layer: 'Dashboard', responsibility: 'Visualize and monitor the digital twin' },
];

const PROTOTYPE_MAPPING: { layer: string; mapsTo: string }[] = [
  { layer: 'UNDERWATER SENSOR LAYER', mapsTo: 'Environmental Sensors + Hydrophone' },
  { layer: 'COMMUNICATION NODE LAYER', mapsTo: 'Acoustic Transducer + Processing Unit + Power + Recovery' },
  { layer: 'ANALYTICS LAYER', mapsTo: 'SNC + AI + Network Analysis' },
  { layer: 'DATA STORAGE LAYER', mapsTo: 'Local Storage + Historical Data Architecture' },
  { layer: 'DASHBOARD LAYER', mapsTo: 'Digital Twin + Monitoring Interface' },
];

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="sa-list">
      {items.map(item => <li key={item}>• {item}</li>)}
    </ul>
  );
}

export function SystemArchitectureView({ option }: Props) {
  return (
    <div className="menu-content-view">
      <div className="menu-content-header">
        <div className="menu-content-title">
          <span className="menu-content-icon">{option.icon}</span>
          <div>
            <div className="menu-content-label">{option.label}</div>
          </div>
        </div>
        <BackButton />
        <p className="sa-subtitle">
          Layered architecture of the deep-ocean underwater communication and monitoring system
        </p>
      </div>

      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">Layered Architecture</span></div>
          <div className="sa-stack" aria-label="Layered system architecture diagram">
            {MAIN_LAYERS.map((layer, j, arr) => (
              <div key={layer.title} style={{ display: 'contents' }}>
                <div className="sa-layer-box">
                  <b>{layer.title}</b>
                  {layer.lines.map(line => <span key={line}>{line}</span>)}
                </div>
                {j < arr.length - 1 && <div className="sa-arrow" aria-hidden="true">▲</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">01 — Underwater Sensor Layer</span></div>
          <p className="sa-text">
            This layer collects environmental, acoustic and device measurements from the
            underwater environment.
          </p>
          <div className="sa-grid-2">
            <div>
              <div className="big-metric-label">Environmental Sensors</div>
              <Bullets items={['Temperature', 'Pressure / Depth', 'Salinity', 'Dissolved Oxygen', 'pH', 'Turbidity']} />
            </div>
            <div>
              <div className="big-metric-label">Acoustic Sensing</div>
              <Bullets items={['Hydrophone Array', 'Acoustic Signal Observations']} />
            </div>
          </div>
          <p className="sa-text">
            Sensor measurements provide the raw information required for environmental
            monitoring, communication analysis and network decision-making.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">02 — Communication Node Layer</span></div>
          <p className="sa-text">
            This layer contains the underwater nodes responsible for sensing, processing,
            acoustic communication and network connectivity.
          </p>
          <Bullets items={NODE_COMPONENTS} />
          <div className="sa-flow" aria-label="Acoustic communication flow">
            {COMM_FLOW.map((step, i, arr) => (
              <div className="sa-flow-step" key={step}>
                <div className="sa-flow-box">{step}</div>
                {i < arr.length - 1 && <div className="sa-flow-arrow">↓</div>}
              </div>
            ))}
          </div>
          <p className="sa-text">
            Underwater nodes exchange information through acoustic communication, while
            routing decisions adapt to network conditions.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">03 — Analytics Layer</span></div>
          <p className="sa-text">
            This layer processes telemetry and communication information to derive useful
            network and environmental insights.
          </p>
          <Bullets items={ANALYTICS_COMPONENTS} />
          <div className="sa-flow" aria-label="Analytical flow">
            {ANALYTICS_FLOW.map((step, i, arr) => (
              <div className="sa-flow-step" key={step}>
                <div className="sa-flow-box">{step}</div>
                {i < arr.length - 1 && <div className="sa-flow-arrow">↓</div>}
              </div>
            ))}
          </div>
          <div className="big-metric-label" style={{ marginTop: 10 }}>Analytical Metrics</div>
          <Bullets items={ANALYTICS_METRICS} />
          <p className="sa-note">
            Spark and Scala are components of the project's analytics architecture.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">04 — Data Storage Layer</span></div>
          <p className="sa-text">
            This layer organizes telemetry, environmental observations, communication
            events and historical system information for later analysis and visualization.
          </p>
          <div className="big-metric-label">Cassandra Storage</div>
          <div className="sa-grid-2" style={{ marginTop: 6 }}>
            <div>
              <div className="big-metric-label">Telemetry</div>
              <Bullets items={['Node ID', 'Timestamp', 'Depth', 'Sensor measurements']} />
            </div>
            <div>
              <div className="big-metric-label">Acoustic Events</div>
              <Bullets items={['Frequency', 'Signal strength', 'Communication events']} />
            </div>
            <div>
              <div className="big-metric-label">Network Metrics</div>
              <Bullets items={['Latency', 'Packet loss', 'Throughput', 'Link quality']} />
            </div>
            <div>
              <div className="big-metric-label">Device State</div>
              <Bullets items={['Energy', 'Health', 'Communication status', 'Recovery status']} />
            </div>
            <div>
              <div className="big-metric-label">Historical Ocean Observations</div>
              <Bullets items={['Temperature', 'Salinity', 'Dissolved Oxygen', 'Depth', 'Location']} />
            </div>
          </div>
          <p className="sa-note">
            Cassandra is the project's storage architecture.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">05 — Dashboard Layer</span></div>
          <p className="sa-text">
            The dashboard provides the user-facing digital-twin representation of the
            underwater communication system.
          </p>
          <Bullets items={DASHBOARD_CAPS} />
          <div className="big-metric-label" style={{ marginTop: 10 }}>AI Assistant</div>
          <p className="sa-text">
            The AI assistant provides context-aware explanations and analysis using the
            available digital-twin, device, network and environmental information.
          </p>
        </div>

        <div className="card sa-e2e">
          <div className="card-header"><span className="card-title">End-to-End Data Flow</span></div>
          <div className="sa-flow sa-flow-horizontal" aria-label="End-to-end data flow">
            {END_TO_END.map((step, i, arr) => (
              <div className="sa-hflow-step" key={step}>
                <div className="sa-flow-box">{step}</div>
                {i < arr.length - 1 && <div className="sa-hflow-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Architecture Responsibilities</span></div>
          <div className="sa-resp-grid">
            {RESPONSIBILITIES.map(r => (
              <div className="sa-resp-card" key={r.layer}>
                <b>{r.layer}</b>
                <span>{r.responsibility}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Physical Prototype Mapping</span></div>
          <p className="sa-text">
            The software architecture represents the physical underwater node and its
            surrounding network.
          </p>
          <div className="sa-map">
            {PROTOTYPE_MAPPING.map(m => (
              <div className="sa-map-row" key={m.layer}>
                <b>{m.layer}</b>
                <span className="sa-map-arrow" aria-hidden="true">→</span>
                <span>{m.mapsTo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
