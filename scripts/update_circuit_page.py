with open('src/pages/CircuitConnectionsPage.tsx', 'r') as f:
    text = f.read()

start_marker = '      {/* ── Component Housing / PCB Artwork ── */}'
end_marker = '      {/* ── Component Physical Pins & Target Rings ── */}'

idx1 = text.find(start_marker)
idx2 = text.find(end_marker)

assert idx1 != -1, 'start_marker not found'
assert idx2 != -1, 'end_marker not found'
assert idx1 < idx2, 'markers out of order'

replacement = '''      {/* ── Genuine Physical Hardware Component Cutout Image ── */}
      <image
        href={`/assets/hardware/${comp.id}.webp`}
        x={0}
        y={0}
        width={comp.width}
        height={comp.height}
        preserveAspectRatio="xMidYMid meet"
        className="circuit-hardware-photo"
        style={{
          filter: isSelected
            ? 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.95)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.45))'
            : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.28))',
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
      />

      {/* ── Active Hardware Dynamic Overlays ── */}
      {/* 1. SSD1306 OLED Live Display Screen */}
      {comp.id === 'oled' && (
        <g transform={`translate(${comp.width * 0.16}, ${comp.height * 0.3})`}>
          <rect
            width={comp.width * 0.68}
            height={comp.height * 0.42}
            rx={3}
            fill="#030712"
            opacity={0.92}
          />
          <text x={comp.width * 0.34} y={13} textAnchor="middle" fill="#38bdf8" fontSize={8} fontWeight="bold" fontFamily="monospace">
            ESP32 ACOUSTIC
          </text>
          <text x={comp.width * 0.34} y={24} textAnchor="middle" fill="#4ade80" fontSize={7.5} fontWeight="bold" fontFamily="monospace">
            21.4°C • 20.4MPa
          </text>
          <text x={comp.width * 0.34} y={35} textAnchor="middle" fill="#fbbf24" fontSize={7} fontFamily="monospace">
            BAT: 95% • OPTIMAL
          </text>
        </g>
      )}

      {/* 2. LCD 1602 Live Dot-Matrix Backlight & Text */}
      {comp.id === 'lcd_1602' && (
        <g transform={`translate(${comp.width * 0.14}, ${comp.height * 0.26})`}>
          <rect
            width={comp.width * 0.72}
            height={comp.height * 0.48}
            rx={4}
            fill="#0284c7"
            opacity={0.88}
            filter="drop-shadow(0 0 8px rgba(2, 132, 199, 0.6))"
          />
          <text x={14} y={19} fill="#ffffff" fontSize={11} fontWeight="bold" fontFamily="monospace" letterSpacing={1}>
            TEMP: 24.5 C
          </text>
          <text x={14} y={36} fill="#e0f2fe" fontSize={10} fontWeight="bold" fontFamily="monospace" letterSpacing={1}>
            STAT: UW01-OPTIMAL
          </text>
        </g>
      )}

      {/* 3. Status LEDs Optical Glowing Halo Animations */}
      {comp.id === 'led_tx' && (
        <circle
          cx={comp.width / 2}
          cy={comp.height * 0.24}
          r={18}
          fill="rgba(34, 197, 94, 0.45)"
          filter="drop-shadow(0 0 10px #22c55e)"
          className="active-led-pulse"
        />
      )}
      {comp.id === 'led_sync' && (
        <circle
          cx={comp.width / 2}
          cy={comp.height * 0.24}
          r={18}
          fill="rgba(234, 179, 8, 0.45)"
          filter="drop-shadow(0 0 10px #eab308)"
          className="active-led-pulse"
        />
      )}
      {comp.id === 'led_alert' && (
        <circle
          cx={comp.width / 2}
          cy={comp.height * 0.24}
          r={18}
          fill="rgba(239, 68, 68, 0.45)"
          filter="drop-shadow(0 0 10px #ef4444)"
          className="active-led-pulse"
        />
      )}
      {comp.id === 'led_indicators_panel' && (
        <g>
          <circle cx={comp.width * 0.25} cy={comp.height * 0.5} r={14} fill="rgba(34, 197, 94, 0.5)" filter="drop-shadow(0 0 8px #22c55e)" />
          <circle cx={comp.width * 0.42} cy={comp.height * 0.5} r={14} fill="rgba(234, 179, 8, 0.5)" filter="drop-shadow(0 0 8px #eab308)" />
          <circle cx={comp.width * 0.58} cy={comp.height * 0.5} r={14} fill="rgba(59, 130, 246, 0.5)" filter="drop-shadow(0 0 8px #3b82f6)" />
        </g>
      )}

      {/* ── Component Neat Engineering Label (Rendered Below Hardware Image) ── */}
      <g transform={`translate(${comp.width / 2}, ${comp.height + 16})`}>
        <rect
          x={-Math.max(comp.name.length * 3.4, 55)}
          y={-10}
          width={Math.max(comp.name.length * 6.8, 110)}
          height={comp.status === 'ARCHITECTURAL' ? 32 : 24}
          rx={6}
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth={1}
          filter="drop-shadow(0 2px 5px rgba(0,0,0,0.06))"
        />
        <text
          x={0}
          y={2}
          textAnchor="middle"
          fill="#0f172a"
          fontSize={8.5}
          fontWeight="800"
          fontFamily="sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          {comp.name}
        </text>
        <text
          x={0}
          y={11}
          textAnchor="middle"
          fill="#64748b"
          fontSize={7}
          fontWeight="600"
          fontFamily="sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          {comp.modelNumber}
        </text>
        {comp.status === 'ARCHITECTURAL' && (
          <text
            x={0}
            y={20}
            textAnchor="middle"
            fill="#d97706"
            fontSize={6.5}
            fontWeight="bold"
            letterSpacing={0.5}
            style={{ pointerEvents: 'none' }}
          >
            [PROPOSED ARCHITECTURAL]
          </text>
        )}
      </g>

'''

new_text = text[:idx1] + replacement + text[idx2:]
with open('src/pages/CircuitConnectionsPage.tsx', 'w') as f:
    f.write(new_text)

print('Updated CircuitConnectionsPage.tsx successfully!')
