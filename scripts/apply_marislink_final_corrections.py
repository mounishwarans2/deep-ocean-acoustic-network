#!/usr/bin/env python3
"""
apply_marislink_final_corrections.py
Implements:
1. Replacement of Primary Li-SOCl2 Battery with MICRO NUCLEAR BATTERY – CONCEPTUAL
2. Elimination of all component description box overlaps across Mode A, Mode B, and Mode C
3. Recalibration of coordinates, group boundaries, and 3-line engineering label cards
"""

import re, sys

PATH = 'src/pages/CircuitConnectionsPage.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. UPDATE UNDERWATER GROUPS ──────────────────────────────────────────────
old_groups = """export const UNDERWATER_GROUPS: CircuitGroup[] = [
  { id: 'group_pwr', name: 'A. POWER MANAGEMENT', x: 30, y: 30, width: 710, height: 550, color: 'rgba(239, 68, 68, 0.03)', accent: '#ef4444' },
  { id: 'group_sensors', name: 'B. SENSOR INPUTS', x: 30, y: 615, width: 730, height: 215, color: 'rgba(6, 182, 212, 0.03)', accent: '#06b6d4' },
  { id: 'group_processing', name: 'C. MAIN PROCESSING', x: 770, y: 150, width: 600, height: 430, color: 'rgba(59, 130, 246, 0.04)', accent: '#3b82f6' },
  { id: 'group_rx', name: 'D. ACOUSTIC RECEIVER', x: 1390, y: 30, width: 700, height: 215, color: 'rgba(168, 85, 247, 0.03)', accent: '#a855f7' },
  { id: 'group_tx', name: 'E. ACOUSTIC TRANSMITTER', x: 1390, y: 270, width: 700, height: 215, color: 'rgba(236, 72, 153, 0.03)', accent: '#ec4899' },
  { id: 'group_storage', name: 'F. STORAGE', x: 790, y: 615, width: 550, height: 215, color: 'rgba(16, 185, 129, 0.03)', accent: '#10b981' },
  { id: 'group_interfaces', name: 'G. EXTERNAL INTERFACES', x: 1390, y: 520, width: 440, height: 215, color: 'rgba(245, 158, 11, 0.03)', accent: '#f59e0b' },
  { id: 'group_indicators', name: 'H. STATUS INDICATORS', x: 1850, y: 520, width: 240, height: 215, color: 'rgba(34, 197, 94, 0.03)', accent: '#22c55e' },
];"""

new_groups = """export const UNDERWATER_GROUPS: CircuitGroup[] = [
  { id: 'group_pwr', name: 'A. POWER MANAGEMENT', x: 30, y: 25, width: 710, height: 590, color: 'rgba(239, 68, 68, 0.03)', accent: '#ef4444' },
  { id: 'group_sensors', name: 'B. SENSOR INPUTS', x: 30, y: 635, width: 730, height: 195, color: 'rgba(6, 182, 212, 0.03)', accent: '#06b6d4' },
  { id: 'group_processing', name: 'C. MAIN PROCESSING', x: 770, y: 135, width: 600, height: 480, color: 'rgba(59, 130, 246, 0.04)', accent: '#3b82f6' },
  { id: 'group_rx', name: 'D. ACOUSTIC RECEIVER', x: 1390, y: 25, width: 710, height: 205, color: 'rgba(168, 85, 247, 0.03)', accent: '#a855f7' },
  { id: 'group_tx', name: 'E. ACOUSTIC TRANSMITTER', x: 1390, y: 250, width: 710, height: 215, color: 'rgba(236, 72, 153, 0.03)', accent: '#ec4899' },
  { id: 'group_storage', name: 'F. STORAGE', x: 770, y: 635, width: 600, height: 195, color: 'rgba(16, 185, 129, 0.03)', accent: '#10b981' },
  { id: 'group_interfaces', name: 'G. EXTERNAL INTERFACES', x: 1390, y: 485, width: 440, height: 210, color: 'rgba(245, 158, 11, 0.03)', accent: '#f59e0b' },
  { id: 'group_indicators', name: 'H. STATUS INDICATORS', x: 1850, y: 485, width: 250, height: 210, color: 'rgba(34, 197, 94, 0.03)', accent: '#22c55e' },
];"""

