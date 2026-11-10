import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import './CircuitConnectionsPage.css';

// ── TYPES & INTERFACES ────────────────────────────────────────────────────────

export interface PinDefinition {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC' | 'DAC' | 'GPIO' | 'PWM' | 'ANALOG' | 'PCIE';
  voltage?: string;
  description?: string;
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
  operatingVoltage: string;
  communicationProtocol: string;
  roleInMarislink: string;
  imageSrc?: string;
  pins: PinDefinition[];
  connectedTo: string[];
}

export interface CircuitWire {
  id: string;
  sourceComponentId: string;
  sourcePinId: string;
  destComponentId: string;
  destPinId: string;
  busType: 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC' | 'GPIO' | 'ACOUSTIC';
  color: string;
  voltage: string;
  signalDescription: string;
  points?: { x: number; y: number }[];
}

export type BusFilter = 'ALL' | 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC' | 'GPIO' | 'ACOUSTIC';

// ── UNIFIED MARISLINK HARDWARE PROTOTYPE COMPONENTS ────────────────────────────

const UNIFIED_PROTOTYPE_COMPONENTS: CircuitComponent[] = [
  // ── 1. POWER SUBSYSTEM (Far Left) ──────────────────────────────────────────
  {
    id: 'pwr_lipo_battery',
    name: 'Lithium Polymer (LiPo) Battery Pack',
    category: 'POWER',
    modelNumber: '3.7V 2500mAh Aluminum Pouch Cell',
    status: 'IMPLEMENTED',
    imageSrc: '/assets/hardware/pwr_lipo_backup_battery.webp',
    x: 60,
    y: 70,
    width: 220,
    height: 160,
    description: 'High-energy-density rechargeable LiPo cell stack supplying primary dc bus voltage with low internal series resistance for high-burst acoustic modulation.',
    operatingVoltage: '3.7V Nominal (3.0V cut-off - 4.2V float)',
    communicationProtocol: 'Analog 2-wire DC power bus',
    roleInMarislink: 'Main system energy storage, providing continuous power to the ESP32 and buffering peak transmission current for the acoustic modem driver.',
    connectedTo: ['pwr_mgmt_bms'],
    pins: [
      { id: 'bat_pos', name: 'BAT+', x: 240, y: 120, type: 'POWER', voltage: '+3.7V', description: 'LiPo cell positive output' },
      { id: 'bat_neg', name: 'BAT-', x: 240, y: 160, type: 'GROUND', voltage: '0V', description: 'LiPo cell negative ground' },
    ],
  },
  {
    id: 'pwr_mgmt_bms',
    name: 'Power Management & Charging Module',
    category: 'POWER',
    modelNumber: 'TP4056 BMS + 3.3V Synchronous Buck',
    status: 'IMPLEMENTED',
    imageSrc: '/assets/hardware/pwr_bms.webp',
    x: 60,
    y: 280,
    width: 220,
    height: 160,
    description: 'Integrated battery management system providing CC/CV charging, over-discharge cutoff (2.5V), short-circuit protection, and synchronous step-down 3.3V dc rails.',
    operatingVoltage: '3.7V IN -> 3.3V / 5.0V Regulated OUT',
    communicationProtocol: 'Hardware PMIC power rail switching',
    roleInMarislink: 'Regulates battery voltage to provide a clean, ripple-free 3.3V system rail for the ESP32, sensors, and OLED display.',
    connectedTo: ['pwr_lipo_battery', 'esp32', 'pot_battery', 'storage_microsd'],
    pins: [
      { id: 'bat_in_pos', name: 'BAT_IN+', x: 90, y: 310, type: 'POWER', voltage: '+3.7V', description: 'Battery positive charging input' },
      { id: 'bat_in_neg', name: 'BAT_IN-', x: 90, y: 350, type: 'GROUND', voltage: '0V', description: 'Battery ground input' },
      { id: 'vout_3v3', name: 'VOUT_3V3', x: 240, y: 320, type: 'POWER', voltage: '+3.3V', description: 'Regulated 3.3V clean power rail' },
      { id: 'gnd_out', name: 'GND', x: 240, y: 360, type: 'GROUND', voltage: '0V', description: 'Common system ground' },
    ],
  },
  {
    id: 'storage_microsd',
    name: 'Industrial SLC MicroSD Card Module',
    category: 'STORAGE',
    modelNumber: 'SPI Black-Box Telemetry Logger',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/storage_microsd.webp',
    x: 60,
    y: 490,
    width: 220,
    height: 160,
    description: 'High-endurance SPI MicroSD module recording date-stamped CSV telemetry and acoustic packet payloads locally during deep-sea node blackouts.',
    operatingVoltage: '3.3V DC',
    communicationProtocol: 'Hardware SPI (MOSI: D23, MISO: D19, SCK: D18, CS: D5)',
    roleInMarislink: 'Black-box flight recorder persisting sensor time-series data locally before multi-hop acoustic transmission.',
    connectedTo: ['pwr_mgmt_bms', 'esp32'],
    pins: [
      { id: 'vcc', name: 'VCC', x: 240, y: 520, type: 'POWER', voltage: '3.3V', description: 'Power supply input' },
      { id: 'gnd', name: 'GND', x: 240, y: 540, type: 'GROUND', voltage: '0V', description: 'Common ground' },
      { id: 'mosi', name: 'MOSI', x: 240, y: 560, type: 'SPI', description: 'SPI Master Out Slave In (ESP32 D23)' },
      { id: 'miso', name: 'MISO', x: 240, y: 580, type: 'SPI', description: 'SPI Master In Slave Out (ESP32 D19)' },
      { id: 'sck', name: 'SCK', x: 240, y: 600, type: 'SPI', description: 'SPI Clock (ESP32 D18)' },
      { id: 'cs', name: 'CS', x: 240, y: 620, type: 'SPI', description: 'SPI Chip Select (ESP32 D5)' },
    ],
  },

  // ── 2. SENSOR INPUTS & MONITORS (Center-Left) ──────────────────────────────
  {
    id: 'pot_battery',
    name: 'Battery Voltage Divider Potentiometer',
    category: 'SENSOR',
    modelNumber: '10kΩ Precision Rotary Potentiometer',
    status: 'IMPLEMENTED',
    imageSrc: '/assets/hardware/pot_battery.webp',
    x: 350,
    y: 70,
    width: 180,
    height: 150,
    description: 'Rotary precision voltage divider connected to ESP32 ADC1 (GPIO 34) simulating dynamic LiPo discharge curves from 4.2V (100%) to 3.0V (0%).',
    operatingVoltage: '0 - 3.3V Analog Out',
    communicationProtocol: 'Analog Voltage (0-3.3V -> 12-bit ADC)',
    roleInMarislink: 'Simulates real-time battery voltage monitoring in the Wokwi embedded firmware.',
    connectedTo: ['pwr_mgmt_bms', 'esp32'],
    pins: [
      { id: 'vcc', name: '1 (VCC)', x: 370, y: 195, type: 'POWER', voltage: '3.3V', description: 'High-side voltage reference' },
      { id: 'sig', name: '2 (SIG)', x: 440, y: 195, type: 'ADC', voltage: '0-3.3V', description: 'Wiper output to ESP32 GPIO 34 (ADC1_CH6)' },
      { id: 'gnd', name: '3 (GND)', x: 510, y: 195, type: 'GROUND', voltage: '0V', description: 'Ground reference' },
    ],
  },
  {
    id: 'pot_signal',
    name: 'Acoustic RSSI Signal Attenuator',
    category: 'SENSOR',
    modelNumber: '10kΩ Rotary Signal Monitor',
    status: 'IMPLEMENTED',
    imageSrc: '/assets/hardware/pot_signal.webp',
    x: 350,
    y: 245,
    width: 180,
    height: 150,
    description: 'Precision rotary attenuator connected to ESP32 ADC1 (GPIO 35) simulating variable underwater acoustic channel attenuation (-95 dBm to -55 dBm).',
    operatingVoltage: '0 - 3.3V Analog Out',
    communicationProtocol: 'Analog Voltage (0-3.3V -> 12-bit ADC)',
    roleInMarislink: 'Simulates ocean acoustic channel fading and link quality in the Wokwi embedded firmware.',
    connectedTo: ['esp32'],
    pins: [
      { id: 'vcc', name: '1 (VCC)', x: 370, y: 370, type: 'POWER', voltage: '3.3V', description: 'Reference voltage' },
      { id: 'sig', name: '2 (SIG)', x: 440, y: 370, type: 'ADC', voltage: '0-3.3V', description: 'Wiper output to ESP32 GPIO 35 (ADC1_CH7)' },
      { id: 'gnd', name: '3 (GND)', x: 510, y: 370, type: 'GROUND', voltage: '0V', description: 'Ground' },
    ],
  },
  {
    id: 'bmp280',
    name: 'BMP280 Environmental Sensor Breakout',
    category: 'SENSOR',
    modelNumber: 'Bosch BMP280 (Temperature & Depth)',
    status: 'IMPLEMENTED',
    imageSrc: '/assets/hardware/bmp280.webp',
    x: 350,
    y: 420,
    width: 180,
    height: 150,
    description: 'MEMS digital barometric pressure and temperature sensor sampled at 1 Hz via hardware I2C address 0x76. Oceanographic calibration maps readings to hydrostatic depth.',
    operatingVoltage: '3.3V DC',
    communicationProtocol: 'Hardware I2C (Address 0x76, 400 kHz)',
    roleInMarislink: 'Captures ocean temperature and simulated depth profiles, feeding the deterministic telemetry loop.',
    connectedTo: ['esp32'],
    pins: [
      { id: 'vcc', name: 'VCC', x: 370, y: 535, type: 'POWER', voltage: '3.3V', description: '3.3V power input' },
      { id: 'gnd', name: 'GND', x: 415, y: 535, type: 'GROUND', voltage: '0V', description: 'Common ground' },
      { id: 'scl', name: 'SCL', x: 465, y: 535, type: 'I2C', description: 'I2C Clock (ESP32 D22)' },
      { id: 'sda', name: 'SDA', x: 510, y: 535, type: 'I2C', description: 'I2C Data (ESP32 D21)' },
    ],
  },
  {
    id: 'sensor_leak',
    name: 'Hull Water-Leak Ingress Detector',
    category: 'SENSOR',
    modelNumber: 'Conductive Bilge Sensor Grid',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/sensor_leak_hull.webp',
    x: 350,
    y: 590,
    width: 180,
    height: 130,
    description: 'Gold-plated interdigital conductive grid placed at the enclosure bottom to detect saltwater ingress immediately and trip emergency acoustic beacons.',
    operatingVoltage: '3.3V DC',
    communicationProtocol: 'Digital Active-Low Interrupt (ESP32 GPIO 32)',
    roleInMarislink: 'Monitors watertight integrity of the titanium pressure vessel; triggers emergency alerts.',
    connectedTo: ['esp32'],
    pins: [
      { id: 'vcc', name: 'VCC', x: 370, y: 690, type: 'POWER', voltage: '3.3V', description: '3.3V bias supply' },
      { id: 'gnd', name: 'GND', x: 440, y: 690, type: 'GROUND', voltage: '0V', description: 'Ground' },
      { id: 'alert', name: 'ALERT', x: 510, y: 690, type: 'GPIO', description: 'Digital Leak Alert to ESP32 D32' },
    ],
  },

  // ── 3. MAIN CONTROLLER (Center) ────────────────────────────────────────────
  {
    id: 'esp32',
    name: 'ESP32 DevKit v1 Microcontroller',
    category: 'MCU',
    modelNumber: 'ESP32-WROOM-32 (30-Pin)',
    status: 'IMPLEMENTED',
    imageSrc: '/assets/hardware/esp32.webp',
    x: 620,
    y: 150,
    width: 180,
    height: 420,
    description: 'Central node processor featuring dual-core Xtensa 32-bit LX6 at 240 MHz, 520 KB SRAM, and hardware I2C/ADC/SPI/UART controllers. Runs compiled C/C++ firmware.',
    operatingVoltage: '3.3V DC (5V USB/VIN input)',
    communicationProtocol: 'Hardware I2C (0x3C OLED, 0x76 BMP280), ADC1 (GPIO 34/35), UART2 (115200 baud), SPI (SD)',
    roleInMarislink: 'Core edge node controller. Handles sensor acquisition, depth calibration, OLED graphics, SNC packet framing, and acoustic modem serialization.',
    connectedTo: ['pwr_mgmt_bms', 'pot_battery', 'pot_signal', 'bmp280', 'sensor_leak', 'oled', 'led_indicators', 'modem_uart', 'storage_microsd', 'diagnostic_interface'],
    pins: [
      // Left Pins (Inputs, Power, Left Sensors)
      { id: '3v3', name: '3V3', x: 620, y: 185, type: 'POWER', voltage: '3.3V', description: '3.3V Power Rail Output / Regulated Input' },
      { id: 'en', name: 'EN', x: 620, y: 210, type: 'GPIO', description: 'Chip Enable / Active High Reset' },
      { id: 'vp', name: 'VP', x: 620, y: 235, type: 'ADC', description: 'GPIO 36 / ADC1_CH0' },
      { id: 'vn', name: 'VN', x: 620, y: 260, type: 'ADC', description: 'GPIO 39 / ADC1_CH3' },
      { id: 'd34', name: 'D34', x: 620, y: 285, type: 'ADC', voltage: '0-3.3V', description: 'PIN_POT_BATTERY: Battery Voltage Divider Input' },
      { id: 'd35', name: 'D35', x: 620, y: 310, type: 'ADC', voltage: '0-3.3V', description: 'PIN_POT_SIGNAL: Acoustic RSSI Signal Attenuator Input' },
      { id: 'd32', name: 'D32', x: 620, y: 335, type: 'GPIO', description: 'Digital Input: Enclosure Water Leak Alert' },
      { id: 'd33', name: 'D33', x: 620, y: 360, type: 'GPIO', description: 'GPIO 33' },
      { id: 'd25', name: 'D25', x: 620, y: 385, type: 'DAC', description: 'GPIO 25 / DAC1' },
      { id: 'd26', name: 'D26', x: 620, y: 410, type: 'DAC', description: 'GPIO 26 / DAC2' },
      { id: 'd27', name: 'D27', x: 620, y: 435, type: 'GPIO', description: 'GPIO 27' },
      { id: 'd14', name: 'D14', x: 620, y: 460, type: 'GPIO', description: 'GPIO 14' },
      { id: 'd12', name: 'D12', x: 620, y: 485, type: 'GPIO', description: 'GPIO 12' },
      { id: 'd13', name: 'D13', x: 620, y: 510, type: 'GPIO', description: 'GPIO 13' },
      { id: 'gnd_l', name: 'GND', x: 620, y: 535, type: 'GROUND', voltage: '0V', description: 'Common System Ground (Left Rail)' },

      // Right Pins (Outputs, Bus Lines, Transceivers)
      { id: 'vin', name: 'VIN', x: 800, y: 185, type: 'POWER', voltage: '5V', description: '5V External / USB Input Power' },
      { id: 'gnd_r', name: 'GND', x: 800, y: 210, type: 'GROUND', voltage: '0V', description: 'Common System Ground (Right Rail)' },
      { id: 'd15', name: 'D15', x: 800, y: 235, type: 'GPIO', description: 'PIN_LED_ALERT: Critical Fault / Ingress Indicator' },
      { id: 'd2', name: 'D2', x: 800, y: 260, type: 'GPIO', description: 'PIN_LED_TX: Acoustic Burst TX Indicator' },
      { id: 'd4', name: 'D4', x: 800, y: 285, type: 'GPIO', description: 'PIN_LED_SYNC: Acoustic Sync Lock Indicator' },
      { id: 'rx2', name: 'RX2', x: 800, y: 310, type: 'UART', description: 'GPIO 16: Hardware Serial UART2 RX (from Acoustic Modem TX)' },
      { id: 'tx2', name: 'TX2', x: 800, y: 335, type: 'UART', description: 'GPIO 17: Hardware Serial UART2 TX (to Acoustic Modem RX)' },
      { id: 'd5', name: 'D5', x: 800, y: 360, type: 'SPI', description: 'GPIO 5: SPI Chip Select (MicroSD CS)' },
      { id: 'd18', name: 'D18', x: 800, y: 385, type: 'SPI', description: 'GPIO 18: SPI SCK Clock (MicroSD SCK)' },
      { id: 'd19', name: 'D19', x: 800, y: 410, type: 'SPI', description: 'GPIO 19: SPI MISO Data (MicroSD MISO)' },
      { id: 'd21', name: 'D21', x: 800, y: 435, type: 'I2C', description: 'PIN_SDA: Hardware I2C Serial Data (OLED & BMP280)' },
      { id: 'rx0', name: 'RX0', x: 800, y: 460, type: 'UART', description: 'GPIO 3: Hardware Serial UART0 RX (USB Diagnostic)' },
      { id: 'tx0', name: 'TX0', x: 800, y: 485, type: 'UART', description: 'GPIO 1: Hardware Serial UART0 TX (USB Diagnostic)' },
      { id: 'd22', name: 'D22', x: 800, y: 510, type: 'I2C', description: 'PIN_SCL: Hardware I2C Serial Clock (OLED & BMP280)' },
      { id: 'd23', name: 'D23', x: 800, y: 535, type: 'SPI', description: 'GPIO 23: SPI MOSI Data (MicroSD MOSI)' },
    ],
  },

  // ── 4. DISPLAY & STATUS INDICATORS (Center-Right) ──────────────────────────
  {
    id: 'oled',
    name: 'SSD1306 0.96" OLED Display',
    category: 'DISPLAY',
    modelNumber: 'SSD1306 128x64 Monochrome I2C',
    status: 'IMPLEMENTED',
    imageSrc: '/assets/hardware/oled.webp',
    x: 870,
    y: 70,
    width: 220,
    height: 160,
    description: 'High-contrast monochrome OLED module presenting real-time ocean depth, ambient temperature, battery voltage percentage, and link metrics directly on the device.',
    operatingVoltage: '3.3V DC',
    communicationProtocol: 'Hardware I2C (Address 0x3C, 400 kHz)',
    roleInMarislink: 'Local GUI monitor driven by Adafruit SSD1306 library displaying node status and telemetry graphs.',
    connectedTo: ['esp32'],
    pins: [
      { id: 'gnd', name: 'GND', x: 910, y: 95, type: 'GROUND', voltage: '0V', description: 'Common ground' },
      { id: 'vcc', name: 'VCC', x: 960, y: 95, type: 'POWER', voltage: '3.3V', description: '3.3V power' },
      { id: 'scl', name: 'SCL', x: 1010, y: 95, type: 'I2C', description: 'I2C Clock line' },
      { id: 'sda', name: 'SDA', x: 1060, y: 95, type: 'I2C', description: 'I2C Data line' },
    ],
  },
  {
    id: 'led_indicators',
    name: 'Acoustic Status Indicators & 220Ω Resistors',
    category: 'INDICATOR',
    modelNumber: '3-LED Array (TX / SYNC / FAULT)',
    status: 'IMPLEMENTED',
    imageSrc: '/assets/hardware/led_indicators_panel.webp',
    x: 870,
    y: 280,
    width: 220,
    height: 160,
    description: 'Tri-color high-efficiency indicator array: Green (GPIO 2: Acoustic TX burst), Yellow (GPIO 4: Carrier sync lock), and Red (GPIO 15: Critical alert). Ballast resistors protect GPIOs.',
    operatingVoltage: '3.3V DC (with 220Ω current limit)',
    communicationProtocol: 'GPIO Digital / PWM Control',
    roleInMarislink: 'Physical optical indication of underwater communication activity, synchronization, and error states.',
    connectedTo: ['esp32'],
    pins: [
      { id: 'tx_green', name: 'TX (Green A)', x: 910, y: 405, type: 'GPIO', description: 'Anode to ESP32 GPIO 2 via 220Ω' },
      { id: 'sync_yellow', name: 'SYNC (Yellow A)', x: 960, y: 405, type: 'GPIO', description: 'Anode to ESP32 GPIO 4 via 220Ω' },
      { id: 'alert_red', name: 'FAULT (Red A)', x: 1010, y: 405, type: 'GPIO', description: 'Anode to ESP32 GPIO 15 via 220Ω' },
      { id: 'cathodes_gnd', name: 'GND (Cathodes)', x: 1060, y: 405, type: 'GROUND', voltage: '0V', description: 'Common cathode return to ground' },
    ],
  },
  {
    id: 'diagnostic_interface',
    name: 'Diagnostic & Telemetry Programming Port',
    category: 'INTERFACE',
    modelNumber: 'USB-C Receptacle + UART Bridge',
    status: 'IMPLEMENTED',
    imageSrc: '/assets/hardware/interface_debug_port.webp',
    x: 870,
    y: 490,
    width: 220,
    height: 160,
    description: 'Hardware USB-UART bridge connecting ESP32 UART0 (TX0/RX0) to host workstation for live serial telemetry streaming and firmware flashing.',
    operatingVoltage: '5V VBUS / 3.3V Logic',
    communicationProtocol: 'USB 2.0 Full-Speed / UART0 (115200 baud)',
    roleInMarislink: 'Gateway bridge delivering live simulated and bench telemetry into the MARISLINK web portal.',
    connectedTo: ['esp32'],
    pins: [
      { id: 'vbus', name: 'VBUS', x: 910, y: 615, type: 'POWER', voltage: '+5V', description: '5V USB Bus input' },
      { id: 'gnd', name: 'GND', x: 960, y: 615, type: 'GROUND', voltage: '0V', description: 'Common ground' },
      { id: 'tx_bridge', name: 'TX_BRIDGE', x: 1010, y: 615, type: 'UART', description: 'Bridge TX to ESP32 RX0' },
      { id: 'rx_bridge', name: 'RX_BRIDGE', x: 1060, y: 615, type: 'UART', description: 'Bridge RX to ESP32 TX0' },
    ],
  },

  // ── 5. ACOUSTIC COMMUNICATION SUBSYSTEM (Right) ────────────────────────────
  {
    id: 'modem_uart',
    name: 'Acoustic Modem / Transponder Interface',
    category: 'COMMUNICATION',
    modelNumber: 'UW-Acoustic Modem Driver v2.1',
    status: 'IMPLEMENTED',
    imageSrc: '/assets/hardware/modem_uart.webp',
    x: 1140,
    y: 260,
    width: 210,
    height: 180,
    description: 'Hardware acoustic transponder modem interface with serial framing for deep-sea acoustic packet modulation (FSK/PSK) and receiver demodulation.',
    operatingVoltage: '3.3V Logic / 12V Boost for Power Amp',
    communicationProtocol: 'Hardware Serial UART (115200 baud) & Analog Acoustic Transducer Differential Drive',
    roleInMarislink: 'Translates digital packets from ESP32 into modulated acoustic carrier waveforms and demodulates incoming hydrophone signals.',
    connectedTo: ['esp32', 'acoustics_power_amp', 'acoustics_lna'],
    pins: [
      { id: 'vcc', name: 'VCC', x: 1170, y: 285, type: 'POWER', voltage: '3.3V', description: '3.3V logic supply' },
      { id: 'gnd', name: 'GND', x: 1170, y: 320, type: 'GROUND', voltage: '0V', description: 'Common ground' },
      { id: 'rx', name: 'RX', x: 1170, y: 355, type: 'UART', description: 'UART serial data in from ESP32 TX2' },
      { id: 'tx', name: 'TX', x: 1170, y: 390, type: 'UART', description: 'UART serial data out to ESP32 RX2' },
      { id: 'analog_out', name: 'ANALOG_OUT', x: 1300, y: 325, type: 'ANALOG', description: 'Modulated analog output to acoustic power amp' },
      { id: 'analog_in', name: 'ANALOG_IN', x: 1300, y: 375, type: 'ANALOG', description: 'Amplified analog input from receiver LNA' },
    ],
  },
  {
    id: 'acoustics_lna',
    name: 'Low-Noise Receiver Preamplifier (LNA)',
    category: 'ACOUSTIC',
    modelNumber: 'AD8429 40dB Subsea Front-End',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/acoustics_lna.webp',
    x: 1360,
    y: 80,
    width: 190,
    height: 140,
    description: 'Ultra-low-noise differential instrumentation amplifier (1 nV/√Hz) with active bandpass filtering for microvolt hydrophone acoustic wave reception.',
    operatingVoltage: '3.3V DC',
    communicationProtocol: 'Analog Differential Audio/Ultrasonic (10 kHz - 200 kHz)',
    roleInMarislink: 'Boosts weak deep-sea acoustic signals received by the hydrophone before routing to the modem demodulator.',
    connectedTo: ['acoustics_hydrophone', 'modem_uart'],
    pins: [
      { id: 'out_amp', name: 'OUT_AMP', x: 1380, y: 130, type: 'ANALOG', description: 'Amplified analog output to modem' },
      { id: 'vcc', name: 'VCC', x: 1380, y: 190, type: 'POWER', voltage: '3.3V', description: 'Power supply' },
      { id: 'gnd', name: 'GND', x: 1430, y: 190, type: 'GROUND', voltage: '0V', description: 'Ground reference' },
      { id: 'hyd_in', name: 'HYD_IN', x: 1510, y: 150, type: 'ANALOG', description: 'Differential input from hydrophone' },
    ],
  },
  {
    id: 'acoustics_hydrophone',
    name: 'Teledyne TC4013 Hydrophone',
    category: 'ACOUSTIC',
    modelNumber: 'Omnidirectional Acoustic Sensor',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/acoustics_hydrophone.webp',
    x: 1360,
    y: 250,
    width: 190,
    height: 140,
    description: 'Deep-submergence piezoelectric ceramic hydrophone sensor with omnidirectional receiving pattern (1 Hz - 170 kHz) and -211 dBV sensitivity.',
    operatingVoltage: 'Passive Piezoelectric Voltage Generator',
    communicationProtocol: 'Analog Piezoelectric Signal',
    roleInMarislink: 'Primary underwater acoustic receiving sensor capturing multi-hop swarm transmissions through seawater.',
    connectedTo: ['acoustics_lna'],
    pins: [
      { id: 'sig_pos', name: 'SIG+', x: 1380, y: 300, type: 'ANALOG', description: 'Piezoelectric ceramic positive terminal' },
      { id: 'sig_neg', name: 'SIG- / SHIELD', x: 1380, y: 345, type: 'GROUND', description: 'Shield and reference ground' },
    ],
  },
  {
    id: 'acoustics_power_amp',
    name: '100W Acoustic Power Driver & Matching',
    category: 'ACOUSTIC',
    modelNumber: 'Class-D Resonant Step-Up Amp',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/acoustics_power_amp.webp',
    x: 1360,
    y: 420,
    width: 190,
    height: 140,
    description: 'High-efficiency Class-D acoustic power amplifier with toroidal impedance matching transformer stepping up signal voltage to 150 Vrms for the transducer.',
    operatingVoltage: '12V DC input (stepped up to 150Vrms)',
    communicationProtocol: 'Resonant Acoustic Carrier PWM / Drive',
    roleInMarislink: 'Drives the Tonpilz projector transducer with high acoustic source level (185 dB re 1µPa @ 1m) for multi-kilometer transmission.',
    connectedTo: ['modem_uart', 'acoustics_transducer'],
    pins: [
      { id: 'in_mod', name: 'IN_MOD', x: 1380, y: 460, type: 'ANALOG', description: 'Modulated carrier input from acoustic modem' },
      { id: 'gnd', name: 'GND', x: 1380, y: 510, type: 'GROUND', voltage: '0V', description: 'Power ground' },
      { id: 'hv_out_pos', name: 'HV_OUT+', x: 1510, y: 465, type: 'ANALOG', description: 'High-voltage drive output positive' },
      { id: 'hv_out_neg', name: 'HV_OUT-', x: 1510, y: 505, type: 'ANALOG', description: 'High-voltage drive output return' },
    ],
  },
  {
    id: 'acoustics_transducer',
    name: 'Tonpilz PZT Acoustic Projector Transducer',
    category: 'ACOUSTIC',
    modelNumber: 'PZT-4 Resonant Ceramic Stack',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/acoustics_transducer.webp',
    x: 1360,
    y: 590,
    width: 190,
    height: 140,
    description: 'Prestressed PZT-4 piezoelectric ring resonator with tailored tail mass and head mass for high acoustic power output across 20 kHz - 45 kHz carrier bands.',
    operatingVoltage: '150 Vrms High-Voltage Differential',
    communicationProtocol: 'Compressional Acoustic Pressure Waves (1500 m/s in seawater)',
    roleInMarislink: 'Primary physical acoustic transmitter converting electrical waveforms into compression waves traveling through the water column.',
    connectedTo: ['acoustics_power_amp'],
    pins: [
      { id: 'pzt_pos', name: 'PZT+', x: 1380, y: 635, type: 'ANALOG', description: 'Transducer positive terminal' },
      { id: 'pzt_neg', name: 'PZT-', x: 1380, y: 675, type: 'GROUND', description: 'Transducer return terminal' },
    ],
  },
];

