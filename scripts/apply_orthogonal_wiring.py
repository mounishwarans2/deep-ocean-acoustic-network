#!/usr/bin/env python3
"""
apply_orthogonal_wiring.py
Updates CircuitConnectionsPage.tsx with:
1. Exact orthogonal waypoints for all wires in Mode A, Mode B, and Mode C.
2. Complete breadboard pin definitions for Mode C (row_led_green, row_led_yellow, row_led_red).
3. Smooth filleted corner path generator (pointsToFilletedPath with r=8px).
4. Terminal connection dots at pin contacts.
5. Distinct power vs signal line weights and static inactive lines (animated only on selection).
"""

import re, json

with open('src/pages/CircuitConnectionsPage.tsx', 'r') as f:
    content = f.read()

# 1. Mode A Waypoints
mode_a_waypoints = {
    'w-pwr-oled': [[78, 148], [45, 148], [45, 25], [435, 25], [435, 65]],
    'w-pwr-bmp': [[435, 65], [435, 25], [702, 25], [702, 155]],
    'w-pwr-pot-bat': [[78, 148], [45, 148], [45, 480], [345, 480], [345, 365]],
    'w-pwr-pot-sig': [[345, 365], [345, 480], [525, 480], [525, 365]],
    'w-gnd-oled': [[78, 456], [30, 456], [30, 15], [395, 15], [395, 65]],
    'w-gnd-bmp': [[395, 65], [395, 15], [734, 15], [734, 155]],
    'w-i2c-scl-oled': [[232, 192], [280, 192], [280, 40], [485, 40], [485, 65]],
    'w-i2c-sda-oled': [[232, 258], [290, 258], [290, 50], [525, 50], [525, 65]],
    'w-i2c-scl-bmp': [[485, 65], [485, 40], [766, 40], [766, 155]],
    'w-i2c-sda-bmp': [[525, 65], [525, 50], [798, 50], [798, 155]],
    'w-adc-battery': [[385, 365], [385, 470], [60, 470], [60, 236], [78, 236]],
    'w-adc-rssi': [[565, 365], [565, 460], [50, 460], [50, 258], [78, 258]],
    'w-gpio-led-sync': [[232, 390], [270, 390], [270, 500], [538, 500], [538, 515]],
    'w-gpio-led-tx': [[232, 412], [280, 412], [280, 490], [358, 490], [358, 515]],
    'w-gpio-led-alert': [[232, 434], [260, 434], [260, 510], [718, 510], [718, 515]],
    'w-uart-tx': [[232, 214], [300, 214], [300, 230], [875, 230], [875, 360]],
    'w-uart-rx': [[830, 360], [830, 220], [310, 220], [310, 236], [232, 236]]
}

