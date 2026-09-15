import { useEffect, useRef } from 'react';
import './ExplorePortal.css';

interface Props {
  onClose?: () => void;
  initialSection?: string | null;
}

export function ExplorePortal({ onClose, initialSection }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const targets = el.querySelectorAll('.xp-reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('xp-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!initialSection || !rootRef.current) return;
    const map: Record<string, string> = {
      vision: 'vision',
      'mission-arch': 'architecture',
      'system-mission': 'system-mission',
      milestones: 'milestones',
      future: 'future',
    };
    const id = map[initialSection] ?? initialSection;
    const target = document.getElementById(id);
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  }, [initialSection]);

  return (
    <div className="explore-portal" ref={rootRef}>
      {/* ═══════════ HEADER ═══════════ */}
      <section className="xp-header xp-reveal xp-visible">
        <div className="xp-header-bg" aria-hidden>
          <svg viewBox="0 0 800 260" preserveAspectRatio="none">
            <path d="M0 120 Q200 40 400 120 T800 120" fill="none" stroke="rgba(79,163,199,0.12)" strokeWidth="1.5" />
            <path d="M0 145 Q200 65 400 145 T800 145" fill="none" stroke="rgba(79,163,199,0.08)" strokeWidth="1" />
            <path d="M0 170 Q200 90 400 170 T800 170" fill="none" stroke="rgba(79,163,199,0.05)" strokeWidth="1" />
            <circle cx="120" cy="85" r="2" fill="rgba(79,163,199,0.25)" />
            <circle cx="340" cy="52" r="1.8" fill="rgba(79,163,199,0.2)" />
            <circle cx="580" cy="68" r="1.6" fill="rgba(79,163,199,0.18)" />
            <circle cx="680" cy="38" r="2" fill="rgba(79,163,199,0.22)" />
            <circle cx="260" cy="160" r="1.2" fill="rgba(255,255,255,0.12)" />
            <circle cx="700" cy="150" r="1.2" fill="rgba(255,255,255,0.1)" />
          </svg>
        </div>
        <div className="xp-header-content">
          <div className="xp-header-kicker">● Mission Intelligence & Research Overview</div>
          <h1>DEEP OCEAN ACOUSTIC COMMUNICATION</h1>
          <div className="xp-header-subtitle">Mission Intelligence & Research Overview</div>
          <p className="xp-header-support">
            An integrated underwater communication, distributed sensing and real-time analytics platform designed to investigate reliable
            data exchange across deep-ocean environments.
          </p>
          <div className="xp-status-row">
            <span className="xp-status-chip"><i className="xp-status-dot" /> SYSTEM STATUS — OPERATIONAL</span>
            <span className="xp-status-chip"><i className="xp-status-dot cyan" /> NETWORK MODEL — DISTRIBUTED</span>
            <span className="xp-status-chip"><i className="xp-status-dot yellow" /> COMMUNICATION — ACOUSTIC</span>
            <span className="xp-status-chip"><i className="xp-status-dot cyan" /> ANALYTICS — REAL-TIME</span>
            <span className="xp-status-chip"><i className="xp-status-dot" /> ENVIRONMENT — DEEP OCEAN</span>
          </div>
        </div>
      </section>

      {/* ═══════════ VISION & OBJECTIVE ═══════════ */}
      <section id="vision" className="xp-section xp-reveal">
        <div className="xp-label">Vision & Objective</div>
        <h2 className="xp-h2">Vision & Objective</h2>
        <div className="xp-sub">Building resilient communication infrastructure for the deep ocean</div>
        <p className="xp-p">
          To create a resilient deep-ocean communication and monitoring infrastructure capable of connecting distributed underwater nodes in
          environments where conventional wireless communication technologies cannot operate effectively.
        </p>

        <div className="xp-objective-main">
          <div className="xp-objective-main-label">Objective</div>
          <div className="xp-objective-text">
            The system investigates how underwater acoustic communication, distributed sensing, real-time analytics and intelligent monitoring
            can operate together as a unified ocean observation platform.
          </div>
        </div>

        <div className="xp-obj-grid">
          {[
            { icon: '📡', title: 'Reliable Communication', desc: 'Establish dependable communication between distributed submerged nodes using underwater acoustic links.' },
            { icon: '〰️', title: 'Acoustic Performance', desc: 'Measure latency, throughput, packet loss, signal performance and network stability.' },
            { icon: '🌊', title: 'Environmental Awareness', desc: 'Monitor environmental conditions surrounding underwater communication nodes.' },
            { icon: '🔋', title: 'Node Health', desc: 'Track energy availability, operational state and communication health of individual nodes.' },
            { icon: '📊', title: 'Real-Time Analytics', desc: 'Transform streaming telemetry into actionable network intelligence.' },
            { icon: '🛰️', title: 'Intelligent Monitoring', desc: 'Detect communication degradation, abnormal conditions and critical network states.' },
          ].map((c, i) => (
            <div key={c.title} className="xp-obj-card xp-reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <span className="xp-obj-icon">{c.icon}</span>
              <div className="xp-obj-title">{c.title}</div>
              <div className="xp-obj-desc">{c.desc}</div>
            </div>
          ))}
        </div>

        <div className="xp-principle xp-reveal">
          <strong>MISSION PRINCIPLE</strong>
          <span>Observe</span> <i className="dot" /> <span>Communicate</span> <i className="dot" /> <span>Analyze</span> <i className="dot" />
          <span>Detect</span> <i className="dot" /> <span>Respond</span>
        </div>
      </section>

      {/* ═══════════ MISSION ARCHITECTURE ═══════════ */}
      <section id="architecture" className="xp-section xp-section-alt xp-reveal">
        <div className="xp-label">Mission Architecture</div>
        <h2 className="xp-h2">Mission Architecture</h2>
        <div className="xp-sub">From underwater sensing to real-time mission intelligence</div>

        <div className="xp-arch-wrap">
          <div className="xp-arch-title">End-to-end data pipeline — acoustic to intelligence</div>
          <div className="xp-arch-line" aria-hidden />
          <div className="xp-arch-pipeline">
            {[
              { num: '01', name: 'Underwater Node Layer', desc: 'Distributed underwater devices collect communication, environmental, energy and operational telemetry.', icon: '🎛️' },
              { num: '02', name: 'Acoustic Communication', desc: 'Nodes exchange information through underwater acoustic signals, forming the communication network.', icon: '〰️' },
              { num: '03', name: 'Streaming — Kafka', desc: 'Kafka acts as the real-time streaming and buffering layer that transports continuous telemetry.', icon: '📨' },
              { num: '04', name: 'Analytics — Spark + Scala', desc: 'Spark Structured Streaming processes telemetry and calculates network performance and SNC analytics.', icon: '⚡' },
              { num: '05', name: 'Storage — Cassandra', desc: 'Cassandra provides scalable storage for observations, node info and historical analytics.', icon: '🗄️' },
              { num: '06', name: 'API Layer', desc: 'The backend exposes processed analytics and system status to the monitoring interface.', icon: '🔌' },
              { num: '07', name: 'Mission Dashboard', desc: 'The dashboard transforms processed data into operational intelligence and alerts.', icon: '🖥️' },
            ].map((n, idx) => (
              <div key={n.num} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                <div className="xp-arch-node">
                  <span className="xp-arch-icon">{n.icon}</span>
                  <div className="xp-arch-num">{n.num}</div>
                  <div className="xp-arch-name">{n.name}</div>
                  <div className="xp-arch-desc">{n.desc}</div>
                </div>
                {idx < 6 && (
                  <div className="xp-arch-arrow">
                    <span>→</span>
                    <i className="xp-arch-pulse" style={{ animationDelay: `${idx * 0.45}s` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 9, color: 'var(--xp-muted)', letterSpacing: 0.6 }}>
            Data pulse animation — Nodes → Kafka → Spark → Cassandra → API → Dashboard
          </div>
        </div>
      </section>

      {/* ═══════════ HOW DATA MOVES ═══════════ */}
      <section className="xp-section xp-reveal">
        <div className="xp-label">How the data moves</div>
        <h2 className="xp-h2" style={{ fontSize: 16 }}>How the data moves</h2>
        <div className="xp-how-grid">
          {[
            { num: '01', title: 'Collect', icon: '📡', desc: 'Underwater nodes generate telemetry.' },
            { num: '02', title: 'Stream', icon: '🌊', desc: 'Kafka transports continuous data.' },
            { num: '03', title: 'Process', icon: '⚙️', desc: 'Spark analyzes incoming streams.' },
            { num: '04', title: 'Store', icon: '🗄️', desc: 'Cassandra preserves processed information.' },
            { num: '05', title: 'Analyze', icon: '📈', desc: 'SNC metrics and indicators are calculated.' },
            { num: '06', title: 'Monitor', icon: '🖥️', desc: 'Operators observe network conditions through the dashboard.' },
          ].map((s) => (
            <div key={s.num} className="xp-how-step" title={`${s.title}: ${s.desc}`}>
              <div className="xp-how-icon">{s.icon}</div>
              <div className="xp-how-num">{s.num}</div>
              <div className="xp-how-title">{s.title}</div>
              <div className="xp-how-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ SYSTEM MISSION ═══════════ */}
      <section id="system-mission" className="xp-section xp-reveal">
        <div className="xp-label">System Mission</div>
        <h2 className="xp-h2">System Mission</h2>
        <div className="xp-sub">Deep-Ocean Distributed Acoustic Monitoring & Communication</div>

        <div className="xp-profile-grid">
          {[
            { k: 'Mission Type', v: 'Deep-Ocean Communication & Monitoring' },
            { k: 'Primary Domain', v: 'Underwater Communication • Distributed Sensing • Ocean Observation • Real-Time Analytics' },
            { k: 'Communication Method', v: 'Underwater Acoustic Signaling' },
            { k: 'Analytics Engine', v: 'Spark Structured Streaming + Scala' },
            { k: 'Streaming System', v: 'Apache Kafka' },
            { k: 'Data Platform', v: 'Apache Cassandra' },
            { k: 'Monitoring Interface', v: 'Interactive Research Dashboard' },
            { k: 'Deployment Environment', v: 'Deep-Ocean Distributed Network Simulation' },
          ].map((p) => (
            <div key={p.k} className="xp-profile-item">
              <span className="xp-profile-k">{p.k}</span>
              <span className="xp-profile-v">{p.v}</span>
            </div>
          ))}
        </div>

        <div className="xp-mission-purpose">
          <h4>Mission Purpose</h4>
          <p>
            The system models a distributed network of underwater nodes capable of communicating through acoustic signals while continuously
            monitoring communication performance, environmental conditions, energy availability and operational health.
          </p>
        </div>

        {/* Operations Timeline */}
        <div className="xp-label" style={{ marginTop: 6 }}>Mission Operations Timeline</div>
        <div className="xp-timeline">
          {[
            { n: '01', t: 'Deploy', d: 'Position distributed nodes within the underwater environment.', i: '⚓' },
            { n: '02', t: 'Initialize', d: 'Initialize node identity, energy and communication parameters.', i: '🔧' },
            { n: '03', t: 'Connect', d: 'Establish acoustic communication links.', i: '🔗' },
            { n: '04', t: 'Collect', d: 'Generate telemetry and environmental observations.', i: '📡' },
            { n: '05', t: 'Stream', d: 'Transport real-time telemetry through Kafka.', i: '🌊' },
            { n: '06', t: 'Process', d: 'Perform distributed analytics using Spark and Scala.', i: '⚡' },
            { n: '07', t: 'Store', d: 'Persist analytics and observations using Cassandra.', i: '🗄️' },
            { n: '08', t: 'Monitor', d: 'Expose network intelligence through the dashboard.', i: '🖥️' },
            { n: '09', t: 'Detect', d: 'Identify degradation, instability or critical conditions.', i: '🚨' },
            { n: '10', t: 'Respond', d: 'Support operator awareness and recovery decisions.', i: '🛟' },
          ].map((x, idx) => (
            <div key={x.n} className="xp-tl-item xp-reveal" style={{ transitionDelay: `${idx * 40}ms` }}>
              <span className="xp-tl-num">{x.n}</span>
              <div>
                <div className="xp-tl-title">
                  {x.t} <span className="xp-tl-icon">{x.i}</span>
                </div>
                <div className="xp-tl-desc">{x.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mission Telemetry */}
        <div className="xp-label" style={{ marginTop: 18 }}>Mission Telemetry</div>
        <div className="xp-telemetry-grid">
          {[
            { h: 'Acoustic', icon: '〰️', items: ['Signal performance', 'Latency', 'Packet loss', 'Throughput'] },
            { h: 'Network', icon: '🕸️', items: ['Arrival rate', 'Service rate', 'Traffic intensity', 'Backlog', 'Buffer utilization'] },
            { h: 'Energy', icon: '🔋', items: ['Node energy', 'Power state', 'Consumption indicators'] },
            { h: 'Environment', icon: '🌡️', items: ['Temperature', 'Pressure', 'Salinity', 'Water conditions'] },
            { h: 'Node Health', icon: '💚', items: ['Connectivity', 'Operational state', 'Communication status', 'Alerts'] },
          ].map((c) => (
            <div key={c.h} className="xp-tele-card">
              <div className="xp-tele-head">
                <span className="xp-tele-icon">{c.icon}</span> {c.h}
              </div>
              <ul className="xp-tele-list">
                {c.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ COMPLETED MILESTONES ═══════════ */}
      <section id="milestones" className="xp-section xp-reveal">
        <div className="xp-label">Completed Milestones</div>
        <h2 className="xp-h2">Completed Milestones</h2>
        <div className="xp-sub">Current engineering and analytics implementation</div>

        <div className="xp-milestone-progress">
          <div className="xp-milestone-chip"><b>Foundation</b> <span>COMPLETE</span></div>
          <div className="xp-milestone-chip"><b>Communication</b> <span>COMPLETE</span></div>
          <div className="xp-milestone-chip"><b>Analytics</b> <span>COMPLETE</span></div>
          <div className="xp-milestone-chip"><b>Big Data</b> <span>COMPLETE</span></div>
          <div className="xp-milestone-chip oper"><b>Dashboard</b> <span>OPERATIONAL</span></div>
        </div>

        <div className="xp-milestone-grid">
          <div className="xp-milestone-cat">
            <h4>🏗️ Foundation</h4>
            <ul>
              {[
                'React + TypeScript application architecture',
                'Three.js underwater visualization',
                'Deep-ocean environment',
                'Procedural underwater terrain',
                'Ocean and underwater effects',
                'Camera and interaction system',
              ].map((t) => (
                <li key={t}><span className="xp-check">✓</span> {t}</li>
              ))}
            </ul>
          </div>
          <div className="xp-milestone-cat">
            <h4>📡 Communication & Simulation</h4>
            <ul>
              {[
                'Distributed underwater nodes',
                'Acoustic communication visualization',
                'Node-to-node communication paths',
                'Signal propagation visualization',
                'Network simulation',
                'Node health monitoring',
              ].map((t) => (
                <li key={t}><span className="xp-check">✓</span> {t}</li>
              ))}
            </ul>
          </div>
          <div className="xp-milestone-cat">
            <h4>📊 SNC Analytics</h4>
            <ul>
              {[
                'Arrival-rate analysis',
                'Service-rate analysis',
                'Traffic-intensity calculation',
                'Average delay',
                'Maximum delay estimation',
                'Backlog estimation',
                'Buffer utilization',
                'Throughput monitoring',
                'Packet-loss analysis',
                'Network stability classification',
              ].map((t) => (
                <li key={t}><span className="xp-check">✓</span> {t}</li>
              ))}
            </ul>
          </div>
          <div className="xp-milestone-cat">
            <h4>🗄️ Big Data Infrastructure</h4>
            <ul>
              {[
                'Kafka streaming architecture',
                'Spark Structured Streaming',
                'Scala analytics processing',
                'Cassandra storage architecture',
                'Backend analytics API',
                'Big Data / Simulation Mode separation',
              ].map((t) => (
                <li key={t}><span className="xp-check">✓</span> {t}</li>
              ))}
            </ul>
          </div>
          <div className="xp-milestone-cat" style={{ gridColumn: 'span 2' }}>
            <h4>🖥️ Dashboard</h4>
            <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '5px' }}>
              {['Network Overview', 'Energy Analytics', 'Acoustic Analytics', 'Environmental Analytics', 'Node Health Table', 'Alerts Panel', 'SNC Analytics', 'Power Status'].map((t) => (
                <li key={t}><span className="xp-check">✓</span> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════ FUTURE DEVELOPMENT ═══════════ */}
      <section id="future" className="xp-section xp-reveal">
        <div className="xp-label">Future Development</div>
        <h2 className="xp-h2">Future Development</h2>
        <div className="xp-sub">From simulation platform to intelligent ocean observation infrastructure</div>

        <div className="xp-roadmap">
          {[
            {
              n: '01',
              phase: 'Phase 01 — Advanced Acoustic Modeling',
              desc: 'Increase physical realism by modeling environmental and propagation conditions that influence underwater acoustic communication.',
              caps: ['Realistic acoustic propagation', 'Multipath propagation', 'Doppler effects', 'Ambient noise modeling', 'Seafloor interaction', 'Temperature/salinity effects', 'Realistic signal attenuation'],
            },
            {
              n: '02',
              phase: 'Phase 02 — Intelligent Network Optimization',
              desc: 'Introduce intelligent decision-making to improve network reliability, efficiency and resilience.',
              caps: ['AI-based anomaly detection', 'Adaptive routing', 'Predictive packet-loss analysis', 'Automatic optimization', 'Predictive failure detection', 'Energy-aware routing'],
            },
            {
              n: '03',
              phase: 'Phase 03 — Expanded Ocean Observation',
              desc: 'Expand the platform from communication monitoring toward broader ocean observation.',
              caps: ['Temperature', 'Pressure', 'Salinity', 'Dissolved oxygen', 'Current velocity', 'Turbidity', 'Acoustic noise', 'Seafloor conditions'],
            },
            {
              n: '04',
              phase: 'Phase 04 — Autonomous Underwater Systems',
              desc: 'Extend the network from fixed simulated nodes toward autonomous underwater vehicles and mobile communication systems.',
              caps: ['AUVs', 'ROVs', 'Autonomous sensor nodes', 'Mobile acoustic relays', 'Surface gateways'],
            },
            {
              n: '05',
              phase: 'Phase 05 — Large-Scale Ocean Digital Twin',
              desc: 'Scale the architecture from a localized network into a distributed ocean observation and simulation environment combining acoustic communication, environmental sensing, Big Data analytics and AI.',
              caps: ['Global ocean coverage', 'Distributed nodes', 'Acoustic network', 'Big Data streaming', 'AI + Analytics', 'Digital twin synthesis'],
            },
          ].map((p) => (
            <div key={p.n} className="xp-phase">
              <div className="xp-phase-num"><b>{p.n}</b><span>{p.phase.split('—')[0]}</span></div>
              <div>
                <h4>{p.phase}</h4>
                <p>{p.desc}</p>
                <ul>
                  {p.caps.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="xp-long-term">
          <h4>Long-Term Research Direction — Ocean Digital Twin Pipeline</h4>
          <div className="xp-long-flow">
            <span>Global Ocean</span> <i>↓</i> <span>Distributed Nodes</span> <i>↓</i> <span>Acoustic Network</span> <i>↓</i>{' '}
            <span>Big Data Streaming</span> <i>↓</i> <span>AI + Analytics</span> <i>↓</i> <span>Ocean Digital Twin</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--xp-cyan)' }}>
            LONG-TERM RESEARCH DIRECTION
          </div>
        </div>
      </section>

      {/* ═══════════ RESEARCH CONTEXT ═══════════ */}
      <section className="xp-section xp-reveal">
        <div className="xp-label">Research Context</div>
        <h2 className="xp-h2">Research Context</h2>
        <div className="xp-sub">Positioning the project within modern ocean observation and underwater communication research</div>

        <div className="xp-research-grid">
          <a className="xp-research-card" href="https://www.nasa.gov" target="_blank" rel="noopener noreferrer">
            <h4>🛰️ NASA</h4>
            <p>Earth observation, remote sensing, planetary-scale environmental science and data-driven understanding of Earth systems.</p>
            <span className="xp-research-link">nasa.gov →</span>
          </a>
          <a className="xp-research-card" href="https://ioos.noaa.gov" target="_blank" rel="noopener noreferrer">
            <h4>🌊 NOAA / IOOS</h4>
            <p>Integrated ocean observing, environmental monitoring, real-time observations and data-driven ocean information.</p>
            <span className="xp-research-link">ioos.noaa.gov →</span>
          </a>
          <a className="xp-research-card" href="https://www.whoi.edu" target="_blank" rel="noopener noreferrer">
            <h4>🔬 WHOI</h4>
            <p>Ocean acoustics, underwater communication, autonomous systems and deep-ocean observatories.</p>
            <span className="xp-research-link">whoi.edu →</span>
          </a>
        </div>
        <div className="xp-disclaimer">
          These organizations are referenced only as examples of established scientific and ocean-observation research domains. This project is
          independently developed and is not affiliated with or endorsed by them.
        </div>
      </section>

      {/* ═══════════ WHY ACOUSTICS ═══════════ */}
      <section className="xp-section xp-reveal">
        <div className="xp-label">Why Underwater Acoustics?</div>
        <h2 className="xp-h2" style={{ fontSize: 17 }}>Why underwater acoustics?</h2>
        <div className="xp-why">
          <p>
            Radio-frequency communication is strongly constrained underwater because seawater significantly attenuates electromagnetic signals.
            Acoustic waves therefore provide an important communication mechanism for exchanging information across submerged environments.
          </p>
          <div className="xp-why-grid">
            <div className="xp-why-item">
              <h5>Low-Frequency Propagation</h5>
              <p>Can support longer underwater communication ranges.</p>
            </div>
            <div className="xp-why-item">
              <h5>Environmental Dependence</h5>
              <p>Performance varies with temperature, salinity, depth, noise and propagation conditions.</p>
            </div>
            <div className="xp-why-item">
              <h5>Research Challenge</h5>
              <p>Latency, bandwidth limitations, multipath effects and packet loss make underwater networking fundamentally different from terrestrial networks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL MISSION STATEMENT ═══════════ */}
      <section className="xp-final xp-reveal">
        <div className="xp-final-wave" aria-hidden />
        <div className="xp-label" style={{ justifyContent: 'center', marginBottom: 10 }}>Mission Objective</div>
        <h2>Connect the nodes. Understand the network. Monitor the ocean. Build toward intelligent underwater communication.</h2>
        <div className="xp-final-sub">Observe • Communicate • Analyze • Predict • Respond</div>
        {onClose && (
          <button className="xp-back-btn" onClick={onClose}>
            ← Back to Dashboard
          </button>
        )}
      </section>
    </div>
  );
}
