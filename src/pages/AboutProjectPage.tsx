import './AboutProjectPage.css';

const CORE_FLOW = [
  'Underwater Sensors',
  'Underwater Communication Nodes',
  'Acoustic Communication',
  'PRISM Routing',
  'SNC Analytics',
  'Data Processing',
  'Storage',
  'Dashboard / AI Assistant',
];

const ARCH_LAYERS: { title: string; items: string[] }[] = [
  {
    title: '1. Underwater Sensor Layer',
    items: ['Temperature', 'Pressure / Depth', 'Salinity', 'Dissolved Oxygen', 'Turbidity', 'pH', 'Hydrophone'],
  },
  {
    title: '2. Communication Node Layer',
    items: ['Acoustic communication', 'Data transmission', 'Node-to-node communication', 'Relay communication'],
  },
  {
    title: '3. Intelligence & Analytics Layer',
    items: ['AI Intelligence', 'SNC Analytics', 'PRISM Routing', 'Network analysis', 'Anomaly/failure analysis'],
  },
  {
    title: '4. Data Layer',
    items: ['Kafka Streaming', 'Spark Analytics', 'Scala Processing', 'Cassandra Storage', 'Historical data'],
  },
  {
    title: '5. Monitoring Layer',
    items: ['Dashboard', 'Digital Twin', 'Device Health', 'Energy monitoring', 'Ocean Sensors', 'Alerts', 'AI Assistant'],
  },
];

const PROTOTYPE_PARTS = [
  'Titanium Frame',
  'Pressure Housing',
  'Acoustic Transducer',
  'Hydrophone Array',
  'AI Processing Unit',
  'SNC Unit',
  'Primary Power System',
  'Lithium Polymer / Li-ion Secondary Battery',
  'Syntactic Foam',
  'Local Storage',
  'Environmental Sensors',
  'Ballast / Recovery System',
  'Emergency Recovery System',
];

const SENSOR_SYSTEMS = [
  'Temperature Sensor',
  'Pressure / Depth Sensor',
  'Hydrophone Array',
  'IMU',
  'Power / Energy Monitoring',
  'Salinity / Conductivity Sensor',
  'Turbidity Sensor',
  'Dissolved Oxygen Sensor',
  'pH Sensor',
];

const WORKFLOW = [
  'Sensor Data',
  'Node Processing',
  'Acoustic Transmission',
  'PRISM Routing',
  'SNC Analysis',
  'Data Processing',
  'Storage',
  'Digital Twin',
  'AI Assistant',
  'Monitoring / Alerts / Recovery',
];

const RECOVERY_FLOW = [
  'System Failure',
  'Failure Detection',
  'Critical Alert',
  'Ballast Release',
  'Device Ascent',
  'Surface Recovery',
];

const FUTURE_DEV = [
  'Real underwater sensor integration',
  'More advanced AI-based failure prediction',
  'Adaptive acoustic routing',
  'Expanded underwater sensor networks',
  'Real-time ocean telemetry',
  'Advanced 3D digital twin',
  'Physical prototype integration',
  'More extensive oceanographic datasets',
  'Improved autonomous recovery',
];

const ABOUT_VIDEO_SRC = '/ABOUT%20THE%20%20PROJECT.mp4';

