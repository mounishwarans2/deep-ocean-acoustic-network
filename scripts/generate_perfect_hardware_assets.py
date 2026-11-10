import os, math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

OUTPUT_DIR = 'public/assets/hardware'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def save_dual(img, comp_id):
    png_path = os.path.join(OUTPUT_DIR, f'{comp_id}.png')
    webp_path = os.path.join(OUTPUT_DIR, f'{comp_id}.webp')
    img.save(png_path, 'PNG', optimize=True)
    img.save(webp_path, 'WEBP', quality=92)
    alpha = np.array(img)[:, :, 3]
    transp = (alpha == 0).mean() * 100
    print(f'✓ {comp_id:25}: {img.size[0]}x{img.size[1]}px, transparent={transp:.1f}%')

# 1. AMD Versal AI Edge Processor Chip Package (ai_jetson_orin)
def build_versal_processor():
    W, H = 800, 800
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer dark green organic BGA substrate
    pad = 60
    draw.rounded_rectangle([pad, pad, W-pad, H-pad], radius=16, fill=(18, 55, 30, 255), outline=(10, 35, 18, 255), width=3)
    
    # Gold perimeter solder ball contacts / gull-wing leads (56 perimeter leads)
    for i in range(14):
        # Top & Bottom leads
        x = pad + 40 + i * 44
        draw.rectangle([x, pad-14, x+16, pad], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255))
        draw.rectangle([x, H-pad, x+16, H-pad+14], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255))
        # Left & Right leads
        y = pad + 40 + i * 44
        draw.rectangle([pad-14, y, pad, y+16], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255))
        draw.rectangle([W-pad, y, W-pad+14, y+16], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255))
        
    # Gold fanned-out bus traces
    for i in range(8):
        offset = pad + 60 + i * 70
        draw.line([offset, pad+10, offset+15, pad+45], fill=(180, 145, 45, 180), width=2)
        draw.line([offset, H-pad-10, offset+15, H-pad-45], fill=(180, 145, 45, 180), width=2)

    # 0402 Ceramic decoupling capacitors flanking die perimeter
    for cx in range(pad+70, W-pad-70, 48):
        draw.rectangle([cx, pad+30, cx+20, pad+42], fill=(180, 140, 100, 255), outline=(130, 90, 60, 255))
        draw.rectangle([cx, H-pad-42, cx+20, H-pad-30], fill=(180, 140, 100, 255), outline=(130, 90, 60, 255))

    # Monolithic Silver Integrated Heat Spreader (IHS) Lid
    ihs_pad = 130
    draw.rounded_rectangle([ihs_pad, ihs_pad, W-ihs_pad, H-ihs_pad], radius=24, fill=(215, 220, 228, 255), outline=(160, 165, 175, 255), width=4)
    # Beveled inner lid border
    draw.rounded_rectangle([ihs_pad+14, ihs_pad+14, W-ihs_pad-14, H-ihs_pad-14], radius=16, fill=(230, 235, 242, 255), outline=(190, 195, 205, 255), width=2)
    
    # Pin 1 Gold Index Triangle
    draw.polygon([(ihs_pad+30, ihs_pad+30), (ihs_pad+55, ihs_pad+30), (ihs_pad+30, ihs_pad+55)], fill=(212, 175, 55, 255))
    
    # Laser Etched Markings
    draw.text((ihs_pad+80, ihs_pad+70), 'AMD  VERSAL', fill=(50, 55, 65, 255), font_size=28)
    draw.text((ihs_pad+80, ihs_pad+110), 'AI EDGE ADAPTIVE SoC', fill=(70, 75, 85, 255), font_size=20)
    draw.text((ihs_pad+80, ihs_pad+145), 'XCVE2302 - SFVA784 - 2L - E', fill=(80, 85, 95, 255), font_size=15)
    draw.text((ihs_pad+80, ihs_pad+175), 'DUAL ARM CORTEX-A72 + AI ENGINES', fill=(90, 95, 105, 255), font_size=13)
    draw.text((ihs_pad+80, ihs_pad+200), 'SWARM SNC ACCELERATOR', fill=(100, 105, 115, 255), font_size=13)

    # 2D DataMatrix Authenticity Code
    dm_x, dm_y = W - ihs_pad - 120, H - ihs_pad - 120
    draw.rectangle([dm_x, dm_y, dm_x+80, dm_y+80], fill=(245, 245, 250, 255), outline=(100, 105, 115, 255), width=1)
    for r in range(8):
        for c in range(8):
            if (r + c) % 2 == 0 or (r * c) % 3 == 0:
                draw.rectangle([dm_x+4+c*9, dm_y+4+r*9, dm_x+11+c*9, dm_y+11+r*9], fill=(30, 32, 36, 255))

    save_dual(img, 'ai_jetson_orin')

