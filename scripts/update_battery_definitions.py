#!/usr/bin/env python3
"""
update_battery_definitions.py
Updates:
1. CircuitComponent interface: adds optional imageSrc?: string
2. pwr_primary_battery: MICRO NUCLEAR BATTERY – CONCEPTUAL with imageSrc: '/assets/hardware/pwr_micro_nuclear_battery.webp?v=4'
3. pwr_backup_battery: LITHIUM POLYMER (LiPo) BACKUP BATTERY PACK with imageSrc: '/assets/hardware/pwr_lipo_backup_battery.webp?v=4'
4. ComponentShape: uses comp.imageSrc || `/assets/hardware/${comp.id}.webp?v=4`
5. pwr_path_mgmt & pwr_bms: updates descriptions to reference LiPo pouch buffer
6. UNDERWATER_WIRES: updates wire names and descriptions to reference LiPo pouch buffer
"""

import re

PATH = 'src/pages/CircuitConnectionsPage.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update CircuitComponent interface
if 'imageSrc?: string;' not in text:
    text = text.replace(
        '  pins: PinDefinition[];',
        '  pins: PinDefinition[];\n  imageSrc?: string;'
    )
    print('[OK] Added imageSrc to CircuitComponent interface.')

# 2. Update ComponentShape image tag
old_image_tag = """      {/* ── Genuine Physical Hardware Component Cutout Image ── */}
      <image
        href={`/assets/hardware/${comp.id}.webp`}"""

new_image_tag = """      {/* ── Genuine Physical Hardware Component Cutout Image ── */}
      <image
        href={comp.imageSrc || `/assets/hardware/${comp.id}.webp?v=4`}"""

if old_image_tag in text:
    text = text.replace(old_image_tag, new_image_tag)
    print('[OK] Updated ComponentShape to respect comp.imageSrc with cache-busting ?v=4.')
else:
    # Use regex
    text = re.sub(
        r'<image\s+href=\{`/assets/hardware/\$\{comp\.id\}\.webp`\}',
        '<image\n        href={comp.imageSrc || `/assets/hardware/${comp.id}.webp?v=4`}',
        text
    )
    print('[OK] Regex updated ComponentShape image tag.')

# 3. Replace pwr_primary_battery & pwr_backup_battery definitions
old_pwr_block_match = re.search(r'\{\s+id:\s*[\'\"]pwr_primary_battery[\'\"].*?\{\s+id:\s*[\'\"]pwr_backup_battery[\'\"].*?\}\s+\},', text, re.DOTALL)
if not old_pwr_block_match:
    print('[ERROR] Could not find old battery block in UNDERWATER_COMPONENTS!')
    exit(1)

