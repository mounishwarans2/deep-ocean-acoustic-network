import type { MenuOption } from '../../data/menuContent';
import type { SimulationState } from '../../hooks/useSimulation';
import { BackButton } from './BackButton';
import './AboutProjectView.css';

interface Props {
  option: MenuOption;
  state?: SimulationState | null;
}

const CORE_SYSTEMS = [
  { icon: '🌊', title: 'Underwater Environment', desc: 'Deep-ocean environment representation with depth, pressure, temperature and other environmental parameters.' },
  { icon: '📡', title: 'Acoustic Communication', desc: 'Underwater nodes communicate using acoustic signals instead of conventional radio-based communication.' },
  { icon: '🧠', title: 'Intelligent Processing', desc: 'AI-based analysis and system intelligence help interpret telemetry, network conditions and device states.' },
  { icon: '🔀', title: 'PRISM Routing', desc: 'Intelligent routing concept for selecting communication paths between underwater nodes based on network conditions.' },
  { icon: '📊', title: 'SNC Analytics', desc: 'Stochastic Network Calculus is used as an analytical framework for studying traffic, delay, service and network performance.' },
  { icon: '🖥️', title: 'Digital Twin', desc: 'The dashboard provides a digital representation of the underwater communication system, including devices, network state, environmental information and system alerts.' },
];

const ARCH_FLOW = [
  'UNDERWATER SENSORS',
  'ACOUSTIC COMMUNICATION',
  'SUBSEA NODES',
  'NETWORK / ROUTING',
  'DATA PROCESSING',
  'SNC + ANALYTICS',
  'DIGITAL TWIN',
  'DASHBOARD + AI ASSISTANT',
];

const MONITORS: { group: string; items: string[] }[] = [
  { group: 'Environment', items: ['Temperature', 'Pressure', 'Depth', 'Salinity', 'Dissolved Oxygen', 'pH', 'Turbidity'] },
  { group: 'Acoustic', items: ['Acoustic frequency', 'Signal strength', 'Hydrophone observations', 'Acoustic communication events'] },
  { group: 'Network', items: ['Packet loss', 'Latency', 'Throughput', 'Link quality', 'Node connectivity', 'Routing state'] },
  { group: 'Device', items: ['Energy status', 'Device health', 'Storage', 'Communication status', 'Failure events', 'Recovery state'] },
];

const TECHNOLOGY: { group: string; items: string[] }[] = [
  { group: 'Frontend', items: ['React', 'TypeScript', 'Vite', 'Three.js'] },
  { group: 'Communication', items: ['Underwater Acoustic Communication'] },
  { group: 'Analytics', items: ['Stochastic Network Calculus', 'Spark', 'Scala'] },
  { group: 'Streaming', items: ['Kafka'] },
  { group: 'Storage', items: ['Cassandra'] },
  { group: 'Intelligence', items: ['AI Assistant', 'Digital Twin'] },
  { group: 'Visualization', items: ['Interactive Dashboard', '3D Visualization', 'Environmental Charts', 'Network Monitoring'] },
];

const PROTOTYPE_COMPONENTS = [
  'Titanium Frame',
  'Pressure Housing',
  'Acoustic Transducer',
  'Hydrophone Array',
  'AI Processing Unit',
  'SNC Processing Unit',
  'Primary Power System',
  'Secondary Lithium-Polymer Battery',
  'Syntactic Foam',
  'Local Storage',
  'Ballast / Recovery System',
  'Environmental Sensors',
];

const WORKFLOW = [
  { num: '01', title: 'Sense', desc: 'Environmental and device parameters are collected.' },
  { num: '02', title: 'Communicate', desc: 'Underwater nodes exchange information using acoustic communication.' },
  { num: '03', title: 'Process', desc: 'Telemetry and network information are processed.' },
  { num: '04', title: 'Analyze', desc: 'SNC, network analytics and intelligent processing are applied.' },
  { num: '05', title: 'Visualize', desc: 'The digital twin presents the system state through the dashboard.' },
  { num: '06', title: 'Respond', desc: 'Alerts and recovery mechanisms respond to critical system conditions.' },
];

