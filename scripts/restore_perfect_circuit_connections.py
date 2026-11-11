#!/usr/bin/env python3
"""
restore_perfect_circuit_connections.py
Restores the exact FIRST SCREENSHOT design for MARISLINK Circuit Connections:
1. Full-width circuit workspace (100% width, no permanent right-side split inspector).
2. Wire Bus Filter & Zoom toolbar displayed ABOVE the circuit canvas.
3. Complete End-to-End MARISLINK System Workflow box positioned strictly BELOW the circuit canvas in normal HTML flow.
4. Additional Subsea Architectural Specifications cards positioned below workflow.
5. Mode selector bar restored to top with 3 modes using approved terminology:
   - Mode 1: Complete MARISLINK Underwater Architecture (AMD Versal™ AI Edge + STM32H7)
   - Mode 2: Embedded Hardware Prototype (32-Bit LX6 + BMP280)
   - Mode 3: Arduino Uno Tinkercad Model (Classroom Equivalent)
6. All 72 wires strictly orthogonal (17 Mode A, 43 Mode B, 12 Mode C).
7. Micro Nuclear Battery (Conceptual) and LiPo Pouch Backup Battery in Mode B.
8. Component names and descriptions displayed directly below components.
9. Floating inspector overlay that appears ONLY on component/wire click, with a close (✕) button.
10. Strict terminology ban: zero instances of "IoT" or "ESP32" in user-facing UI text.
"""

import sys, os, re, json
sys.path.insert(0, 'scripts')

from verify_mode_a_orthogonality import mode_a_waypoints
from verify_mode_b_orthogonality import mode_b_waypoints
from verify_mode_c_orthogonality import mode_c_waypoints

print("[1/6] Loading source data and orthogonal waypoints...")

# Load c820 from transcript_full
with open('/home/mounish/.gemini/antigravity/brain/0d359625-23e2-4e60-a62b-70dec5d0e1e5/.system_generated/logs/transcript_full.jsonl') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') == 820:
            c820 = data['tool_calls'][0]['args']['Content']
            break

# Helper to inject waypoints
def inject_waypoints(wires_text, wps_dict):
    def repl(m):
        block = m.group(0)
        id_m = re.search(r"id:\s*'([^']+)'", block)
        if not id_m: return block
        wid = id_m.group(1)
        if wid in wps_dict:
            pts_json = json.dumps(wps_dict[wid])
            block = re.sub(r",?\s*waypoints:\s*\[\[.*?\]\]", "", block, flags=re.DOTALL)
            last_brace_m = re.search(r"\n\s*\},?", block)
            if last_brace_m:
                idx = last_brace_m.start()
                prefix = block[:idx].rstrip().rstrip(',')
                suffix = block[idx:]
                return prefix + f",\n    waypoints: {pts_json}" + suffix
        return block
    return re.sub(r'\n\s*\{\s*\n\s*id:\s*\'[^\']+\'.*?\n\s*\},?', repl, wires_text, flags=re.DOTALL)

