#!/usr/bin/env python3
"""
build_full_circuit_page.py
Reassembles src/pages/CircuitConnectionsPage.tsx with 100% syntactic and architectural precision:
- Exact orthogonal waypoints for all 72 wires (Mode A: 17, Mode B: 43, Mode C: 12).
- Filleted path corners (r=8px).
- Terminal connection solder dots.
- Power (2.8px) vs Signal (2.0px) line weights.
- Static inactive wires; animated pulse ONLY on selected wire.
"""

import json, re, sys
sys.path.insert(0, 'scripts')

from verify_mode_a_orthogonality import mode_a_waypoints
from verify_mode_b_orthogonality import mode_b_waypoints
from verify_mode_c_orthogonality import mode_c_waypoints

with open('/home/mounish/.gemini/antigravity/brain/0d359625-23e2-4e60-a62b-70dec5d0e1e5/.system_generated/logs/transcript_full.jsonl') as f:
    for line in f:
        data = json.loads(line)
        si = data.get('step_index')
        if si == 820:
            c820 = data['tool_calls'][0]['args']['Content']
            break

# 1. HEAD & TYPES
types_head = '''import React, { useState, useRef, useMemo, useCallback } from 'react';
import './CircuitConnectionsPage.css';

// ── TYPES & INTERFACES ────────────────────────────────────────────────────────

export type CircuitMode = 'complete_underwater' | 'esp32_wokwi' | 'arduino_tinkercad';

export type BusFilter = 'ALL' | 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC' | 'DAC' | 'ADC/DAC' | 'GPIO' | 'PWM' | 'GPIO/PWM' | 'USB' | 'PCIe' | 'USB/PCIe';

export interface PinDefinition {
  id: string;
  label: string;
  x: number; // coordinate relative to component top-left
  y: number; // coordinate relative to component top-left
  type: 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC' | 'DAC' | 'GPIO' | 'PWM' | 'USB' | 'PCIe';
  description: string;
}

export interface CircuitComponent {
  id: string;
  name: string;
  category: 'MCU' | 'SENSOR' | 'POWER' | 'COMMUNICATION' | 'INTERFACE' | 'STORAGE' | 'INDICATOR' | 'PASSIVE' | 'BREADBOARD' | 'ACTUATOR' | 'DISPLAY' | 'ACOUSTIC' | 'AI_PROCESSOR';
  modelNumber: string;
  status?: 'IMPLEMENTED' | 'SIMULATED' | 'ARCHITECTURAL';
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
  roleInMarislink: string;
  protocol: string;
  operatingVoltage: string;
  currentDraw: string;
  powerRequirements?: string;
  inputPins?: string[];
  outputPins?: string[];
  connectedDevices?: string[];
  technicalExplanation?: string;
  tinkercadEquivNote?: string;
  imageSrc?: string;
  pins: PinDefinition[];
}

export interface CircuitWire {
  id: string;
  name: string;
  busType: 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC' | 'DAC' | 'ADC/DAC' | 'GPIO' | 'PWM' | 'GPIO/PWM' | 'USB' | 'PCIe' | 'USB/PCIe';
  sourceComponentId: string;
  sourcePinId: string;
  destComponentId: string;
  destPinId: string;
  color: string;
  colorName?: string;
  voltage?: string;
  signalDirection?: 'SOURCE_TO_DEST' | 'DEST_TO_SOURCE' | 'BIDIRECTIONAL';
  connectionPurpose?: string;
  signalDescription?: string;
  waypoints?: [number, number][];
}

export interface CircuitGroup {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  accent: string;
}
'''

# 2. ESP32_COMPONENTS
idx = c820.find('const ESP32_COMPONENTS: CircuitComponent[] = [')
idx2 = c820.find('const ESP32_WIRES: CircuitWire[] = [')
esp32_comps = c820[idx:idx2].strip()

# 3. ESP32_WIRES with updated orthogonal waypoints
idx = c820.find('const ESP32_WIRES: CircuitWire[] = [')
idx2 = c820.find('const ARDUINO_COMPONENTS: CircuitComponent[] = [')
esp32_wires_raw = c820[idx:idx2].strip()

