import { useState } from 'react';
import PrototypeViewer from '../components/prototype3d/PrototypeViewer';
import './AboutDevice.css';

const AI_STEPS = [
  { icon: '📡', label: 'MONITOR', desc: 'Continuously observes node condition, battery, signal quality, packet loss, latency, throughput, nearby links, route health and energy consumption.' },
  { icon: '🧠', label: 'ANALYZE', desc: 'Evaluates link health, node availability, route suitability, packet loss trends, latency thresholds, energy usage and failure conditions.' },
  { icon: '⚡', label: 'DECIDE', desc: 'Selects whether to continue current route, switch PRISM route, reroute communication, resend data, reduce power or enter emergency mode.' },
  { icon: '🔧', label: 'ACT', desc: 'Executes the chosen action: route change, data resend, node avoidance, alternative link usage, power reduction or emergency recovery activation.' },
  { icon: '🔄', label: 'UPDATE', desc: 'Returns to monitoring the updated network state. The cycle repeats continuously throughout the mission.' },
];

const PRISM_FLOW = ['CHECK LINK', 'CHECK NODE', 'CHECK SIGNAL', 'CHECK ENERGY', 'CALCULATE ROUTE COST', 'SELECT ROUTE'];
const FAIL_FLOW = ['DETECT FAILURE', 'SEARCH ALTERNATIVE PATH', 'REROUTE', 'RESEND DATA'];

const SNC_METRICS = [
  'Arrival Rate', 'Service Rate', 'Traffic Intensity', 'Average Delay',
  'Maximum Delay', 'Backlog', 'Buffer Utilization', 'Throughput',
  'Packet Loss', 'Network Stability',
];

const EMERGENCY_SEQ = [
  { icon: '⚠', title: 'CRITICAL FAILURE DETECTED', desc: 'Severe failure is detected in the device or primary power system.', stage: 'failure' },
  { icon: '🔋', title: 'ENTER EMERGENCY MODE', desc: 'The device immediately switches from normal operation to emergency mode.', stage: 'failure' },
  { icon: '⚡', title: 'PRESERVE REMAINING ENERGY', desc: 'Non-essential systems are disabled to preserve available backup power.', stage: 'recovery' },
  { icon: '🔓', title: 'ACTIVATE BALLAST RELEASE', desc: 'The recovery mechanism is activated.', stage: 'recovery' },
  { icon: '⚓', title: 'EXTERNAL WEIGHT RELEASED', desc: 'A release pin disconnects the external ballast weight.', stage: 'recovery' },
  { icon: '↑', title: 'BUOYANT DEVICE ASCENDS', desc: 'The device becomes positively buoyant and rises toward the surface using syntactic foam.', stage: 'recovery' },
  { icon: '🌊', title: 'REACH SURFACE', desc: 'The device reaches the ocean surface and stabilizes for recovery.', stage: 'success' },
  { icon: '📡', title: 'GPS / RECOVERY BEACON', desc: 'GPS and recovery tracking systems activate after surfacing so the recovery team can locate the device.', stage: 'success' },
];

const HOTSPOTS = [
  'PROGRAMMING INTELLIGENCE', 'PRISM / SNC Processing', 'Processing Unit',
  'Communication Module', 'Primary Power System', 'Secondary Battery',
  'Local Storage', 'Syntactic Foam', 'External Ballast',
];

