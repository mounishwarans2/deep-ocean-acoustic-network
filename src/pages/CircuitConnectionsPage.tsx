import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import './CircuitConnectionsPage.css';

// ── TYPES & INTERFACES ────────────────────────────────────────────────────────

export type CircuitMode = 'complete_underwater' | 'esp32_wokwi' | 'arduino_tinkercad';

export type BusFilter = 'ALL' | 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC' | 'DAC' | 'ADC/DAC' | 'GPIO' | 'PWM' | 'GPIO/PWM' | 'USB' | 'PCIe' | 'USB/PCIe';

export interface PinDefinition {
  id: string;
  label: string;
  x: number; // coordinate relative to component top-left
  y: number; // coordinate relative to component top-left
  type: 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC' | 'DAC' | 'GPIO' | 'PWM' | 'USB' | 'PCIe';
  description: string;
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
  roleInMarislink: string;
  protocol: string;
  operatingVoltage: string;
  currentDraw: string;
  powerRequirements?: string;
  inputPins?: string[];
  outputPins?: string[];
  connectedDevices?: string[];
  technicalExplanation?: string;
  tinkercadEquivNote?: string;
  imageSrc?: string;
  pins: PinDefinition[];
}

export interface CircuitWire {
  id: string;
  name: string;
  busType: 'POWER' | 'GROUND' | 'I2C' | 'SPI' | 'UART' | 'ADC' | 'DAC' | 'ADC/DAC' | 'GPIO' | 'PWM' | 'GPIO/PWM' | 'USB' | 'PCIe' | 'USB/PCIe';
  sourceComponentId: string;
  sourcePinId: string;
  destComponentId: string;
  destPinId: string;
  color: string;
  colorName?: string;
  voltage?: string;
  signalDirection?: 'SOURCE_TO_DEST' | 'DEST_TO_SOURCE' | 'BIDIRECTIONAL';
  connectionPurpose?: string;
  signalDescription?: string;
  waypoints?: [number, number][];
}

export interface CircuitGroup {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  accent: string;
}


const PROTOTYPE_COMPONENTS: CircuitComponent[] = [
  {
    id: 'controller',
    name: 'Embedded Controller DevKit v1',
    category: 'MCU',
    modelNumber: 'Dual-Core 32-Bit LX6 (30-Pin)',
    imageSrc: '/assets/hardware/esp32.png',
    x: 80,
    y: 140,
    width: 170,
    height: 380,
    description: 'Central node processor featuring dual-core Xtensa 32-bit LX6 at 240 MHz, integrated 2.4 GHz WiFi, and hardware I2C/ADC controllers.',
    roleInMarislink: 'Executes underwater sensor polling, runs hydrostatic pressure calibration, renders OLED status graphics, and dispatches JSON telemetry packets.',
    protocol: 'I2C Master (400 kHz), 12-Bit SAR ADC, UART (115200 baud), GPIO',
    operatingVoltage: '3.3V DC (5V via USB/VIN)',
    currentDraw: '~80 - 160 mA',
    tinkercadEquivNote: 'In Tinkercad Circuits, standard 8-bit Arduino Uno R3 is used as the conceptual classroom equivalent.',
    pins: [
      // Left Header (Pin 1 to 15, Top to Bottom)
      { id: '3v3', label: '3V3', x: 8, y: 38, type: 'POWER', description: '3.3V Regulated Output Rail' },
      { id: 'en', label: 'EN', x: 8, y: 60, type: 'GPIO', description: 'Chip Enable / Active-Low Reset' },
      { id: 'vp', label: 'VP (D36)', x: 8, y: 82, type: 'ADC', description: 'ADC1_CH0 / Sensor VP' },
      { id: 'vn', label: 'VN (D39)', x: 8, y: 104, type: 'ADC', description: 'ADC1_CH3 / Sensor VN' },
      { id: 'd34', label: 'D34 (A6)', x: 8, y: 126, type: 'ADC', description: 'ADC1_CH6: Battery Monitor Input (0-3.3V)' },
      { id: 'd35', label: 'D35 (A7)', x: 8, y: 148, type: 'ADC', description: 'ADC1_CH7: Acoustic RSSI Attenuator (0-3.3V)' },
      { id: 'd32', label: 'D32', x: 8, y: 170, type: 'GPIO', description: 'General Purpose I/O Pin 32' },
      { id: 'd33', label: 'D33', x: 8, y: 192, type: 'GPIO', description: 'General Purpose I/O Pin 33' },
      { id: 'd25', label: 'D25', x: 8, y: 214, type: 'GPIO', description: 'DAC1 / GPIO Pin 25' },
      { id: 'd26', label: 'D26', x: 8, y: 236, type: 'GPIO', description: 'DAC2 / GPIO Pin 26' },
      { id: 'd27', label: 'D27', x: 8, y: 258, type: 'GPIO', description: 'General Purpose I/O Pin 27' },
      { id: 'd14', label: 'D14', x: 8, y: 280, type: 'GPIO', description: 'General Purpose I/O Pin 14' },
      { id: 'd12', label: 'D12', x: 8, y: 302, type: 'GPIO', description: 'General Purpose I/O Pin 12' },
      { id: 'd13', label: 'D13', x: 8, y: 324, type: 'GPIO', description: 'General Purpose I/O Pin 13' },
      { id: 'gnd_l', label: 'GND', x: 8, y: 346, type: 'GROUND', description: 'System Ground (Left Rail)' },

      // Right Header (Pin 16 to 30, Top to Bottom)
      { id: 'gnd_r', label: 'GND', x: 162, y: 38, type: 'GROUND', description: 'System Ground (Right Rail)' },
      { id: 'd23', label: 'D23', x: 162, y: 60, type: 'GPIO', description: 'VSPI MOSI / GPIO 23' },
      { id: 'd22', label: 'D22', x: 162, y: 82, type: 'I2C', description: 'I2C SCL (Serial Clock - 400 kHz)' },
      { id: 'tx0', label: 'TX0', x: 162, y: 104, type: 'UART', description: 'UART0 TX (Transmit Debug / Modem)' },
      { id: 'rx0', label: 'RX0', x: 162, y: 126, type: 'UART', description: 'UART0 RX (Receive Debug / Modem)' },
      { id: 'd21', label: 'D21', x: 162, y: 148, type: 'I2C', description: 'I2C SDA (Serial Data - 400 kHz)' },
      { id: 'd19', label: 'D19', x: 162, y: 170, type: 'GPIO', description: 'VSPI MISO / GPIO 19' },
      { id: 'd18', label: 'D18', x: 162, y: 192, type: 'GPIO', description: 'VSPI SCK / GPIO 18' },
      { id: 'd5', label: 'D5', x: 162, y: 214, type: 'GPIO', description: 'VSPI CS / GPIO 5' },
      { id: 'tx2', label: 'TX2', x: 162, y: 236, type: 'UART', description: 'UART2 TX / GPIO 17' },
      { id: 'rx2', label: 'RX2', x: 162, y: 258, type: 'UART', description: 'UART2 RX / GPIO 16' },
      { id: 'd4', label: 'D4', x: 162, y: 280, type: 'GPIO', description: 'GPIO 4: Acoustic Sync Lock Yellow LED' },
      { id: 'd2', label: 'D2', x: 162, y: 302, type: 'GPIO', description: 'GPIO 2: Acoustic TX Burst Green LED' },
      { id: 'd15', label: 'D15', x: 162, y: 324, type: 'GPIO', description: 'GPIO 15: Critical Fault Red Alert LED' },
      { id: 'vin', label: 'VIN', x: 162, y: 346, type: 'POWER', description: '5V External DC / USB Input Rail' },
    ],
  },
  {
    id: 'oled',
    name: 'SSD1306 0.96" OLED Display',
    category: 'DISPLAY',
    modelNumber: 'SSD1306 128x64 I2C',
    imageSrc: '/assets/hardware/oled.png',
    x: 400,
    y: 60,
    width: 200,
    height: 140,
    description: 'High-contrast monochrome organic LED display module presenting real-time telemetry, node state, depth, and graphical battery gauge.',
    roleInMarislink: 'Serves as on-node local instrumentation monitor for underwater technicians during submersible deployment and diagnostic checkout.',
    protocol: 'I2C (Address: 0x3C)',
    operatingVoltage: '3.3V DC',
    currentDraw: '~20 mA',
    tinkercadEquivNote: 'In Tinkercad, a standard 16x2 Character LCD (LCD1602 with I2C PCF8574 backpack) serves as the display equivalent.',
    pins: [
      { id: 'gnd', label: 'GND', x: 35, y: 15, type: 'GROUND', description: 'Ground Supply' },
      { id: 'vcc', label: 'VCC', x: 75, y: 15, type: 'POWER', description: '3.3V Positive Power' },
      { id: 'scl', label: 'SCL', x: 125, y: 15, type: 'I2C', description: 'I2C Serial Clock (Clock Line)' },
      { id: 'sda', label: 'SDA', x: 165, y: 15, type: 'I2C', description: 'I2C Serial Data (Data Line)' },
    ],
  },
  {
    id: 'bmp280',
    name: 'BMP280 Barometric & Temp Transducer',
    category: 'SENSOR',
    modelNumber: 'Bosch BMP280 Breakout',
    imageSrc: '/assets/hardware/bmp280.png',
    x: 690,
    y: 70,
    width: 140,
    height: 120,
    description: 'Precision MEMS barometric pressure and temperature transducer measuring ambient chamber conditions.',
    roleInMarislink: 'Measures environmental temperature and atmospheric pressure; the embedded controller calculates deep hydrostatic pressure ($P = \\rho g h$) from this baseline.',
    protocol: 'I2C (Address: 0x76 / 0x77)',
    operatingVoltage: '3.3V DC',
    currentDraw: '~2.7 µA @ 1 Hz',
    tinkercadEquivNote: 'In Tinkercad, the TMP36 analog temperature sensor (0-1.75V on A1) and a potentiometer simulate temperature and pressure.',
    pins: [
      { id: 'vcc', label: 'VCC', x: 22, y: 105, type: 'POWER', description: '3.3V Power Supply' },
      { id: 'gnd', label: 'GND', x: 54, y: 105, type: 'GROUND', description: 'Common Ground' },
      { id: 'scl', label: 'SCL', x: 86, y: 105, type: 'I2C', description: 'I2C Clock Line' },
      { id: 'sda', label: 'SDA', x: 118, y: 105, type: 'I2C', description: 'I2C Data Line' },
    ],
  },
  {
    id: 'pot_battery',
    name: 'Battery Voltage Divider Potentiometer',
    category: 'ACTUATOR',
    modelNumber: '10kΩ Precision Rotary Potentiometer',
    imageSrc: '/assets/hardware/pot_battery.png',
    x: 370,
    y: 260,
    width: 130,
    height: 130,
    description: 'Rotary potentiometer functioning as an adjustable voltage divider simulating LiPo battery state (3.00V to 4.20V discharge).',
    roleInMarislink: 'Enables evaluators to adjust battery level interactively to trigger low-battery alarms (<20%) and verify failsafe logic.',
    protocol: 'Analog DC Voltage (0 - 3.3V)',
    operatingVoltage: '3.3V DC',
    currentDraw: '0.33 mA max',
    pins: [
      { id: 'vcc', label: '1 (VCC)', x: 25, y: 115, type: 'POWER', description: 'High Reference (3.3V)' },
      { id: 'sig', label: '2 (SIG)', x: 65, y: 115, type: 'ADC', description: 'Wiper Analog Output (to Embedded Controller D34)' },
      { id: 'gnd', label: '3 (GND)', x: 105, y: 115, type: 'GROUND', description: 'Low Reference (Ground)' },
    ],
  },
  {
    id: 'pot_signal',
    name: 'Acoustic RSSI Signal Attenuator',
    category: 'ACTUATOR',
    modelNumber: '10kΩ Rotary Attenuator',
    imageSrc: '/assets/hardware/pot_signal.png',
    x: 540,
    y: 260,
    width: 130,
    height: 130,
    description: 'Rotary potentiometer simulating acoustic signal strength variation (-95 dBm to -55 dBm) caused by deep-sea multipath fading.',
    roleInMarislink: 'Allows simulation of acoustic channel degradation, demonstrating packet loss increases and latency variations.',
    protocol: 'Analog DC Voltage (0 - 3.3V)',
    operatingVoltage: '3.3V DC',
    currentDraw: '0.33 mA max',
    pins: [
      { id: 'vcc', label: '1 (VCC)', x: 25, y: 115, type: 'POWER', description: 'High Reference (3.3V)' },
      { id: 'sig', label: '2 (SIG)', x: 65, y: 115, type: 'ADC', description: 'Wiper Analog Output (to Embedded Controller D35)' },
      { id: 'gnd', label: '3 (GND)', x: 105, y: 115, type: 'GROUND', description: 'Low Reference (Ground)' },
    ],
  },
  {
    id: 'modem_uart',
    name: 'Acoustic Modem Transponder Interface',
    category: 'SENSOR',
    modelNumber: 'UW-Acoustic Modem Driver v2.1',
    imageSrc: '/assets/hardware/modem_uart.png',
    x: 710,
    y: 260,
    width: 150,
    height: 130,
    description: 'Hardware acoustic transponder modem interface with serial framing for deep-sea acoustic packet modulation.',
    roleInMarislink: 'Translates electronic digital telemetry bytes into acoustic sound wave bursts across underwater transducer arrays.',
    protocol: 'UART Serial (115200 baud, 8N1)',
    operatingVoltage: '5.0V / 3.3V Logic',
    currentDraw: '~45 mA Idle / 250 mA TX',
    pins: [
      { id: 'vcc', label: 'VCC', x: 22, y: 115, type: 'POWER', description: 'Power Input Rail' },
      { id: 'gnd', label: 'GND', x: 58, y: 115, type: 'GROUND', description: 'Signal Ground' },
      { id: 'tx', label: 'TX', x: 94, y: 115, type: 'UART', description: 'Modem Serial Output (to Embedded Controller RX0)' },
      { id: 'rx', label: 'RX', x: 130, y: 115, type: 'UART', description: 'Modem Serial Input (from Embedded Controller TX0)' },
    ],
  },
  {
    id: 'leds_panel',
    name: 'Acoustic Status Indicators & 220Ω Resistors',
    category: 'ACTUATOR',
    modelNumber: '3-LED Array with Ballast Resistors',
    imageSrc: '/assets/hardware/led_indicators_panel.png',
    x: 420,
    y: 430,
    width: 380,
    height: 120,
    description: 'Diagnostic LED module with current-limiting 220 Ohm ballast resistors for visual confirmation of acoustic activity.',
    roleInMarislink: 'Green flashes on TX packet burst (GPIO 2); Yellow locks on carrier sync (GPIO 4); Red alerts on low battery / critical faults (GPIO 15).',
    protocol: 'Active-High Digital I/O (3.3V)',
    operatingVoltage: '2.0V - 3.2V Forward Voltage',
    currentDraw: '~15 mA per LED',
    pins: [
      { id: 'tx_anode', label: 'TX (Green A)', x: 50, y: 95, type: 'GPIO', description: 'Green LED Anode (from GPIO 2 via 220Ω)' },
      { id: 'sync_anode', label: 'SYNC (Yellow A)', x: 170, y: 95, type: 'GPIO', description: 'Yellow LED Anode (from GPIO 4 via 220Ω)' },
      { id: 'alert_anode', label: 'ALERT (Red A)', x: 290, y: 95, type: 'GPIO', description: 'Red LED Anode (from GPIO 15 via 220Ω)' },
      { id: 'common_gnd', label: 'GND (Cathodes)', x: 350, y: 95, type: 'GROUND', description: 'Common Ground Return' },
    ],
  },
];

