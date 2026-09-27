import type { MenuOption } from '../../data/menuContent';
import { BackButton } from './BackButton';
import '../menu/Menu.css';
import './ProjectStatusView.css';

interface Props {
  option: MenuOption;
}

type Badge = 'done' | 'concept' | 'dev' | 'future';

const OVERALL: { name: string; status: string; badge: Badge }[] = [
  { name: 'SOFTWARE PLATFORM', status: 'Implemented', badge: 'done' },
  { name: 'DIGITAL TWIN', status: 'Implemented', badge: 'done' },
  { name: 'DASHBOARD', status: 'Implemented', badge: 'done' },
  { name: 'AI MONITORING', status: 'Implemented', badge: 'done' },
  { name: 'PRISM ROUTING', status: 'Concept / Simulation', badge: 'concept' },
  { name: 'SNC ANALYTICS', status: 'Implemented in project analytics', badge: 'done' },
  { name: 'HYBRID POWER', status: 'Prototype Concept', badge: 'concept' },
  { name: 'EMERGENCY RECOVERY', status: 'Implemented as simulation behavior', badge: 'done' },
  { name: 'PHYSICAL PROTOTYPE', status: 'Development', badge: 'dev' },
];

const INTELLIGENT: { icon: string; title: string; desc: string }[] = [
  { icon: '🧠', title: 'AI Intelligence', desc: 'Context-aware monitoring and interpretation of available digital-twin information.' },
  { icon: '🔀', title: 'PRISM Routing', desc: 'Adaptive routing concept for selecting communication paths between underwater nodes.' },
  { icon: '📐', title: 'SNC Analytics', desc: 'Stochastic Network Calculus-based analysis for understanding traffic, delay, service and network behavior.' },
  { icon: '📡', title: 'Acoustic Communication', desc: 'Underwater communication architecture based on acoustic signals.' },
  { icon: '🔄', title: 'Failure Detection', desc: 'Monitoring of node and system conditions to identify critical events.' },
];

const POWER_FLOW = ['PRIMARY POWER', 'SYSTEM OPERATION', 'SECONDARY BATTERY', 'BACKUP / EMERGENCY OPERATION'];
const RECOVERY_FLOW = ['SYSTEM FAILURE', 'FAILURE DETECTION', 'EMERGENCY ALERT', 'BALLAST RELEASE', 'ASCENT', 'SURFACE RECOVERY'];
const DATA_ARCH = ['UNDERWATER DATA', 'TELEMETRY', 'ANALYTICS', 'VISUALIZATION'];

const TECHNOLOGIES: { title: string; desc: string }[] = [
  { title: 'Kafka Streaming', desc: 'Event-streaming architecture' },
  { title: 'Spark Analytics', desc: 'Distributed analytics architecture' },
  { title: 'Scala Processing', desc: 'Processing layer associated with Spark' },
  { title: 'Cassandra Storage', desc: 'Distributed storage architecture' },
  { title: 'Network Metrics', desc: 'Communication performance analysis' },
  { title: 'Data Pipeline', desc: 'End-to-end data movement from sensing to visualization' },
];

const PROTOTYPE_COMPONENTS = [
  'Titanium Frame',
  'Pressure Housing',
  'Acoustic Transducer',
  'Hydrophone Array',
  'AI Processing Unit',
  'SNC Processing Unit',
  'Primary Power',
  'Secondary Lithium-Polymer Battery',
  'Syntactic Foam',
  'Local Storage',
  'Ballast / Recovery System',
  'Environmental Sensors',
];

const PHASES: { num: string; title: string; items: { done: boolean; text: string }[] }[] = [
  {
    num: 'PHASE 01', title: 'FOUNDATION',
    items: [
      { done: true, text: 'Dashboard architecture' },
      { done: true, text: 'Simulation foundation' },
      { done: true, text: 'Core UI' },
    ],
  },
  {
    num: 'PHASE 02', title: 'DIGITAL TWIN',
    items: [
      { done: true, text: 'Device visualization' },
      { done: true, text: 'Network representation' },
      { done: true, text: 'Environmental views' },
    ],
  },
  {
    num: 'PHASE 03', title: 'INTELLIGENCE',
    items: [
      { done: true, text: 'AI monitoring' },
      { done: true, text: 'Context-aware assistant' },
      { done: true, text: 'Failure monitoring' },
    ],
  },
  {
    num: 'PHASE 04', title: 'ANALYTICS',
    items: [
      { done: true, text: 'SNC concepts' },
      { done: true, text: 'Network metrics' },
      { done: true, text: 'Data visualization' },
      { done: true, text: 'Big Data architecture' },
    ],
  },
  {
    num: 'PHASE 05', title: 'PHYSICAL PROTOTYPE',
    items: [
      { done: false, text: 'Hardware development' },
      { done: false, text: 'Sensor integration' },
      { done: false, text: 'Communication hardware' },
    ],
  },
  {
    num: 'PHASE 06', title: 'INTEGRATION',
    items: [
      { done: false, text: 'Physical prototype ↔ Digital twin' },
      { done: false, text: 'Real sensor telemetry' },
      { done: false, text: 'Experimental validation' },
    ],
  },
];

