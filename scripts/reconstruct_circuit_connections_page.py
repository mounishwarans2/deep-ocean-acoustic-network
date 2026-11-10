#!/usr/bin/env python3
"""
reconstruct_circuit_connections_page.py
Reconstructs src/pages/CircuitConnectionsPage.tsx cleanly:
1. Head part (lines 1-616: imports, types, ESP32_COMPONENTS, ESP32_WIRES, UNDERWATER_GROUPS)
2. UNDERWATER_COMPONENTS (all 24 components, with updated Micro Nuclear Battery and LiPo Backup Battery)
3. UNDERWATER_WIRES (all 43 wires with updated Micro Nuclear Battery and LiPo Backup Battery wires)
4. ARDUINO_COMPONENTS (4 components with clean Tinkercad-style coordinates)
5. ARDUINO_WIRES (12 wires with dynamic Bezier routing)
6. ComponentShape (hardware images, dynamic overlays, 3-line engineering cards)
7. SystemWorkflowBanner
8. CircuitConnectionsPage (mode, zoom/pan state, search, currentComponents useMemo)
9. Tail part (allWiresForMode, currentWires, pinCoordMap, inspector sidebar, SVG layout)
"""

import json, re, sys

# 1. Read existing head (lines 1 to 616)
with open('src/pages/CircuitConnectionsPage.tsx', 'r', encoding='utf-8') as f:
    orig_lines = f.readlines()

head_part = ''.join(orig_lines[:616])
tail_part = ''.join(orig_lines[681:])

# Make connectionPurpose optional and expand busType in head_part
head_part = head_part.replace('connectionPurpose: string;', 'connectionPurpose?: string;')
head_part = head_part.replace(
    "busType: 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC/DAC' | 'GPIO/PWM' | 'USB/PCIe';",
    "busType: 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC' | 'DAC' | 'ADC/DAC' | 'GPIO' | 'PWM' | 'GPIO/PWM' | 'USB' | 'PCIe' | 'USB/PCIe';"
)

# 2. Extract underwater components
with open('scripts/apply_marislink_final_corrections.py', 'r', encoding='utf-8') as f:
    apply_code = f.read()

idx = apply_code.find('new_underwater_components = """')
idx2 = apply_code.find('"""\n\ncontent = content[:comp_start]')
underwater_comps = apply_code[idx + len('new_underwater_components = """'):idx2].strip()

# Update primary battery in underwater_comps
pri_bat_rx = r'\{\s+id:\s*[\'"]pwr_primary_battery[\'"].*?pins:\s*\[.*?\]\s+\}'
new_pri_bat = '''{
    id: 'pwr_primary_battery',
    name: 'MICRO NUCLEAR BATTERY – CONCEPTUAL',
    category: 'POWER',
    modelNumber: 'Solid-State Betavoltaic Power Cell',
    status: 'ARCHITECTURAL',
    x: 275,
    y: 65,
    width: 195,
    height: 95,
    imageSrc: '/assets/hardware/pwr_micro_nuclear_battery.webp?v=5',
    description: 'Proposed long-duration solid-state micro-nuclear power source under conceptual architectural evaluation for multi-decade seabed deployment. Not physically present in benchtop prototype.',
    roleInMarislink: 'Proposed ultra-long-duration architectural primary energy source designed to trickle-charge the LiPo energy buffer without requiring periodic retrieval.',
    protocol: 'Autonomous Low-Voltage DC Supply',
    operatingVoltage: 'Low-Voltage DC Output (Proposed)',
    currentDraw: 'Continuous Micro-Power Trickle Feed',
    pins: [
      { id: 'vout_pos', label: '+', x: 61, y: 16, type: 'POWER', description: 'Micro Nuclear Battery Positive DC Terminal (+)' },
      { id: 'vout_neg', label: '—', x: 134, y: 16, type: 'GROUND', description: 'Micro Nuclear Battery Negative Ground Return (-)' }
    ]
  }'''