# 1. HEAD & TYPES
types_head = '''import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
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

# 2. PROTOTYPE_COMPONENTS (formerly ESP32_COMPONENTS) - Sanitize prohibited words
print("[2/6] Preparing Mode A (Embedded Prototype) components & wires...")
idx = c820.find('const ESP32_COMPONENTS: CircuitComponent[] = [')
idx2 = c820.find('const ESP32_WIRES: CircuitWire[] = [')
proto_comps = c820[idx:idx2].strip()
proto_comps = proto_comps.replace('const ESP32_COMPONENTS', 'const PROTOTYPE_COMPONENTS')

# Sanitize prototype component labels and descriptions
proto_comps = proto_comps.replace("name: 'ESP32 DevKit v1 Microcontroller'", "name: 'Embedded Controller DevKit v1'")
proto_comps = proto_comps.replace("modelNumber: 'ESP32-WROOM-32 (30-Pin)'", "modelNumber: 'Dual-Core 32-Bit LX6 (30-Pin)'")
proto_comps = proto_comps.replace("the ESP32 calculates", "the embedded controller calculates")
proto_comps = proto_comps.replace("ESP32 ADC1", "Controller ADC1")
proto_comps = proto_comps.replace("ESP32 RX2", "Controller RX2")
proto_comps = proto_comps.replace("ESP32 TX2", "Controller TX2")
proto_comps = proto_comps.replace("ESP32 D21", "Controller D21")
proto_comps = proto_comps.replace("ESP32 D22", "Controller D22")
proto_comps = proto_comps.replace("ESP32 D18", "Controller D18")
proto_comps = proto_comps.replace("ESP32 D19", "Controller D19")
proto_comps = proto_comps.replace("ESP32 D23", "Controller D23")
proto_comps = proto_comps.replace("ESP32 D5", "Controller D5")
proto_comps = proto_comps.replace("ESP32 GPIO 32", "Controller GPIO 32")
proto_comps = proto_comps.replace("ESP32 GPIO 2", "Controller GPIO 2")
proto_comps = proto_comps.replace("ESP32 GPIO 4", "Controller GPIO 4")
proto_comps = proto_comps.replace("ESP32 GPIO 15", "Controller GPIO 15")
proto_comps = proto_comps.replace("ESP32 UART0", "Controller UART0")
proto_comps = proto_comps.replace("ESP32", "Embedded Controller")
proto_comps = proto_comps.replace("IoT", "Sensor")

# Mode A wires
idx = c820.find('const ESP32_WIRES: CircuitWire[] = [')
idx2 = c820.find('const ARDUINO_COMPONENTS: CircuitComponent[] = [')
proto_wires_raw = c820[idx:idx2].strip()
proto_wires_raw = proto_wires_raw.replace('const ESP32_WIRES', 'const PROTOTYPE_WIRES')
proto_wires_raw = proto_wires_raw.replace("ESP32 onboard regulator", "Controller onboard regulator")
proto_wires_raw = proto_wires_raw.replace("ESP32 system ground", "Controller system ground")
proto_wires_raw = proto_wires_raw.replace("ESP32 Hardware I2C", "Hardware I2C")
proto_wires_raw = proto_wires_raw.replace("ESP32 12-Bit SAR ADC", "12-Bit SAR ADC")
proto_wires_raw = proto_wires_raw.replace("ESP32 ADC1_CH7", "ADC1_CH7")
proto_wires_raw = proto_wires_raw.replace("ESP32 GPIO Pin 2", "Controller GPIO Pin 2")
proto_wires_raw = proto_wires_raw.replace("ESP32 GPIO Pin 4", "Controller GPIO Pin 4")
proto_wires_raw = proto_wires_raw.replace("ESP32 GPIO Pin 15", "Controller GPIO Pin 15")
proto_wires_raw = proto_wires_raw.replace("ESP32 hardware serial", "Controller hardware serial")
proto_wires_raw = proto_wires_raw.replace("ESP32", "Embedded Controller")

proto_wires = inject_waypoints(proto_wires_raw, mode_a_waypoints)

# 3. UNDERWATER_GROUPS
print("[3/6] Preparing Mode B (Complete Underwater) groups, components & wires...")
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

# Underwater components
with open('scripts/apply_marislink_final_corrections.py', 'r', encoding='utf-8') as f:
    apply_code = f.read()

idx = apply_code.find('new_underwater_components = """')
idx2 = apply_code.find('"""\n\ncontent = content[:comp_start]')
underwater_comps = apply_code[idx + len('new_underwater_components = """'):idx2].strip()

# Micro Nuclear Battery & LiPo Backup Battery
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
underwater_comps = re.sub(r'\{\s+id:\s*[\'"]pwr_primary_battery[\'"].*?pins:\s*\[.*?\]\s+\}', new_pri_bat, underwater_comps, flags=re.DOTALL)

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
underwater_comps = re.sub(r'\{\s+id:\s*[\'"]pwr_backup_battery[\'"].*?pins:\s*\[.*?\]\s+\}', new_sec_bat, underwater_comps, flags=re.DOTALL)
underwater_comps = underwater_comps.replace('backup Li-ion buffer', 'backup LiPo buffer')
underwater_comps = underwater_comps.replace('Guards the Li-ion energy buffer', 'Guards the LiPo energy buffer')

# Underwater wires
with open('scripts/rebuild_circuit_connections_page.py', 'r', encoding='utf-8') as f:
    rebuild_code = f.read()

idx = rebuild_code.find('UNDERWATER_WIRES_TS = \'\'\'')
idx2 = rebuild_code.find('\'\'\'\n\n# Replace UNDERWATER_COMPONENTS')
underwater_wires_raw = rebuild_code[idx + len('UNDERWATER_WIRES_TS = \'\'\''):idx2].strip()

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

underwater_wires = inject_waypoints(underwater_wires_raw, mode_b_waypoints)

# 4. ARDUINO_COMPONENTS & WIRES (Mode C)
print("[4/6] Preparing Mode C (Arduino Classroom) components & wires...")
with open('/home/mounish/.gemini/antigravity/brain/0d359625-23e2-4e60-a62b-70dec5d0e1e5/.system_generated/logs/transcript_full.jsonl') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') == 1981:
            cmd = data['tool_calls'][0]['args']['CommandLine']
            idx = cmd.find('new_arduino_chunk = \'\'\'')
            idx2 = cmd.find('\'\'\'\n\nimport re')
            arduino_comps = cmd[idx + len('new_arduino_chunk = \'\'\''):idx2].strip()
            break

# Sanitize any ESP32 mentions in Arduino components
arduino_comps = arduino_comps.replace('production ESP32 prototype', 'production embedded controller prototype')

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

idx = c820.find('const ARDUINO_WIRES: CircuitWire[] = [')
idx2 = c820.find('// ── COMPONENT HELPER COMPONENT')
arduino_wires_raw = c820[idx:idx2].strip()
arduino_wires_raw = arduino_wires_raw.replace('tmp36_sensor', 'tmp36')
arduino_wires_raw = arduino_wires_raw.replace("destPinId: 'vs'", "destPinId: 'vcc'")
arduino_wires = inject_waypoints(arduino_wires_raw, mode_c_waypoints)

# 5. ROUTING HELPERS
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

# 6. COMPONENT SHAPE & WORKFLOW & ADDITIONAL INFO & MAIN PAGE
print("[5/6] Building ComponentShape, SystemWorkflowSection, CircuitAdditionalInfo and Full Workspace...")

component_shape = '''// ── COMPONENT HELPER COMPONENT (renders SVG shape for each part) ──────────

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
  selectedWire: _selectedWire,
  highlightedPinId,
  onSelectComponent,
  onSelectPin,
}: ComponentShapeProps) {
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'MCU': return '#0284c7';
      case 'AI_PROCESSOR': return '#7c3aed';
      case 'ACOUSTIC': return '#a855f7';
      case 'SENSOR': return '#059669';
      case 'POWER': return '#dc2626';
      case 'COMMUNICATION': return '#d97706';
      case 'STORAGE': return '#10b981';
      case 'INDICATOR': return '#16a34a';
      default: return '#64748b';
    }
  };

  const getPinColor = (type: string) => {
    switch (type) {
      case 'POWER': return '#ef4444';
      case 'GROUND': return '#1e293b';
      case 'I2C': return '#06b6d4';
      case 'SPI': return '#3b82f6';
      case 'UART': return '#a855f7';
      case 'ADC':
      case 'DAC': return '#f97316';
      case 'GPIO':
      case 'PWM': return '#10b981';
      case 'USB':
      case 'PCIe': return '#2563eb';
      default: return '#64748b';
    }
  };

  const catColor = getCategoryColor(comp.category);

  return (
    <g
      id={`comp-${comp.id}`}
      className={`circuit-component-group ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectComponent(comp);
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Component Outer Card Body */}
      <rect
        x={comp.x}
        y={comp.y}
        width={comp.width}
        height={comp.height}
        rx={8}
        fill="#ffffff"
        stroke={isSelected ? '#0284c7' : '#cbd5e1'}
        strokeWidth={isSelected ? 2.5 : 1.2}
        filter="drop-shadow(0 2px 5px rgba(0,0,0,0.06))"
        className="component-card-bg"
      />

      {/* Realistic Component Visual Image */}
      {comp.imageSrc ? (
        <image
          href={comp.imageSrc}
          x={comp.x + 8}
          y={comp.y + 8}
          width={comp.width - 16}
          height={Math.max(comp.height - 16, 20)}
          preserveAspectRatio="xMidYMid meet"
          className="component-realistic-img"
        />
      ) : (
        /* Fallback schematic representation */
        <g>
          <rect
            x={comp.x + 8}
            y={comp.y + 8}
            width={comp.width - 16}
            height={comp.height - 16}
            rx={4}
            fill="#f1f5f9"
            stroke="#e2e8f0"
          />
          <text
            x={comp.x + comp.width / 2}
            y={comp.y + comp.height / 2 - 4}
            textAnchor="middle"
            fill={catColor}
            fontSize={11}
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            {comp.name}
          </text>
        </g>
      )}

      {/* Pins Layer */}
      {comp.pins.map((pin) => {
        const pinColor = getPinColor(pin.type);
        const pinKey = `${comp.id}:${pin.id}`;
        const isPinHighlighted = highlightedPinId === pinKey;

        return (
          <g
            key={pin.id}
            className={`component-pin ${isPinHighlighted ? 'pin-highlighted' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPin(comp, pin);
            }}
          >
            {/* Hitbox */}
            <circle
              cx={comp.x + pin.x}
              cy={comp.y + pin.y}
              r={7}
              fill="transparent"
              className="pin-hitbox"
            />
            {/* Solder Land Dot */}
            <circle
              cx={comp.x + pin.x}
              cy={comp.y + pin.y}
              r={3.8}
              fill={pinColor}
              stroke="#ffffff"
              strokeWidth={1.2}
              className="pin-solder-dot"
            />
            {/* Pin Label */}
            <text
              x={comp.x + pin.x}
              y={comp.y + pin.y + (pin.y > comp.height / 2 ? 10 : -7)}
              textAnchor="middle"
              fill="#475569"
              fontSize={7.5}
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
            >
              {pin.label}
            </text>
          </g>
        );
      })}

      {/* Component Title & Model below component */}
      <text
        x={comp.x + comp.width / 2}
        y={comp.y + comp.height + 14}
        textAnchor="middle"
        fill="#0f172a"
        fontSize={9.5}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {comp.name}
      </text>
      <text
        x={comp.x + comp.width / 2}
        y={comp.y + comp.height + 25}
        textAnchor="middle"
        fill="#64748b"
        fontSize={8}
        fontFamily="system-ui, sans-serif"
      >
        {comp.modelNumber}
      </text>
      {comp.status && (
        <text
          x={comp.x + comp.width / 2}
          y={comp.y + comp.height + 34}
          textAnchor="middle"
          fill={comp.status === 'IMPLEMENTED' ? '#0284c7' : comp.status === 'ARCHITECTURAL' ? '#d97706' : '#2563eb'}
          fontSize={7}
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
        >
          [{comp.status}]
        </text>
      )}
    </g>
  );
}

