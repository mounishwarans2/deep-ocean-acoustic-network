#!/usr/bin/env python3
import json, re

with open('src/pages/CircuitConnectionsPage.tsx', 'r') as f:
    code = f.read()

# Helper to extract components and pin coordinates
def extract_components_with_pins(section_code):
    comps = {}
    # Find component objects
    raw_blocks = re.findall(r'\{\s+id:\s*\'([^\']+)\'.*?category:\s*\'([^\']+)\'.*?x:\s*(\d+),\s*y:\s*(\d+),\s*width:\s*(\d+),\s*height:\s*(\d+).*?pins:\s*\[(.*?)\]\s+\}', section_code, re.DOTALL)
    for b in raw_blocks:
        cid, cat, cx, cy, cw, ch, pstr = b[0], b[1], int(b[2]), int(b[3]), int(b[4]), int(b[5]), b[6]
        pins = {}
        pin_matches = re.finditer(r'\{\s*id:\s*\'([^\']+)\'.*?label:\s*\'([^\']+)\'.*?x:\s*(\d+),\s*y:\s*(\d+)', pstr)
        for p in pin_matches:
            pid, plabel, px, py = p.group(1), p.group(2), int(p.group(3)), int(p.group(4))
            pins[pid] = {'abs_x': cx + px, 'abs_y': cy + py, 'rel_x': px, 'rel_y': py, 'label': plabel}
        comps[cid] = {'x': cx, 'y': cy, 'w': cw, 'h': ch, 'pins': pins}
    return comps

# Mode B components
b_comps = extract_components_with_pins(code[code.find('const UNDERWATER_COMPONENTS'):code.find('const UNDERWATER_WIRES')])
print(f'Mode B components extracted: {len(b_comps)}')

# Mode B wires
uw_chunk = code[code.find('const UNDERWATER_WIRES'):code.find('const ARDUINO_COMPONENTS')]
wires = re.findall(r'\{\s+id:\s*\'([^\']+)\'.*?busType:\s*\'([^\']+)\'.*?sourceComponentId:\s*\'([^\']+)\'.*?sourcePinId:\s*\'([^\']+)\'.*?destComponentId:\s*\'([^\']+)\'.*?destPinId:\s*\'([^\']+)\'', uw_chunk, re.DOTALL)
print(f'Mode B wires extracted: {len(wires)}')

for w in wires:
    wid, bus, sc, sp, dc, dp = w
    if sc in b_comps and sp in b_comps[sc]['pins']:
        s_coord = (b_comps[sc]['pins'][sp]['abs_x'], b_comps[sc]['pins'][sp]['abs_y'])
    else:
        s_coord = 'MISSING'
    if dc in b_comps and dp in b_comps[dc]['pins']:
        d_coord = (b_comps[dc]['pins'][dp]['abs_x'], b_comps[dc]['pins'][dp]['abs_y'])
    else:
        d_coord = 'MISSING'
    print(f'{wid:<20} | {bus:<8} | {sc}:{sp} ({s_coord}) ➔ {dc}:{dp} ({d_coord})')