export function AboutProjectPage() {
  return (
    <div className="about-page">
      <div className="card">
        <div className="card-header"><span className="card-title">📖 About the Project</span></div>
        <h2 className="about-title">About the Project</h2>
        <p className="about-subtitle">Deep Ocean Underwater Acoustic Communication Digital Twin</p>
      </div>

      <div className="card about-video-card">
        <div className="card-header"><span className="card-title">Project Overview Video</span></div>
        <p className="about-lead">
          Watch the project overview to understand the complete underwater communication system,
          its intelligent processing architecture, physical prototype, digital twin, and
          monitoring workflow.
        </p>
        <video
          className="about-video"
          src={ABOUT_VIDEO_SRC}
          controls
          playsInline
          preload="metadata"
        />
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Project Objective</span></div>
        <p className="about-lead">
          The project focuses on an intelligent deep-ocean underwater acoustic communication
          system designed to support communication, monitoring, analytics, routing, and recovery
          for underwater nodes.
        </p>
        <p className="about-lead">
          Radio/Wi-Fi communication is highly limited underwater, so acoustic communication is
          used as the primary underwater communication method.
        </p>
        <p className="about-lead">The project combines:</p>
        <ul className="about-list">
          <li>Underwater acoustic communication</li>
          <li>AI-based intelligence</li>
          <li>Stochastic Network Calculus (SNC)</li>
          <li>PRISM routing</li>
          <li>Sensor monitoring</li>
          <li>Energy management</li>
          <li>Data analytics</li>
          <li>Emergency recovery</li>
          <li>Digital twin visualization</li>
        </ul>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Core System</span></div>
        <div className="about-flow" role="list" aria-label="Core system flow">
          {CORE_FLOW.map((step, j, arr) => (
            <div className="about-flow-step" key={step} role="listitem">
              <span className="about-flow-box">{step}</span>
              {j < arr.length - 1 && <span className="about-flow-arrow" aria-hidden="true">↓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">System Architecture</span></div>
        <div className="about-grid">
          {ARCH_LAYERS.map(layer => (
            <div className="about-layer-card" key={layer.title}>
              <div className="about-layer-title">{layer.title}</div>
              <ul className="about-list">
                {layer.items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Physical Prototype</span></div>
        <p className="about-lead">
          The physical prototype represents the underwater communication node and its supporting
          hardware architecture, acting as an underwater communication and monitoring node.
        </p>
        <div className="about-chip-row">
          {PROTOTYPE_PARTS.map(p => <span className="about-chip" key={p}>{p}</span>)}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Ocean Sensor System</span></div>
        <p className="about-lead">
          The project monitors nine environmental/sensing systems. The Acoustic Communication
          Transducer is communication hardware and is kept separate from the sensor count.
        </p>
        <ul className="about-list about-numbered">
          {SENSOR_SYSTEMS.map((s, i) => <li key={s}>{i + 1}. {s}</li>)}
        </ul>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Intelligent Underwater Communication</span></div>
        <ul className="about-list">
          <li>Underwater nodes communicate using acoustic signals.</li>
          <li>PRISM routing manages communication paths.</li>
          <li>SNC provides network-performance analysis.</li>
          <li>AI can interpret node, network, environmental, acoustic, and energy information.</li>
          <li>The system can monitor communication quality and node health.</li>
        </ul>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Power Management</span></div>
        <div className="about-flow" role="list" aria-label="Power management flow">
          <div className="about-flow-step" role="listitem">
            <span className="about-flow-box">Primary Power<span className="about-flow-sub">Normal system operation</span></span>
            <span className="about-flow-arrow" aria-hidden="true">↓</span>
          </div>
          <div className="about-flow-step" role="listitem">
            <span className="about-flow-box">Secondary Battery<span className="about-flow-sub">Backup operation during primary-power failure</span></span>
          </div>
        </div>
        <p className="about-lead">The secondary battery can support essential functions such as:</p>
        <ul className="about-list">
          <li>GPS/location support near the surface</li>
          <li>Higher-energy emergency acoustic transmission</li>
          <li>Emergency communication</li>
          <li>Recovery operations</li>
        </ul>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Emergency Recovery</span></div>
        <div className="about-flow" role="list" aria-label="Emergency recovery sequence">
          {RECOVERY_FLOW.map((step, j, arr) => (
            <div className="about-flow-step" key={step} role="listitem">
              <span className="about-flow-box">{step}</span>
              {j < arr.length - 1 && <span className="about-flow-arrow" aria-hidden="true">↓</span>}
            </div>
          ))}
        </div>
        <p className="about-lead">
          The dashboard represents this recovery process in the digital twin. Emergency alerts
          use the existing notification system.
        </p>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Digital Twin</span></div>
        <p className="about-lead">
          The dashboard acts as a digital representation of the underwater communication system. It represents:
        </p>
        <ul className="about-list">
          <li>Underwater nodes</li>
          <li>Device depth</li>
          <li>Sensor information</li>
          <li>Communication links</li>
          <li>Network metrics</li>
          <li>Energy status</li>
          <li>Environmental observations</li>
          <li>Alerts</li>
          <li>Recovery behavior</li>
          <li>Acoustic communication concepts</li>
        </ul>
        <p className="about-lead">
          The digital twin allows the system architecture and behavior to be visualized and
          monitored through the dashboard.
        </p>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Data &amp; Analytics</span></div>
        <ul className="about-list">
          <li><strong>Kafka</strong> → streaming / data ingestion within the project architecture</li>
          <li><strong>Spark</strong> → analytics within the project architecture</li>
          <li><strong>Scala</strong> → processing / transformation concepts</li>
          <li><strong>Cassandra</strong> → distributed data storage in the project architecture</li>
          <li><strong>Network Metrics</strong> → communication performance monitoring</li>
          <li><strong>Dashboard</strong> → visualization</li>
          <li><strong>AI Assistant</strong> → intelligent interpretation</li>
        </ul>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Project Workflow</span></div>
        <div className="about-flow" role="list" aria-label="Project workflow">
          {WORKFLOW.map((step, j, arr) => (
            <div className="about-flow-step" key={step} role="listitem">
              <span className="about-flow-box">{step}</span>
              {j < arr.length - 1 && <span className="about-flow-arrow" aria-hidden="true">↓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Research &amp; Engineering Focus</span></div>
        <ul className="about-list about-columns">
          {[
            'Reliable underwater communication',
            'Network performance analysis',
            'Intelligent routing',
            'Deep-ocean sensing',
            'Energy-aware operation',
            'Failure detection',
            'Emergency recovery',
            'Digital twin visualization',
            'Data-driven underwater monitoring',
          ].map(f => <li key={f}>{f}</li>)}
        </ul>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Future Development</span></div>
        <p className="about-lead">
          The following directions are planned future development, not currently completed features:
        </p>
        <ul className="about-list">
          {FUTURE_DEV.map(f => <li key={f}>{f}</li>)}
        </ul>
      </div>
    </div>
  );
}
