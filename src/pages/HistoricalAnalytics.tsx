import { useState } from 'react';
import type { SimulationState } from '../hooks/useSimulation';
import type { HistoryPoint } from '../types';
import { MiniChart } from '../components/charts/MiniChart';
import { formatPercent, formatLatency, formatDecimal } from '../utils/format';

interface Props {
  state: SimulationState;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
}

type TimeRange = '1min' | '5min' | '15min' | '1hr';

const TIME_RANGES: { id: TimeRange; label: string; points: number }[] = [
  { id: '1min', label: '1 min', points: 20 },
  { id: '5min', label: '5 min', points: 100 },
  { id: '15min', label: '15 min', points: 120 },
  { id: '1hr', label: '1 hr', points: 120 },
];

function sliceHistory(data: HistoryPoint[], maxPoints: number): HistoryPoint[] {
  return data.length > maxPoints ? data.slice(data.length - maxPoints) : data;
}

function latestValue(data: HistoryPoint[]): number {
  return data.length > 0 ? data[data.length - 1].value : 0;
}

function avgValue(data: HistoryPoint[]): number {
  if (data.length === 0) return 0;
  return data.reduce((s, d) => s + d.value, 0) / data.length;
}

function minValue(data: HistoryPoint[]): number {
  if (data.length === 0) return 0;
  return Math.min(...data.map(d => d.value));
}

function maxValue(data: HistoryPoint[]): number {
  if (data.length === 0) return 0;
  return Math.max(...data.map(d => d.value));
}

export function HistoricalAnalytics({ state }: Props) {
  const [range, setRange] = useState<TimeRange>('5min');
  const maxPoints = TIME_RANGES.find(r => r.id === range)?.points ?? 100;

  const latency = sliceHistory(state.historyLatency, maxPoints);
  const packetLoss = sliceHistory(state.historyPacketLoss, maxPoints);
  const trafficIntensity = sliceHistory(state.historyTrafficIntensity, maxPoints);
  const battery = sliceHistory(state.historyBattery, maxPoints);
  const throughput = sliceHistory(state.historyThroughput, maxPoints);
  const signalQuality = sliceHistory(state.historySignalQuality, maxPoints);

  const charts: { title: string; data: HistoryPoint[]; color: string; unit: string; format: (v: number) => string }[] = [
    { title: 'Latency', data: latency, color: 'var(--accent-yellow)', unit: '', format: formatLatency },
    { title: 'Packet Loss', data: packetLoss, color: 'var(--accent-red)', unit: '', format: formatPercent },
    { title: 'Traffic Intensity (ρ)', data: trafficIntensity, color: 'var(--accent-blue)', unit: '', format: (v: number) => v.toFixed(2) },
    { title: 'Secondary Battery', data: battery, color: 'var(--accent-green)', unit: '', format: formatPercent },
    { title: 'Throughput', data: throughput, color: 'var(--accent-cyan)', unit: ' msg/s', format: formatDecimal },
    { title: 'Signal Quality', data: signalQuality, color: 'var(--accent-blue)', unit: '', format: formatPercent },
  ];

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Historical Analytics</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {TIME_RANGES.map(r => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                style={{
                  padding: '3px 10px', fontSize: 11.5, borderRadius: 3, border: 'none', cursor: 'pointer',
                  background: range === r.id ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                  color: range === r.id ? '#fff' : 'var(--text-secondary)',
                  fontWeight: range === r.id ? 600 : 400,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', padding: '0 0 6px' }}>
          Rolling buffer: {state.historyLatency.length} points &middot; Displaying last {maxPoints} samples &middot; 3s interval
        </div>
      </div>

      <div className="page-grid-3" style={{ marginBottom: 10 }}>
        {charts.map(c => (
          <div key={c.title} className="card">
            <div className="card-header">
              <span className="card-title">{c.title}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {c.format(latestValue(c.data))}{c.unit}
              </span>
            </div>
            <MiniChart data={c.data} color={c.color} height={60} showDots />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4, padding: '0 2px' }}>
              <span>min: {c.format(minValue(c.data))}</span>
              <span>avg: {c.format(avgValue(c.data))}</span>
              <span>max: {c.format(maxValue(c.data))}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Statistical Summary</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Last {maxPoints} samples</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="health-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current</th>
                <th>Min</th>
                <th>Avg</th>
                <th>Max</th>
                <th>Range</th>
              </tr>
            </thead>
            <tbody>
              {charts.map(c => (
                <tr key={c.title}>
                  <td style={{ fontWeight: 500, color: c.color }}>{c.title}</td>
                  <td>{c.format(latestValue(c.data))}</td>
                  <td style={{ color: 'var(--accent-green)' }}>{c.format(minValue(c.data))}</td>
                  <td>{c.format(avgValue(c.data))}</td>
                  <td style={{ color: 'var(--accent-yellow)' }}>{c.format(maxValue(c.data))}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {c.format(maxValue(c.data) - minValue(c.data))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
