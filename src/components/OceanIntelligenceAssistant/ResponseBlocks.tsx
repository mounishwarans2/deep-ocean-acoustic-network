import type { DashboardSnapshot } from '../../services/aiContext';
import type { Block } from '../../services/assistantResponses';

interface Props {
  block: Block;
  snapshot: DashboardSnapshot;
  onConfirmNav: (page: string) => void;
}

const f1 = (n: number): string => (Number.isFinite(n) ? n.toFixed(1) : '—');
const f2 = (n: number): string => (Number.isFinite(n) ? n.toFixed(2) : '—');

const STATUS_COLOR: Record<string, string> = {
  NORMAL: '#2E8B6C',
  WARNING: '#B8822F',
  CRITICAL: '#C44D4D',
  OFFLINE: '#5E7A8F',
  ACTIVE: '#2E8B6C',
  DEGRADED: '#B8822F',
  FAILED: '#C44D4D',
};

function MetricCards({ cards }: { cards: { label: string; value: string; tone: 'ok' | 'warn' | 'bad' | 'info' }[] }) {
  const toneColor = { ok: '#2E8B6C', warn: '#B8822F', bad: '#C44D4D', info: '#1565A8' };
  return (
    <div className="rb-cards">
      {cards.map(c => (
        <div className="rb-card" key={c.label}>
          <span className="rb-card-k">{c.label}</span>
          <span className="rb-card-v" style={{ color: toneColor[c.tone] }}>{c.value}</span>
        </div>
      ))}
    </div>
  );
}

function DeviceCard({ id, s }: { id: string; s: DashboardSnapshot }) {
  const d = s.devices.find(x => x.id === id);
  if (!d) return <div className="rb-notice">No live data for {id}.</div>;
  const rows: [string, string][] = [
    ['Status', d.status],
    ['Type', d.type.replace(/_/g, ' ')],
    ['Depth', `${f1(d.depth)} m`],
    ['Position', `${f1(d.latitude)}, ${f1(d.longitude)}`],
    ['Temperature', `${f1(d.temperature)} °C`],
    ['Pressure', `${f1(d.pressure)} bar`],
    ['Primary battery', `${f1(d.primaryBattery)}%`],
    ['Secondary battery', `${f1(d.secondaryBattery)}%`],
    ['Energy state', d.energyState],
    ['Signal quality', `${f1(d.signalQuality)}%`],
    ['Signal strength', `${f1(d.signalStrength)} dB`],
    ['SNR', `${f1(d.snr)} dB`],
    ['Frequency', `${f1(d.frequency)} Hz`],
    ['Packet loss', `${f2(d.packetLoss)}%`],
    ['Latency', `${f1(d.latency)} ms`],
    ['Throughput', `${f1(d.throughput)} msg/s`],
  ];
  return (
    <div className="rb-device">
      <div className="rb-device-head">
        <span className="rb-device-id">● {d.id}</span>
        <span className="rb-chip" style={{ color: STATUS_COLOR[d.status], borderColor: STATUS_COLOR[d.status] }}>{d.status}</span>
      </div>
      <div className="rb-device-name">{d.name}</div>
      {rows.map(([k, v]) => (
        <div className="rb-kv" key={k}><span>{k}</span><b>{v}</b></div>
      ))}
      <div className="rb-route">Route: {d.primaryRoute.join(' → ') || 'unassigned'}</div>
    </div>
  );
}

function CompareTable({ ids, s }: { ids: [string, string]; s: DashboardSnapshot }) {
  const [a, b] = [s.devices.find(d => d.id === ids[0]), s.devices.find(d => d.id === ids[1])];
  if (!a || !b) return <div className="rb-notice">One of the nodes has no live data.</div>;
  const rows: [string, string, string][] = [
    ['Status', a.status, b.status],
    ['Depth', `${f1(a.depth)} m`, `${f1(b.depth)} m`],
    ['Secondary battery', `${f1(a.secondaryBattery)}%`, `${f1(b.secondaryBattery)}%`],
    ['Signal quality', `${f1(a.signalQuality)}%`, `${f1(b.signalQuality)}%`],
    ['Packet loss', `${f2(a.packetLoss)}%`, `${f2(b.packetLoss)}%`],
    ['Latency', `${f1(a.latency)} ms`, `${f1(b.latency)} ms`],
    ['Throughput', `${f1(a.throughput)} msg/s`, `${f1(b.throughput)} msg/s`],
    ['Frequency', `${f1(a.frequency)} Hz`, `${f1(b.frequency)} Hz`],
  ];
  return (
    <div className="rb-compare">
      <div className="rb-compare-head"><span>{a.id}</span><span>{b.id}</span></div>
      {rows.map(([k, va, vb]) => (
        <div className="rb-compare-row" key={k}>
          <span className="rb-compare-k">{k}</span>
          <span>{va}</span>
          <span>{vb}</span>
        </div>
      ))}
    </div>
  );
}