def inject_waypoints(wires_text, wps_dict):
    def repl(m):
        block = m.group(0)
        id_m = re.search(r"id:\s*'([^']+)'", block)
        if not id_m: return block
        wid = id_m.group(1)
        if wid in wps_dict:
            pts_json = json.dumps(wps_dict[wid])
            # Strip old waypoints
            block = re.sub(r",?\s*waypoints:\s*\[\[.*?\]\]", "", block, flags=re.DOTALL)
            # Find the closing brace on its own line
            last_brace_m = re.search(r"\n\s*\},?", block)
            if last_brace_m:
                idx = last_brace_m.start()
                prefix = block[:idx].rstrip().rstrip(',')
                suffix = block[idx:]
                return prefix + f",\n    waypoints: {pts_json}" + suffix
        return block
    # Match wire block anchored by newline before and closing brace on its own line
    return re.sub(r'\n\s*\{\s*\n\s*id:\s*\'[^\']+\'.*?\n\s*\},?', repl, wires_text, flags=re.DOTALL)

esp32_wires = inject_waypoints(esp32_wires_raw, mode_a_waypoints)

# 4. UNDERWATER_GROUPS
underwater_groups = '''export const UNDERWATER_GROUPS: CircuitGroup[] = [
  { id: 'group_pwr', name: 'A. POWER MANAGEMENT', x: 30, y: 30, width: 710, height: 550, color: 'rgba(239, 68, 68, 0.03)', accent: '#ef4444' },
  { id: 'group_sensors', name: 'B. SENSOR INPUTS', x: 30, y: 615, width: 730, height: 215, color: 'rgba(6, 182, 212, 0.03)', accent: '#06b6d4' },
  { id: 'group_processing', name: 'C. MAIN PROCESSING', x: 770, y: 150, width: 600, height: 430, color: 'rgba(59, 130, 246, 0.04)', accent: '#3b82f6' },
  { id: 'group_rx', name: 'D. ACOUSTIC RECEIVER', x: 1390, y: 30, width: 700, height: 215, color: 'rgba(168, 85, 247, 0.03)', accent: '#a855f7' },
  { id: 'group_tx', name: 'E. ACOUSTIC TRANSMITTER', x: 1390, y: 270, width: 700, height: 215, color: 'rgba(236, 72, 153, 0.03)', accent: '#ec4899' },
  { id: 'group_storage', name: 'F. STORAGE', x: 790, y: 615, width: 550, height: 215, color: 'rgba(16, 185, 129, 0.03)', accent: '#10b981' },
  { id: 'group_interfaces', name: 'G. EXTERNAL INTERFACES', x: 1390, y: 520, width: 440, height: 215, color: 'rgba(245, 158, 11, 0.03)', accent: '#f59e0b' },
  { id: 'group_indicators', name: 'H. STATUS INDICATORS', x: 1850, y: 520, width: 240, height: 215, color: 'rgba(34, 197, 94, 0.03)', accent: '#22c55e' },
];'''

# 5. UNDERWATER_COMPONENTS (from apply_marislink_final_corrections.py)
with open('scripts/apply_marislink_final_corrections.py', 'r', encoding='utf-8') as f:
    apply_code = f.read()

idx = apply_code.find('new_underwater_components = """')
idx2 = apply_code.find('"""\n\ncontent = content[:comp_start]')
underwater_comps = apply_code[idx + len('new_underwater_components = """'):idx2].strip()

# Replace primary and backup battery in underwater_comps with final versions
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
underwater_comps = underwater_comps.replace('backup Li-ion buffer', 'backup LiPo buffer')
underwater_comps = underwater_comps.replace('Guards the Li-ion energy buffer', 'Guards the LiPo energy buffer')

# 6. UNDERWATER_WIRES (from rebuild script)
with open('scripts/rebuild_circuit_connections_page.py', 'r', encoding='utf-8') as f:
    rebuild_code = f.read()

idx = rebuild_code.find('UNDERWATER_WIRES_TS = \'\'\'')
idx2 = rebuild_code.find('\'\'\'\n\n# Replace UNDERWATER_COMPONENTS')
underwater_wires_raw = rebuild_code[idx + len('UNDERWATER_WIRES_TS = \'\'\''):idx2].strip()

# Update battery wires in underwater_wires_raw
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

