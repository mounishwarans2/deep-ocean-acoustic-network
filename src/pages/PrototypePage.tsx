import './PrototypePage.css';

const SUBSYSTEMS = [
  {
    title: 'Structural Protection',
    items: ['Titanium Frame', 'Pressure Housing', 'Syntactic Foam'],
    text: 'The structural assembly provides the physical framework and protection required by the underwater node architecture.',
  },
  {
    title: 'Communication & Sensing',
    items: ['Acoustic Transducer', 'Hydrophone Array', 'Environmental Sensors'],
    text: 'The communication hardware supports underwater acoustic transmission and reception, while the sensing layer provides environmental and acoustic information.',
  },
  {
    title: 'Intelligence & Analytics',
    items: ['AI Processing Unit', 'SNC Processing Unit', 'PRISM Routing'],
    text: 'These components represent the onboard intelligence and communication-analysis architecture used to process information and support adaptive network decisions.',
  },
  {
    title: 'Power & Storage',
    items: ['Primary Power System', 'Lithium-Polymer Battery', 'Local Storage'],
    text: 'The power architecture supports system operation and backup capability, while local storage provides onboard data retention.',
  },
  {
    title: 'Emergency Recovery',
    items: ['Ballast / Recovery System', 'Emergency Recovery Mechanism'],
    text: 'The recovery architecture represents the mechanism for responding to critical underwater system conditions and supporting controlled recovery.',
  },
];

const WORKFLOW = [
  'Environmental Sensing',
  'Data Collection',
  'AI / SNC Processing',
  'Acoustic Communication',
  'PRISM Routing',
  'Local Storage',
  'Emergency Monitoring',
  'Recovery',
];

export function PrototypePage() {
  return (
    <div className="prototype-page">
      <div className="card">
        <div className="card-header"><span className="card-title">🔬 Prototype</span></div>
        <h2 className="proto-title">Deep-Ocean Underwater Communication Node</h2>
        <p className="proto-subtitle">Physical prototype architecture and subsystem demonstration</p>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Prototype Architecture Demonstration</span></div>
        <p className="proto-lead">
          The prototype is designed as a compact underwater communication and intelligence node.
          Its architecture combines structural protection, acoustic communication, sensing, onboard
          processing, energy management, data storage, and emergency recovery within a single
          subsea system.
        </p>
        <p className="proto-lead">
          The following exploded-view demonstration presents the major hardware layers and their
          relationship within the prototype.
        </p>
      </div>

      <div className="card proto-video-card">
        <div className="card-header"><span className="card-title">Prototype Exploded-View Demonstration</span></div>
        <video
          className="proto-video"
          src="/exploded-view.mp4"
          controls
          playsInline
          preload="metadata"
        />
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Prototype Subsystems</span></div>
        <div className="proto-grid">
          {SUBSYSTEMS.map(s => (
            <div className="proto-sub-card" key={s.title}>
              <div className="proto-sub-title">{s.title}</div>
              <ul className="proto-sub-list">
                {s.items.map(i => <li key={i}>{i}</li>)}
              </ul>
              <p className="proto-sub-text">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">How the Prototype Works</span></div>
        <div className="proto-flow" role="list" aria-label="Prototype workflow">
          {WORKFLOW.map((step, j, arr) => (
            <div className="proto-flow-step" key={step} role="listitem">
              <span className="proto-flow-box">{step}</span>
              {j < arr.length - 1 && <span className="proto-flow-arrow" aria-hidden="true">↓</span>}
            </div>
          ))}
        </div>
        <p className="proto-lead">
          The prototype combines sensing, processing and acoustic communication into a single
          underwater node. Environmental and communication information can be processed locally,
          while network intelligence supports communication decisions. The digital twin represents
          these hardware and system functions within the dashboard.
        </p>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Prototype &amp; Digital Twin</span></div>
        <p className="proto-lead">
          The physical prototype represents the hardware side of the system, while the digital
          twin provides its software representation. Together, they provide a framework for
          visualizing the underwater node, monitoring its operational state, studying
          communication behavior and evaluating future integration with physical sensors and
          acoustic hardware.
        </p>
      </div>
    </div>
  );
}