# 2. Modern Multi-Rail DC-DC Voltage Regulator (pwr_dcdc_converters)
def build_dcdc_converters():
    W, H = 800, 600
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Deep blue high-current PCB
    draw.rounded_rectangle([60, 60, W-60, H-60], radius=16, fill=(15, 35, 75, 255), outline=(30, 60, 120, 255), width=3)
    # Corner mounting brass eyelets
    for hx, hy in [(90, 90), (W-90, 90), (90, H-90), (W-90, H-90)]:
        draw.ellipse([hx-14, hy-14, hx+14, hy+14], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255), width=2)
        draw.ellipse([hx-8, hy-8, hx+8, hy+8], fill=(0, 0, 0, 0))

    # Large Black Aluminum Extruded Heatsink across top-center
    draw.rounded_rectangle([180, 100, W-180, 220], radius=8, fill=(35, 38, 42, 255), outline=(65, 70, 78, 255), width=2)
    # Heatsink cooling fins
    for fx in range(200, W-190, 18):
        draw.line([fx, 104, fx, 216], fill=(75, 80, 90, 255), width=3)
        draw.line([fx+4, 104, fx+4, 216], fill=(20, 22, 25, 255), width=2)

    # Dual Heavy-Duty Shielded Toroidal Power Inductors (Copper coils on ferrite cores)
    for ix in [220, 440]:
        # Ferrite core outer ring
        draw.ellipse([ix, 250, ix+140, 390], fill=(45, 48, 52, 255), outline=(25, 28, 30, 255), width=2)
        # Copper windings wrapped around toroid
        for angle in range(0, 360, 18):
            rad = math.radians(angle)
            cx, cy = ix + 70, 320
            x1 = cx + math.cos(rad) * 40
            y1 = cy + math.sin(rad) * 40
            x2 = cx + math.cos(rad) * 65
            y2 = cy + math.sin(rad) * 65
            draw.line([x1, y1, x2, y2], fill=(205, 120, 45, 255), width=5)
        # Toroid center hole
        draw.ellipse([ix+42, 292, ix+98, 348], fill=(15, 35, 75, 255), outline=(30, 60, 120, 255), width=2)

    # Aluminum Electrolytic Filter Capacitors (silver cylindrical cans with vent cross)
    for cx in [120, 600]:
        for cy in [260, 350]:
            draw.ellipse([cx, cy, cx+60, cy+60], fill=(200, 205, 215, 255), outline=(140, 145, 155, 255), width=2)
            draw.ellipse([cx+6, cy+6, cx+54, cy+54], fill=(180, 185, 195, 255))
            draw.line([cx+15, cy+30, cx+45, cy+30], fill=(120, 125, 135, 255), width=2)
            draw.line([cx+30, cy+15, cx+30, cy+45], fill=(120, 125, 135, 255), width=2)

    # Input & Output Screw Terminal Blocks (Green industrial blocks)
    # Left: VIN (14.4V - 24V)
    draw.rectangle([30, 230, 80, 370], fill=(22, 130, 55, 255), outline=(12, 85, 35, 255), width=3)
    for sy in [265, 335]:
        draw.ellipse([45, sy-14, 65, sy+14], fill=(200, 205, 215, 255), outline=(90, 95, 105, 255), width=2)
        draw.line([47, sy, 63, sy], fill=(40, 45, 50, 255), width=3)

    # Right: Multi-Rail Outputs (12V, 5V, 3.3V, GND)
    draw.rectangle([W-80, 200, W-30, 420], fill=(22, 130, 55, 255), outline=(12, 85, 35, 255), width=3)
    for sy in [230, 280, 340, 390]:
        draw.ellipse([W-65, sy-12, W-45, sy+12], fill=(200, 205, 215, 255), outline=(90, 95, 105, 255), width=2)
        draw.line([W-63, sy, W-47, sy], fill=(40, 45, 50, 255), width=3)

    # Silkscreen text
    draw.text((220, 430), 'MULTI-RAIL DC-DC STEP-DOWN REGULATORS', fill=(220, 230, 245, 240), font_size=16)
    draw.text((240, 460), 'HIGH-EFFICIENCY SYNCHRONOUS BUCK CONVERTER', fill=(180, 195, 220, 200), font_size=13)
    draw.text((260, 485), 'OUTPUTS: +12V (AMP) | +5V (SENSORS) | +3.3V (CORE)', fill=(140, 165, 200, 200), font_size=12)

    save_dual(img, 'pwr_dcdc_converters')

