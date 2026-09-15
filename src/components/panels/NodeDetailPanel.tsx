import type { UnderwaterDevice, NetworkLink } from '../../types';
import { formatPercent, formatLatency, formatWatts, formatDistance, deviceTypeColor, deviceSymbol, deviceTypeLabel } from '../../utils/format';

interface Props {
  device: UnderwaterDevice;
  devices: UnderwaterDevice[];
  links: NetworkLink[];
  onClose: () => void;
  flowDirection?: 'UPLINK' | 'DOWNLINK';
}

export function NodeDetailPanel({ device, devices, links, onClose, flowDirection = 'UPLINK' }: Props) {
  const deviceLinks = links.filter(
    l => l.sourceNode === device.id || l.destinationNode === device.id
  );

  const displayRoute = flowDirection === 'DOWNLINK' && device.primaryRoute.length > 1
    ? [...device.primaryRoute].reverse()
    : device.primaryRoute;
  const route = displayRoute;
  const hopIndex = route.indexOf(device.id);
  const nextHop = hopIndex >= 0 && hopIndex < route.length - 1 ? route[hopIndex + 1] : null;
  const prevHop = hopIndex > 0 ? route[hopIndex - 1] : null;
  const destination = route.length > 0 ? route[route.length - 1] : null;
  const isSource = hopIndex === 0;
  const isDestination = hopIndex === route.length - 1 && hopIndex >= 0;

  const routeCost = route.length > 1
    ? deviceLinks
        .filter(l => {
          const peer = l.sourceNode === device.id ? l.destinationNode : l.sourceNode;
          return route.includes(peer);
        })
        .reduce((sum, l) => sum + l.latencyMs * 0.4 + l.packetLoss * 20 + l.distanceMeters * 0.01, 0)
    : 0;

  const linkCosts = deviceLinks.map(l => {
    const peer = l.sourceNode === device.id ? l.destinationNode : l.sourceNode;
    const inRoute = route.includes(peer);
    const cost = l.latencyMs * 0.4 + l.packetLoss * 20 + l.distanceMeters * 0.01;
    return { peer, cost: Math.round(cost * 10) / 10, status: l.status, quality: l.signalQuality, inRoute, distance: l.distanceMeters };
  }).sort((a, b) => a.cost - b.cost);

  const purpose = device.type === 'SURFACE_RECEIVER'
    ? 'Satellite/RF uplink to shore monitoring'
    : device.type === 'GATEWAY'
    ? 'Main underwater data aggregation'
    : device.type === 'ACOUSTIC_RELAY' || device.type === 'NAVIGATION_RELAY' || device.type === 'SEAFLOOR_RELAY'
    ? 'Acoustic mesh relay node'
    : 'Underwater sensor monitoring';

  const txEnergy = (device.powerLoad * 0.6).toFixed(2);
  const rxEnergy = (device.powerLoad * 0.4).toFixed(2);

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="detail-header-left">
          <span style={{ color: deviceTypeColor(device.type), fontSize: 19.5 }}>{deviceSymbol(device.type)}</span>
          <h3>{device.id} — {device.name}</h3>
          <span className={`status-badge ${device.status.toLowerCase()}`}>{device.status}</span>
        </div>
        <button className="detail-close" onClick={onClose} aria-label="Close detail panel">x</button>
      </div>
      <div className="detail-body">
        {/* DATA CENTER special view */}
        {device.type === 'DATA_CENTER' && (
          <>
            <div className="detail-section">
              <h4>Data Center</h4>
              <div className="detail-row"><span className="detail-row-label">ID</span><span className="detail-row-value">{device.id}</span></div>
              <div className="detail-row"><span className="detail-row-label">Role</span><span className="detail-row-value" style={{ color: 'var(--accent-cyan)' }}>Terrestrial Data Processing</span></div>
              <div className="detail-row"><span className="detail-row-label">Location</span><span className="detail-row-value">On Land</span></div>
              <div className="detail-row"><span className="detail-row-label">Condition</span><span className="detail-row-value" style={{ color: device.status === 'NORMAL' ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{device.status}</span></div>
            </div>
            <div className="detail-section">
              <h4>Connections ({deviceLinks.length})</h4>
              {deviceLinks.map(link => {
                const peerId = link.sourceNode === device.id ? link.destinationNode : link.sourceNode;
                const peer = devices.find(d => d.id === peerId);
                return (
                  <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', fontSize: 11.5, borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: peer ? deviceTypeColor(peer.type) : 'var(--text-muted)' }}>{peerId}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{formatDistance(link.distanceMeters)}</span>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: link.status === 'ACTIVE' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{link.status}</span>
                  </div>
                );
              })}
            </div>
            <div className="detail-section">
              <h4>Incoming Telemetry</h4>
              <div className="detail-row"><span className="detail-row-label">Packets Received</span><span className="detail-row-value cyan">{device.packetsReceived.toLocaleString()}</span></div>
              <div className="detail-row"><span className="detail-row-label">Throughput</span><span className="detail-row-value cyan">{device.throughput.toFixed(1)} msg/s</span></div>
              <div className="detail-row"><span className="detail-row-label">Network Status</span><span className="detail-row-value" style={{ color: 'var(--accent-green)' }}>ONLINE</span></div>
            </div>
          </>
        )}

        {/* SURFACE RECEIVER special view */}
        {device.type === 'SURFACE_RECEIVER' && (
          <>
            <div className="detail-section">
              <h4>Surface Receiver</h4>
              <div className="detail-row"><span className="detail-row-label">ID</span><span className="detail-row-value">{device.id}</span></div>
              <div className="detail-row"><span className="detail-row-label">Role</span><span className="detail-row-value" style={{ color: 'var(--accent-cyan)' }}>Ocean-to-Land Gateway</span></div>
              <div className="detail-row"><span className="detail-row-label">Depth</span><span className="detail-row-value">{device.depth.toLocaleString()} m</span></div>
              <div className="detail-row"><span className="detail-row-label">Condition</span><span className="detail-row-value" style={{ color: device.status === 'NORMAL' ? 'var(--accent-green)' : device.status === 'WARNING' ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>{device.status}</span></div>
            </div>
            <div className="detail-section">
              <h4>Connections ({deviceLinks.length})</h4>
              {deviceLinks.map(link => {
                const peerId = link.sourceNode === device.id ? link.destinationNode : link.sourceNode;
                const peer = devices.find(d => d.id === peerId);
                const inRoute = route.includes(peerId);
                return (
                  <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', fontSize: 11.5, borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: peer ? deviceTypeColor(peer.type) : 'var(--text-muted)' }}>{peerId}</span>
                      {inRoute && <span style={{ fontSize: 9.5, color: 'var(--accent-cyan)', background: 'rgba(8,145,178,0.1)', padding: '0 4px', borderRadius: 2 }}>ROUTE</span>}
                      <span style={{ color: 'var(--text-muted)' }}>{formatDistance(link.distanceMeters)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: link.signalQuality > 70 ? 'var(--accent-green)' : 'var(--accent-yellow)', fontSize: 10.5 }}>{link.signalQuality.toFixed(0)}%</span>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: link.status === 'ACTIVE' ? 'var(--accent-green)' : link.status === 'DEGRADED' ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>{link.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="detail-section">
              <h4>Data Forwarding</h4>
              <div className="detail-row"><span className="detail-row-label">Packets Received</span><span className="detail-row-value cyan">{device.packetsReceived.toLocaleString()}</span></div>
              <div className="detail-row"><span className="detail-row-label">Packets Forwarded</span><span className="detail-row-value cyan">{device.packetsSent.toLocaleString()}</span></div>
              <div className="detail-row"><span className="detail-row-label">Throughput</span><span className="detail-row-value cyan">{device.throughput.toFixed(1)} msg/s</span></div>
              <div className="detail-row"><span className="detail-row-label">Signal Quality</span><span className="detail-row-value" style={{ color: device.signalStrength > 70 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{device.signalStrength.toFixed(0)}%</span></div>
              <div className="detail-row"><span className="detail-row-label">Link Latency</span><span className="detail-row-value">{formatLatency(device.latency)}</span></div>
              <div className="detail-row"><span className="detail-row-label">Destination</span><span className="detail-row-value" style={{ color: 'var(--accent-blue)' }}>{destination || '—'}</span></div>
            </div>
          </>
        )}

        {/* Generic device view for all others */}
        {device.type !== 'DATA_CENTER' && device.type !== 'SURFACE_RECEIVER' && (<>
        <div className="detail-section">
          <h4>Device</h4>
          <div className="detail-row"><span className="detail-row-label">ID</span><span className="detail-row-value">{device.id}</span></div>
          <div className="detail-row"><span className="detail-row-label">Type</span><span className="detail-row-value">{deviceTypeLabel(device.type)}</span></div>
          <div className="detail-row"><span className="detail-row-label">Purpose</span><span className="detail-row-value" style={{ fontSize: 11.5 }}>{purpose}</span></div>
          <div className="detail-row"><span className="detail-row-label">Depth</span><span className="detail-row-value">{device.depth.toLocaleString()} m</span></div>
          <div className="detail-row"><span className="detail-row-label">Condition</span><span className="detail-row-value" style={{ color: device.status === 'NORMAL' ? 'var(--accent-green)' : device.status === 'WARNING' ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>{device.status}</span></div>
        </div>

        {/* Connections */}
        <div className="detail-section">
          <h4>Connections ({deviceLinks.length})</h4>
          {deviceLinks.map(link => {
            const peerId = link.sourceNode === device.id ? link.destinationNode : link.sourceNode;
            const peer = devices.find(d => d.id === peerId);
            const inRoute = route.includes(peerId);
            return (
              <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', fontSize: 11.5, borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, color: peer ? deviceTypeColor(peer.type) : 'var(--text-muted)' }}>{peerId}</span>
                  {inRoute && <span style={{ fontSize: 9.5, color: 'var(--accent-cyan)', background: 'rgba(8,145,178,0.1)', padding: '0 4px', borderRadius: 2 }}>ROUTE</span>}
                  <span style={{ color: 'var(--text-muted)' }}>{formatDistance(link.distanceMeters)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: link.signalQuality > 70 ? 'var(--accent-green)' : 'var(--accent-yellow)', fontSize: 10.5 }}>
                    {link.signalQuality.toFixed(0)}%
                  </span>
                  <span style={{
                    fontSize: 10.5, fontWeight: 600,
                    color: link.status === 'ACTIVE' ? 'var(--accent-green)' : link.status === 'DEGRADED' ? 'var(--accent-yellow)' : 'var(--accent-red)',
                  }}>
                    {link.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Data */}
        <div className="detail-section">
          <h4>Data</h4>
          <div className="detail-row"><span className="detail-row-label">Packets Sent</span><span className="detail-row-value">{device.packetsSent.toLocaleString()}</span></div>
          <div className="detail-row"><span className="detail-row-label">Packets Received</span><span className="detail-row-value">{device.packetsReceived.toLocaleString()}</span></div>
          <div className="detail-row"><span className="detail-row-label">Packet Loss</span><span className="detail-row-value" style={{ color: device.packetLoss > 3 ? 'var(--accent-yellow)' : 'var(--text-primary)' }}>{formatPercent(device.packetLoss)}</span></div>
          <div className="detail-row"><span className="detail-row-label">Throughput</span><span className="detail-row-value cyan">{device.throughput.toFixed(1)} msg/s</span></div>
          <div className="detail-row"><span className="detail-row-label">Latency</span><span className="detail-row-value">{formatLatency(device.latency)}</span></div>
          <div className="detail-row"><span className="detail-row-label">Next Hop</span><span className="detail-row-value" style={{ color: nextHop ? 'var(--accent-green)' : 'var(--text-muted)' }}>{nextHop || '— (endpoint)'}</span></div>
          <div className="detail-row"><span className="detail-row-label">Destination</span><span className="detail-row-value" style={{ color: 'var(--accent-blue)' }}>{destination || '—'}</span></div>
        </div>

        {/* PRISM Routing */}
        <div className="detail-section">
          <h4>PRISM Routing</h4>
          <div className="detail-row">
            <span className="detail-row-label">Current Role</span>
            <span className="detail-row-value" style={{ color: 'var(--accent-cyan)' }}>
              {isSource ? (flowDirection === 'DOWNLINK' ? 'ORIGIN (DC)' : 'SOURCE') : isDestination ? (flowDirection === 'DOWNLINK' ? 'DESTINATION' : 'DESTINATION (DC)') : device.type === 'GATEWAY' ? 'GATEWAY' : 'RELAY'}
            </span>
          </div>
          {route.length > 1 && (
            <>
              <div className="detail-row"><span className="detail-row-label">Hop</span><span className="detail-row-value">{hopIndex >= 0 ? `${hopIndex + 1} / ${route.length}` : 'N/A'}</span></div>
              <div className="detail-row"><span className="detail-row-label">Previous Hop</span><span className="detail-row-value">{prevHop || '— (origin)'}</span></div>
              <div className="detail-row"><span className="detail-row-label">Route Cost</span><span className="detail-row-value" style={{ color: 'var(--accent-yellow)' }}>{routeCost.toFixed(1)}</span></div>
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 3 }}>Active PRISM Route</div>
                <div className="route-flow">
                  {route.map((id, i) => (
                    <span key={id}>
                      <span className="route-node" style={id === device.id ? { borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' } : {}}>
                        {id}
                      </span>
                      {i < route.length - 1 && <span className="route-arrow"> → </span>}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="detail-row" style={{ marginTop: 6 }}><span className="detail-row-label">Alternative Routes</span><span className="detail-row-value">{device.alternateRoutes.length}</span></div>
          {device.alternateRoutes.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {device.alternateRoutes.slice(0, 2).map((alt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)', minWidth: 20 }}>Alt {i + 1}:</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{alt.join(' → ')}</span>
                </div>
              ))}
            </div>
          )}
          {linkCosts.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 3 }}>Link Assessment</div>
              {linkCosts.map(lc => (
                <div key={lc.peer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', fontSize: 10.5 }}>
                  <span style={{ color: lc.inRoute ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontWeight: lc.inRoute ? 600 : 400 }}>
                    {lc.peer} {lc.inRoute ? '<' : ''} <span style={{ color: 'var(--text-muted)' }}>{formatDistance(lc.distance)}</span>
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{lc.cost}</span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 600,
                      color: lc.status === 'ACTIVE' ? 'var(--accent-green)' : lc.status === 'DEGRADED' ? 'var(--accent-yellow)' : 'var(--accent-red)',
                    }}>
                      {lc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>)}

        {/* Energy */}
        <div className="detail-section">
          <h4>Energy</h4>
          <div className="detail-row"><span className="detail-row-label">Primary Battery</span><span className="detail-row-value green">{formatPercent(device.primaryBattery)}</span></div>
          <div className="progress-bar"><div className="progress-fill green" style={{ width: `${device.primaryBattery}%` }} /></div>
          <div className="detail-row" style={{ marginTop: 4 }}><span className="detail-row-label">Secondary Battery</span><span className="detail-row-value" style={{ color: device.secondaryBattery > 80 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{formatPercent(device.secondaryBattery)}</span></div>
          <div className="progress-bar"><div className={`progress-fill ${device.secondaryBattery > 80 ? 'green' : 'yellow'}`} style={{ width: `${device.secondaryBattery}%` }} /></div>
          <div className="detail-row" style={{ marginTop: 4 }}><span className="detail-row-label">Current Load</span><span className="detail-row-value">{formatWatts(device.powerLoad)}</span></div>
          <div className="detail-row"><span className="detail-row-label">TX Energy</span><span className="detail-row-value">{txEnergy} W</span></div>
          <div className="detail-row"><span className="detail-row-label">RX Energy</span><span className="detail-row-value">{rxEnergy} W</span></div>
          <div className="detail-row"><span className="detail-row-label">Energy State</span><span className="detail-row-value" style={{ color: device.energyState === 'NORMAL' ? 'var(--accent-green)' : device.energyState === 'SAVING' ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>{device.energyState}</span></div>
        </div>
      </div>
    </div>
  );
}