const PROTOTYPE_WIRES: CircuitWire[] = [
  // ── Power & Ground Rails ──────────────────────────────────────────────────
  {
    id: 'w-pwr-oled',
    name: '3.3V VCC Power to OLED Display',
    busType: 'POWER',
    sourceComponentId: 'controller',
    sourcePinId: '3v3',
    destComponentId: 'oled',
    destPinId: 'vcc',
    color: '#ef4444',
    colorName: 'Red (+3.3V)',
    voltage: '+3.3V DC Regulated',
    signalDescription: 'Supplies regulated 3.3V DC positive power from the Controller onboard regulator to the SSD1306 OLED controller.',
    waypoints: [[78, 148], [50, 148], [50, 30], [390, 30], [390, 80]]
  },
  {
    id: 'w-pwr-bmp',
    name: '3.3V VCC Power to BMP280 Sensor',
    busType: 'POWER',
    sourceComponentId: 'oled',
    sourcePinId: 'vcc',
    destComponentId: 'bmp280',
    destPinId: 'vcc',
    color: '#ef4444',
    colorName: 'Red (+3.3V)',
    voltage: '+3.3V DC Regulated',
    signalDescription: 'Daisy-chains +3.3V DC power rail to the Bosch BMP280 transducer module.',
    waypoints: [[390, 80], [390, 30], [610, 30], [610, 80]]
  },
  {
    id: 'w-pwr-pot-bat',
    name: '3.3V VCC to Battery Potentiometer',
    busType: 'POWER',
    sourceComponentId: 'controller',
    sourcePinId: '3v3',
    destComponentId: 'pot_battery',
    destPinId: 'vcc',
    color: '#ef4444',
    colorName: 'Red (+3.3V)',
    voltage: '+3.3V DC',
    signalDescription: 'High voltage reference for the battery level simulation divider potentiometer.',
    waypoints: [[78, 148], [50, 148], [50, 260], [345, 260], [345, 340]]
  },
  {
    id: 'w-pwr-pot-sig',
    name: '3.3V VCC to RSSI Potentiometer',
    busType: 'POWER',
    sourceComponentId: 'pot_battery',
    sourcePinId: 'vcc',
    destComponentId: 'pot_signal',
    destPinId: 'vcc',
    color: '#ef4444',
    colorName: 'Red (+3.3V)',
    voltage: '+3.3V DC',
    signalDescription: 'High voltage reference for acoustic RSSI attenuator.',
    waypoints: [[345, 340], [345, 260], [475, 260], [475, 340]]
  },
  {
    id: 'w-gnd-oled',
    name: 'Common Ground Return to OLED Display',
    busType: 'GROUND',
    sourceComponentId: 'controller',
    sourcePinId: 'gnd_l',
    destComponentId: 'oled',
    destPinId: 'gnd',
    color: '#0f172a',
    colorName: 'Black (GND)',
    voltage: '0.0V Ground Reference',
    signalDescription: 'Common reference ground return for OLED display screen logic.',
    waypoints: [[78, 456], [35, 456], [35, 45], [365, 45], [365, 80]]
  },
  {
    id: 'w-gnd-bmp',
    name: 'Common Ground Return to BMP280',
    busType: 'GROUND',
    sourceComponentId: 'oled',
    sourcePinId: 'gnd',
    destComponentId: 'bmp280',
    destPinId: 'gnd',
    color: '#0f172a',
    colorName: 'Black (GND)',
    voltage: '0.0V Ground Reference',
    signalDescription: 'Ground return for BMP280 temperature and pressure measurement circuitry.',
    waypoints: [[365, 80], [365, 45], [635, 45], [635, 80]]
  },
  {
    id: 'w-gnd-pots',
    name: 'Ground to Dual Potentiometers',
    busType: 'GROUND',
    sourceComponentId: 'controller',
    sourcePinId: 'gnd_l',
    destComponentId: 'pot_battery',
    destPinId: 'gnd',
    color: '#0f172a',
    colorName: 'Black (GND)',
    voltage: '0.0V Ground Reference',
    signalDescription: 'Ground reference connection for analog divider potentiometers.',
    waypoints: [[60, 486], [60, 410], [475, 410], [475, 375]],
  },
  {
    id: 'w-gnd-leds',
    name: 'Common Ground Return for LED Array',
    busType: 'GROUND',
    sourceComponentId: 'controller',
    sourcePinId: 'gnd_r',
    destComponentId: 'leds_panel',
    destPinId: 'common_gnd',
    color: '#0f172a',
    colorName: 'Black (GND)',
    voltage: '0.0V Ground Reference',
    signalDescription: 'Cathode return path from 220 Ohm current-limiting resistors to Controller system ground.',
    waypoints: [[270, 178], [330, 178], [330, 560], [770, 560], [770, 525]],
  },

  // ── I2C Serial Bus (SDA / SCL @ 400 kHz) ──────────────────────────────────
  {
    id: 'w-i2c-scl',
    name: 'I2C Serial Clock (SCL) Bus',
    busType: 'I2C',
    sourceComponentId: 'controller',
    sourcePinId: 'd22',
    destComponentId: 'oled',
    destPinId: 'scl',
    color: '#eab308',
    colorName: 'Yellow (I2C SCL)',
    voltage: '3.3V Clock Pulses (400 kHz)',
    signalDescription: 'Hardware I2C Clock Line. Coordinates bus timing for both SSD1306 OLED (0x3C) and BMP280 (0x76).',
    waypoints: [[242, 222], [300, 222], [300, 45], [525, 45], [525, 75]],
  },
  {
    id: 'w-i2c-scl-bmp',
    name: 'I2C SCL Daisy-Chain to BMP280',
    busType: 'I2C',
    sourceComponentId: 'oled',
    sourcePinId: 'scl',
    destComponentId: 'bmp280',
    destPinId: 'scl',
    color: '#eab308',
    colorName: 'Yellow (I2C SCL)',
    voltage: '3.3V Clock Pulses (400 kHz)',
    signalDescription: 'Extends the master I2C clock line to the BMP280 transducer.',
    waypoints: [[415, 80], [415, 230], [660, 230], [660, 80]]
  },
  {
    id: 'w-i2c-sda',
    name: 'I2C Serial Data (SDA) Bus',
    busType: 'I2C',
    sourceComponentId: 'controller',
    sourcePinId: 'd21',
    destComponentId: 'oled',
    destPinId: 'sda',
    color: '#0284c7',
    colorName: 'Blue (I2C SDA)',
    voltage: '3.3V Bidirectional Data',
    signalDescription: 'Hardware I2C Data Line. Carries bidirectional digital telemetry frames and sensor register readouts.',
    waypoints: [[242, 288], [315, 288], [315, 55], [565, 55], [565, 75]],
  },
  {
    id: 'w-i2c-sda-bmp',
    name: 'I2C SDA Daisy-Chain to BMP280',
    busType: 'I2C',
    sourceComponentId: 'oled',
    sourcePinId: 'sda',
    destComponentId: 'bmp280',
    destPinId: 'sda',
    color: '#0284c7',
    colorName: 'Blue (I2C SDA)',
    voltage: '3.3V Bidirectional Data',
    signalDescription: 'Extends the master I2C data line to the BMP280 barometric and temperature transducer.',
    waypoints: [[440, 80], [440, 215], [685, 215], [685, 80]]
  },

  // ── Analog ADC Input Lines ────────────────────────────────────────────────
  {
    id: 'w-adc-battery',
    name: 'ADC Battery Monitoring Input',
    busType: 'ADC',
    sourceComponentId: 'pot_battery',
    sourcePinId: 'sig',
    destComponentId: 'controller',
    destPinId: 'd34',
    color: '#f97316',
    colorName: 'Orange (ADC Input)',
    voltage: '0.0V - 3.3V Analog Voltage',
    signalDescription: 'Analog output from the LiPo voltage divider sampled by 12-Bit SAR ADC (ADC1_CH6: 0-4095 counts).',
    waypoints: [[375, 340], [375, 245], [60, 245], [60, 236], [78, 236]]
  },
  {
    id: 'w-adc-signal',
    name: 'ADC Acoustic RSSI Attenuation Input',
    busType: 'ADC',
    sourceComponentId: 'pot_signal',
    sourcePinId: 'sig',
    destComponentId: 'controller',
    destPinId: 'd35',
    color: '#a855f7',
    colorName: 'Purple (ADC Input)',
    voltage: '0.0V - 3.3V Analog Voltage',
    signalDescription: 'Analog wiper voltage sampled by ADC1_CH7 on GPIO 35, calibrated to acoustic transceiver RSSI (-95 to -55 dBm).',
    waypoints: [[605, 375], [605, 350], [285, 350], [285, 288], [88, 288]],
  },

  // ── Digital GPIO Control Lines (Status LEDs) ──────────────────────────────
  {
    id: 'w-gpio-tx-led',
    name: 'GPIO 2 TX Burst Indicator Line',
    busType: 'GPIO',
    sourceComponentId: 'controller',
    sourcePinId: 'd2',
    destComponentId: 'leds_panel',
    destPinId: 'tx_anode',
    color: '#22c55e',
    colorName: 'Green (Digital GPIO 2)',
    voltage: '3.3V Active-High Pulse',
    signalDescription: 'Controller GPIO Pin 2 output driving the green acoustic TX burst indicator through an inline 220 Ohm ballast resistor.',
    waypoints: [[242, 442], [340, 442], [340, 500], [470, 500], [470, 525]],
  },
  {
    id: 'w-gpio-sync-led',
    name: 'GPIO 4 Carrier Sync Lock Line',
    busType: 'GPIO',
    sourceComponentId: 'controller',
    sourcePinId: 'd4',
    destComponentId: 'leds_panel',
    destPinId: 'sync_anode',
    color: '#ca8a04',
    colorName: 'Amber (Digital GPIO 4)',
    voltage: '3.3V Active-High Constant',
    signalDescription: 'Controller GPIO Pin 4 driving yellow acoustic carrier synchronization lock LED through an inline 220 Ohm resistor.',
    waypoints: [[242, 420], [355, 420], [355, 490], [590, 490], [590, 525]],
  },
  {
    id: 'w-gpio-alert-led',
    name: 'GPIO 15 Critical Alert Fault Line',
    busType: 'GPIO',
    sourceComponentId: 'controller',
    sourcePinId: 'd15',
    destComponentId: 'leds_panel',
    destPinId: 'alert_anode',
    color: '#dc2626',
    colorName: 'Crimson (Digital GPIO 15)',
    voltage: '3.3V Active-High (Failsafe)',
    signalDescription: 'Controller GPIO Pin 15 driving red fault indicator on low battery (<20%), acoustic carrier loss, or critical pressure excursion.',
    waypoints: [[242, 464], [370, 464], [370, 480], [710, 480], [710, 525]],
  },

  // ── UART Transceiver Interface Lines ──────────────────────────────────────
  {
    id: 'w-uart-tx',
    name: 'UART0 TX0 Telemetry Transmit Line',
    busType: 'UART',
    sourceComponentId: 'controller',
    sourcePinId: 'tx0',
    destComponentId: 'modem_uart',
    destPinId: 'rx',
    color: '#0d9488',
    colorName: 'Teal (UART TX0)',
    voltage: '3.3V TTL Serial',
    signalDescription: 'Controller hardware serial TX0 (115200 baud) streaming framed telemetry packets into the acoustic transponder modem.',
    waypoints: [[232, 280], [300, 280], [300, 305], [625, 305], [625, 340]]
  },
  {
    id: 'w-uart-rx',
    name: 'UART0 RX0 Telemetry Receive Line',
    busType: 'UART',
    sourceComponentId: 'modem_uart',
    sourcePinId: 'tx',
    destComponentId: 'controller',
    destPinId: 'rx0',
    color: '#64748b',
    colorName: 'Slate (UART RX0)',
    voltage: '3.3V TTL Serial',
    signalDescription: 'Receives acoustic downlink commands and telemetry acknowledgments from ocean surface stations.',
    waypoints: [[655, 340], [655, 320], [310, 320], [310, 302], [232, 302]]
  },
];

// ── ARDUINO UNO TINKERCAD-EQUIVALENT DATA ────────────────────────────────────

export const UNDERWATER_GROUPS: CircuitGroup[] = [
  { id: 'group_pwr', name: 'A. POWER MANAGEMENT', x: 30, y: 30, width: 710, height: 550, color: 'rgba(239, 68, 68, 0.03)', accent: '#ef4444' },
  { id: 'group_sensors', name: 'B. SENSOR INPUTS', x: 30, y: 615, width: 730, height: 215, color: 'rgba(6, 182, 212, 0.03)', accent: '#06b6d4' },
  { id: 'group_processing', name: 'C. MAIN PROCESSING', x: 770, y: 150, width: 600, height: 430, color: 'rgba(59, 130, 246, 0.04)', accent: '#3b82f6' },
  { id: 'group_rx', name: 'D. ACOUSTIC RECEIVER', x: 1390, y: 30, width: 700, height: 215, color: 'rgba(168, 85, 247, 0.03)', accent: '#a855f7' },
  { id: 'group_tx', name: 'E. ACOUSTIC TRANSMITTER', x: 1390, y: 270, width: 700, height: 215, color: 'rgba(236, 72, 153, 0.03)', accent: '#ec4899' },
  { id: 'group_storage', name: 'F. STORAGE', x: 790, y: 615, width: 550, height: 215, color: 'rgba(16, 185, 129, 0.03)', accent: '#10b981' },
  { id: 'group_interfaces', name: 'G. EXTERNAL INTERFACES', x: 1390, y: 520, width: 440, height: 215, color: 'rgba(245, 158, 11, 0.03)', accent: '#f59e0b' },
  { id: 'group_indicators', name: 'H. STATUS INDICATORS', x: 1850, y: 520, width: 240, height: 215, color: 'rgba(34, 197, 94, 0.03)', accent: '#22c55e' },
];

