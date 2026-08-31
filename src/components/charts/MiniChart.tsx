import type { HistoryPoint } from '../../types';

interface Props {
  data: HistoryPoint[];
  color: string;
  height?: number;
  showDots?: boolean;
}

export function MiniChart({ data, color, height = 40, showDots = false }: Props) {
  if (!data || data.length < 2) return null;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const w = 100;
  const h = 100;
  const padding = 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (w - padding * 2);
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = points + ` ${w - padding},${h} ${padding},${h}`;

  return (
    <div className="mini-chart" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polygon points={areaPoints} fill={color} className="chart-area" />
        <polyline points={points} stroke={color} className="chart-line" fill="none" />
        {showDots && values.map((v, i) => {
          const x = padding + (i / (values.length - 1)) * (w - padding * 2);
          const y = h - padding - ((v - min) / range) * (h - padding * 2);
          return i === values.length - 1 ? (
            <circle key={i} cx={x} cy={y} r="2" fill={color} />
          ) : null;
        })}
      </svg>
    </div>
  );
}
