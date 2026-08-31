import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../hooks/useSimulation';
import { NetworkTopology } from '../components/topology/NetworkTopology';
import { MiniChart } from '../components/charts/MiniChart';
import { formatPercent, formatLatency, formatDecimal } from '../utils/format';
import './SystemFailurePage.css';

export default function SystemFailurePage() {
  const navigate = useNavigate();
  const { state } = useSimulation();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [flowDirection] = useState<'UPLINK' | 'DOWNLINK'>('UPLINK');

  if (!state) return <div className="sf-loading">Loading...</div>;

  const { devices, links, snc, historySignalQuality, historyThroughput, historyLatency, pipeline } = state;

  // Only MN-01 is critical, everything else stays normal
  const criticalDevices = devices.map(d => {
    if (d.id === 'MN-01') {
      return { ...d, primaryBattery: 0, status: 'CRITICAL' as const, secondaryBattery: 0, packetLoss: 95, latency: 5000 };
    }
    // Reroute sub-nodes through MN-02 instead of MN-01
    const subNodes = ['SUB-A', 'SUB-B', 'SUB-C', 'SUB-D'];
    if (subNodes.includes(d.id) && d.primaryRoute) {
      const newRoute = d.primaryRoute.map(n => n === 'MN-01' ? 'MN-02' : n);
      // Ensure MN-02 is in the route path if it wasn't before
      if (!newRoute.includes('MN-02')) {
        newRoute.splice(newRoute.length - 1, 0, 'MN-02');
      }
      return { ...d, primaryRoute: newRoute };
    }
    return d;
  });

  // Fail all links connected to MN-01, reroute sub-nodes to MN-02
  const criticalLinks = links.map(l => {
    // Fail any link that involves MN-01
    if (l.sourceNode === 'MN-01' || l.destinationNode === 'MN-01') {
      return { ...l, status: 'FAILED' as const };
    }
    // Reroute sub-nodes (SUB-A, SUB-B, SUB-C, SUB-D) to MN-02 if not already connected
    const subNodes = ['SUB-A', 'SUB-B', 'SUB-C', 'SUB-D'];
    const isSubToMn02 = subNodes.includes(l.sourceNode) && l.destinationNode === 'MN-02'
      || subNodes.includes(l.destinationNode) && l.sourceNode === 'MN-02';
    if (isSubToMn02) {
      return { ...l, status: 'ACTIVE' as const };
    }
    return l;
  });

  // Add new links from sub-nodes to MN-02 if they don't exist
  const existingLinks = new Set(criticalLinks.map(l => [l.sourceNode, l.destinationNode].sort().join('-')));
  const subNodes = ['SUB-A', 'SUB-B', 'SUB-C', 'SUB-D'];
  subNodes.forEach(sub => {
    const key = [sub, 'MN-02'].sort().join('-');
    if (!existingLinks.has(key)) {
      criticalLinks.push({
        id: `fail-${sub}-MN-02`,
        sourceNode: sub,
        destinationNode: 'MN-02',
        status: 'ACTIVE',
        latencyMs: 45,
        throughput: 85,
        distanceMeters: 350000,
        signalStrength: -55,
        signalQuality: 85,
        packetLoss: 0.5,
      });
    }
  });

  const criticalAlerts = [
    { id: 'c1', severity: 'CRITICAL' as const, message: 'PRIMARY POWER FAILURE — MN-01', details: 'Micro nuclear battery has ceased output. Device is offline. Failover to MN-02 initiated.', timestamp: Date.now(), acknowledged: false },
    { id: 'c2', severity: 'CRITICAL' as const, message: 'LINK FAILED — SUB-A to MN-01', details: 'Communication link down. Route rerouted through MN-02.', timestamp: Date.now() - 15000, acknowledged: false },
    { id: 'c3', severity: 'CRITICAL' as const, message: 'LINK FAILED — SUB-B to MN-01', details: 'Communication link down. Route rerouted through MN-02.', timestamp: Date.now() - 30000, acknowledged: false },
    { id: 'c4', severity: 'CRITICAL' as const, message: 'LINK FAILED — SUB-C to MN-01', details: 'Communication link down. Route rerouted through MN-02.', timestamp: Date.now() - 45000, acknowledged: false },
    { id: 'c5', severity: 'CRITICAL' as const, message: 'LINK FAILED — SUB-D to MN-01', details: 'Communication link down. Route rerouted through MN-02.', timestamp: Date.now() - 60000, acknowledged: false },
  ];

  const activeLinks = criticalLinks.filter(l => l.status === 'ACTIVE').length;
  const avgLatency = criticalDevices.reduce((s, d) => s + d.latency, 0) / criticalDevices.length;
  const avgLoss = criticalDevices.reduce((s, d) => s + d.packetLoss, 0) / criticalDevices.length;
  const avgBattery = criticalDevices.reduce((s, d) => s + d.secondaryBattery, 0) / criticalDevices.length;

  return (
    <div className="sf-page">
      <div className="sf-header">
        <button className="sf-back" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
        <div className="sf-header-title">
          <span className="sf-critical-dot" />
          SYSTEM FAILURE — CRITICAL CONDITION
        </div>
      </div>

      {/* Critical Banner */}
      <div className="sf-banner">
        <div className="sf-banner-icon">⚠</div>
        <div className="sf-banner-content">
          <div className="sf-banner-title">PRIMARY POWER FAILURE DETECTED</div>
          <div className="sf-banner-desc">Micro nuclear battery MN-01 has ceased output. All devices operating on emergency reserves. Immediate recovery required.</div>
        </div>
      </div>

      {/* KPI Cards — Alert on MN-01 only */}
      <div className="stat-grid" style={{ marginBottom: 10 }}>
        <div className="stat-card">
          <div className="stat-label">Active Devices</div>
          <div className="stat-value green">{criticalDevices.length - 1}/{criticalDevices.length}</div>
          <div className="stat-sub" style={{ color: 'var(--accent-red)' }}>MN-01 OFFLINE</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Links</div>
          <div className="stat-value cyan">{activeLinks}/{criticalLinks.length}</div>
          <div className="stat-sub" style={{ color: 'var(--accent-red)' }}>{criticalLinks.length - activeLinks} LINKS FAILED</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Throughput</div>
          <div className="stat-value">{formatDecimal(snc.throughput * 0.85)} msg/s</div>
          <div className="stat-sub" style={{ color: 'var(--accent-yellow)' }}>SLIGHTLY DEGRADED</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Latency</div>
          <div className="stat-value">{formatLatency(avgLatency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Packet Loss</div>
          <div className={`stat-value ${avgLoss > 3 ? 'yellow' : 'green'}`}>{formatPercent(avgLoss)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">SNC Status</div>
          <div className="stat-value yellow">WARNING</div>
          <div className="stat-sub" style={{ color: 'var(--accent-yellow)' }}>FAILOVER ACTIVE</div>
        </div>
        <div className="stat-card sf-stat-critical">
          <div className="stat-label">Primary Power</div>
          <div className="stat-value red">0%</div>
          <div className="stat-sub" style={{ color: 'var(--accent-red)' }}>MN-01 FAILURE</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Secondary Energy</div>
          <div className="stat-value green">{formatPercent(avgBattery)}</div>
        </div>
      </div>

      {/* Map with MN-01 blinking red */}
      <div className="card sf-map-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title" style={{ color: 'var(--accent-red)' }}>⚠ OCEAN DEPLOYMENT MAP — MN-01 FAILURE</span>
        </div>
        <div className="sf-map-wrapper">
          <NetworkTopology
            devices={criticalDevices} links={criticalLinks}
            selectedDeviceId={selectedDeviceId} onSelectDevice={setSelectedDeviceId}
            flowDirection={flowDirection}
          />
          <div className="sf-map-overlay" />
        </div>
      </div>

      {/* Charts */}
      <div className="page-grid-3" style={{ marginTop: 10 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Signal Quality</span></div>
          <MiniChart data={historySignalQuality.map(d => ({ ...d, value: Math.max(d.value - 8, 20) }))} color="var(--accent-cyan)" height={48} />
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Throughput</span></div>
          <MiniChart data={historyThroughput.map(d => ({ ...d, value: d.value * 0.85 }))} color="var(--accent-blue)" height={48} />
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Latency</span></div>
          <MiniChart data={historyLatency.map(d => ({ ...d, value: d.value + 60 }))} color="var(--accent-yellow)" height={48} />
        </div>
      </div>

      {/* System Status + Critical Alerts */}
      <div className="page-grid-2" style={{ marginTop: 10 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">System Status</span></div>
          {[
            { name: 'Kafka', online: true },
            { name: 'Spark', online: true },
            { name: 'Scala', online: pipeline.scala },
            { name: 'Cassandra', online: true },
            { name: 'API', online: pipeline.api },
          ].map(p => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
              <span style={{ color: p.online ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 9 }}>{p.online ? '● ONLINE' : '● OFFLINE'}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '6px 0', borderTop: '1px solid var(--border)', fontSize: 11 }}>
            <span style={{ color: 'var(--text-secondary)' }}>MN-01 </span>
            <span style={{ color: 'var(--accent-red)', fontSize: 9 }}>● OFFLINE</span>
          </div>
          <div style={{ fontSize: 11, padding: '2px 0' }}>
            <span style={{ color: 'var(--text-secondary)' }}>MN-02 </span>
            <span style={{ color: 'var(--accent-green)', fontSize: 9 }}>● ONLINE (FAILOVER)</span>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Critical Alerts</span></div>
          {criticalAlerts.map(a => (
            <div key={a.id} className="alert-item critical" style={{ marginBottom: 5 }}>
              <div className="alert-content">
                <div className="alert-message" style={{ color: 'var(--accent-red)' }}>{a.message}</div>
                <div className="alert-details">{a.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