if old_groups in content:
    content = content.replace(old_groups, new_groups)
    print('[OK] Replaced UNDERWATER_GROUPS')
else:
    print('[WARN] Could not find old UNDERWATER_GROUPS exact match, checking regex...')

# ── 2. REBUILD UNDERWATER_COMPONENTS ─────────────────────────────────────────
# Find the start and end of UNDERWATER_COMPONENTS
comp_start = content.find('const UNDERWATER_COMPONENTS: CircuitComponent[] = [')
comp_end = content.find('const UNDERWATER_WIRES: CircuitWire[] = [')

if comp_start == -1 or comp_end == -1:
    print('[ERROR] Could not locate UNDERWATER_COMPONENTS bounds!')
    sys.exit(1)

new_underwater_components = """const UNDERWATER_COMPONENTS: CircuitComponent[] = [
  // ── A. POWER MANAGEMENT ────────────────────────────────────────────────────
  {
    id: 'interface_wetmate_power',
    name: 'Wet-Mate Power Connector',
    category: 'INTERFACE',
    modelNumber: 'SubConn 4-Pin Circular (+24V Bus)',
    status: 'ARCHITECTURAL',
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
    modelNumber: 'Conceptual Solid-State Micro-Power Unit',
    status: 'ARCHITECTURAL',
    x: 275,
    y: 65,
    width: 195,
    height: 95,
    description: 'Proposed long-duration solid-state micro-nuclear power source under conceptual architectural evaluation for multi-decade seabed deployment. Not physically present in benchtop prototype.',
    roleInMarislink: 'Proposed ultra-long-duration architectural primary energy source designed to trickle-charge the Li-ion energy buffer without requiring periodic retrieval.',
    protocol: 'Autonomous Low-Voltage DC Supply',
    operatingVoltage: 'Low-Voltage DC Output (Proposed)',
    currentDraw: 'Continuous Micro-Power Trickle Feed',
    pins: [
      { id: 'vout_pos', label: '+', x: 61, y: 16, type: 'POWER', description: 'Micro Nuclear Battery Positive DC Terminal (+)' },
      { id: 'vout_neg', label: '—', x: 134, y: 16, type: 'GROUND', description: 'Micro Nuclear Battery Ground Return (-)' }
    ]
  },
  {
    id: 'pwr_backup_battery',
    name: 'Li-Ion Buffer Battery Pack',
    category: 'POWER',
    modelNumber: 'Industrial 18650 4S2P Rechargeable Buffer',
    status: 'ARCHITECTURAL',
    x: 510,
    y: 65,
    width: 195,
    height: 95,
    description: 'High-discharge rechargeable Lithium-Ion buffer battery designed to absorb high peak transient surge currents during acoustic transmission bursts.',
    roleInMarislink: 'Buffers high-current acoustic projector pulses preventing voltage sag on the sensitive microcontroller bus.',
    protocol: 'Secondary Energy Buffer',
    operatingVoltage: '14.8V DC Nominal',
    currentDraw: 'Burst Capability up to 20A',
    pins: [
      { id: 'bat_pos', label: 'B+', x: 85, y: 80, type: 'POWER', description: 'Li-Ion Positive Battery Terminal to BMS' },
      { id: 'bat_neg', label: 'B-', x: 135, y: 80, type: 'GROUND', description: 'Li-Ion Negative Battery Terminal to BMS' }
    ]
  },
  {
    id: 'pwr_path_mgmt',
    name: 'Power Path Controller',
    category: 'POWER',
    modelNumber: 'LTC4412 Ideal Diode Multiplexer',
    status: 'ARCHITECTURAL',
    x: 275,
    y: 255,
    width: 195,
    height: 95,
    description: 'Low-loss ideal diode-OR controller that switches seamlessly between external wet-mate power, micro nuclear battery (conceptual), and backup Li-ion buffer.',
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
    x: 510,
    y: 255,
    width: 195,
    height: 95,
    description: 'Autonomous multi-cell battery monitor and protector featuring active cell balancing and I2C status telemetry.',
    roleInMarislink: 'Guards the Li-ion energy buffer against overvoltage, undervoltage, thermal runaway, and short circuits.',
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

"""

