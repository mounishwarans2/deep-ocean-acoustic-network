import { useState } from 'react';
import type { SimulationState } from '../hooks/useSimulation';
import { NetworkTopology } from '../components/topology/NetworkTopology';
import { NodeDetailPanel } from '../components/panels/NodeDetailPanel';
import { MiniChart } from '../components/charts/MiniChart';
import { formatPercent, formatLatency, formatDecimal, deviceTypeColor, deviceSymbol } from '../utils/format';

interface Props {
  state: SimulationState;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
}

export function OverviewPage({ state, selectedDeviceId, onSelectDevice }: Props) {
  const { devices, links, snc, alerts, historySignalQuality, historyThroughput, historyLatency, pipeline } = state;
  const [flowDirection, setFlowDirection] = useState<'UPLINK' | 'DOWNLINK'>('UPLINK');
  const selectedDevice = selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) : null;
  const activeLinks = links.filter(l => l.status === 'ACTIVE').length;
  const avgLatency = devices.reduce((s, d) => s + d.latency, 0) / devices.length;
  const avgLoss = devices.reduce((s, d) => s + d.packetLoss, 0) / devices.length;
  const avgBattery = devices.reduce((s, d) => s + d.secondaryBattery, 0) / devices.length;

  return (
    <div>
      {/* KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: 10 }}>
        <div className="stat-card">
          <div className="stat-label">Active Devices</div>
          <div className="stat-value blue">{devices.length}</div>
          <div className="stat-sub">{devices.filter(d => d.type.includes('RELAY') || d.type === 'GATEWAY' || d.type === 'SURFACE_RECEIVER').length} infrastructure &middot; {devices.filter(d => d.type === 'HYDROPHONE' || d.type === 'ENVIRONMENTAL_SENSOR').length} sensors</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Links</div>
          <div className="stat-value cyan">{activeLinks}/{links.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Throughput</div>
          <div className="stat-value">{formatDecimal(snc.throughput)} msg/s</div>
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
          <div className={`stat-value ${snc.stability === 'STABLE' ? 'green' : snc.stability === 'WARNING' ? 'yellow' : 'red'}`}>{snc.stability}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Primary Power</div>
          <div className="stat-value green">{formatPercent(devices.reduce((s, d) => s + d.primaryBattery, 0) / devices.length)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Secondary Energy</div>
          <div className={`stat-value ${avgBattery > 80 ? 'green' : 'yellow'}`}>{formatPercent(avgBattery)}</div>
        </div>
      </div>

      {/* Deployment Map — full width */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Ocean Deployment Map</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setFlowDirection('UPLINK')}
                style={{
                  padding: '3px 10px', fontSize: 9, fontWeight: 600, borderRadius: 3, cursor: 'pointer',
                  border: flowDirection === 'UPLINK' ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                  background: flowDirection === 'UPLINK' ? 'rgba(8,145,178,0.1)' : 'transparent',
                  color: flowDirection === 'UPLINK' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                }}
              >
                ↑ Uplink
              </button>
              <button
                onClick={() => setFlowDirection('DOWNLINK')}
                style={{
                  padding: '3px 10px', fontSize: 9, fontWeight: 600, borderRadius: 3, cursor: 'pointer',
                  border: flowDirection === 'DOWNLINK' ? '1px solid var(--accent-yellow)' : '1px solid var(--border)',
                  background: flowDirection === 'DOWNLINK' ? 'rgba(217,119,6,0.1)' : 'transparent',
                  color: flowDirection === 'DOWNLINK' ? 'var(--accent-yellow)' : 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                }}
              >
                ↓ Downlink
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 9, color: 'var(--text-muted)' }}>
              {(['SURFACE_RECEIVER', 'GATEWAY', 'ACOUSTIC_RELAY', 'NAVIGATION_RELAY', 'SEAFLOOR_RELAY', 'HYDROPHONE', 'ENVIRONMENTAL_SENSOR'] as const).map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ color: deviceTypeColor(t), fontSize: 8 }}>{deviceSymbol(t)}</span>
                  {t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).split(' ').slice(0, 1)}
                </span>
              ))}
            </div>
          </div>
        </div>
        <NetworkTopology
          devices={devices} links={links}
          selectedDeviceId={selectedDeviceId} onSelectDevice={onSelectDevice}
          flowDirection={flowDirection}
        />
      </div>

      {/* Selected Device Panel — below map */}
      {selectedDevice && (
        <NodeDetailPanel device={selectedDevice} devices={devices} links={links} onClose={() => onSelectDevice(null)} flowDirection={flowDirection} />
      )}

      {/* Analytics — below map */}
      <div className="page-grid-3" style={{ marginTop: 10 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Signal Quality</span></div>
          <MiniChart data={historySignalQuality} color="var(--accent-cyan)" height={48} />
          <div style={{ textAlign: 'right', fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{formatPercent(historySignalQuality[historySignalQuality.length - 1]?.value || 0)}</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Throughput</span></div>
          <MiniChart data={historyThroughput} color="var(--accent-blue)" height={48} />
          <div style={{ textAlign: 'right', fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{formatDecimal(historyThroughput[historyThroughput.length - 1]?.value || 0)} msg/s</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Latency</span></div>
          <MiniChart data={historyLatency} color="var(--accent-yellow)" height={48} />
          <div style={{ textAlign: 'right', fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{formatLatency(historyLatency[historyLatency.length - 1]?.value || 0)}</div>
        </div>
      </div>

      {/* System Status + Alerts */}
      <div className="page-grid-2" style={{ marginTop: 10 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">System Status</span></div>
          {[
            { name: 'Kafka', online: pipeline.kafka },
            { name: 'Spark', online: pipeline.spark },
            { name: 'Scala', online: pipeline.scala },
            { name: 'Cassandra', online: pipeline.cassandra },
            { name: 'API', online: pipeline.api },
          ].map(p => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
              <span style={{ color: p.online ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 9 }}>{p.online ? '● ONLINE' : '● OFFLINE'}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Alerts</span></div>
          {alerts.filter(a => a.severity !== 'INFO').length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--accent-green)', textAlign: 'center', padding: 6 }}>All systems nominal</div>
          ) : alerts.filter(a => a.severity !== 'INFO').slice(0, 3).map(a => (
            <div key={a.id} className={`alert-item ${a.severity.toLowerCase()}`} style={{ marginBottom: 5 }}>
              <div className="alert-content">
                <div className="alert-message">{a.message}</div>
                <div className="alert-details">{a.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