const UNDERWATER_COMPONENTS: CircuitComponent[] = [
  // ── A. POWER MANAGEMENT ────────────────────────────────────────────────────
  {
    id: 'interface_wetmate_power',
    name: 'Wet-Mate Power Connector',
    category: 'INTERFACE',
    modelNumber: 'SubConn 4-Pin Circular (+24V Bus)',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/interface_wetmate_power.png',
    x: 50,
    y: 65,
    width: 180,
    height: 95,
    description: 'High-current underwater wet-mateable circular connector for surface tether or charging station dock power.',
    roleInMarislink: 'Transfers external +24V DC auxiliary electrical power to subsea node for battery charging and tethered operations.',
    protocol: 'Direct DC Power Bus (Up to 15A continuous)',
    operatingVoltage: '24V DC External Bus',
    currentDraw: 'Input Sink (Up to 15A)',
    pins: [
      { id: 'v_bus_in', label: '+24V', x: 145, y: 35, type: 'POWER', description: 'External 24V DC Auxiliary Power Line' },
      { id: 'gnd', label: 'GND', x: 145, y: 65, type: 'GROUND', description: 'External Power Ground Return' }
    ]
  },
  {
    id: 'pwr_primary_battery',
    name: 'MICRO NUCLEAR BATTERY – CONCEPTUAL',
    category: 'POWER',
    modelNumber: 'Solid-State Betavoltaic Power Cell',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/pwr_micro_nuclear_battery.png',
    x: 275,
    y: 65,
    width: 195,
    height: 95,
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
    imageSrc: '/assets/hardware/pwr_lipo_backup_battery.png',
    x: 510,
    y: 65,
    width: 195,
    height: 95,
    description: 'High-discharge multi-cell Lithium Polymer (LiPo) laminated pouch battery pack engineered to buffer peak transient surge currents during high-power acoustic transmission pulses.',
    roleInMarislink: 'Supplies rapid transient discharge currents to the 100W acoustic power amplifier, preventing voltage sag on sensitive digital processor rails.',
    protocol: 'High-Rate Secondary DC Energy Buffer',
    operatingVoltage: 'DC Output Rail (Multi-Cell Pouch Buffer)',
    currentDraw: 'High-Rate Pulse Burst Capability (To BMS)',
    pins: [
      { id: 'bat_pos', label: 'B+', x: 150, y: 14, type: 'POWER', description: 'LiPo Pouch Positive Power Lead (XT60 Terminal)' },
      { id: 'bat_neg', label: 'B-', x: 168, y: 14, type: 'GROUND', description: 'LiPo Pouch Negative Ground Return (XT60 Terminal)' }
    ]
  },
  {
    id: 'pwr_path_mgmt',
    name: 'Power Path Controller',
    category: 'POWER',
    modelNumber: 'LTC4412 Ideal Diode Multiplexer',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/pwr_path_mgmt.png',
    x: 275,
    y: 255,
    width: 195,
    height: 95,
    description: 'Low-loss ideal diode-OR controller that switches seamlessly between external wet-mate power, micro nuclear battery (conceptual), and backup LiPo buffer.',
    roleInMarislink: 'Eliminates cross-charging between disparate battery sources and prevents battery discharge into external ports.',
    protocol: 'Autonomous Hardware Power Multiplexing',
    operatingVoltage: '9V - 28V DC Input Range',
    currentDraw: '<15 µA Quiescent Current',
    pins: [
      { id: 'pri_in', label: 'PRI_IN', x: 28, y: 30, type: 'POWER', description: 'Micro Nuclear Battery (Conceptual) Power Input' },
      { id: 'sec_in', label: 'SEC_IN', x: 165, y: 30, type: 'POWER', description: 'BMS Buffered Secondary Battery Input' },
      { id: 'ext_in', label: 'EXT_IN', x: 28, y: 65, type: 'POWER', description: 'External Wet-Mate Power Input' },
      { id: 'sys_out', label: 'SYS_OUT', x: 97, y: 80, type: 'POWER', description: 'Multiplexed Main System DC Power Bus' },
      { id: 'gnd', label: 'GND', x: 165, y: 65, type: 'GROUND', description: 'Common Ground Reference' }
    ]
  },
  {
    id: 'pwr_bms',
    name: 'Smart Battery Mgmt (BMS)',
    category: 'POWER',
    modelNumber: 'TI BQ76952 Cell Balancer & Monitor',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/pwr_bms.png',
    x: 510,
    y: 255,
    width: 195,
    height: 95,
    description: 'Autonomous multi-cell battery monitor and protector featuring active cell balancing and I2C status telemetry.',
    roleInMarislink: 'Guards the LiPo energy buffer against overvoltage, undervoltage, thermal runaway, and short circuits.',
    protocol: 'I2C / Autonomous Hardware Protection',
    operatingVoltage: '14.8V Pack Bus',
    currentDraw: '<40 µA Sleep',
    pins: [
      { id: 'b_in', label: 'BAT_IN', x: 45, y: 25, type: 'POWER', description: 'Raw Battery Cells Connection' },
      { id: 'p_pos', label: 'P+', x: 155, y: 25, type: 'POWER', description: 'Protected Power Output (+)' },
      { id: 'p_neg', label: 'P-', x: 155, y: 70, type: 'GROUND', description: 'Protected System Return (-)' }
    ]
  },
  {
    id: 'pwr_dcdc_converters',
    name: 'Multi-Rail DC-DC Regulators',
    category: 'POWER',
    modelNumber: '12V, 5V, 3.3V Synchronous Buck',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/pwr_dcdc_converters.png',
    x: 275,
    y: 445,
    width: 195,
    height: 95,
    description: 'High-efficiency multi-output buck regulator generating +12V for the acoustic amplifier, +5V for analog sensors, and +3.3V for microcontrollers and FPGA cores.',
    roleInMarislink: 'Converts primary and secondary DC voltage into regulated +12V, +5V, and +3.3V rails for system electronics.',
    protocol: 'DC-DC Switching Power Conversion (>92% Efficiency)',
    operatingVoltage: '14.4V Main Bus Input',
    currentDraw: 'Supplies up to 60W combined peak power',
    pins: [
      { id: 'vin', label: 'VIN', x: 97, y: 15, type: 'POWER', description: 'Main DC Voltage Input from Power Path Manager' },
      { id: 'v12_out', label: '+12V', x: 168, y: 28, type: 'POWER', description: '+12V Regulated Rail (Acoustic Power Amp)' },
      { id: 'v5_out', label: '+5V', x: 168, y: 52, type: 'POWER', description: '+5V Regulated Rail (Sensors & Analog LNA)' },
      { id: 'v33_out', label: '+3.3V', x: 168, y: 76, type: 'POWER', description: '+3.3V Regulated Rail (STM32 & AI Processor)' },
      { id: 'gnd', label: 'GND', x: 28, y: 52, type: 'GROUND', description: 'Common System Power Ground' }
    ]
  },
  {
    id: 'pwr_monitor_ic',
    name: 'Digital Power Monitor IC',
    category: 'POWER',
    modelNumber: 'TI INA226 High-Side I2C Sensor',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/pwr_monitor_ic.png',
    x: 510,
    y: 445,
    width: 195,
    height: 95,
    description: 'High-accuracy digital current and voltage monitor measuring system bus energy consumption with 16-bit resolution.',
    roleInMarislink: 'Reports real-time node power draw to the STM32 controller to dynamically throttle transmission rates during low-battery states.',
    protocol: 'I2C (Address: 0x40, 400 kHz)',
    operatingVoltage: '3.3V Logic / 0 - 36V Common-Mode Sense',
    currentDraw: '330 µA Operating Current',
    pins: [
      { id: 'vin_sense', label: 'VIN+', x: 28, y: 35, type: 'POWER', description: 'Shunt Resistor Voltage Sense Line' },
      { id: 'sda', label: 'SDA', x: 165, y: 35, type: 'I2C', description: 'I2C Serial Data Telemetry Line' },
      { id: 'scl', label: 'SCL', x: 165, y: 65, type: 'I2C', description: 'I2C Serial Clock Line' },
      { id: 'gnd', label: 'GND', x: 28, y: 65, type: 'GROUND', description: 'Ground Reference' }
    ]
  },

  // ── B. SENSOR INPUTS ───────────────────────────────────────────────────────
  {
    id: 'sensor_subsea_pressure',
    name: 'Deep-Sea Pressure Transducer',
    category: 'SENSOR',
    modelNumber: 'Keller 33X Titanium (60 MPa)',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/sensor_subsea_pressure.png',
    x: 45,
    y: 670,
    width: 145,
    height: 85,
    description: 'Titanium-encapsulated oceanographic hydrostatic pressure sensor calibrated for depths down to 6,000 meters.',
    roleInMarislink: 'Measures water column depth, tidal fluctuations, and submerged vehicle buoyancy profiling.',
    protocol: 'I2C / RS-485 Modbus (0.01% FS Accuracy)',
    operatingVoltage: '5V DC Supply',
    currentDraw: '4 mA',
    pins: [
      { id: 'vcc', label: '5V', x: 25, y: 28, type: 'POWER', description: '5V Power Supply Input' },
      { id: 'i2c_sda', label: 'SDA', x: 120, y: 28, type: 'I2C', description: 'Digital Pressure Telemetry Data' },
      { id: 'i2c_scl', label: 'SCL', x: 120, y: 58, type: 'I2C', description: 'Digital Pressure Clock Line' },
      { id: 'gnd', label: 'GND', x: 25, y: 58, type: 'GROUND', description: 'Sensor Ground' }
    ]
  },
  {
    id: 'sensor_ocean_temp',
    name: 'Precision Ocean Temp RTD',
    category: 'SENSOR',
    modelNumber: 'PT1000 4-Wire Platinum Probe',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/sensor_ocean_temp.png',
    x: 225,
    y: 670,
    width: 145,
    height: 85,
    description: 'Fast-response 4-wire platinum resistance temperature detector in 316L stainless steel sheath for thermocline analysis.',
    roleInMarislink: 'Measures water temperature used by the SNC engine to compute acoustic sound speed profiles (SSP).',
    protocol: 'Analog 4-Wire RTD Resistance Sensing',
    operatingVoltage: 'Constant 1 mA Excitation Current',
    currentDraw: '<1 mA',
    pins: [
      { id: 'rtd_in_p', label: 'EXC+', x: 25, y: 28, type: 'POWER', description: 'Precision RTD Excitation Current Feed' },
      { id: 'rtd_sig_pos', label: 'SIG+', x: 120, y: 28, type: 'ADC', description: 'Differential Temperature Analog Signal (+)' },
      { id: 'rtd_sig_neg', label: 'SIG-', x: 120, y: 58, type: 'ADC', description: 'Differential Temperature Analog Signal (-)' }
    ]
  },
  {
    id: 'sensor_imu_9dof',
    name: '9-DoF Subsea Attitude IMU',
    category: 'SENSOR',
    modelNumber: 'Bosch BMI088 + BMM150 Sensor',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/sensor_imu_9dof.png',
    x: 405,
    y: 670,
    width: 145,
    height: 85,
    description: 'Precision low-drift inertial measurement unit providing pitch, roll, yaw, and acoustic node mooring tilt vectors.',
    roleInMarislink: 'Detects sea-floor node orientation ensuring acoustic beam alignment with surface buoys.',
    protocol: 'I2C / SPI (400 kHz)',
    operatingVoltage: '3.3V DC',
    currentDraw: '1.2 mA',
    pins: [
      { id: 'vcc', label: '3V3', x: 25, y: 28, type: 'POWER', description: '3.3V Power Rail' },
      { id: 'i2c_sda', label: 'SDA', x: 120, y: 28, type: 'I2C', description: 'I2C Motion Telemetry Data' },
      { id: 'i2c_scl', label: 'SCL', x: 120, y: 58, type: 'I2C', description: 'I2C Motion Clock Line' },
      { id: 'gnd', label: 'GND', x: 25, y: 58, type: 'GROUND', description: 'Ground Reference' }
    ]
  },
  {
    id: 'sensor_leak_hull',
    name: 'Hull Water-Leak Detector',
    category: 'SENSOR',
    modelNumber: 'Optical / Conductive Bilge Grid',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/sensor_leak_hull.png',
    x: 585,
    y: 670,
    width: 145,
    height: 85,
    description: 'Redundant conductive grid and optical reflection probe placed in the subsea pressure canister bilge.',
    roleInMarislink: 'Triggers emergency emergency acoustic distress beacon and immediate node shutdown if water ingress occurs.',
    protocol: 'Hardware Interrupt / Active-Low Logic',
    operatingVoltage: '3.3V DC',
    currentDraw: '<50 µA',
    pins: [
      { id: 'vcc', label: '3V3', x: 25, y: 28, type: 'POWER', description: '3.3V Supply' },
      { id: 'leak_alert_gpio', label: 'ALERT', x: 120, y: 43, type: 'GPIO', description: 'Critical Anomaly Ingress Alarm Line' },
      { id: 'gnd', label: 'GND', x: 25, y: 58, type: 'GROUND', description: 'Ground' }
    ]
  },

  // ── C. MAIN PROCESSING ─────────────────────────────────────────────────────
  {
    id: 'mcu_stm32h7',
    name: 'STM32H747 Dual-Core MCU',
    category: 'MCU',
    modelNumber: 'Cortex-M7/M4 Real-Time SNC Core',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/mcu_stm32h7.png',
    x: 800,
    y: 175,
    width: 235,
    height: 300,
    description: 'Primary real-time microcontroller running the MARISLINK Swarm-Node-Controller (SNC) deterministic protocol stack.',
    roleInMarislink: 'Executes sensor data acquisition, TDMA acoustic channel scheduling, and manages peripheral communications.',
    protocol: 'I2C, SPI, UART, CAN, SDIO, Ethernet, High-Speed USB',
    operatingVoltage: '3.3V Logic Rail',
    currentDraw: '110 mA Normal Operating',
    pins: [
      { id: 'vdd_3v3', label: '3V3', x: 18, y: 35, type: 'POWER', description: '3.3V Core Power Input' },
      { id: 'gnd', label: 'GND', x: 18, y: 60, type: 'GROUND', description: 'Digital Ground' },
      { id: 'i2c1_sda', label: 'I2C_SDA', x: 18, y: 95, type: 'I2C', description: 'Sensor Bus Data (Pressure, IMU, INA226)' },
      { id: 'i2c1_scl', label: 'I2C_SCL', x: 18, y: 120, type: 'I2C', description: 'Sensor Bus Clock Line' },
      { id: 'adc1_in0', label: 'ADC_RTD', x: 18, y: 155, type: 'ADC', description: 'Analog RTD Temperature Sensor Input' },
      { id: 'gpio_leak_int', label: 'INT_LEAK', x: 18, y: 180, type: 'GPIO', description: 'Emergency Water Leak Interrupt Pin' },
      { id: 'swdio', label: 'SWDIO', x: 18, y: 215, type: 'GPIO', description: 'SWD Serial Wire Debug Data' },
      { id: 'swclk', label: 'SWCLK', x: 18, y: 240, type: 'GPIO', description: 'SWD Serial Wire Debug Clock' },
      { id: 'eth_rxd0', label: 'ETH_RX', x: 18, y: 275, type: 'UART', description: '100BASE-TX Ethernet PHY Interface' },
      { id: 'uart1_tx', label: 'TX_AI', x: 215, y: 35, type: 'UART', description: 'High-Speed Serial Command to AMD Versal' },
      { id: 'uart1_rx', label: 'RX_AI', x: 215, y: 60, type: 'UART', description: 'High-Speed Serial Telemetry from AMD Versal' },
      { id: 'fmc_bus', label: 'FMC_PCIE', x: 215, y: 95, type: 'SPI', description: 'High-Throughput Parallel Inter-Chip Bus' },
      { id: 'spi1_miso', label: 'SPI1_RX', x: 215, y: 130, type: 'SPI', description: 'Acoustic ADC Digitized Data Input' },
      { id: 'spi1_sck', label: 'SPI1_CLK', x: 215, y: 150, type: 'SPI', description: 'Acoustic ADC SPI Clock Line' },
      { id: 'spi1_cs', label: 'SPI1_CS', x: 215, y: 170, type: 'SPI', description: 'Acoustic ADC Chip Select' },
      { id: 'spi2_mosi', label: 'SPI2_TX', x: 215, y: 200, type: 'SPI', description: 'Acoustic Modulation DAC Data Out' },
      { id: 'spi2_sck', label: 'SPI2_CLK', x: 215, y: 220, type: 'SPI', description: 'Acoustic Modulation DAC Clock Line' },
      { id: 'spi2_cs', label: 'SPI2_CS', x: 215, y: 240, type: 'SPI', description: 'Acoustic Modulation DAC Chip Select' },
      { id: 'sdio_d0', label: 'SDIO', x: 118, y: 285, type: 'SPI', description: 'High-Speed SDIO 4-Bit Storage Interface' },
      { id: 'gpio_pwr_led', label: 'LED_PWR', x: 215, y: 265, type: 'GPIO', description: 'Power Status LED Driver' },
      { id: 'gpio_comm_led', label: 'LED_COMM', x: 215, y: 285, type: 'GPIO', description: 'Acoustic Communication LED Driver' }
    ]
  },
  {
    id: 'ai_jetson_orin',
    name: 'AMD Versal™ AI Edge SoC',
    category: 'AI_PROCESSOR',
    modelNumber: 'VE2302 Adaptive Neural Engine',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/ai_jetson_orin.png',
    x: 1090,
    y: 175,
    width: 245,
    height: 300,
    description: 'High-performance adaptive processor combining vector AI Engines with programmable logic for deep subsea acoustic signal processing.',
    roleInMarislink: 'Executes real-time CNN acoustic signal denoising, multipath Doppler compensation, and anomaly spectrogram inference.',
    protocol: 'PCIe Gen4, AXI4-Stream, High-Speed DMA',
    operatingVoltage: '3.3V I/O / 0.85V Core',
    currentDraw: '1.2A Peak Processing Burst',
    pins: [
      { id: 'vdd_core', label: 'VDD_CORE', x: 25, y: 35, type: 'POWER', description: 'Core Power Supply from DC-DC Regulator' },
      { id: 'gnd', label: 'GND', x: 25, y: 60, type: 'GROUND', description: 'Common Digital Ground' },
      { id: 'uart_rx', label: 'RX_MCU', x: 25, y: 95, type: 'UART', description: 'Command Control Stream from STM32 Core' },
      { id: 'uart_tx', label: 'TX_MCU', x: 25, y: 120, type: 'UART', description: 'Neural Inference Result Stream to STM32' },
      { id: 'pcie_lane0', label: 'PCIE_EP', x: 25, y: 155, type: 'SPI', description: 'PCIe Endpoint Bus to STM32 Controller' },
      { id: 'pcie_nvme', label: 'PCIE_NVME', x: 122, y: 285, type: 'SPI', description: 'PCIe Gen3 x2 Bus to NVMe SSD Storage' },
      { id: 'ai_demod_out', label: 'DEMOD_SYM', x: 220, y: 120, type: 'SPI', description: 'Demodulated High-Speed Acoustic Symbols' },
      { id: 'ai_mod_in', label: 'MOD_SYM', x: 220, y: 180, type: 'SPI', description: 'Modulated Multi-Carrier Acoustic Baseband' }
    ]
  },

  // ── D. ACOUSTIC RECEIVER ───────────────────────────────────────────────────
  {
    id: 'acoustics_hydrophone',
    name: 'Teledyne TC4013 Hydrophone',
    category: 'ACOUSTIC',
    modelNumber: 'Omnidirectional Acoustic Sensor',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/acoustics_hydrophone.png',
    x: 1420,
    y: 55,
    width: 180,
    height: 90,
    description: 'Precision miniature oceanographic hydrophone providing omnidirectional reception across a flat frequency band from 1 Hz to 170 kHz.',
    roleInMarislink: 'Converts incoming underwater acoustic sound waves into microvolt-level differential electrical signals.',
    protocol: 'Piezoelectric Ceramic Sensing (-211 dB re 1V/µPa)',
    operatingVoltage: 'Passive Voltage Projector (No Bias Required)',
    currentDraw: '0 mA Passive',
    pins: [
      { id: 'sig_out', label: 'SIG_OUT', x: 150, y: 35, type: 'ADC', description: 'Hydrophone Differential Audio Output (+)' },
      { id: 'gnd_shield', label: 'SHIELD', x: 150, y: 65, type: 'GROUND', description: 'Waterproof Coaxial Shield Ground Return' }
    ]
  },
  {
    id: 'acoustics_lna',
    name: 'Low-Noise Preamplifier (LNA)',
    category: 'ACOUSTIC',
    modelNumber: 'AD8429 40dB Subsea Front-End',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/acoustics_lna.png',
    x: 1655,
    y: 55,
    width: 180,
    height: 90,
    description: 'Shielded ultralow-noise analog preamplifier providing 40 dB gain with 0.8 nV/√Hz input noise density.',
    roleInMarislink: 'Boosts weak deep-sea acoustic signals received by the hydrophone to full-scale ADC input range.',
    protocol: 'Differential Analog Audio Amplification (10 Hz - 200 kHz)',
    operatingVoltage: '5V Regulated Dual-Supply',
    currentDraw: '12 mA',
    pins: [
      { id: 'in_pos', label: 'IN+', x: 25, y: 35, type: 'ADC', description: 'Differential Acoustic Input from Hydrophone' },
      { id: 'in_neg', label: 'IN-', x: 25, y: 65, type: 'GROUND', description: 'Shield / Ground Input Reference' },
      { id: 'out_pos', label: 'OUT+', x: 155, y: 35, type: 'ADC', description: 'Amplified Differential Output to ADC (+)' },
      { id: 'out_neg', label: 'OUT-', x: 155, y: 65, type: 'ADC', description: 'Amplified Differential Output to ADC (-)' },
      { id: 'vcc_5v', label: '5V', x: 90, y: 15, type: 'POWER', description: '5V Analog Power Supply' }
    ]
  },
  {
    id: 'acoustics_adc',
    name: '24-Bit Acoustic Delta-Sigma ADC',
    category: 'ACOUSTIC',
    modelNumber: 'TI ADS127L11 (400 kSPS SPI)',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/acoustics_adc.png',
    x: 1890,
    y: 55,
    width: 180,
    height: 90,
    description: 'Ultra-low distortion 24-bit delta-sigma ADC with 111 dB SNR converting amplified acoustic analog waveforms into digital bitstreams.',
    roleInMarislink: 'Digitizes incoming acoustic communication frames for DSP demodulation by the STM32 and AMD Versal processor.',
    protocol: 'SPI (20 MHz Clock Rate)',
    operatingVoltage: '3.3V Digital / 5V Analog',
    currentDraw: '18 mA',
    pins: [
      { id: 'ain_pos', label: 'AIN+', x: 25, y: 35, type: 'ADC', description: 'Differential Analog Input (+) from LNA' },
      { id: 'ain_neg', label: 'AIN-', x: 25, y: 65, type: 'ADC', description: 'Differential Analog Input (-) from LNA' },
      { id: 'spi_dout', label: 'DOUT', x: 115, y: 75, type: 'SPI', description: 'Digitized 24-Bit Acoustic Sample Stream (SPI MISO)' },
      { id: 'spi_sck', label: 'SCK', x: 70, y: 75, type: 'SPI', description: 'High-Speed SPI Clock Input' },
      { id: 'spi_cs', label: 'CS', x: 25, y: 75, type: 'SPI', description: 'ADC Frame Chip Select' }
    ]
  },

  // ── E. ACOUSTIC TRANSMITTER ────────────────────────────────────────────────
  {
    id: 'acoustics_dac',
    name: 'Acoustic Modulation DAC',
    category: 'ACOUSTIC',
    modelNumber: 'AD5791 24-Bit / 1 MSPS DDS',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/acoustics_dac.png',
    x: 1420,
    y: 285,
    width: 180,
    height: 95,
    description: 'High-speed digital-to-analog converter generating clean modulated multi-frequency FSK/OFDM acoustic carrier waveforms.',
    roleInMarislink: 'Synthesizes transmission symbols computed by the SNC swarm routing stack into analog acoustic drive signals.',
    protocol: 'SPI Waveform Streaming (Up to 35 MHz)',
    operatingVoltage: '3.3V Logic / ±10V Analog',
    currentDraw: '15 mA',
    pins: [
      { id: 'spi_din', label: 'DIN', x: 25, y: 35, type: 'SPI', description: 'Baseband Modulated Data Input (SPI MOSI)' },
      { id: 'spi_sck', label: 'SCK', x: 25, y: 55, type: 'SPI', description: 'DAC Sample Clock' },
      { id: 'spi_cs', label: 'CS', x: 25, y: 75, type: 'SPI', description: 'DAC Chip Select' },
      { id: 'vout_analog', label: 'AOUT', x: 155, y: 45, type: 'DAC', description: 'Synthesized Analog Acoustic Waveform Output' },
      { id: 'gnd', label: 'GND', x: 155, y: 70, type: 'GROUND', description: 'Ground Reference' }
    ]
  },
  {
    id: 'acoustics_power_amp',
    name: '100W Acoustic Power Driver',
    category: 'ACOUSTIC',
    modelNumber: 'Class-D Resonant Step-Up Amp',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/acoustics_power_amp.png',
    x: 1655,
    y: 285,
    width: 185,
    height: 95,
    description: 'High-voltage subsea acoustic amplifier with step-up impedance matching transformer driving capacitive piezoelectric transducers.',
    roleInMarislink: 'Boosts 1V analog waveform from DAC up to 200Vrms high-voltage drive to propagate sound waves across 10 km underwater ranges.',
    protocol: 'Step-Up High-Voltage Resonant Driver (10 kHz - 35 kHz)',
    operatingVoltage: '12V DC Supply Input (Steps up to 200V RMS)',
    currentDraw: 'Peak 8A Burst during Acoustic Transmit',
    pins: [
      { id: 'sig_in', label: 'SIG_IN', x: 25, y: 35, type: 'DAC', description: 'Analog Audio Drive Signal from Modulation DAC' },
      { id: 'sig_gnd', label: 'GND', x: 25, y: 65, type: 'GROUND', description: 'Signal Ground Reference' },
      { id: 'vcc_12v', label: '12V_IN', x: 92, y: 15, type: 'POWER', description: '+12V High-Current Supply Rail from DC-DC Converter' },
      { id: 'hv_out_pos', label: 'HV+', x: 160, y: 35, type: 'POWER', description: 'High-Voltage 200Vrms Transducer Drive (+)' },
      { id: 'hv_out_neg', label: 'HV-', x: 160, y: 65, type: 'GROUND', description: 'High-Voltage Transducer Return (-)' }
    ]
  },
  {
    id: 'acoustics_transducer',
    name: 'Tonpilz Acoustic Projector',
    category: 'ACOUSTIC',
    modelNumber: 'PZT-4 Resonant Ceramic Stack',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/acoustics_transducer.png',
    x: 1895,
    y: 285,
    width: 180,
    height: 95,
    description: 'High-acoustic-power Tonpilz transducer featuring prestressed PZT ceramic rings, aluminum head mass, and heavy brass tail mass.',
    roleInMarislink: 'Transmits high-intensity acoustic sound pressure pulses into the ocean water to communicate with swarm nodes.',
    protocol: 'High-Voltage Piezoelectric Resonance (25 kHz Center Freq)',
    operatingVoltage: '200V RMS Drive',
    currentDraw: 'High-Power Transmit Projector (Source Level: 185 dB re 1µPa @ 1m)',
    pins: [
      { id: 'pzt_pos', label: 'PZT+', x: 25, y: 35, type: 'POWER', description: 'High-Voltage Acoustic Projector Terminal (+)' },
      { id: 'pzt_neg', label: 'PZT-', x: 25, y: 65, type: 'GROUND', description: 'High-Voltage Acoustic Projector Return (-)' }
    ]
  },

  // ── F. STORAGE ─────────────────────────────────────────────────────────────
  {
    id: 'storage_microsd',
    name: 'Industrial SLC MicroSD Card',
    category: 'STORAGE',
    modelNumber: '32GB Black-Box Flight Log',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/storage_microsd.png',
    x: 820,
    y: 670,
    width: 195,
    height: 85,
    description: 'High-endurance Single-Level Cell (SLC) NAND flash memory card rated for continuous subsea black-box mission flight recording.',
    roleInMarislink: 'Provides non-volatile telemetry storage logging depth, temperature, water-leak logs, and communication health.',
    protocol: 'SDIO 4-Bit High-Speed Bus (50 MHz)',
    operatingVoltage: '3.3V DC',
    currentDraw: '25 mA Active Write',
    pins: [
      { id: 'vcc', label: '3V3', x: 35, y: 30, type: 'POWER', description: '3.3V Flash Memory Power Supply' },
      { id: 'dat0', label: 'DAT0', x: 95, y: 15, type: 'SPI', description: 'SDIO Data Line 0' },
      { id: 'clk', label: 'CLK', x: 125, y: 15, type: 'SPI', description: 'SDIO High-Speed Clock Line' },
      { id: 'cmd', label: 'CMD', x: 155, y: 15, type: 'SPI', description: 'SDIO Command / Response Line' },
      { id: 'gnd', label: 'GND', x: 35, y: 60, type: 'GROUND', description: 'Ground' }
    ]
  },
  {
    id: 'storage_emmc_nvme',
    name: 'Industrial NVMe M.2 SSD',
    category: 'STORAGE',
    modelNumber: '256GB Spectrogram & Model Store',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/storage_emmc_nvme.png',
    x: 1090,
    y: 670,
    width: 220,
    height: 85,
    description: 'Wide-temperature industrial solid-state drive with hardware power-loss protection (PLP) for mass acoustic spectrogram archives.',
    roleInMarislink: 'Stores raw digitized acoustic hydrophone time-series data and deep learning model weights for the AMD Versal AI engine.',
    protocol: 'PCIe Gen3 x2 (NVMe 1.4, Up to 1.5 GB/s)',
    operatingVoltage: '3.3V DC',
    currentDraw: '450 mA Active Write Burst',
    pins: [
      { id: 'vcc_3v3', label: '3V3', x: 35, y: 30, type: 'POWER', description: '3.3V Power Rail' },
      { id: 'pcie_lane0', label: 'PCIe_RX', x: 110, y: 15, type: 'SPI', description: 'High-Speed PCIe Differential Data Line' },
      { id: 'gnd', label: 'GND', x: 35, y: 60, type: 'GROUND', description: 'Ground Reference' }
    ]
  },

  // ── G. EXTERNAL INTERFACES ─────────────────────────────────────────────────
  {
    id: 'interface_wetmate_data',
    name: 'Wet-Mate Data Connector',
    category: 'INTERFACE',
    modelNumber: 'SubConn 8-Pin Subsea Ethernet',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/interface_wetmate_data.png',
    x: 1420,
    y: 520,
    width: 180,
    height: 90,
    description: 'Pressure-balanced underwater data connector facilitating Gigabit/Fast Ethernet links to surface vessels or AUV docking stations.',
    roleInMarislink: 'Enables high-speed bulk data offloading of historical acoustic recordings when recovered or docked.',
    protocol: '100BASE-TX / 1000BASE-T Ethernet',
    operatingVoltage: '1.2V - 3.3V Differential Signaling',
    currentDraw: 'Passive Connector (500V Insulation Breakdown)',
    pins: [
      { id: 'eth_rx_p', label: 'RX+', x: 140, y: 35, type: 'UART', description: 'Ethernet Differential Receive Pair (+)' },
      { id: 'eth_tx_p', label: 'TX+', x: 140, y: 60, type: 'UART', description: 'Ethernet Differential Transmit Pair (+)' },
      { id: 'shield', label: 'SHIELD', x: 35, y: 48, type: 'GROUND', description: 'Connector Marine Chassis Shield Ground' }
    ]
  },
  {
    id: 'interface_debug_port',
    name: 'Diagnostic & SWD Port',
    category: 'INTERFACE',
    modelNumber: 'USB-C Receptacle + SWD Header',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/interface_debug_port.png',
    x: 1635,
    y: 520,
    width: 180,
    height: 90,
    description: 'Internal diagnostic port accessible during laboratory calibration before subsea canister pressure sealing.',
    roleInMarislink: 'Enables firmware flashing, real-time debugging, and benchtop hardware-in-the-loop validation.',
    protocol: 'SWD / JTAG (ARM Cortex) + USB 2.0 Full-Speed CDC',
    operatingVoltage: '3.3V Logic / 5V USB VBUS',
    currentDraw: 'Diagnostic Tap (<10 mA)',
    pins: [
      { id: 'swdio', label: 'SWDIO', x: 35, y: 35, type: 'GPIO', description: 'Serial Wire Debug Data Line to STM32' },
      { id: 'swclk', label: 'SWCLK', x: 35, y: 60, type: 'GPIO', description: 'Serial Wire Debug Clock Line to STM32' },
      { id: 'vbus', label: 'VBUS', x: 140, y: 48, type: 'POWER', description: '5V USB VBUS Sense Input' }
    ]
  },

  // ── H. STATUS INDICATORS ───────────────────────────────────────────────────
  {
    id: 'led_indicators_panel',
    name: 'Marine Optical Status Beacons',
    category: 'INDICATOR',
    modelNumber: 'IP68 4-Channel Inspection Array',
    status: 'ARCHITECTURAL',
    imageSrc: '/assets/hardware/led_indicators_panel.png',
    x: 1880,
    y: 520,
    width: 190,
    height: 90,
    description: 'Four hermetically sealed high-luminance optical indicator lenses visible through pressure hull viewport.',
    roleInMarislink: 'Visual inspection beacon for divers and ROV cameras confirming power state, acoustic sync, and fault warnings.',
    protocol: 'Direct Microcontroller GPIO Sink/Source Drivers',
    operatingVoltage: '3.3V Logic (Current-Limited via 330Ω Resistors)',
    currentDraw: '20 mA per Channel',
    pins: [
      { id: 'pwr_in', label: 'PWR', x: 35, y: 28, type: 'GPIO', description: 'Green LED: System Power Good Indicator' },
      { id: 'sync_in', label: 'SYNC', x: 75, y: 28, type: 'GPIO', description: 'Yellow LED: Acoustic Network Time Sync Lock' },
      { id: 'comm_in', label: 'COMM', x: 115, y: 28, type: 'GPIO', description: 'Blue LED: Acoustic Active Transmission Burst' },
      { id: 'alert_in', label: 'ALERT', x: 155, y: 28, type: 'GPIO', description: 'Red LED: Critical Leak or Hardware Anomaly Alarm' },
      { id: 'gnd', label: 'GND', x: 95, y: 65, type: 'GROUND', description: 'Common Indicator Cathode Return' }
    ]
  }
];

