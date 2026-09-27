import type { MenuOption } from '../../data/menuContent';
import { BackButton } from './BackButton';
import '../menu/Menu.css';
import './ResearchConceptView.css';

interface Props {
  option: MenuOption;
}

const CHALLENGES: { title: string; items: string[] }[] = [
  {
    title: 'Communication Challenge',
    items: ['Limited underwater communication options', 'Acoustic propagation delay', 'Signal attenuation', 'Variable link quality'],
  },
  {
    title: 'Network Challenge',
    items: ['Dynamic connectivity', 'Packet loss', 'Communication delay', 'Node failures'],
  },
  {
    title: 'System Challenge',
    items: ['Limited energy', 'Deep-ocean operating conditions', 'Recovery requirements', 'Long-duration autonomous operation'],
  },
];

const FOCUS: { num: string; title: string; desc: string; items?: string[] }[] = [
  {
    num: '01',
    title: 'Adaptive Acoustic Communication',
    desc: 'Study how underwater nodes can exchange information using acoustic communication while considering changing signal and link conditions.',
  },
  {
    num: '02',
    title: 'Autonomous Decision-Making',
    desc: 'Explore how underwater nodes can use available telemetry and network information to support autonomous communication and routing decisions.',
  },
  {
    num: '03',
    title: 'Failure-Tolerant Routing',
    desc: 'Investigate routing strategies that can respond when a node or communication link becomes unavailable.',
  },
  {
    num: '04',
    title: 'Network Performance',
    desc: 'Analyze:',
    items: ['Latency', 'Packet loss', 'Throughput', 'Signal strength', 'Link quality', 'Network load'],
  },
  {
    num: '05',
    title: 'Environmental Awareness',
    desc: 'Study how environmental information such as:',
    items: ['Temperature', 'Pressure', 'Depth', 'Salinity', 'Dissolved Oxygen', 'pH', 'Turbidity'],
  },
  {
    num: '06',
    title: 'Digital Twin Representation',
    desc: 'Use the digital twin to visualize:',
    items: ['Node state', 'Network connections', 'Environmental measurements', 'Communication behavior', 'Energy state', 'Failure and recovery events'],
  },
];

const QUESTIONS: { id: string; text: string }[] = [
  { id: 'RQ1', text: 'How can underwater acoustic nodes maintain communication when network conditions change?' },
  { id: 'RQ2', text: 'How can routing decisions adapt to changing link quality and node availability?' },
  { id: 'RQ3', text: 'How can network analytics identify communication degradation or potential failures?' },
  { id: 'RQ4', text: 'How can autonomous nodes respond to communication failures while maintaining network connectivity?' },
  { id: 'RQ5', text: 'How can a digital twin provide a useful representation of underwater communication, sensing and recovery behavior?' },
  { id: 'RQ6', text: 'How can network performance be analyzed using Stochastic Network Calculus and related analytics?' },
];

const RESEARCH_FLOW = [
  'UNDERWATER ENVIRONMENT',
  'ENVIRONMENTAL + ACOUSTIC SENSING',
  'AUTONOMOUS UNDERWATER NODES',
  'ACOUSTIC COMMUNICATION',
  'PRISM ROUTING',
  'SNC / NETWORK ANALYTICS',
  'FAILURE DETECTION',
  'ADAPTIVE RESPONSE',
  'DIGITAL TWIN',
  'RESEARCH OBSERVATION',
];

const COMPONENTS: { icon: string; title: string; desc: string }[] = [
  { icon: '🌊', title: 'Underwater Environment', desc: 'Deep-ocean conditions and environmental measurements.' },
  { icon: '📡', title: 'Acoustic Communication', desc: 'Communication between underwater nodes using acoustic signals.' },
  { icon: '🧠', title: 'AI Intelligence', desc: 'Context-aware analysis of available system information.' },
  { icon: '🔀', title: 'PRISM Routing', desc: 'Adaptive routing concept for underwater communication paths.' },
  { icon: '📐', title: 'SNC Analytics', desc: 'Stochastic Network Calculus-based analysis of traffic, delay and network behavior.' },
  { icon: '📊', title: 'Big Data Analytics', desc: 'Kafka, Spark, Scala and Cassandra architecture for streaming, processing and storing system information.' },
  { icon: '🔄', title: 'Failure Recovery', desc: 'Detection of node failures and controlled recovery behavior.' },
  { icon: '🖥️', title: 'Digital Twin', desc: 'Software representation of the physical underwater system.' },
];

const FAILURE_SEQUENCE = [
  'NORMAL OPERATION',
  'NODE / LINK DEGRADATION',
  'FAILURE DETECTION',
  'ROUTE EVALUATION',
  'ALTERNATIVE PATH',
  'NETWORK RECOVERY',
];

const WORKFLOW: { num: string; title: string; desc: string }[] = [
  { num: '01', title: 'OBSERVE', desc: 'Collect environmental, acoustic and network information.' },
  { num: '02', title: 'COMMUNICATE', desc: 'Exchange information between underwater nodes.' },
  { num: '03', title: 'ANALYZE', desc: 'Evaluate network and environmental conditions.' },
  { num: '04', title: 'DECIDE', desc: 'Determine appropriate communication/routing behavior.' },
  { num: '05', title: 'ADAPT', desc: 'Respond to changing network conditions.' },
  { num: '06', title: 'RECOVER', desc: 'Handle node or link failures.' },
  { num: '07', title: 'VISUALIZE', desc: 'Represent the system through the digital twin.' },
];

const CONTRIBUTIONS = [
  'Underwater communication modeling',
  'Adaptive routing research',
  'Network performance analysis',
  'Digital-twin-based system visualization',
];

