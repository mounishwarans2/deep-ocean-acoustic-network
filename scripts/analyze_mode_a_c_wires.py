#!/usr/bin/env python3
import re

with open('src/pages/CircuitConnectionsPage.tsx', 'r') as f:
    code = f.read()

def extract_comps(section_code):
    comps = {}
    blocks = re.findall(r'\{\s+id:\s*\'([^\']+)\'.*?x:\s*(\d+),\s*y:\s*(\d+),\s*width:\s*(\d+),\s*height:\s*(\d+).*?pins:\s*\[(.*?)\]\s+\}', section_code, re.DOTALL)
    for b in blocks:
        cid, cx, cy, cw, ch, pstr = b[0], int(b[1]), int(b[2]), int(b[3]), int(b[4]), b[5]
        pins = {}
        pin_matches = re.finditer(r'\{\s*id:\s*\'([^\']+)\'.*?x:\s*(\d+),\s*y:\s*(\d+)', pstr)
        for p in pin_matches:
            pid, px, py = p.group(1), int(p.group(2)), int(p.group(3))
            pins[pid] = {'abs_x': cx + px, 'abs_y': cy + py}
        comps[cid] = {'x': cx, 'y': cy, 'w': cw, 'h': ch, 'pins': pins}
    return comps

# Mode A
ea_chunk = code[code.find('const ESP32_COMPONENTS'):code.find('const ESP32_WIRES')]
a_comps = extract_comps(ea_chunk)
print(f'Mode A components: {len(a_comps)}')

ew_chunk = code[code.find('const ESP32_WIRES'):code.find('export const UNDERWATER_GROUPS')]
ewires = re.findall(r'\{\s+id:\s*\'([^\']+)\'.*?sourceComponentId:\s*\'([^\']+)\'.*?sourcePinId:\s*\'([^\']+)\'.*?destComponentId:\s*\'([^\']+)\'.*?destPinId:\s*\'([^\']+)\'', ew_chunk, re.DOTALL)
print(f'Mode A wires: {len(ewires)}')
for w in ewires:
    wid, sc, sp, dc, dp = w
    sc_c = (a_comps[sc]['pins'][sp]['abs_x'], a_comps[sc]['pins'][sp]['abs_y']) if sc in a_comps and sp in a_comps[sc]['pins'] else 'MISSING'
    dc_c = (a_comps[dc]['pins'][dp]['abs_x'], a_comps[dc]['pins'][dp]['abs_y']) if dc in a_comps and dp in a_comps[dc]['pins'] else 'MISSING'
    print(f'  {wid:<18} | {sc}:{sp} ({sc_c}) ➔ {dc}:{dp} ({dc_c})')

# Mode C
ca_chunk = code[code.find('const ARDUINO_COMPONENTS'):code.find('const ARDUINO_WIRES')]
c_comps = extract_comps(ca_chunk)
print(f'\nMode C components: {len(c_comps)}')

cw_chunk = code[code.find('const ARDUINO_WIRES'):code.find('// ── 4. COMPONENT HELPER COMPONENT')]
cwires = re.findall(r'\{\s+id:\s*\'([^\']+)\'.*?sourceComponentId:\s*\'([^\']+)\'.*?sourcePinId:\s*\'([^\']+)\'.*?destComponentId:\s*\'([^\']+)\'.*?destPinId:\s*\'([^\']+)\'', cw_chunk, re.DOTALL)
print(f'Mode C wires: {len(cwires)}')
for w in cwires:
    wid, sc, sp, dc, dp = w
    sc_c = (c_comps[sc]['pins'][sp]['abs_x'], c_comps[sc]['pins'][sp]['abs_y']) if sc in c_comps and sp in c_comps[sc]['pins'] else 'MISSING'
    dc_c = (c_comps[dc]['pins'][dp]['abs_x'], c_comps[dc]['pins'][dp]['abs_y']) if dc in c_comps and dp in c_comps[dc]['pins'] else 'MISSING'
    print(f'  {wid:<18} | {sc}:{sp} ({sc_c}) ➔ {dc}:{dp} ({dc_c})')