underwater_comps = re.sub(pri_bat_rx, new_pri_bat, underwater_comps, flags=re.DOTALL)

# Update backup battery in underwater_comps
sec_bat_rx = r'\{\s+id:\s*[\'"]pwr_backup_battery[\'"].*?pins:\s*\[.*?\]\s+\}'
new_sec_bat = '''{
    id: 'pwr_backup_battery',
    name: 'LITHIUM POLYMER (LiPo) BACKUP BATTERY PACK',
    category: 'POWER',
    modelNumber: 'Aluminum Laminated Pouch Cell Stack',
    status: 'ARCHITECTURAL',
    x: 510,
    y: 65,
    width: 195,
    height: 95,
    imageSrc: '/assets/hardware/pwr_lipo_backup_battery.webp?v=5',
    description: 'High-discharge multi-cell Lithium Polymer (LiPo) laminated pouch battery pack engineered to buffer peak transient surge currents during high-power acoustic transmission pulses.',
    roleInMarislink: 'Supplies rapid transient discharge currents to the 100W acoustic power amplifier, preventing voltage sag on sensitive digital processor rails.',
    protocol: 'High-Rate Secondary DC Energy Buffer',
    operatingVoltage: 'DC Output Rail (Multi-Cell Pouch Buffer)',
    currentDraw: 'High-Rate Pulse Burst Capability (To BMS)',
    pins: [
      { id: 'bat_pos', label: 'B+', x: 150, y: 14, type: 'POWER', description: 'LiPo Pouch Positive Power Lead (XT60 Terminal)' },
      { id: 'bat_neg', label: 'B-', x: 168, y: 14, type: 'GROUND', description: 'LiPo Pouch Negative Ground Return (XT60 Terminal)' }
    ]
  }'''
underwater_comps = re.sub(sec_bat_rx, new_sec_bat, underwater_comps, flags=re.DOTALL)

# Also update pwr_path_mgmt and pwr_bms text to reference LiPo pouch buffer
underwater_comps = underwater_comps.replace('backup Li-ion buffer', 'backup LiPo buffer')
underwater_comps = underwater_comps.replace('Guards the Li-ion energy buffer', 'Guards the LiPo energy buffer')

# 3. Extract UNDERWATER_WIRES from rebuild script
with open('scripts/rebuild_circuit_connections_page.py', 'r', encoding='utf-8') as f:
    rebuild_code = f.read()

idx = rebuild_code.find('UNDERWATER_WIRES_TS = \'\'\'')
idx2 = rebuild_code.find('\'\'\'\n\n# Replace UNDERWATER_COMPONENTS')
underwater_wires = rebuild_code[idx + len('UNDERWATER_WIRES_TS = \'\'\''):idx2].strip()

# Replace w-pri-bat-path & add w-pri-bat-gnd
old_pri_wire = '''  {
    id: 'w-pri-bat-path',
    name: 'Primary Li-SOCl2 Battery +14.4V Feed to Power Path Manager',
    busType: 'POWER',
    sourceComponentId: 'pwr_primary_battery',
    sourcePinId: 'vout_pos',
    destComponentId: 'pwr_path_mgmt',
    destPinId: 'pri_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+14.4V DC',
    connectionPurpose: 'Feeds primary chemical battery energy into ideal diode multiplexer',
    signalDescription: 'Continuous baseline subsea power rail'
  },'''