export function AboutProjectView({ option, state = null }: Props) {
  const devices = state?.devices ?? [];
  const links = state?.links ?? [];

  return (
    <div className="menu-content-view">
      <div className="menu-content-header">
        <div className="menu-content-title">
          <span className="menu-content-icon">{option.icon}</span>
          <div>
            <div className="menu-content-label">About the Project</div>
            <div className="menu-content-ctx">MARISLINK · Intelligent Underwater Acoustic Communication &amp; Monitoring System</div>
          </div>
        </div>
        <BackButton />
      </div>

      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">Project Introduction</span></div>
          <p className="mc-paragraph">
            Our project is an intelligent underwater communication and monitoring system designed for
            deep-ocean environments. It combines underwater acoustic communication, autonomous subsea
            nodes, environmental sensing, network analytics, intelligent routing and a digital-twin
            dashboard to visualize and monitor the system.
            {devices.length > 0 && (
              <> Currently tracking <strong>{devices.length} devices</strong> across <strong>{links.length} acoustic links</strong>.</>
            )}
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Project Objective</span></div>
          <p className="mc-paragraph">
            The objective is to provide a structured communication and monitoring architecture for
            underwater environments where conventional wireless communication methods are severely limited.
          </p>
          <p className="mc-paragraph">
            The system uses acoustic communication between underwater nodes while collecting
            environmental, acoustic, energy and network information. The digital twin represents
            these system states through an interactive dashboard.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Core System</span></div>
          <div className="ap-grid-3">
            {CORE_SYSTEMS.map(s => (
              <div className="ap-core-card" key={s.title}>
                <div className="ap-core-icon">{s.icon}</div>
                <div className="ap-core-title">{s.title}</div>
                <div className="ap-core-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">System Architecture</span></div>
          <div className="mc-flow">
            {ARCH_FLOW.map((step, j, arr) => (
              <div className="mc-flow-item" key={step}>
                <span className="mc-flow-box">{step}</span>
                {j < arr.length - 1 && <span className="mc-flow-arrow">↓</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">What the System Monitors</span></div>
          <div className="ap-grid-2">
            {MONITORS.map(m => (
              <div className="ap-monitor-group" key={m.group}>
                <div className="ap-monitor-title">{m.group}</div>
                <ul className="mc-bullets">
                  {m.items.map(i => <li key={i}>• {i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Project Technology</span></div>
          <div className="ap-tech-list">
            {TECHNOLOGY.map(t => (
              <div className="ap-tech-row" key={t.group}>
                <span className="ap-tech-group">{t.group}</span>
                <span className="ap-tech-items">{t.items.join('  •  ')}</span>
              </div>
            ))}
          </div>
          <p className="mc-paragraph ap-note">
            Spark, Scala, Kafka and Cassandra are part of the proposed data architecture;
            the dashboard presents them as architectural components.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Physical Prototype</span></div>
          <p className="mc-paragraph">
            The physical prototype represents the underwater communication node and its
            supporting hardware architecture.
          </p>
          <div className="ap-chip-row">
            {PROTOTYPE_COMPONENTS.map(c => <span className="ap-chip" key={c}>{c}</span>)}
          </div>
          <p className="mc-paragraph">
            The prototype is designed to combine communication, sensing, processing, energy
            management and emergency recovery within a deep-ocean node architecture.
          </p>
        </div>

        <div className="card ap-twin">
          <div className="card-header"><span className="card-title">Digital Twin Representation</span></div>
          <p className="mc-paragraph">
            The digital twin provides a software representation of the underwater system. It allows
            the project to visualize node locations, depth, communication links, sensor information,
            network metrics, energy state, alerts and recovery behavior without requiring every
            physical operation to be performed on the prototype.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Project Workflow</span></div>
          <div className="ap-workflow">
            {WORKFLOW.map(w => (
              <div className="ap-step" key={w.num}>
                <span className="ap-step-num">{w.num}</span>
                <div>
                  <div className="ap-step-title">{w.title}</div>
                  <div className="ap-step-desc">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
