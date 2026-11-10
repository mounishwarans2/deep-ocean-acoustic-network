#!/usr/bin/env python3
"""
generate_batteries.py
Generates:
1. Micro Nuclear Battery (Conceptual) - Compact hermetic titanium/beryllium enclosure with trefoil insignia and ceramic terminal feedthroughs.
2. Lithium Polymer (LiPo) Backup Battery Pack - Flat silver aluminum-laminated pouch cells with Kapton tape, vacuum crimp seams, heavy silicone leads, and yellow XT60 connector.
"""

from PIL import Image, ImageDraw, ImageFont
import math, os

def get_fonts():
    try:
        f_title = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
        f_sub = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 12)
        f_sm = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 10)
        f_term = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 24)
        f_lipo_title = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
        f_lipo_sub = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 11)
        f_lipo_sm = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 9.5)
    except:
        f_title = f_sub = f_sm = f_term = f_lipo_title = f_lipo_sub = f_lipo_sm = ImageFont.load_default()
    return f_title, f_sub, f_sm, f_term, f_lipo_title, f_lipo_sub, f_lipo_sm

def generate_micro_nuclear_battery():
    W, H = 800, 500
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    f_title, f_sub, f_sm, f_term, _, _, _ = get_fonts()

    cx, cy = 400, 275
    bw, bh = 560, 270

    # 1. Soft ambient shadow
    for r in range(25, 0, -1):
        alpha = int(45 * (1 - r / 25))
        draw.rounded_rectangle([cx - bw//2 - r, cy - bh//2 - r + 15, cx + bw//2 + r, cy + bh//2 + r + 25],
                               radius=36 + r, fill=(0, 0, 0, alpha))

    # 2. Main machined titanium enclosure body
    for y in range(cy - bh//2, cy + bh//2):
        t = (y - (cy - bh//2)) / bh
        # Brushed titanium profile with dual specular bands
        if t < 0.12:
            c = int(145 + t * 450)
        elif t < 0.35:
            c = int(210 - (t - 0.12) * 200)
        elif t < 0.65:
            c = int(165 + (t - 0.35) * 220)
        else:
            c = int(230 - (t - 0.65) * 380)
        c = max(80, min(240, c))
        # Titanium blue-grey tone
        draw.line([cx - bw//2, y, cx + bw//2, y], fill=(c - 8, c, c + 14, 255), width=1)

    # Mask to precision rounded-rectangle with chamfered rim
    mask = Image.new('L', (W, H), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle([cx - bw//2, cy - bh//2, cx + bw//2, cy + bh//2], radius=32, fill=255)
    img.putalpha(Image.composite(mask, img.getchannel('A'), mask))
    draw = ImageDraw.Draw(img)

    # Metallic chamfered outer bezel & laser-welded seal grooves
    draw.rounded_rectangle([cx - bw//2, cy - bh//2, cx + bw//2, cy + bh//2], radius=32, outline=(245, 250, 255, 230), width=3)
    draw.rounded_rectangle([cx - bw//2 + 6, cy - bh//2 + 6, cx + bw//2 - 6, cy + bh//2 - 6], radius=28, outline=(60, 70, 85, 210), width=3)
    draw.rounded_rectangle([cx - bw//2 + 12, cy - bh//2 + 12, cx + bw//2 - 12, cy + bh//2 - 12], radius=24, outline=(160, 175, 195, 170), width=2)

    # Precision corner assembly hex-socket bolts
    bolt_coords = [
        (cx - bw//2 + 35, cy - bh//2 + 35),
        (cx + bw//2 - 35, cy - bh//2 + 35),
        (cx - bw//2 + 35, cy + bh//2 - 35),
        (cx + bw//2 - 35, cy + bh//2 - 35),
        (cx - bw//2 + 35, cy),
        (cx + bw//2 - 35, cy)
    ]
    for bx, by in bolt_coords:
        draw.ellipse([bx - 14, by - 14, bx + 14, by + 14], fill=(50, 60, 75, 255), outline=(190, 200, 215, 255), width=2)
        for a in range(6):
            ang1 = a * math.pi / 3
            ang2 = (a + 1) * math.pi / 3
            x1 = bx + int(8 * math.cos(ang1))
            y1 = by + int(8 * math.sin(ang1))
            x2 = bx + int(8 * math.cos(ang2))
            y2 = by + int(8 * math.sin(ang2))
            draw.line([x1, y1, x2, y2], fill=(20, 25, 32, 255), width=2)

    # Cooling micro-fin channels on left and right flanks
    for fx in range(cx - bw//2 + 70, cx - 150, 15):
        draw.line([fx, cy - bh//2 + 25, fx, cy + bh//2 - 25], fill=(45, 52, 65, 190), width=4)
        draw.line([fx + 2, cy - bh//2 + 25, fx + 2, cy + bh//2 - 25], fill=(225, 235, 250, 190), width=2)

    for fx in range(cx + 150, cx + bw//2 - 60, 15):
        draw.line([fx, cy - bh//2 + 25, fx, cy + bh//2 - 25], fill=(45, 52, 65, 190), width=4)
        draw.line([fx + 2, cy - bh//2 + 25, fx + 2, cy + bh//2 - 25], fill=(225, 235, 250, 190), width=2)

    # Central shielded faceplate recess
    pw, ph = 280, 215
    draw.rounded_rectangle([cx - pw//2, cy - ph//2, cx + pw//2, cy + ph//2], radius=18,
                           fill=(16, 22, 32, 255), outline=(100, 116, 139, 220), width=3)
    draw.rounded_rectangle([cx - pw//2 + 4, cy - ph//2 + 4, cx + pw//2 - 4, cy + ph//2 - 4], radius=14,
                           outline=(30, 41, 59, 255), width=2)

    # Official Ionizing Radiation Trefoil Insignia (Yellow & Black)
    tx, ty = cx, cy - 28
    tr = 45

    # Yellow background warning circle with border
    draw.ellipse([tx - tr - 6, ty - tr - 6, tx + tr + 6, ty + tr + 6], fill=(234, 179, 8, 255), outline=(202, 138, 4, 255), width=3)

    # Three black radiation fan blades
    for i in range(3):
        start_angle = i * 120 + 30
        end_angle = start_angle + 60
        pts = [(tx, ty)]
        for step in range(25):
            rad = math.radians(start_angle + (end_angle - start_angle) * step / 24)
            pts.append((tx + int(tr * math.cos(rad)), ty + int(tr * math.sin(rad))))
        pts.append((tx, ty))
        draw.polygon(pts, fill=(15, 23, 42, 255))

    # Center black core circle and inner yellow hole
    draw.ellipse([tx - 18, ty - 18, tx + 18, ty + 18], fill=(15, 23, 42, 255))
    draw.ellipse([tx - 7, ty - 7, tx + 7, ty + 7], fill=(234, 179, 8, 255))

    # Laser-etched Faceplate Typography
    draw.text((cx, cy + 32), 'MICRO NUCLEAR BATTERY', fill=(248, 250, 252, 255), font=f_title, anchor='mm')
    draw.text((cx, cy + 54), 'SOLID-STATE CONCEPTUAL POWER CELL', fill=(234, 179, 8, 255), font=f_sub, anchor='mm')
    draw.text((cx, cy + 73), 'HERMETIC METALLIC SHIELDING • LOW TRICKLE DC', fill=(148, 163, 184, 255), font=f_sm, anchor='mm')
    draw.text((cx, cy + 88), '[ PROPOSED ARCHITECTURAL COMPONENT ]', fill=(245, 158, 11, 255), font=f_sm, anchor='mm')

    # Top electrical feedthrough terminals
    pos_x = cx - 150
    neg_x = cx + 150
    term_y = cy - bh//2 - 25

    # Positive Terminal (Red ceramic collar + Gold post)
    draw.ellipse([pos_x - 24, term_y + 12, pos_x + 24, term_y + 36], fill=(185, 28, 28, 255), outline=(239, 68, 68, 255), width=2)
    for ty in range(term_y, term_y + 22, 3):
        draw.line([pos_x - 14, ty, pos_x + 14, ty], fill=(234, 179, 8, 255), width=2)
        draw.line([pos_x - 14, ty + 1, pos_x + 14, ty + 1], fill=(161, 98, 7, 255), width=1)
    draw.ellipse([pos_x - 14, term_y - 6, pos_x + 14, term_y + 8], fill=(253, 224, 71, 255), outline=(202, 138, 4, 255), width=2)
    draw.text((pos_x, term_y + 47), '+', fill=(239, 68, 68, 255), font=f_term, anchor='mm')

    # Negative Terminal (Black ceramic collar + Nickel post)
    draw.ellipse([neg_x - 24, term_y + 12, neg_x + 24, term_y + 36], fill=(30, 41, 59, 255), outline=(71, 85, 105, 255), width=2)
    for ty in range(term_y, term_y + 22, 3):
        draw.line([neg_x - 14, ty, neg_x + 14, ty], fill=(203, 213, 225, 255), width=2)
        draw.line([neg_x - 14, ty + 1, neg_x + 14, ty + 1], fill=(100, 116, 139, 255), width=1)
    draw.ellipse([neg_x - 14, term_y - 6, neg_x + 14, term_y + 8], fill=(241, 245, 249, 255), outline=(148, 163, 184, 255), width=2)
    draw.text((neg_x, term_y + 47), '—', fill=(148, 163, 184, 255), font=f_term, anchor='mm')

    # Save to both paths
    for base in ['public/assets/hardware/pwr_micro_nuclear_battery', 'public/assets/hardware/pwr_primary_battery']:
        img.save(f'{base}.png', 'PNG')
        img.save(f'{base}.webp', 'WEBP', quality=95)
    print('[OK] Generated Micro Nuclear Battery assets.')


def generate_lipo_backup_battery():
    W, H = 800, 500
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    _, _, _, _, f_title, f_sub, f_sm = get_fonts()

    cx, cy = 370, 310
    pw, ph = 460, 250  # Main pouch stack body

    # 1. Soft drop shadow under pouch stack
    for r in range(22, 0, -1):
        alpha = int(45 * (1 - r / 22))
        draw.rounded_rectangle([cx - pw//2 - r, cy - ph//2 - r + 16, cx + pw//2 + r + 15, cy + ph//2 + r + 24],
                               radius=16 + r, fill=(0, 0, 0, alpha))

    # 2. Characteristic crimped aluminum foil pouch edge flanges (sides and bottom)
    flange_ext = 22
    for fx in range(cx - pw//2 - flange_ext, cx + pw//2 + flange_ext + 1):
        # Top and bottom flange
        t = (fx - (cx - pw//2)) / pw
        c = int(185 + 45 * math.sin(t * 12))
        c = max(130, min(230, c))

    # Draw foil layers (3-4 multi-cell stacked pouch appearance)
    for layer in range(4):
        offset_y = layer * 5
        offset_x = (3 - layer) * 2
        # Base silver-grey aluminum pouch with vacuum-sealed sheen
        for y in range(cy - ph//2 + offset_y, cy + ph//2 + offset_y):
            t = (y - (cy - ph//2)) / ph
            # Realistic metallic foil lighting with brushed specular streaks
            if t < 0.15:
                v = int(170 + t * 450)
            elif t < 0.45:
                v = int(225 - (t - 0.15) * 160)
            elif t < 0.75:
                v = int(180 + (t - 0.45) * 200)
            else:
                v = int(230 - (t - 0.75) * 350)
            v = max(120, min(242, v))
            # Subtle cold aluminum-silver hue
            draw.line([cx - pw//2 - offset_x, y, cx + pw//2 - offset_x, y], fill=(v - 4, v - 2, v + 8, 255), width=1)

    # Mask pouch body to slightly rounded rectangle with vacuum seal seams
    mask = Image.new('L', (W, H), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle([cx - pw//2 - 10, cy - ph//2, cx + pw//2 + 10, cy + ph//2 + 15], radius=14, fill=255)
    img.putalpha(Image.composite(mask, img.getchannel('A'), mask))
    draw = ImageDraw.Draw(img)

    # Heat-seal crimp texture around the perimeter flange
    # Bottom crimp line
    for crimp_x in range(cx - pw//2, cx + pw//2 + 5, 4):
        draw.line([crimp_x, cy + ph//2 + 5, crimp_x, cy + ph//2 + 14], fill=(130, 140, 155, 220), width=2)
        draw.line([crimp_x + 1, cy + ph//2 + 5, crimp_x + 1, cy + ph//2 + 14], fill=(240, 245, 255, 200), width=1)

    # Left and right side crimps
    for crimp_y in range(cy - ph//2 + 15, cy + ph//2, 4):
        draw.line([cx - pw//2 - 8, crimp_y, cx - pw//2 + 2, crimp_y], fill=(130, 140, 155, 200), width=2)
        draw.line([cx + pw//2 - 2, crimp_y, cx + pw//2 + 8, crimp_y], fill=(130, 140, 155, 200), width=2)

    # Outer foil border highlight
    draw.rounded_rectangle([cx - pw//2 - 10, cy - ph//2, cx + pw//2 + 10, cy + ph//2 + 15], radius=14, outline=(245, 250, 255, 200), width=2)
    draw.rounded_rectangle([cx - pw//2, cy - ph//2 + 8, cx + pw//2, cy + ph//2 + 6], radius=10, outline=(90, 105, 125, 150), width=2)

    # 3. Translucent Amber / Gold Kapton Tape Banding across center of pouch stack
    kap_y1 = cy - 40
    kap_y2 = cy + 50
    kap_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    k_draw = ImageDraw.Draw(kap_overlay)
    k_draw.rectangle([cx - pw//2 - 2, kap_y1, cx + pw//2 + 2, kap_y2], fill=(217, 119, 6, 175))
    # Kapton glossy specular reflection highlight
    for y in range(kap_y1, kap_y2):
        t = (y - kap_y1) / (kap_y2 - kap_y1)
        if 0.2 < t < 0.45:
            k_draw.line([cx - pw//2 - 2, y, cx + pw//2 + 2, y], fill=(254, 240, 138, 70), width=1)
    k_draw.line([cx - pw//2 - 2, kap_y1, cx + pw//2 + 2, kap_y1], fill=(251, 191, 36, 220), width=2)
    k_draw.line([cx - pw//2 - 2, kap_y2, cx + pw//2 + 2, kap_y2], fill=(180, 83, 9, 220), width=2)
    img = Image.alpha_composite(img, kap_overlay)
    draw = ImageDraw.Draw(img)

    # 4. Technical Product Label Plate on Pouch Face
    lw, lh = 330, 160
    lx = cx
    ly = cy
    draw.rounded_rectangle([lx - lw//2, ly - lh//2, lx + lw//2, ly + lh//2], radius=10,
                           fill=(15, 23, 42, 240), outline=(148, 163, 184, 220), width=2)
    draw.rounded_rectangle([lx - lw//2 + 3, ly - lh//2 + 3, lx + lw//2 - 3, ly + lh//2 - 3], radius=8,
                           outline=(51, 65, 85, 255), width=1)

    # LiPo Technical Typography
    draw.text((lx, ly - 50), 'LITHIUM POLYMER (LiPo) BATTERY', fill=(248, 250, 252, 255), font=f_title, anchor='mm')
    draw.text((lx, ly - 28), 'HIGH-RATE TRANSIENT PULSE BUFFER PACK', fill=(56, 189, 248, 255), font=f_sub, anchor='mm')
    draw.line([lx - 140, ly - 15, lx + 140, ly - 15], fill=(71, 85, 105, 200), width=1)

    draw.text((lx - 130, ly + 4), '• Architecture:', fill=(148, 163, 184, 255), font=f_sm, anchor='lm')
    draw.text((lx + 130, ly + 4), 'Multi-Cell Laminated Pouch', fill=(241, 245, 249, 255), font=f_sm, anchor='rm')

    draw.text((lx - 130, ly + 24), '• Cell Enclosure:', fill=(148, 163, 184, 255), font=f_sm, anchor='lm')
    draw.text((lx + 130, ly + 24), 'Aluminum Polymer Foil Flange', fill=(241, 245, 249, 255), font=f_sm, anchor='rm')

    draw.text((lx - 130, ly + 44), '• Application:', fill=(148, 163, 184, 255), font=f_sm, anchor='lm')
    draw.text((lx + 130, ly + 44), 'Subsea Transmit Buffer (To BMS)', fill=(251, 191, 36, 255), font=f_sm, anchor='rm')

    draw.text((lx, ly + 66), 'CAUTION: RECHARGEABLE LITHIUM POLYMER POUCH CELL', fill=(239, 68, 68, 255), font=f_sm, anchor='mm')

    # 5. Top Terminal Neck & Heavy-Duty Flexible Silicone Wire Leads
    # Pouch top terminal seals (nickel/copper foil tabs sealed in polymer)
    lead_start_x = cx + 80
    lead_start_y = cy - ph//2

    # Black heat-shrink strain relief collar over lead exit
    draw.rounded_rectangle([lead_start_x - 35, lead_start_y - 18, lead_start_x + 35, lead_start_y + 4],
                           radius=5, fill=(24, 24, 27, 255), outline=(63, 63, 70, 255), width=2)

    # 14AWG Red Positive Silicone Wire curving to upper right
    red_pts = [(lead_start_x - 14, lead_start_y - 12),
               (lead_start_x - 10, lead_start_y - 60),
               (lead_start_x + 40, lead_start_y - 110),
               (lead_start_x + 130, lead_start_y - 125)]
    for i in range(len(red_pts)-1):
        draw.line([red_pts[i], red_pts[i+1]], fill=(220, 38, 38, 255), width=9)
        draw.line([red_pts[i][0], red_pts[i][1] - 1, red_pts[i+1][0], red_pts[i+1][1] - 1], fill=(248, 113, 113, 200), width=3)

    # 14AWG Black Negative Silicone Wire curving alongside
    black_pts = [(lead_start_x + 14, lead_start_y - 12),
                 (lead_start_x + 18, lead_start_y - 55),
                 (lead_start_x + 65, lead_start_y - 95),
                 (lead_start_x + 130, lead_start_y - 105)]
    for i in range(len(black_pts)-1):
        draw.line([black_pts[i], black_pts[i+1]], fill=(24, 24, 27, 255), width=9)
        draw.line([black_pts[i][0], black_pts[i][1] - 1, black_pts[i+1][0], black_pts[i+1][1] - 1], fill=(82, 82, 91, 200), width=3)

    # Multi-Wire JST-XH Cell Balance Lead (thinner wires: red, white, blue, black)
    jst_start_x = lead_start_x - 5
    draw.line([(jst_start_x - 6, lead_start_y - 12), (jst_start_x + 15, lead_start_y - 70), (jst_start_x + 70, lead_start_y - 85)], fill=(239, 68, 68, 220), width=3)
    draw.line([(jst_start_x - 2, lead_start_y - 12), (jst_start_x + 20, lead_start_y - 70), (jst_start_x + 73, lead_start_y - 85)], fill=(244, 244, 245, 220), width=3)
    draw.line([(jst_start_x + 2, lead_start_y - 12), (jst_start_x + 25, lead_start_y - 70), (jst_start_x + 76, lead_start_y - 85)], fill=(59, 130, 246, 220), width=3)
    draw.line([(jst_start_x + 6, lead_start_y - 12), (jst_start_x + 30, lead_start_y - 70), (jst_start_x + 79, lead_start_y - 85)], fill=(24, 24, 27, 220), width=3)

    # White JST-XH balance plug
    bx, by = jst_start_x + 85, lead_start_y - 85
    draw.rounded_rectangle([bx - 8, by - 12, bx + 16, by + 12], radius=3, fill=(244, 244, 245, 255), outline=(161, 161, 170, 255), width=2)
    for p in range(4):
        draw.ellipse([bx - 4 + p * 5, by - 4, bx - 1 + p * 5, by + 4], fill=(217, 119, 6, 255))

    # Yellow XT60 High-Current Polarized Marine Main Connector at end of wires
    con_x, con_y = lead_start_x + 145, lead_start_y - 115
    draw.rounded_rectangle([con_x, con_y - 24, con_x + 48, con_y + 24], radius=6,
                           fill=(234, 179, 8, 255), outline=(180, 83, 9, 255), width=2)
    # Connector terminal chamfer and polarized keyed notch
    draw.polygon([(con_x + 38, con_y - 24), (con_x + 48, con_y - 14), (con_x + 48, con_y - 24)], fill=(15, 23, 42, 255))
    # Gold-plated bullet contacts inside connector
    draw.ellipse([con_x + 10, con_y - 15, con_x + 24, con_y - 3], fill=(245, 158, 11, 255), outline=(180, 83, 9, 255), width=1)
    draw.ellipse([con_x + 10, con_y + 3, con_x + 24, con_y + 15], fill=(245, 158, 11, 255), outline=(180, 83, 9, 255), width=1)
    draw.text((con_x + 34, con_y - 9), '+', fill=(185, 28, 28, 255), font=f_sub, anchor='mm')
    draw.text((con_x + 34, con_y + 9), '—', fill=(24, 24, 27, 255), font=f_sub, anchor='mm')

    # Save to both paths
    for base in ['public/assets/hardware/pwr_lipo_backup_battery', 'public/assets/hardware/pwr_backup_battery']:
        img.save(f'{base}.png', 'PNG')
        img.save(f'{base}.webp', 'WEBP', quality=95)
    print('[OK] Generated Lithium Polymer (LiPo) Backup Battery assets.')

if __name__ == '__main__':
    generate_micro_nuclear_battery()
    generate_lipo_backup_battery()
    print('[ALL COMPLETE] Both battery assets generated successfully!')
