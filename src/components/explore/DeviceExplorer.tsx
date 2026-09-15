import { useEffect, useRef, useState } from 'react';
import './DeviceExplorer.css';

interface Props { onClose?: () => void; initialSection?: string | null; }

const NAV = [
  { id: 'dx-about', label: 'About the Device', num: '01' },
  { id: 'dx-ai', label: 'Programming Intelligence', num: '02' },
  { id: 'dx-prism', label: 'PRISM Routing', num: '03' },
  { id: 'dx-snc', label: 'SNC Analytics', num: '04' },
  { id: 'dx-primary', label: 'Primary Power', num: '05' },
  { id: 'dx-secondary', label: 'Secondary Power', num: '06' },
  { id: 'dx-foam', label: 'Syntactic Foam', num: '07' },
  { id: 'dx-storage', label: 'Local 1GB Storage', num: '08' },
  { id: 'dx-ballast', label: 'Ballast Release', num: '09' },
  { id: 'dx-emergency', label: 'Emergency Recovery', num: '10' },
  { id: 'dx-map', label: 'System Map', num: '11' },
];

export function DeviceExplorer({ onClose, initialSection }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState('dx-about');
  const [hoverComp, setHoverComp] = useState<string | null>(null);
  const [aiStep, setAiStep] = useState(0);
  const [prismFailed, setPrismFailed] = useState(false);
  const [prismLog, setPrismLog] = useState<string[]>(['SYSTEM READY — ALL LINKS NOMINAL']);
  const [sncTab, setSncTab] = useState('NETWORK');
  const [depth, setDepth] = useState(2500);
  const [storageInterrupted, setStorageInterrupted] = useState(false);
  const [ballastStage, setBallastStage] = useState(0);
  const [ballastReleased, setBallastReleased] = useState(false);
  const [emerRunning, setEmerRunning] = useState(false);
  const [emerStep, setEmerStep] = useState(0);
  const [highDemand, setHighDemand] = useState(false);
  const [energyTrace, setEnergyTrace] = useState(false);

  // reveal
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('dx-visible'); obs.unobserve(e.target); }});
    }, { threshold: 0.12 });
    el.querySelectorAll('.dx-reveal').forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, []);

  // initial scroll
  useEffect(() => {
    if (!initialSection) return;
    const map: Record<string,string> = {
      'about-device':'dx-about','ai-intel':'dx-ai','prism':'dx-prism','snc':'dx-snc',
      'primary-power':'dx-primary','secondary-power':'dx-secondary','syntactic':'dx-foam',
      'local-1gb':'dx-storage','ballast':'dx-ballast','emergency-recovery':'dx-emergency'
    };
    const id = map[initialSection] ?? initialSection;
    setActive(id);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' }), 120);
  }, [initialSection]);

  // active on scroll
  useEffect(() => {
    const handler = () => {
      const secs = NAV.map(n => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
      let cur = active;
      for (const s of secs) {
        if (s.getBoundingClientRect().top < 160) cur = s.id;
      }
      setActive(cur);
    };
    const main = document.querySelector('.main');
    main?.addEventListener('scroll', handler, { passive:true });
    window.addEventListener('scroll', handler, { passive:true });
    return () => { main?.removeEventListener('scroll', handler); window.removeEventListener('scroll', handler); };
  }, [active]);

  // AI auto step
  useEffect(() => {
    const t = setInterval(() => setAiStep(s => (s + 1) % 6), 1500);
    return () => clearInterval(t);
  }, []);

  // emergency simulation
  useEffect(() => {
    if (!emerRunning) return;
    if (emerStep >= 7) { setEmerRunning(false); return; }
    const t = setTimeout(() => setEmerStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [emerRunning, emerStep]);

  const triggerPrismFailure = () => {
    setPrismFailed(f => !f);
    setPrismLog(l => [...l.slice(-4), prismFailed ? 'LINK RESTORED — ROUTE RE-OPTIMIZED' : 'LINK DEGRADATION DETECTED — ALTERNATIVE ROUTE IDENTIFIED — NETWORK PATH UPDATED']);
  };

  const pressure = Math.round(depth * 0.1); // bar approx

  return (
    <div className="device-explorer" ref={rootRef}>
      {/* ── Hero ── */}
      <div className="dx-hero dx-reveal dx-visible">
        <h1>UNDERWATER AUTONOMOUS COMMUNICATION NODE</h1>
        <div className="dx-hero-sub">Technical Systems & Subsystems Explorer</div>
        <p className="dx-hero-desc">A compact autonomous underwater node designed for acoustic communication, intelligent routing, distributed sensing, local analytics, energy management and emergency recovery in deep-ocean environments.</p>
        <div className="dx-meta-strip">
          <div className="dx-meta"><span className="dx-meta-k">DEVICE CLASS</span><span className="dx-meta-v">Autonomous Underwater Communication Node</span></div>
          <div className="dx-meta"><span className="dx-meta-k">PRIMARY LINK</span><span className="dx-meta-v">Underwater Acoustic Communication</span></div>
          <div className="dx-meta"><span className="dx-meta-k">PROCESSING</span><span className="dx-meta-v">AI + SNC + Embedded Processing</span></div>
          <div className="dx-meta"><span className="dx-meta-k">ROUTING</span><span className="dx-meta-v">PRISM</span></div>
          <div className="dx-meta"><span className="dx-meta-k">LOCAL STORAGE</span><span className="dx-meta-v">1 GB</span></div>
          <div className="dx-meta"><span className="dx-meta-k">RECOVERY</span><span className="dx-meta-v">Emergency Recovery System</span></div>
          <div className="dx-meta"><span className="dx-meta-k">ENVIRONMENT</span><span className="dx-meta-v">Deep-Ocean</span></div>
        </div>
      </div>

      <div className="dx-layout">
        {/* Nav */}
        <nav className="dx-nav" aria-label="Device subsystems">
          <div className="dx-nav-title">Subsystems</div>
          <ul className="dx-nav-list">
            {NAV.map(n => (
              <li key={n.id} className={`dx-nav-item ${active===n.id?'active':''}`} onClick={() => { document.getElementById(n.id)?.scrollIntoView({behavior:'smooth', block:'start'}); setActive(n.id); }}>
                <span className="dx-nav-num">{n.num}</span> {n.label}
              </li>
            ))}
          </ul>
          {onClose && <button className="dx-btn" style={{ width:'100%', marginTop:10 }} onClick={onClose}>← Back to Dashboard</button>}
        </nav>

        <div className="dx-content">
          {/* 1 About */}
          <section id="dx-about" className="dx-section dx-reveal">
            <div className="dx-label">01 — About the Device</div>
            <h2 className="dx-h2">About the Device</h2>
            <p className="dx-p">The device is a compact autonomous underwater platform designed to perform communication, sensing, local processing, energy management and recovery operations within a submerged network.</p>
            <div className="dx-cutaway-wrap">
              <div>
                <div className="dx-cutaway-visual">
                  <div className="dx-cutaway-device">DEVICE CORE</div>
                  {[
                    { t:'PROGRAMMING INTELLIGENCE', x:6, y:8, k:'ai' },
                    { t:'PRISM ROUTING', x:62, y:6, k:'prism' },
                    { t:'SNC ANALYTICS', x:32, y:82, k:'snc' },
                    { t:'PRIMARY POWER', x:2, y:42, k:'primary' },
                    { t:'SECONDARY POWER', x:68, y:44, k:'secondary' },
                    { t:'LOCAL STORAGE', x:10, y:68, k:'storage' },
                    { t:'ACOUSTIC MODULE', x:58, y:78, k:'acoustic' },
                    { t:'SYNTACTIC FOAM', x:74, y:20, k:'foam' },
                    { t:'BALLAST RELEASE', x:36, y:2, k:'ballast' },
                    { t:'EMERGENCY RECOVERY', x:5, y:55, k:'emergency' },
                  ].map(c => (
                    <div key={c.k} className={`dx-cutaway-callout ${hoverComp===c.k?'hl':''}`} style={{ left:`${c.x}%`, top:`${c.y}%` }}
                      onMouseEnter={() => setHoverComp(c.k)} onMouseLeave={() => setHoverComp(null)}>{c.t}</div>
                  ))}
                </div>
                <div className="dx-components">
                  {['PROGRAMMING INTELLIGENCE','PRISM ROUTING','SNC ANALYTICS','PRIMARY POWER','SECONDARY POWER','LOCAL STORAGE','ACOUSTIC COMMUNICATION','SYNTACTIC FOAM','BALLAST RELEASE','EMERGENCY RECOVERY'].map(m => {
                    const k = m.toLowerCase().split(' ')[0];
                    return <span key={m} className={`dx-chip ${hoverComp===k?'active':''}`} onMouseEnter={() => setHoverComp(k)} onMouseLeave={() => setHoverComp(null)}>{m}</span>;
                  })}
                </div>
                {hoverComp && (
                  <div style={{ marginTop:8, fontSize:11, color:'var(--dx-cyan)', background:'rgba(79,163,199,0.08)', border:'1px solid rgba(79,163,199,0.2)', borderRadius:6, padding:'6px 8px' }}>
                    {hoverComp==='ai' && 'Programming intelligence interprets network and environmental conditions to support adaptive decisions.'}
                    {hoverComp==='prism' && 'PRISM selects suitable acoustic communication paths and adapts when links degrade.'}
                    {hoverComp==='primary' && 'Protected primary energy module provides long-duration baseline power inside housing.'}
                    {hoverComp==='foam' && 'Syntactic foam provides buoyancy and pressure resistance for deep-ocean operation.'}
                    {hoverComp==='ballast' && 'Controlled ballast release changes buoyancy to enable ascent and recovery.'}
                    {hoverComp==='storage' && '1 GB local storage buffers telemetry when acoustic links are temporarily unavailable.'}
                    {!['ai','prism','primary','foam','ballast','storage'].includes(hoverComp) && `Explore ${hoverComp} subsystem details below.`}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <img src="/internal-electronics.png" alt="Internal electronics" style={{ width:'100%', height:140, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
                <img src="/titanium alloy.jpg" alt="Pressure housing" style={{ width:'100%', height:110, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
                <div style={{ fontSize:10, color:'var(--dx-text2)', background:'var(--dx-navy)', border:'1px solid var(--dx-border)', borderRadius:6, padding:'8px' }}>
                  <b style={{ color:'#fff', fontSize:9, letterSpacing:0.6 }}>SYSTEM ROLE</b><br/>SENSOR + PROCESSOR + COMMUNICATION NODE + NETWORK PARTICIPANT + ENERGY-AWARE SYSTEM + RECOVERABLE ASSET
                </div>
              </div>
            </div>
            <div className="dx-grid2" style={{ marginTop:10 }}>
              <div style={{ background:'var(--dx-navy)', border:'1px solid var(--dx-border)', borderRadius:8, padding:10 }}>
                <b style={{ fontSize:9, letterSpacing:0.7, color:'var(--dx-cyan)' }}>INTERNAL FUNCTIONAL ARCHITECTURE</b>
                <div className="dx-arch-flow" style={{ marginTop:6 }}>
                  {['ENVIRONMENT','SENSORS','PROCESSING','PROGRAMMING INTELLIGENCE','PRISM ROUTING','ACOUSTIC COMMUNICATION','NETWORK'].map((s,i,arr) => (
                    <span key={s} style={{ display:'flex', alignItems:'center', gap:4 }}><span className="dx-flow-box accent">{s}</span>{i<arr.length-1 && <span style={{ color:'var(--dx-muted)' }}>↓</span>}</span>
                  ))}
                </div>
              </div>
              <div style={{ background:'var(--dx-navy)', border:'1px solid var(--dx-border)', borderRadius:8, padding:10 }}>
                <b style={{ fontSize:9, letterSpacing:0.7, color:'var(--dx-yellow)' }}>ENERGY PARALLEL SYSTEMS</b>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:6 }}>
                  <div><div className="dx-flow-box">PRIMARY POWER → ENERGY MANAGEMENT → DEVICE SYSTEMS</div></div>
                  <div><div className="dx-flow-box" style={{ borderColor:'var(--dx-yellow)', color:'var(--dx-yellow)' }}>SECONDARY POWER → EMERGENCY / COMM SUPPORT</div></div>
                </div>
              </div>
            </div>
            <div className="dx-insight" style={{ marginTop:10 }}><strong>ENGINEERING INSIGHT</strong>The device is not simply a sensor. It is a complete autonomous communication node capable of sensing, processing, networking and responding to abnormal conditions.</div>
          </section>

          {/* 2 AI */}
          <section id="dx-ai" className="dx-section dx-reveal">
            <div className="dx-label">02 — Programming Intelligence</div>
            <h2 className="dx-h2">Programming Intelligence — Decision Cockpit</h2>
            <p className="dx-p">The AI intelligence layer is responsible for interpreting available node and network information and supporting adaptive decisions during underwater operation. <em style={{ color:'var(--dx-muted)' }}>Concept: AI-assisted decision logic — rule-based intelligent layer (SIMULATION).</em></p>
            <div className="dx-ai-grid">
              <div className="dx-ai-inputs">
                <h5>Inputs</h5>
                {['ACOUSTIC DATA','NETWORK STATE','NODE HEALTH','ENERGY STATE','ENVIRONMENT','PACKET CONDITIONS'].map(i => (
                  <div key={i} className="dx-ai-in">● {i}</div>
                ))}
              </div>
              <div className="dx-ai-center">
                <div style={{ fontSize:18 }}>🧠</div>
                <b>PROGRAMMING INTELLIGENCE</b>
                <small>Decision layer</small>
                <div style={{ fontSize:10, color:'var(--dx-cyan)', border:'1px solid var(--dx-cyan)', borderRadius:5, padding:'4px 8px', marginTop:4 }}>DECISION → ACTION</div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center', marginTop:6 }}>
                  {['ROUTE','PRIORITIZE','MONITOR','ALERT','OPTIMIZE','RECOVER'].map(a => (
                    <span key={a} style={{ fontSize:7, fontWeight:800, letterSpacing:0.5, background:'rgba(79,163,199,0.12)', border:'1px solid rgba(79,163,199,0.25)', borderRadius:4, padding:'3px 5px', color:'var(--dx-cyan)' }}>{a}</span>
                  ))}
                </div>
              </div>
              <div className="dx-ai-inputs">
                <h5>Possible Actions</h5>
                {['Route selection','Prioritize traffic','Monitor health','Alert operator','Optimize link','Recover path'].map(a => (
                  <div key={a} className="dx-ai-in" style={{ borderLeft:'2px solid var(--dx-green)' }}>{a}</div>
                ))}
              </div>
            </div>
            <div className="dx-ai-pipeline">
              {['OBSERVE','UNDERSTAND','EVALUATE','PREDICT','DECIDE','RESPOND'].map((s,idx) => (
                <span key={s} className={`dx-ai-step ${aiStep===idx?'active':''}`} style={{ position:'relative', overflow:'hidden' }}>
                  {s}
                  {aiStep===idx && <i className="dx-ai-dot" />}
                </span>
              ))}
            </div>
            <div className="dx-scenario">
              <div className="dx-scenario-box"><b>Network Condition</b><span>Packet loss increasing</span></div>
              <span style={{ color:'var(--dx-cyan)' }}>→</span>
              <div className="dx-scenario-box"><b>AI Observation</b><span>Reliability degrading</span></div>
              <span style={{ color:'var(--dx-cyan)' }}>→</span>
              <div className="dx-scenario-box" style={{ borderColor:'var(--dx-yellow)' }}><b>AI Decision</b><span>Evaluate alternative path</span></div>
            </div>
            <div style={{ textAlign:'center', marginTop:6, fontSize:10, color:'var(--dx-text2)' }}>↓ PRISM layer receives updated routing requirements ↓</div>
            <div className="dx-insight"><strong>ENGINEERING INSIGHT</strong>AI becomes valuable when the underwater environment changes faster than an operator can manually respond.</div>
          </section>

          {/* 3 PRISM */}
          <section id="dx-prism" className="dx-section dx-reveal">
            <div className="dx-label">03 — PRISM Routing</div>
            <h2 className="dx-h2">PRISM — Interactive Network Map</h2>
            <p className="dx-p">PRISM is the project&apos;s routing layer responsible for determining suitable communication paths between distributed underwater nodes.</p>
            <div className="dx-prism-map">
              <svg className="dx-prism-svg" viewBox="0 0 640 220">
                {/* links */}
                <line x1="90" y1="110" x2="200" y2="45" stroke={prismFailed ? 'rgba(199,92,92,0.35)' : 'rgba(79,163,199,0.5)'} strokeWidth={prismFailed?1:3} strokeDasharray={prismFailed?'6 6':''} />
                <line x1="90" y1="110" x2="200" y2="175" stroke="rgba(79,163,199,0.5)" strokeWidth="3" />
                <line x1="200" y1="45" x2="380" y2="60" stroke={prismFailed ? 'rgba(199,92,92,0.35)' : 'rgba(79,163,199,0.5)'} strokeWidth={prismFailed?1:3} strokeDasharray={prismFailed?'6 6':''} />
                <line x1="200" y1="175" x2="380" y2="60" stroke="rgba(79,163,199,0.7)" strokeWidth="3" />
                <line x1="380" y1="60" x2="540" y2="110" stroke="rgba(79,163,199,0.7)" strokeWidth="3" />
                {[
                  { x:90, y:110, l:'NODE A' },
                  { x:200, y:45, l:'NODE B' },
                  { x:200, y:175, l:'NODE C' },
                  { x:380, y:60, l:'NODE D' },
                  { x:540, y:110, l:'DESTINATION' },
                ].map(n => (
                  <g key={n.l}>
                    <circle cx={n.x} cy={n.y} r="22" fill={n.l==='NODE B' && prismFailed ? 'rgba(199,92,92,0.15)' : 'rgba(79,163,199,0.12)'} stroke={n.l==='DESTINATION' ? 'var(--dx-green)' : 'var(--dx-cyan)'} strokeWidth="1.5" />
                    <text x={n.x} y={n.y+4} textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff">{n.l}</text>
                  </g>
                ))}
                {!prismFailed && (
                  <g>
                    <circle cx="90" cy="110" r="3" fill="#fff"><animate attributeName="cx" values="90;200;380;540" dur="2.5s" repeatCount="indefinite" /><animate attributeName="cy" values="110;45;60;110" dur="2.5s" repeatCount="indefinite" /></circle>
                  </g>
                )}
                {prismFailed && (
                  <g>
                    <circle cx="90" cy="110" r="3" fill="#fff"><animate attributeName="cx" values="90;200;380;540" dur="2.5s" repeatCount="indefinite" /><animate attributeName="cy" values="110;175;60;110" dur="2.5s" repeatCount="indefinite" /></circle>
                    <text x="290" y="30" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--dx-red)">X LINK DEGRADED</text>
                  </g>
                )}
              </svg>
            </div>
            <div className="dx-prism-ctrl">
              <button className={`dx-btn ${prismFailed?'':'primary'}`} onClick={triggerPrismFailure}>{prismFailed ? 'Restore Link' : 'Simulate Link Failure'}</button>
              <span style={{ fontSize:10, color:'var(--dx-text2)', alignSelf:'center' }}>Route score: LINK QUALITY • LATENCY • PACKET LOSS • NODE AVAILABILITY • ENERGY (conceptual)</span>
            </div>
            <div className="dx-log" aria-live="polite">{prismLog[prismLog.length-1]}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:10 }}>
              <div style={{ background:'var(--dx-navy)', border:'1px solid var(--dx-border)', borderRadius:6, padding:8, textAlign:'center' }}><b style={{ fontSize:9, color:'var(--dx-green)' }}>NORMAL</b><div style={{ fontSize:9, color:'var(--dx-text2)' }}>A → B → D → DESTINATION</div></div>
              <div style={{ background:'rgba(199,92,92,0.06)', border:'1px solid rgba(199,92,92,0.25)', borderRadius:6, padding:8, textAlign:'center' }}><b style={{ fontSize:9, color:'var(--dx-red)' }}>LINK DEGRADED</b><div style={{ fontSize:9, color:'var(--dx-text2)' }}>A → B <span style={{ color:'var(--dx-red)' }}>X</span> D</div></div>
              <div style={{ background:'rgba(79,163,199,0.08)', border:'1px solid rgba(79,163,199,0.25)', borderRadius:6, padding:8, textAlign:'center' }}><b style={{ fontSize:9, color:'var(--dx-cyan)' }}>ALTERNATIVE</b><div style={{ fontSize:9, color:'var(--dx-text2)' }}>A → C → D → DESTINATION</div></div>
            </div>
            <div className="dx-insight"><strong>ENGINEERING INSIGHT</strong>Routing resilience matters because a single degraded acoustic link can affect the entire communication path.</div>
          </section>

          {/* 4 SNC */}
          <section id="dx-snc" className="dx-section dx-reveal">
            <div className="dx-label">04 — SNC Analytics</div>
            <h2 className="dx-h2">SNC — Network Operations Center</h2>
            <p className="dx-p">SNC analytics evaluates the behavior and stability of the underwater communication network by measuring traffic, service performance, delay, congestion, throughput and packet delivery.</p>
            <div className="dx-snc-tabs">
              {['NETWORK','LATENCY','TRAFFIC','PACKETS','STABILITY'].map(t => (
                <button key={t} className={`dx-tab ${sncTab===t?'active':''}`} onClick={() => setSncTab(t)}>{t}</button>
              ))}
              <span style={{ fontSize:9, color:'var(--dx-muted)', alignSelf:'center', marginLeft:6 }}>SIMULATION • DEMONSTRATION DATA</span>
            </div>
            <div className="dx-snc-grid">
              {[
                { k:'Arrival Rate', v:'3.2 msg/s', s:'λ' },
                { k:'Service Rate', v:'4.8 msg/s', s:'μ' },
                { k:'Traffic Intensity', v:'0.67', s:'ρ' },
                { k:'Average Delay', v:'168 ms', s:'W' },
                { k:'Maximum Delay', v:'420 ms', s:'Wmax' },
                { k:'Backlog', v:'12 pkt', s:'Q' },
                { k:'Buffer Utilization', v:'42%', s:'β' },
                { k:'Throughput', v:'558 msg/s', s:'θ' },
                { k:'Packet Loss', v:'1.2%', s:'PL' },
                { k:'Stability', v:'STABLE', s:'S' },
              ].filter(c => {
                if (sncTab==='LATENCY') return ['Average Delay','Maximum Delay','Backlog'].includes(c.k);
                if (sncTab==='TRAFFIC') return ['Arrival Rate','Service Rate','Traffic Intensity','Buffer Utilization'].includes(c.k);
                if (sncTab==='PACKETS') return ['Packet Loss','Throughput','Backlog'].includes(c.k);
                if (sncTab==='STABILITY') return ['Stability','Traffic Intensity','Buffer Utilization'].includes(c.k);
                return true;
              }).map(c => (
                <div key={c.k} className="dx-snc-card"><b>{c.k}</b><strong>{c.v}</strong><small>{c.s}</small></div>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center', marginTop:10, flexWrap:'wrap', background:'var(--dx-navy)', border:'1px solid var(--dx-border)', borderRadius:8, padding:8 }}>
              {['ARRIVAL RATE','TRAFFIC LOAD','SERVICE CAPACITY','BACKLOG / DELAY','NETWORK STABILITY'].map((s,i,arr) => (
                <span key={s} style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ fontSize:8, fontWeight:800, background:'var(--dx-card2)', border:'1px solid var(--dx-border)', borderRadius:5, padding:'5px 7px', color:'var(--dx-text2)' }}>{s}</span>{i<arr.length-1 && <span style={{ color:'var(--dx-cyan)' }}>→</span>}</span>
              ))}
            </div>
            <div className="dx-stability">
              <div className={`dx-stab stable ${sncTab==='STABILITY'?'on':''}`}>STABLE</div>
              <div className="dx-stab warning">WARNING</div>
              <div className="dx-stab critical">CRITICAL</div>
            </div>
            <div className="dx-insight"><strong>ENGINEERING INSIGHT</strong>Network stability depends on the relationship between incoming traffic and the system&apos;s ability to service it. The underwater channel is constrained — SNC quantifies whether load can be sustained.</div>
          </section>

          {/* 5 Primary Power */}
          <section id="dx-primary" className="dx-section dx-reveal">
            <div className="dx-label">05 — Primary Power Source</div>
            <h2 className="dx-h2">Primary Power — Long-Duration Foundation</h2>
            <p className="dx-p">The primary power system provides the long-duration energy foundation for the autonomous underwater node. Concept: concealed protected module inside housing — no hazardous material exposed.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <img src="/NUCLEAR.jpg" alt="Protected primary power module" style={{ width:'100%', height:140, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
              <img src="/nuclear battery 2.png" alt="Protected housing" style={{ width:'100%', height:140, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
            </div>
            <div className="dx-energy-flow">
              <div className="dx-energy-node protected"><b>[PROTECTED PRIMARY POWER MODULE]</b><span>Inside protective housing</span></div>
              <span style={{ color:'var(--dx-cyan)' }}>↓</span>
              <div className="dx-energy-node"><b>Energy Management</b><span>Distribution & regulation</span></div>
              <span style={{ color:'var(--dx-cyan)' }}>↓</span>
              <div className="dx-energy-node"><b>Power Distribution</b><span>To subsystems</span></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginTop:8 }}>
              {[
                { k:'AI', c:'var(--dx-cyan)' }, { k:'SNC', c:'var(--dx-green)' }, { k:'COMM', c:'var(--dx-yellow)' }, { k:'SENSORS', c:'var(--dx-cyan2)' }
              ].map(x => (
                <div key={x.k} style={{ background:'var(--dx-card2)', border:`1px solid ${x.c}`, borderRadius:6, padding:'6px', textAlign:'center', fontSize:9, fontWeight:800, color:x.c }}>{x.k}</div>
              ))}
            </div>
            <button className="dx-btn" style={{ marginTop:8 }} onClick={() => setEnergyTrace(v => !v)}>{energyTrace?'Hide energy trace':'Trace energy flow'}</button>
            {energyTrace && <div style={{ marginTop:6, height:4, background:'var(--dx-navy)', borderRadius:4, overflow:'hidden', border:'1px solid var(--dx-border)' }}><div style={{ width:'100%', height:'100%', background:`linear-gradient(90deg, var(--dx-yellow), var(--dx-cyan))`, animation:'dxRun 1.5s linear infinite', position:'relative' }} /></div>}
            <div className="dx-insight"><strong>ENGINEERING INSIGHT</strong>Deep-ocean systems cannot depend on frequent servicing — energy availability directly determines mission endurance.</div>
          </section>

          {/* 6 Secondary Power */}
          <section id="dx-secondary" className="dx-section dx-reveal">
            <div className="dx-label">06 — Secondary Power Source</div>
            <h2 className="dx-h2">Secondary Power — Energy Reserve</h2>
            <p className="dx-p">The secondary power source acts as a rechargeable energy buffer, supporting higher-demand operations and providing additional resilience when primary power cannot immediately satisfy transient load.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <img src="/lipo-battery.jpg" alt="Secondary battery" style={{ width:'100%', height:140, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
              <img src="/LI-PO 2.jpg" alt="Battery detail" style={{ width:'100%', height:140, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              <div style={{ background:'var(--dx-navy)', border:'1px solid var(--dx-border)', borderRadius:8, padding:8, textAlign:'center', opacity: highDemand?0.5:1 }}><b style={{ fontSize:9, color:'var(--dx-muted)' }}>NORMAL</b><div style={{ fontSize:10, color:'var(--dx-text2)' }}>Primary → Systems</div></div>
              <div style={{ background: highDemand?'rgba(79,163,199,0.12)':'var(--dx-card2)', border:`1px solid ${highDemand?'var(--dx-cyan)':'var(--dx-border)'}`, borderRadius:8, padding:8, textAlign:'center' }}><b style={{ fontSize:9, color:'var(--dx-cyan)' }}>HIGH-DEMAND</b><div style={{ fontSize:10, color:'var(--dx-text)' }}>Primary → Reserve → Communication</div></div>
              <div style={{ background:'rgba(217,164,65,0.06)', border:'1px solid rgba(217,164,65,0.25)', borderRadius:8, padding:8, textAlign:'center' }}><b style={{ fontSize:9, color:'var(--dx-yellow)' }}>EMERGENCY</b><div style={{ fontSize:10, color:'var(--dx-text2)' }}>Reserve → Critical Systems</div></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginTop:8 }}>
              {[
                { l:'CRITICAL SYSTEMS', p:'HIGH' }, { l:'COMMUNICATION', p:'HIGH' }, { l:'SENSING', p:'MEDIUM' }, { l:'NON-CRITICAL', p:'LOW' }
              ].map(x => (
                <div key={x.l} style={{ background:'var(--dx-card2)', border:'1px solid var(--dx-border)', borderRadius:6, padding:6, textAlign:'center' }}>
                  <div style={{ fontSize:7, fontWeight:800, color:'var(--dx-muted)' }}>{x.l}</div>
                  <div style={{ fontSize:9, fontWeight:800, color: x.p==='HIGH'?'var(--dx-red)':x.p==='MEDIUM'?'var(--dx-yellow)':'var(--dx-muted)' }}>{x.p} PRIORITY</div>
                </div>
              ))}
            </div>
            <button className="dx-btn primary" style={{ marginTop:8 }} onClick={() => setHighDemand(v => !v)}>{highDemand?'End high-demand event':'Trigger high-demand event'}</button>
            <div className="dx-insight"><strong>ENGINEERING INSIGHT</strong>Energy buffering allows the system to handle transient high-demand operations without compromising core functions.</div>
          </section>

          {/* 7 Syntactic Foam */}
          <section id="dx-foam" className="dx-section dx-reveal">
            <div className="dx-label">07 — Syntactic Foam</div>
            <h2 className="dx-h2">Syntactic Foam — Pressure & Buoyancy</h2>
            <p className="dx-p">Syntactic foam is a lightweight buoyant material made using hollow microspheres embedded within a polymer matrix. It is widely used in deep-submergence applications because it can provide buoyancy while maintaining structural performance under high external pressure.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <img src="/syntactic.jpg" alt="Syntactic foam" style={{ width:'100%', height:140, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
              <img src="/syntactic 2.jpg" alt="Foam sheets" style={{ width:'100%', height:140, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
            </div>
            <div className="dx-depth">
              <div className="dx-depth-bar">
                {['SURFACE — 0m','1000m','3000m','6000m — EXTREME DEPTH'].map((t,i) => (
                  <div key={t} className="dx-depth-tick" style={{ top: `${8 + i*24}%` }}>{t}</div>
                ))}
                <div className="dx-depth-device" style={{ top: `${2 + (depth/6000)*78}%` }}>
                  <span>⏹️</span>
                  <span className="dx-depth-device-arrow">DEVICE</span>
                </div>
                <div className="dx-depth-foam" style={{ top: `${(depth/6000)*78}%` }}>BUOYANCY LAYER</div>
                <div style={{ position:'absolute', left:0, right:0, bottom:0, height:`${(depth/6000)*30}%`, background:'rgba(0,0,0,0.2)' }} />
              </div>
              <div className="dx-depth-side">
                <div className="dx-pressure"><b>Current Depth</b><strong>{depth} m</strong><small style={{ color:'var(--dx-text2)', fontSize:9 }}>Drag slider</small></div>
                <input type="range" min={0} max={6000} step={100} value={depth} onChange={e => setDepth(Number(e.target.value))} className="dx-range" aria-label="Depth" />
                <div className="dx-pressure"><b>External Pressure</b><strong>~{pressure} bar</strong></div>
                <div style={{ background:'var(--dx-card2)', border:'1px solid var(--dx-border)', borderRadius:7, padding:8 }}>
                  <div style={{ fontSize:9, fontWeight:800, color:'var(--dx-cyan)' }}>WATER PRESSURE vs PROTECTION</div>
                  <div style={{ height:6, background:'var(--dx-navy)', borderRadius:4, marginTop:6, overflow:'hidden' }}><div style={{ width:`${Math.min(75, depth/60)}%`, height:'100%', background:'var(--dx-red)' }} /></div>
                  <div style={{ fontSize:9, color:'var(--dx-text2)', marginTop:4 }}>Device structural protection scales with depth</div>
                </div>
              </div>
            </div>
            <div className="dx-insight"><strong>ENGINEERING INSIGHT</strong>As depth increases, hydrostatic pressure rises significantly. Buoyancy materials therefore become a critical part of deep-ocean vehicle and instrument design.</div>
          </section>

          {/* 8 Storage */}
          <section id="dx-storage" className="dx-section dx-reveal">
            <div className="dx-label">08 — Local 1GB Storage</div>
            <h2 className="dx-h2">Local 1GB Storage — Data Lifecycle</h2>
            <p className="dx-p">The local 1 GB storage subsystem provides onboard data retention for telemetry, observations, operational records and other locally generated information. It provides resilience when continuous transmission cannot be guaranteed.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
              <img src="/1GB.jpg" alt="Storage" style={{ width:'100%', height:90, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
              <img src="/1GB2.jpg" alt="Data center" style={{ width:'100%', height:90, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
              <img src="/1GB3.jpg" alt="SD card" style={{ width:'100%', height:90, objectFit:'cover', borderRadius:8, border:'1px solid var(--dx-border)' }} />
            </div>
            <div className="dx-storage">
              <div className="dx-cylinder">
                <div className="dx-cyl-head" />
                {[
                  { l:'SENSOR DATA', c:'rgba(79,163,199,0.25)' },
                  { l:'NETWORK LOGS', c:'rgba(62,155,118,0.2)' },
                  { l:'EVENT RECORDS', c:'rgba(217,164,65,0.18)' },
                  { l:'SYSTEM STATUS', c:'rgba(127,140,160,0.15)' },
                  { l:'RECOVERY DATA', c:'rgba(199,92,92,0.12)' },
                ].map(s => (
                  <div key={s.l} className="dx-cyl-seg" style={{ background:s.c }}>{s.l}</div>
                ))}
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap', justifyContent:'center', background:'var(--dx-navy)', border:'1px solid var(--dx-border)', borderRadius:8, padding:8, marginBottom:8 }}>
                  {['SENSORS','LOCAL DATA','1 GB STORAGE','PROCESS / PRIORITIZE','ACOUSTIC TRANSMISSION','SURFACE / NETWORK'].map((s,i,arr) => (
                    <span key={s} style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ fontSize:8, fontWeight:800, background:'var(--dx-card2)', border:'1px solid var(--dx-border)', borderRadius:5, padding:'5px 7px', color:'var(--dx-text2)' }}>{s}</span>{i<arr.length-1 && <span style={{ color:'var(--dx-cyan)' }}>→</span>}</span>
                  ))}
                </div>
                <div className="dx-queue">
                  {Array.from({ length: storageInterrupted? 14: 6 }).map((_,i) => (
                    <div key={i} className={`dx-qitem ${i<4?'s':'n'}`}>{i+1}</div>
                  ))}
                  <span style={{ fontSize:9, color:'var(--dx-muted)', marginLeft:4 }}>{storageInterrupted ? 'Buffer filling — link interrupted' : 'Normal queue'}</span>
                </div>
                <button className={`dx-btn ${storageInterrupted?'primary':''}`} style={{ marginTop:8 }} onClick={() => setStorageInterrupted(v => !v)}>{storageInterrupted ? 'Restore Link — Transmit queued' : 'Simulate Communication Interruption'}</button>
                {storageInterrupted && <div style={{ marginTop:6, fontSize:10, color:'var(--dx-yellow)' }}>LINK RESTORED → queued data prioritized for transmission</div>}
              </div>
            </div>
            <div className="dx-insight"><strong>ENGINEERING INSIGHT</strong>Local storage provides resilience against intermittent underwater communication, where continuous transmission cannot always be guaranteed.</div>
          </section>

          {/* 9 Ballast */}
          <section id="dx-ballast" className="dx-section dx-reveal">
            <div className="dx-label">09 — Ballast Release</div>
            <h2 className="dx-h2">Ballast Release — Buoyancy Control</h2>
            <p className="dx-p">The ballast-release mechanism provides a controlled method of changing the device&apos;s buoyancy state to support recovery or emergency ascent.</p>
            <div className="dx-ballast">
              {[
                { t:'NORMAL DEPLOYMENT', d:'Device at operational depth' },
                { t:'BALLAST ATTACHED', d:'External weight provides negative buoyancy' },
                { t:'RELEASE COMMAND', d:'Controlled actuation' },
                { t:'BALLAST SEPARATES', d:'Mechanical release' },
                { t:'BECOMES BUOYANT', d:'Positive buoyancy via foam' },
                { t:'ASCENT', d:'Rises to surface' },
              ].map((s,idx) => {
                const isActive = ballastStage===idx;
                // storyboard geometry: stages 1-3 attached, stage 4 small gap,
                // stages 5-6 progressively wider separation as weight falls away
                const DEV_TOP = [36, 36, 36, 32, 24, 14];
                const WEIGHT_TOP = [62, 62, 62, 68, 76, 78];
                const WEIGHT_OP = [1, 1, 1, 1, 0.85, 0.75];
                const devTop = ballastReleased && idx>=4 ? 8 : DEV_TOP[idx];
                const weightTop = ballastReleased && idx>=3
                  ? Math.min(Math.max(70, WEIGHT_TOP[idx]), 74)
                  : WEIGHT_TOP[idx];
                const weightOp = ballastReleased && idx>=3 ? 0.15 : WEIGHT_OP[idx];
                return (
                  <div key={s.t} className={`dx-ballast-step ${isActive?'active':''}`}>
                    <div className="dx-ballast-vis">
                      <div className={`dx-ballast-device ${ballastReleased && idx>=4?'dx-ascent':''}`} style={{ top: devTop }} />
                      <div className="dx-ballast-weight" style={{ top: weightTop, opacity: weightOp }} />
                    </div>
                    <div style={{ fontSize:8, fontWeight:800, letterSpacing:0.5, color: isActive?'var(--dx-cyan)':'var(--dx-muted)' }}>0{idx+1}</div>
                    <div style={{ fontSize:8, fontWeight:800, color:'#fff' }}>{s.t}</div>
                    <div style={{ fontSize:8, color:'var(--dx-text2)' }}>{s.d}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
              <button className="dx-btn primary" onClick={() => { setBallastReleased(v => !v); setBallastStage(ballastReleased ? 1 : 4); }}>{ballastReleased ? 'Re-attach Ballast' : 'Trigger Ballast Release'}</button>
              <button className="dx-btn" onClick={() => setBallastStage(s => (s+1)%6)}>Next Stage → {ballastStage+1}/6</button>
              <span style={{ fontSize:9, color:'var(--dx-red)', background:'rgba(199,92,92,0.08)', border:'1px solid rgba(199,92,92,0.2)', borderRadius:5, padding:'6px 8px' }}>⚠ RECOVERY MECHANISM — Release logic must prevent unintended activation during normal operation.</span>
            </div>
            <div className="dx-insight"><strong>ENGINEERING INSIGHT</strong>Controlled buoyancy changes can transform an underwater asset into a recoverable system.</div>
          </section>

          {/* 10 Emergency */}
          <section id="dx-emergency" className="dx-section dx-reveal">
            <div className="dx-label">10 — Emergency Recovery</div>
            <h2 className="dx-h2">Emergency Recovery — Failure to Recovery</h2>
            <p className="dx-p">The emergency recovery subsystem is intended to preserve recoverability of the underwater node following critical system conditions such as power failure or severe operational degradation. <b style={{ color:'var(--dx-yellow)' }}>PROPOSED RECOVERY CONCEPT</b> — clearly distinguished from implemented simulation.</p>
            <div className="dx-emer-timeline">
              {[
                { t:'NORMAL OPERATION', d:'Baseline monitoring', icon:'✓', cls:'succ' },
                { t:'FAULT DETECTED', d:'Anomaly flagged', icon:'⚠', cls:'fail' },
                { t:'CRITICAL STATE', d:'Device enters critical', icon:'🔴', cls:'fail' },
                { t:'EMERGENCY NOTIFICATION', d:'Alert generated', icon:'📡', cls:'rec' },
                { t:'LOCATION SUPPORT', d:'Backup power for location', icon:'📍', cls:'rec' },
                { t:'RECOVERY MODE', d:'System prepares ascent', icon:'🛟', cls:'rec' },
                { t:'ASCENT / LOCATION', d:'Ballast release → ascent', icon:'↑', cls:'succ' },
                { t:'CREW RECOVERY', d:'Surface recovery', icon:'🚤', cls:'succ' },
              ].map((s,idx) => (
                <div key={s.t} className={`dx-emer-step ${s.cls}`} style={{ opacity: emerRunning && idx>emerStep ? 0.4 : 1, transform: emerRunning && idx===emerStep ? 'scale(1.05)' : '' }}>
                  <div className="dx-emer-icon">{s.icon}</div>
                  <div className="dx-emer-title">{s.t}</div>
                  <div className="dx-emer-desc">{s.d}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:10, alignItems:'center', flexWrap:'wrap' }}>
              <button className="dx-btn primary" onClick={() => { setEmerRunning(true); setEmerStep(0); }}>{emerRunning?'Running...':'Run Failure/Recovery Simulation'}</button>
              <span style={{ fontSize:9, color:'var(--dx-text2)' }}>Scenario: Primary power unavailable → CRITICAL → Emergency notification → Location support → Ballast recovery</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center', marginTop:10, background:'var(--dx-navy)', border:'1px solid var(--dx-border)', borderRadius:8, padding:8, flexWrap:'wrap' }}>
              {['DETECT','PROTECT','NOTIFY','LOCATE','RECOVER'].map((s,i,arr) => (
                <span key={s} style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ fontSize:8, fontWeight:800, background:'var(--dx-card2)', border:'1px solid var(--dx-border)', borderRadius:5, padding:'5px 8px', color:'var(--dx-green)' }}>{s}</span>{i<arr.length-1 && <span style={{ color:'var(--dx-cyan)' }}>→</span>}</span>
              ))}
            </div>
            <div className="dx-readiness">
              {[
                { k:'POWER', v:'BACKUP READY', c:'var(--dx-green)' },
                { k:'LOCATION', v:'BEACON READY', c:'var(--dx-cyan)' },
                { k:'COMMUNICATION', v:'DEGRADED', c:'var(--dx-yellow)' },
                { k:'BUOYANCY', v:'RECOVERABLE', c:'var(--dx-green)' },
                { k:'SYSTEM HEALTH', v:'CRITICAL', c:'var(--dx-red)' },
              ].map(r => (
                <div key={r.k} className="dx-ready"><b>{r.k}</b><span style={{ color:r.c }}>{r.v}</span></div>
              ))}
            </div>
            <div style={{ marginTop:8, fontSize:9, color:'var(--dx-muted)', textAlign:'center' }}>Levels are conceptual readiness indicators — not live percentages. Implemented: monitoring &amp; alert generation. Proposed: physical ascent &amp; surface GPS.</div>
            <div className="dx-insight"><strong>ENGINEERING INSIGHT</strong>A recoverable underwater system must be designed not only to operate — but also to fail safely.</div>
          </section>

          {/* 11 Interaction Map */}
          <section id="dx-map" className="dx-section dx-reveal" style={{ background:'linear-gradient(180deg, #0f2e4a, var(--dx-card))' }}>
            <div className="dx-label">System Interaction Map</div>
            <h2 className="dx-h2">How Everything Works Together</h2>
            <p className="dx-p">The user should visually understand the entire device within 10 seconds.</p>
            <div className="dx-interact">
              {`                    ENVIRONMENT
                         ↓
                     SENSORS
                         ↓
               PROGRAMMING INTELLIGENCE
                         ↓
                 ┌───────┴───────┐
                 ↓               ↓
             SNC ANALYTICS    PRISM ROUTING
                 ↓               ↓
                 └───────┬───────┘
                         ↓
              ACOUSTIC COMMUNICATION
                         ↓
                  OTHER NODES
                         ↓
                    NETWORK

ENERGY SYSTEM → POWER DISTRIBUTION → ALL SUBSYSTEMS
LOCAL STORAGE ↕ TELEMETRY / EVENTS
EMERGENCY SYSTEM → DETECT → NOTIFY → LOCATE → RECOVER`}
              <div className="dx-interact-flow" aria-hidden>
                <i style={{ top:'12%', left:'50%', animationDelay:'0s' }} />
                <i style={{ top:'38%', left:'50%', animationDelay:'0.9s' }} />
                <i style={{ top:'62%', left:'50%', animationDelay:'1.8s' }} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:10 }}>
              <div style={{ background:'var(--dx-card2)', border:'1px solid var(--dx-border)', borderRadius:7, padding:8, textAlign:'center', fontSize:9, color:'var(--dx-text2)' }}><b style={{ color:'var(--dx-cyan)' }}>IMPLIMENTED</b><br/>React + Three.js • Network simulation • SNC • Kafka/Spark/Cassandra • Dashboard</div>
              <div style={{ background:'var(--dx-card2)', border:'1px solid var(--dx-border)', borderRadius:7, padding:8, textAlign:'center', fontSize:9, color:'var(--dx-text2)' }}><b style={{ color:'var(--dx-yellow)' }}>SIMULATED</b><br/>Telemetry • Routing decisions • Acoustic propagation • Power & buffer models</div>
              <div style={{ background:'var(--dx-card2)', border:'1px solid var(--dx-border)', borderRadius:7, padding:8, textAlign:'center', fontSize:9, color:'var(--dx-text2)' }}><b style={{ color:'var(--dx-muted)' }}>CONCEPTUAL</b><br/>Deep-ocean deployment • AUV/ROV • Real ML • Full digital twin</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
