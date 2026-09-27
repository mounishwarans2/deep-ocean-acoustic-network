export interface BarDatum {
  label: string;
  value: number | null;
}

interface Props {
  data: BarDatum[];
  color: string;
  height?: number;
  xAxisLabel: string;
  yAxisLabel: string;
  formatValue?: (v: number) => string;
}

/**
 * Discrete depth → measured-value bar chart (pure SVG, no dependencies).
 * Every datum comes from the caller — this component never synthesizes values.
 */
export function BarChart({ data, color, height = 300, xAxisLabel, yAxisLabel, formatValue }: Props) {
  const fmt = formatValue ?? ((v: number) => v.toFixed(2));
  const values = data.map(d => d.value).filter((v): v is number => v !== null);

  if (values.length === 0) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>No values available</div>;
  }

  const W = 560;
  const H = 300;
  const margin = { top: 10, right: 10, bottom: 52, left: 52 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const yMin = min - span * 0.15;
  const yMax = max + span * 0.1;

  const y = (v: number) => margin.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const TICKS = 4;
  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / TICKS);

  const slot = innerW / data.length;
  const barW = Math.max(4, Math.min(34, slot * 0.62));

  return (
    <div style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} role="img" aria-label={`${yAxisLabel} by ${xAxisLabel} bar chart`}>
        {ticks.map(t => (
          <g key={t}>
            <line
              x1={margin.left} x2={W - margin.right}
              y1={y(t)} y2={y(t)}
              stroke="var(--border)" strokeWidth="1"
            />
            <text
              x={margin.left - 6} y={y(t) + 3.5}
              textAnchor="end" fontSize="10" fill="var(--text-muted)"
            >
              {fmt(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          if (d.value === null) return null;
          const cx = margin.left + slot * i + slot / 2;
          return (
            <g key={`${d.label}-${i}`}>
              <title>{`${d.label} m: ${fmt(d.value)}`}</title>
              <rect
                x={cx - barW / 2}
                y={y(d.value)}
                width={barW}
                height={Math.max(1, margin.top + innerH - y(d.value))}
                rx="2"
                fill={color}
                opacity="0.85"
              />
              <text
                x={cx}
                y={H - margin.bottom + 14}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-secondary)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
        <text
          x={margin.left + innerW / 2}
          y={H - 6}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="var(--text-secondary)"
        >
          {xAxisLabel}
        </text>
        <text
          x={12}
          y={margin.top + innerH / 2}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="var(--text-secondary)"
          transform={`rotate(-90 12 ${margin.top + innerH / 2})`}
        >
          {yAxisLabel}
        </text>
      </svg>
    </div>
  );
}