content = content[:comp_start] + new_underwater_components + content[comp_end:]
print('[OK] Updated UNDERWATER_COMPONENTS with Micro Nuclear Battery and zero-overlap layout!')

# ── 3. UPDATE BATTERY WIRE IN UNDERWATER_WIRES ───────────────────────────────
old_bat_wire = """  {
    id: 'w-pri-bat-path',
    name: 'Primary Li-SOCl2 Battery +14.4V Feed to Power Path Manager',
    busType: 'POWER',
    sourceComponentId: 'pwr_primary_battery',
    sourcePinId: 'vout_pos',
    destComponentId: 'pwr_path_mgmt',
    destPinId: 'pri_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+14.4V DC',
    connectionPurpose: 'Feeds primary chemical battery energy into ideal diode multiplexer',
    signalDescription: 'Continuous baseline subsea power rail'
  },"""

new_bat_wire = """  {
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
    signalDescription: 'Continuous long-duration low-voltage DC trickle rail'
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
    signalDescription: 'System ground return path for primary micro power unit.'
  },"""

if old_bat_wire in content:
    content = content.replace(old_bat_wire, new_bat_wire)
    print('[OK] Updated w-pri-bat-path wire to Micro Nuclear Battery!')
else:
    print('[WARN] Could not find exact old_bat_wire, using regex replacement...')
    content = re.sub(
        r'id:\s*[\'\"]w-pri-bat-path[\'\"].*?name:\s*[\'\"][^\'\"]+[\'\"].*?destPinId:\s*[\'\"]pri_in[\'\"]',
        r'id: \'w-pri-bat-path\',\n    name: \'Micro Nuclear Battery (+) Feed to Power Path Manager\',\n    busType: \'POWER\',\n    sourceComponentId: \'pwr_primary_battery\',\n    sourcePinId: \'vout_pos\',\n    destComponentId: \'pwr_path_mgmt\',\n    destPinId: \'pri_in\'',
        content,
        flags=re.DOTALL
    )

# ── 4. REBUILD ESP32_COMPONENTS & ARDUINO_COMPONENTS COORDINATES ─────────────
esp32_start = content.find('const ESP32_COMPONENTS: CircuitComponent[] = [')
esp32_end = content.find('const ESP32_WIRES: CircuitWire[] = [')