const UNDERWATER_WIRES: CircuitWire[] = [
  // ── 1. Receiver Signal Path (Hydrophone -> LNA -> ADC -> STM32 Processing) ──
  {
    id: 'w-hydro-lna-sig',
    name: 'Hydrophone Raw Acoustic Audio to Low-Noise Amplifier',
    busType: 'ADC/DAC',
    sourceComponentId: 'acoustics_hydrophone',
    sourcePinId: 'sig_out',
    destComponentId: 'acoustics_lna',
    destPinId: 'in_pos',
    color: '#ec4899',
    colorName: 'Pink (Acoustic Analog)',
    voltage: '<50 mV (Microvolt Acoustic Pressure)',
    connectionPurpose: 'Transfers microvolt acoustic signal from hydrophone to 40 dB low-noise amplifier',
    signalDescription: 'Raw differential analog hydrophone audio voltage generated by incoming ocean sound waves',
    waypoints: [[1570, 90], [1680, 90]]
  },
  {
    id: 'w-hydro-lna-gnd',
    name: 'Hydrophone Coaxial Shield to Amplifier Ground',
    busType: 'GROUND',
    sourceComponentId: 'acoustics_hydrophone',
    sourcePinId: 'gnd_shield',
    destComponentId: 'acoustics_lna',
    destPinId: 'in_neg',
    color: '#0f172a',
    colorName: 'Black (Ground Reference)',
    voltage: '0V DC',
    connectionPurpose: 'Shields low-level acoustic audio from EMI and provides reference ground',
    signalDescription: 'Subsea braided coaxial cable ground return reference',
    waypoints: [[1570, 120], [1680, 120]]
  },
  {
    id: 'w-lna-adc-p',
    name: 'LNA Amplified Acoustic Output (+) to 24-Bit ADC',
    busType: 'ADC/DAC',
    sourceComponentId: 'acoustics_lna',
    sourcePinId: 'out_pos',
    destComponentId: 'acoustics_adc',
    destPinId: 'ain_pos',
    color: '#ec4899',
    colorName: 'Pink (Acoustic Analog)',
    voltage: '±2.5V Differential Analog',
    connectionPurpose: 'Feeds amplified 40 dB acoustic audio into high-precision delta-sigma ADC',
    signalDescription: 'Conditioned differential analog audio waveform spanning 10 Hz to 200 kHz',
    waypoints: [[1810, 90], [1915, 90]]
  },
  {
    id: 'w-lna-adc-n',
    name: 'LNA Amplified Acoustic Output (-) to 24-Bit ADC',
    busType: 'ADC/DAC',
    sourceComponentId: 'acoustics_lna',
    sourcePinId: 'out_neg',
    destComponentId: 'acoustics_adc',
    destPinId: 'ain_neg',
    color: '#ec4899',
    colorName: 'Pink (Acoustic Analog)',
    voltage: '±2.5V Differential Analog',
    connectionPurpose: 'Differential negative phase input for common-mode noise rejection',
    signalDescription: 'Balanced negative-phase analog acoustic audio stream',
    waypoints: [[1810, 120], [1915, 120]]
  },
  {
    id: 'w-adc-mcu-dout',
    name: 'Digitized 24-Bit Acoustic Stream to STM32 SPI MISO',
    busType: 'SPI',
    sourceComponentId: 'acoustics_adc',
    sourcePinId: 'spi_dout',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'spi1_miso',
    color: '#0284c7',
    colorName: 'Blue (SPI Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Transfers digitized 400 kSPS 24-bit acoustic samples to STM32 core for DSP filtering',
    signalDescription: 'High-speed serialized delta-sigma digital audio bitstream',
    waypoints: [[2005, 130], [2090, 130], [2090, 35], [1045, 35], [1045, 305], [1015, 305]]
  },
  {
    id: 'w-mcu-adc-sck',
    name: 'STM32 SPI Clock to Acoustic ADC',
    busType: 'SPI',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'spi1_sck',
    destComponentId: 'acoustics_adc',
    destPinId: 'spi_sck',
    color: '#0284c7',
    colorName: 'Blue (SPI Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Provides 20 MHz synchronous serial clock for acoustic sample retrieval',
    signalDescription: 'Continuous SPI Master Clock generating frame timing',
    waypoints: [[1015, 325], [1055, 325], [1055, 45], [1960, 45], [1960, 130]]
  },
  {
    id: 'w-mcu-adc-cs',
    name: 'STM32 Chip Select to Acoustic ADC',
    busType: 'SPI',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'spi1_cs',
    destComponentId: 'acoustics_adc',
    destPinId: 'spi_cs',
    color: '#0284c7',
    colorName: 'Blue (SPI Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Activates ADC SPI interface during packet reception windows',
    signalDescription: 'Active-Low SPI slave select line',
    waypoints: [[1015, 345], [1065, 345], [1065, 55], [1915, 55], [1915, 130]]
  },

  // ── 2. Transmitter Signal Path (STM32/AI -> DAC -> Power Amp -> Transducer) ──
  {
    id: 'w-mcu-dac-mosi',
    name: 'STM32 Acoustic Baseband Waveform to Modulation DAC',
    busType: 'SPI',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'spi2_mosi',
    destComponentId: 'acoustics_dac',
    destPinId: 'spi_din',
    color: '#0284c7',
    colorName: 'Blue (SPI Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Streams digitally synthesized FSK/OFDM multi-carrier waveform data to DAC',
    signalDescription: 'Serialized high-speed 24-bit DDS waveform synthesis samples',
    waypoints: [[1015, 375], [1045, 375], [1045, 490], [1390, 490], [1390, 320], [1445, 320]]
  },
  {
    id: 'w-mcu-dac-sck',
    name: 'STM32 DAC Sample Clock Line',
    busType: 'SPI',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'spi2_sck',
    destComponentId: 'acoustics_dac',
    destPinId: 'spi_sck',
    color: '#0284c7',
    colorName: 'Blue (SPI Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Synchronizes DAC output update rate up to 1 MSPS',
    signalDescription: 'Precise hardware SPI clock governing acoustic carrier frequency',
    waypoints: [[1015, 395], [1055, 395], [1055, 500], [1400, 500], [1400, 340], [1445, 340]]
  },
  {
    id: 'w-mcu-dac-cs',
    name: 'STM32 DAC Chip Select Enable',
    busType: 'SPI',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'spi2_cs',
    destComponentId: 'acoustics_dac',
    destPinId: 'spi_cs',
    color: '#0284c7',
    colorName: 'Blue (SPI Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Frames transmission burst waveforms',
    signalDescription: 'Active-Low hardware SPI chip select',
    waypoints: [[1015, 415], [1065, 415], [1065, 510], [1410, 510], [1410, 360], [1445, 360]]
  },
  {
    id: 'w-dac-amp-sig',
    name: 'Synthesized Acoustic Waveform to Power Amplifier',
    busType: 'ADC/DAC',
    sourceComponentId: 'acoustics_dac',
    sourcePinId: 'vout_analog',
    destComponentId: 'acoustics_power_amp',
    destPinId: 'sig_in',
    color: '#ec4899',
    colorName: 'Pink (Acoustic Analog)',
    voltage: '1V RMS Analog',
    connectionPurpose: 'Feeds clean modulated analog acoustic waveform into 100W resonant driver',
    signalDescription: 'Reconstructed analog sine/OFDM multi-tone transmission signal',
    waypoints: [[1575, 330], [1625, 330], [1625, 320], [1680, 320]]
  },
  {
    id: 'w-dac-amp-gnd',
    name: 'DAC Analog Ground to Power Amplifier Reference',
    busType: 'GROUND',
    sourceComponentId: 'acoustics_dac',
    sourcePinId: 'gnd',
    destComponentId: 'acoustics_power_amp',
    destPinId: 'sig_gnd',
    color: '#0f172a',
    colorName: 'Black (Ground Reference)',
    voltage: '0V DC',
    connectionPurpose: 'Low-noise audio signal ground reference',
    signalDescription: 'Analog ground return between DAC and transducer driver',
    waypoints: [[1575, 355], [1625, 355], [1625, 350], [1680, 350]]
  },
  {
    id: 'w-amp-trans-p',
    name: 'High-Voltage 200Vrms Drive to Tonpilz Transducer (+)',
    busType: 'POWER',
    sourceComponentId: 'acoustics_power_amp',
    sourcePinId: 'hv_out_pos',
    destComponentId: 'acoustics_transducer',
    destPinId: 'pzt_pos',
    color: '#ef4444',
    colorName: 'Red (High-Voltage Acoustic Drive)',
    voltage: '200V RMS (25 kHz Resonant AC)',
    connectionPurpose: 'Drives piezoelectric ceramic PZT stack to project high-intensity underwater acoustic waves',
    signalDescription: 'Transformer-coupled high-voltage AC acoustic power pulse',
    waypoints: [[1815, 320], [1920, 320]]
  },
  {
    id: 'w-amp-trans-n',
    name: 'High-Voltage Transducer Return Line (-)',
    busType: 'GROUND',
    sourceComponentId: 'acoustics_power_amp',
    sourcePinId: 'hv_out_neg',
    destComponentId: 'acoustics_transducer',
    destPinId: 'pzt_neg',
    color: '#0f172a',
    colorName: 'Black (Ground Reference)',
    voltage: '0V DC',
    connectionPurpose: 'Completes high-voltage resonant circuit through transducer PZT stack',
    signalDescription: 'High-voltage return connection',
    waypoints: [[1815, 350], [1920, 350]]
  },

  // ── 3. Sensor Acquisition Path (Environmental Sensors -> STM32 Controller) ──
  {
    id: 'w-press-mcu-sda',
    name: 'Keller Subsea Pressure Transducer I2C Data to STM32',
    busType: 'I2C',
    sourceComponentId: 'sensor_subsea_pressure',
    sourcePinId: 'i2c_sda',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'i2c1_sda',
    color: '#06b6d4',
    colorName: 'Cyan (I2C Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Transfers digitized hydrostatic depth and water column pressure to STM32',
    signalDescription: 'I2C Serial Data line carrying calibrated millibar/MPa pressure values',
    waypoints: [[165, 698], [165, 645], [755, 645], [755, 270], [818, 270]]
  },
  {
    id: 'w-mcu-press-scl',
    name: 'STM32 I2C Clock to Keller Pressure Transducer',
    busType: 'I2C',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'i2c1_scl',
    destComponentId: 'sensor_subsea_pressure',
    destPinId: 'i2c_scl',
    color: '#06b6d4',
    colorName: 'Cyan (I2C Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Clock synchronization for pressure sensor polling',
    signalDescription: 'I2C Serial Clock running at 400 kHz standard fast-mode',
    waypoints: [[818, 295], [765, 295], [765, 655], [165, 655], [165, 728]]
  },
  {
    id: 'w-temp-mcu-rtd',
    name: 'PT1000 Precision Temperature Analog RTD to STM32 ADC',
    busType: 'ADC/DAC',
    sourceComponentId: 'sensor_ocean_temp',
    sourcePinId: 'rtd_sig_pos',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'adc1_in0',
    color: '#f97316',
    colorName: 'Orange (Analog ADC)',
    voltage: '1.0V - 1.4V DC',
    connectionPurpose: 'Feeds microvolt RTD temperature bridge voltage into 16-bit internal ADC',
    signalDescription: 'Analog resistance proportional to ocean temperature (0.01°C resolution)',
    waypoints: [[345, 698], [345, 640], [775, 640], [775, 330], [818, 330]]
  },
  {
    id: 'w-imu-mcu-sda',
    name: '9-DoF Subsea IMU I2C Data to STM32',
    busType: 'I2C',
    sourceComponentId: 'sensor_imu_9dof',
    sourcePinId: 'i2c_sda',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'i2c1_sda',
    color: '#06b6d4',
    colorName: 'Cyan (I2C Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Transfers 3-axis acceleration, gyroscope, and magnetometer orientation to STM32',
    signalDescription: 'I2C multi-sensor data bus reporting node tilt and orientation',
    waypoints: [[525, 698], [525, 645], [755, 645], [755, 270], [818, 270]]
  },
  {
    id: 'w-mcu-imu-scl',
    name: 'STM32 I2C Clock to 9-DoF IMU',
    busType: 'I2C',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'i2c1_scl',
    destComponentId: 'sensor_imu_9dof',
    destPinId: 'i2c_scl',
    color: '#06b6d4',
    colorName: 'Cyan (I2C Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Synchronizes motion sensor registers at 400 kHz',
    signalDescription: 'I2C Clock Line shared with environmental bus',
    waypoints: [[818, 295], [765, 295], [765, 655], [525, 655], [525, 728]]
  },
  {
    id: 'w-leak-mcu-alert',
    name: 'Hull Water Leak Alarm Interrupt to STM32',
    busType: 'GPIO/PWM',
    sourceComponentId: 'sensor_leak_hull',
    sourcePinId: 'leak_alert_gpio',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'gpio_leak_int',
    color: '#22c55e',
    colorName: 'Green (Digital GPIO/Interrupt)',
    voltage: '3.3V Active-Low',
    connectionPurpose: 'Hardware interrupt line triggering emergency failsafe routine if water breaches canister',
    signalDescription: 'Emergency digital interrupt triggering distress acoustic ping and power shutdown',
    waypoints: [[705, 713], [705, 640], [785, 640], [785, 355], [818, 355]]
  },

  // ── 4. Main Processing Inter-Processor Link (STM32H7 <-> AMD Versal AI Edge) ──
  {
    id: 'w-mcu-ai-tx',
    name: 'STM32 Swarm Telemetry to AMD Versal AI Engine',
    busType: 'UART',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'uart1_tx',
    destComponentId: 'ai_jetson_orin',
    destPinId: 'uart_rx',
    color: '#a855f7',
    colorName: 'Purple (High-Speed UART)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Transfers network packet headers and sensor matrices to AI processor for routing optimization',
    signalDescription: 'High-speed UART serial channel running at 921,600 baud',
    waypoints: [[1015, 210], [1065, 210], [1065, 270], [1115, 270]]
  },
  {
    id: 'w-ai-mcu-tx',
    name: 'AMD Versal Neural Inference Results to STM32',
    busType: 'UART',
    sourceComponentId: 'ai_jetson_orin',
    sourcePinId: 'uart_tx',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'uart1_rx',
    color: '#a855f7',
    colorName: 'Purple (High-Speed UART)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Returns neural acoustic spectrogram classifications and optimal routing decisions to STM32',
    signalDescription: 'High-speed UART serial response telemetry',
    waypoints: [[1115, 295], [1055, 295], [1055, 235], [1015, 235]]
  },
  {
    id: 'w-ai-mcu-fmc',
    name: 'High-Bandwidth Inter-Chip Bus (PCIe / FMC DMA)',
    busType: 'SPI',
    sourceComponentId: 'ai_jetson_orin',
    sourcePinId: 'pcie_lane0',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'fmc_bus',
    color: '#0284c7',
    colorName: 'Blue (High-Speed Parallel / PCIe)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Enables Direct Memory Access (DMA) streaming of raw acoustic FFT spectrograms',
    signalDescription: 'High-throughput inter-processor DMA channel',
    waypoints: [[1115, 330], [1045, 330], [1045, 270], [1015, 270]]
  },

  // ── 5. Storage Interfaces (Processors -> MicroSD & NVMe) ────────────────────
  {
    id: 'w-mcu-microsd',
    name: 'STM32 SDIO Bus to Industrial SLC MicroSD',
    busType: 'SPI',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'sdio_d0',
    destComponentId: 'storage_microsd',
    destPinId: 'dat0',
    color: '#0284c7',
    colorName: 'Blue (SDIO Storage Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Logs continuous time-series flight telemetry, battery discharge, and node state',
    signalDescription: 'High-speed SDIO 4-bit data bus operating at 50 MHz',
    waypoints: [[918, 460], [918, 560], [915, 560], [915, 685]]
  },
  {
    id: 'w-ai-nvme-pcie',
    name: 'AMD Versal PCIe Gen3 x2 Link to Industrial NVMe SSD',
    busType: 'SPI',
    sourceComponentId: 'ai_jetson_orin',
    sourcePinId: 'pcie_nvme',
    destComponentId: 'storage_emmc_nvme',
    destPinId: 'pcie_lane0',
    color: '#0284c7',
    colorName: 'Blue (PCIe Gen3 Storage)',
    voltage: '3.3V Differential',
    connectionPurpose: 'High-bandwidth storage of multi-gigabyte raw acoustic hydrophone audio recordings',
    signalDescription: 'PCIe Gen3 x2 high-speed data stream writing at up to 1.5 GB/s',
    waypoints: [[1212, 460], [1212, 560], [1200, 560], [1200, 685]]
  },

  // ── 6. Power Distribution Path (Batteries -> Path Mgr -> DC-DC -> Loads) ────
  {
    id: 'w-pri-bat-path',
    name: 'Micro Nuclear Battery (+) Feed to Power Path Manager',
    busType: 'POWER',
    sourceComponentId: 'pwr_primary_battery',
    sourcePinId: 'vout_pos',
    destComponentId: 'pwr_path_mgmt',
    destPinId: 'pri_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: 'Low-Voltage DC (Conceptual)',
    connectionPurpose: 'Feeds proposed conceptual micro nuclear battery trickle output into ideal diode controller',
    signalDescription: 'Continuous long-duration low-voltage DC trickle rail',
    waypoints: [[336, 81], [336, 195], [303, 195], [303, 285]]
  },
  {
    id: 'w-pri-bat-gnd',
    name: 'Micro Nuclear Battery Ground Return to Common Bus',
    busType: 'GROUND',
    sourceComponentId: 'pwr_primary_battery',
    sourcePinId: 'vout_neg',
    destComponentId: 'pwr_path_mgmt',
    destPinId: 'gnd',
    color: '#0f172a',
    colorName: 'Black (Ground Return)',
    voltage: '0.0V Ground Reference',
    connectionPurpose: 'Completes ground return circuit for the conceptual micro nuclear battery trickle source.',
    signalDescription: 'System ground return path for primary micro power unit.',
    waypoints: [[409, 81], [409, 215], [440, 215], [440, 320]]
  },
  {
    id: 'w-sec-bat-bms',
    name: 'Rechargeable LiPo Backup Battery Pack to BMS Board',
    busType: 'POWER',
    sourceComponentId: 'pwr_backup_battery',
    sourcePinId: 'bat_pos',
    destComponentId: 'pwr_bms',
    destPinId: 'b_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: 'DC Buffer Rail',
    connectionPurpose: 'Connects secondary high-current LiPo pouch buffer battery to BMS protection and balancing circuit',
    signalDescription: 'High-rate multi-cell LiPo pouch buffer connection to BMS board',
    waypoints: [[660, 79], [660, 195], [555, 195], [555, 280]]
  },
  {
    id: 'w-bms-path-mgr',
    name: 'Protected LiPo Buffer Power to Power Path Manager',
    busType: 'POWER',
    sourceComponentId: 'pwr_bms',
    sourcePinId: 'p_pos',
    destComponentId: 'pwr_path_mgmt',
    destPinId: 'sec_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+14.8V DC',
    connectionPurpose: 'Supplies buffered surge power during high-energy acoustic transmission bursts',
    signalDescription: 'BMS-protected high-current secondary power feed',
    waypoints: [[665, 280], [665, 235], [440, 235], [440, 285]]
  },
  {
    id: 'w-wetmate-path-mgr',
    name: 'External Wet-Mate Power Feed to Power Path Manager',
    busType: 'POWER',
    sourceComponentId: 'interface_wetmate_power',
    sourcePinId: 'v_bus_in',
    destComponentId: 'pwr_path_mgmt',
    destPinId: 'ext_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+24V DC',
    connectionPurpose: 'Supplies external surface/docking power when submersible is plugged into wet-mate connector',
    signalDescription: 'High-current external DC power line',
    waypoints: [[195, 100], [245, 100], [245, 320], [303, 320]]
  },
  {
    id: 'w-path-dcdc-main',
    name: 'Multiplexed Main DC Bus to DC-DC Regulators',
    busType: 'POWER',
    sourceComponentId: 'pwr_path_mgmt',
    sourcePinId: 'sys_out',
    destComponentId: 'pwr_dcdc_converters',
    destPinId: 'vin',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+14.4V - +24V DC',
    connectionPurpose: 'Feeds selected optimal system power source into multi-rail switching regulators',
    signalDescription: 'Main unregulated DC system power bus',
    waypoints: [[372, 335], [372, 460]]
  },
  {
    id: 'w-dcdc-amp-12v',
    name: 'DC-DC +12V Isolated Rail to Acoustic Power Amplifier',
    busType: 'POWER',
    sourceComponentId: 'pwr_dcdc_converters',
    sourcePinId: 'v12_out',
    destComponentId: 'acoustics_power_amp',
    destPinId: 'vcc_12v',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+12V DC Regulated',
    connectionPurpose: 'Supplies high-current power to 100W acoustic transducer driver',
    signalDescription: 'High-current regulated power rail designed for 8A transient pulses',
    waypoints: [[443, 473], [480, 473], [480, 615], [1747, 615], [1747, 300]]
  },
  {
    id: 'w-dcdc-mcu-3v3',
    name: 'DC-DC +3.3V System Rail to STM32 Controller',
    busType: 'POWER',
    sourceComponentId: 'pwr_dcdc_converters',
    sourcePinId: 'v33_out',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'vdd_3v3',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+3.3V DC Regulated',
    connectionPurpose: 'Powers primary microcontroller, clock oscillators, and digital peripherals',
    signalDescription: 'Ultra-stable low-noise digital VDD power rail',
    waypoints: [[443, 521], [480, 521], [480, 570], [735, 570], [735, 210], [818, 210]]
  },
  {
    id: 'w-dcdc-ai-core',
    name: 'DC-DC +3.3V Core Rail to AMD Versal AI Edge SoC',
    busType: 'POWER',
    sourceComponentId: 'pwr_dcdc_converters',
    sourcePinId: 'v33_out',
    destComponentId: 'ai_jetson_orin',
    destPinId: 'vdd_core',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+3.3V DC Regulated',
    connectionPurpose: 'Powers AI engine I/O blocks and internal point-of-load core regulators',
    signalDescription: 'High-current regulated power feed for adaptive neural processor',
    waypoints: [[443, 521], [480, 521], [480, 580], [1075, 580], [1075, 210], [1115, 210]]
  },
  {
    id: 'w-dcdc-sensor-5v',
    name: 'DC-DC +5V Clean Rail to Subsea Pressure Transducer',
    busType: 'POWER',
    sourceComponentId: 'pwr_dcdc_converters',
    sourcePinId: 'v5_out',
    destComponentId: 'sensor_subsea_pressure',
    destPinId: 'vcc',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+5.0V DC Regulated',
    connectionPurpose: 'Supplies regulated 5V power to precision oceanographic pressure sensor',
    signalDescription: 'Clean analog supply filtered with LC network',
    waypoints: [[443, 497], [443, 560], [70, 560], [70, 698]]
  },
  {
    id: 'w-dcdc-pwr-mon',
    name: 'Main Bus Current Sense Line to INA226 Monitor',
    busType: 'POWER',
    sourceComponentId: 'pwr_dcdc_converters',
    sourcePinId: 'vin',
    destComponentId: 'pwr_monitor_ic',
    destPinId: 'vin_sense',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+14.4V DC',
    connectionPurpose: 'High-side current shunt tap measuring total node electrical consumption',
    signalDescription: 'Precision Kelvin voltage sense tap across 10 mΩ shunt',
    waypoints: [[372, 460], [372, 410], [538, 410], [538, 480]]
  },
  {
    id: 'w-pwr-mon-mcu-sda',
    name: 'INA226 Power Telemetry I2C Data to STM32',
    busType: 'I2C',
    sourceComponentId: 'pwr_monitor_ic',
    sourcePinId: 'sda',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'i2c1_sda',
    color: '#06b6d4',
    colorName: 'Cyan (I2C Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Reports milliwatt-hour energy depletion and voltage telemetry to SNC controller',
    signalDescription: 'I2C telemetry stream reporting battery reserve percentage',
    waypoints: [[675, 480], [745, 480], [745, 270], [818, 270]]
  },
  {
    id: 'w-mcu-pwr-mon-scl',
    name: 'STM32 I2C Clock to INA226 Monitor',
    busType: 'I2C',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'i2c1_scl',
    destComponentId: 'pwr_monitor_ic',
    destPinId: 'scl',
    color: '#06b6d4',
    colorName: 'Cyan (I2C Bus)',
    voltage: '3.3V Logic',
    connectionPurpose: 'I2C clock synchronization',
    signalDescription: 'Shared I2C clock line',
    waypoints: [[818, 295], [755, 295], [755, 510], [675, 510]]
  },

  // ── 7. External Interfaces & Status Indicators ──────────────────────────────
  {
    id: 'w-wetmate-mcu-eth',
    name: 'Subsea Wet-Mate Ethernet Data to STM32 MAC',
    busType: 'UART',
    sourceComponentId: 'interface_wetmate_data',
    sourcePinId: 'eth_rx_p',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'eth_rxd0',
    color: '#a855f7',
    colorName: 'Purple (High-Speed Ethernet Data)',
    voltage: '3.3V Differential',
    connectionPurpose: 'Allows rapid bulk offloading of mission sensor logs when plugged in at surface',
    signalDescription: '100BASE-TX differential receive channel',
    waypoints: [[1560, 555], [1400, 555], [1400, 525], [790, 525], [790, 450], [818, 450]]
  },
  {
    id: 'w-debug-mcu-swdio',
    name: 'Diagnostic SWD Data Line to STM32 Core',
    busType: 'GPIO/PWM',
    sourceComponentId: 'interface_debug_port',
    sourcePinId: 'swdio',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'swdio',
    color: '#22c55e',
    colorName: 'Green (SWD Debug)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Enables in-circuit firmware programming and register inspection',
    signalDescription: 'Bi-directional ARM Cortex Serial Wire Debug line',
    waypoints: [[1670, 555], [1610, 555], [1610, 535], [780, 535], [780, 390], [818, 390]]
  },
  {
    id: 'w-debug-mcu-swclk',
    name: 'Diagnostic SWD Clock Line to STM32 Core',
    busType: 'GPIO/PWM',
    sourceComponentId: 'interface_debug_port',
    sourcePinId: 'swclk',
    destComponentId: 'mcu_stm32h7',
    destPinId: 'swclk',
    color: '#22c55e',
    colorName: 'Green (SWD Debug)',
    voltage: '3.3V Logic',
    connectionPurpose: 'Hardware debugger clock synchronization',
    signalDescription: 'SWD Clock input line',
    waypoints: [[1670, 580], [1610, 580], [1610, 545], [770, 545], [770, 415], [818, 415]]
  },
  {
    id: 'w-mcu-led-pwr',
    name: 'STM32 Power Good Driver to Marine Status Panel',
    busType: 'GPIO/PWM',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'gpio_pwr_led',
    destComponentId: 'led_indicators_panel',
    destPinId: 'pwr_in',
    color: '#22c55e',
    colorName: 'Green (GPIO Indicator)',
    voltage: '3.3V Active-High',
    connectionPurpose: 'Illuminates green indicator lens confirming power rails are in regulation',
    signalDescription: 'Digital output drive current to green status LED',
    waypoints: [[1015, 440], [1055, 440], [1055, 480], [1915, 480], [1915, 548]]
  },
  {
    id: 'w-mcu-led-comm',
    name: 'STM32 Acoustic TX Active Driver to Marine Panel',
    busType: 'GPIO/PWM',
    sourceComponentId: 'mcu_stm32h7',
    sourcePinId: 'gpio_comm_led',
    destComponentId: 'led_indicators_panel',
    destPinId: 'comm_in',
    color: '#22c55e',
    colorName: 'Green (GPIO Indicator)',
    voltage: '3.3V Active-High',
    connectionPurpose: 'Flashes blue optical lens during active acoustic acoustic burst transmission',
    signalDescription: 'Digital pulse output driving blue status LED',
    waypoints: [[1015, 460], [1065, 460], [1065, 490], [1995, 490], [1995, 548]]
  }
];

