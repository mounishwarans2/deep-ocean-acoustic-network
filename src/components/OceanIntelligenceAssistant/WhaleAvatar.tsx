export type WhaleMood = 'idle' | 'thinking' | 'speaking' | 'found' | 'warning' | 'failure';

interface Props {
  mood: WhaleMood;
  label?: string;
}

/**
 * Blue-whale assistant identity: clean scientific silhouette (SVG),
 * ocean-blue tones, state-driven CSS motion. Professional, never cartoonish.
 */
export function WhaleAvatar({ mood, label }: Props) {
  return (
    <div className="whale-stage" data-mood={mood}>
      <svg className="whale-svg" viewBox="0 0 220 120" role="img" aria-label={`Ocean Intelligence whale, ${mood}`}>
        <defs>
          <linearGradient id="whaleBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E89B0" />
            <stop offset="55%" stopColor="#1565A8" />
            <stop offset="100%" stopColor="#0C3A5C" />
          </linearGradient>
          <linearGradient id="whaleBelly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7EC8E6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7EC8E6" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* water lines */}
        <g className="whale-water" stroke="#2E89B0" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5">
          <path d="M8 22 q 10 -6 20 0 t 20 0" />
          <path d="M172 18 q 10 -6 20 0 t 20 0" />
          <path d="M14 100 q 10 6 20 0 t 20 0" />
          <path d="M166 102 q 10 6 20 0 t 20 0" />
        </g>

        {/* acoustic rings (speaking) */}
        <g className="whale-rings" fill="none" stroke="#38BDF8" strokeWidth="1.5">
          <ellipse cx="188" cy="62" rx="10" ry="16" />
          <ellipse cx="196" cy="62" rx="16" ry="24" />
          <ellipse cx="205" cy="62" rx="23" ry="33" />
        </g>

        {/* whale group */}
        <g className="whale-body">
          {/* tail flukes */}
          <path d="M150 58 L182 40 L176 58 L184 78 L150 66 Z" fill="#1565A8" />
          {/* body */}
          <path
            d="M18 66 C 40 48, 78 40, 112 46 C 132 49, 144 52, 152 58 L 152 66 C 144 70, 130 74, 110 76 C 76 79, 40 78, 18 70 Z"
            fill="url(#whaleBody)"
          />
          {/* belly highlight */}
          <path d="M30 70 C 55 76, 95 77, 125 72 C 100 80, 55 80, 30 73 Z" fill="url(#whaleBelly)" />
          {/* dorsal fin */}
          <path d="M96 46 C 100 38, 106 34, 112 34 C 110 40, 108 44, 106 47 Z" fill="#0C3A5C" />
          {/* pectoral fin */}
          <path className="whale-fin" d="M84 72 C 88 82, 94 88, 102 90 C 98 82, 94 76, 90 71 Z" fill="#0C3A5C" />
          {/* throat grooves */}
          <g stroke="#0C3A5C" strokeWidth="1" opacity="0.6">
            <path d="M52 62 L52 73" />
            <path d="M60 60 L60 74" />
            <path d="M68 59 L68 75" />
          </g>
          {/* eye */}
          <circle cx="34" cy="62" r="2.4" fill="#06283F" />
          <circle cx="34.8" cy="61.2" r="0.8" fill="#BFE6F5" />
        </g>

        {/* bubbles */}
        <g className="whale-bubbles" fill="none" stroke="#7EC8E6" strokeWidth="1.2">
          <circle cx="150" cy="30" r="3" />
          <circle cx="160" cy="22" r="2.2" />
          <circle cx="142" cy="18" r="1.6" />
        </g>

        {/* alert badge (warning / failure) */}
        <g className="whale-badge">
          <path d="M110 8 L118 22 L102 22 Z" fill="none" strokeWidth="2" />
          <circle cx="110" cy="18" r="1.4" fill="currentColor" stroke="none" />
        </g>
      </svg>
      {label && <div className="whale-label">{label}</div>}
    </div>
  );
}
