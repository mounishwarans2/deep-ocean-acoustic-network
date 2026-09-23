interface Props {
  state?: 'normal' | 'thinking' | 'speaking' | 'alert';
}

const WHALE_COUNT = 5;
const CX = 36;
const CY = 36;
const RADIUS = 23;

/**
 * Ocean Spirit launcher: small blue-whale silhouettes swimming in a slow
 * circular orbit around an intelligent ocean core. Pure SVG + CSS motion —
 * no images, no 3D, no network cost.
 */
export function WhaleOrbit({ state = 'normal' }: Props) {
  const angles = Array.from({ length: WHALE_COUNT }, (_, i) => (360 / WHALE_COUNT) * i);
  return (
    <svg
      className="whale-orbit"
      data-state={state}
      viewBox="0 0 72 72"
      role="img"
      aria-label={`Ocean Intelligence, ${state}`}
    >
      <defs>
        <radialGradient id="woCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7FD4F2" />
          <stop offset="55%" stopColor="#2E9BC4" />
          <stop offset="100%" stopColor="#155A7A" />
        </radialGradient>
        <filter id="woGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.9" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* single whale silhouette, ~11x7, facing right */}
        <g id="woWhale">
          <path
            d="M0.5 4.2 C2.5 2.2 5.2 1.2 8 1.6 L9.8 0.4 L9.4 2.2 C10.6 2.8 11.2 3.6 11.3 4.4
               C11.2 5.2 10.6 6 9.4 6.6 L9.8 8.4 L8 7.2 C5.2 7.6 2.5 6.6 0.5 4.6 Z"
            fill="currentColor"
          />
          <circle cx="3.4" cy="3.8" r="0.55" fill="#EAF6FB" opacity="0.9" />
        </g>
      </defs>

      {/* faint orbit track */}
      <circle className="wo-track" cx={CX} cy={CY} r={RADIUS} />

      {/* alert ring (failure state only) */}
      <circle className="wo-alert-ring" cx={CX} cy={CY} r={RADIUS + 5} />

      {/* speaking sonar rings */}
      <g className="wo-sonar" fill="none" stroke="#7FD4F2">
        <circle cx={CX} cy={CY} r="9" />
        <circle cx={CX} cy={CY} r="13" />
      </g>

      {/* intelligent ocean core */}
      <circle cx={CX} cy={CY} r="6.5" fill="url(#woCore)" filter="url(#woGlow)" className="wo-core" />
      <circle cx={CX} cy={CY} r="2.4" fill="#EAF6FB" opacity="0.85" />

      {/* orbiting whales */}
      <g className="wo-orbit">
        {angles.map(a => (
          <g key={a} transform={`rotate(${a} ${CX} ${CY})`}>
            <g transform={`translate(${CX - 5.5} ${CY - RADIUS - 3.5}) rotate(8)`}>
              <g className="wo-counter">
                <g className="wo-swimmer">
                  <use href="#woWhale" className="wo-whale" />
                </g>
              </g>
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