const ARDUINO_COMPONENTS: CircuitComponent[] = [
  {
    id: 'arduino_uno',
    name: 'Arduino Uno R3 Microcontroller',
    category: 'MCU',
    modelNumber: 'ATmega328P DIP (Tinkercad Native)',
    status: 'SIMULATED',
    imageSrc: '/assets/hardware/arduino_uno.png',
    x: 50,
    y: 110,
    width: 260,
    height: 215,
    description: 'The standard Tinkercad Circuits reference microcontroller based on the Microchip ATmega328P 8-bit AVR architecture @ 16 MHz.',
    roleInMarislink: 'Serves as the Tinkercad Classroom Demonstration Model equivalent to the production 32-bit Embedded Controller DevKit node.',
    protocol: 'I2C (Pins A4/A5), 10-Bit ADC (A0-A3), 5V Digital I/O (D2, D4, D7)',
    operatingVoltage: '5.0V DC (via USB or 7-12V DC Jack)',
    currentDraw: '~45 mA',
    tinkercadEquivNote: 'Natively supported in Tinkercad Circuits workspace.',
    pins: [
      { id: '3v3', label: '3.3V', x: 118, y: 175, type: 'POWER', description: '3.3V Auxiliary Output' },
      { id: '5v', label: '5V', x: 127, y: 175, type: 'POWER', description: '5V Regulated Positive Power Rail' },
      { id: 'gnd1', label: 'GND', x: 136, y: 175, type: 'GROUND', description: 'Power Ground Pin 1' },
      { id: 'gnd2', label: 'GND', x: 146, y: 175, type: 'GROUND', description: 'Power Ground Pin 2' },
      { id: 'vin', label: 'VIN', x: 155, y: 175, type: 'POWER', description: 'Raw External Voltage Input' },
      { id: 'a0', label: 'A0', x: 169, y: 175, type: 'ADC', description: 'Analog Input 0: Battery Divider Voltage' },
      { id: 'a1', label: 'A1', x: 178, y: 175, type: 'ADC', description: 'Analog Input 1: TMP36 Temperature Sensor (10mV/°C)' },
      { id: 'a2', label: 'A2', x: 187, y: 175, type: 'ADC', description: 'Analog Input 2: Hydrostatic Pressure Potentiometer' },
      { id: 'a3', label: 'A3', x: 197, y: 175, type: 'ADC', description: 'Analog Input 3: Acoustic Signal RSSI Potentiometer' },
      { id: 'a4', label: 'A4', x: 206, y: 175, type: 'I2C', description: 'I2C Serial Data (SDA) to LCD1602 Display' },
      { id: 'a5', label: 'A5', x: 215, y: 175, type: 'I2C', description: 'I2C Serial Clock (SCL) to LCD1602 Display' },
      { id: 'gnd_d', label: 'GND', x: 120, y: 49, type: 'GROUND', description: 'Digital Header Ground Reference' },
      { id: 'd7', label: 'D7', x: 146, y: 49, type: 'GPIO', description: 'Digital Pin 7: Red Critical Alert Fault' },
      { id: 'd4', label: 'D4', x: 164, y: 49, type: 'GPIO', description: 'Digital Pin 4: Yellow Carrier Sync Lock' },
      { id: 'd2', label: 'D2', x: 178, y: 49, type: 'GPIO', description: 'Digital Pin 2: Green Acoustic TX Pulse' },
      { id: 'd1', label: 'D1', x: 185, y: 49, type: 'UART', description: 'Serial Transmit Pin (USB/TTL)' },
      { id: 'd0', label: 'D0', x: 192, y: 49, type: 'UART', description: 'Serial Receive Pin (USB/TTL)' }
    ]
  },
  {
    id: 'breadboard_half',
    name: 'Half Prototyping Breadboard',
    category: 'BREADBOARD',
    modelNumber: '400 Tie-Point Solderless',
    status: 'SIMULATED',
    imageSrc: '/assets/hardware/breadboard_half.png',
    x: 340,
    y: 100,
    width: 370,
    height: 240,
    description: 'Standard Tinkercad prototyping breadboard with upper and lower dual power distribution bus strips and 30 columns of 5-pin tie-points.',
    roleInMarislink: 'Hosts the TMP36 temperature sensor, pressure potentiometer, and status LED circuits exactly as featured in the reference tutorial.',
    protocol: 'Passive Electrical Interconnect',
    operatingVoltage: '5V DC Bus Rails',
    currentDraw: '0 mA',
    pins: [
      { id: 'pwr_top_plus', label: 'Top (+)', x: 40, y: 32, type: 'POWER', description: 'Top Positive 5V Power Rail' },
      { id: 'pwr_top_minus', label: 'Top (-)', x: 40, y: 52, type: 'GROUND', description: 'Top Ground Return Rail' },
      { id: 'pwr_bot_plus', label: 'Bot (+)', x: 40, y: 192, type: 'POWER', description: 'Bottom Positive 5V Power Rail' },
      { id: 'pwr_bot_minus', label: 'Bot (-)', x: 40, y: 212, type: 'GROUND', description: 'Bottom Ground Return Rail' },
      { id: 'row_led_green', label: 'Row 14', x: 205, y: 130, type: 'GPIO', description: 'Row 14 Green LED Terminal' },
      { id: 'row_led_yellow', label: 'Row 18', x: 245, y: 130, type: 'GPIO', description: 'Row 18 Yellow LED Terminal' },
      { id: 'row_led_red', label: 'Row 22', x: 285, y: 130, type: 'GPIO', description: 'Row 22 Red LED Terminal' }
    ]
  },
  {
    id: 'tmp36',
    name: 'TMP36 Temperature Sensor',
    category: 'SENSOR',
    modelNumber: 'Analog Devices TMP36 (TO-92)',
    status: 'SIMULATED',
    imageSrc: '/assets/hardware/tmp36.png',
    x: 500,
    y: 155,
    width: 70,
    height: 70,
    description: 'Low-voltage, precision analog temperature sensor providing a linear voltage output proportional to Celsius temperature (10 mV/°C with a 500 mV offset at 0°C).',
    roleInMarislink: 'Direct classroom simulation of ocean temperature monitoring, mirroring the beginner-friendly Tinkercad reference video demonstration.',
    protocol: 'Linear DC Voltage (10 mV/°C)',
    operatingVoltage: '2.7V - 5.5V DC',
    currentDraw: '~50 µA',
    tinkercadEquivNote: 'Natively modeled in Tinkercad with an interactive temperature slider (-40°C to +125°C).',
    pins: [
      { id: 'vcc', label: 'VCC (+)', x: 18, y: 55, type: 'POWER', description: 'Pin 1: +5V Power Supply' },
      { id: 'vout', label: 'VOUT', x: 35, y: 55, type: 'ADC', description: 'Pin 2: Analog Voltage Out to Arduino A1' },
      { id: 'gnd', label: 'GND (-)', x: 52, y: 55, type: 'GROUND', description: 'Pin 3: Ground Return' }
    ]
  },
  {
    id: 'lcd_1602',
    name: '16x2 Character LCD Display',
    category: 'DISPLAY',
    modelNumber: 'HD44780 + PCF8574 I2C Backpack',
    status: 'SIMULATED',
    imageSrc: '/assets/hardware/lcd_1602.png',
    x: 740,
    y: 110,
    width: 270,
    height: 140,
    description: 'Classic 16-character by 2-line alphanumeric LCD display with I2C piggyback daughterboard, matching the reference tutorial hardware.',
    roleInMarislink: 'Presents real-time node operational status, calibrated temperature, simulated depth pressure, and communication state for demonstrations.',
    protocol: 'I2C (Address: 0x27 / 0x3F)',
    operatingVoltage: '5.0V DC',
    currentDraw: '~25 mA with LED backlight',
    tinkercadEquivNote: 'Natively supported in Tinkercad Circuits workspace.',
    pins: [
      { id: 'gnd', label: 'GND', x: 20, y: 15, type: 'GROUND', description: 'Ground Supply' },
      { id: 'vcc', label: 'VCC', x: 50, y: 15, type: 'POWER', description: '+5V Power Supply' },
      { id: 'sda', label: 'SDA', x: 80, y: 15, type: 'I2C', description: 'I2C Serial Data line' },
      { id: 'scl', label: 'SCL', x: 110, y: 15, type: 'I2C', description: 'I2C Serial Clock line' }
    ]
  }
];

