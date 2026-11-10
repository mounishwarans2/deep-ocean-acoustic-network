#!/usr/bin/env python3

# Mode A Wires (ESP32 Wokwi)
# Dedicated orthogonal corridors:
# Top power corridor: y = 30
# Top ground corridor: y = 45
# Top I2C corridors: y = 215 (SDA), y = 230 (SCL)
# Potentiometers ADC: y = 250, 265
# LEDs GPIO: y = 410, 430, 450

mode_a_waypoints = {
    # 1. 3.3V Power to OLED
    'w-pwr-oled': [[78, 148], [50, 148], [50, 30], [390, 30], [390, 80]],
    # 2. 3.3V Daisy chain from OLED to BMP280
    'w-pwr-bmp': [[390, 80], [390, 30], [610, 30], [610, 80]],
    # 3. 3.3V Power to Battery Potentiometer
    'w-pwr-pot-bat': [[78, 148], [50, 148], [50, 260], [345, 260], [345, 340]],
    # 4. 3.3V Power from Battery Pot to Signal Pot
    'w-pwr-pot-sig': [[345, 340], [345, 260], [475, 260], [475, 340]],
    # 5. GND to OLED
    'w-gnd-oled': [[78, 456], [35, 456], [35, 45], [365, 45], [365, 80]],
    # 6. GND Daisy chain OLED to BMP280
    'w-gnd-bmp': [[365, 80], [365, 45], [635, 45], [635, 80]],
    # 7. I2C SDA ESP32 (D21) to OLED
    'w-i2c-sda-oled': [[232, 368], [280, 368], [280, 215], [440, 215], [440, 80]],
    # 8. I2C SCL ESP32 (D22) to OLED
    'w-i2c-scl-oled': [[232, 346], [270, 346], [270, 230], [415, 230], [415, 80]],
    # 9. I2C SDA Daisy chain OLED to BMP280
    'w-i2c-sda-bmp': [[440, 80], [440, 215], [685, 215], [685, 80]],
    # 10. I2C SCL Daisy chain OLED to BMP280
    'w-i2c-scl-bmp': [[415, 80], [415, 230], [660, 230], [660, 80]],
    # 11. Battery Pot Output to ESP32 (D34)
    'w-adc-battery': [[375, 340], [375, 245], [60, 245], [60, 236], [78, 236]],
    # 12. Signal RSSI Pot Output to ESP32 (D35)
    'w-adc-rssi': [[505, 340], [505, 255], [65, 255], [65, 258], [78, 258]],
    # 13. GPIO D2 to Green TX LED
    'w-gpio-led-tx': [[232, 390], [290, 390], [290, 420], [350, 420], [350, 480]],
    # 14. GPIO D4 to Yellow Sync LED
    'w-gpio-led-sync': [[232, 412], [280, 412], [280, 435], [490, 435], [490, 480]],
    # 15. GPIO D15 to Red Fault Alert LED
    'w-gpio-led-alert': [[232, 434], [270, 434], [270, 450], [620, 450], [620, 480]],
    # 16. UART TX0 to Modem RX
    'w-uart-tx': [[232, 280], [300, 280], [300, 305], [625, 305], [625, 340]],
    # 17. UART RX0 from Modem TX
    'w-uart-rx': [[655, 340], [655, 320], [310, 320], [310, 302], [232, 302]],
}

print(f"Total Mode A wires checked: {len(mode_a_waypoints)}")
errors = 0
for wid, pts in mode_a_waypoints.items():
    for i in range(len(pts) - 1):
        dx = pts[i+1][0] - pts[i][0]
        dy = pts[i+1][1] - pts[i][1]
        if dx != 0 and dy != 0:
            print(f"ERROR: {wid} segment {i} ({pts[i]} -> {pts[i+1]}) is diagonal (dx={dx}, dy={dy})!")
            errors += 1

if errors == 0:
    print("SUCCESS: 100% of all wire segments across Mode A are strictly orthogonal!")
