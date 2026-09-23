import type { RecoveryState, UnderwaterDevice } from '../../types';

interface Props {
  recovery: RecoveryState;
  device: UnderwaterDevice | undefined;
}

const STAGES = [
  { key: 'FAILED', label: 'SYSTEM FAILURE', icon: '🔴', color: 'var(--accent-red)' },
  { key: 'BALLAST_RELEASE', label: 'BALLAST RELEASE', icon: '🟠', color: 'var(--accent-yellow)' },
  { key: 'ASCENDING', label: 'ASCENDING', icon: '🔵', color: 'var(--accent-cyan)' },
  { key: 'SURFACE', label: 'SURFACE RECOVERY', icon: '🟢', color: 'var(--accent-green)' },
] as const;

const STAGE_INDEX: Record<RecoveryState['stage'], number> = {
  FAILED: 0,
  BALLAST_RELEASE: 1,
  ASCENDING: 2,
  SURFACE: 3,
};

export function RecoveryPanel({ recovery, device }: Props) {
  if (!device) return null;
  const activeIdx = STAGE_INDEX[recovery.stage];
  const frac = recovery.depthAtTrigger > 0 ? Math.max(0, Math.min(1, device.depth / recovery.depthAtTrigger)) : 0;
  const progress = Math.round((1 - frac) * 100);

  const W = 210;
  const H = 168;
  const surfaceY = 14;
  const bottomY = H - 26;
  const deviceW = 66;
  const deviceH = 26;
  const deviceY = surfaceY + 8 + frac * (bottomY - surfaceY - 8 - deviceH);
  const deviceX = W / 2 - deviceW / 2;
  const weightGap = recovery.stage === 'FAILED' ? 3 : recovery.stage === 'BALLAST_RELEASE' ? 20 : 0;
  const weightVisible = recovery.stage === 'FAILED' || recovery.stage === 'BALLAST_RELEASE';
  const weightOpacity = recovery.stage === 'BALLAST_RELEASE' ? 0.45 : 1;

  return (
    <div
      className="card"
      style={{ borderLeft: '3px solid var(--accent-red)', marginBottom: 10 }}
      role="status"
      aria-label={`Emergency recovery: ${recovery.nodeId}, stage ${STAGES[activeIdx].label}`}
    >
      <div className="card-header">
        <span className="card-title">🛟 Emergency Recovery — {recovery.nodeId}</span>
        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
          Depth: {recovery.stage === 'SURFACE' ? 'SURFACE' : `${Math.round(device.depth)} m`}
          {recovery.stage === 'ASCENDING' ? ' ↑' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {STAGES.map((s, i) => (
          <div
            key={s.key}
            style={{
              flex: 1,
              minWidth: 100,
              textAlign: 'center',
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.4px',
              padding: '5px 4px',
              borderRadius: 5,
              border: `1px solid ${i === activeIdx ? s.color : 'var(--border)'}`,
              background: i === activeIdx ? 'rgba(199,92,92,0.07)' : i < activeIdx ? 'rgba(62,155,118,0.07)' : 'transparent',
              color: i === activeIdx ? s.color : i < activeIdx ? 'var(--accent-green)' : 'var(--text-muted)',
            }}
          >
            {s.icon} {s.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, flexShrink: 0 }}
          role="img"
          aria-label={`Ballast and ascent diagram, depth ${Math.round(device.depth)} meters`}
        >
          <defs>
            <linearGradient id="rp-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F4C6E" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#0A3A55" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <rect x="8" y={surfaceY} width={W - 16} height={bottomY - surfaceY} fill="url(#rp-water)" rx="4" />
          <path
            d={`M8 ${surfaceY} q 10 -5 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0`}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="1.5"
          />
          <text x={W - 12} y={surfaceY - 3} textAnchor="end" fontSize="8" fill="var(--text-muted)">SURFACE</text>

          {recovery.stage === 'ASCENDING' && (
            <g stroke="var(--accent-cyan)" strokeWidth="1.6" opacity="0.85">
              <line x1={W / 2 - 44} y1={deviceY + deviceH + 14} x2={W / 2 - 44} y2={deviceY + deviceH + 4} />
              <polygon points={`${W / 2 - 44},${deviceY + deviceH + 2} ${W / 2 - 48},${deviceY + deviceH + 9} ${W / 2 - 40},${deviceY + deviceH + 9}`} fill="var(--accent-cyan)" />
              <line x1={W / 2 + 44} y1={deviceY + deviceH + 14} x2={W / 2 + 44} y2={deviceY + deviceH + 4} />
              <polygon points={`${W / 2 + 44},${deviceY + deviceH + 2} ${W / 2 + 40},${deviceY + deviceH + 9} ${W / 2 + 48},${deviceY + deviceH + 9}`} fill="var(--accent-cyan)" />
            </g>
          )}

          <rect
            x={deviceX}
            y={deviceY}
            width={deviceW}
            height={deviceH}
            rx="4"
            fill="rgba(15,25,45,0.92)"
            stroke={recovery.stage === 'FAILED' ? '#ef4444' : recovery.stage === 'BALLAST_RELEASE' ? '#fbbf24' : recovery.stage === 'SURFACE' ? '#22c55e' : '#4FA3C7'}
            strokeWidth="1.6"
          />
          <text x={W / 2} y={deviceY + 16} textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="monospace">
            {recovery.nodeId}
          </text>

          {weightVisible && (
            <g opacity={weightOpacity}>
              <line
                x1={W / 2}
                y1={deviceY + deviceH}
                x2={W / 2}
                y2={deviceY + deviceH + weightGap}
                stroke="var(--text-muted)"
                strokeWidth="1.2"
                strokeDasharray={recovery.stage === 'BALLAST_RELEASE' ? '3 2' : undefined}
              />
              <rect
                x={W / 2 - 20}
                y={deviceY + deviceH + weightGap}
                width="40"
                height="12"
                rx="2"
                fill="rgba(120,90,40,0.9)"
                stroke="var(--accent-yellow)"
                strokeWidth="1.2"
              />
              <text x={W / 2} y={deviceY + deviceH + weightGap + 9} textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff" fontFamily="monospace">
                BALLAST
              </text>
              {recovery.stage === 'BALLAST_RELEASE' && (
                <text x={W / 2} y={deviceY + deviceH + weightGap + 24} textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--accent-yellow)" fontFamily="monospace">
                  ↓ RELEASE
                </text>
              )}
            </g>
          )}
          {!weightVisible && (
            <text x={W / 2} y={bottomY - 6} textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontFamily="monospace">
              ballast detached
            </text>
          )}
        </svg>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {recovery.stage === 'FAILED' && (
              <span><strong style={{ color: 'var(--accent-red)' }}>🔴 SYSTEM FAILURE.</strong> {recovery.nodeId} has experienced a system failure. Emergency recovery has been initiated.</span>
            )}
            {recovery.stage === 'BALLAST_RELEASE' && (
              <span><strong style={{ color: 'var(--accent-yellow)' }}>🟠 BALLAST RELEASE.</strong> External ballast weight release initiated — the external weight detaches from {recovery.nodeId}.</span>
            )}
            {recovery.stage === 'ASCENDING' && (
              <span><strong style={{ color: 'var(--accent-cyan)' }}>🔵 ASCENDING.</strong> External weight detached. {recovery.nodeId} is ascending toward the sea surface.</span>
            )}
            {recovery.stage === 'SURFACE' && (
              <span><strong style={{ color: 'var(--accent-green)' }}>🟢 SURFACE RECOVERY.</strong> {recovery.nodeId} has reached the sea surface and awaits retrieval.</span>
            )}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>
              <span>Ascent progress</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, var(--accent-yellow), var(--accent-cyan))',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              {recovery.depthAtTrigger > 0 ? `${Math.round(device.depth)} m of ${Math.round(recovery.depthAtTrigger)} m` : 'At surface'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
