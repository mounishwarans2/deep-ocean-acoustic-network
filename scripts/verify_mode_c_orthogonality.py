#!/usr/bin/env python3

mode_c_waypoints = {
    # 1. 5V from Arduino to Breadboard Bottom (+) rail
    'wa-pwr-5v': [[177, 285], [177, 430], [390, 430], [390, 382]],
    # 2. GND from Arduino to Breadboard Bottom (-) rail
    'wa-pwr-gnd': [[186, 285], [186, 445], [405, 445], [405, 402]],
    # 3. Breadboard (+) rail to TMP36 VCC
    'wa-tmp-vcc': [[390, 382], [390, 310], [498, 310], [498, 245]],
    # 4. Breadboard (-) rail to TMP36 GND
    'wa-tmp-gnd': [[405, 402], [405, 325], [532, 325], [532, 245]],
    # 5. TMP36 Vout to Arduino Analog A1
    'wa-tmp-analog': [[515, 245], [515, 340], [228, 340], [228, 285]],
    # 6. Breadboard (+) to LCD VCC
    'wa-lcd-pwr': [[390, 382], [390, 460], [790, 460], [790, 145]],
    # 7. Breadboard (-) to LCD GND
    'wa-lcd-gnd': [[405, 402], [405, 475], [760, 475], [760, 145]],
    # 8. Arduino A4 (SDA) to LCD SDA
    'wa-lcd-sda': [[256, 285], [256, 355], [820, 355], [820, 145]],
    # 9. Arduino A5 (SCL) to LCD SCL
    'wa-lcd-scl': [[265, 285], [265, 370], [850, 370], [850, 145]],
    # 10. Arduino D2 to Green LED on Breadboard
    'wa-led-tx': [[228, 159], [228, 70], [545, 70], [545, 230]],
    # 11. Arduino D4 to Yellow LED on Breadboard
    'wa-led-sync': [[214, 159], [214, 55], [585, 55], [585, 230]],
    # 12. Arduino D7 to Red LED on Breadboard
    'wa-led-alert': [[196, 159], [196, 40], [625, 40], [625, 230]],
}

print(f"Total Mode C wires checked: {len(mode_c_waypoints)}")
errors = 0
for wid, pts in mode_c_waypoints.items():
    for i in range(len(pts) - 1):
        dx = pts[i+1][0] - pts[i][0]
        dy = pts[i+1][1] - pts[i][1]
        if dx != 0 and dy != 0:
            print(f"ERROR: {wid} segment {i} ({pts[i]} -> {pts[i+1]}) is diagonal (dx={dx}, dy={dy})!")
            errors += 1

if errors == 0:
    print("SUCCESS: 100% of all wire segments across Mode C are strictly orthogonal!")