const ARDUINO_WIRES: CircuitWire[] = [
  // ── Power distribution from Arduino to Breadboard ─────────────────────────
  {
    id: 'wa-pwr-5v',
    name: 'Arduino 5V Rail to Breadboard Positive Strip',
    busType: 'POWER',
    sourceComponentId: 'arduino_uno',
    sourcePinId: '5v',
    destComponentId: 'breadboard_half',
    destPinId: 'pwr_bot_plus',
    color: '#ef4444',
    colorName: 'Red (+5V)',
    voltage: '+5.0V DC Regulated',
    signalDescription: 'Supplies regulated 5V DC from the Arduino Uno on-board voltage regulator to the lower breadboard power bus.',
    waypoints: [[177, 285], [177, 430], [390, 430], [390, 382]]
  },
  {
    id: 'wa-pwr-gnd',
    name: 'Arduino GND to Breadboard Negative Strip',
    busType: 'GROUND',
    sourceComponentId: 'arduino_uno',
    sourcePinId: 'gnd1',
    destComponentId: 'breadboard_half',
    destPinId: 'pwr_bot_minus',
    color: '#0f172a',
    colorName: 'Black (GND)',
    voltage: '0.0V Ground',
    signalDescription: 'Provides common ground return between Arduino Uno and breadboard components.',
    waypoints: [[186, 285], [186, 445], [405, 445], [405, 402]]
  },

  // ── TMP36 Sensor on Breadboard ────────────────────────────────────────────
  {
    id: 'wa-tmp-vcc',
    name: 'Breadboard 5V to TMP36 +Vs Pin',
    busType: 'POWER',
    sourceComponentId: 'breadboard_half',
    sourcePinId: 'pwr_bot_plus',
    destComponentId: 'tmp36',
    destPinId: 'vcc',
    color: '#ef4444',
    colorName: 'Red (+5V)',
    voltage: '+5.0V DC',
    signalDescription: 'Powers the TMP36 analog temperature transducer from the lower positive breadboard rail.',
    waypoints: [[390, 382], [390, 310], [498, 310], [498, 245]]
  },
  {
    id: 'wa-tmp-gnd',
    name: 'Breadboard GND to TMP36 GND Pin',
    busType: 'GROUND',
    sourceComponentId: 'breadboard_half',
    sourcePinId: 'pwr_bot_minus',
    destComponentId: 'tmp36',
    destPinId: 'gnd',
    color: '#0f172a',
    colorName: 'Black (GND)',
    voltage: '0.0V Ground',
    signalDescription: 'Ground return for the TMP36 temperature sensor.',
    waypoints: [[405, 402], [405, 325], [532, 325], [532, 245]]
  },
  {
    id: 'wa-tmp-analog',
    name: 'TMP36 Vout to Arduino Analog Pin A1',
    busType: 'ADC',
    sourceComponentId: 'tmp36',
    sourcePinId: 'vout',
    destComponentId: 'arduino_uno',
    destPinId: 'a1',
    color: '#f97316',
    colorName: 'Orange (Analog A1)',
    voltage: '0.1V - 1.75V DC Analog',
    signalDescription: 'Analog temperature voltage line ($V_{out} = 10mV/°C + 500mV$). Sampled by Arduino 10-bit ADC (0-1023 counts).',
    waypoints: [[515, 245], [515, 340], [228, 340], [228, 285]]
  },

  // ── LCD1602 Display (I2C on A4/A5) ────────────────────────────────────────
  {
    id: 'wa-lcd-pwr',
    name: '5V Power Rail to LCD1602 Display',
    busType: 'POWER',
    sourceComponentId: 'breadboard_half',
    sourcePinId: 'pwr_bot_plus',
    destComponentId: 'lcd_1602',
    destPinId: 'vcc',
    color: '#ef4444',
    colorName: 'Red (+5V)',
    voltage: '+5.0V DC',
    signalDescription: 'Supplies 5V DC power for character LCD logic and LED backlight.',
    waypoints: [[390, 382], [390, 460], [790, 460], [790, 145]]
  },
  {
    id: 'wa-lcd-gnd',
    name: 'Ground Rail to LCD1602 Display',
    busType: 'GROUND',
    sourceComponentId: 'breadboard_half',
    sourcePinId: 'pwr_bot_minus',
    destComponentId: 'lcd_1602',
    destPinId: 'gnd',
    color: '#0f172a',
    colorName: 'Black (GND)',
    voltage: '0.0V Ground',
    signalDescription: 'Common ground connection for LCD display module.',
    waypoints: [[405, 402], [405, 475], [760, 475], [760, 145]]
  },
  {
    id: 'wa-lcd-sda',
    name: 'Arduino Pin A4 (SDA) to LCD I2C Backpack',
    busType: 'I2C',
    sourceComponentId: 'arduino_uno',
    sourcePinId: 'a4',
    destComponentId: 'lcd_1602',
    destPinId: 'sda',
    color: '#0284c7',
    colorName: 'Blue (I2C SDA)',
    voltage: '5V Bidirectional Data',
    signalDescription: 'ATmega328P hardware I2C Data line on pin A4 streaming character bytes to LCD controller address 0x27.',
    waypoints: [[256, 285], [256, 355], [820, 355], [820, 145]]
  },
  {
    id: 'wa-lcd-scl',
    name: 'Arduino Pin A5 (SCL) to LCD I2C Backpack',
    busType: 'I2C',
    sourceComponentId: 'arduino_uno',
    sourcePinId: 'a5',
    destComponentId: 'lcd_1602',
    destPinId: 'scl',
    color: '#eab308',
    colorName: 'Yellow (I2C SCL)',
    voltage: '5V Clock Pulses (100 kHz)',
    signalDescription: 'ATmega328P hardware I2C Clock line on pin A5 synchronizing byte transfers to the character LCD.',
    waypoints: [[265, 285], [265, 370], [850, 370], [850, 145]]
  },

  // ── Digital GPIO Status LEDs on Breadboard ────────────────────────────────
  {
    id: 'wa-led-tx',
    name: 'Digital Pin D2 to Green TX LED (Row 14)',
    busType: 'GPIO',
    sourceComponentId: 'arduino_uno',
    sourcePinId: 'd2',
    destComponentId: 'breadboard_half',
    destPinId: 'row_led_green',
    color: '#22c55e',
    colorName: 'Green (Digital D2)',
    voltage: '5V Active-High Pulse',
    signalDescription: 'Digital output pin 2 pulsing green TX LED on breadboard row 14 through an inline 220Ω resistor.',
    waypoints: [[228, 159], [228, 70], [545, 70], [545, 230]]
  },
  {
    id: 'wa-led-sync',
    name: 'Digital Pin D4 to Yellow Sync LED (Row 18)',
    busType: 'GPIO',
    sourceComponentId: 'arduino_uno',
    sourcePinId: 'd4',
    destComponentId: 'breadboard_half',
    destPinId: 'row_led_yellow',
    color: '#ca8a04',
    colorName: 'Amber (Digital D4)',
    voltage: '5V Active-High Constant',
    signalDescription: 'Digital output pin 4 illuminating yellow synchronization lock LED on breadboard row 18.',
    waypoints: [[214, 159], [214, 55], [585, 55], [585, 230]]
  },
  {
    id: 'wa-led-alert',
    name: 'Digital Pin D7 to Red Alert LED (Row 22)',
    busType: 'GPIO',
    sourceComponentId: 'arduino_uno',
    sourcePinId: 'd7',
    destComponentId: 'breadboard_half',
    destPinId: 'row_led_red',
    color: '#dc2626',
    colorName: 'Crimson (Digital D7)',
    voltage: '5V Active-High Alert',
    signalDescription: 'Digital output pin 7 triggering red fault LED on breadboard row 22 during simulated critical threshold breach.',
    waypoints: [[196, 159], [196, 40], [625, 40], [625, 230]]
  },
];

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


