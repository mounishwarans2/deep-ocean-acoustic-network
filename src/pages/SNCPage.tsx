import type { SimulationState } from '../hooks/useSimulation';
import { MiniChart } from '../components/charts/MiniChart';
import { formatDecimal, formatLatency, formatPercent } from '../utils/format';

interface Props {
  state: SimulationState;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
}

export function SNCPage({ state }: Props) {
  const { snc, historyLatency, historyTrafficIntensity, historyPacketLoss } = state;
  const rhoColor = snc.trafficIntensity > 0.95 ? 'red' : snc.trafficIntensity > 0.80 ? 'yellow' : 'green';

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Stochastic Network Calculus</span>
          <span className={`status-badge ${snc.stability === 'STABLE' ? 'normal' : snc.stability === 'WARNING' ? 'warning' : 'critical'}`}>{snc.stability}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><div className="big-metric-label">Arrival Rate (λ)</div><div className="big-metric">{formatDecimal(snc.arrivalRate)} msg/s</div></div>
          <div><div className="big-metric-label">Service Rate (μ)</div><div className="big-metric" style={{ color: 'var(--accent-green)' }}>{formatDecimal(snc.serviceRate)} msg/s</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
          <div className="stat-card"><div className="stat-label">Traffic Intensity (ρ)</div><div className={`stat-value ${rhoColor}`}>{snc.trafficIntensity.toFixed(2)}</div><div className="stat-sub">ρ = λ / μ</div></div>
          <div className="stat-card"><div className="stat-label">Average Delay</div><div className="stat-value">{formatLatency(snc.averageDelay)}</div></div>
          <div className="stat-card"><div className="stat-label">Delay Bound</div><div className="stat-value yellow">{formatLatency(snc.delayBound)}</div></div>
          <div className="stat-card"><div className="stat-label">Backlog</div><div className="stat-value blue">{snc.backlog} pkts</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
          <div className="stat-card">
            <div className="stat-label">Buffer Utilization</div>
            <div className="stat-value">{snc.bufferUtilization}%</div>
            <div className="progress-bar"><div className={`progress-fill ${snc.bufferUtilization > 80 ? 'red' : snc.bufferUtilization > 60 ? 'yellow' : 'green'}`} style={{ width: `${snc.bufferUtilization}%` }} /></div>
          </div>
          <div className="stat-card"><div className="stat-label">Throughput</div><div className="stat-value cyan">{formatDecimal(snc.throughput)} msg/s</div></div>
          <div className="stat-card"><div className="stat-label">Packet Loss</div><div className={`stat-value ${snc.packetLoss > 3 ? 'yellow' : 'green'}`}>{formatPercent(snc.packetLoss)}</div></div>
        </div>
      </div>

      <div className="page-grid-3">
        <div className="card">
          <div className="card-header"><span className="card-title">Traffic Intensity Over Time</span></div>
          <MiniChart data={historyTrafficIntensity} color="var(--accent-blue)" height={60} showDots />
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Delay Over Time</span></div>
          <MiniChart data={historyLatency} color="var(--accent-yellow)" height={60} showDots />
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Packet Loss Over Time</span></div>
          <MiniChart data={historyPacketLoss} color="var(--accent-red)" height={60} showDots />
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">SNC Stability Conditions</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'ρ < 0.80 (Stable)', check: snc.trafficIntensity < 0.80, value: `ρ = ${snc.trafficIntensity.toFixed(3)}` },
            { label: '0.80 ≤ ρ < 0.95 (Warning)', check: snc.trafficIntensity >= 0.80 && snc.trafficIntensity < 0.95, value: snc.trafficIntensity >= 0.80 && snc.trafficIntensity < 0.95 ? `ρ = ${snc.trafficIntensity.toFixed(3)}` : '—', highlight: snc.trafficIntensity >= 0.80 && snc.trafficIntensity < 0.95 },
            { label: 'ρ ≥ 0.95 (Critical)', check: snc.trafficIntensity >= 0.95, value: snc.trafficIntensity >= 0.95 ? `ρ = ${snc.trafficIntensity.toFixed(3)}` : '—', highlight: snc.trafficIntensity >= 0.95 },
            { label: 'Service Rate > Arrival Rate', check: snc.serviceRate > snc.arrivalRate, value: `${snc.serviceRate.toFixed(1)} > ${snc.arrivalRate.toFixed(1)}` },
            { label: 'Average Delay < Delay Bound', check: snc.averageDelay < snc.delayBound, value: `${snc.averageDelay.toFixed(0)}ms < ${snc.delayBound.toFixed(0)}ms` },
            { label: 'Buffer Utilization < 80%', check: snc.bufferUtilization < 80, value: `${snc.bufferUtilization}%` },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 10px', borderRadius: 4, fontSize: 12.5,
              background: (item as { highlight?: boolean }).highlight ? 'rgba(217,119,6,0.06)' : item.check ? 'rgba(22,163,74,0.04)' : 'transparent',
              border: `1px solid ${(item as { highlight?: boolean }).highlight ? 'rgba(217,119,6,0.15)' : 'var(--border-light)'}`,
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</span>
                <span style={{ color: item.check ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 14 }}>{item.check ? '✓' : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