function DepthProfile({ s }: { s: DashboardSnapshot }) {
  const W = 300;
  const H = 230;
  const padL = 58;
  const maxD = Math.max(...s.devices.map(d => d.depth), 1);
  const y = (d: number): number => 14 + (d / maxD) * (H - 30);
  const sorted = [...s.devices].sort((a, b) => b.depth - a.depth);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round((maxD * t) / 100) * 100);
  return (
    <div className="rb-viz">
      <div className="rb-viz-title">🌊 Depth Profile</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="rb-svg">
        <defs>
          <linearGradient id="rbDepth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D6E6F0" />
            <stop offset="100%" stopColor="#1565A8" />
          </linearGradient>
        </defs>
        <rect x={padL} y={10} width={W - padL - 14} height={H - 24} rx={6} fill="url(#rbDepth)" opacity={0.35} />
        {ticks.map(t => (
          <g key={t}>
            <text x={padL - 5} y={y(t) + 3} textAnchor="end" fontSize={8.5} fill="#5E7A8F">{t} m</text>
            <line x1={padL} x2={W - 14} y1={y(t)} y2={y(t)} stroke="#2E89B0" strokeOpacity={0.3} strokeWidth={1} />
          </g>
        ))}
        {sorted.map(d => (
          <g key={d.id}>
            <circle cx={padL + 14 + (sorted.indexOf(d) % 5) * 44} cy={y(d.depth)} r={3.4} fill={STATUS_COLOR[d.status]} stroke="#fff" strokeWidth={1} />
            <text x={padL + 22 + (sorted.indexOf(d) % 5) * 44} y={y(d.depth) + 3} fontSize={8} fill="#12314A" fontWeight={700}>{d.id}</text>
          </g>
        ))}
      </svg>
      <div className="rb-caption">Deepest monitored node: {sorted[0].id} at {f1(sorted[0].depth)} m</div>
    </div>
  );
}

function MiniNetwork({ s }: { s: DashboardSnapshot }) {
  const W = 300;
  const H = 210;
  const px = (x: number): number => 14 + (x / 100) * (W - 28);
  const py = (y: number): number => 10 + (y / 100) * (H - 20);
  const byId = new Map(s.devices.map(d => [d.id, d]));
  return (
    <div className="rb-viz">
      <div className="rb-viz-title">🛰 Network Map</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="rb-svg">
        {s.links.map(l => {
          const a = byId.get(l.from);
          const b = byId.get(l.to);
          if (!a || !b) return null;
          return (
            <line
              key={l.id}
              x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)}
              stroke={STATUS_COLOR[l.status]}
              strokeOpacity={l.status === 'ACTIVE' ? 0.45 : 0.9}
              strokeWidth={l.status === 'ACTIVE' ? 1 : 1.8}
              strokeDasharray={l.status === 'FAILED' ? '4 3' : undefined}
            />
          );
        })}
        {s.devices.map(d => (
          <g key={d.id}>
            <circle cx={px(d.x)} cy={py(d.y)} r={d.type === 'DATA_CENTER' || d.type === 'GATEWAY' ? 5 : 3.6} fill={STATUS_COLOR[d.status]} stroke="#fff" strokeWidth={1.2} />
            {(d.type === 'GATEWAY' || d.id.startsWith('MN') || d.id.startsWith('SUB')) && (
              <text x={px(d.x) + 7} y={py(d.y) + 3} fontSize={7.5} fill="#12314A" fontWeight={700}>{d.id}</text>
            )}
          </g>
        ))}
      </svg>
      <div className="rb-legend">
        <span><i style={{ background: STATUS_COLOR.ACTIVE }} /> active</span>
        <span><i style={{ background: STATUS_COLOR.DEGRADED }} /> degraded</span>
        <span><i style={{ background: STATUS_COLOR.FAILED }} /> failed</span>
      </div>
    </div>
  );
}