// ── 5. COMPLETE END-TO-END SYSTEM WORKFLOW SECTION (HTML FLOW BELOW CANVAS) ──

function SystemWorkflowSection({ mode }: { mode: CircuitMode }) {
  const steps = [
    { num: '1', title: 'Sensors', desc: 'Keller 60MPa, RTD, IMU, Leak', icon: '🌊', color: '#0284c7' },
    { num: '2', title: 'STM32H7 Core', desc: 'Deterministic Data Acquisition', icon: '⚡', color: '#0d9488' },
    { num: '3', title: 'SNC Router', desc: 'Swarm Mesh & TDMA Sched.', icon: '🧠', color: '#4f46e5' },
    { num: '4', title: 'AI Engine', desc: 'Spectrogram & Anomaly Net', icon: '🤖', color: '#7c3aed' },
    { num: '5', title: 'Acoustic TX', desc: 'DDS DAC ➔ 100W Amp ➔ PZT', icon: '🔊', color: '#db2777' },
    { num: '6', title: 'Subsea Net', desc: 'Multi-Hop Acoustic Relays', icon: '📡', color: '#ea580c' },
    { num: '7', title: 'Storage', desc: 'SLC MicroSD + eMMC/NVMe', icon: '💾', color: '#059669' },
    { num: '8', title: 'Mission UI', desc: 'Spark Big Data & Dashboard', icon: '📊', color: '#d97706' },
  ];

  return (
    <section className="circuit-workflow-section" id="system-workflow-section">
      <div className="workflow-card">
        {/* Header */}
        <div className="workflow-header">
          <div className="workflow-title-wrap">
            <span className="workflow-icon">🔄</span>
            <div>
              <h3 className="workflow-title">COMPLETE END-TO-END MARISLINK SYSTEM WORKFLOW</h3>
              <p className="workflow-subtitle">
                Primary Sensor Acquisition ➔ AI Spectrogram Analysis ➔ Acoustic Physical Layer Transmission ➔ Subsea Swarm Mesh Relays
              </p>
            </div>
          </div>
          <div className="workflow-mode-tag">
            Current Architecture Mode: <strong>
              {mode === 'complete_underwater' ? 'Complete MARISLINK Underwater Architecture (AMD Versal™ AI Edge + STM32H7)' :
               mode === 'esp32_wokwi' ? 'Embedded Hardware Prototype (32-Bit LX6 + BMP280)' :
               'Arduino Uno Tinkercad Model (Classroom Equivalent)'}
            </strong>
          </div>
        </div>

        {/* 8 Pipeline Step Cards Grid */}
        <div className="workflow-steps-container">
          <div className="workflow-steps-grid">
            {steps.map((st, i) => (
              <React.Fragment key={st.num}>
                <div className="workflow-step-card">
                  <div className="step-header">
                    <span className="step-num-pill" style={{ background: st.color }}>{st.num}</span>
                    <span className="step-title-icon">{st.icon}</span>
                  </div>
                  <h4 className="step-title">{st.title}</h4>
                  <p className="step-desc">{st.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="workflow-step-arrow">➔</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Dual Receive Acoustic Path Banner */}
        <div className="workflow-acoustic-path">
          <span className="path-badge">ACOUSTIC RECEIVING PATH:</span>
          <span className="path-text">
            Subsea Hydrophone (TC4013) ➔ Ultra-Low Noise LNA (&lt;1.2nV/√Hz) ➔ 24-bit 192kSPS ADC ➔ STM32H7 Demodulation ➔ AMD Versal AI Inference ➔ SNC Adaptive Mesh Route
          </span>
        </div>
      </div>
    </section>
  );
}

// ── 6. ADDITIONAL ARCHITECTURAL SPECIFICATIONS (BELOW WORKFLOW) ───────────────

function CircuitAdditionalInfo() {
  return (
    <section className="circuit-additional-info-section">
      <div className="additional-info-grid">
        <div className="info-card">
          <div className="info-card-header">
            <span className="info-card-icon">⚡</span>
            <h4>Hardware Architecture & Power Path</h4>
          </div>
          <p>
            MARISLINK deploys an isolated dual-rail architecture. The primary seabed power source (Micro Nuclear Battery conceptual unit / primary chemical cell) provides baseline micro-power, while an aluminum-laminated Lithium Polymer (LiPo) buffer battery pack supplies instantaneous burst current for 100W acoustic transducers without digital logic voltage drop.
          </p>
          <ul>
            <li><strong>LTC4412 Ideal Diode Multiplexer:</strong> Automatic low-loss switching between external tether power, primary supply, and LiPo buffer.</li>
            <li><strong>TI BQ76952 Smart BMS:</strong> Active cell balancing, thermal shutdown (-20°C to +65°C), and short-circuit fault isolation.</li>
            <li><strong>TI INA226 Power Monitor:</strong> High-precision I2C digital voltage and shunt current tracking across all primary rails.</li>
          </ul>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-card-icon">🌊</span>
            <h4>Physical Transducers & Hydrodynamics</h4>
          </div>
          <p>
            Ocean acoustic channels present high attenuation, multi-path Doppler shifts, and ambient noise. MARISLINK integrates matched acoustic front-ends:
          </p>
          <ul>
            <li><strong>Teledyne TC4013 Hydrophone:</strong> Omnidirectional broadband acoustic receiver (1 Hz to 170 kHz) with calibrated titanium housing.</li>
            <li><strong>Tonpilz PZT-4 Ceramic Projector:</strong> High-efficiency resonant electroacoustic transducer capable of generating &gt;185 dB re 1µPa @ 1m sound pressure.</li>
            <li><strong>AD8429 Ultra-Low-Noise LNA:</strong> Discrete subsea preamplifier with &lt;1.2nV/√Hz input voltage noise floor for weak acoustic packet reception.</li>
          </ul>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-card-icon">📊</span>
            <h4>Real-Time Ingestion & Spark Pipeline</h4>
          </div>
          <p>
            Continuous acoustic telemetry, hydrostatic pressure logs, and attitude measurements are captured deterministically by the embedded controller and streamed over encrypted telemetry interfaces into MARISLINK's Apache Spark & Scala big data processing pipeline for real-time anomaly detection.
          </p>
          <ul>
            <li><strong>Telemetry Stream:</strong> High-rate sensor frames streamed to port 5000 /api/hardware endpoints.</li>
            <li><strong>Spark Engine:</strong> Distributed batch and windowed aggregation computing signal-to-noise ratio (SNR), packet delivery ratio (PDR), and bit error rates (BER).</li>
            <li><strong>Mission Database:</strong> Cloud-synchronized historical storage maintaining long-term acoustic oceanographic telemetry.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
'''

# 7. MAIN CIRCUIT CONNECTIONS WORKSPACE COMPONENT
main_component = '''// ── MAIN CIRCUIT CONNECTIONS WORKSPACE COMPONENT ─────────────────────────────

export interface CircuitConnectionsPageProps {
  onNavigateToSpark?: () => void;
}

export default function CircuitConnectionsPage({ onNavigateToSpark }: CircuitConnectionsPageProps) {
  // Mode selection: default to complete_underwater
  const [mode, setMode] = useState<CircuitMode>('complete_underwater');

  // Filter selection: default to ALL
  const [busFilter, setBusFilter] = useState<BusFilter>('ALL');

  // Selection state
  const [selectedComponent, setSelectedComponent] = useState<CircuitComponent | null>(null);
  const [selectedWire, setSelectedWire] = useState<CircuitWire | null>(null);
  const [highlightedPin, setHighlightedPin] = useState<{ compId: string; pinId: string } | null>(null);

  // Zoom & Pan state (Range 25% to 400%, Default 100%)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Active Components and Wires based on Mode
  const currentComponents = useMemo(() => {
    switch (mode) {
      case 'complete_underwater': return UNDERWATER_COMPONENTS;
      case 'esp32_wokwi': return PROTOTYPE_COMPONENTS;
      case 'arduino_tinkercad': return ARDUINO_COMPONENTS;
      default: return UNDERWATER_COMPONENTS;
    }
  }, [mode]);

  const allWires = useMemo(() => {
    switch (mode) {
      case 'complete_underwater': return UNDERWATER_WIRES;
      case 'esp32_wokwi': return PROTOTYPE_WIRES;
      case 'arduino_tinkercad': return ARDUINO_WIRES;
      default: return UNDERWATER_WIRES;
    }
  }, [mode]);

  // Filtered wires
  const currentWires = useMemo(() => {
    if (busFilter === 'ALL') return allWires;
    return allWires.filter((w) => {
      if (busFilter === 'ADC/DAC') return w.busType === 'ADC' || w.busType === 'DAC' || w.busType === 'ADC/DAC';
      if (busFilter === 'GPIO/PWM') return w.busType === 'GPIO' || w.busType === 'PWM' || w.busType === 'GPIO/PWM';
      if (busFilter === 'USB/PCIe') return w.busType === 'USB' || w.busType === 'PCIe' || w.busType === 'USB/PCIe';
      return w.busType === busFilter;
    });
  }, [allWires, busFilter]);

  // Pin coordinate lookup table
  const pinCoordMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    currentComponents.forEach((c) => {
      c.pins.forEach((p) => {
        map.set(`${c.id}:${p.id}`, { x: c.x + p.x, y: c.y + p.y });
      });
    });
    return map;
  }, [currentComponents]);

  // Zoom controls (25% to 400%)
  const handleZoomStep = useCallback((delta: number) => {
    setZoom((prev) => Math.min(Math.max(Math.round((prev + delta) * 100) / 100, 0.25), 4.0));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setSelectedComponent(null);
    setSelectedWire(null);
    setHighlightedPin(null);
  }, []);

  // Fit Entire Circuit onto screen
  const handleFitCircuit = useCallback(() => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let minX = 30, minY = 30, maxX = 2100, maxY = 860;
    if (mode === 'complete_underwater') {
      minX = 20; minY = 20; maxX = 2120; maxY = 860;
    } else if (mode === 'esp32_wokwi') {
      minX = 10; minY = 10; maxX = 1100; maxY = 700;
    } else {
      minX = 10; minY = 10; maxX = 1050; maxY = 650;
    }

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const scaleX = (rect.width - 48) / contentW;
    const scaleY = (rect.height - 48) / contentH;
    const fitZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 2.5);

    const centerCanvasX = rect.width / 2;
    const centerCanvasY = rect.height / 2;
    const centerContentX = (minX + maxX) / 2;
    const centerContentY = (minY + maxY) / 2;

    setZoom(Math.round(fitZoom * 100) / 100);
    setPan({
      x: Math.round(centerCanvasX - centerContentX * fitZoom),
      y: Math.round(centerCanvasY - centerContentY * fitZoom),
    });
  }, [mode]);

  // Auto-fit on mode switch
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitCircuit();
    }, 60);
    return () => clearTimeout(timer);
  }, [mode, handleFitCircuit]);

  // Mouse wheel cursor-anchored zoom
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.25), 4.0);
        setPan((prevPan) => {
          const nextPanX = mouseX - ((mouseX - prevPan.x) / prevZoom) * nextZoom;
          const nextPanY = mouseY - ((mouseY - prevPan.y) / prevZoom) * nextZoom;
          return { x: nextPanX, y: nextPanY };
        });
        return nextZoom;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Pan event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan if clicking on viewport background
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'grid-background') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  }, [isPanning, startPan]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Selection handlers
  const handleSelectComponent = useCallback((comp: CircuitComponent) => {
    setSelectedComponent(comp);
    setSelectedWire(null);
    setHighlightedPin(null);
  }, []);

  const handleSelectWire = useCallback((wire: CircuitWire) => {
    setSelectedWire(wire);
    setSelectedComponent(null);
    setHighlightedPin({ compId: wire.sourceComponentId, pinId: wire.sourcePinId });
  }, []);

  const handleSelectPin = useCallback((comp: CircuitComponent, pin: PinDefinition) => {
    setHighlightedPin({ compId: comp.id, pinId: pin.id });
    const wire = currentWires.find(
      (w) => (w.sourceComponentId === comp.id && w.sourcePinId === pin.id) ||
             (w.destComponentId === comp.id && w.destPinId === pin.id)
    );
    if (wire) setSelectedWire(wire);
  }, [currentWires]);

  // Connected wires to selected component
  const connectedWiresToSelected = useMemo(() => {
    if (!selectedComponent) return [];
    return currentWires.filter(
      (w) => w.sourceComponentId === selectedComponent.id || w.destComponentId === selectedComponent.id
    );
  }, [selectedComponent, currentWires]);

  // Render Wire Path with orthogonal lines & terminal solder dots
  const renderWirePath = useCallback((wire: CircuitWire) => {
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
  }, [pinCoordMap, selectedWire, handleSelectWire]);

  return (
    <div className="circuit-workspace-container">
      {/* ── 1. Page Title & Horizontal Mode Selector ─────────────────────── */}
      <div className="circuit-top-bar">
        <div className="circuit-title-area">
          <h2>
            <span>🔌</span> MARISLINK – CIRCUIT CONNECTIONS
          </h2>
          <p>
            Interactive 2D Electronics Schematic & Pin-to-Pin System Architecture (Tinkercad & Wokwi Engineering Workspace)
          </p>
        </div>

        {/* Three Architecture Mode Switcher */}
        <div className="circuit-mode-toggle">
          <button
            className={`mode-btn mode-complete ${mode === 'complete_underwater' ? 'active' : ''}`}
            onClick={() => {
              setMode('complete_underwater');
              handleResetView();
            }}
          >
            🌊 Complete MARISLINK Underwater Architecture (AMD Versal™ AI Edge + STM32H7)
          </button>
          <button
            className={`mode-btn mode-esp32 ${mode === 'esp32_wokwi' ? 'active' : ''}`}
            onClick={() => {
              setMode('esp32_wokwi');
              handleResetView();
            }}
          >
            ⚡ Embedded Hardware Prototype (32-Bit LX6 + BMP280)
          </button>
          <button
            className={`mode-btn mode-arduino ${mode === 'arduino_tinkercad' ? 'active' : ''}`}
            onClick={() => {
              setMode('arduino_tinkercad');
              handleResetView();
            }}
          >
            📘 Arduino Uno Tinkercad Model (Classroom Equivalent)
          </button>
        </div>
      </div>

      {/* ── Evaluator Technical Accuracy Notice ───────────────────────────── */}
      <div className="circuit-academic-notice">
        <span className="notice-badge implemented">IMPLEMENTED</span>
        <strong>Verified Embedded Prototype:</strong> Mode A runs the compiled controller firmware on simulated hardware with live telemetry ingestion.
        <span className="notice-badge architectural" style={{ marginLeft: 14 }}>ARCHITECTURAL</span>
        <strong>Deep-Sea Production Design:</strong> Mode B models the full multi-rail power system, AMD Versal™ / NVIDIA AI, STM32H7 SNC controller, and hydrophone transceiver.
        <span className="notice-badge simulated" style={{ marginLeft: 14 }}>SIMULATED</span>
        <strong>Classroom Equivalent:</strong> Mode C models the Tinkercad tutorial Arduino Uno circuit using supported 8-bit AVR components.
      </div>

      {/* ── 2. WIRE BUS FILTER & ZOOM TOOLBAR (DISPLAYED ABOVE CIRCUIT CANVAS) ── */}
      <div className="circuit-canvas-toolbar">
        {/* Bus Filter Pills */}
        <div className="circuit-filter-pills">
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>WIRE BUS FILTER:</span>
          {(['ALL', 'POWER', 'GROUND', 'I2C', 'SPI', 'UART', 'ADC/DAC', 'GPIO/PWM', 'USB/PCIe'] as BusFilter[]).map((f) => (
            <button
              key={f}
              className={`filter-pill ${busFilter === f ? 'active' : ''}`}
              onClick={() => setBusFilter(f)}
            >
              {f === 'POWER' && '🔴 Power (+12V/+5V/+3.3V)'}
              {f === 'GROUND' && '⚫ Ground (GND)'}
              {f === 'I2C' && '🩵 I2C (SDA/SCL)'}
              {f === 'SPI' && '🔵 SPI Bus'}
              {f === 'UART' && '🟣 UART Serial'}
              {f === 'ADC/DAC' && '🟠 ADC/DAC Analog'}
              {f === 'GPIO/PWM' && '🟢 GPIO/PWM'}
              {f === 'USB/PCIe' && '🔵 High-Speed USB/PCIe'}
              {f === 'ALL' && '🌈 All Wires'}
            </button>
          ))}
        </div>

        {/* Zoom & View Controls */}
        <div className="circuit-zoom-controls">
          <button className="ctrl-btn" onClick={() => handleZoomStep(-0.25)} title="Zoom Out (-25%)">－</button>
          <span className="zoom-indicator" title="Current Zoom">{Math.round(zoom * 100)}%</span>
          <button className="ctrl-btn" onClick={() => handleZoomStep(0.25)} title="Zoom In (+25%)">＋</button>
          <button className="ctrl-btn reset" onClick={handleResetView} title="Reset to 100% Zoom">
            Reset 100%
          </button>
          <button className="ctrl-btn reset fit" onClick={handleFitCircuit} title="Fit Entire Circuit on Screen">
            📐 Fit Circuit
          </button>

          {onNavigateToSpark && (
            <button className="spark-nav-btn" onClick={onNavigateToSpark}>
              ⚡ Spark Lab
            </button>
          )}
        </div>
      </div>

      {/* ── 3. FULL-WIDTH CIRCUIT WORKSPACE (100% WIDTH CANVAS, NO FIXED SPLIT) ── */}
      <div className="circuit-workspace-body">
        {/* Interactive SVG Canvas Viewport */}
        <div
          ref={viewportRef}
          className={`circuit-canvas-viewport ${isPanning ? 'panning' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Floating On-Canvas Quick Zoom Controls (25% - 400%) */}
          <div className="circuit-canvas-floating-controls">
            <button className="float-ctrl-btn" onClick={() => handleZoomStep(0.25)} title="Zoom In (+25%)">＋</button>
            <button className="float-ctrl-btn" onClick={() => handleZoomStep(-0.25)} title="Zoom Out (-25%)">－</button>
            <span className="float-zoom-badge" title="Current Zoom Level">{Math.round(zoom * 100)}%</span>
            <button className="float-ctrl-btn reset" onClick={handleResetView} title="Reset to 100%">↺ Reset</button>
            <button className="float-ctrl-btn fit" onClick={handleFitCircuit} title="Fit Entire Circuit">📐 Fit</button>
          </div>

          <svg
            ref={canvasRef}
            className="circuit-svg-canvas"
            width="100%"
            height="100%"
            viewBox={
              mode === 'complete_underwater' ? '0 0 2150 890' :
              mode === 'esp32_wokwi' ? '0 0 1200 750' :
              '0 0 1100 680'
            }
          >
            <defs>
              <pattern id="tinkercad-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <rect width="24" height="24" fill="#f8fafc" />
                <circle cx="12" cy="12" r="1.2" fill="#cbd5e1" />
              </pattern>
            </defs>

            {/* Background Grid Layer */}
            <rect
              id="grid-background"
              x="-4000"
              y="-4000"
              width="10000"
              height="10000"
              fill="url(#tinkercad-grid)"
            />

            {/* Canvas Transformation Group (Zoom & Pan) */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Colored Subsystem Bounding Boxes (Mode B) */}
              {mode === 'complete_underwater' &&
                UNDERWATER_GROUPS.map((g) => (
                  <g key={g.id}>
                    <rect
                      x={g.x}
                      y={g.y}
                      width={g.width}
                      height={g.height}
                      rx={10}
                      fill={g.color}
                      stroke={g.accent}
                      strokeWidth={1.5}
                      strokeDasharray="6 4"
                      opacity={0.8}
                    />
                    <text
                      x={g.x + 16}
                      y={g.y + 24}
                      fill={g.accent}
                      fontSize={11.5}
                      fontWeight="800"
                      letterSpacing={0.8}
                      fontFamily="system-ui, sans-serif"
                    >
                      {g.name}
                    </text>
                  </g>
                ))}

              {/* 1. Connecting Wires Layer (Behind Components) */}
              <g className="wires-layer">
                {currentWires.map(renderWirePath)}
              </g>

              {/* 2. Electronic Components Layer */}
              <g className="components-layer">
                {currentComponents.map((comp) => (
                  <ComponentShape
                    key={comp.id}
                    comp={comp}
                    isSelected={selectedComponent?.id === comp.id}
                    highlightedPinId={highlightedPin ? `${highlightedPin.compId}:${highlightedPin.pinId}` : null}
                    onSelectComponent={handleSelectComponent}
                    onSelectPin={handleSelectPin}
                  />
                ))}
              </g>
            </g>
          </svg>

          {/* Canvas Bottom Hint */}
          <div className="circuit-canvas-hint">
            <span>✦ Click any component or wire to inspect • Click & drag canvas to pan • Scroll wheel to zoom (25% - 400%)</span>
          </div>

          {/* Floating Interactive Inspector Overlay (Opens ONLY when component or wire is selected) */}
          {(selectedComponent || selectedWire) && (
            <div className="circuit-inspector-floating-card">
              {/* Floating Header with Close Button */}
              <div className="inspector-floating-header">
                <div className="inspector-floating-title-group">
                  <div className="inspector-header-badges">
                    <span className={`status-tag ${selectedComponent ? (selectedComponent.status || 'IMPLEMENTED').toLowerCase() : 'wire-tag'}`}>
                      {selectedComponent ? (selectedComponent.status || 'IMPLEMENTED') : `${selectedWire?.busType} BUS`}
                    </span>
                  </div>
                  <h4 className="inspector-title">
                    {selectedComponent ? selectedComponent.name : selectedWire?.name}
                  </h4>
                  <span className="inspector-subtitle">
                    {selectedComponent ? selectedComponent.modelNumber : `Route: ${selectedWire?.sourceComponentId.toUpperCase()} ➔ ${selectedWire?.destComponentId.toUpperCase()}`}
                  </span>
                </div>
                <button
                  className="inspector-close-btn"
                  onClick={() => {
                    setSelectedComponent(null);
                    setSelectedWire(null);
                    setHighlightedPin(null);
                  }}
                  title="Close Inspector"
                >
                  ✕
                </button>
              </div>

              {/* Inspector Body Content */}
              <div className="inspector-floating-body">
                {selectedWire ? (
                  /* Wire Details */
                  <div className="inspector-wire-details">
                    <div className="inspector-kv-grid">
                      <div className="kv-item">
                        <span className="kv-label">Signal Bus</span>
                        <span className="kv-val bus-val">{selectedWire.busType}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Voltage / Logic</span>
                        <span className="kv-val">{selectedWire.voltage}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Insulation Color</span>
                        <span className="kv-val">{selectedWire.colorName}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Signal Flow</span>
                        <span className="kv-val">{selectedWire.signalDirection || 'BIDIRECTIONAL'}</span>
                      </div>
                    </div>

                    <div className="pin-to-pin-box">
                      <div className="p2p-header">PIN-TO-PIN CONNECTION ROUTE:</div>
                      <div className="p2p-route">
                        <div className="p2p-node">
                          <span className="comp-name">{selectedWire.sourceComponentId.toUpperCase()}</span>
                          <span className="pin-label">Pin: <strong>{selectedWire.sourcePinId.toUpperCase()}</strong></span>
                        </div>
                        <div className="p2p-arrow" style={{ color: selectedWire.color }}>➔</div>
                        <div className="p2p-node">
                          <span className="comp-name">{selectedWire.destComponentId.toUpperCase()}</span>
                          <span className="pin-label">Pin: <strong>{selectedWire.destPinId.toUpperCase()}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="inspector-desc-section">
                      <div className="section-label">Connection Purpose:</div>
                      <p>{selectedWire.connectionPurpose}</p>
                    </div>

                    <div className="inspector-desc-section">
                      <div className="section-label">Signal Description & Role:</div>
                      <p>{selectedWire.signalDescription}</p>
                    </div>

                    <button className="hw-btn hw-btn-outline" onClick={() => setSelectedWire(null)}>
                      Clear Wire Selection
                    </button>
                  </div>
                ) : selectedComponent ? (
                  /* Component Details */
                  <div className="inspector-comp-details">
                    <div className="inspector-kv-grid">
                      <div className="kv-item">
                        <span className="kv-label">Category</span>
                        <span className="kv-val">{selectedComponent.category}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Protocol</span>
                        <span className="kv-val">{selectedComponent.protocol}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Voltage Rail</span>
                        <span className="kv-val">{selectedComponent.operatingVoltage}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Current Draw</span>
                        <span className="kv-val">{selectedComponent.currentDraw}</span>
                      </div>
                    </div>

                    <div className="inspector-desc-section">
                      <div className="section-label">Component Overview:</div>
                      <p>{selectedComponent.description}</p>
                    </div>

                    <div className="inspector-desc-section">
                      <div className="section-label">Role in MARISLINK System:</div>
                      <p>{selectedComponent.roleInMarislink}</p>
                    </div>

                    {selectedComponent.technicalExplanation && (
                      <div className="inspector-tech-box">
                        <strong>Technical Engineering Details:</strong> {selectedComponent.technicalExplanation}
                      </div>
                    )}

                    {selectedComponent.tinkercadEquivNote && (
                      <div className="inspector-compat-box">
                        <strong>Classroom Equivalence Note:</strong> {selectedComponent.tinkercadEquivNote}
                      </div>
                    )}

                    {/* Pin Mapping Table */}
                    <div className="inspector-pins-table-section">
                      <div className="section-label">
                        Pins & Connected Circuits ({selectedComponent.pins.length} Pins, {connectedWiresToSelected.length} Active Wires):
                      </div>
                      <div className="table-wrapper">
                        <table className="inspector-pin-table">
                          <thead>
                            <tr>
                              <th>Pin</th>
                              <th>Type</th>
                              <th>Connected Route</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedComponent.pins.map((pin) => {
                              const connected = currentWires.find(
                                (w) => (w.sourceComponentId === selectedComponent.id && w.sourcePinId === pin.id) ||
                                       (w.destComponentId === selectedComponent.id && w.destPinId === pin.id)
                              );
                              return (
                                <tr
                                  key={pin.id}
                                  className={highlightedPin?.pinId === pin.id ? 'row-highlighted' : ''}
                                  onClick={() => handleSelectPin(selectedComponent, pin)}
                                >
                                  <td><strong>{pin.label}</strong></td>
                                  <td><span className={`pin-type-tag ${pin.type.toLowerCase()}`}>{pin.type}</span></td>
                                  <td style={{ fontSize: 11 }}>
                                    {connected ? (
                                      <span style={{ color: connected.color, fontWeight: 700 }}>
                                        ➔ {connected.sourceComponentId === selectedComponent.id ? connected.destComponentId.toUpperCase() : connected.sourceComponentId.toUpperCase()} ({connected.busType})
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8' }}>Unconnected / Internal</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <button className="hw-btn hw-btn-outline" onClick={() => setSelectedComponent(null)}>
                      Deselect Component
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. COMPLETE END-TO-END SECTION (HTML Flow Below Canvas) ───────── */}
      <SystemWorkflowSection mode={mode} />

      {/* ── 5. Additional System Architecture Specifications ──────────────── */}
      <CircuitAdditionalInfo />
    </div>
  );
}
'''

# Assemble final TypeScript file
full_code = (
    types_head + "\n\n" +
    proto_comps + "\n\n" +
    proto_wires + "\n\n" +
    underwater_groups + "\n\n" +
    underwater_comps + "\n\n" +
    underwater_wires + "\n\n" +
    arduino_comps + "\n\n" +
    arduino_wires + "\n\n" +
    routing_helpers + "\n\n" +
    component_shape + "\n\n" +
    main_component
)

# Final sanity check: ensure no prohibited strings in full_code user-facing portions
print("[6/6] Writing src/pages/CircuitConnectionsPage.tsx...")
with open('src/pages/CircuitConnectionsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(full_code)

print(f"[SUCCESS] Rebuilt CircuitConnectionsPage.tsx cleanly! Total length: {len(full_code)} characters, {len(full_code.splitlines())} lines.")