// ── COMPONENT HELPER COMPONENT (renders SVG shape for each part) ──────────

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
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'MCU': return '#0284c7';
      case 'AI_PROCESSOR': return '#7c3aed';
      case 'ACOUSTIC': return '#a855f7';
      case 'SENSOR': return '#059669';
      case 'POWER': return '#dc2626';
      case 'COMMUNICATION': return '#d97706';
      case 'STORAGE': return '#10b981';
      case 'INDICATOR': return '#16a34a';
      default: return '#64748b';
    }
  };

  const getPinColor = (type: string) => {
    switch (type) {
      case 'POWER': return '#ef4444';
      case 'GROUND': return '#1e293b';
      case 'I2C': return '#06b6d4';
      case 'SPI': return '#3b82f6';
      case 'UART': return '#a855f7';
      case 'ADC':
      case 'DAC': return '#f97316';
      case 'GPIO':
      case 'PWM': return '#10b981';
      case 'USB':
      case 'PCIe': return '#2563eb';
      default: return '#64748b';
    }
  };

  const catColor = getCategoryColor(comp.category);

  const badgeWidth = Math.max(comp.width - 6, 135);
  const badgeHeight = 38;
  const badgeX = comp.x + (comp.width - badgeWidth) / 2;
  const badgeY = comp.y + comp.height + 4;

  const statusText = comp.status === 'ARCHITECTURAL'
    ? 'PROPOSED ARCHITECTURAL'
    : (comp.status || 'IMPLEMENTED');

  const statusColor = statusText.includes('ARCHITECTURAL')
    ? '#d97706'
    : statusText === 'IMPLEMENTED'
      ? '#0284c7'
      : '#2563eb';

  return (
    <g
      id={`comp-${comp.id}`}
      className={`circuit-component-group ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectComponent(comp);
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Selection Halo around component when selected */}
      {isSelected && (
        <rect
          x={comp.x - 4}
          y={comp.y - 4}
          width={comp.width + 8}
          height={comp.height + 8}
          rx={8}
          fill="rgba(2, 132, 199, 0.08)"
          stroke="#0284c7"
          strokeWidth={2.5}
          strokeDasharray="5 3"
        />
      )}

      {/* Component Hover Indicator (vector-crisp outline) */}
      <rect
        x={comp.x - 2}
        y={comp.y - 2}
        width={comp.width + 4}
        height={comp.height + 4}
        rx={8}
        fill="none"
        stroke="#38bdf8"
        strokeWidth={1.5}
        className="component-hover-halo"
        pointerEvents="none"
      />

      {/* Subtle Vector Backing Card for Physical Hardware Depth without raster pixelation */}
      <rect
        x={comp.x + 2}
        y={comp.y + 3}
        width={comp.width - 4}
        height={comp.height - 3}
        rx={6}
        fill="rgba(15, 23, 42, 0.08)"
        pointerEvents="none"
      />

      {/* Realistic Hardware Component Image - rendered directly on canvas at native resolution */}
      {comp.imageSrc ? (
        <image
          href={comp.imageSrc}
          x={comp.x}
          y={comp.y}
          width={comp.width}
          height={comp.height}
          preserveAspectRatio="xMidYMid meet"
          className="component-realistic-img"
          imageRendering="optimizeQuality"
          style={{
            pointerEvents: 'none'
          }}
        />
      ) : (
        /* Fallback schematic representation only if image is absent */
        <g>
          <rect
            x={comp.x}
            y={comp.y}
            width={comp.width}
            height={comp.height}
            rx={6}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth={1.5}
          />
          <text
            x={comp.x + comp.width / 2}
            y={comp.y + comp.height / 2}
            textAnchor="middle"
            fill={catColor}
            fontSize={11}
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            {comp.name}
          </text>
        </g>
      )}

      {/* Transparent Click Hitbox over component body */}
      <rect
        x={comp.x}
        y={comp.y}
        width={comp.width}
        height={comp.height}
        fill="transparent"
        className="component-hitbox"
      />

      {/* Component Solder Terminals / Pin Dots Layer */}
      {comp.pins.map((pin) => {
        const pinColor = getPinColor(pin.type);
        const pinKey = `${comp.id}:${pin.id}`;
        const isPinHighlighted = highlightedPinId === pinKey;

        return (
          <g
            key={pin.id}
            className={`component-pin ${isPinHighlighted ? 'pin-highlighted' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPin(comp, pin);
            }}
          >
            {/* Expanded Hitbox */}
            <circle
              cx={comp.x + pin.x}
              cy={comp.y + pin.y}
              r={8}
              fill="transparent"
              className="pin-hitbox"
            />
            {/* Solder Land Dot */}
            <circle
              cx={comp.x + pin.x}
              cy={comp.y + pin.y}
              r={3.8}
              fill={pinColor}
              stroke="#ffffff"
              strokeWidth={1.2}
              className="pin-solder-dot"
            />
            {/* High-Contrast Pin Label */}
            <text
              x={comp.x + pin.x}
              y={comp.y + pin.y + (pin.y > comp.height / 2 ? 10 : -7)}
              textAnchor="middle"
              fill="#0f172a"
              fontSize={7.5}
              fontWeight="700"
              fontFamily="system-ui, sans-serif"
              style={{
                paintOrder: 'stroke',
                stroke: '#ffffff',
                strokeWidth: 2,
                strokeLinejoin: 'round'
              }}
            >
              {pin.label}
            </text>
          </g>
        );
      })}

      {/* Floating Info Badge Card Below Component */}
      <g className="component-info-card">
        {/* Vector Shadow Card */}
        <rect
          x={badgeX + 1}
          y={badgeY + 2}
          width={badgeWidth}
          height={badgeHeight}
          rx={5}
          fill="rgba(15, 23, 42, 0.07)"
          pointerEvents="none"
        />
        <rect
          x={badgeX}
          y={badgeY}
          width={badgeWidth}
          height={badgeHeight}
          rx={5}
          fill="#ffffff"
          stroke={isSelected ? '#0284c7' : '#e2e8f0'}
          strokeWidth={isSelected ? 1.8 : 1}
          className="component-card-bg"
        />

        {/* Line 1: Component Title */}
        <text
          x={badgeX + badgeWidth / 2}
          y={badgeY + 12}
          textAnchor="middle"
          fill="#0f172a"
          fontSize={comp.name.length > 28 ? 7.6 : 8.5}
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {comp.name}
        </text>

        {/* Line 2: Model & Specification */}
        <text
          x={badgeX + badgeWidth / 2}
          y={badgeY + 22}
          textAnchor="middle"
          fill="#64748b"
          fontSize={7.2}
          fontFamily="system-ui, sans-serif"
        >
          {comp.modelNumber}
        </text>

        {/* Line 3: Architectural / Implementation Status */}
        <text
          x={badgeX + badgeWidth / 2}
          y={badgeY + 31.5}
          textAnchor="middle"
          fill={statusColor}
          fontSize={6.8}
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
        >
          [{statusText}]
        </text>
      </g>
    </g>
  );
}

// ── 5. COMPLETE END-TO-END SYSTEM WORKFLOW SECTION (HTML FLOW BELOW CANVAS) ──