function LineChart({ metric, s }: { metric: 'loss' | 'throughput'; s: DashboardSnapshot }) {
  const pts = metric === 'loss' ? s.historyLoss : s.historyThroughput;
  const W = 300;
  const H = 110;
  const unit = metric === 'loss' ? '%' : ' msg/s';
  if (pts.length < 2) return <div className="rb-notice">Not enough history yet.</div>;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const stepX = (W - 16) / (pts.length - 1);
  const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${(8 + i * stepX).toFixed(1)},${(H - 12 - ((v - min) / span) * (H - 28)).toFixed(1)}`).join(' ');
  const color = metric === 'loss' ? '#C44D4D' : '#2E89B0';
  return (
    <div className="rb-viz">
      <div className="rb-viz-title">{metric === 'loss' ? '📉 Packet Loss Trend' : '📈 Throughput Trend'}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="rb-svg">
        <path d={path} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        <circle cx={W - 8} cy={H - 12 - ((pts[pts.length - 1] - min) / span) * (H - 28)} r={3} fill={color} />
        <text x={8} y={12} fontSize={8.5} fill="#5E7A8F">max {f2(max)}{unit}</text>
        <text x={8} y={H - 2} fontSize={8.5} fill="#5E7A8F">min {f2(min)}{unit}</text>
      </svg>
      <div className="rb-caption">Current: {f2(pts[pts.length - 1])}{unit} (live history, {pts.length} samples)</div>
    </div>
  );
}

function SncBoard({ s }: { s: DashboardSnapshot }) {
  const n = s.snc;
  const cards = [
    { label: 'ARRIVAL RATE', value: `${f2(n.arrivalRate)} msg/s`, tone: 'info' as const },
    { label: 'SERVICE RATE', value: `${f2(n.serviceRate)} msg/s`, tone: 'info' as const },
    { label: 'TRAFFIC INTENSITY', value: f2(n.trafficIntensity), tone: n.trafficIntensity < 1 ? ('ok' as const) : ('bad' as const) },
    { label: 'AVG DELAY', value: `${f1(n.averageDelay)} ms`, tone: 'info' as const },
    { label: 'MAX DELAY BOUND', value: `${f1(n.delayBound)} ms`, tone: 'info' as const },
    { label: 'BACKLOG', value: String(n.backlog), tone: 'info' as const },
    { label: 'BUFFER USE', value: `${f1(n.bufferUtilization)}%`, tone: n.bufferUtilization > 85 ? ('warn' as const) : ('ok' as const) },
    { label: 'STABILITY', value: n.stability, tone: n.stability === 'STABLE' ? ('ok' as const) : n.stability === 'WARNING' ? ('warn' as const) : ('bad' as const) },
  ];
  return <MetricCards cards={cards} />;
}

function linkStatusBetween(s: DashboardSnapshot, a: string, b: string): string {
  const l = s.links.find(x => (x.from === a && x.to === b) || (x.from === b && x.to === a));
  return l ? l.status : 'UNKNOWN';
}

function RouteCard({ deviceId, s }: { deviceId: string; s: DashboardSnapshot }) {
  const d = s.devices.find(x => x.id === deviceId);
  if (!d || d.primaryRoute.length === 0) return <div className="rb-notice">No route assigned for {deviceId}.</div>;
  return (
    <div className="rb-viz">
      <div className="rb-viz-title">🧭 PRISM Route — {deviceId}</div>
      <div className="rb-route-chain">
        {d.primaryRoute.map((hop, i) => (
          <span key={`${hop}-${i}`} className="rb-hop">
            <span className="rb-hop-name">{hop}</span>
            {i < d.primaryRoute.length - 1 && (
              <span className="rb-hop-link" style={{ color: STATUS_COLOR[linkStatusBetween(s, hop, d.primaryRoute[i + 1])] || '#5E7A8F' }}>→</span>
            )}
          </span>
        ))}
      </div>
      <div className="rb-caption">
        Hops: {d.primaryRoute.map((hop, i) => (i < d.primaryRoute.length - 1 ? `${hop}→${d.primaryRoute[i + 1]}: ${linkStatusBetween(s, hop, d.primaryRoute[i + 1])}` : null)).filter(Boolean).join(' · ') || 'direct'}
      </div>
    </div>
  );
}

function PrismBoard({ s }: { s: DashboardSnapshot }) {
  const cores = s.devices.filter(d => d.id === 'MN-01' || d.id === 'MN-02' || d.id.startsWith('SUB')).slice(0, 3);
  return (
    <div>
      {cores.map(d => (
        <RouteCard key={d.id} deviceId={d.id} s={s} />
      ))}
    </div>
  );
}

function EnergyBoard({ s }: { s: DashboardSnapshot }) {
  const prim = s.devices.map(d => d.primaryBattery);
  const sec = s.devices.map(d => d.secondaryBattery);
  const states = ['NORMAL', 'SAVING', 'LOW'].map(st => `${st}: ${s.devices.filter(d => d.energyState === st).length}`).join(' · ');
  return (
    <div>
      <MetricCards
        cards={[
          { label: 'AVG PRIMARY', value: `${f1(prim.reduce((a, b) => a + b, 0) / prim.length)}%`, tone: 'info' },
          { label: 'AVG SECONDARY', value: `${f1(sec.reduce((a, b) => a + b, 0) / sec.length)}%`, tone: 'info' },
          { label: 'LOW UNITS', value: String(s.lowBatteryDevices.length), tone: s.lowBatteryDevices.length ? 'warn' : 'ok' },
          { label: 'ENERGY STATES', value: states, tone: 'info' },
        ]}
      />
      {s.lowBatteryDevices.length > 0 && (
        <div className="rb-caption">Low: {s.lowBatteryDevices.map(d => `${d.id} (${f1(d.secondaryBattery)}%)`).join(', ')}</div>
      )}
      <div className="rb-caption">Per-device consumption rates and charging state are not in live telemetry.</div>
    </div>
  );
}

function AlertsList({ s }: { s: DashboardSnapshot }) {
  return (
    <div className="rb-alerts">
      {s.alerts.slice(0, 8).map(a => (
        <div className="rb-alert" key={`${a.severity}-${a.nodeId}-${a.time}-${a.message}`}>
          <span className="rb-chip" style={{ color: STATUS_COLOR[a.severity === 'INFO' ? 'ACTIVE' : a.severity], borderColor: STATUS_COLOR[a.severity === 'INFO' ? 'ACTIVE' : a.severity] }}>
            {a.severity}
          </span>
          <div className="rb-alert-body">
            <b>{a.nodeId}: {a.message}</b>
            <span>{a.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function OceanEnv({ s }: { s: DashboardSnapshot }) {
  const rows: [string, string][] = [
    ['Avg depth', `${f1(s.avgDepth)} m`],
    ['Deepest node', `${f1(s.maxDepth)} m`],
    ['Avg temperature', `${f1(s.avgTemperature)} °C`],
    ['Avg pressure', `${f1(s.avgPressure)} bar`],
    ['Salinity / oxygen', 'tracked per device'],
  ];
  return (
    <div className="rb-env">
      {rows.map(([k, v]) => (
        <div className="rb-kv" key={k}><span>{k}</span><b>{v}</b></div>
      ))}
      <div className="rb-caption">Seabed composition maps are not in live telemetry.</div>
    </div>
  );
}

function Diagram({ diagram }: { diagram: 'acoustic' | 'prism' | 'snc' | 'pressure' }) {
  if (diagram === 'acoustic') {
    return (
      <div className="rb-viz">
        <div className="rb-viz-title">〰️ Acoustic Path</div>
        <svg viewBox="0 0 300 110" className="rb-svg">
          <rect x={14} y={38} width={52} height={34} rx={6} fill="#fff" stroke="#2E89B0" strokeWidth={1.5} />
          <text x={40} y={52} textAnchor="middle" fontSize={8} fontWeight={800} fill="#12314A">SOURCE</text>
          <text x={40} y={63} textAnchor="middle" fontSize={7.5} fill="#5E7A8F">Node A</text>
          <rect x={124} y={38} width={52} height={34} rx={6} fill="#fff" stroke="#2E89B0" strokeWidth={1.5} />
          <text x={150} y={52} textAnchor="middle" fontSize={8} fontWeight={800} fill="#12314A">RELAY</text>
          <text x={150} y={63} textAnchor="middle" fontSize={7.5} fill="#5E7A8F">retransmit</text>
          <rect x={234} y={38} width={52} height={34} rx={6} fill="#fff" stroke="#2E89B0" strokeWidth={1.5} />
          <text x={260} y={52} textAnchor="middle" fontSize={8} fontWeight={800} fill="#12314A">DEST</text>
          <text x={260} y={63} textAnchor="middle" fontSize={7.5} fill="#5E7A8F">Node B</text>
          <g stroke="#38BDF8" strokeWidth={1.6} fill="none">
            <path d="M70 48 q 8 -8 16 0 t 16 0 t 16 0" />
            <path d="M70 62 q 8 8 16 0 t 16 0 t 16 0" />
            <path d="M180 48 q 8 -8 16 0 t 16 0 t 16 0" />
            <path d="M180 62 q 8 8 16 0 t 16 0 t 16 0" />
          </g>
          <text x={150} y={95} textAnchor="middle" fontSize={8} fill="#5E7A8F">water channel · ~1500 m/s</text>
        </svg>
      </div>
    );
  }
  if (diagram === 'prism') {
    return (
      <div className="rb-viz">
        <div className="rb-viz-title">🧭 PRISM Decision</div>
        <svg viewBox="0 0 300 96" className="rb-svg">
          {['Node A', 'Relay', 'Relay', 'Node B'].map((n, i) => (
            <g key={n + i}>
              <rect x={8 + i * 74} y={30} width={62} height={30} rx={15} fill={i === 0 || i === 3 ? '#1565A8' : '#fff'} stroke="#2E89B0" strokeWidth={1.5} />
              <text x={39 + i * 74} y={48} textAnchor="middle" fontSize={8} fontWeight={800} fill={i === 0 || i === 3 ? '#fff' : '#12314A'}>{n}</text>
              {i < 3 && <text x={70 + i * 74} y={40} textAnchor="middle" fontSize={11} fill="#2E89B0">→</text>}
            </g>
          ))}
          <text x={150} y={82} textAnchor="middle" fontSize={8} fill="#5E7A8F">compare paths → pick best → reroute on failure</text>
        </svg>
      </div>
    );
  }
  if (diagram === 'snc') {
    const steps = ['Traffic arrival', 'Queue / Buffer', 'Service', 'Output'];
    return (
      <div className="rb-viz">
        <div className="rb-viz-title">📊 SNC Flow</div>
        <div className="rb-flowcol">
          {steps.map((st, i) => (
            <div key={st} className="rb-flowbox">
              {st}
              {i < steps.length - 1 && <span className="rb-flowarrow">↓</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }
  const marks = [0, 1000, 2000, 3000, 4000, 5000];
  return (
    <div className="rb-viz">
      <div className="rb-viz-title">🌊 Pressure with Depth</div>
      <svg viewBox="0 0 300 170" className="rb-svg">
        <defs>
          <linearGradient id="rbPress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D6E6F0" />
            <stop offset="100%" stopColor="#0C3A5C" />
          </linearGradient>
        </defs>
        <rect x={110} y={8} width={80} height={150} rx={8} fill="url(#rbPress)" />
        {marks.map(m => (
          <g key={m}>
            <text x={102} y={14 + (m / 5000) * 144} textAnchor="end" fontSize={8} fill="#5E7A8F">{m} m</text>
            <text x={196} y={14 + (m / 5000) * 144} fontSize={8} fill="#5E7A8F">~{m / 10 + 1} bar</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function ResponseBlock({ block, snapshot, onConfirmNav }: Props & { block: Block }) {
  switch (block.kind) {
    case 'metricCards':
      return <MetricCards cards={block.cards} />;
    case 'deviceCard':
      return <DeviceCard id={block.deviceId} s={snapshot} />;
    case 'compareTable':
      return <CompareTable ids={block.ids} s={snapshot} />;
    case 'depthProfile':
      return <DepthProfile s={snapshot} />;
    case 'miniNetwork':
      return <MiniNetwork s={snapshot} />;
    case 'lineChart':
      return <LineChart metric={block.metric} s={snapshot} />;
    case 'sncBoard':
      return <SncBoard s={snapshot} />;
    case 'routeCard':
      return <RouteCard deviceId={block.deviceId} s={snapshot} />;
    case 'prismBoard':
      return <PrismBoard s={snapshot} />;
    case 'energyBoard':
      return <EnergyBoard s={snapshot} />;
    case 'alertsList':
      return <AlertsList s={snapshot} />;
    case 'oceanEnv':
      return <OceanEnv s={snapshot} />;
    case 'diagram':
      return <Diagram diagram={block.diagram} />;
    case 'confirmNav':
      return (
        <div className="rb-confirm">
          <span>Open the {block.label} page?</span>
          <button type="button" className="rb-confirm-btn" onClick={() => onConfirmNav(block.page)}>
            Open {block.label} ➤
          </button>
        </div>
      );
    case 'notice':
      return <div className="rb-notice">{block.text}</div>;
    default:
      return null;
  }
}