// ── UNIFIED MARISLINK CIRCUIT WIRES ───────────────────────────────────────────

const UNIFIED_PROTOTYPE_WIRES: CircuitWire[] = [
  // ── Power Subsystem Wires ──
  {
    id: 'w_lipo_pos',
    sourceComponentId: 'pwr_lipo_battery',
    sourcePinId: 'bat_pos',
    destComponentId: 'pwr_mgmt_bms',
    destPinId: 'bat_in_pos',
    busType: 'POWER',
    color: '#ef4444',
    voltage: '+3.7V',
    signalDescription: 'LiPo cell positive rail feeding TP4056 BMS power input.',
    points: [{ x: 240, y: 120 }, { x: 280, y: 120 }, { x: 280, y: 260 }, { x: 40, y: 260 }, { x: 40, y: 310 }, { x: 90, y: 310 }],
  },
  {
    id: 'w_lipo_neg',
    sourceComponentId: 'pwr_lipo_battery',
    sourcePinId: 'bat_neg',
    destComponentId: 'pwr_mgmt_bms',
    destPinId: 'bat_in_neg',
    busType: 'GROUND',
    color: '#0f172a',
    voltage: '0V',
    signalDescription: 'LiPo battery ground return to BMS.',
    points: [{ x: 240, y: 160 }, { x: 265, y: 160 }, { x: 265, y: 270 }, { x: 50, y: 270 }, { x: 50, y: 350 }, { x: 90, y: 350 }],
  },
  {
    id: 'w_bms_pwr_esp',
    sourceComponentId: 'pwr_mgmt_bms',
    sourcePinId: 'vout_3v3',
    destComponentId: 'esp32',
    destPinId: '3v3',
    busType: 'POWER',
    color: '#ef4444',
    voltage: '+3.3V',
    signalDescription: 'Regulated 3.3V power rail feeding ESP32 microcontroller core.',
    points: [{ x: 240, y: 320 }, { x: 300, y: 320 }, { x: 300, y: 40 }, { x: 580, y: 40 }, { x: 580, y: 185 }, { x: 620, y: 185 }],
  },
  {
    id: 'w_bms_gnd_esp',
    sourceComponentId: 'pwr_mgmt_bms',
    sourcePinId: 'gnd_out',
    destComponentId: 'esp32',
    destPinId: 'gnd_l',
    busType: 'GROUND',
    color: '#0f172a',
    voltage: '0V',
    signalDescription: 'Common system ground return from BMS to ESP32.',
    points: [{ x: 240, y: 360 }, { x: 290, y: 360 }, { x: 290, y: 730 }, { x: 590, y: 730 }, { x: 590, y: 535 }, { x: 620, y: 535 }],
  },

  // ── Battery Potentiometer (ADC GPIO 34) ──
  {
    id: 'w_bms_pot_bat_pwr',
    sourceComponentId: 'pwr_mgmt_bms',
    sourcePinId: 'vout_3v3',
    destComponentId: 'pot_battery',
    destPinId: 'vcc',
    busType: 'POWER',
    color: '#ef4444',
    voltage: '+3.3V',
    signalDescription: '3.3V voltage reference for battery voltage divider simulation.',
    points: [{ x: 240, y: 320 }, { x: 320, y: 320 }, { x: 320, y: 195 }, { x: 370, y: 195 }],
  },
  {
    id: 'w_bms_pot_bat_gnd',
    sourceComponentId: 'pwr_mgmt_bms',
    sourcePinId: 'gnd_out',
    destComponentId: 'pot_battery',
    destPinId: 'gnd',
    busType: 'GROUND',
    color: '#0f172a',
    voltage: '0V',
    signalDescription: 'Ground reference for battery voltage divider.',
    points: [{ x: 240, y: 360 }, { x: 330, y: 360 }, { x: 330, y: 225 }, { x: 510, y: 225 }, { x: 510, y: 195 }],
  },
  {
    id: 'w_pot_bat_sig',
    sourceComponentId: 'pot_battery',
    sourcePinId: 'sig',
    destComponentId: 'esp32',
    destPinId: 'd34',
    busType: 'ADC',
    color: '#f59e0b',
    voltage: '0-3.3V',
    signalDescription: 'PIN_POT_BATTERY: Analog wiper output to ESP32 ADC1 GPIO 34 (simulating LiPo battery level).',
    points: [{ x: 440, y: 195 }, { x: 440, y: 215 }, { x: 560, y: 215 }, { x: 560, y: 285 }, { x: 620, y: 285 }],
  },

  // ── Signal RSSI Attenuator (ADC GPIO 35) ──
  {
    id: 'w_esp_pot_sig_pwr',
    sourceComponentId: 'esp32',
    sourcePinId: '3v3',
    destComponentId: 'pot_signal',
    destPinId: 'vcc',
    busType: 'POWER',
    color: '#ef4444',
    voltage: '+3.3V',
    signalDescription: '3.3V reference to acoustic RSSI attenuator.',
    points: [{ x: 620, y: 185 }, { x: 575, y: 185 }, { x: 575, y: 350 }, { x: 370, y: 350 }, { x: 370, y: 370 }],
  },
  {
    id: 'w_esp_pot_sig_gnd',
    sourceComponentId: 'esp32',
    sourcePinId: 'gnd_l',
    destComponentId: 'pot_signal',
    destPinId: 'gnd',
    busType: 'GROUND',
    color: '#0f172a',
    voltage: '0V',
    signalDescription: 'Ground return for acoustic RSSI attenuator.',
    points: [{ x: 620, y: 535 }, { x: 565, y: 535 }, { x: 565, y: 400 }, { x: 510, y: 400 }, { x: 510, y: 370 }],
  },
  {
    id: 'w_pot_sig_sig',
    sourceComponentId: 'pot_signal',
    sourcePinId: 'sig',
    destComponentId: 'esp32',
    destPinId: 'd35',
    busType: 'ADC',
    color: '#f59e0b',
    voltage: '0-3.3V',
    signalDescription: 'PIN_POT_SIGNAL: Analog wiper output to ESP32 ADC1 GPIO 35 (simulating acoustic channel RSSI).',
    points: [{ x: 440, y: 370 }, { x: 440, y: 390 }, { x: 570, y: 390 }, { x: 570, y: 310 }, { x: 620, y: 310 }],
  },

  // ── BMP280 Environmental Sensor (I2C SDA: D21, SCL: D22) ──
  {
    id: 'w_bmp280_pwr',
    sourceComponentId: 'esp32',
    sourcePinId: '3v3',
    destComponentId: 'bmp280',
    destPinId: 'vcc',
    busType: 'POWER',
    color: '#ef4444',
    voltage: '+3.3V',
    signalDescription: '3.3V VCC supply to Bosch BMP280 environmental sensor.',
    points: [{ x: 620, y: 185 }, { x: 585, y: 185 }, { x: 585, y: 515 }, { x: 370, y: 515 }, { x: 370, y: 535 }],
  },
  {
    id: 'w_bmp280_gnd',
    sourceComponentId: 'esp32',
    sourcePinId: 'gnd_l',
    destComponentId: 'bmp280',
    destPinId: 'gnd',
    busType: 'GROUND',
    color: '#0f172a',
    voltage: '0V',
    signalDescription: 'Ground return for BMP280 sensor.',
    points: [{ x: 620, y: 535 }, { x: 575, y: 535 }, { x: 575, y: 525 }, { x: 415, y: 525 }, { x: 415, y: 535 }],
  },
  {
    id: 'w_bmp280_sda',
    sourceComponentId: 'bmp280',
    sourcePinId: 'sda',
    destComponentId: 'esp32',
    destPinId: 'd21',
    busType: 'I2C',
    color: '#0284c7',
    voltage: '3.3V Logic',
    signalDescription: 'PIN_SDA: Hardware I2C Serial Data bus shared by BMP280 (0x76) and OLED (0x3C).',
    points: [{ x: 510, y: 535 }, { x: 510, y: 565 }, { x: 580, y: 565 }, { x: 580, y: 710 }, { x: 825, y: 710 }, { x: 825, y: 435 }, { x: 800, y: 435 }],
  },
  {
    id: 'w_bmp280_scl',
    sourceComponentId: 'bmp280',
    sourcePinId: 'scl',
    destComponentId: 'esp32',
    destPinId: 'd22',
    busType: 'I2C',
    color: '#eab308',
    voltage: '3.3V Logic',
    signalDescription: 'PIN_SCL: Hardware I2C Serial Clock bus (400 kHz) to ESP32 GPIO 22.',
    points: [{ x: 465, y: 535 }, { x: 465, y: 575 }, { x: 570, y: 575 }, { x: 570, y: 720 }, { x: 835, y: 720 }, { x: 835, y: 510 }, { x: 800, y: 510 }],
  },

  // ── Hull Water Leak Sensor (GPIO 32) ──
  {
    id: 'w_leak_pwr',
    sourceComponentId: 'esp32',
    sourcePinId: '3v3',
    destComponentId: 'sensor_leak',
    destPinId: 'vcc',
    busType: 'POWER',
    color: '#ef4444',
    voltage: '+3.3V',
    signalDescription: '3.3V bias for bilge leak detection grid.',
    points: [{ x: 620, y: 185 }, { x: 595, y: 185 }, { x: 595, y: 670 }, { x: 370, y: 670 }, { x: 370, y: 690 }],
  },
  {
    id: 'w_leak_gnd',
    sourceComponentId: 'esp32',
    sourcePinId: 'gnd_l',
    destComponentId: 'sensor_leak',
    destPinId: 'gnd',
    busType: 'GROUND',
    color: '#0f172a',
    voltage: '0V',
    signalDescription: 'Ground return for leak detection grid.',
    points: [{ x: 620, y: 535 }, { x: 585, y: 535 }, { x: 585, y: 680 }, { x: 440, y: 680 }, { x: 440, y: 690 }],
  },
  {
    id: 'w_leak_alert',
    sourceComponentId: 'sensor_leak',
    sourcePinId: 'alert',
    destComponentId: 'esp32',
    destPinId: 'd32',
    busType: 'GPIO',
    color: '#16a34a',
    voltage: '3.3V Logic',
    signalDescription: 'Digital interrupt alert signaling seawater ingress inside the pressure enclosure.',
    points: [{ x: 510, y: 690 }, { x: 550, y: 690 }, { x: 550, y: 335 }, { x: 620, y: 335 }],
  },

  // ── SSD1306 OLED Display (I2C SDA: D21, SCL: D22) ──
  {
    id: 'w_oled_pwr',
    sourceComponentId: 'esp32',
    sourcePinId: '3v3',
    destComponentId: 'oled',
    destPinId: 'vcc',
    busType: 'POWER',
    color: '#ef4444',
    voltage: '+3.3V',
    signalDescription: '3.3V power supply to SSD1306 OLED controller.',
    points: [{ x: 620, y: 185 }, { x: 605, y: 185 }, { x: 605, y: 65 }, { x: 960, y: 65 }, { x: 960, y: 95 }],
  },
  {
    id: 'w_oled_gnd',
    sourceComponentId: 'esp32',
    sourcePinId: 'gnd_r',
    destComponentId: 'oled',
    destPinId: 'gnd',
    busType: 'GROUND',
    color: '#0f172a',
    voltage: '0V',
    signalDescription: 'Common ground for OLED display.',
    points: [{ x: 800, y: 210 }, { x: 840, y: 210 }, { x: 840, y: 75 }, { x: 910, y: 75 }, { x: 910, y: 95 }],
  },
  {
    id: 'w_oled_sda',
    sourceComponentId: 'esp32',
    sourcePinId: 'd21',
    destComponentId: 'oled',
    destPinId: 'sda',
    busType: 'I2C',
    color: '#0284c7',
    voltage: '3.3V Logic',
    signalDescription: 'Hardware I2C SDA data bus to OLED display screen.',
    points: [{ x: 800, y: 435 }, { x: 825, y: 435 }, { x: 825, y: 55 }, { x: 1060, y: 55 }, { x: 1060, y: 95 }],
  },
  {
    id: 'w_oled_scl',
    sourceComponentId: 'esp32',
    sourcePinId: 'd22',
    destComponentId: 'oled',
    destPinId: 'scl',
    busType: 'I2C',
    color: '#eab308',
    voltage: '3.3V Logic',
    signalDescription: 'Hardware I2C SCL clock bus to OLED display screen.',
    points: [{ x: 800, y: 510 }, { x: 835, y: 510 }, { x: 835, y: 45 }, { x: 1010, y: 45 }, { x: 1010, y: 95 }],
  },

  // ── Status Indicators 3-LED Array (D2, D4, D15) ──
  {
    id: 'w_led_tx',
    sourceComponentId: 'esp32',
    sourcePinId: 'd2',
    destComponentId: 'led_indicators',
    destPinId: 'tx_green',
    busType: 'GPIO',
    color: '#22c55e',
    voltage: '3.3V Logic',
    signalDescription: 'PIN_LED_TX: ESP32 GPIO 2 driving Green TX Burst indicator through 220Ω resistor.',
    points: [{ x: 800, y: 260 }, { x: 855, y: 260 }, { x: 855, y: 405 }, { x: 910, y: 405 }],
  },
  {
    id: 'w_led_sync',
    sourceComponentId: 'esp32',
    sourcePinId: 'd4',
    destComponentId: 'led_indicators',
    destPinId: 'sync_yellow',
    busType: 'GPIO',
    color: '#eab308',
    voltage: '3.3V Logic',
    signalDescription: 'PIN_LED_SYNC: ESP32 GPIO 4 driving Yellow Carrier Sync Lock indicator through 220Ω resistor.',
    points: [{ x: 800, y: 285 }, { x: 845, y: 285 }, { x: 845, y: 420 }, { x: 960, y: 420 }, { x: 960, y: 405 }],
  },
  {
    id: 'w_led_fault',
    sourceComponentId: 'esp32',
    sourcePinId: 'd15',
    destComponentId: 'led_indicators',
    destPinId: 'alert_red',
    busType: 'GPIO',
    color: '#ef4444',
    voltage: '3.3V Logic',
    signalDescription: 'PIN_LED_ALERT: ESP32 GPIO 15 driving Red Fault/Leak Alert indicator through 220Ω resistor.',
    points: [{ x: 800, y: 235 }, { x: 865, y: 235 }, { x: 865, y: 430 }, { x: 1010, y: 430 }, { x: 1010, y: 405 }],
  },
  {
    id: 'w_led_gnd',
    sourceComponentId: 'led_indicators',
    sourcePinId: 'cathodes_gnd',
    destComponentId: 'esp32',
    destPinId: 'gnd_r',
    busType: 'GROUND',
    color: '#0f172a',
    voltage: '0V',
    signalDescription: 'Common LED cathode return to ESP32 ground.',
    points: [{ x: 1060, y: 405 }, { x: 1060, y: 440 }, { x: 820, y: 440 }, { x: 820, y: 210 }, { x: 800, y: 210 }],
  },

  // ── Diagnostic USB Interface (UART0 TX0/RX0) ──
  {
    id: 'w_diag_tx',
    sourceComponentId: 'esp32',
    sourcePinId: 'tx0',
    destComponentId: 'diagnostic_interface',
    destPinId: 'rx_bridge',
    busType: 'UART',
    color: '#a855f7',
    voltage: '3.3V Logic',
    signalDescription: 'ESP32 UART0 TX streaming live JSON telemetry to host diagnostic bridge.',
    points: [{ x: 800, y: 485 }, { x: 860, y: 485 }, { x: 860, y: 615 }, { x: 1060, y: 615 }],
  },
  {
    id: 'w_diag_rx',
    sourceComponentId: 'diagnostic_interface',
    sourcePinId: 'tx_bridge',
    destComponentId: 'esp32',
    destPinId: 'rx0',
    busType: 'UART',
    color: '#a855f7',
    voltage: '3.3V Logic',
    signalDescription: 'Host programming and command injection to ESP32 UART0 RX.',
    points: [{ x: 1010, y: 615 }, { x: 1010, y: 580 }, { x: 850, y: 580 }, { x: 850, y: 460 }, { x: 800, y: 460 }],
  },

  // ── MicroSD Card Storage (SPI Bus) ──
  {
    id: 'w_microsd_pwr',
    sourceComponentId: 'pwr_mgmt_bms',
    sourcePinId: 'vout_3v3',
    destComponentId: 'storage_microsd',
    destPinId: 'vcc',
    busType: 'POWER',
    color: '#ef4444',
    voltage: '+3.3V',
    signalDescription: '3.3V power to industrial MicroSD module.',
    points: [{ x: 240, y: 320 }, { x: 270, y: 320 }, { x: 270, y: 520 }, { x: 240, y: 520 }],
  },
  {
    id: 'w_microsd_gnd',
    sourceComponentId: 'pwr_mgmt_bms',
    sourcePinId: 'gnd_out',
    destComponentId: 'storage_microsd',
    destPinId: 'gnd',
    busType: 'GROUND',
    color: '#0f172a',
    voltage: '0V',
    signalDescription: 'Ground return for MicroSD storage module.',
    points: [{ x: 240, y: 360 }, { x: 280, y: 360 }, { x: 280, y: 540 }, { x: 240, y: 540 }],
  },
  {
    id: 'w_microsd_mosi',
    sourceComponentId: 'esp32',
    sourcePinId: 'd23',
    destComponentId: 'storage_microsd',
    destPinId: 'mosi',
    busType: 'SPI',
    color: '#4f46e5',
    voltage: '3.3V Logic',
    signalDescription: 'SPI Master Out Slave In line (ESP32 D23 to MicroSD MOSI).',
    points: [{ x: 800, y: 535 }, { x: 845, y: 535 }, { x: 845, y: 740 }, { x: 275, y: 740 }, { x: 275, y: 560 }, { x: 240, y: 560 }],
  },
  {
    id: 'w_microsd_miso',
    sourceComponentId: 'storage_microsd',
    sourcePinId: 'miso',
    destComponentId: 'esp32',
    destPinId: 'd19',
    busType: 'SPI',
    color: '#4f46e5',
    voltage: '3.3V Logic',
    signalDescription: 'SPI Master In Slave Out line (MicroSD MISO to ESP32 D19).',
    points: [{ x: 240, y: 580 }, { x: 265, y: 580 }, { x: 265, y: 730 }, { x: 815, y: 730 }, { x: 815, y: 410 }, { x: 800, y: 410 }],
  },
  {
    id: 'w_microsd_sck',
    sourceComponentId: 'esp32',
    sourcePinId: 'd18',
    destComponentId: 'storage_microsd',
    destPinId: 'sck',
    busType: 'SPI',
    color: '#4f46e5',
    voltage: '3.3V Logic',
    signalDescription: 'SPI Serial Clock (ESP32 D18 to MicroSD SCK).',
    points: [{ x: 800, y: 385 }, { x: 805, y: 385 }, { x: 805, y: 720 }, { x: 255, y: 720 }, { x: 255, y: 600 }, { x: 240, y: 600 }],
  },
  {
    id: 'w_microsd_cs',
    sourceComponentId: 'esp32',
    sourcePinId: 'd5',
    destComponentId: 'storage_microsd',
    destPinId: 'cs',
    busType: 'SPI',
    color: '#4f46e5',
    voltage: '3.3V Logic',
    signalDescription: 'SPI Chip Select (ESP32 D5 active-low select).',
    points: [{ x: 800, y: 360 }, { x: 795, y: 360 }, { x: 795, y: 710 }, { x: 245, y: 710 }, { x: 245, y: 620 }, { x: 240, y: 620 }],
  },

  // ── Acoustic Communication Subsystem Wires ──
  {
    id: 'w_modem_pwr',
    sourceComponentId: 'esp32',
    sourcePinId: '3v3',
    destComponentId: 'modem_uart',
    destPinId: 'vcc',
    busType: 'POWER',
    color: '#ef4444',
    voltage: '+3.3V',
    signalDescription: '3.3V logic power supply to acoustic modem driver board.',
    points: [{ x: 620, y: 185 }, { x: 580, y: 185 }, { x: 580, y: 30 }, { x: 1130, y: 30 }, { x: 1130, y: 285 }, { x: 1170, y: 285 }],
  },
  {
    id: 'w_modem_gnd',
    sourceComponentId: 'esp32',
    sourcePinId: 'gnd_r',
    destComponentId: 'modem_uart',
    destPinId: 'gnd',
    busType: 'GROUND',
    color: '#0f172a',
    voltage: '0V',
    signalDescription: 'Common ground return for acoustic modem.',
    points: [{ x: 800, y: 210 }, { x: 815, y: 210 }, { x: 815, y: 270 }, { x: 1120, y: 270 }, { x: 1120, y: 320 }, { x: 1170, y: 320 }],
  },
  {
    id: 'w_modem_tx',
    sourceComponentId: 'esp32',
    sourcePinId: 'tx2',
    destComponentId: 'modem_uart',
    destPinId: 'rx',
    busType: 'UART',
    color: '#8b5cf6',
    voltage: '3.3V Logic',
    signalDescription: 'ESP32 hardware serial UART2 TX (115200 baud) streaming framed telemetry packets into acoustic modem.',
    points: [{ x: 800, y: 335 }, { x: 1120, y: 335 }, { x: 1120, y: 355 }, { x: 1170, y: 355 }],
  },
  {
    id: 'w_modem_rx',
    sourceComponentId: 'modem_uart',
    sourcePinId: 'tx',
    destComponentId: 'esp32',
    destPinId: 'rx2',
    busType: 'UART',
    color: '#8b5cf6',
    voltage: '3.3V Logic',
    signalDescription: 'Demodulated acoustic packet payload data stream from modem into ESP32 UART2 RX.',
    points: [{ x: 1170, y: 390 }, { x: 1110, y: 390 }, { x: 1110, y: 310 }, { x: 800, y: 310 }],
  },
  {
    id: 'w_modem_tx_amp',
    sourceComponentId: 'modem_uart',
    sourcePinId: 'analog_out',
    destComponentId: 'acoustics_power_amp',
    destPinId: 'in_mod',
    busType: 'ACOUSTIC',
    color: '#0d9488',
    voltage: '1.2 Vrms',
    signalDescription: 'Modulated analog carrier output from modem driving the 100W resonant acoustic step-up power stage.',
    points: [{ x: 1300, y: 325 }, { x: 1340, y: 325 }, { x: 1340, y: 460 }, { x: 1380, y: 460 }],
  },
  {
    id: 'w_amp_pzt_pos',
    sourceComponentId: 'acoustics_power_amp',
    sourcePinId: 'hv_out_pos',
    destComponentId: 'acoustics_transducer',
    destPinId: 'pzt_pos',
    busType: 'ACOUSTIC',
    color: '#0d9488',
    voltage: '150 Vrms',
    signalDescription: 'High-voltage resonant drive pulse exciting the Tonpilz PZT piezoelectric ceramic stack.',
    points: [{ x: 1510, y: 465 }, { x: 1550, y: 465 }, { x: 1550, y: 635 }, { x: 1380, y: 635 }],
  },
  {
    id: 'w_amp_pzt_neg',
    sourceComponentId: 'acoustics_power_amp',
    sourcePinId: 'hv_out_neg',
    destComponentId: 'acoustics_transducer',
    destPinId: 'pzt_neg',
    busType: 'ACOUSTIC',
    color: '#0d9488',
    voltage: '0V Ref',
    signalDescription: 'High-voltage acoustic transducer return line.',
    points: [{ x: 1510, y: 505 }, { x: 1540, y: 505 }, { x: 1540, y: 675 }, { x: 1380, y: 675 }],
  },
  {
    id: 'w_hyd_lna_pos',
    sourceComponentId: 'acoustics_hydrophone',
    sourcePinId: 'sig_pos',
    destComponentId: 'acoustics_lna',
    destPinId: 'hyd_in',
    busType: 'ACOUSTIC',
    color: '#06b6d4',
    voltage: 'µV AC',
    signalDescription: 'Teledyne TC4013 hydrophone acoustic signal into ultra-low-noise front-end LNA.',
    points: [{ x: 1380, y: 300 }, { x: 1340, y: 300 }, { x: 1340, y: 150 }, { x: 1510, y: 150 }],
  },
  {
    id: 'w_lna_modem_rx',
    sourceComponentId: 'acoustics_lna',
    sourcePinId: 'out_amp',
    destComponentId: 'modem_uart',
    destPinId: 'analog_in',
    busType: 'ACOUSTIC',
    color: '#06b6d4',
    voltage: '1.2 Vrms',
    signalDescription: 'Filtered 40dB-amplified acoustic receive signal from LNA into acoustic modem demodulator.',
    points: [{ x: 1380, y: 130 }, { x: 1330, y: 130 }, { x: 1330, y: 375 }, { x: 1300, y: 375 }],
  },
];