underwater_wires_raw = underwater_wires_raw.replace(old_pri_wire, new_pri_wires)

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

underwater_wires_raw = underwater_wires_raw.replace(old_sec_wire, new_sec_wire)
underwater_wires_raw = underwater_wires_raw.replace('Protected Li-Ion Buffer Power to Power Path Manager', 'Protected LiPo Buffer Power to Power Path Manager')
underwater_wires_raw = underwater_wires_raw.replace('Delivers BMS-protected secondary Li-ion energy', 'Delivers BMS-protected secondary LiPo energy')

# Now inject mode_b_waypoints into underwater_wires_raw
underwater_wires = inject_waypoints(underwater_wires_raw, mode_b_waypoints)

# 7. ARDUINO_COMPONENTS
with open('/home/mounish/.gemini/antigravity/brain/0d359625-23e2-4e60-a62b-70dec5d0e1e5/.system_generated/logs/transcript_full.jsonl') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') == 1981:
            cmd = data['tool_calls'][0]['args']['CommandLine']
            idx = cmd.find('new_arduino_chunk = \'\'\'')
            idx2 = cmd.find('\'\'\'\n\nimport re')
            arduino_comps = cmd[idx + len('new_arduino_chunk = \'\'\''):idx2].strip()
            break

# Add breadboard_half LED pins to arduino_comps
old_bb_pins = """    pins: [
      { id: 'pwr_top_plus', label: 'Top (+)', x: 40, y: 32, type: 'POWER', description: 'Top Positive 5V Power Rail' },
      { id: 'pwr_top_minus', label: 'Top (-)', x: 40, y: 52, type: 'GROUND', description: 'Top Ground Return Rail' },
      { id: 'pwr_bot_plus', label: 'Bot (+)', x: 40, y: 192, type: 'POWER', description: 'Bottom Positive 5V Power Rail' },
      { id: 'pwr_bot_minus', label: 'Bot (-)', x: 40, y: 212, type: 'GROUND', description: 'Bottom Ground Return Rail' }
    ]"""

new_bb_pins = """    pins: [
      { id: 'pwr_top_plus', label: 'Top (+)', x: 40, y: 32, type: 'POWER', description: 'Top Positive 5V Power Rail' },
      { id: 'pwr_top_minus', label: 'Top (-)', x: 40, y: 52, type: 'GROUND', description: 'Top Ground Return Rail' },
      { id: 'pwr_bot_plus', label: 'Bot (+)', x: 40, y: 192, type: 'POWER', description: 'Bottom Positive 5V Power Rail' },
      { id: 'pwr_bot_minus', label: 'Bot (-)', x: 40, y: 212, type: 'GROUND', description: 'Bottom Ground Return Rail' },
      { id: 'row_led_green', label: 'Row 14', x: 205, y: 130, type: 'GPIO', description: 'Row 14 Green LED Terminal' },
      { id: 'row_led_yellow', label: 'Row 18', x: 245, y: 130, type: 'GPIO', description: 'Row 18 Yellow LED Terminal' },
      { id: 'row_led_red', label: 'Row 22', x: 285, y: 130, type: 'GPIO', description: 'Row 22 Red LED Terminal' }
    ]"""

arduino_comps = arduino_comps.replace(old_bb_pins, new_bb_pins)

# 8. ARDUINO_WIRES
idx = c820.find('const ARDUINO_WIRES: CircuitWire[] = [')
idx2 = c820.find('// ── COMPONENT HELPER COMPONENT')
arduino_wires_raw = c820[idx:idx2].strip()
arduino_wires_raw = arduino_wires_raw.replace('tmp36_sensor', 'tmp36')
arduino_wires_raw = arduino_wires_raw.replace("destPinId: 'vs'", "destPinId: 'vcc'")
arduino_wires = inject_waypoints(arduino_wires_raw, mode_c_waypoints)