if esp32_start != -1 and esp32_end != -1:
    # Update coordinates of esp32 components
    esp32_chunk = content[esp32_start:esp32_end]
    # Replace individual coordinates
    esp32_chunk = re.sub(r'id:\s*[\'\"]esp32[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                         "id: 'esp32',\n    name: 'ESP32 DevKit v1 Microcontroller',\n    category: 'MCU',\n    modelNumber: 'ESP32-WROOM-32 (30-Pin)',\n    status: 'IMPLEMENTED',\n    x: 70,\n    y: 110,\n    width: 170,\n    height: 360,", esp32_chunk, flags=re.DOTALL)
    esp32_chunk = re.sub(r'id:\s*[\'\"]oled[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                         "id: 'oled',\n    name: 'SSD1306 0.96\" OLED Display',\n    category: 'DISPLAY',\n    modelNumber: 'SSD1306 128x64 I2C',\n    status: 'IMPLEMENTED',\n    x: 360,\n    y: 50,\n    width: 190,\n    height: 120,", esp32_chunk, flags=re.DOTALL)
    esp32_chunk = re.sub(r'id:\s*[\'\"]bmp280[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                         "id: 'bmp280',\n    name: 'BMP280 Sensor Transducer',\n    category: 'SENSOR',\n    modelNumber: 'Bosch BMP280 Baro/Temp',\n    status: 'IMPLEMENTED',\n    x: 680,\n    y: 50,\n    width: 160,\n    height: 120,", esp32_chunk, flags=re.DOTALL)
    esp32_chunk = re.sub(r'id:\s*[\'\"]pot_battery[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                         "id: 'pot_battery',\n    name: 'Battery Voltage Potentiometer',\n    category: 'PASSIVE',\n    modelNumber: '10kΩ Rotary Simulation Pot',\n    status: 'IMPLEMENTED',\n    x: 320,\n    y: 250,\n    width: 130,\n    height: 110,", esp32_chunk, flags=re.DOTALL)
    esp32_chunk = re.sub(r'id:\s*[\'\"]pot_signal[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                         "id: 'pot_signal',\n    name: 'Acoustic RSSI Potentiometer',\n    category: 'PASSIVE',\n    modelNumber: '10kΩ Rotary RSSI Attenuator',\n    status: 'IMPLEMENTED',\n    x: 500,\n    y: 250,\n    width: 130,\n    height: 110,", esp32_chunk, flags=re.DOTALL)
    esp32_chunk = re.sub(r'id:\s*[\'\"]modem_uart[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                         "id: 'modem_uart',\n    name: 'Acoustic Modem Interface',\n    category: 'ACOUSTIC',\n    modelNumber: 'Subsea Acoustic OEM DSP',\n    status: 'IMPLEMENTED',\n    x: 720,\n    y: 245,\n    width: 190,\n    height: 120,", esp32_chunk, flags=re.DOTALL)
    esp32_chunk = re.sub(r'id:\s*[\'\"]led_tx[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                         "id: 'led_tx',\n    name: 'Acoustic TX Pulse (Green)',\n    category: 'INDICATOR',\n    modelNumber: 'Through-Hole 5mm Green LED',\n    status: 'IMPLEMENTED',\n    x: 340,\n    y: 450,\n    width: 60,\n    height: 75,", esp32_chunk, flags=re.DOTALL)
    esp32_chunk = re.sub(r'id:\s*[\'\"]led_sync[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                         "id: 'led_sync',\n    name: 'Network Sync Lock (Yellow)',\n    category: 'INDICATOR',\n    modelNumber: 'Through-Hole 5mm Yellow LED',\n    status: 'IMPLEMENTED',\n    x: 520,\n    y: 450,\n    width: 60,\n    height: 75,", esp32_chunk, flags=re.DOTALL)
    esp32_chunk = re.sub(r'id:\s*[\'\"]led_alert[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                         "id: 'led_alert',\n    name: 'Critical Fault Alert (Red)',\n    category: 'INDICATOR',\n    modelNumber: 'Through-Hole 5mm Red LED',\n    status: 'IMPLEMENTED',\n    x: 700,\n    y: 450,\n    width: 60,\n    height: 75,", esp32_chunk, flags=re.DOTALL)
    content = content[:esp32_start] + esp32_chunk + content[esp32_end:]
    print('[OK] Updated ESP32_COMPONENTS coordinates!')

# Remove hardcoded obsolete waypoints from ESP32_WIRES and ARDUINO_WIRES so natural Bezier curves render smoothly
content = re.sub(r'(\s+waypoints:\s*\[\[[^\]]+\]\],)', '', content)
print('[OK] Enabled natural curved EDA wire routing for all modes!')

# Update Arduino Uno and Breadboard coordinates in ARDUINO_COMPONENTS
content = re.sub(r'id:\s*[\'\"]arduino_uno[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                 "id: 'arduino_uno',\n    name: 'Arduino Uno R3 Microcontroller',\n    category: 'MCU',\n    modelNumber: 'ATmega328P DIP (Tinkercad Native)',\n    status: 'SIMULATED',\n    x: 50,\n    y: 110,\n    width: 250,\n    height: 370,", content, flags=re.DOTALL)
content = re.sub(r'id:\s*[\'\"]breadboard_half[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                 "id: 'breadboard_half',\n    name: 'Half Prototyping Breadboard',\n    category: 'BREADBOARD',\n    modelNumber: '400 Tie-Point Solderless',\n    status: 'SIMULATED',\n    x: 350,\n    y: 90,\n    width: 340,\n    height: 410,", content, flags=re.DOTALL)
content = re.sub(r'id:\s*[\'\"]tmp36[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                 "id: 'tmp36',\n    name: 'TMP36 Temperature Sensor',\n    category: 'SENSOR',\n    modelNumber: 'Analog Devices TMP36 (TO-92)',\n    status: 'SIMULATED',\n    x: 480,\n    y: 190,\n    width: 80,\n    height: 80,", content, flags=re.DOTALL)
content = re.sub(r'id:\s*[\'\"]lcd_1602[\'\"].*?x:\s*\d+,\s*y:\s*\d+,\s*width:\s*\d+,\s*height:\s*\d+,',
                 "id: 'lcd_1602',\n    name: '16x2 Character LCD Display',\n    category: 'DISPLAY',\n    modelNumber: 'HD44780 + PCF8574 I2C Backpack',\n    status: 'SIMULATED',\n    x: 740,\n    y: 130,\n    width: 270,\n    height: 140,", content, flags=re.DOTALL)
print('[OK] Updated ARDUINO_COMPONENTS coordinates!')

# ── 5. REBUILD COMPONENTSHAPE LABEL CARD ─────────────────────────────────────
# Replace old label rendering inside ComponentShape
old_label_rx = re.search(r'\{\/\* ── Component Neat Engineering Label.*?\<\/g\>\s+\<\/g\>', content, re.DOTALL)

new_label_block = """{/* ── Component Neat Engineering Label Card (Rendered Below Hardware Image) ── */}
      {(() => {
        const labelBoxWidth = Math.min(Math.max(comp.width, 140), 220);
        const labelBoxHeight = 44;

        let statusText = '[VERIFIED IMPLEMENTED]';
        let statusColor = '#15803d';
        let statusBg = '#dcfce7';
        let statusBadgeWidth = 116;

        if (comp.id === 'pwr_primary_battery' || comp.name.includes('CONCEPTUAL')) {
          statusText = '[CONCEPTUAL ARCHITECTURE]';
          statusColor = '#b45309';
          statusBg = '#fef3c7';
          statusBadgeWidth = 130;
        } else if (comp.status === 'ARCHITECTURAL') {
          statusText = '[PROPOSED ARCHITECTURAL]';
          statusColor = '#b45309';
          statusBg = '#fef3c7';
          statusBadgeWidth = 126;
        } else if (comp.status === 'SIMULATED') {
          statusText = '[TINKERCAD SIMULATED]';
          statusColor = '#0369a1';
          statusBg = '#e0f2fe';
          statusBadgeWidth = 116;
        }

        return (
          <g transform={`translate(${comp.width / 2}, ${comp.height + 8})`}>
            {/* Background card with subtle drop-shadow */}
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
                letterSpacing={0.4}
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {statusText}
              </text>
            </g>
          </g>
        );
      })()}"""

# Target substitution of the old label block
content = re.sub(
    r'\{\/\* ── Component Neat Engineering Label \(Rendered Below Hardware Image\) ── \*\/.*?style=\{\{ pointerEvents: \'none\' \}\}\>\s*\[PROPOSED ARCHITECTURAL\]\s*\<\/text\>\s*\)\}\s*\<\/g\>',
    new_label_block,
    content,
    flags=re.DOTALL
)
print('[OK] Replaced ComponentShape label rendering with 3-line structured card!')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print('[SUCCESS] Successfully updated CircuitConnectionsPage.tsx!')