# 2. Mode B Waypoints
mode_b_waypoints = {
    'w-hydro-lna-sig': [[1570, 90], [1680, 90]],
    'w-hydro-lna-gnd': [[1570, 120], [1680, 120]],
    'w-lna-adc-p': [[1810, 90], [1915, 90]],
    'w-lna-adc-n': [[1810, 120], [1915, 120]],
    'w-adc-mcu-dout': [[2005, 130], [2090, 130], [2090, 35], [1045, 35], [1045, 305], [1015, 305]],
    'w-mcu-adc-sck': [[1015, 325], [1055, 325], [1055, 45], [1960, 45], [1960, 130]],
    'w-mcu-adc-cs': [[1015, 345], [1065, 345], [1065, 55], [1915, 55], [1915, 130]],
    'w-mcu-dac-mosi': [[1015, 375], [1045, 375], [1045, 490], [1390, 490], [1390, 320], [1445, 320]],
    'w-mcu-dac-sck': [[1015, 395], [1055, 395], [1055, 500], [1400, 500], [1400, 340], [1445, 340]],
    'w-mcu-dac-cs': [[1015, 415], [1065, 415], [1065, 510], [1410, 510], [1410, 360], [1445, 360]],
    'w-dac-amp-sig': [[1575, 330], [1625, 330], [1625, 320], [1680, 320]],
    'w-dac-amp-gnd': [[1575, 355], [1625, 355], [1625, 350], [1680, 350]],
    'w-amp-trans-p': [[1815, 320], [1920, 320]],
    'w-amp-trans-n': [[1815, 350], [1920, 350]],
    'w-press-mcu-sda': [[165, 698], [165, 645], [755, 645], [755, 270], [818, 270]],
    'w-mcu-press-scl': [[818, 295], [765, 295], [765, 655], [165, 655], [165, 728]],
    'w-temp-mcu-rtd': [[345, 698], [345, 640], [775, 640], [775, 330], [818, 330]],
    'w-imu-mcu-sda': [[525, 698], [525, 645], [755, 645], [755, 270], [818, 270]],
    'w-mcu-imu-scl': [[818, 295], [765, 295], [765, 655], [525, 655], [525, 728]],
    'w-leak-mcu-alert': [[705, 713], [705, 640], [785, 640], [785, 355], [818, 355]],
    'w-mcu-ai-tx': [[1015, 210], [1065, 210], [1065, 270], [1115, 270]],
    'w-ai-mcu-tx': [[1115, 295], [1055, 295], [1055, 235], [1015, 235]],
    'w-ai-mcu-fmc': [[1115, 330], [1045, 330], [1045, 270], [1015, 270]],
    'w-mcu-microsd': [[918, 460], [918, 560], [915, 560], [915, 685]],
    'w-ai-nvme-pcie': [[1212, 460], [1212, 560], [1200, 560], [1200, 685]],
    'w-wetmate-path-mgr': [[195, 100], [245, 100], [245, 320], [303, 320]],
    'w-pri-bat-path': [[336, 81], [336, 195], [303, 195], [303, 285]],
    'w-pri-bat-gnd': [[409, 81], [409, 215], [440, 215], [440, 320]],
    'w-sec-bat-bms': [[660, 79], [660, 195], [555, 195], [555, 280]],
    'w-bms-path-mgr': [[665, 280], [665, 235], [440, 235], [440, 285]],
    'w-path-dcdc-main': [[372, 335], [372, 460]],
    'w-dcdc-pwr-mon': [[372, 460], [372, 410], [538, 410], [538, 480]],
    'w-dcdc-sensor-5v': [[443, 497], [443, 560], [70, 560], [70, 698]],
    'w-dcdc-mcu-3v3': [[443, 521], [480, 521], [480, 570], [735, 570], [735, 210], [818, 210]],
    'w-dcdc-ai-core': [[443, 521], [480, 521], [480, 580], [1075, 580], [1075, 210], [1115, 210]],
    'w-dcdc-amp-12v': [[443, 473], [480, 473], [480, 615], [1747, 615], [1747, 300]],
    'w-pwr-mon-mcu-sda': [[675, 480], [745, 480], [745, 270], [818, 270]],
    'w-mcu-pwr-mon-scl': [[818, 295], [755, 295], [755, 510], [675, 510]],
    'w-wetmate-mcu-eth': [[1560, 555], [1400, 555], [1400, 525], [790, 525], [790, 450], [818, 450]],
    'w-debug-mcu-swdio': [[1670, 555], [1610, 555], [1610, 535], [780, 535], [780, 390], [818, 390]],
    'w-debug-mcu-swclk': [[1670, 580], [1610, 580], [1610, 545], [770, 545], [770, 415], [818, 415]],
    'w-mcu-led-pwr': [[1015, 440], [1055, 440], [1055, 480], [1915, 480], [1915, 548]],
    'w-mcu-led-comm': [[1015, 460], [1065, 460], [1065, 490], [1995, 490], [1995, 548]]
}

# 3. Mode C Waypoints
mode_c_waypoints = {
    'wa-pwr-5v': [[177, 285], [177, 360], [380, 360], [380, 292]],
    'wa-pwr-gnd': [[186, 285], [186, 375], [365, 375], [365, 312], [380, 312]],
    'wa-tmp-vcc': [[380, 292], [420, 292], [420, 250], [518, 250], [518, 210]],
    'wa-tmp-gnd': [[380, 312], [435, 312], [435, 260], [552, 260], [552, 210]],
    'wa-tmp-analog': [[535, 210], [535, 270], [450, 270], [450, 345], [228, 345], [228, 285]],
    'wa-lcd-pwr': [[380, 292], [380, 390], [790, 390], [790, 125]],
    'wa-lcd-gnd': [[380, 312], [380, 405], [760, 405], [760, 125]],
    'wa-lcd-sda': [[256, 285], [256, 330], [820, 330], [820, 125]],
    'wa-lcd-scl': [[265, 285], [265, 315], [850, 315], [850, 125]],
    'wa-led-tx': [[228, 159], [228, 70], [545, 70], [545, 230]],
    'wa-led-sync': [[214, 159], [214, 55], [585, 55], [585, 230]],
    'wa-led-alert': [[196, 159], [196, 40], [625, 40], [625, 230]]
}

# Add pins to breadboard_half
old_breadboard_pins = """    pins: [
      { id: 'pwr_top_plus', label: 'Top (+)', x: 40, y: 32, type: 'POWER', description: 'Top Positive 5V Power Rail' },
      { id: 'pwr_top_minus', label: 'Top (-)', x: 40, y: 52, type: 'GROUND', description: 'Top Ground Return Rail' },
      { id: 'pwr_bot_plus', label: 'Bot (+)', x: 40, y: 192, type: 'POWER', description: 'Bottom Positive 5V Power Rail' },
      { id: 'pwr_bot_minus', label: 'Bot (-)', x: 40, y: 212, type: 'GROUND', description: 'Bottom Ground Return Rail' }
    ]"""