new_pri_wires = '''  {
    id: 'w-pri-bat-path',
    name: 'Micro Nuclear Battery (+) Feed to Power Path Manager',
    busType: 'POWER',
    sourceComponentId: 'pwr_primary_battery',
    sourcePinId: 'vout_pos',
    destComponentId: 'pwr_path_mgmt',
    destPinId: 'pri_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: 'Low-Voltage DC (Conceptual)',
    connectionPurpose: 'Feeds proposed conceptual micro nuclear battery trickle output into ideal diode controller',
    signalDescription: 'Continuous long-duration low-voltage DC trickle rail'
  },
  {
    id: 'w-pri-bat-gnd',
    name: 'Micro Nuclear Battery Ground Return to Common Bus',
    busType: 'GROUND',
    sourceComponentId: 'pwr_primary_battery',
    sourcePinId: 'vout_neg',
    destComponentId: 'pwr_path_mgmt',
    destPinId: 'gnd',
    color: '#0f172a',
    colorName: 'Black (Ground Return)',
    voltage: '0.0V Ground Reference',
    connectionPurpose: 'Completes ground return circuit for the conceptual micro nuclear battery trickle source.',
    signalDescription: 'System ground return path for primary micro power unit.'
  },'''

assert old_pri_wire in underwater_wires, 'old_pri_wire not found in underwater_wires'
underwater_wires = underwater_wires.replace(old_pri_wire, new_pri_wires)

# Replace w-sec-bat-bms
old_sec_wire = '''  {
    id: 'w-sec-bat-bms',
    name: 'Rechargeable Li-Ion Buffer Battery to BMS Board',
    busType: 'POWER',
    sourceComponentId: 'pwr_backup_battery',
    sourcePinId: 'bat_pos',
    destComponentId: 'pwr_bms',
    destPinId: 'b_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+14.8V DC',
    connectionPurpose: 'Connects secondary high-current buffer battery to protection and balancing circuit',
    signalDescription: 'Unregulated cell stack power connection'
  },'''

new_sec_wire = '''  {
    id: 'w-sec-bat-bms',
    name: 'Rechargeable LiPo Backup Battery Pack to BMS Board',
    busType: 'POWER',
    sourceComponentId: 'pwr_backup_battery',
    sourcePinId: 'bat_pos',
    destComponentId: 'pwr_bms',
    destPinId: 'b_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: 'DC Buffer Rail',
    connectionPurpose: 'Connects secondary high-current LiPo pouch buffer battery to BMS protection and balancing circuit',
    signalDescription: 'High-rate multi-cell LiPo pouch buffer connection to BMS board'
  },'''

assert old_sec_wire in underwater_wires, 'old_sec_wire not found in underwater_wires'
underwater_wires = underwater_wires.replace(old_sec_wire, new_sec_wire)

# Replace w-bms-path-mgr description
underwater_wires = underwater_wires.replace(
    'Protected Li-Ion Buffer Power to Power Path Manager',
    'Protected LiPo Buffer Power to Power Path Manager'
)
underwater_wires = underwater_wires.replace(
    'Delivers BMS-protected secondary Li-ion energy',
    'Delivers BMS-protected secondary LiPo energy'
)

# Strip any waypoints from underwater wires
underwater_wires = re.sub(r'(\s+waypoints:\s*\[\[[^\]]+\]\],)', '', underwater_wires)

# 4. Extract ARDUINO_COMPONENTS
with open('/home/mounish/.gemini/antigravity/brain/0d359625-23e2-4e60-a62b-70dec5d0e1e5/.system_generated/logs/transcript_full.jsonl') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') == 1981:
            cmd = data['tool_calls'][0]['args']['CommandLine']
            idx = cmd.find('new_arduino_chunk = \'\'\'')
            idx2 = cmd.find('\'\'\'\n\nimport re')
            arduino_comps = cmd[idx + len('new_arduino_chunk = \'\'\''):idx2].strip()
            break

# 5. Extract ARDUINO_WIRES
with open('/home/mounish/.gemini/antigravity/brain/0d359625-23e2-4e60-a62b-70dec5d0e1e5/.system_generated/logs/transcript_full.jsonl') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') == 820:
            content = data['tool_calls'][0]['args']['Content']
            idx = content.find('const ARDUINO_WIRES: CircuitWire[] = [')
            idx2 = content.find('// ── COMPONENT HELPER COMPONENT')
            arduino_wires = content[idx:idx2].strip()
            break