const FUTURE: { num: string; text: string }[] = [
  { num: '01', text: 'Real underwater sensor integration' },
  { num: '02', text: 'Long-duration acoustic communication experiments' },
  { num: '03', text: 'Adaptive routing evaluation under changing channel conditions' },
  { num: '04', text: 'AI-assisted anomaly and failure detection' },
  { num: '05', text: 'Large-scale multi-node underwater network experiments' },
  { num: '06', text: 'Physical prototype + digital twin synchronization' },
  { num: '07', text: 'Expanded oceanographic datasets' },
  { num: '08', text: 'Experimental evaluation of SNC-based network performance' },
];

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="rc-list">
      {items.map(item => <li key={item}>• {item}</li>)}
    </ul>
  );
}

export function ResearchConceptView({ option }: Props) {
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
        <p className="rc-subtitle">
          Autonomous and failure-tolerant underwater acoustic communication for deep-ocean environments
        </p>
      </div>

      <div className="menu-content-body">
        <div className="card">
          <p className="rc-statement">
            This project explores a digital-twin-based architecture for underwater acoustic
            communication in which autonomous subsea nodes sense their environment, exchange
            information acoustically, analyze network conditions and adapt their communication
            behavior to maintain network connectivity and system resilience.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Research Motivation</span></div>
          <p className="rc-text">
            Underwater communication presents challenges that differ from terrestrial wireless
            networks. Acoustic communication is affected by propagation delay, signal
            attenuation, environmental conditions, limited bandwidth, packet loss and changing
            network connectivity.
          </p>
          <p className="rc-text">
            These conditions motivate research into communication architectures that can monitor
            network behavior, adapt routing decisions and continue operating when individual
            nodes or communication links experience failures.
          </p>
          <div className="rc-grid-3">
            {CHALLENGES.map(c => (
              <div className="rc-challenge" key={c.title}>
                <b>{c.title}</b>
                <Bullets items={c.items} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Research Focus</span></div>
          <div className="rc-grid-2">
            {FOCUS.map(f => (
              <div className="rc-focus" key={f.num}>
                <b>{f.num} — {f.title}</b>
                <p className="rc-text">{f.desc}</p>
                {f.items && <Bullets items={f.items} />}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Research Questions</span></div>
          <div className="rc-questions">
            {QUESTIONS.map(q => (
              <div className="rc-question" key={q.id}>
                <b>{q.id}</b>
                <span>{q.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Research Architecture</span></div>
          <div className="rc-flow" aria-label="Research architecture flow">
            {RESEARCH_FLOW.map((step, i, arr) => (
              <div className="rc-flow-step" key={step}>
                <div className="rc-flow-box">{step}</div>
                {i < arr.length - 1 && <div className="rc-flow-arrow">↓</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Core Research Components</span></div>
          <div className="rc-grid-2">
            {COMPONENTS.map(c => (
              <div className="rc-comp" key={c.title}>
                <span className="rc-comp-icon" aria-hidden="true">{c.icon}</span>
                <div>
                  <b>{c.title}</b>
                  <p className="rc-text">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card rc-highlight">
          <div className="card-header"><span className="card-title">Failure-Tolerant Communication</span></div>
          <p className="rc-text">
            When a communication node becomes unavailable, the system can identify the
            affected communication path and evaluate alternative communication routes. The
            digital twin represents the resulting network and device state so that the
            behavior can be observed and analyzed.
          </p>
          <div className="rc-flow" aria-label="Failure-tolerance sequence">
            {FAILURE_SEQUENCE.map((step, i, arr) => (
              <div className="rc-flow-step" key={step}>
                <div className="rc-flow-box">{step}</div>
                {i < arr.length - 1 && <div className="rc-flow-arrow">↓</div>}
              </div>
            ))}
          </div>
          <p className="rc-note">
            This concept connects to the dashboard's emergency ballast/recovery simulation,
            which represents node failure detection and controlled ascent behavior.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Research Data</span></div>
          <p className="rc-text">The research environment can work with:</p>
          <div className="rc-grid-2">
            <div>
              <div className="big-metric-label">Environmental Data</div>
              <Bullets items={['Temperature', 'Salinity', 'Dissolved Oxygen', 'Pressure / Depth']} />
            </div>
            <div>
              <div className="big-metric-label">Acoustic Data</div>
              <Bullets items={['Frequency', 'Signal Strength', 'Hydrophone observations', 'Communication events']} />
            </div>
            <div>
              <div className="big-metric-label">Network Data</div>
              <Bullets items={['Packet Loss', 'Latency', 'Throughput', 'Link Quality', 'Node Connectivity']} />
            </div>
            <div>
              <div className="big-metric-label">Device Data</div>
              <Bullets items={['Energy', 'Health', 'Storage', 'Communication State']} />
            </div>
          </div>
          <div className="big-metric-label" style={{ marginTop: 10 }}>Historical Ocean Observation Data</div>
          <p className="rc-text">
            The existing NOAA/NCEI WOD dataset already integrated into the project is used
            for historical temperature, salinity and dissolved oxygen observations.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Research Workflow</span></div>
          <div className="rc-workflow">
            {WORKFLOW.map(w => (
              <div className="rc-step" key={w.num}>
                <b>{w.num} — {w.title}</b>
                <span>{w.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Intended Research Contribution</span></div>
          <p className="rc-text">
            The project aims to provide an integrated experimental and simulation framework
            for studying underwater acoustic communication, adaptive routing, network
            analytics and failure-tolerant operation.
          </p>
          <p className="rc-text">
            The digital twin provides a visual environment in which communication,
            environmental and system behavior can be observed together.
          </p>
          <Bullets items={CONTRIBUTIONS} />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Future Research Directions</span></div>
          <div className="rc-grid-2">
            {FUTURE.map(f => (
              <div className="rc-future" key={f.num}>
                <b>{f.num}</b>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