const BOUNDARIES: { title: string; desc: string }[] = [
  { title: 'Software / Simulation', desc: 'Digital-twin behavior is represented through the software simulation environment.' },
  { title: 'Physical Sensors', desc: 'Direct continuous physical sensor integration is part of future development unless specifically connected.' },
  { title: 'Distributed Backend', desc: 'Kafka, Spark, Scala and Cassandra represent the project\u2019s data architecture where backend services are not currently running.' },
  { title: 'Experimental Validation', desc: 'Further physical experiments are required to evaluate the communication and routing concepts under actual underwater conditions.' },
];

const NEXT_STEPS: { num: string; title: string; desc: string }[] = [
  { num: '01', title: 'Physical Sensor Integration', desc: 'Connect environmental and acoustic sensors.' },
  { num: '02', title: 'Acoustic Communication Testing', desc: 'Evaluate underwater acoustic communication hardware.' },
  { num: '03', title: 'Real-Time Telemetry', desc: 'Connect physical measurements to the digital twin.' },
  { num: '04', title: 'Adaptive Routing Evaluation', desc: 'Test routing behavior under changing network conditions.' },
  { num: '05', title: 'Physical Prototype Integration', desc: 'Synchronize prototype state with the digital twin.' },
  { num: '06', title: 'Experimental Network Testing', desc: 'Evaluate multi-node communication performance.' },
  { num: '07', title: 'AI-Assisted Analysis', desc: 'Expand anomaly and failure analysis using collected telemetry.' },
];

const AVAILABLE = [
  'Interactive dashboard',
  'Underwater digital twin',
  'Device and network monitoring',
  'Ocean sensor visualization',
  'Environmental data visualization',
  'Historical ocean observations',
  'AI monitoring assistant',
  'Failure/recovery simulation',
  'Analytics architecture',
  'Prototype architecture',
];

const IN_DEV = [
  'Physical sensor integration',
  'Underwater hardware communication',
  'Physical prototype integration',
  'Real-time telemetry synchronization',
  'Experimental validation',
  'Large-scale underwater network testing',
];

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="ps-list">
      {items.map(item => <li key={item}>• {item}</li>)}
    </ul>
  );
}

function VFlow({ steps }: { steps: string[] }) {
  return (
    <div className="ps-flow" aria-label="Process flow">
      {steps.map((step, i, arr) => (
        <div className="ps-flow-step" key={step}>
          <div className="ps-flow-box">{step}</div>
          {i < arr.length - 1 && <div className="ps-flow-arrow">↓</div>}
        </div>
      ))}
    </div>
  );
}

