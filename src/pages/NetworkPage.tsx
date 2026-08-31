import type { SimulationState } from '../hooks/useSimulation';
import { NetworkTopology } from '../components/topology/NetworkTopology';
import { NodeDetailPanel } from '../components/panels/NodeDetailPanel';

interface Props {
  state: SimulationState;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
}

export function NetworkPage({ state, selectedDeviceId, onSelectDevice }: Props) {
  const { devices, links } = state;
  const selectedDevice = selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) : null;
  const relayCount = devices.filter(d => d.type.includes('RELAY') || d.type === 'GATEWAY').length;
  const sensorCount = devices.filter(d => !d.type.includes('RELAY') && d.type !== 'GATEWAY').length;

  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Ocean Deployment Topology</span>
          <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--text-muted)' }}>
            <span><span style={{ color: 'var(--accent-blue)' }}>●</span> Sensor ({sensorCount})</span>
            <span><span style={{ color: 'var(--accent-yellow)' }}>◉</span> Relay ({relayCount})</span>
          </div>
        </div>
        <NetworkTopology
          devices={devices}
          links={links}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={onSelectDevice}
        />
      </div>

      {selectedDevice && (
        <NodeDetailPanel device={selectedDevice} devices={devices} links={links} onClose={() => onSelectDevice(null)} />
      )}
    </div>
  );
}
