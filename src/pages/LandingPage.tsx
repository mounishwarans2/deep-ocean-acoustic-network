import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AboutDevice from './AboutDevice';
import './LandingPage.css';
import prismPhoto from '../assets/components/prism-routing.jpg';
import sncAnalytics from '../assets/components/snc-analytics.jpg';
import processorCpu from '../assets/components/processor-cpu.jpg';
import energyDistribution from '../assets/components/energy-distribution.jpg';
import sensorNetwork from '../assets/components/sensor-network.jpg';

const COMPONENTS = [
  { id: 'ai', title: 'PROGRAMMING INTELLIGENCE', desc: 'Analyzes network conditions, monitors device health, detects failures and supports intelligent communication decisions.', img: '/ai-intelligence.jpg', alt: 'PROGRAMMING INTELLIGENCE', bg: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0d1f3c 100%)', fullImage: true },
  { id: 'prism', title: 'PRISM Routing Engine', desc: 'Selects the most suitable communication route based on network conditions, link quality, distance and device availability.', img: prismPhoto, alt: 'PRISM routing diagram', bg: 'linear-gradient(135deg, #0d1a2e 0%, #1e3050 50%, #0a1525 100%)', fullImage: true },
  { id: 'snc', title: 'Stochastic Network Calculus', desc: 'Analyzes network delay, traffic intensity, backlog, service rate and communication stability.', img: sncAnalytics, alt: 'Stochastic network calculus analytics', bg: 'linear-gradient(135deg, #0a1825 0%, #152840 50%, #0d1a2a 100%)', fullImage: true },
  { id: 'proc', title: 'Processing Unit', desc: 'Processes sensor information, communication data and network intelligence locally inside the underwater device.', img: processorCpu, alt: 'Processing unit CPU', bg: 'linear-gradient(135deg, #1a0a20 0%, #2a1535 50%, #150a1a 100%)', fullImage: true },
  { id: 'acoustic', title: 'Acoustic Communication Module', desc: 'Transmits and receives data underwater using acoustic signals across variable ocean conditions.', img: '/acoustic.jpg', alt: 'Acoustic Communication', bg: 'linear-gradient(135deg, #0a1a28 0%, #152a45 50%, #0d1828 100%)', fullImage: true },
  { id: 'energy', title: 'Energy Distribution System', desc: 'Manages power distribution between the primary energy source, secondary battery and device components.', img: energyDistribution, alt: 'Energy distribution system', bg: 'linear-gradient(135deg, #1a1508 0%, #2a2510 50%, #1a1508 100%)', fullImage: true },
  { id: 'longpower', title: 'Long-Duration Power System', desc: 'Provides continuous power for long-term deep-ocean operation. Advanced conceptual long-duration power architecture.', img: '/longpower.jpg', alt: 'Betavolt Nuclear Battery', bg: 'linear-gradient(135deg, #0a0f1e 0%, #151a2a 50%, #0a0f1e 100%)', fullImage: true },
  { id: 'sensors', title: 'Underwater Sensor Network', desc: 'Collects environmental, acoustic and communication data from distributed ocean locations.', img: sensorNetwork, alt: 'Underwater sensor network', bg: 'linear-gradient(135deg, #051520 0%, #0a2030 50%, #051520 100%)', fullImage: true },
];