# In arduino_wires: replace tmp36_sensor -> tmp36, vs -> vcc, and strip waypoints
arduino_wires = arduino_wires.replace('tmp36_sensor', 'tmp36')
arduino_wires = arduino_wires.replace("destPinId: 'vs'", "destPinId: 'vcc'")
arduino_wires = re.sub(r'(\s+waypoints:\s*\[\[[^\]]+\]\],)', '', arduino_wires)

# 6. ComponentShape, SystemWorkflowBanner, and CircuitConnectionsPage definition
middle_bridge = '''
// ── 4. COMPONENT HELPER COMPONENT (renders SVG shape for each part) ──────────

interface ComponentShapeProps {
  comp: CircuitComponent;
  isSelected: boolean;
  selectedWire?: CircuitWire | null;
  highlightedPinId: string | null;
  onSelectComponent: (comp: CircuitComponent) => void;
  onSelectPin: (comp: CircuitComponent, pin: PinDefinition) => void;
}

function ComponentShape({
  comp,
  isSelected,
  selectedWire,
  highlightedPinId,
  onSelectComponent,
  onSelectPin,
}: ComponentShapeProps) {
  return (
    <g
      className={`circuit-comp-group ${isSelected ? 'selected' : ''}`}
      transform={`translate(${comp.x}, ${comp.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectComponent(comp);
      }}
    >
      {/* ── Genuine Physical Hardware Component Cutout Image ── */}
      <image
        href={comp.imageSrc || `/assets/hardware/${comp.id}.webp?v=5`}
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

      {/* ── Component Neat Engineering Label Card (Rendered Below Hardware Image) ── */}
      {(() => {
        const labelBoxWidth = Math.min(Math.max(comp.width, 140), 220);
        const labelBoxHeight = 44;

        let statusText = '[VERIFIED IMPLEMENTED]';
        let statusColor = '#15803d';
        let statusBg = '#dcfce7';
        let statusBadgeWidth = 116;

        if (comp.id === 'pwr_primary_battery' || comp.name.includes('CONCEPTUAL')) {
          statusText = '[CONCEPTUAL ARCHITECTURE]';
          statusColor = '#b45309';
          statusBg = '#fef3c7';
          statusBadgeWidth = 130;
        } else if (comp.status === 'ARCHITECTURAL') {
          statusText = '[PROPOSED ARCHITECTURAL]';
          statusColor = '#b45309';
          statusBg = '#fef3c7';
          statusBadgeWidth = 126;
        } else if (comp.status === 'SIMULATED') {
          statusText = '[TINKERCAD SIMULATED]';
          statusColor = '#0369a1';
          statusBg = '#e0f2fe';
          statusBadgeWidth = 116;
        }

        return (
          <g transform={`translate(${comp.width / 2}, ${comp.height + 8})`}>
            {/* Background card with subtle drop-shadow */}
            <rect
              x={-labelBoxWidth / 2}
              y={0}
              width={labelBoxWidth}
              height={labelBoxHeight}
              rx={6}
              fill="#ffffff"
              stroke={isSelected ? '#0284c7' : '#cbd5e1'}
              strokeWidth={isSelected ? 1.5 : 1}
              filter="drop-shadow(0 2px 5px rgba(0,0,0,0.06))"
            />
            {/* Line 1: Component Name */}
            <text
              x={0}
              y={12.5}
              textAnchor="middle"
              fill="#0f172a"
              fontSize={8.5}
              fontWeight="800"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              style={{ pointerEvents: 'none' }}
            >
              {comp.name}
            </text>
            {/* Line 2: Short Description / Model */}
            <text
              x={0}
              y={24}
              textAnchor="middle"
              fill="#475569"
              fontSize={7.2}
              fontWeight="600"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              style={{ pointerEvents: 'none' }}
            >
              {comp.modelNumber}
            </text>
            {/* Line 3: Implementation Status Badge */}
            <g transform="translate(0, 29.5)">
              <rect
                x={-statusBadgeWidth / 2}
                y={0}
                width={statusBadgeWidth}
                height={11}
                rx={3}
                fill={statusBg}
              />
              <text
                x={0}
                y={8}
                textAnchor="middle"
                fill={statusColor}
                fontSize={6.5}
                fontWeight="bold"
                letterSpacing={0.4}
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {statusText}
              </text>
            </g>
          </g>
        );
      })()}

      {/* ── Component Pins with Interactive Click Targets ── */}
      {comp.pins.map((pin) => {
        const isPinHighlighted = highlightedPinId === `${comp.id}:${pin.id}`;
        let pinColor = '#94a3b8';
        if (pin.type === 'POWER') pinColor = '#ef4444';
        if (pin.type === 'GROUND') pinColor = '#0f172a';
        if (pin.type === 'I2C') pinColor = '#0284c7';
        if (pin.type === 'ADC') pinColor = '#f97316';
        if (pin.type === 'GPIO') pinColor = '#22c55e';
        if (pin.type === 'UART') pinColor = '#0d9488';

        return (
          <g
            key={pin.id}
            className={`circuit-pin-point ${isPinHighlighted ? 'pin-highlighted' : ''}`}
            transform={`translate(${pin.x}, ${pin.y})`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPin(comp, pin);
            }}
          >
            {/* Outer hover ring */}
            <circle cx={0} cy={0} r={7} fill="transparent" stroke={isPinHighlighted ? '#38bdf8' : 'transparent'} strokeWidth={2.5} className="pin-target-ring" />
            {/* Metallic Gold Pin Lug */}
            <circle cx={0} cy={0} r={4.5} fill="#fbbf24" stroke="#d97706" strokeWidth={1} />
            {/* Inner Signal Core Dot */}
            <circle cx={0} cy={0} r={2} fill={pinColor} />
            {/* Pin Label */}
            <text
              x={pin.x < comp.width / 2 ? 8 : -8}
              y={3}
              textAnchor={pin.x < comp.width / 2 ? 'start' : 'end'}
              fill="#f8fafc"
              fontSize={8}
              fontFamily="monospace"
              fontWeight="bold"
              style={{ pointerEvents: 'none', textShadow: '0 1px 2px #000' }}
            >
              {pin.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ── 5. COMPLETE END-TO-END SYSTEM WORKFLOW BANNER ────────────────────────────

function SystemWorkflowBanner() {
  const steps = [
    { num: '1', title: 'Sensors', desc: 'Keller 60MPa, RTD, IMU, Leak', icon: '🌊' },
    { num: '2', title: 'STM32H7 Core', desc: 'Deterministic Data Acquisition', icon: '⚡' },
    { num: '3', title: 'SNC Router', desc: 'Swarm Mesh & TDMA Sched.', icon: '🧠' },
    { num: '4', title: 'Jetson AI', desc: 'Spectrogram & Anomaly Net', icon: '🤖' },
    { num: '5', title: 'Acoustic TX', desc: 'DDS DAC ➔ 100W Amp ➔ PZT', icon: '🔊' },
    { num: '6', title: 'Subsea Net', desc: 'Multi-Hop Acoustic Relays', icon: '📡' },
    { num: '7', title: 'Storage', desc: 'SLC MicroSD + eMMC/NVMe', icon: '💾' },
    { num: '8', title: 'Mission UI', desc: 'Spark Big Data & Dashboard', icon: '📊' },
  ];

  return (
    <g transform="translate(40, 710)">
      {/* Background Container */}
      <rect x={0} y={0} width={1500} height={170} rx={10} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1.5} filter="drop-shadow(0 2px 8px rgba(0,0,0,0.06))" />

      {/* Header */}
      <text x={24} y={30} fill="#0f172a" fontSize={13} fontWeight="800" letterSpacing={0.5}>
        🔄 COMPLETE END-TO-END MARISLINK SYSTEM WORKFLOW
      </text>
      <text x={490} y={30} fill="#64748b" fontSize={10} fontWeight="600">
        Primary Sensor Acquisition ➔ AI Spectrogram Analysis ➔ Acoustic Physical Layer Transmission
      </text>

      {/* Steps Pipeline */}
      {steps.map((st, i) => {
        const cardX = 24 + i * 182;
        return (
          <g key={st.num} transform={`translate(${cardX}, 45)`}>
            <rect x={0} y={0} width={164} height={64} rx={6} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} />
            <circle cx={18} cy={20} r={10} fill="#0284c7" />
            <text x={18} y={24} textAnchor="middle" fill="#ffffff" fontSize={10} fontWeight="bold">{st.num}</text>
            <text x={34} y={22} fill="#0f172a" fontSize={10.5} fontWeight="800">{st.icon} {st.title}</text>
            <text x={10} y={48} fill="#64748b" fontSize={8} fontWeight="600">{st.desc}</text>
            {i < steps.length - 1 && (
              <text x={172} y={36} fill="#0284c7" fontSize={13} fontWeight="bold">➔</text>
            )}
          </g>
        );
      })}

      {/* Dual Receive Acoustic Path Banner */}
      <rect x={24} y={120} width={1452} height={36} rx={6} fill="#eff6ff" stroke="#bfdbfe" strokeWidth={1} />
      <text x={38} y={142} fill="#1e40af" fontSize={9.5} fontWeight="700">
        👂 ACOUSTIC RECEIVING PATH: Subsea Hydrophone (TC4013) ➔ Ultra-Low Noise LNA (&lt;1.2nV/√Hz) ➔ 24-bit 192kSPS ADC ➔ STM32H7 Demodulation ➔ Jetson Orin AI Inference ➔ SNC Adaptive Mesh Route
      </text>
    </g>
  );
}

// ── MAIN CIRCUIT CONNECTIONS WORKSPACE ───────────────────────────────────────

interface CircuitConnectionsPageProps {
  onNavigateToSpark?: () => void;
}

export function CircuitConnectionsPage({ onNavigateToSpark }: CircuitConnectionsPageProps) {
  const [mode, setMode] = useState<CircuitMode>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('mode');
      if (p === 'esp32_wokwi' || p === 'arduino_tinkercad' || p === 'complete_underwater') return p;
    }
    return 'complete_underwater';
  });
  const [busFilter, setBusFilter] = useState<BusFilter>('ALL');
  const [selectedComponent, setSelectedComponent] = useState<CircuitComponent | null>(null);
  const [selectedWire, setSelectedWire] = useState<CircuitWire | null>(null);
  const [highlightedPin, setHighlightedPin] = useState<{ compId: string; pinId: string } | null>(null);

  // Pan & Zoom Canvas Transform State
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 10, y: 10 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<SVGSVGElement | null>(null);

  // Current active components based on mode
  const currentComponents = useMemo(() => {
    switch (mode) {
      case 'complete_underwater':
        return UNDERWATER_COMPONENTS;
      case 'esp32_wokwi':
        return ESP32_COMPONENTS;
      case 'arduino_tinkercad':
        return ARDUINO_COMPONENTS;
      default:
        return UNDERWATER_COMPONENTS;
    }
  }, [mode]);
'''

# 7. Assemble full file
full_code = head_part + '\n\n' + underwater_comps + '\n\n' + underwater_wires + '\n\n' + arduino_comps + '\n\n' + arduino_wires + '\n\n' + middle_bridge + '\n\n  ' + tail_part

with open('src/pages/CircuitConnectionsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(full_code)

print('[SUCCESS] Successfully reconstructed CircuitConnectionsPage.tsx!')