# 3. PT1000 Oceanographic Precision Temperature Sensor Probe (sensor_ocean_temp)
def build_ocean_temp_probe():
    W, H = 500, 900
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 316L Stainless Steel RTD probe sheath (center slender rod)
    cx = W // 2
    # Polyurethane marine cable extending from top
    draw.rectangle([cx-12, 30, cx+12, 220], fill=(30, 32, 36, 255), outline=(15, 16, 18, 255), width=2)
    # Cable strain relief boot (grooved black rubber boot)
    for by in range(160, 250, 12):
        draw.rectangle([cx-16, by, cx+16, by+8], fill=(45, 48, 54, 255), outline=(25, 28, 30, 255))

    # Brass / Stainless Hex Mounting Collar Nut
    draw.polygon([
        (cx-34, 250), (cx+34, 250),
        (cx+44, 290), (cx+34, 330),
        (cx-34, 330), (cx-44, 290)
    ], fill=(190, 195, 205, 255), outline=(130, 135, 145, 255))
    # Threaded NPT fitting below hex collar
    for ty in range(330, 390, 8):
        draw.line([cx-26, ty, cx+26, ty], fill=(160, 165, 175, 255), width=4)

    # Long precision cylindrical RTD sheath
    draw.rounded_rectangle([cx-18, 390, cx+18, 800], radius=8, fill=(215, 220, 228, 255), outline=(150, 155, 165, 255), width=3)
    # Metallic specular light reflection down the center
    draw.line([cx-4, 400, cx-4, 790], fill=(250, 252, 255, 200), width=4)
    # Tapered hemispherical sensing tip
    draw.ellipse([cx-18, 780, cx+18, 820], fill=(215, 220, 228, 255), outline=(150, 155, 165, 255), width=3)
    # Laser markings on stainless sheath
    draw.text((cx-60, 520), 'PT1000 RTD  CLASS A', fill=(100, 105, 115, 255), font_size=12)
    draw.text((cx-55, 540), 'OCEANOGRAPHIC PROBE', fill=(120, 125, 135, 255), font_size=11)
    draw.text((cx-50, 560), '-5°C TO +50°C (±0.01°C)', fill=(130, 135, 145, 255), font_size=10)

    save_dual(img, 'sensor_ocean_temp')

