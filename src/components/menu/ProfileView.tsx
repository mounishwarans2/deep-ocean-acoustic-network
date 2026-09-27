import type { MenuOption } from '../../data/menuContent';
import { BackButton } from './BackButton';
import '../menu/Menu.css';
import './ProfileView.css';

interface Props {
  option: MenuOption;
}

const ACCESS_CAPS: { icon: string; title: string; desc: string }[] = [
  { icon: '🌊', title: 'Ocean Monitoring', desc: 'View environmental and depth information.' },
  { icon: '📡', title: 'Communication Monitoring', desc: 'Observe underwater communication and network connectivity.' },
  { icon: '📊', title: 'Data & Analytics', desc: 'Access network metrics, environmental visualization and data-analysis modules.' },
  { icon: '🧠', title: 'AI Intelligence', desc: 'Interact with the integrated underwater intelligence assistant.' },
  { icon: '⚠️', title: 'Alert Monitoring', desc: 'View system warnings, failures and emergency events.' },
  { icon: '🔄', title: 'Recovery Monitoring', desc: 'Observe simulated emergency recovery and device state changes.' },
];

const CORE_ACTIVITIES = [
  'Monitor underwater nodes',
  'Observe environmental conditions',
  'Analyze communication performance',
  'Inspect network topology',
  'Monitor device health',
  'Review alerts',
  'Observe recovery behavior',
  'Analyze historical ocean observations',
];

const RESPONSIBILITIES: { num: string; title: string; desc: string }[] = [
  { num: '01', title: 'Monitor', desc: 'Observe the state of underwater nodes and communication links.' },
  { num: '02', title: 'Analyze', desc: 'Inspect environmental, acoustic and network information.' },
  { num: '03', title: 'Investigate', desc: 'Examine alerts, failures and changes in system behavior.' },
  { num: '04', title: 'Evaluate', desc: 'Review communication and network performance.' },
  { num: '05', title: 'Observe Recovery', desc: 'Monitor emergency recovery behavior represented by the digital twin.' },
  { num: '06', title: 'Research', desc: 'Use the system as an experimental environment for studying underwater communication and network resilience.' },
];

const MODULES: { title: string; desc: string }[] = [
  { title: 'Ocean Sensors', desc: 'Environmental and acoustic sensor information.' },
  { title: 'Simulation', desc: 'Underwater digital-twin simulation.' },
  { title: 'Network Monitoring', desc: 'Node and communication-link status.' },
  { title: 'Data Visualization', desc: 'Environmental and network charts.' },
  { title: 'Historical Data', desc: 'Oceanographic observation records.' },
  { title: 'Data & Analytics', desc: 'Big-data architecture and network analytics.' },
  { title: 'System Alerts', desc: 'Warnings and critical events.' },
  { title: 'System Architecture', desc: 'Layered project architecture.' },
  { title: 'Research Concept', desc: 'Research objectives and experimental concepts.' },
  { title: 'Project Status', desc: 'Implementation and development status.' },
  { title: 'About the Project', desc: 'Project overview and system description.' },
];

const WORKSPACE: { step: string; detail: string }[] = [
  { step: 'MONITOR', detail: 'Nodes • Sensors • Network' },
  { step: 'ANALYZE', detail: 'SNC • Network Metrics • Environmental Data' },
  { step: 'INVESTIGATE', detail: 'Alerts • Failures • Communication Events' },
  { step: 'RESPOND', detail: 'Recovery • Notifications • System Actions' },
  { step: 'REVIEW', detail: 'Historical Data • Trends • Research Analysis' },
];

const ACCESS_STATUS: { name: string; status: string }[] = [
  { name: 'Access Status', status: 'Operator Access' },
  { name: 'Mission Status', status: 'Dashboard Available' },
  { name: 'AI Assistant', status: 'Available' },
  { name: 'Monitoring', status: 'Available' },
  { name: 'Simulation', status: 'Available' },
  { name: 'Analytics', status: 'Available' },
  { name: 'Alerts', status: 'Available' },
];

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="pf-list">
      {items.map(item => <li key={item}>• {item}</li>)}
    </ul>
  );
}