// ── COMPONENT SHAPE RENDERER ──────────────────────────────────────────────────

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
  return (
    <g
      className={`circuit-comp-group ${isSelected ? 'selected' : ''}`}
      transform={`translate(${comp.x}, ${comp.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectComponent(comp);
      }}
    >
      {/* ── Genuine Physical Hardware Cutout Image ── */}
      <image
        href={comp.imageSrc || `/assets/hardware/${comp.id}.webp`}
        x={0}
        y={0}
        width={comp.width}
        height={comp.height}
        preserveAspectRatio="xMidYMid meet"
        className="circuit-hardware-photo"
        style={{
          filter: isSelected
            ? 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.95)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.45))'
            : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.28))',
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
      />

      {/* ── Dynamic Live Overlays ── */}
      {/* SSD1306 OLED Screen Live Telemetry */}
      {comp.id === 'oled' && (
        <g transform={`translate(${comp.width * 0.16}, ${comp.height * 0.3})`}>
          <rect
            width={comp.width * 0.68}
            height={comp.height * 0.42}
            rx={3}
            fill="#030712"
            opacity={0.92}
          />
          <text x={comp.width * 0.34} y={13} textAnchor="middle" fill="#38bdf8" fontSize={8} fontWeight="bold" fontFamily="monospace">
            ESP32 ACOUSTIC
          </text>
          <text x={comp.width * 0.34} y={24} textAnchor="middle" fill="#4ade80" fontSize={7.5} fontWeight="bold" fontFamily="monospace">
            21.4°C • 20.4MPa
          </text>
          <text x={comp.width * 0.34} y={35} textAnchor="middle" fill="#fbbf24" fontSize={7} fontFamily="monospace">
            BAT: 95% • OPTIMAL
          </text>
        </g>
      )}

      {/* Status LEDs Optical Glowing Halo Animations */}
      {comp.id === 'led_indicators' && (
        <g>
          <circle cx={comp.width * 0.25} cy={comp.height * 0.48} r={14} fill="rgba(34, 197, 94, 0.5)" filter="drop-shadow(0 0 8px #22c55e)" />
          <circle cx={comp.width * 0.48} cy={comp.height * 0.48} r={14} fill="rgba(234, 179, 8, 0.5)" filter="drop-shadow(0 0 8px #eab308)" />
          <circle cx={comp.width * 0.71} cy={comp.height * 0.48} r={14} fill="rgba(239, 68, 68, 0.5)" filter="drop-shadow(0 0 8px #ef4444)" />
        </g>
      )}

      {/* ── Component Neat Engineering Label Plaque ── */}
      {(() => {
        const labelBoxWidth = Math.min(Math.max(comp.width, 140), 220);
        const labelBoxHeight = 44;

        let statusText = '[VERIFIED IMPLEMENTED]';
        let statusColor = '#15803d';
        let statusBg = '#dcfce7';
        let statusBadgeWidth = 116;

        if (comp.status === 'ARCHITECTURAL') {
          statusText = '[PROPOSED ARCHITECTURAL]';
          statusColor = '#b45309';
          statusBg = '#fef3c7';
          statusBadgeWidth = 126;
        }

        return (
          <g transform={`translate(${comp.width / 2}, ${comp.height + 8})`}>
            <rect
              x={-labelBoxWidth / 2}
              y={0}
              width={labelBoxWidth}
              height={labelBoxHeight}
              rx={6}
              fill="#ffffff"
              stroke={isSelected ? '#0284c7' : '#cbd5e1'}
              strokeWidth={isSelected ? 1.5 : 1}
              filter="drop-shadow(0 2px 5px rgba(0,0,0,0.06))"
            />
            {/* Line 1: Component Name */}
            <text
              x={0}
              y={12.5}
              textAnchor="middle"
              fill="#0f172a"
              fontSize={8.5}
              fontWeight="800"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              style={{ pointerEvents: 'none' }}
            >
              {comp.name}
            </text>
            {/* Line 2: Short Description / Model */}
            <text
              x={0}
              y={24}
              textAnchor="middle"
              fill="#475569"
              fontSize={7.2}
              fontWeight="600"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              style={{ pointerEvents: 'none' }}
            >
              {comp.modelNumber}
            </text>
            {/* Line 3: Implementation Status Badge */}
            <g transform="translate(0, 29.5)">
              <rect
                x={-statusBadgeWidth / 2}
                y={0}
                width={statusBadgeWidth}
                height={11}
                rx={3}
                fill={statusBg}
              />
              <text
                x={0}
                y={8}
                textAnchor="middle"
                fill={statusColor}
                fontSize={6.5}
                fontWeight="bold"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing={0.4}
                style={{ pointerEvents: 'none' }}
              >
                {statusText}
              </text>
            </g>
          </g>
        );
      })()}

      {/* ── Realistic Physical Hardware Pins ── */}
      {comp.pins.map((pin) => {
        const localX = pin.x - comp.x;
        const localY = pin.y - comp.y;
        const isPinHighlighted = highlightedPinId === pin.id;

        return (
          <g
            key={pin.id}
            className={`circuit-pin-node ${isPinHighlighted ? 'pin-highlighted' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPin(comp, pin);
            }}
          >
            {/* Solder Pad Outer Copper Ring */}
            <circle
              cx={localX}
              cy={localY}
              r={5.5}
              fill="#d97706"
              stroke="#b45309"
              strokeWidth={1}
              opacity={0.85}
            />
            {/* Inner Gold Pin Head */}
            <circle
              cx={localX}
              cy={localY}
              r={4}
              fill={isPinHighlighted ? '#38bdf8' : '#fbbf24'}
              stroke="#78350f"
              strokeWidth={0.8}
            />
            {/* Center Drilled Through-Hole */}
            <circle
              cx={localX}
              cy={localY}
              r={1.8}
              fill="#0f172a"
            />
            {/* Hover Glow Target */}
            <circle
              cx={localX}
              cy={localY}
              r={8}
              fill="transparent"
              className="pin-hover-target"
            >
              <title>{`${pin.name} (${pin.type}${pin.voltage ? ` ${pin.voltage}` : ''}) - ${pin.description || ''}`}</title>
            </circle>
            {/* Pin Identification Label */}
            <text
              x={localX < comp.width / 2 ? localX - 8 : localX + 8}
              y={localY + 3}
              textAnchor={localX < comp.width / 2 ? 'end' : 'start'}
              fill="#334155"
              fontSize={7.5}
              fontWeight="bold"
              fontFamily="monospace"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {pin.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ── COMPLETE END-TO-END SYSTEM WORKFLOW SECTION ───────────────────────────────

function SystemWorkflowSection() {
  const steps = [
    { num: 1, title: 'Sensors & Transducers', icon: '🌊', desc: 'Bosch BMP280, PT1000, and bilge leak grid capture physical ocean data' },
    { num: 2, title: 'ESP32 Dual-Core LX6', icon: '⚡', desc: '240 MHz deterministic firmware executes ocean depth calibration & telemetry loop' },
    { num: 3, title: 'SNC Protocol Router', icon: '🧠', desc: 'Acoustic carrier modulation, TDMA framing, and swarm mesh routing' },
    { num: 4, title: 'Local OLED & Telemetry', icon: '🖥️', desc: 'SSD1306 128x64 display and SPI MicroSD black-box telemetry logging' },
    { num: 5, title: 'UW-Acoustic Modem v2.1', icon: '📡', desc: 'Serial packet framing & 100W Class-D resonant step-up acoustic driver' },
    { num: 6, title: 'Tonpilz PZT Transducer', icon: '🔊', desc: 'Resonant piezoelectric compression wave transmission into seawater (20-45 kHz)' },
    { num: 7, title: 'TC4013 Hydrophone Receiver', icon: '👂', desc: 'Ultra-low-noise front-end LNA captures multi-kilometer subsea acoustic packets' },
    { num: 8, title: 'Mission Big Data Ingestion', icon: '📊', desc: 'Spark SQL 3.5.9 streaming analytics and Cassandra historical lake' },
  ];

  return (
    <section className="circuit-workflow-section" aria-label="Unified Architecture Pipeline">
      <div className="workflow-section-header">
        <div className="workflow-title-block">
          <span className="workflow-icon">🔄</span>
          <div>
            <h3>COMPLETE END-TO-END MARISLINK SYSTEM WORKFLOW</h3>
            <p>Physical Sensor Acquisition → ESP32 Edge Ingestion → Acoustic Modulation & Transduction → Subsea Relay → Apache Spark Big Data Lake</p>
          </div>
        </div>
        <div className="workflow-mode-pill">
          Architecture: <strong>Unified ESP32 Underwater Hardware Prototype</strong>
        </div>
      </div>

      <div className="workflow-steps-grid">
        {steps.map((st, i) => (
          <React.Fragment key={st.num}>
            <div className="workflow-card">
              <div className="workflow-card-top">
                <span className="workflow-step-num">{st.num}</span>
                <span className="workflow-step-icon">{st.icon}</span>
              </div>
              <h4 className="workflow-step-title">{st.title}</h4>
              <p className="workflow-step-desc">{st.desc}</p>
            </div>
            {i < steps.length - 1 && <div className="workflow-arrow" aria-hidden="true">➔</div>}
          </React.Fragment>
        ))}
      </div>

      <div className="workflow-rx-banner">
        <span className="rx-badge">🔵 ACOUSTIC RECEIVING PATH</span>
        <span className="rx-desc">
          <strong>Teledyne TC4013 Hydrophone</strong> → Low-Noise Preamplifier (AD8429 LNA) → Acoustic Modem Demodulator → ESP32 UART2 RX → SNC Adaptive Mesh Router → Spark Telemetry Pipeline
        </span>
      </div>
    </section>
  );
}

// ── ADDITIONAL ARCHITECTURE SPECIFICATIONS ────────────────────────────────────

function CircuitAdditionalInfo() {
  return (
    <section className="circuit-additional-info" aria-label="Hardware Architecture Details">
      <div className="info-grid">
        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">📡</span>
            <h4>Subsea Acoustic Transceiver Subsystem</h4>
          </div>
          <p>
            Transmits modulated acoustic carrier waves between 20 kHz – 45 kHz via custom prestressed PZT-4 Tonpilz transducers. Features a 100W Class-D resonant step-up amplifier paired with an ultra-low-noise differential receiver front-end (AD8429 LNA + Teledyne TC4013 hydrophone).
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">⚡</span>
            <h4>ESP32-WROOM-32 Edge Microcontroller</h4>
          </div>
          <p>
            Dual-core Xtensa 32-bit LX6 running at 240 MHz with 520 KB SRAM. Handles 1 Hz deterministic sensor acquisition (BMP280 I2C), local OLED telemetry rendering, analog battery and RSSI monitoring, and hardware UART streaming to the acoustic transponder modem.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">🔋</span>
            <h4>Subsea Rechargeable Power Architecture</h4>
          </div>
          <p>
            Powered by a 3.7V 2500mAh high-discharge Lithium Polymer (LiPo) pouch cell stack managed by a TP4056 BMS with integrated over-discharge cutoff and synchronous 3.3V step-down regulator. Scaled battery voltage is monitored continuously via analog ADC1 GPIO 34.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">📊</span>
            <h4>Telemetry & Big Data Pipeline</h4>
          </div>
          <p>
            Every packet serialized by the ESP32 flows through the MARISLINK telemetry scheduler directly into Apache Spark 3.5.9 and Scala 2.12.18 for distributed anomaly detection, acoustic channel degradation monitoring, and persistent Cassandra time-series storage.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── MAIN UNIFIED CIRCUIT CONNECTIONS COMPONENT ────────────────────────────────

interface CircuitConnectionsPageProps {
  onNavigateToSpark?: () => void;
}

export function CircuitConnectionsPage({ onNavigateToSpark }: CircuitConnectionsPageProps) {
  const [busFilter, setBusFilter] = useState<BusFilter>('ALL');
  const [selectedComponent, setSelectedComponent] = useState<CircuitComponent | null>(null);
  const [selectedWire, setSelectedWire] = useState<CircuitWire | null>(null);
  const [highlightedPin, setHighlightedPin] = useState<{ compId: string; pinId: string } | null>(null);

  // Pan & Zoom Canvas Transform State (25% to 400%, default 72% to fit all 5 architecture columns)
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const z = new URLSearchParams(window.location.search).get('zoom');
      if (z) {
        const val = parseFloat(z);
        if (!isNaN(val) && val >= 0.25 && val <= 4.0) return val;
      }
    }
    return 0.78;
  });
  const [pan, setPan] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const px = new URLSearchParams(window.location.search).get('panX');
      const py = new URLSearchParams(window.location.search).get('panY');
      if (px && py) {
        return { x: parseFloat(px), y: parseFloat(py) };
      }
    }
    return { x: 25, y: 15 };
  });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Components and Wires for the Unified Prototype
  const currentComponents = UNIFIED_PROTOTYPE_COMPONENTS;
  const allWires = UNIFIED_PROTOTYPE_WIRES;

  // Filtered Wires
  const currentWires = useMemo(() => {
    if (busFilter === 'ALL') return allWires;
    return allWires.filter((w) => {
      if (busFilter === 'POWER') return w.busType === 'POWER';
      if (busFilter === 'GROUND') return w.busType === 'GROUND';
      if (busFilter === 'I2C') return w.busType === 'I2C';
      if (busFilter === 'SPI') return w.busType === 'SPI';
      if (busFilter === 'UART') return w.busType === 'UART';
      if (busFilter === 'ADC') return w.busType === 'ADC';
      if (busFilter === 'GPIO') return w.busType === 'GPIO';
      if (busFilter === 'ACOUSTIC') return w.busType === 'ACOUSTIC';
      return true;
    });
  }, [busFilter, allWires]);

  // Pin Coordinate Lookup Map
  const pinCoordMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const comp of currentComponents) {
      for (const pin of comp.pins) {
        map.set(`${comp.id}:${pin.id}`, { x: pin.x, y: pin.y });
      }
    }
    return map;
  }, [currentComponents]);

  // Component Selection
  const handleSelectComponent = useCallback((comp: CircuitComponent) => {
    setSelectedComponent(comp);
    setSelectedWire(null);
    setHighlightedPin(null);
  }, []);

  // Wire Selection
  const handleSelectWire = useCallback(
    (wire: CircuitWire) => {
      setSelectedWire(wire);
      const comp = currentComponents.find((c) => c.id === wire.sourceComponentId) || null;
      setSelectedComponent(comp);
      setHighlightedPin({ compId: wire.sourceComponentId, pinId: wire.sourcePinId });
    },
    [currentComponents]
  );

  // Pin Selection
  const handleSelectPin = useCallback(
    (comp: CircuitComponent, pin: PinDefinition) => {
      setSelectedComponent(comp);
      setHighlightedPin({ compId: comp.id, pinId: pin.id });
      const wire = currentWires.find(
        (w) =>
          (w.sourceComponentId === comp.id && w.sourcePinId === pin.id) ||
          (w.destComponentId === comp.id && w.destPinId === pin.id)
      );
      if (wire) setSelectedWire(wire);
    },
    [currentWires]
  );

  // Canvas Reset View (100% Zoom)
  const handleResetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 30, y: 30 });
    setSelectedComponent(null);
    setSelectedWire(null);
    setHighlightedPin(null);
  }, []);

  // Fit to View (Center the entire unified prototype)
  const handleFitCircuit = useCallback(() => {
    if (currentComponents.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const c of currentComponents) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.width);
      maxY = Math.max(maxY, c.y + c.height + 50);
    }

    const circuitWidth = maxX - minX + 80;
    const circuitHeight = maxY - minY + 80;

    const viewport = viewportRef.current;
    const viewWidth = viewport ? viewport.clientWidth : 1200;
    const viewHeight = viewport ? viewport.clientHeight : 700;

    const scaleX = (viewWidth - 60) / circuitWidth;
    const scaleY = (viewHeight - 60) / circuitHeight;
    const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.5);

    const targetX = Math.round((viewWidth - circuitWidth * fitScale) / 2 - minX * fitScale + 40 * fitScale);
    const targetY = Math.round((viewHeight - circuitHeight * fitScale) / 2 - minY * fitScale + 40 * fitScale);

    setZoom(parseFloat(fitScale.toFixed(2)));
    setPan({ x: targetX, y: targetY });
  }, [currentComponents]);

  // Zoom In / Out Buttons
  const handleZoomStep = useCallback((delta: number) => {
    setZoom((prev) => {
      const next = Math.min(Math.max(parseFloat((prev + delta).toFixed(2)), 0.25), 4.0);
      return next;
    });
  }, []);

  // Mouse Wheel Zoom centered on cursor
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;

      setZoom((prevZoom) => {
        const nextZoom = Math.min(Math.max(parseFloat((prevZoom * zoomFactor).toFixed(3)), 0.25), 4.0);
        if (nextZoom === prevZoom) return prevZoom;

        const canvasX = (mouseX - pan.x) / prevZoom;
        const canvasY = (mouseY - pan.y) / prevZoom;

        const newPanX = Math.round(mouseX - canvasX * nextZoom);
        const newPanY = Math.round(mouseY - canvasY * nextZoom);

        setPan({ x: newPanX, y: newPanY });
        return nextZoom;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [pan]);

  // Panning Event Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Orthogonal wire path generator
  const getWirePath = useCallback(
    (wire: CircuitWire) => {
      if (wire.points && wire.points.length >= 2) {
        return wire.points.reduce((acc, pt, idx) => {
          return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
        }, '');
      }

      const src = pinCoordMap.get(`${wire.sourceComponentId}:${wire.sourcePinId}`);
      const dst = pinCoordMap.get(`${wire.destComponentId}:${wire.destPinId}`);
      if (!src || !dst) return '';

      const dx = dst.x - src.x;
      const midX = src.x + dx / 2;
      return `M ${src.x} ${src.y} L ${midX} ${src.y} L ${midX} ${dst.y} L ${dst.x} ${dst.y}`;
    },
    [pinCoordMap]
  );

  // Render Wire Segment
  const renderWire = useCallback(
    (wire: CircuitWire) => {
      const pathData = getWirePath(wire);
      if (!pathData) return null;

      const isWireSelected = selectedWire?.id === wire.id;
      const src = pinCoordMap.get(`${wire.sourceComponentId}:${wire.sourcePinId}`);
      const dst = pinCoordMap.get(`${wire.destComponentId}:${wire.destPinId}`);
      if (!src || !dst) return null;

      return (
        <g
          key={wire.id}
          className={`circuit-wire-group ${isWireSelected ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectWire(wire);
          }}
        >
          {/* Transparent thick hit area for easy clicking */}
          <path
            d={pathData}
            fill="none"
            stroke="transparent"
            strokeWidth={14}
            className="wire-hit-box"
          />

          {/* Wire outer glow / selection halo */}
          <path
            d={pathData}
            fill="none"
            stroke={isWireSelected ? '#38bdf8' : wire.color}
            strokeWidth={isWireSelected ? 5.5 : 2.5}
            strokeOpacity={isWireSelected ? 0.95 : 0.85}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="wire-line-main"
          />

          {/* Inner core line */}
          <path
            d={pathData}
            fill="none"
            stroke={isWireSelected ? '#ffffff' : wire.color}
            strokeWidth={isWireSelected ? 2 : 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="wire-line-core"
          />

          {/* Solder connection dots at endpoints */}
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
    },
    [pinCoordMap, selectedWire, handleSelectWire, getWirePath]
  );

  // Connected wires to selected component
  const connectedWiresToSelected = useMemo(() => {
    if (!selectedComponent) return [];
    return currentWires.filter(
      (w) => w.sourceComponentId === selectedComponent.id || w.destComponentId === selectedComponent.id
    );
  }, [selectedComponent, currentWires]);

  return (
    <div className="circuit-workspace-container">
      {/* ── 1. Page Title Bar (Unified Prototype - No Multi-Mode Switcher) ── */}
      <div className="circuit-top-bar">
        <div className="circuit-title-area">
          <h2>
            <span>🔌</span> MARISLINK – INTEGRATED UNDERWATER HARDWARE PROTOTYPE
          </h2>
          <p>
            Unified Physical Architecture &amp; Verified Pin-to-Pin System Wiring (ESP32 Controller + Subsea Acoustic Telemetry)
          </p>
        </div>
      </div>

      {/* ── Academic Technical Accuracy Notice ─────────────────────────────── */}
      <div className="circuit-academic-notice">
        <span className="notice-badge implemented">IMPLEMENTED</span>
        <strong>Verified Embedded Prototype:</strong> Central ESP32-WROOM-32 controller executing compiled C/C++ firmware with live telemetry ingestion, Bosch BMP280, SSD1306 OLED, analog monitors, status LEDs, and UART acoustic modem interface.
        <span className="notice-badge architectural" style={{ marginLeft: 14 }}>PROPOSED ARCHITECTURAL</span>
        <strong>Subsea Acoustic Transceiver:</strong> Teledyne TC4013 hydrophone, Tonpilz PZT projector, 100W resonant drive stage, and bilge leak ingress grid modeled for deep-sea acoustic deployment.
      </div>

      {/* ── 2. Circuit Workspace & Components (Canvas + Inspector Sidebar) ── */}
      <div className="circuit-workspace-body">
        {/* Interactive SVG Canvas Viewport */}
        <div
          ref={viewportRef}
          className="circuit-canvas-viewport"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
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
            <button className="float-ctrl-btn btn-text" onClick={handleResetView} title="Reset Zoom to 100%">↺ Reset</button>
            <button className="float-ctrl-btn btn-text" onClick={handleFitCircuit} title="Fit Entire Circuit on Screen">📐 Fit</button>
          </div>

          <svg
            ref={canvasRef}
            className="circuit-canvas-svg"
            width="100%"
            height="100%"
            onClick={() => {
              setSelectedComponent(null);
              setSelectedWire(null);
              setHighlightedPin(null);
            }}
          >
            <defs>
              {/* Engineering Blueprint Dot Grid */}
              <pattern id="circ-grid-dots" width="25" height="25" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.1" fill="#94a3b8" opacity="0.32" />
              </pattern>
            </defs>

            {/* Background Grid */}
            <rect width="100%" height="100%" fill="url(#circ-grid-dots)" />

            {/* Zoom & Pan Viewport Container */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* ── Subsystem Architecture Zone Boundary Frames ── */}
              <g className="architecture-group-frames">
                {/* Frame 1: Power Management */}
                <g className="group-frame pwr-frame">
                  <rect x="40" y="45" width="260" height="680" rx="10" fill="#f8fafc" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.45" />
                  <text x="50" y="62" fill="#ef4444" fontSize="10.5" fontWeight="bold" letterSpacing="0.8">A. POWER MANAGEMENT &amp; STORAGE</text>
                </g>

                {/* Frame 2: Sensor Inputs */}
                <g className="group-frame sensor-frame">
                  <rect x="330" y="45" width="220" height="680" rx="10" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.45" />
                  <text x="340" y="62" fill="#0284c7" fontSize="10.5" fontWeight="bold" letterSpacing="0.8">B. SENSOR INPUTS &amp; MONITORING</text>
                </g>

                {/* Frame 3: Central Controller */}
                <g className="group-frame mcu-frame">
                  <rect x="590" y="45" width="240" height="680" rx="10" fill="#f8fafc" stroke="#16a34a" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.45" />
                  <text x="600" y="62" fill="#16a34a" fontSize="10.5" fontWeight="bold" letterSpacing="0.8">C. MAIN CONTROLLER (ESP32)</text>
                </g>

                {/* Frame 4: Display & Status */}
                <g className="group-frame display-frame">
                  <rect x="850" y="45" width="260" height="680" rx="10" fill="#f8fafc" stroke="#eab308" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.45" />
                  <text x="860" y="62" fill="#ca8a04" fontSize="10.5" fontWeight="bold" letterSpacing="0.8">D. DISPLAY &amp; STATUS INDICATORS</text>
                </g>

                {/* Frame 5: Acoustic Communication */}
                <g className="group-frame acoustic-frame">
                  <rect x="1120" y="45" width="460" height="680" rx="10" fill="#f8fafc" stroke="#8b5cf6" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.45" />
                  <text x="1130" y="62" fill="#8b5cf6" fontSize="10.5" fontWeight="bold" letterSpacing="0.8">E. ACOUSTIC COMMUNICATION SUBSYSTEM</text>
                </g>
              </g>

              {/* ── Layer 1: Schematic Connection Wires ── */}
              <g className="circuit-wires-layer">{currentWires.map((wire) => renderWire(wire))}</g>

              {/* ── Layer 2: Hardware Components (Images, Pins & Labels) ── */}
              <g className="circuit-components-layer">
                {currentComponents.map((comp) => (
                  <ComponentShape
                    key={comp.id}
                    comp={comp}
                    isSelected={selectedComponent?.id === comp.id}
                    selectedWire={selectedWire}
                    highlightedPinId={highlightedPin?.compId === comp.id ? highlightedPin.pinId : null}
                    onSelectComponent={handleSelectComponent}
                    onSelectPin={handleSelectPin}
                  />
                ))}
              </g>
            </g>
          </svg>
        </div>

        {/* ── Interactive Inspector Sidebar ── */}
        <aside className="circuit-inspector-panel">
          {selectedComponent ? (
            <div className="inspector-content">
              <div className="inspector-header">
                <div className="inspector-icon-wrap">
                  <img
                    src={selectedComponent.imageSrc || `/assets/hardware/${selectedComponent.id}.webp`}
                    alt={selectedComponent.name}
                    className="inspector-thumb"
                  />
                </div>
                <div>
                  <span className={`inspector-status-tag ${(selectedComponent.status || 'IMPLEMENTED').toLowerCase()}`}>
                    {selectedComponent.status === 'ARCHITECTURAL' ? 'PROPOSED ARCHITECTURAL' : 'VERIFIED IMPLEMENTED'}
                  </span>
                  <h3 className="inspector-title">{selectedComponent.name}</h3>
                  <span className="inspector-model">{selectedComponent.modelNumber}</span>
                </div>
              </div>

              <div className="inspector-body">
                <div className="inspector-prop-row">
                  <span className="prop-name">Category:</span>
                  <span className="prop-value">{selectedComponent.category}</span>
                </div>
                <div className="inspector-prop-row">
                  <span className="prop-name">Operating Voltage:</span>
                  <span className="prop-value">{selectedComponent.operatingVoltage}</span>
                </div>
                <div className="inspector-prop-row">
                  <span className="prop-name">Protocol / Bus:</span>
                  <span className="prop-value">{selectedComponent.communicationProtocol}</span>
                </div>

                <div className="inspector-desc-box">
                  <h4>Description</h4>
                  <p>{selectedComponent.description}</p>
                </div>

                <div className="inspector-role-box">
                  <h4>Role in MARISLINK System</h4>
                  <p>{selectedComponent.roleInMarislink}</p>
                </div>

                <div className="inspector-pins-box">
                  <h4>Physical Pinout ({selectedComponent.pins.length} Terminals)</h4>
                  <div className="inspector-pins-table-wrap">
                    <table className="inspector-pins-table">
                      <thead>
                        <tr>
                          <th>Pin</th>
                          <th>Type</th>
                          <th>Voltage / Signal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedComponent.pins.map((p) => {
                          const isPinActive = highlightedPin?.compId === selectedComponent.id && highlightedPin.pinId === p.id;
                          return (
                            <tr
                              key={p.id}
                              className={isPinActive ? 'active-pin-row' : ''}
                              onClick={() => handleSelectPin(selectedComponent, p)}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>
                                <code>{p.name}</code>
                              </td>
                              <td>
                                <span className={`pin-type-pill ${p.type.toLowerCase()}`}>{p.type}</span>
                              </td>
                              <td>{p.voltage || p.description || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {connectedWiresToSelected.length > 0 && (
                  <div className="inspector-connected-wires">
                    <h4>Connected Wires ({connectedWiresToSelected.length})</h4>
                    <div className="inspector-wires-list">
                      {connectedWiresToSelected.map((w) => (
                        <div
                          key={w.id}
                          className={`inspector-wire-item ${selectedWire?.id === w.id ? 'active' : ''}`}
                          onClick={() => handleSelectWire(w)}
                        >
                          <span className="wire-color-indicator" style={{ backgroundColor: w.color }} />
                          <div className="wire-info">
                            <strong>{w.busType}:</strong> {w.sourceComponentId}:{w.sourcePinId} ➔ {w.destComponentId}:{w.destPinId}
                            <span className="wire-sub">{w.signalDescription}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : selectedWire ? (
            <div className="inspector-content">
              <div className="inspector-header">
                <div>
                  <span className="inspector-status-tag implemented">ACTIVE CONNECTION</span>
                  <h3 className="inspector-title">{selectedWire.busType} Bus Wire</h3>
                  <span className="inspector-model">{selectedWire.voltage}</span>
                </div>
              </div>
              <div className="inspector-body">
                <div className="inspector-prop-row">
                  <span className="prop-name">Source Terminal:</span>
                  <span className="prop-value">
                    {selectedWire.sourceComponentId} (<code>{selectedWire.sourcePinId}</code>)
                  </span>
                </div>
                <div className="inspector-prop-row">
                  <span className="prop-name">Destination Terminal:</span>
                  <span className="prop-value">
                    {selectedWire.destComponentId} (<code>{selectedWire.destPinId}</code>)
                  </span>
                </div>
                <div className="inspector-prop-row">
                  <span className="prop-name">Bus Protocol:</span>
                  <span className="prop-value">{selectedWire.busType}</span>
                </div>
                <div className="inspector-desc-box">
                  <h4>Signal Description</h4>
                  <p>{selectedWire.signalDescription}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="inspector-empty-state">
              <span className="empty-icon" style={{ fontSize: '2rem' }}>🔍</span>
              <h4>Interactive Circuit Inspector</h4>
              <p>
                Click any electronic component on the canvas to inspect its physical pinout, operating voltages, communication protocol, and role in MARISLINK.
              </p>
              <p className="empty-sub" style={{ marginTop: 6, fontSize: '0.75rem', color: '#64748b' }}>
                Click any wire to view its source pin, destination pin, signal bus type, and electrical properties.
              </p>
              <div className="empty-state-stats">
                <div className="stat-pill">Components: <strong>{currentComponents.length}</strong></div>
                <div className="stat-pill">Wires: <strong>{currentWires.length}</strong></div>
                <div className="stat-pill">Architecture: <strong>ESP32 Unified Prototype</strong></div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── 3. Circuit Controls & Legend Toolbar ────────────────────────────── */}
      <div className="circuit-canvas-toolbar">
        <div className="circuit-filter-pills">
          <span className="filter-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginRight: 6 }}>WIRE BUS FILTER:</span>
          {(['ALL', 'POWER', 'GROUND', 'I2C', 'SPI', 'UART', 'ADC', 'GPIO', 'ACOUSTIC'] as BusFilter[]).map((f) => (
            <button
              key={f}
              className={`filter-pill ${busFilter === f ? 'active' : ''}`}
              onClick={() => setBusFilter(f)}
            >
              {f === 'ALL' && '⚡ All Wires'}
              {f === 'POWER' && '🔴 Power (+3.3V/+5V)'}
              {f === 'GROUND' && '⚫ Ground (GND)'}
              {f === 'I2C' && '🔵 I2C (SDA/SCL)'}
              {f === 'SPI' && '🟣 SPI Bus'}
              {f === 'UART' && '🟣 UART Serial'}
              {f === 'ADC' && '🟠 ADC Analog'}
              {f === 'GPIO' && '🟢 GPIO/PWM'}
              {f === 'ACOUSTIC' && '🔵 Acoustic Transducer'}
            </button>
          ))}
        </div>

        <div className="circuit-zoom-controls">
          <button className="ctrl-btn" onClick={() => handleZoomStep(-0.25)} title="Zoom Out (–25%)">－</button>
          <span className="zoom-level-badge" style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0369a1', minWidth: 44, textAlign: 'center', fontFamily: 'monospace' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="ctrl-btn" onClick={() => handleZoomStep(0.25)} title="Zoom In (+25%)">＋</button>
          <button className="ctrl-btn reset" onClick={handleResetView} title="Reset View to 100%">Reset 100%</button>
          <button className="ctrl-btn reset" onClick={handleFitCircuit} title="Fit Entire Circuit on Screen">📐 Fit Circuit</button>
          {onNavigateToSpark && (
            <button className="ctrl-btn reset" onClick={onNavigateToSpark} title="Navigate to Spark Big Data Lab" style={{ background: '#f59e0b', color: '#ffffff', borderColor: '#d97706' }}>
              ⚡ Spark Big Data Lab
            </button>
          )}
        </div>
      </div>

      {/* ── 4. COMPLETE END-TO-END MARISLINK SYSTEM WORKFLOW ───────────────── */}
      <SystemWorkflowSection />

      {/* ── 5. Additional Subsea Architectural Specifications ──────────────── */}
      <CircuitAdditionalInfo />
    </div>
  );
}
export default CircuitConnectionsPage;