# 4. Low-Noise Acoustic Front-End Amplifier (acoustics_lna)
def build_acoustics_lna():
    W, H = 800, 600
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Precision Milled Nickel-Plated Aluminum Shielded Enclosure
    draw.rounded_rectangle([140, 120, W-140, H-120], radius=16, fill=(185, 192, 202, 255), outline=(125, 132, 142, 255), width=4)
    # Recessed RF gasket lid
    draw.rounded_rectangle([155, 135, W-155, H-135], radius=12, fill=(170, 177, 187, 255), outline=(215, 222, 232, 255), width=2)
    
    # Shield retention screws along perimeter
    for sx, sy in [(175, 155), (W-175, 155), (175, H-155), (W-175, H-155), (W//2, 155), (W//2, H-155), (175, H//2), (W-175, H//2)]:
        draw.ellipse([sx-8, sy-8, sx+8, sy+8], fill=(135, 142, 152, 255), outline=(90, 95, 105, 255), width=1)
        draw.line([sx-5, sy, sx+5, sy], fill=(70, 75, 85, 255), width=2)

    # BNC Bulkhead Hydrophone Input Connector on Left
    draw.rectangle([70, 245, 140, 355], fill=(195, 200, 210, 255), outline=(115, 120, 130, 255), width=3)
    draw.rectangle([45, 270, 70, 330], fill=(220, 225, 235, 255), outline=(145, 150, 160, 255), width=2)
    draw.ellipse([48, 285, 67, 315], fill=(212, 175, 55, 255))

    # Gold SMA Coaxial Output Connector on Right
    draw.rectangle([W-140, 265, W-85, 335], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255), width=2)
    draw.rectangle([W-85, 280, W-55, 320], fill=(230, 195, 75, 255), outline=(180, 140, 40, 255), width=2)

    # Laser Engraved Technical Markings
    draw.text((220, 220), 'LOW-NOISE ACOUSTIC FRONT-END (LNA)', fill=(45, 50, 60, 255), font_size=18)
    draw.text((250, 260), 'NOISE DENSITY: 0.8 nV/√Hz  |  GAIN: 40 dB', fill=(65, 70, 80, 255), font_size=14)
    draw.text((235, 290), 'BANDWIDTH: 10 Hz - 200 kHz (HYDROPHONE IN)', fill=(75, 80, 90, 255), font_size=13)
    draw.text((275, 320), 'ANALOG DEVICES AD8429 INSTRUMENTATION', fill=(90, 95, 105, 255), font_size=12)

    # Bottom Terminal Header for Power & Differential Audio
    draw.rectangle([300, H-120, 500, H-80], fill=(22, 24, 28, 255))
    for px in range(320, 490, 32):
        draw.ellipse([px-5, H-75, px+5, H-65], fill=(212, 175, 55, 255))

    save_dual(img, 'acoustics_lna')

# 5. Acoustic Modulation DAC Module (acoustics_dac)
def build_acoustics_dac():
    W, H = 800, 600
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Precision dark-navy audio PCB
    draw.rounded_rectangle([100, 100, W-100, H-100], radius=14, fill=(16, 40, 85, 255), outline=(32, 75, 150, 255), width=3)
    # Mounting holes
    for hx, hy in [(130, 130), (W-130, 130), (130, H-130), (W-130, H-130)]:
        draw.ellipse([hx-12, hy-12, hx+12, hy+12], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255), width=2)
        draw.ellipse([hx-6, hy-6, hx+6, hy+6], fill=(0, 0, 0, 0))

    # DAC IC (Analog Devices AD5791 20-bit / PCM5102)
    draw.rectangle([310, 210, 490, 390], fill=(26, 28, 32, 255), outline=(65, 70, 80, 255), width=2)
    for py in range(230, 380, 15):
        draw.line([275, py, 310, py], fill=(212, 175, 55, 255), width=4)
        draw.line([490, py, 525, py], fill=(212, 175, 55, 255), width=4)

    # 16.000 MHz Ultra-Low Jitter TCXO Canned Crystal Oscillator
    draw.rounded_rectangle([180, 240, 260, 330], radius=6, fill=(205, 210, 220, 255), outline=(145, 150, 160, 255), width=2)
    draw.text((192, 275), '16.000', fill=(50, 55, 65, 255), font_size=13)
    draw.text((195, 295), 'TCXO', fill=(80, 85, 95, 255), font_size=11)

    # Gold SMA Analog Waveform Output on Right
    draw.rectangle([W-100, 265, W-45, 335], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255), width=2)
    draw.rectangle([W-45, 280, W-15, 320], fill=(230, 195, 75, 255), outline=(180, 140, 40, 255), width=2)

    # Silkscreen text
    draw.text((230, 140), 'HIGH-SPEED ACOUSTIC MODULATION DAC', fill=(225, 235, 250, 240), font_size=17)
    draw.text((360, 275), 'AD5791', fill=(215, 220, 230, 220), font_size=18)
    draw.text((335, 305), '24-BIT / 1 MSPS', fill=(170, 185, 210, 200), font_size=13)
    draw.text((260, 430), 'DDS SYNTHESIS WAVEFORM GENERATOR', fill=(170, 190, 225, 200), font_size=14)

    # Digital SPI Header at Bottom
    draw.rectangle([250, H-100, 550, H-60], fill=(20, 22, 25, 255))
    for px in range(270, 540, 26):
        draw.ellipse([px-4, H-55, px+4, H-45], fill=(212, 175, 55, 255))

    save_dual(img, 'acoustics_dac')