export function ProfileView({ option }: Props) {
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
        <p className="pf-subtitle">Operator profile and mission access</p>
      </div>

      <div className="menu-content-body">
        <div className="card pf-hero">
          <div className="pf-hero-top">
            <span className="pf-avatar" aria-hidden="true">👤</span>
            <div>
              <div className="pf-role">Research / Operator</div>
              <span className="pf-active">ACTIVE</span>
            </div>
          </div>
          <div className="pf-facts">
            <div className="pf-fact"><span>Mission</span><strong>Underwater Intelligence Dashboard</strong></div>
            <div className="pf-fact"><span>Access</span><strong>Operator Access</strong></div>
          </div>
          <p className="pf-text">
            Operator access provides the interface required to monitor the underwater
            communication digital twin, inspect system status, analyze network information
            and observe mission events.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Operator Access</span></div>
          <div className="pf-grid-2">
            {ACCESS_CAPS.map(c => (
              <div className="pf-cap" key={c.title}>
                <span className="pf-cap-icon" aria-hidden="true">{c.icon}</span>
                <div>
                  <b>{c.title}</b>
                  <p className="pf-text">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Mission Context</span></div>
          <div className="pf-facts">
            <div className="pf-fact"><span>Mission</span><strong>Underwater Intelligence Dashboard</strong></div>
            <div className="pf-fact"><span>Mission Type</span><strong>Deep-Ocean Communication &amp; Monitoring</strong></div>
            <div className="pf-fact"><span>System</span><strong>Underwater Acoustic Communication Digital Twin</strong></div>
          </div>
          <div className="big-metric-label" style={{ marginTop: 10 }}>Primary Objective</div>
          <p className="pf-text">
            Monitor and analyze an underwater communication network through an integrated
            digital-twin environment.
          </p>
          <div className="big-metric-label" style={{ marginTop: 10 }}>Core Activities</div>
          <Bullets items={CORE_ACTIVITIES} />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Role: Research / Operator</span></div>
          <p className="pf-text">
            The Research / Operator role provides access to the monitoring, analysis and
            visualization capabilities of the project.
          </p>
          <div className="pf-grid-2" style={{ marginTop: 8 }}>
            {RESPONSIBILITIES.map(r => (
              <div className="pf-resp" key={r.num}>
                <b>{r.num} — {r.title}</b>
                <p className="pf-text">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Available Modules</span></div>
          <div className="pf-grid-3">
            {MODULES.map(m => (
              <div className="pf-module" key={m.title}>
                <b>{m.title}</b>
                <span>{m.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Operator Workspace</span></div>
          <div className="pf-workflow" aria-label="Operator workflow">
            {WORKSPACE.map((w, i, arr) => (
              <div className="pf-wstep" key={w.step}>
                <div className="pf-wbox">
                  <b>{w.step}</b>
                  <span>{w.detail}</span>
                </div>
                {i < arr.length - 1 && <div className="pf-warrow">↓</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Access Status</span></div>
          <div className="pf-status">
            {ACCESS_STATUS.map(s => (
              <div className="pf-status-row" key={s.name}>
                <span>{s.name}</span>
                <strong>{s.status}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Profile</span></div>
          <div className="pf-facts">
            <div className="pf-fact"><span>Role</span><strong>Research / Operator</strong></div>
            <div className="pf-fact"><span>Mission</span><strong>Underwater Intelligence Dashboard</strong></div>
            <div className="pf-fact"><span>System</span><strong>Deep-Ocean Underwater Acoustic Communication Digital Twin</strong></div>
            <div className="pf-fact"><span>Primary Function</span><strong>Monitoring • Analysis • Research</strong></div>
            <div className="pf-fact"><span>Access Scope</span><strong>Simulation • Sensors • Network • Analytics • Alerts</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