export function ProjectStatusView({ option }: Props) {
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
        <p className="ps-subtitle">Current implementation, system concepts and development roadmap</p>
      </div>

      <div className="menu-content-body">
        <div className="card">
          <p className="ps-intro">
            The project combines an interactive underwater communication digital twin, network
            monitoring, intelligent analysis and a physical prototype concept. The current
            implementation includes the software simulation and dashboard environment, while
            several hardware and backend components remain part of the development roadmap.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Overall Project Status</span></div>
          <div className="ps-overall">
            {OVERALL.map(o => (
              <div className="ps-status-row" key={o.name}>
                <b>{o.name}</b>
                <span className={`ps-badge ${o.badge}`}>{o.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Implemented Components</span></div>
          <div className="ps-grid-2">
            <div>
              <div className="big-metric-label">01 — Digital Twin Dashboard</div>
              <p className="ps-text">
                The dashboard provides a software representation of the underwater
                communication system, including devices, network information,
                environmental data, analytics and system events.
              </p>
            </div>
            <div>
              <div className="big-metric-label">02 — Underwater Simulation</div>
              <p className="ps-text">
                Interactive simulation of underwater nodes, communication links, depth
                and system behavior.
              </p>
            </div>
            <div>
              <div className="big-metric-label">03 — AI Monitoring</div>
              <p className="ps-text">
                The integrated AI assistant can interpret available dashboard context
                and provide explanations and system information.
              </p>
            </div>
            <div>
              <div className="big-metric-label">04 — Ocean Sensor Module</div>
              <p className="ps-text">
                Environmental and acoustic sensor categories are represented within
                the Ocean Sensors section.
              </p>
              <Bullets items={['Temperature', 'Pressure / Depth', 'Salinity', 'Dissolved Oxygen', 'pH', 'Turbidity', 'Hydrophone']} />
            </div>
            <div>
              <div className="big-metric-label">05 — Network Monitoring</div>
              <Bullets items={['Node status', 'Communication links', 'Packet behavior', 'Latency', 'Signal information', 'Network health']} />
            </div>
            <div>
              <div className="big-metric-label">06 — Data Visualization</div>
              <p className="ps-text">
                Environmental and network information can be visualized through charts
                and monitoring views.
              </p>
            </div>
            <div>
              <div className="big-metric-label">07 — Historical Ocean Data</div>
              <p className="ps-text">
                Existing NOAA/NCEI WOD CTD observations are integrated for
                environmental data visualization and historical analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Intelligent Communication Architecture</span></div>
          <div className="ps-grid-2">
            {INTELLIGENT.map(c => (
              <div className="ps-comp" key={c.title}>
                <span className="ps-comp-icon" aria-hidden="true">{c.icon}</span>
                <div>
                  <b>{c.title}</b>
                  <p className="ps-text">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="ps-note">
            Implemented simulation logic and research concepts are distinguished by the
            status labels used across this page.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Hybrid Power Concept</span></div>
          <p className="ps-text">
            The prototype architecture uses a primary power source together with a
            secondary lithium-polymer battery as a backup energy source.
          </p>
          <VFlow steps={POWER_FLOW} />
          <p className="ps-text">
            Under normal operation, the primary source supports the system. The
            secondary battery is intended to provide backup capability during
            primary-power failure conditions.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Emergency Recovery</span></div>
          <p className="ps-text">
            Critical node failure can trigger an emergency recovery sequence in the
            digital twin.
          </p>
          <VFlow steps={RECOVERY_FLOW} />
          <p className="ps-text">The dashboard can represent:</p>
          <Bullets items={['Critical node state', 'Failure alert', 'Recovery state', 'Ballast release', 'Ascending device', 'Surface recovery']} />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Data &amp; Analytics</span></div>
          <VFlow steps={DATA_ARCH} />
          <div className="ps-grid-2" style={{ marginTop: 10 }}>
            {TECHNOLOGIES.map(t => (
              <div key={t.title}>
                <div className="big-metric-label">{t.title}</div>
                <p className="ps-text">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="ps-note">
            Kafka, Spark, Scala and Cassandra are presented as the project's conceptual
            data architecture.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Physical Prototype Development</span></div>
          <div className="big-metric-label">Current Prototype Concept</div>
          <Bullets items={PROTOTYPE_COMPONENTS} />
          <p className="ps-text" style={{ marginTop: 8 }}>
            <strong>Status:</strong> Hardware development / prototype stage
          </p>
          <p className="ps-text">
            The physical prototype is being developed as the hardware representation
            of the underwater communication node modeled by the digital twin.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Development Progress</span></div>
          <div className="ps-phases">
            {PHASES.map(p => (
              <div className="ps-phase" key={p.num}>
                <b>{p.num} — {p.title}</b>
                {p.items.map(item => (
                  <div className="ps-phase-item" key={item.text}>
                    <span aria-hidden="true">{item.done ? '✓' : '→'}</span>
                    <span className={item.done ? '' : 'ps-future'}>{item.text}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Current Development Boundaries</span></div>
          <div className="ps-grid-2">
            {BOUNDARIES.map(b => (
              <div className="ps-bound" key={b.title}>
                <b>{b.title}</b>
                <p className="ps-text">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Next Development Steps</span></div>
          <div className="ps-grid-2">
            {NEXT_STEPS.map(s => (
              <div className="ps-step" key={s.num}>
                <b>{s.num} — {s.title}</b>
                <p className="ps-text">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Project Status Summary</span></div>
          <div className="ps-grid-2">
            <div>
              <div className="big-metric-label">Currently Available</div>
              <ul className="ps-list">
                {AVAILABLE.map(a => <li key={a}><span className="ps-check" aria-hidden="true">✓</span> {a}</li>)}
              </ul>
            </div>
            <div>
              <div className="big-metric-label">In Development</div>
              <ul className="ps-list">
                {IN_DEV.map(a => <li key={a}><span className="ps-arrow" aria-hidden="true">→</span> {a}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