# 6. Water-Leak Hull Ingress Sensor (sensor_leak_hull)
def build_leak_sensor():
    W, H = 800, 600
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Subsea Gold-plated interdigital probe PCB
    draw.rounded_rectangle([130, 100, W-130, H-100], radius=14, fill=(18, 55, 35, 255), outline=(35, 100, 65, 255), width=3)
    
    # Gold Interdigital Sensing Fingers (Combs)
    for y in range(150, 440, 22):
        draw.line([180, y, W-250, y], fill=(212, 175, 55, 255), width=6)
    draw.line([180, 150, 180, 420], fill=(212, 175, 55, 255), width=8)

    for y in range(161, 440, 22):
        draw.line([250, y, W-180, y], fill=(212, 175, 55, 255), width=6)
    draw.line([W-180, 161, W-180, 430], fill=(212, 175, 55, 255), width=8)

    # Central Optical Bubble / Prism Detector
    draw.ellipse([W//2-50, H//2-50, W//2+50, H//2+50], fill=(40, 90, 140, 190), outline=(100, 190, 255, 255), width=4)
    draw.ellipse([W//2-30, H//2-30, W//2-10, H//2-10], fill=(220, 240, 255, 230))

    # Heavy-duty waterproof cable gland top
    draw.rectangle([W//2-40, 30, W//2+40, 100], fill=(42, 45, 50, 255), outline=(75, 80, 90, 255), width=2)
    draw.line([W//2, 0, W//2, 30], fill=(25, 28, 30, 255), width=20)

    # Silkscreen text
    draw.text((220, 460), 'HULL INTEGRITY WATER-LEAK INGRESS SENSOR', fill=(210, 245, 225, 240), font_size=15)
    save_dual(img, 'sensor_leak_hull')

# 7. Subsea Wet-Mateable 4-Pin Power Connector (interface_wetmate_power)
def build_wetmate_power():
    W, H = 800, 600
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Heavy-duty molded black neoprene circular underwater plug body
    draw.rounded_rectangle([150, 160, W-250, H-160], radius=28, fill=(32, 34, 38, 255), outline=(18, 20, 22, 255), width=4)
    # Ribbed neoprene gripping collar
    for gx in range(190, 350, 24):
        draw.line([gx, 164, gx, H-164], fill=(55, 58, 65, 255), width=5)

    # 316L Stainless Steel Locking Sleeve Ring
    draw.rectangle([W-350, 140, W-250, H-140], fill=(185, 190, 200, 255), outline=(125, 130, 140, 255), width=3)
    # Diamond knurl texture on locking ring
    for kx in range(W-340, W-260, 12):
        draw.line([kx, 144, kx+8, H-144], fill=(140, 145, 155, 255), width=2)

    # Heavy Subsea Cable entering from left
    draw.rectangle([40, 250, 150, 350], fill=(22, 24, 26, 255), outline=(12, 14, 16, 255), width=2)

    # Front Circular Face with 4 Gold Power Pins (Right side face)
    draw.ellipse([W-280, 170, W-180, H-170], fill=(22, 24, 28, 255), outline=(150, 155, 165, 255), width=3)
    pins = [
        (W-240, 240, '+24V'),
        (W-240, H-240, 'GND'),
        (W-210, H//2-30, 'PWR_AUX'),
        (W-210, H//2+30, 'RET')
    ]
    for px, py, plabel in pins:
        draw.ellipse([px-14, py-14, px+14, py+14], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255), width=2)
        draw.ellipse([px-7, py-7, px+7, py+7], fill=(245, 215, 85, 255))

    draw.text((220, 460), 'SUBSEA WET-MATEABLE 4-PIN POWER CONNECTOR', fill=(220, 225, 235, 240), font_size=15)
    save_dual(img, 'interface_wetmate_power')

# 8. Subsea Wet-Mateable 8-Pin High-Speed Data Connector (interface_wetmate_data)
def build_wetmate_data():
    W, H = 800, 600
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 316L Stainless Steel Pressure-Tolerant Bulkhead Receptacle
    draw.rounded_rectangle([150, 160, W-250, H-160], radius=20, fill=(185, 190, 200, 255), outline=(125, 130, 140, 255), width=4)
    # Bulkhead flange plate
    draw.rounded_rectangle([170, 130, 250, H-130], radius=10, fill=(160, 165, 175, 255), outline=(110, 115, 125, 255), width=3)
    # Bolt holes
    for by in [160, H-160]:
        draw.ellipse([200, by-10, 220, by+10], fill=(80, 85, 95, 255))

    # Dual O-ring sealing grooves
    draw.rectangle([W-350, 165, W-330, H-165], fill=(30, 32, 36, 255))
    draw.rectangle([W-310, 165, W-290, H-165], fill=(30, 32, 36, 255))

    # Armored data cable extending left
    draw.rectangle([40, 260, 170, 340], fill=(25, 30, 40, 255), outline=(15, 20, 30, 255), width=2)

    # Front Circular Face with 8-Pin Star-Quad Ethernet Insert
    draw.ellipse([W-280, 170, W-180, H-170], fill=(15, 25, 45, 255), outline=(150, 155, 165, 255), width=3)
    for i in range(8):
        ang = math.radians(i * 45)
        px = (W-230) + math.cos(ang) * 32
        py = (H//2) + math.sin(ang) * 32
        draw.ellipse([px-7, py-7, px+7, py+7], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255), width=1)

    draw.text((210, 460), 'SUBSEA WET-MATEABLE 8-PIN ETHERNET CONNECTOR', fill=(220, 225, 235, 240), font_size=15)
    save_dual(img, 'interface_wetmate_data')

# 9. USB-C and SWD Diagnostic Interface Breakout (interface_debug_port)
def build_debug_port():
    W, H = 800, 600
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Matte black diagnostic breakout PCB
    draw.rounded_rectangle([120, 120, W-120, H-120], radius=14, fill=(22, 24, 28, 255), outline=(50, 55, 65, 255), width=3)
    
    # Silver USB Type-C Receptacle on Left
    draw.rounded_rectangle([70, 240, 180, 360], radius=10, fill=(215, 220, 230, 255), outline=(145, 150, 160, 255), width=3)
    draw.rounded_rectangle([90, 265, 160, 335], radius=8, fill=(35, 38, 42, 255))
    draw.rectangle([115, 292, 135, 308], fill=(212, 175, 55, 255))

    # 10-Pin 0.05\" ARM Cortex SWD Header on Right
    draw.rectangle([W-230, 220, W-130, 380], fill=(16, 18, 20, 255), outline=(65, 70, 80, 255), width=2)
    for py in range(250, 360, 22):
        draw.ellipse([W-205, py-5, W-195, py+5], fill=(212, 175, 55, 255))
        draw.ellipse([W-165, py-5, W-155, py+5], fill=(212, 175, 55, 255))

    # Tag-Connect 6-Pin Footprint in Center
    for cx, cy in [(350, 280), (375, 280), (400, 280), (350, 320), (375, 320), (400, 320)]:
        draw.ellipse([cx-5, cy-5, cx+5, cy+5], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255), width=1)

    # Diagnostic LEDs
    draw.ellipse([270, 180, 286, 196], fill=(34, 197, 94, 255))
    draw.ellipse([300, 180, 316, 196], fill=(234, 179, 8, 255))
    draw.ellipse([330, 180, 346, 196], fill=(59, 130, 246, 255))

    draw.text((240, 420), 'USB-C & SWD / JTAG DIAGNOSTIC INTERFACE', fill=(220, 230, 245, 240), font_size=15)
    save_dual(img, 'interface_debug_port')

# 10. Subsea Optical 4-Channel Marine LED Status Array (led_indicators_panel)
def build_led_panel():
    W, H = 800, 600
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Anodized black marine aluminum bulkhead plate
    draw.rounded_rectangle([100, 180, W-100, 420], radius=20, fill=(28, 30, 35, 255), outline=(75, 80, 90, 255), width=4)
    # Bulkhead hex mounting bolts
    for hx in [135, W-135]:
        for hy in [215, 385]:
            draw.polygon([(hx-8, hy-14), (hx+8, hy-14), (hx+16, hy), (hx+8, hy+14), (hx-8, hy+14), (hx-16, hy)], fill=(160, 165, 175, 255))

    # 4 Heavy-duty domed glass optical indicator lenses
    leds = [
        (220, (34, 197, 94), 'PWR'),
        (340, (234, 179, 8), 'SYNC'),
        (460, (59, 130, 246), 'COMM'),
        (580, (239, 68, 68), 'ALERT')
    ]
    for lx, col, lbl in leds:
        # Stainless bezel ring
        draw.ellipse([lx-44, 256, lx+44, 344], fill=(175, 180, 190, 255), outline=(215, 220, 230, 255), width=3)
        draw.ellipse([lx-34, 266, lx+34, 334], fill=(55, 60, 70, 255))
        # Domed glass lens
        draw.ellipse([lx-28, 272, lx+28, 328], fill=col)
        # Specular reflection highlight
        draw.ellipse([lx-16, 280, lx-4, 292], fill=(255, 255, 255, 220))
        # Label text
        draw.text((lx-16, 360), lbl, fill=(225, 230, 240, 240), font_size=15)

    save_dual(img, 'led_indicators_panel')

# 11. Underwater Acoustic Modem OEM Interface (modem_uart)
def build_modem_uart():
    W, H = 800, 600
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Industrial green multi-layer modem PCB
    draw.rounded_rectangle([100, 100, W-100, H-100], radius=16, fill=(20, 65, 40, 255), outline=(40, 115, 75, 255), width=3)
    # Mounting holes
    for hx, hy in [(130, 130), (W-130, 130), (130, H-130), (W-130, H-130)]:
        draw.ellipse([hx-12, hy-12, hx+12, hy+12], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255), width=2)
        draw.ellipse([hx-6, hy-6, hx+6, hy+6], fill=(0, 0, 0, 0))

    # DSP Modem Controller IC
    draw.rectangle([250, 200, 420, 370], fill=(25, 28, 32, 255), outline=(65, 70, 80, 255), width=2)
    draw.text((280, 270), 'ACOUSTIC DSP', fill=(220, 225, 235, 240), font_size=15)
    draw.text((300, 295), 'MODEM CORE', fill=(180, 185, 195, 200), font_size=13)

    # Acoustic Isolation Transformer (Blue encapsulated block)
    draw.rounded_rectangle([480, 220, 620, 350], radius=8, fill=(35, 65, 120, 255), outline=(60, 95, 160, 255), width=2)
    draw.text((510, 275), 'ISOLATION', fill=(220, 230, 245, 240), font_size=13)
    draw.text((505, 295), 'TRANSFORMER', fill=(180, 195, 215, 200), font_size=11)

    # Transducer High-Voltage Output Terminal Block (Top Right)
    draw.rectangle([W-180, 50, W-80, 120], fill=(22, 130, 55, 255), outline=(12, 85, 35, 255), width=2)
    draw.text((W-170, 75), 'TRANSDUCER', fill=(255, 255, 255, 240), font_size=11)

    # Serial UART / Power Header (Left Edge)
    draw.rectangle([60, 220, 100, 380], fill=(20, 22, 25, 255))
    for py in range(240, 370, 25):
        draw.ellipse([75, py-5, 85, py+5], fill=(212, 175, 55, 255))

    draw.text((220, 430), 'UNDERWATER ACOUSTIC MODEM OEM INTERFACE', fill=(210, 245, 225, 240), font_size=15)
    save_dual(img, 'modem_uart')

# 12. Ideal Diode Power Path Management Controller (pwr_path_mgmt)
def build_power_path_mgmt():
    W, H = 800, 600
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Navy blue PCB
    draw.rounded_rectangle([100, 100, W-100, H-100], radius=16, fill=(15, 35, 75, 255), outline=(35, 70, 140, 255), width=3)
    # Corner mounting brass eyelets
    for hx, hy in [(130, 130), (W-130, 130), (130, H-130), (W-130, H-130)]:
        draw.ellipse([hx-12, hy-12, hx+12, hy+12], fill=(212, 175, 55, 255), outline=(160, 130, 30, 255), width=2)
        draw.ellipse([hx-6, hy-6, hx+6, hy+6], fill=(0, 0, 0, 0))

    # Dual Heavy-Current Low-RDS(on) Power MOSFETs (Silver drain tabs)
    for mx in [240, 460]:
        draw.rectangle([mx, 200, mx+100, 350], fill=(30, 32, 36, 255), outline=(60, 65, 75, 255), width=2)
        draw.rectangle([mx+10, 210, mx+90, 250], fill=(195, 200, 210, 255), outline=(145, 150, 160, 255))
        for px in [mx+20, mx+50, mx+80]:
            draw.line([px, 350, px, 380], fill=(210, 215, 225, 255), width=6)

    # Controller IC (Linear Tech / ADI LTC4412 / LTC4353 Ideal Diode Controller)
    draw.rectangle([340, 140, 460, 200], fill=(25, 28, 30, 255), outline=(65, 70, 75, 255), width=2)
    draw.text((360, 160), 'LTC4412', fill=(220, 225, 235, 240), font_size=15)
    draw.text((350, 180), 'POWER MUX', fill=(180, 185, 195, 200), font_size=11)

    # Primary & Backup Battery Input Terminals (Left)
    draw.rectangle([50, 180, 100, 380], fill=(22, 130, 55, 255), outline=(12, 85, 35, 255), width=2)
    for sy in [215, 275, 345]:
        draw.ellipse([65, sy-12, 85, sy+12], fill=(200, 205, 215, 255))
        draw.line([67, sy, 83, sy], fill=(40, 45, 50, 255), width=3)

    # System VOUT Terminals (Right)
    draw.rectangle([W-100, 220, W-50, 350], fill=(22, 130, 55, 255), outline=(12, 85, 35, 255), width=2)
    for sy in [255, 315]:
        draw.ellipse([W-85, sy-12, W-65, sy+12], fill=(200, 205, 215, 255))
        draw.line([W-83, sy, W-67, sy], fill=(40, 45, 50, 255), width=3)

    draw.text((220, 430), 'SEAMLESS IDEAL DIODE POWER PATH CONTROLLER', fill=(220, 230, 245, 240), font_size=15)
    save_dual(img, 'pwr_path_mgmt')

build_versal_processor()
build_dcdc_converters()
build_ocean_temp_probe()
build_acoustics_lna()
build_acoustics_dac()
build_leak_sensor()
build_wetmate_power()
build_wetmate_data()
build_debug_port()
build_led_panel()
build_modem_uart()
build_power_path_mgmt()
