# MARISLINK: Virtual IoT Hardware Simulation (ESP32)

This directory contains the complete virtual electronic hardware, circuit design, sensor models, and embedded C++ firmware for the **MARISLINK Deep-Ocean Acoustic Monitoring Node (`ESP32-UW01`)**.

---

## 1. Hardware Overview & Circuit Components

| Component | Part / Library | Pin Connections | Purpose |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32 DevKit v1 | 3V3, GND, GPIO 2, 4, 15, 21, 22, 34, 35 | Central processing, sensor acquisition, acoustic protocol simulation & WiFi/HTTP telemetry |
| **Environmental Sensor** | BMP280 Digital Sensor | SDA → GPIO 21<br>SCL → GPIO 22<br>VCC → 3V3, GND → GND | Temperature (°C) and Ambient Atmospheric Transducer Pressure (hPa) via I2C (`0x76`) |
| **Local Dashboard** | SSD1306 128x64 OLED | SDA → GPIO 21<br>SCL → GPIO 22<br>VCC → 3V3, GND → GND | Real-time on-node visual display of packet sequence, depth, pressure, temperature, battery, and RSSI (`0x3C`) |
| **Battery Level Sensor** | Potentiometer 10kΩ | SIG → GPIO 34 (ADC)<br>VCC → 3V3, GND → GND | Simulates LiPo battery voltage divider (3.0V to 4.2V scale) and real-time power discharge |
| **Acoustic Signal Sensor**| Potentiometer 10kΩ | SIG → GPIO 35 (ADC)<br>VCC → 3V3, GND → GND | Simulates acoustic transceiver RSSI attenuation (-95 dBm to -55 dBm) and multipath Doppler jitter |
| **TX Burst Indicator** | Green LED (with 220Ω) | Anode → GPIO 2<br>Cathode → GND | Flashes on each acoustic ping and telemetry burst transmission |
| **Sync Lock Indicator** | Yellow LED (with 220Ω)| Anode → GPIO 4<br>Cathode → GND | Steady illuminated when acoustic carrier synchronization is locked |
| **Critical Alert Indicator**| Red LED (with 220Ω) | Anode → GPIO 15<br>Cathode → GND | Flashes or illuminates when battery < 20%, packet loss > 10%, or system failure occurs |

---

## 2. Atmospheric MEMS vs. Deep-Ocean Hydrostatic Pressure Calibration

### Physical Reality & Scientific Honesty
- A standard physical **BMP280 MEMS sensor** is calibrated for atmospheric pressures between **300 hPa and 1100 hPa** (0.03 to 0.11 MPa).
- In the deep sea at **2000 meters depth**, seawater density ($\rho \approx 1025\text{ kg/m}^3$) and gravity ($g \approx 9.80665\text{ m/s}^2$) generate a hydrostatic pressure:
  $$P_{\text{hydrostatic}} = \frac{\rho \cdot g \cdot h}{10^6} \approx \frac{1025 \cdot 9.81 \cdot 2000}{10^6} \approx 20.1\text{ MPa}\quad (\approx 200\text{ atmospheres})$$
- An unencapsulated atmospheric MEMS sensor would immediately implode under 20 MPa.
- **MARISLINK Calibration Model:**  
  The firmware reads the true physical transducer pressure ($P_{\text{raw}}$ in hPa from the BMP280 in the test chamber) and applies an oceanographic transfer function to simulate the acoustic depth ($h$ in meters) and deep-sea hydrostatic pressure ($P_{\text{ocean}}$ in MPa). Both the raw atmospheric sensor reading and the modeled oceanographic hydrostatic values are transmitted in every packet for complete academic transparency.

---

## 3. Simulator Integration & Browser Limitations

### Why Localhost Communication Requires a Bridge
When running the Wokwi simulator inside a web browser (e.g. `https://wokwi.com`):
1. The ESP32 firmware executes inside the browser's WebAssembly sandbox.
2. Modern web browsers strictly enforce **Private Network Access (PNA)** and **CORS security policies**, preventing public HTTPS web pages (like Wokwi) from making unauthenticated HTTP requests to `http://localhost:5000`.
3. To enable live streaming between the virtual hardware and the MARISLINK backend, two sanctioned integration methods exist:
   - **Method A (Sanctioned Local Bridge Engine - Recommended):**  
     Run `node hardware-simulation/run-virtual-node.js`. It executes the identical sensor physics, calibration equations, and state machine directly on the host machine, streaming live virtual hardware telemetry to `http://localhost:5000/api/hardware/telemetry`.
   - **Method B (Wokwi IoT Gateway):**  
     Run the official [Wokwi IoT Gateway](https://docs.wokwi.com/guides/esp32-wifi#the-private-gateway) to tunnel simulated network packets from Wokwi-GUEST into your local subnet.

---

## 4. Running the Simulation

### Option 1: Running the Local Virtual Hardware Node (Direct Live Bridge)
To start continuous real-time telemetry streaming from the virtual hardware node into MARISLINK:
```bash
# In the project root:
npm run hardware:node
# or directly:
node hardware-simulation/run-virtual-node.js
```
The node will immediately begin transmitting packets every 2 seconds. The website's **"LIVE HARDWARE MONITORING"** page and the Express backend will display live, updating sensor values!

### Option 2: Running in Wokwi Web / VS Code / Arduino CLI
1. **Compilation via Arduino CLI:**
   ```bash
   arduino-cli compile -b esp32:esp32:esp32 hardware-simulation/marislink_esp32_node --output-dir hardware-simulation/build
   ```
2. **Circuit Diagram Lint & Pin Verification:**
   ```bash
   wokwi-cli lint hardware-simulation/diagram.json
   ```
3. **Wokwi Browser Execution:**
   - Open [https://wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32).
   - Paste `hardware-simulation/marislink_esp32_node.ino` into the Code tab.
   - Paste `hardware-simulation/diagram.json` into the `diagram.json` tab.
   - Add libraries from `hardware-simulation/libraries.txt` (`Adafruit BMP085 Library`, `Adafruit BMP280 Library`, `Adafruit SSD1306`, `Adafruit GFX Library`, `ArduinoJson`).
   - Click **Start Simulation (Play)**.
   - Observe the 128x64 OLED display update in real time, LEDs blink (TX burst on GPIO 2, Sync on GPIO 4), and Serial Monitor stream structured telemetry.

---

## 5. Telemetry Data Source Distinction in MARISLINK

The MARISLINK backend and Live Hardware Monitoring dashboard explicitly track and distinguish two data sources:
- **ACTUAL WOKWI FIRMWARE TELEMETRY:** Emitted by the embedded C/C++ firmware executing in Wokwi simulation (`source: "wokwi-esp32-firmware"`, `is_actual_wokwi: true`, `firmware_type: "EMBEDDED_C_CPP"`).
- **NODE.JS VIRTUAL HARDWARE FALLBACK:** Emitted by the local virtual hardware node engine (`source: "nodejs-virtual-hardware-fallback"`, `is_actual_wokwi: false`, `firmware_type: "NODEJS_ENGINE_FALLBACK"`).

Both sources route to `POST /api/hardware/telemetry`, are validated, deduplicated, displayed on the live dashboard with distinctive badges (Cyan for Wokwi, Purple for Fallback), and stored for Apache Spark & Scala batch processing.