# 9. ROUTING HELPERS
routing_helpers = '''// ── SMART ORTHOGONAL ROUTING & FILLET GENERATION ────────────────────────────

function computeOrthogonalPoints(
  src: { x: number; y: number },
  dst: { x: number; y: number },
  waypoints?: [number, number][]
): [number, number][] {
  if (waypoints && waypoints.length >= 2) {
    const raw = [...waypoints];
    const first = raw[0];
    const pts: [number, number][] = [[src.x, src.y]];

    // Connect from src to first waypoint orthogonally if needed
    if (Math.abs(first[0] - src.x) > 1 || Math.abs(first[1] - src.y) > 1) {
      if (first[0] !== src.x && first[1] !== src.y) {
        pts.push([src.x, first[1]]);
      }
    }

    for (let i = 0; i < raw.length; i++) {
      const p = raw[i];
      const prev = pts[pts.length - 1];
      if (Math.abs(p[0] - prev[0]) > 0.5 || Math.abs(p[1] - prev[1]) > 0.5) {
        if (p[0] !== prev[0] && p[1] !== prev[1]) {
          pts.push([prev[0], p[1]]);
        }
        pts.push([p[0], p[1]]);
      }
    }

    // Connect last point to dst orthogonally
    const prevLast = pts[pts.length - 1];
    if (Math.abs(prevLast[0] - dst.x) > 1 || Math.abs(prevLast[1] - dst.y) > 1) {
      if (prevLast[0] !== dst.x && prevLast[1] !== dst.y) {
        pts.push([prevLast[0], dst.y]);
      }
      pts.push([dst.x, dst.y]);
    } else {
      pts[pts.length - 1] = [dst.x, dst.y];
    }
    return pts;
  }

  // Fallback 3-segment orthogonal router
  const dx = Math.abs(dst.x - src.x);
  const dy = Math.abs(dst.y - src.y);
  if (dx > dy) {
    const midX = Math.round((src.x + dst.x) / 2);
    return [
      [src.x, src.y],
      [midX, src.y],
      [midX, dst.y],
      [dst.x, dst.y],
    ];
  } else {
    const midY = Math.round((src.y + dst.y) / 2);
    return [
      [src.x, src.y],
      [src.x, midY],
      [dst.x, midY],
      [dst.x, dst.y],
    ];
  }
}

function pointsToFilletedPath(pts: [number, number][], radius = 8): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]}`;
  }

  // Clean collinear and zero-length segments
  const cleaned: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = cleaned[cleaned.length - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    if (
      (p0[0] === p1[0] && p1[0] === p2[0]) ||
      (p0[1] === p1[1] && p1[1] === p2[1])
    ) {
      continue;
    }
    if (p0[0] === p1[0] && p0[1] === p1[1]) {
      continue;
    }
    cleaned.push(p1);
  }
  const last = pts[pts.length - 1];
  const prev = cleaned[cleaned.length - 1];
  if (prev[0] !== last[0] || prev[1] !== last[1]) {
    cleaned.push(last);
  }

  if (cleaned.length === 2) {
    return `M ${cleaned[0][0]} ${cleaned[0][1]} L ${cleaned[1][0]} ${cleaned[1][1]}`;
  }

  let d = `M ${cleaned[0][0]} ${cleaned[0][1]}`;
  for (let i = 1; i < cleaned.length - 1; i++) {
    const p_prev = cleaned[i - 1];
    const p_curr = cleaned[i];
    const p_next = cleaned[i + 1];

    const d1x = p_curr[0] - p_prev[0];
    const d1y = p_curr[1] - p_prev[1];
    const len1 = Math.hypot(d1x, d1y);

    const d2x = p_next[0] - p_curr[0];
    const d2y = p_next[1] - p_curr[1];
    const len2 = Math.hypot(d2x, d2y);

    if (len1 < 1e-4 || len2 < 1e-4) {
      continue;
    }

    const cross = d1x * d2y - d1y * d2x;
    if (Math.abs(cross) < 1e-4) {
      d += ` L ${p_curr[0]} ${p_curr[1]}`;
      continue;
    }

    const r = Math.min(radius, len1 / 2, len2 / 2);
    const sx = p_curr[0] - (d1x / len1) * r;
    const sy = p_curr[1] - (d1y / len1) * r;
    const ex = p_curr[0] + (d2x / len2) * r;
    const ey = p_curr[1] + (d2y / len2) * r;

    d += ` L ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${p_curr[0]} ${p_curr[1]} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  d += ` L ${cleaned[cleaned.length - 1][0]} ${cleaned[cleaned.length - 1][1]}`;
  return d;
}
'''