new_pwr_block = """{
    id: 'pwr_primary_battery',
    name: 'MICRO NUCLEAR BATTERY – CONCEPTUAL',
    category: 'POWER',
    modelNumber: 'Solid-State Betavoltaic Power Cell',
    status: 'ARCHITECTURAL',
    x: 275,
    y: 65,
    width: 195,
    height: 95,
    imageSrc: '/assets/hardware/pwr_micro_nuclear_battery.webp?v=4',
    description: 'Proposed long-duration solid-state micro-nuclear power source under conceptual architectural evaluation for multi-decade seabed deployment. Not physically present in benchtop prototype.',
    roleInMarislink: 'Proposed ultra-long-duration architectural primary energy source designed to trickle-charge the LiPo energy buffer without requiring periodic retrieval.',
    protocol: 'Autonomous Low-Voltage DC Supply',
    operatingVoltage: 'Low-Voltage DC Output (Proposed)',
    currentDraw: 'Continuous Micro-Power Trickle Feed',
    pins: [
      { id: 'vout_pos', label: '+', x: 61, y: 16, type: 'POWER', description: 'Micro Nuclear Battery Positive DC Terminal (+)' },
      { id: 'vout_neg', label: '—', x: 134, y: 16, type: 'GROUND', description: 'Micro Nuclear Battery Negative Ground Return (-)' }
    ]
  },
  {
    id: 'pwr_backup_battery',
    name: 'LITHIUM POLYMER (LiPo) BACKUP BATTERY PACK',
    category: 'POWER',
    modelNumber: 'Aluminum Laminated Pouch Cell Stack',
    status: 'ARCHITECTURAL',
    x: 510,
    y: 65,
    width: 195,
    height: 95,
    imageSrc: '/assets/hardware/pwr_lipo_backup_battery.webp?v=4',
    description: 'High-discharge multi-cell Lithium Polymer (LiPo) laminated pouch battery pack engineered to buffer peak transient surge currents during high-power acoustic transmission pulses.',
    roleInMarislink: 'Supplies rapid transient discharge currents to the 100W acoustic power amplifier, preventing voltage sag on sensitive digital processor rails.',
    protocol: 'High-Rate Secondary DC Energy Buffer',
    operatingVoltage: 'DC Output Rail (Multi-Cell Pouch Buffer)',
    currentDraw: 'High-Rate Pulse Burst Capability (To BMS)',
    pins: [
      { id: 'bat_pos', label: 'B+', x: 150, y: 14, type: 'POWER', description: 'LiPo Pouch Positive Power Lead (XT60 Terminal)' },
      { id: 'bat_neg', label: 'B-', x: 168, y: 14, type: 'GROUND', description: 'LiPo Pouch Negative Ground Return (XT60 Terminal)' }
    ]
  },"""

text = text[:old_pwr_block_match.start()] + new_pwr_block + text[old_pwr_block_match.end():]
print('[OK] Replaced battery definitions with Micro Nuclear and LiPo Pouch!')

# 4. Update pwr_path_mgmt and pwr_bms descriptions
text = text.replace(
    "description: 'Low-loss ideal diode-OR controller that switches seamlessly between external wet-mate power, micro nuclear battery (conceptual), and backup Li-ion buffer.',",
    "description: 'Low-loss ideal diode-OR controller that switches seamlessly between external wet-mate power, micro nuclear battery (conceptual), and backup lithium polymer (LiPo) pouch buffer.',"
)
text = text.replace(
    "{ id: 'sec_in', label: 'SEC_IN', x: 165, y: 30, type: 'POWER', description: 'BMS Buffered Secondary Battery Input' },",
    "{ id: 'sec_in', label: 'SEC_IN', x: 165, y: 30, type: 'POWER', description: 'BMS-Protected LiPo Pouch Secondary Battery Input' },"
)
text = text.replace(
    "roleInMarislink: 'Guards the Li-ion energy buffer against overvoltage, undervoltage, thermal runaway, and short circuits.',",
    "roleInMarislink: 'Guards the Lithium Polymer (LiPo) energy buffer against overvoltage, undervoltage, thermal runaway, and short circuits.',"
)

# 5. Update wires in UNDERWATER_WIRES
text = text.replace(
    "name: 'Rechargeable Li-Ion Buffer Battery to BMS Board',",
    "name: 'Lithium Polymer (LiPo) Buffer Battery to BMS Board',"
)
text = text.replace(
    "name: 'Protected Li-Ion Buffer Power to Power Path Manager',",
    "name: 'Protected LiPo Buffer Power to Power Path Manager',"
)
text = text.replace(
    "voltage: '+14.8V DC',\n    connectionPurpose: 'Connects secondary high-current buffer battery to protection and balancing circuit',",
    "voltage: 'DC Output (LiPo Pouch Buffer)',\n    connectionPurpose: 'Connects secondary high-discharge LiPo pouch battery to protection and balancing circuit via XT60 connector',"
)
text = text.replace(
    "signalDescription: 'Unregulated cell stack power connection'",
    "signalDescription: 'High-current pouch cell stack power connection via XT60 terminal'"
)
text = text.replace(
    "signalDescription: 'BMS-protected high-current secondary power feed'",
    "signalDescription: 'BMS-protected high-current secondary LiPo power feed'"
)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(text)

print('[SUCCESS] Successfully updated battery data and components in CircuitConnectionsPage.tsx!')