const BADGES = [
  'PROGRAMMING INTELLIGENCE', 'PRISM Routing', 'SNC Analytics',
  'Acoustic Communication', 'Adaptive Routing', 'Deep Ocean Monitoring',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const sectionsRef = useRef<HTMLDivElement>(null);

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const container = sectionsRef.current;
    if (!container) return;
    const targets = container.querySelectorAll('.lp-fade-in');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('lp-visible'); });
    }, { threshold: 0.15 });
    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing-page" ref={sectionsRef}>
      <nav className="lp-nav">
        <button className="lp-login-btn" onClick={() => navigate('/login')}>LOGIN</button>
        <button className="lp-login-btn" onClick={() => navigate('/login?mode=signup')}>SIGN UP</button>
      </nav>

      <section className="lp-hero">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="lp-particle" style={{ left: `${10 + i * 11}%`, animationDelay: `${i * 1.2}s` }} />
        ))}

        <svg className="lp-hero-svg" viewBox="0 0 800 600" fill="none">
          <circle cx="400" cy="200" r="3" fill="rgba(0,229,255,0.25)" />
          <circle cx="200" cy="350" r="2.5" fill="rgba(0,229,255,0.2)" />
          <circle cx="600" cy="300" r="2.5" fill="rgba(0,229,255,0.2)" />
          <circle cx="350" cy="450" r="2" fill="rgba(0,229,255,0.15)" />
          <circle cx="500" cy="400" r="2" fill="rgba(0,229,255,0.15)" />
          <circle cx="150" cy="200" r="2" fill="rgba(0,229,255,0.12)" />
          <circle cx="650" cy="150" r="2" fill="rgba(0,229,255,0.12)" />
          <line x1="400" y1="200" x2="200" y2="350" stroke="rgba(0,229,255,0.08)" strokeWidth="1" />
          <line x1="400" y1="200" x2="600" y2="300" stroke="rgba(0,229,255,0.08)" strokeWidth="1" />
          <line x1="200" y1="350" x2="350" y2="450" stroke="rgba(0,229,255,0.06)" strokeWidth="1" />
          <line x1="600" y1="300" x2="500" y2="400" stroke="rgba(0,229,255,0.06)" strokeWidth="1" />
          <line x1="150" y1="200" x2="400" y2="200" stroke="rgba(0,229,255,0.05)" strokeWidth="1" />
          <line x1="650" y1="150" x2="400" y2="200" stroke="rgba(0,229,255,0.05)" strokeWidth="1" />
        </svg>

        <div className="lp-hero-content">
          <h1 className="lp-hero-title">DEEP OCEAN INTELLIGENT COMMUNICATION NETWORK</h1>
          <p className="lp-hero-subtitle">
            Programming-Powered Underwater Acoustic Communication, Adaptive PRISM Routing and Stochastic Network Calculus Analytics.
          </p>
          <div className="lp-hero-buttons">
            <button className="lp-btn-primary" onClick={() => navigate('/login')}>EXPLORE NETWORK</button>
            <button className="lp-btn-primary" onClick={() => document.getElementById('components')?.scrollIntoView({ behavior: 'smooth' })}>VIEW TECHNOLOGY</button>
          </div>
          <div className="lp-badge-row">
            {BADGES.map((b) => <span key={b} className="lp-badge">{b}</span>)}
          </div>
        </div>

        <button
          className="lp-scroll-down"
          onClick={() => document.getElementById('components')?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="Scroll down to core system components"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true">
            <path d="M4 9 L12 17 L20 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      <section className="lp-section lp-components" id="components">
        <h2 className="lp-section-title lp-fade-in">CORE SYSTEM COMPONENTS</h2>
        <p className="lp-section-subtitle lp-fade-in">
          An integrated intelligent system designed for reliable deep-ocean communication and long-duration autonomous operation.
        </p>
        <div className="lp-card-grid">
          {COMPONENTS.map((c) => (
            <div key={c.id} className="lp-card lp-fade-in">
              <div className={`lp-card-img ${c.fullImage ? 'lp-card-img-full' : ''}`} style={c.fullImage ? {} : { background: c.bg }}>
                <img src={c.img} alt={c.alt} className={`lp-card-icon-img ${c.fullImage ? 'lp-card-icon-img-full' : ''}`} draggable={false} />
              </div>
              <h3 className="lp-card-title">{c.title}</h3>
              <p className="lp-card-desc">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section" style={{ background: 'var(--bg-primary)', padding: '40px 20px' }}>
        <AboutDevice />
      </section>

      <section className="lp-section lp-architecture" id="architecture">
        <h2 className="lp-section-title lp-fade-in">HOW THE NETWORK COMMUNICATES</h2>
        <p className="lp-section-subtitle lp-fade-in">
          Data flows from ocean to shore through a hierarchical network of sensors, sub-nodes, main node and surface receiver to land data center.
        </p>
        <div className="lp-flow-diagram lp-fade-in">
          <div className="lp-flow-box">Underwater Sensors</div>
          <div className="lp-flow-arrow">&#10132;</div>
          <div className="lp-flow-box">Sub-Nodes (&#945; &#946; &#947; &#948;)</div>
          <div className="lp-flow-arrow">&#10132;</div>
          <div className="lp-flow-box lp-flow-main">Main Node</div>
          <div className="lp-flow-arrow">&#10132;</div>
          <div className="lp-flow-box-row">
            <div className="lp-flow-box">Surface Receiver</div>
            <div className="lp-flow-box lp-flow-land">Land Data Center</div>
          </div>
        </div>

        <div className="lp-adaptive-section lp-fade-in">
          <h3 className="lp-adaptive-title">ADAPTIVE ROUTING</h3>
          <p className="lp-adaptive-desc">
            The PRISM Routing Engine dynamically selects optimal paths. When a node fails, traffic is automatically rerouted through alternative sub-nodes, maintaining connectivity and minimizing packet loss in the deep-ocean environment.
          </p>
          <svg className="lp-reroute-svg" viewBox="0 0 600 120" fill="none">
            <rect x="10" y="40" width="100" height="40" rx="6" fill="rgba(0,229,255,0.1)" stroke="rgba(0,229,255,0.3)" strokeWidth="1" />
            <text x="60" y="65" textAnchor="middle" fill="#00e5ff" fontSize="10" fontWeight="600">Source</text>
            <rect x="230" y="10" width="100" height="35" rx="6" fill="rgba(0,229,255,0.1)" stroke="rgba(0,229,255,0.3)" strokeWidth="1" />
            <text x="280" y="32" textAnchor="middle" fill="#00e5ff" fontSize="9" fontWeight="600">Node A</text>
            <rect x="230" y="75" width="100" height="35" rx="6" fill="rgba(0,229,255,0.1)" stroke="rgba(0,229,255,0.3)" strokeWidth="1" />
            <text x="280" y="97" textAnchor="middle" fill="#00e5ff" fontSize="9" fontWeight="600">Node B</text>
            <rect x="470" y="40" width="100" height="40" rx="6" fill="rgba(0,229,255,0.1)" stroke="rgba(0,229,255,0.3)" strokeWidth="1" />
            <text x="520" y="65" textAnchor="middle" fill="#00e5ff" fontSize="10" fontWeight="600">Dest</text>
            <line x1="110" y1="50" x2="230" y2="28" stroke="rgba(0,229,255,0.4)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="110" y1="60" x2="230" y2="93" stroke="#00e5ff" strokeWidth="2" />
            <line x1="330" y1="28" x2="470" y2="50" stroke="rgba(0,229,255,0.2)" strokeWidth="1" strokeDasharray="2 4" />
            <line x1="330" y1="93" x2="470" y2="60" stroke="#00e5ff" strokeWidth="2" />
            <text x="185" y="18" fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">FAILED</text>
            <circle cx="175" cy="28" r="8" fill="none" stroke="rgba(255,80,80,0.5)" strokeWidth="1.5" />
            <line x1="169" y1="22" x2="181" y2="34" stroke="rgba(255,80,80,0.5)" strokeWidth="1.5" />
            <line x1="181" y1="22" x2="169" y2="34" stroke="rgba(255,80,80,0.5)" strokeWidth="1.5" />
            <circle cx="140" cy="93" r="3" fill="#00e5ff" className="lp-route-pulse" />
            <circle cx="190" cy="93" r="3" fill="#00e5ff" className="lp-route-pulse" style={{ animationDelay: '0.4s' }} />
            <circle cx="240" cy="93" r="3" fill="#00e5ff" className="lp-route-pulse" style={{ animationDelay: '0.8s' }} />
            <circle cx="380" cy="93" r="3" fill="#00e5ff" className="lp-route-pulse" style={{ animationDelay: '1.2s' }} />
            <circle cx="430" cy="93" r="3" fill="#00e5ff" className="lp-route-pulse" style={{ animationDelay: '1.6s' }} />
          </svg>
        </div>
      </section>

      <section className="lp-section lp-cta">
        <h2 className="lp-section-title lp-fade-in">INTELLIGENT COMMUNICATION FOR THE DEEP OCEAN</h2>
        <p className="lp-section-subtitle lp-fade-in">
          A next-generation underwater communication concept combining acoustic networking, programming intelligence, adaptive routing and advanced network analytics.
        </p>
        <div className="lp-hero-buttons lp-fade-in">
          <button className="lp-btn-primary" onClick={() => navigate('/login')}>LAUNCH DASHBOARD</button>
          <button className="lp-btn-outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>BACK TO TOP</button>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-title">Deep Ocean Intelligent Communication Network</div>
        <div className="lp-footer-sub">Research &bull; Innovation &bull; Underwater Intelligence</div>
      </footer>

      {showBackToTop && (
        <button className="lp-back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
          &#8593;
        </button>
      )}
    </div>
  );
}