# 10. Extract ComponentShape, SystemWorkflowBanner, and CircuitConnectionsPage header from step 2308
with open('scripts/reconstruct_circuit_connections_page.py') as f:
    r_code = f.read()

idx = r_code.find('middle_bridge = \'\'\'')
idx2 = r_code.find('\'\'\'\n\n# 7. Assemble full file')
middle_bridge = r_code[idx + len('middle_bridge = \'\'\''):idx2].strip()

# Replace selectedWire unused warning only in ComponentShape
middle_bridge = middle_bridge.replace('  selectedWire,\n  highlightedPinId,', '  selectedWire: _selectedWire,\n  highlightedPinId,')

# 11. Read pristine TAIL from clean_tail.txt (extracted from step 936)
with open('scripts/clean_tail.txt', 'r', encoding='utf-8') as f:
    tail_text = f.read()

# Update renderWirePath inside tail_text to use orthogonal routing, filleted paths, dots, and selective animation
old_render_re = r'const renderWirePath = useCallback\(\(wire: CircuitWire\) => \{.*?\}, \[pinCoordMap, selectedWire\]\);'
new_render_path = """const renderWirePath = useCallback((wire: CircuitWire) => {
    const src = pinCoordMap.get(`${wire.sourceComponentId}:${wire.sourcePinId}`);
    const dst = pinCoordMap.get(`${wire.destComponentId}:${wire.destPinId}`);
    if (!src || !dst) return null;

    const points = computeOrthogonalPoints(src, dst, wire.waypoints);
    const pathD = pointsToFilletedPath(points, 8);
    const isWireSelected = selectedWire?.id === wire.id;
    const isPowerOrGround = wire.busType === 'POWER' || wire.busType === 'GROUND';
    const baseWidth = isPowerOrGround ? 2.8 : 2.0;
    const activeWidth = isPowerOrGround ? 5.2 : 4.2;

    return (
      <g
        key={wire.id}
        className={`circuit-wire-group ${isWireSelected ? 'wire-selected' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handleSelectWire(wire);
        }}
      >
        {/* Transparent wide hitbox for clicking */}
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={16}
          strokeLinecap="round"
          className="wire-hitbox"
        />

        {/* Ambient shadow / depth underlay */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(0, 0, 0, 0.22)"
          strokeWidth={isWireSelected ? activeWidth + 2 : baseWidth + 1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0, 1.5)"
        />

        {/* Crisp solid conductor wire line */}
        <path
          d={pathD}
          fill="none"
          stroke={wire.color}
          strokeWidth={isWireSelected ? activeWidth : baseWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="wire-path-line"
        />

        {/* Dynamic active electrical flow animation ONLY on user selection */}
        {isWireSelected && (
          <path
            d={pathD}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            className="wire-animated-flow"
          />
        )}

        {/* Physical terminal connection solder dots */}
        <circle
          cx={src.x}
          cy={src.y}
          r={3.5}
          fill={wire.color}
          stroke="#ffffff"
          strokeWidth={1.2}
          className="wire-terminal-dot"
        />
        <circle
          cx={dst.x}
          cy={dst.y}
          r={3.5}
          fill={wire.color}
          stroke="#ffffff"
          strokeWidth={1.2}
          className="wire-terminal-dot"
        />
      </g>
    );
  }, [pinCoordMap, selectedWire, handleSelectWire]);"""

tail_text = re.sub(old_render_re, new_render_path, tail_text, flags=re.DOTALL)

# 12. ASSEMBLE COMPLETE FILE
full_file = (
    types_head + "\n\n" +
    esp32_comps + "\n\n" +
    esp32_wires + "\n\n" +
    underwater_groups + "\n\n" +
    underwater_comps + "\n\n" +
    underwater_wires + "\n\n" +
    arduino_comps + "\n\n" +
    arduino_wires + "\n\n" +
    routing_helpers + "\n\n" +
    middle_bridge + "\n\n  " +
    tail_text
)

with open('src/pages/CircuitConnectionsPage.tsx', 'w', encoding='utf-8') as out:
    out.write(full_file)

print(f"[SUCCESS] Rebuilt CircuitConnectionsPage.tsx cleanly! Total length: {len(full_file)} characters, {len(full_file.splitlines())} lines.")