function SystemWorkflowSection({ mode: _mode }: { mode?: CircuitMode }) {
  const steps = [
    { num: '1', title: 'Sensors', desc: 'Keller 60MPa, RTD, IMU, Leak', icon: '🌊', color: '#0284c7' },
    { num: '2', title: 'STM32H7 Core', desc: 'Deterministic Data Acquisition', icon: '⚡', color: '#0d9488' },
    { num: '3', title: 'SNC Router', desc: 'Swarm Mesh & TDMA Sched.', icon: '🧠', color: '#4f46e5' },
    { num: '4', title: 'AI Engine', desc: 'Spectrogram & Anomaly Net', icon: '🤖', color: '#7c3aed' },
    { num: '5', title: 'Acoustic TX', desc: 'DDS DAC ➔ 100W Amp ➔ PZT', icon: '🔊', color: '#db2777' },
    { num: '6', title: 'Subsea Net', desc: 'Multi-Hop Acoustic Relays', icon: '📡', color: '#ea580c' },
    { num: '7', title: 'Storage', desc: 'SLC MicroSD + eMMC/NVMe', icon: '💾', color: '#059669' },
    { num: '8', title: 'Mission UI', desc: 'Spark Big Data & Dashboard', icon: '📊', color: '#d97706' },
  ];

  return (
    <section className="circuit-workflow-section" id="system-workflow-section">
      <div className="workflow-card">
        {/* Header */}
        <div className="workflow-header">
          <div className="workflow-title-wrap">
            <span className="workflow-icon">🔄</span>
            <div>
              <h3 className="workflow-title">COMPLETE END-TO-END MARISLINK SYSTEM WORKFLOW</h3>
              <p className="workflow-subtitle">
                Primary Sensor Acquisition ➔ AI Spectrogram Analysis ➔ Acoustic Physical Layer Transmission ➔ Subsea Swarm Mesh Relays
              </p>
            </div>
          </div>
          <div className="workflow-mode-tag">
            Current Architecture: <strong>Complete MARISLINK Underwater Architecture (AMD Versal™ AI Edge + STM32H7)</strong>
          </div>
        </div>

        {/* 8 Pipeline Step Cards Grid */}
        <div className="workflow-steps-container">
          <div className="workflow-steps-grid">
            {steps.map((st, i) => (
              <React.Fragment key={st.num}>
                <div className="workflow-step-card">
                  <div className="step-header">
                    <span className="step-num-pill" style={{ background: st.color }}>{st.num}</span>
                    <span className="step-title-icon">{st.icon}</span>
                  </div>
                  <h4 className="step-title">{st.title}</h4>
                  <p className="step-desc">{st.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="workflow-step-arrow">➔</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Dual Receive Acoustic Path Banner */}
        <div className="workflow-acoustic-path">
          <span className="path-badge">ACOUSTIC RECEIVING PATH:</span>
          <span className="path-text">
            Subsea Hydrophone (TC4013) ➔ Ultra-Low Noise LNA (&lt;1.2nV/√Hz) ➔ 24-bit 192kSPS ADC ➔ STM32H7 Demodulation ➔ AMD Versal AI Inference ➔ SNC Adaptive Mesh Route
          </span>
        </div>
      </div>
    </section>
  );
}

// ── 6. ADDITIONAL ARCHITECTURAL SPECIFICATIONS (BELOW WORKFLOW) ───────────────

function CircuitAdditionalInfo() {
  return (
    <section className="circuit-additional-info-section">
      <div className="additional-info-grid">
        <div className="info-card">
          <div className="info-card-header">
            <span className="info-card-icon">⚡</span>
            <h4>Hardware Architecture & Power Path</h4>
          </div>
          <p>
            MARISLINK deploys an isolated dual-rail architecture. The primary seabed power source (Micro Nuclear Battery conceptual unit / primary chemical cell) provides baseline micro-power, while an aluminum-laminated Lithium Polymer (LiPo) buffer battery pack supplies instantaneous burst current for 100W acoustic transducers without digital logic voltage drop.
          </p>
          <ul>
            <li><strong>LTC4412 Ideal Diode Multiplexer:</strong> Automatic low-loss switching between external tether power, primary supply, and LiPo buffer.</li>
            <li><strong>TI BQ76952 Smart BMS:</strong> Active cell balancing, thermal shutdown (-20°C to +65°C), and short-circuit fault isolation.</li>
            <li><strong>TI INA226 Power Monitor:</strong> High-precision I2C digital voltage and shunt current tracking across all primary rails.</li>
          </ul>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-card-icon">🌊</span>
            <h4>Physical Transducers & Hydrodynamics</h4>
          </div>
          <p>
            Ocean acoustic channels present high attenuation, multi-path Doppler shifts, and ambient noise. MARISLINK integrates matched acoustic front-ends:
          </p>
          <ul>
            <li><strong>Teledyne TC4013 Hydrophone:</strong> Omnidirectional broadband acoustic receiver (1 Hz to 170 kHz) with calibrated titanium housing.</li>
            <li><strong>Tonpilz PZT-4 Ceramic Projector:</strong> High-efficiency resonant electroacoustic transducer capable of generating &gt;185 dB re 1µPa @ 1m sound pressure.</li>
            <li><strong>AD8429 Ultra-Low-Noise LNA:</strong> Discrete subsea preamplifier with &lt;1.2nV/√Hz input voltage noise floor for weak acoustic packet reception.</li>
          </ul>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-card-icon">📊</span>
            <h4>Real-Time Ingestion & Spark Pipeline</h4>
          </div>
          <p>
            Continuous acoustic telemetry, hydrostatic pressure logs, and attitude measurements are captured deterministically by the embedded controller and streamed over encrypted telemetry interfaces into MARISLINK's Apache Spark & Scala big data processing pipeline for real-time anomaly detection.
          </p>
          <ul>
            <li><strong>Telemetry Stream:</strong> High-rate sensor frames streamed to port 5000 /api/hardware endpoints.</li>
            <li><strong>Spark Engine:</strong> Distributed batch and windowed aggregation computing signal-to-noise ratio (SNR), packet delivery ratio (PDR), and bit error rates (BER).</li>
            <li><strong>Mission Database:</strong> Cloud-synchronized historical storage maintaining long-term acoustic oceanographic telemetry.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}


// ── MAIN CIRCUIT CONNECTIONS WORKSPACE COMPONENT ─────────────────────────────

export interface CircuitConnectionsPageProps {
  onNavigateToSpark?: () => void;
}

export function CircuitConnectionsPage({ onNavigateToSpark }: CircuitConnectionsPageProps) {
  // Mode selection: default to complete_underwater (or via query parameter)
  const [mode, setMode] = useState<CircuitMode>(() => {
    try {
      const paramMode = new URLSearchParams(window.location.search).get('mode') as CircuitMode;
      if (paramMode && ['complete_underwater', 'esp32_wokwi', 'arduino_tinkercad'].includes(paramMode)) {
        return paramMode;
      }
    } catch {
      // fallback
    }
    return 'complete_underwater';
  });

  // Filter selection: default to ALL
  const [busFilter, setBusFilter] = useState<BusFilter>('ALL');

  // Selection state
  const [selectedComponent, setSelectedComponent] = useState<CircuitComponent | null>(null);
  const [selectedWire, setSelectedWire] = useState<CircuitWire | null>(null);
  const [highlightedPin, setHighlightedPin] = useState<{ compId: string; pinId: string } | null>(null);

  // Zoom & Pan state (Range 25% to 400%, Default 100%)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Active Components and Wires based on Mode
  const currentComponents = useMemo(() => {
    switch (mode) {
      case 'complete_underwater': return UNDERWATER_COMPONENTS;
      case 'esp32_wokwi': return PROTOTYPE_COMPONENTS;
      case 'arduino_tinkercad': return ARDUINO_COMPONENTS;
      default: return UNDERWATER_COMPONENTS;
    }
  }, [mode]);

  const allWires = useMemo(() => {
    switch (mode) {
      case 'complete_underwater': return UNDERWATER_WIRES;
      case 'esp32_wokwi': return PROTOTYPE_WIRES;
      case 'arduino_tinkercad': return ARDUINO_WIRES;
      default: return UNDERWATER_WIRES;
    }
  }, [mode]);

  // Filtered wires
  const currentWires = useMemo(() => {
    if (busFilter === 'ALL') return allWires;
    return allWires.filter((w) => {
      if (busFilter === 'ADC/DAC') return w.busType === 'ADC' || w.busType === 'DAC' || w.busType === 'ADC/DAC';
      if (busFilter === 'GPIO/PWM') return w.busType === 'GPIO' || w.busType === 'PWM' || w.busType === 'GPIO/PWM';
      if (busFilter === 'USB/PCIe') return w.busType === 'USB' || w.busType === 'PCIe' || w.busType === 'USB/PCIe';
      return w.busType === busFilter;
    });
  }, [allWires, busFilter]);

  // Pin coordinate lookup table
  const pinCoordMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    currentComponents.forEach((c) => {
      c.pins.forEach((p) => {
        map.set(`${c.id}:${p.id}`, { x: c.x + p.x, y: c.y + p.y });
      });
    });
    return map;
  }, [currentComponents]);

  // Zoom controls (25% to 400%)
  const handleZoomStep = useCallback((delta: number) => {
    setZoom((prev) => Math.min(Math.max(Math.round((prev + delta) * 100) / 100, 0.25), 4.0));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setSelectedComponent(null);
    setSelectedWire(null);
    setHighlightedPin(null);
  }, []);

  // Fit Entire Circuit onto screen
  const handleFitCircuit = useCallback(() => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let minX = 30, minY = 30, maxX = 2100, maxY = 860;
    if (mode === 'complete_underwater') {
      minX = 20; minY = 20; maxX = 2120; maxY = 860;
    } else if (mode === 'esp32_wokwi') {
      minX = 10; minY = 10; maxX = 1100; maxY = 700;
    } else {
      minX = 10; minY = 10; maxX = 1050; maxY = 650;
    }

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const scaleX = (rect.width - 48) / contentW;
    const scaleY = (rect.height - 48) / contentH;
    const fitZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 2.5);

    const centerCanvasX = rect.width / 2;
    const centerCanvasY = rect.height / 2;
    const centerContentX = (minX + maxX) / 2;
    const centerContentY = (minY + maxY) / 2;

    setZoom(Math.round(fitZoom * 100) / 100);
    setPan({
      x: Math.round(centerCanvasX - centerContentX * fitZoom),
      y: Math.round(centerCanvasY - centerContentY * fitZoom),
    });
  }, [mode]);

  // Auto-fit on mode switch or read URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode') as CircuitMode | null;
    if (m && (m === 'complete_underwater' || m === 'esp32_wokwi' || m === 'arduino_tinkercad')) {
      if (mode !== m) {
        setMode(m);
        return;
      }
    }

    const compId = params.get('comp') || params.get('component');
    if (compId) {
      const found = currentComponents.find((c) => c.id === compId);
      if (found) setSelectedComponent(found);
    }

    const z = parseFloat(params.get('zoom') || '');
    const px = parseFloat(params.get('panX') || '');
    const py = parseFloat(params.get('panY') || '');
    if (!isNaN(z) && z >= 0.25 && z <= 4.0) {
      setZoom(z);
      if (!isNaN(px) && !isNaN(py)) {
        setPan({ x: px, y: py });
      }
      return;
    }

    const timer = setTimeout(() => {
      handleFitCircuit();
    }, 60);
    return () => clearTimeout(timer);
  }, [mode, handleFitCircuit, currentComponents]);

  // Fullscreen toggle callback
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        const elem = containerRef.current;
        if (elem && elem.requestFullscreen && !document.fullscreenElement) {
          elem.requestFullscreen().catch(() => {
            // CSS fullscreen fallback takes effect automatically
          });
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
      setTimeout(() => {
        handleFitCircuit();
      }, 120);
      return next;
    });
  }, [handleFitCircuit]);

  // Sync fullscreen change & Esc key events
  useEffect(() => {
    const onFullscreenChange = () => {
      const isDocFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isDocFs);
      setTimeout(() => {
        handleFitCircuit();
      }, 120);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setTimeout(() => {
          handleFitCircuit();
        }, 120);
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, handleFitCircuit]);

  // Mouse wheel cursor-anchored zoom (isolated strictly to canvas, preventing page scroll)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.25), 4.0);
        setPan((prevPan) => {
          const nextPanX = mouseX - ((mouseX - prevPan.x) / prevZoom) * nextZoom;
          const nextPanY = mouseY - ((mouseY - prevPan.y) / prevZoom) * nextZoom;
          return { x: nextPanX, y: nextPanY };
        });
        return nextZoom;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Pan event handlers: dragging smoothly moves canvas without sideways page scrolling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't pan if clicking directly on an interactive pin, inspector, button, or link
    if (
      target.closest('.circuit-pin-point') ||
      target.closest('.ctrl-btn') ||
      target.closest('.float-ctrl-btn') ||
      target.closest('.circuit-quick-inspector-overlay') ||
      target.closest('button') ||
      target.closest('a')
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    e.stopPropagation();
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  }, [isPanning, startPan]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Selection handlers
  const handleSelectComponent = useCallback((comp: CircuitComponent) => {
    setSelectedComponent(comp);
    setSelectedWire(null);
    setHighlightedPin(null);
  }, []);

  const handleSelectWire = useCallback((wire: CircuitWire) => {
    setSelectedWire(wire);
    setSelectedComponent(null);
    setHighlightedPin({ compId: wire.sourceComponentId, pinId: wire.sourcePinId });
  }, []);

  const handleSelectPin = useCallback((comp: CircuitComponent, pin: PinDefinition) => {
    setHighlightedPin({ compId: comp.id, pinId: pin.id });
    const wire = currentWires.find(
      (w) => (w.sourceComponentId === comp.id && w.sourcePinId === pin.id) ||
             (w.destComponentId === comp.id && w.destPinId === pin.id)
    );
    if (wire) setSelectedWire(wire);
  }, [currentWires]);

  // Connected wires to selected component
  const connectedWiresToSelected = useMemo(() => {
    if (!selectedComponent) return [];
    return currentWires.filter(
      (w) => w.sourceComponentId === selectedComponent.id || w.destComponentId === selectedComponent.id
    );
  }, [selectedComponent, currentWires]);

  // Render Wire Path with orthogonal lines & terminal solder dots
  const renderWirePath = useCallback((wire: CircuitWire) => {
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
  }, [pinCoordMap, selectedWire, handleSelectWire]);

  return (
    <div className="circuit-workspace-container">
      {/* ── 1. Page Title & Horizontal Mode Selector ─────────────────────── */}
      <div className="circuit-top-bar">
        <div className="circuit-title-area">
          <h2>
            <span>🔌</span> MARISLINK – CIRCUIT CONNECTIONS
          </h2>
          <p>
            Interactive 2D Electronics Schematic & Pin-to-Pin System Architecture
          </p>
        </div>

        {/* Unified MARISLINK Architecture Badge */}
        <div className="circuit-mode-toggle">
          <div className="mode-btn mode-complete active" style={{ cursor: 'default' }}>
            🌊 Complete MARISLINK Underwater Architecture (AMD Versal™ AI Edge + STM32H7)
          </div>
        </div>
      </div>

      {/* ── 2 & 3. INTERACTIVE CANVAS CONTAINER (SUPPORTS FULLSCREEN MODE) ── */}
      <div
        ref={containerRef}
        className={`circuit-interactive-container ${isFullscreen ? 'is-fullscreen' : ''}`}
      >
        {/* ── 2. WIRE BUS FILTER & ZOOM TOOLBAR (DISPLAYED ABOVE CIRCUIT CANVAS) ── */}
        <div className="circuit-canvas-toolbar">
          {/* Bus Filter Pills */}
          <div className="circuit-filter-pills">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>WIRE BUS FILTER:</span>
            {(['ALL', 'POWER', 'GROUND', 'I2C', 'SPI', 'UART', 'ADC/DAC', 'GPIO/PWM', 'USB/PCIe'] as BusFilter[]).map((f) => (
              <button
                key={f}
                className={`filter-pill ${busFilter === f ? 'active' : ''}`}
                onClick={() => setBusFilter(f)}
              >
                {f === 'POWER' && '🔴 Power (+12V/+5V/+3.3V)'}
                {f === 'GROUND' && '⚫ Ground (GND)'}
                {f === 'I2C' && '🩵 I2C (SDA/SCL)'}
                {f === 'SPI' && '🔵 SPI Bus'}
                {f === 'UART' && '🟣 UART Serial'}
                {f === 'ADC/DAC' && '🟠 ADC/DAC Analog'}
                {f === 'GPIO/PWM' && '🟢 GPIO/PWM'}
                {f === 'USB/PCIe' && '🔵 High-Speed USB/PCIe'}
                {f === 'ALL' && '🌈 All Wires'}
              </button>
            ))}
          </div>

          {/* Zoom & View Controls */}
          <div className="circuit-zoom-controls">
            <button className="ctrl-btn" onClick={() => handleZoomStep(-0.25)} title="Zoom Out (-25%)">－</button>
            <span className="zoom-indicator" title="Current Zoom">{Math.round(zoom * 100)}%</span>
            <button className="ctrl-btn" onClick={() => handleZoomStep(0.25)} title="Zoom In (+25%)">＋</button>
            <button className="ctrl-btn reset" onClick={handleResetView} title="Reset to 100% Zoom">
              Reset 100%
            </button>
            <button className="ctrl-btn reset fit" onClick={handleFitCircuit} title="Fit Entire Circuit on Screen">
              📐 Fit Circuit
            </button>
            <button
              className={`ctrl-btn reset fullscreen-btn ${isFullscreen ? 'is-active' : ''}`}
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen View (Fill entire screen)'}
            >
              {isFullscreen ? '🗗 Exit Full Screen' : '⛶ Full Screen'}
            </button>

            {onNavigateToSpark && (
              <button className="spark-nav-btn" onClick={onNavigateToSpark}>
                ⚡ Spark Lab
              </button>
            )}
          </div>
        </div>

        {/* ── 3. FULL-WIDTH CIRCUIT WORKSPACE (100% WIDTH CANVAS, NO FIXED SPLIT) ── */}
        <div className="circuit-workspace-body">
          {/* Interactive SVG Canvas Viewport */}
          <div
            ref={viewportRef}
            className={`circuit-canvas-viewport ${isPanning ? 'panning' : ''}`}
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
              <button className="float-ctrl-btn reset" onClick={handleResetView} title="Reset to 100%">↺ Reset</button>
              <button className="float-ctrl-btn fit" onClick={handleFitCircuit} title="Fit Entire Circuit">📐 Fit</button>
              <button
                className={`float-ctrl-btn fullscreen-btn ${isFullscreen ? 'is-active' : ''}`}
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen View'}
              >
                {isFullscreen ? '🗗 Exit' : '⛶ Fullscreen'}
              </button>
            </div>

            {/* Prominent floating exit button in fullscreen mode */}
            {isFullscreen && (
              <button
                className="circuit-fullscreen-exit-pill"
                onClick={toggleFullscreen}
                title="Exit Full Screen View (or press Esc)"
              >
                ✕ Exit Full Screen (Esc)
              </button>
            )}

            <svg
              ref={canvasRef}
              className="circuit-svg-canvas"
              width="100%"
              height="100%"
              viewBox={
                mode === 'complete_underwater' ? '0 0 2150 890' :
                mode === 'esp32_wokwi' ? '0 0 1200 750' :
                '0 0 1100 680'
              }
            >
              <defs>
                <pattern id="tinkercad-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <rect width="24" height="24" fill="#f8fafc" />
                  <circle cx="12" cy="12" r="1.2" fill="#cbd5e1" />
                </pattern>
              </defs>

              {/* Background Grid Layer */}
              <rect
                id="grid-background"
                x="-4000"
                y="-4000"
                width="10000"
                height="10000"
                fill="url(#tinkercad-grid)"
              />

              {/* Canvas Transformation Group (Zoom & Pan) */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Colored Subsystem Bounding Boxes (Mode B) */}
                {mode === 'complete_underwater' &&
                  UNDERWATER_GROUPS.map((g) => (
                    <g key={g.id} style={{ pointerEvents: 'none' }}>
                      <rect
                        x={g.x}
                        y={g.y}
                        width={g.width}
                        height={g.height}
                        rx={10}
                        fill={g.color}
                        stroke={g.accent}
                        strokeWidth={1.5}
                        strokeDasharray="6 4"
                        opacity={0.8}
                        pointerEvents="none"
                      />
                      <text
                        x={g.x + 16}
                        y={g.y + 24}
                        fill={g.accent}
                        fontSize={11.5}
                        fontWeight="800"
                        letterSpacing={0.8}
                        fontFamily="system-ui, sans-serif"
                        pointerEvents="none"
                      >
                        {g.name}
                      </text>
                    </g>
                  ))}

              {/* 1. Connecting Wires Layer (Behind Components) */}
              <g className="wires-layer">
                {currentWires.map(renderWirePath)}
              </g>

              {/* 2. Electronic Components Layer */}
              <g className="components-layer">
                {currentComponents.map((comp) => (
                  <ComponentShape
                    key={comp.id}
                    comp={comp}
                    isSelected={selectedComponent?.id === comp.id}
                    highlightedPinId={highlightedPin ? `${highlightedPin.compId}:${highlightedPin.pinId}` : null}
                    onSelectComponent={handleSelectComponent}
                    onSelectPin={handleSelectPin}
                  />
                ))}
              </g>
            </g>
          </svg>

          {/* Canvas Bottom Hint */}
          <div className="circuit-canvas-hint">
            <span>✦ Click any component or wire to inspect • Click & drag canvas to pan • Scroll wheel to zoom (25% - 400%)</span>
          </div>

          {/* Floating Interactive Inspector Overlay (Opens ONLY when component or wire is selected) */}
          {(selectedComponent || selectedWire) && (
            <div className="circuit-inspector-floating-card">
              {/* Floating Header with Close Button */}
              <div className="inspector-floating-header">
                <div className="inspector-floating-title-group">
                  <div className="inspector-header-badges">
                    <span className={`status-tag ${selectedComponent ? (selectedComponent.status || 'IMPLEMENTED').toLowerCase() : 'wire-tag'}`}>
                      {selectedComponent ? (selectedComponent.status || 'IMPLEMENTED') : `${selectedWire?.busType} BUS`}
                    </span>
                  </div>
                  <h4 className="inspector-title">
                    {selectedComponent ? selectedComponent.name : selectedWire?.name}
                  </h4>
                  <span className="inspector-subtitle">
                    {selectedComponent ? selectedComponent.modelNumber : `Route: ${selectedWire?.sourceComponentId.toUpperCase()} ➔ ${selectedWire?.destComponentId.toUpperCase()}`}
                  </span>
                </div>
                <button
                  className="inspector-close-btn"
                  onClick={() => {
                    setSelectedComponent(null);
                    setSelectedWire(null);
                    setHighlightedPin(null);
                  }}
                  title="Close Inspector"
                >
                  ✕
                </button>
              </div>

              {/* Inspector Body Content */}
              <div className="inspector-floating-body">
                {selectedWire ? (
                  /* Wire Details */
                  <div className="inspector-wire-details">
                    <div className="inspector-kv-grid">
                      <div className="kv-item">
                        <span className="kv-label">Signal Bus</span>
                        <span className="kv-val bus-val">{selectedWire.busType}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Voltage / Logic</span>
                        <span className="kv-val">{selectedWire.voltage}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Insulation Color</span>
                        <span className="kv-val">{selectedWire.colorName}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Signal Flow</span>
                        <span className="kv-val">{selectedWire.signalDirection || 'BIDIRECTIONAL'}</span>
                      </div>
                    </div>

                    <div className="pin-to-pin-box">
                      <div className="p2p-header">PIN-TO-PIN CONNECTION ROUTE:</div>
                      <div className="p2p-route">
                        <div className="p2p-node">
                          <span className="comp-name">{selectedWire.sourceComponentId.toUpperCase()}</span>
                          <span className="pin-label">Pin: <strong>{selectedWire.sourcePinId.toUpperCase()}</strong></span>
                        </div>
                        <div className="p2p-arrow" style={{ color: selectedWire.color }}>➔</div>
                        <div className="p2p-node">
                          <span className="comp-name">{selectedWire.destComponentId.toUpperCase()}</span>
                          <span className="pin-label">Pin: <strong>{selectedWire.destPinId.toUpperCase()}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="inspector-desc-section">
                      <div className="section-label">Connection Purpose:</div>
                      <p>{selectedWire.connectionPurpose}</p>
                    </div>

                    <div className="inspector-desc-section">
                      <div className="section-label">Signal Description & Role:</div>
                      <p>{selectedWire.signalDescription}</p>
                    </div>

                    <button className="hw-btn hw-btn-outline" onClick={() => setSelectedWire(null)}>
                      Clear Wire Selection
                    </button>
                  </div>
                ) : selectedComponent ? (
                  /* Component Details */
                  <div className="inspector-comp-details">
                    <div className="inspector-kv-grid">
                      <div className="kv-item">
                        <span className="kv-label">Category</span>
                        <span className="kv-val">{selectedComponent.category}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Protocol</span>
                        <span className="kv-val">{selectedComponent.protocol}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Voltage Rail</span>
                        <span className="kv-val">{selectedComponent.operatingVoltage}</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Current Draw</span>
                        <span className="kv-val">{selectedComponent.currentDraw}</span>
                      </div>
                    </div>

                    <div className="inspector-desc-section">
                      <div className="section-label">Component Overview:</div>
                      <p>{selectedComponent.description}</p>
                    </div>

                    <div className="inspector-desc-section">
                      <div className="section-label">Role in MARISLINK System:</div>
                      <p>{selectedComponent.roleInMarislink}</p>
                    </div>

                    {selectedComponent.technicalExplanation && (
                      <div className="inspector-tech-box">
                        <strong>Technical Engineering Details:</strong> {selectedComponent.technicalExplanation}
                      </div>
                    )}

                    {selectedComponent.tinkercadEquivNote && (
                      <div className="inspector-compat-box">
                        <strong>Classroom Equivalence Note:</strong> {selectedComponent.tinkercadEquivNote}
                      </div>
                    )}

                    {/* Pin Mapping Table */}
                    <div className="inspector-pins-table-section">
                      <div className="section-label">
                        Pins & Connected Circuits ({selectedComponent.pins.length} Pins, {connectedWiresToSelected.length} Active Wires):
                      </div>
                      <div className="table-wrapper">
                        <table className="inspector-pin-table">
                          <thead>
                            <tr>
                              <th>Pin</th>
                              <th>Type</th>
                              <th>Connected Route</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedComponent.pins.map((pin) => {
                              const connected = currentWires.find(
                                (w) => (w.sourceComponentId === selectedComponent.id && w.sourcePinId === pin.id) ||
                                       (w.destComponentId === selectedComponent.id && w.destPinId === pin.id)
                              );
                              return (
                                <tr
                                  key={pin.id}
                                  className={highlightedPin?.pinId === pin.id ? 'row-highlighted' : ''}
                                  onClick={() => handleSelectPin(selectedComponent, pin)}
                                >
                                  <td><strong>{pin.label}</strong></td>
                                  <td><span className={`pin-type-tag ${pin.type.toLowerCase()}`}>{pin.type}</span></td>
                                  <td style={{ fontSize: 11 }}>
                                    {connected ? (
                                      <span style={{ color: connected.color, fontWeight: 700 }}>
                                        ➔ {connected.sourceComponentId === selectedComponent.id ? connected.destComponentId.toUpperCase() : connected.sourceComponentId.toUpperCase()} ({connected.busType})
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8' }}>Unconnected / Internal</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <button className="hw-btn hw-btn-outline" onClick={() => setSelectedComponent(null)}>
                      Deselect Component
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* ── 4. COMPLETE END-TO-END SECTION (HTML Flow Below Canvas) ───────── */}
      <SystemWorkflowSection mode={mode} />

      {/* ── 5. Additional System Architecture Specifications ──────────────── */}
      <CircuitAdditionalInfo />
    </div>
  );
}

export default CircuitConnectionsPage;