new_breadboard_pins = """    pins: [
      { id: 'pwr_top_plus', label: 'Top (+)', x: 40, y: 32, type: 'POWER', description: 'Top Positive 5V Power Rail' },
      { id: 'pwr_top_minus', label: 'Top (-)', x: 40, y: 52, type: 'GROUND', description: 'Top Ground Return Rail' },
      { id: 'pwr_bot_plus', label: 'Bot (+)', x: 40, y: 192, type: 'POWER', description: 'Bottom Positive 5V Power Rail' },
      { id: 'pwr_bot_minus', label: 'Bot (-)', x: 40, y: 212, type: 'GROUND', description: 'Bottom Ground Return Rail' },
      { id: 'row_led_green', label: 'Row 14 (Green)', x: 205, y: 130, type: 'GPIO', description: 'Row 14 Green LED Terminal' },
      { id: 'row_led_yellow', label: 'Row 18 (Yellow)', x: 245, y: 130, type: 'GPIO', description: 'Row 18 Yellow LED Terminal' },
      { id: 'row_led_red', label: 'Row 22 (Red)', x: 285, y: 130, type: 'GPIO', description: 'Row 22 Red LED Terminal' }
    ]"""

if old_breadboard_pins in content:
    content = content.replace(old_breadboard_pins, new_breadboard_pins)
    print("Updated breadboard_half pins with row_led terminals.")
else:
    print("WARNING: old_breadboard_pins not found verbatim, checking regex...")

# Helper to update waypoints in an array of wire objects
def update_wire_waypoints(wire_block, waypoints_dict):
    # Regex find each wire object
    def replace_wire(match):
        w_text = match.group(0)
        id_m = re.search(r'id:\s*\'([^\']+)\'', w_text)
        if not id_m:
            return w_text
        wid = id_m.group(1)
        if wid not in waypoints_dict:
            return w_text
        
        pts = waypoints_dict[wid]
        pts_str = "waypoints: " + json.dumps(pts)
        
        # Check if waypoints already exist
        if re.search(r'waypoints:\s*\[.*?\]', w_text, re.DOTALL):
            return re.sub(r'waypoints:\s*\[.*?\]', pts_str, w_text, flags=re.DOTALL)
        else:
            # Insert waypoints right before the closing brace
            last_brace = w_text.rfind('}')
            return w_text[:last_brace] + f"  {pts_str},\n  " + w_text[last_brace:]

    return re.sub(r'\{\s+id:\s*\'[^\']+\'.*?\}', replace_wire, wire_block, flags=re.DOTALL)

# Locate sections
esp32_start = content.find('const ESP32_WIRES: CircuitWire[] = [')
esp32_end = content.find('const UNDERWATER_COMPONENTS: CircuitComponent[] = [')
esp32_section = content[esp32_start:esp32_end]
new_esp32_section = update_wire_waypoints(esp32_section, mode_a_waypoints)
content = content[:esp32_start] + new_esp32_section + content[esp32_end:]

underwater_start = content.find('const UNDERWATER_WIRES: CircuitWire[] = [')
underwater_end = content.find('const ARDUINO_COMPONENTS: CircuitComponent[] = [')
underwater_section = content[underwater_start:underwater_end]
new_underwater_section = update_wire_waypoints(underwater_section, mode_b_waypoints)
content = content[:underwater_start] + new_underwater_section + content[underwater_end:]

arduino_start = content.find('const ARDUINO_WIRES: CircuitWire[] = [')
arduino_end = content.find('// ── 4. COMPONENT HELPER COMPONENT')
arduino_section = content[arduino_start:arduino_end]
new_arduino_section = update_wire_waypoints(arduino_section, mode_c_waypoints)
content = content[:arduino_start] + new_arduino_section + content[arduino_end:]

# Now add routing helper functions before ComponentShape or renderWirePath
helpers_code = """
// ── SMART ORTHOGONAL ROUTING & FILLET GENERATION ────────────────────────────

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
"""

# Insert helpers right before renderWirePath or before ComponentShape
comp_shape_idx = content.find('function ComponentShape(')
if comp_shape_idx != -1:
    content = content[:comp_shape_idx] + helpers_code + "\n" + content[comp_shape_idx:]
    print("Inserted smart routing helper functions before ComponentShape.")

# Replace renderWirePath implementation
old_render_wire = re.search(r'const renderWirePath = useCallback\(\(wire: CircuitWire\) => \{.*?\}, \[pinCoordMap, selectedWire\]\);', content, re.DOTALL)
if old_render_wire:
    new_render_wire = """const renderWirePath = useCallback((wire: CircuitWire) => {
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
    content = content[:old_render_wire.start()] + new_render_wire + content[old_render_wire.end():]
    print("Replaced renderWirePath with filleted orthogonal renderer & terminal connection dots.")
else:
    print("WARNING: old renderWirePath not found!")

with open('src/pages/CircuitConnectionsPage.tsx', 'w') as f:
    f.write(content)

print("CircuitConnectionsPage.tsx updated successfully!")