export default function AboutDevice() {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <div className="about-device">
      <PrototypeViewer isOpen={viewerOpen} onClose={() => setViewerOpen(false)} />

      {/* ── 1. Hero ── */}
      <div className="about-hero">
        <h2>UNDERWATER INTELLIGENT COMMUNICATION DEVICE</h2>
        <p className="about-subtitle">
          An autonomous deep-ocean communication prototype combining programming intelligence, adaptive PRISM routing, SNC analytics, long-duration power, local data storage, and emergency recovery mechanisms.
        </p>
        <div className="about-flow" style={{ marginTop: 16 }}>
          <img
            src="/system-flow.png"
            alt="System Flow — Sensors to Land Data Center"
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
        </div>
      </div>

      {/* ── 2. AI Decision Intelligence ── */}
      <div className="about-section">
        <h3>PROGRAMMING DECISION INTELLIGENCE</h3>
        <h4>How PROGRAMMING Works Inside Each Underwater Device</h4>
        <p>The PROGRAMMING inside each node continuously cycles through five phases to maintain optimal communication and survival.</p>
        <div className="about-ai-cycle">
          {AI_STEPS.map((s, i) => (
            <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div className="about-ai-step">
                <span className="step-icon">{s.icon}</span>
                <span className="step-label">{s.label}</span>
              </div>
              {i < AI_STEPS.length - 1 && <span className="about-ai-arrow">→</span>}
            </span>
          ))}
        </div>
        <div className="about-two-col" style={{ marginTop: 16 }}>
          <div className="about-arch-card" key={AI_STEPS[0].label}>
            <h5>{AI_STEPS[0].label}</h5>
            <p>{AI_STEPS[0].desc}</p>
            <div style={{ width: '100%', height: 420, background: '#0a0f14', borderRadius: 6, marginTop: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img
                src="/monitor.jpg"
                alt="Programming Monitoring System"
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
              />
            </div>
          </div>
          {AI_STEPS.slice(1, 2).map(s => (
            <div className="about-arch-card" key={s.label}>
              <h5>{s.label}</h5>
              <p>{s.desc}</p>
              {s.label === 'ANALYZE' && (
                <div style={{ width: '100%', height: 420, background: '#0a0f14', borderRadius: 6, marginTop: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img
                    src="/ANALYZE.jpg"
                    alt="Programming Analyze"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {/* DECIDE — ACT side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div className="about-arch-card">
            <h5>DECIDE</h5>
            <p>{AI_STEPS[2].desc}</p>
            <div style={{ width: '100%', height: 420, background: '#0a0f14', borderRadius: 6, marginTop: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img
                src="/DECIDE.jpg"
                alt="Programming Decide"
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
              />
            </div>
          </div>
          <div className="about-arch-card">
            <h5>ACT</h5>
            <p>{AI_STEPS[3].desc}</p>
            <div style={{ width: '100%', height: 420, background: '#0a0f14', borderRadius: 6, marginTop: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img
                src="/ACT.jpg"
                alt="Programming Act"
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
              />
            </div>
          </div>
        </div>
        {/* UPDATE centered below */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <div className="about-arch-card" style={{ width: 'calc(50% - 6px)' }}>
            <h5>UPDATE</h5>
            <p>{AI_STEPS[4].desc}</p>
            <div style={{ width: '100%', height: 420, background: '#0a0f14', borderRadius: 6, marginTop: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img
                src="/UPDATE.jpg"
                alt="Programming Update"
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. PRISM Routing ── */}
      <div className="about-section">
        <h3>PRISM ADAPTIVE ROUTING SYSTEM</h3>
        <p>
          PRISM is the routing intelligence used by the deployed underwater network. The communication route is not permanently fixed. After deployment, the PROGRAMMING in each node evaluates available communication links and uses PRISM routing logic to select and maintain suitable data paths.
        </p>
        <div style={{
          margin: '16px 0',
          padding: '20px 24px',
          background: 'rgba(0, 229, 255, 0.05)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: 8,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 12, textDecoration: 'underline', textUnderlineOffset: 4 }}>
            PRISM stands for:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {[
              { letter: 'P', word: 'Predictive' },
              { letter: 'R', word: 'Reliability-aware' },
              { letter: 'I', word: 'Intelligent' },
              { letter: 'S', word: 'Stochastic' },
              { letter: 'M', word: 'Multipath' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                {item.letter && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 6,
                    background: 'rgba(0, 229, 255, 0.12)', border: '1px solid rgba(0, 229, 255, 0.3)',
                    color: 'var(--accent-cyan)', fontWeight: 800, fontSize: 14,
                  }}>
                    {item.letter}
                  </span>
                )}
                <span style={{ color: 'var(--text-primary)', fontWeight: item.letter ? 400 : 600 }}>
                  {item.word}
                </span>
              </div>
            ))}
          </div>
        </div>
        <h4>Normal Data Path</h4>
        <div className="about-flow-visual">
          {['Sensor', 'Sub-Node', 'Main Node', 'Surface Receiver', 'Land Data Center'].map((n, i) => (
            <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="about-flow-step">{n}</span>
              {i < 4 && <span className="about-flow-connector">→</span>}
            </span>
          ))}
        </div>
        <div className="about-two-col">
          <div className="about-arch-card">
            <h5>Star Communication</h5>
            <p>Sensor nodes communicate through their assigned sub-node. Sub-nodes communicate toward the main node.</p>
            <div style={{ width: '100%', height: 420, background: '#0a0f14', borderRadius: 6, marginTop: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img
                src="/STAR.jpg"
                alt="Star Communication Network"
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
              />
            </div>
          </div>
          <div className="about-arch-card">
            <h5>Mesh Communication</h5>
            <p>Nearby sensor nodes may have additional connections. Sub-nodes may communicate with nearby sub-nodes, providing alternative paths during communication problems.</p>
            <div style={{ width: '100%', height: 420, background: '#0a0f14', borderRadius: 6, marginTop: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img
                src="/MESH TOPOLOGY.jpg"
                alt="Mesh Communication Network"
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
              />
            </div>
          </div>
        </div>
        <h4 style={{ marginTop: 16 }}>PRISM Decision Process</h4>
        <div className="about-flow-visual">
          {PRISM_FLOW.map((s, i) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="about-flow-step active">{s}</span>
              {i < PRISM_FLOW.length - 1 && <span className="about-flow-connector">→</span>}
            </span>
          ))}
        </div>
        <h4>If Route Fails</h4>
        <div className="about-flow-visual">
          {FAIL_FLOW.map((s, i) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="about-flow-step" style={{ borderColor: 'rgba(199,92,92,0.3)', color: 'var(--accent-red)' }}>{s}</span>
              {i < FAIL_FLOW.length - 1 && <span className="about-flow-connector">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── 4. SNC ── */}
      <div className="about-section">
        <h3>SNC — SYSTEM NETWORK CONGESTION ANALYSIS</h3>
        <p>
          SNC continuously evaluates the operating condition of the communication network. Its main goal is to monitor whether the underwater communication network is operating efficiently, approaching congestion, or becoming unstable.
        </p>
        <h4>Monitored Metrics</h4>
        <div className="about-metric-grid">
          {SNC_METRICS.map(m => (
            <div className="about-metric" key={m}><strong>{m}</strong></div>
          ))}
        </div>
        <h4>Stability States</h4>
        <div className="about-states">
          <div className="about-state stable">STABLE — Network operating normally</div>
          <div className="about-state warning">WARNING — Traffic/delay approaching unsafe level</div>
          <div className="about-state critical">CRITICAL — Routing or congestion intervention required</div>
        </div>
        <div className="about-flow-visual" style={{ marginTop: 12 }}>
          {['Network Traffic', 'SNC Analysis', 'Stability Evaluation', 'PROGRAMMING/PRISM Response'].map((n, i) => (
            <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="about-flow-step">{n}</span>
              {i < 3 && <span className="about-flow-connector">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── 5. Housing ── */}
      <div className="about-section">
        <h3>DEEP-OCEAN PRESSURE-RESISTANT HOUSING</h3>
        <p>
          The prototype concept proposes a titanium-alloy pressure housing designed for extreme deep-ocean environments. Final depth capability must be validated through pressure-vessel analysis, geometry, material properties and engineering testing.
        </p>
        <div className="about-cutaway">
          <div className="about-cutaway-visual">
            <div className="layer" style={{ width: 220, height: 220 }}>Outer Titanium Housing</div>
            <div className="layer" style={{ width: 260, height: 260, padding: 0, overflow: 'hidden', borderRadius: 0 }}>
              <img
                src="/internal-electronics.png"
                alt="Internal Electronics"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
          <div className="about-cutaway-labels">
            {[
              { color: '#4FA3C7', text: 'Outer Titanium Alloy Housing — Corrosion resistance & structural strength' },
              { color: '#3E9B76', text: 'Internal Electronics Bay — PROGRAMMING, processing, communication modules' },
              { color: '#D9A441', text: 'Energy System — Primary micro nuclear + secondary LiPo battery' },
              { color: '#C75C5C', text: 'Acoustic Communication Module — Underwater signal transmission' },
              { color: '#8FA8B8', text: 'Syntactic Foam — Buoyancy and pressure support' },
            ].map(l => (
              <div className="about-cutaway-label" key={l.text}>
                <div className="dot" style={{ background: l.color }} />
                {l.text}
              </div>
            ))}
          </div>
          <div className="about-cutaway-image">
            <img
              src="/titanium alloy.jpg"
              alt="Deep-Ocean Pressure-Resistant Housing"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
            />
          </div>
        </div>
      </div>

      {/* ── 6. Primary Power ── */}
      <div className="about-section">
        <h3>PRIMARY POWER SOURCE — MICRO NUCLEAR BATTERY</h3>
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 12,
          marginBottom: 12,
        }}>
          <img
            src="/NUCLEAR.jpg"
            alt="Micro Nuclear Battery"
            style={{
              flex: 1,
              height: 180,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
          <img
            src="/nuclear battery 2.png"
            alt="BetaVoltaic Source"
            style={{
              flex: 1,
              height: 180,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
          <img
            src="/nuclear battery 3.jpg"
            alt="Betavolt Battery"
            style={{
              flex: 1,
              height: 180,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
        </div>
        <p>
          The primary power source is intended to provide long-duration baseline energy for autonomous operation. Deep-ocean devices may remain deployed for long periods where battery replacement is difficult, recharging access is unavailable, maintenance is expensive, and human intervention is limited.
        </p>
        <h4>Intended Role</h4>
        <div className="about-metric-grid">
          {['Continuous baseline power', 'Long-duration autonomous operation', 'Low-power processing support', 'PROGRAMMING monitoring', 'System monitoring', 'Secondary battery recovery support'].map(m => (
            <div className="about-metric" key={m}><strong>{m}</strong></div>
          ))}
        </div>
        <div className="about-two-col" style={{ marginTop: 12 }}>
          <div className="about-arch-card">
            <h5>Primary Power = Continuous Baseline Power</h5>
            <p>Provides uninterrupted low-level energy for monitoring, processing and PROGRAMMING operations throughout the mission.</p>
          </div>
          <div className="about-arch-card">
            <h5>Long Operational Life</h5>
            <p>Designed to support autonomous operation for extended periods, reducing the need for frequent battery replacement or human maintenance.</p>
          </div>
        </div>
      </div>

      {/* ── 7. Secondary Power ── */}
      <div className="about-section">
        <h3>SECONDARY POWER SYSTEM — LITHIUM POLYMER BATTERY</h3>
        <p>
          Acoustic communication events can require significantly higher short-duration power than normal monitoring and processing operations. The secondary LiPo battery supports acoustic signal transmission, high-power communication bursts, temporary peak loads and short-duration intensive operations.
        </p>
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 16,
          marginBottom: 12,
        }}>
          <img
            src="/lipo-battery.jpg"
            alt="LiPo Battery"
            style={{
              flex: 1,
              height: 220,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
          <img
            src="/LI-PO 2.jpg"
            alt="LiPo Battery Detail"
            style={{
              flex: 1,
              height: 220,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
        </div>
        <h4 style={{ marginTop: 16 }}>Energy Architecture</h4>
        <div className="about-flow-visual">
          {['PRIMARY POWER', 'CONTINUOUS OPERATION', 'SECONDARY BATTERY SUPPORT'].map((n, i) => (
            <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="about-flow-step active">{n}</span>
              {i < 2 && <span className="about-flow-connector">→</span>}
            </span>
          ))}
        </div>
        <div className="about-flow-visual">
          {['ACOUSTIC TRANSMISSION EVENT', 'LiPo SUPPLIES HIGH-POWER BURST', 'TRANSMISSION COMPLETE', 'BATTERY RECOVERY'].map((n, i) => (
            <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="about-flow-step">{n}</span>
              {i < 3 && <span className="about-flow-connector">→</span>}
            </span>
          ))}
        </div>
        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          In the current prototype simulation, short acoustic transmission events are modeled as temporary higher-energy operations compared with normal baseline processing.
        </p>
      </div>

      {/* ── 8. Syntactic Foam ── */}
      <div className="about-section">
        <h3>SYNTACTIC FOAM — BUOYANCY AND PRESSURE SUPPORT</h3>
        <p>
          Syntactic foam is a lightweight composite material containing microscopic hollow spheres. It provides buoyancy, supports underwater deployment, resists water exposure, and supports high-pressure deep-ocean environments.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <img
            src="/syntactic.jpg"
            alt="Syntactic Foam"
            style={{
              width: '100%',
              height: 250,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
          <img
            src="/syntactic 2.jpg"
            alt="Syntactic Foam Sheets"
            style={{
              width: '100%',
              height: 250,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
        </div>
        <div className="about-flow-visual" style={{ marginTop: 16 }}>
          {['SYNTACTIC FOAM → UPWARD BUOYANCY', 'EXTERNAL BALLAST → DOWNWARD FORCE', 'CONTROLLED BALANCE → TARGET DEPTH'].map((n, i) => (
            <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="about-flow-step active">{n}</span>
              {i < 2 && <span className="about-flow-connector">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── 9. Emergency Recovery ── */}
      <div className="about-section">
        <h3>EMERGENCY RECOVERY MECHANISM</h3>
        <p style={{ marginBottom: 8 }}>
          Autonomous fail-safe recovery sequence for critical deep-ocean device conditions.
        </p>
        <div className="emergency-flow-container">
          <div className="emergency-flow">
            {EMERGENCY_SEQ.map((step, i) => (
              <span key={step.title} className="emergency-step-wrapper">
                <div className={`emergency-card emergency-${step.stage}`}>
                  <div className="emergency-icon">{step.icon}</div>
                  <div className="emergency-title">{step.title}</div>
                  <div className="emergency-desc">{step.desc}</div>
                </div>
                {i < EMERGENCY_SEQ.length - 1 && (
                  <div className="emergency-arrow">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                      <path d="M5 12h14m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </span>
            ))}
          </div>
        </div>
        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          GPS signals cannot be received reliably underwater. In this recovery concept, the device first ascends using buoyancy. Surface-level GPS and recovery tracking can then become available after reaching the surface.
        </p>
      </div>

      {/* ── 10. Local Storage ── */}
      <div className="about-section">
        <h3>LOCAL DATA STORAGE — 1 GB COMMUNICATION BUFFER</h3>
        <p>
          Underwater acoustic communication can experience temporary link interruption, missing acknowledgements, packet loss, cross-reflection, route failure and temporary node unavailability. Local storage acts as a communication buffer and recovery mechanism.
        </p>
        <div className="about-flow-visual">
          {['DATA GENERATED', 'STORE TEMPORARILY', 'SEND DATA', 'ACKNOWLEDGEMENT?'].map((n, i) => (
            <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="about-flow-step active">{n}</span>
              {i < 3 && <span className="about-flow-connector">→</span>}
            </span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
          <img
            src="/1GB.jpg"
            alt="Local Data Storage"
            style={{
              width: '100%',
              height: 180,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
          <img
            src="/1GB2.jpg"
            alt="Data Center"
            style={{
              width: '100%',
              height: 180,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
          <img
            src="/1GB3.jpg"
            alt="SD Card Storage"
            style={{
              width: '100%',
              height: 180,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
        </div>
        <div className="about-two-col" style={{ marginTop: 12 }}>
          <div className="about-arch-card">
            <h5>If Acknowledgement Received</h5>
            <p>Data transmission is confirmed. Stored data can be cleared.</p>
          </div>
          <div className="about-arch-card">
            <h5>If No Acknowledgement</h5>
            <p>Keep data buffered → PROGRAMMING/PRISM checks alternative route → Route available → Resend stored data.</p>
          </div>
        </div>
      </div>

      {/* ── 11. Complete System Flow ── */}
      <div className="about-section">
        <h3>COMPLETE INTELLIGENT SYSTEM FLOW</h3>
        <div className="about-two-col">
          <div>
            <img
              src="/DATA FLOW.png"
              alt="Data Flow — Complete System"
              style={{
                width: '100%',
                marginTop: 16,
                borderRadius: 8,
                border: '1px solid var(--border)',
              }}
            />
          </div>
          <div>
            <h4>Supporting Systems</h4>
            <div className="about-arch-card" style={{ marginBottom: 8 }}>
              <h5>PROGRAMMING INTELLIGENCE</h5>
              <p>MONITOR → ANALYZE → DECIDE → ACT</p>
            </div>
            <div className="about-arch-card" style={{ marginBottom: 8 }}>
              <h5>SNC Analytics</h5>
              <p>TRAFFIC → DELAY → LOAD → STABILITY</p>
            </div>
            <div className="about-arch-card" style={{ marginBottom: 8 }}>
              <h5>Power System</h5>
              <p>MICRO NUCLEAR PRIMARY + LiPo SECONDARY HIGH-POWER BURST</p>
            </div>
            <div className="about-arch-card">
              <h5>Failure Recovery</h5>
              <p>CRITICAL CONDITION → EMERGENCY MODE → BALLAST RELEASE → ASCENT → SURFACE GPS / RECOVERY</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 12. Prototype Viewer ── */}
      <div className="about-section">
        <h3>EXPLORE THE PROTOTYPE</h3>
        <img
          src="/internal-electronics.png"
          alt="Underwater Device Prototype"
          className="pv-clickable-img"
          onClick={() => setViewerOpen(true)}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: 900,
            objectFit: 'contain',
            borderRadius: 8,
            marginTop: 12,
            marginBottom: 12,
            border: '1px solid var(--border)',
          }}
        />
        <div className="about-hotspots">
          {HOTSPOTS.map(h => (
            <span className="about-hotspot" key={h}>{h}</span>
          ))}
        </div>
      </div>

    </div>
  );
}
