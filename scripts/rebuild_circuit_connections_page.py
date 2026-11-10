import re

with open('src/pages/CircuitConnectionsPage.tsx', 'r') as f:
    content = f.read()

# ── 1. DEFINE UNDERWATER_GROUPS ──────────────────────────────────────────────
GROUPS_TS = '''
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
'''

# ── 2. DEFINE UNDERWATER_COMPONENTS ───────────────────────────────────────────
UNDERWATER_COMPS_TS = '''const UNDERWATER_COMPONENTS: CircuitComponent[] = [
  // ── A. POWER MANAGEMENT ────────────────────────────────────────────────────
  {
    id: 'interface_wetmate_power',
    name: 'Subsea Wet-Mate Power Connector',
    category: 'INTERFACE',
    modelNumber: 'SubConn Micro Circular 4-Pin Wet-Mate (MCHP4M)',
    status: 'ARCHITECTURAL',
    x: 50,
    y: 70,
    width: 180,
    height: 120,
    description: 'High-current underwater wet-mateable circular connector for surface tether or charging station dock power.',
    roleInMarislink: 'Transfers external +24V DC auxiliary electrical power to subsea node for battery charging and tethered operations.',
    protocol: 'Direct DC Power Bus (Up to 15A continuous)',
    operatingVoltage: '24V DC External Bus',
    currentDraw: 'Input Sink (Up to 15A)',
    pins: [
      { id: 'v_bus_in', label: '+24V', x: 150, y: 45, type: 'POWER', description: 'External 24V DC Auxiliary Power Line' },
      { id: 'gnd', label: 'GND', x: 150, y: 80, type: 'GROUND', description: 'External Power Ground Return' }
    ]
  },
  {
    id: 'pwr_primary_battery',
    name: 'Sealed Primary Li-SOCl2 Battery Pack',
    category: 'POWER',
    modelNumber: 'Saft LS33600 Li-SOCl2 D-Cell Subsea Pack (4S2P)',
    status: 'ARCHITECTURAL',
    x: 270,
    y: 70,
    width: 210,
    height: 120,
    description: 'High-energy-density non-rechargeable Lithium Thionyl Chloride battery pack engineered for multi-year deep-sea acoustic seabed node deployments.',
    roleInMarislink: 'Primary baseline chemical energy source providing steady 14.4V power over extended underwater monitoring campaigns.',
    protocol: 'Chemical DC Source (3.6V/Cell, 4S2P)',
    operatingVoltage: '14.4V DC Nominal',
    currentDraw: 'Source Supply (34 Ah total capacity)',
    pins: [
      { id: 'vout_pos', label: '+14.4V', x: 180, y: 45, type: 'POWER', description: 'Primary Battery Positive Voltage Rail' },
      { id: 'vout_neg', label: 'GND', x: 180, y: 80, type: 'GROUND', description: 'Primary Battery Negative Ground Return' }
    ]
  },
  {
    id: 'pwr_backup_battery',
    name: 'Rechargeable Li-Ion Buffer Battery Pack',
    category: 'POWER',
    modelNumber: 'Industrial 18650 4S2P Li-Ion Buffer Pack (14.8V)',
    status: 'ARCHITECTURAL',
    x: 510,
    y: 70,
    width: 200,
    height: 120,
    description: 'High-discharge rechargeable Lithium-Ion buffer battery designed to absorb high peak transient surge currents during acoustic transmission bursts.',
    roleInMarislink: 'Buffers high current acoustic projector pulses preventing voltage sag on the sensitive microcontroller bus.',
    protocol: 'Secondary Energy Buffer',
    operatingVoltage: '14.8V DC Nominal',
    currentDraw: 'Burst Capability up to 20A',
    pins: [
      { id: 'bat_pos', label: 'B+', x: 90, y: 105, type: 'POWER', description: 'Li-Ion Positive Battery Terminal to BMS' },
      { id: 'bat_neg', label: 'B-', x: 140, y: 105, type: 'GROUND', description: 'Li-Ion Negative Battery Terminal to BMS' }
    ]
  },
  {
    id: 'pwr_path_mgmt',
    name: 'Ideal Diode Power Path Controller',
    category: 'POWER',
    modelNumber: 'Linear Tech LTC4412 / LTC4353 Power Path Controller',
    status: 'ARCHITECTURAL',
    x: 270,
    y: 230,
    width: 210,
    height: 130,
    description: 'Low-loss ideal diode-OR controller that switches seamlessly between external wet-mate power, primary Li-SOCl2 battery, and backup Li-ion buffer.',
    roleInMarislink: 'Eliminates cross-charging between disparate battery chemistries and prevents battery discharge into external ports.',
    protocol: 'Autonomous Hardware Power Multiplexing',
    operatingVoltage: '9V - 28V DC Input Range',
    currentDraw: '<15 µA Quiescent Current',
    pins: [
      { id: 'pri_in', label: 'PRI_IN', x: 30, y: 40, type: 'POWER', description: 'Primary Li-SOCl2 Battery Input' },
      { id: 'sec_in', label: 'SEC_IN', x: 180, y: 40, type: 'POWER', description: 'BMS Buffered Secondary Battery Input' },
      { id: 'ext_in', label: 'EXT_IN', x: 30, y: 90, type: 'POWER', description: 'External Wet-Mate Power Input' },
      { id: 'sys_out', label: 'SYS_OUT', x: 105, y: 115, type: 'POWER', description: 'Multiplexed Main System DC Power Bus' },
      { id: 'gnd', label: 'GND', x: 180, y: 90, type: 'GROUND', description: 'Common Ground Reference' }
    ]
  },
  {
    id: 'pwr_bms',
    name: 'Battery Management System (BMS)',
    category: 'POWER',
    modelNumber: 'Texas Instruments BQ76952 Industrial 4S BMS Board',
    status: 'ARCHITECTURAL',
    x: 510,
    y: 230,
    width: 200,
    height: 130,
    description: 'Precision battery monitor and protector safeguarding the rechargeable Li-Ion pack against overvoltage, overcurrent, and deep discharge.',
    roleInMarislink: 'Monitors cell balancing and manages safe charging when docked to subsea inductive/wet-mate power.',
    protocol: 'I2C / SMBus Cell Telemetry',
    operatingVoltage: '14.8V Nominal (4S)',
    currentDraw: '20 µA Standby',
    pins: [
      { id: 'b_in', label: 'BAT_IN', x: 100, y: 20, type: 'POWER', description: 'Cell Stack Input from Li-Ion Battery' },
      { id: 'p_pos', label: 'P+', x: 30, y: 60, type: 'POWER', description: 'Protected Pack Positive Output' },
      { id: 'p_neg', label: 'P-', x: 30, y: 95, type: 'GROUND', description: 'Protected Pack Negative Return' }
    ]
  },
  {
    id: 'pwr_dcdc_converters',
    name: 'Multi-Rail DC-DC Voltage Regulators',
    category: 'POWER',
    modelNumber: 'Synchronous Buck Regulators (+12V, +5V, +3.3V)',
    status: 'ARCHITECTURAL',
    x: 270,
    y: 410,
    width: 210,
    height: 140,
    description: 'High-efficiency industrial DC-DC step-down converters stepping the main battery bus down to deterministic regulated voltage rails.',
    roleInMarislink: 'Supplies isolated +12V for acoustic amplifiers, +5V for environmental sensors, and +3.3V for microcontrollers and FPGA cores.',
    protocol: 'DC-DC Switching Power Conversion (>92% Efficiency)',
    operatingVoltage: '14.4V Main Bus Input',
    currentDraw: 'Supplies up to 60W combined peak power',
    pins: [
      { id: 'vin', label: 'VIN', x: 105, y: 20, type: 'POWER', description: 'Main DC Voltage Input from Power Path Manager' },
      { id: 'v12_out', label: '+12V', x: 180, y: 40, type: 'POWER', description: '+12V Regulated Rail (Acoustic Power Amp)' },
      { id: 'v5_out', label: '+5V', x: 180, y: 70, type: 'POWER', description: '+5V Regulated Rail (Sensors & Analog LNA)' },
      { id: 'v33_out', label: '+3.3V', x: 180, y: 100, type: 'POWER', description: '+3.3V Regulated Rail (STM32 & AI Processor)' },
      { id: 'gnd', label: 'GND', x: 30, y: 70, type: 'GROUND', description: 'Common System Power Ground' }
    ]
  },
  {
    id: 'pwr_monitor_ic',
    name: 'Digital Power Monitoring IC',
    category: 'POWER',
    modelNumber: 'Texas Instruments INA226 High-Side Power Monitor',
    status: 'ARCHITECTURAL',
    x: 510,
    y: 410,
    width: 180,
    height: 120,
    description: 'High-accuracy digital current and voltage monitor measuring system bus energy consumption with 16-bit resolution.',
    roleInMarislink: 'Reports real-time node power draw to the STM32 controller to dynamically throttle transmission rates during low-battery states.',
    protocol: 'I2C (Address: 0x40, 400 kHz)',
    operatingVoltage: '3.3V Logic / 0 - 36V Common-Mode Sense',
    currentDraw: '330 µA Operating Current',
    pins: [
      { id: 'vin_sense', label: 'VIN+', x: 30, y: 45, type: 'POWER', description: 'Shunt Resistor Voltage Sense Line' },
      { id: 'sda', label: 'SDA', x: 150, y: 45, type: 'I2C', description: 'I2C Serial Data Telemetry Line' },
      { id: 'scl', label: 'SCL', x: 150, y: 80, type: 'I2C', description: 'I2C Serial Clock Line' },
      { id: 'gnd', label: 'GND', x: 30, y: 80, type: 'GROUND', description: 'Ground Reference' }
    ]
  },

  // ── B. SENSOR INPUTS ───────────────────────────────────────────────────────
  {
    id: 'sensor_subsea_pressure',
    name: 'Deep-Sea Pressure Transducer',
    category: 'SENSOR',
    modelNumber: 'Keller 33X Subsea Titanium Piezoresistive Transmitter (60 MPa)',
    status: 'ARCHITECTURAL',
    x: 50,
    y: 660,
    width: 160,
    height: 120,
    description: 'Titanium-encapsulated oceanographic hydrostatic pressure sensor calibrated for depths down to 6,000 meters.',
    roleInMarislink: 'Measures water column depth, tidal fluctuations, and submerged vehicle buoyancy profiling.',
    protocol: 'I2C / RS-485 Modbus (0.01% FS Accuracy)',
    operatingVoltage: '5V DC Supply',
    currentDraw: '4 mA',
    pins: [
      { id: 'vcc', label: '5V', x: 30, y: 40, type: 'POWER', description: '5V Power Supply Input' },
      { id: 'i2c_sda', label: 'SDA', x: 130, y: 40, type: 'I2C', description: 'Digital Pressure Telemetry Data' },
      { id: 'i2c_scl', label: 'SCL', x: 130, y: 75, type: 'I2C', description: 'Digital Pressure Clock Line' },
      { id: 'gnd', label: 'GND', x: 30, y: 75, type: 'GROUND', description: 'Sensor Ground' }
    ]
  },
  {
    id: 'sensor_ocean_temp',
    name: 'Precision Oceanographic Temp RTD',
    category: 'SENSOR',
    modelNumber: 'PT1000 4-Wire Oceanographic Platinum RTD Probe',
    status: 'ARCHITECTURAL',
    x: 230,
    y: 660,
    width: 150,
    height: 130,
    description: 'Fast-response 4-wire platinum resistance temperature detector in 316L stainless steel sheath for thermocline analysis.',
    roleInMarislink: 'Measures water temperature used by the SNC engine to compute acoustic sound speed profiles (SSP).',
    protocol: 'Analog 4-Wire RTD Resistance Sensing',
    operatingVoltage: 'Constant 1 mA Excitation Current',
    currentDraw: '<1 mA',
    pins: [
      { id: 'rtd_in_p', label: 'EXC+', x: 30, y: 40, type: 'POWER', description: 'Precision RTD Excitation Current Feed' },
      { id: 'rtd_sig_pos', label: 'SIG+', x: 120, y: 40, type: 'ADC', description: 'Differential Temperature Analog Signal (+)' },
      { id: 'rtd_sig_neg', label: 'SIG-', x: 120, y: 80, type: 'ADC', description: 'Differential Temperature Analog Signal (-)' }
    ]
  },
  {
    id: 'sensor_imu_9dof',
    name: '9-DoF Subsea Navigation & Attitude IMU',
    category: 'SENSOR',
    modelNumber: 'Bosch BMI088 (6-DoF) + BMM150 (3-DoF Magnetometer)',
    status: 'ARCHITECTURAL',
    x: 400,
    y: 660,
    width: 150,
    height: 120,
    description: 'Precision low-drift inertial measurement unit providing pitch, roll, yaw, and acoustic node mooring tilt vectors.',
    roleInMarislink: 'Detects sea-floor node orientation ensuring acoustic beam alignment with surface buoys.',
    protocol: 'I2C / SPI (400 kHz)',
    operatingVoltage: '3.3V DC',
    currentDraw: '1.2 mA',
    pins: [
      { id: 'vcc', label: '3V3', x: 30, y: 40, type: 'POWER', description: '3.3V Power Rail' },
      { id: 'i2c_sda', label: 'SDA', x: 120, y: 40, type: 'I2C', description: 'I2C Motion Telemetry Data' },
      { id: 'i2c_scl', label: 'SCL', x: 120, y: 75, type: 'I2C', description: 'I2C Motion Clock Line' },
      { id: 'gnd', label: 'GND', x: 30, y: 75, type: 'GROUND', description: 'Ground Reference' }
    ]
  },
  {
    id: 'sensor_leak_hull',
    name: 'Hull Water-Leak Detector',
    category: 'SENSOR',
    modelNumber: 'Subsea Interdigital Optical/Conductive Leak Probe',
    status: 'ARCHITECTURAL',
    x: 570,
    y: 660,
    width: 160,
    height: 120,
    description: 'Redundant conductive grid and optical reflection probe placed in the subsea pressure canister bilge.',
    roleInMarislink: 'Triggers emergency emergency acoustic distress beacon and immediate node shutdown if water ingress occurs.',
    protocol: 'Hardware Interrupt / Active-Low Logic',
    operatingVoltage: '3.3V DC',
    currentDraw: '<50 µA',
    pins: [
      { id: 'vcc', label: '3V3', x: 30, y: 40, type: 'POWER', description: '3.3V Supply' },
      { id: 'leak_alert_gpio', label: 'ALERT', x: 130, y: 55, type: 'GPIO', description: 'Critical Anomaly Ingress Alarm Line' },
      { id: 'gnd', label: 'GND', x: 30, y: 75, type: 'GROUND', description: 'Ground' }
    ]
  },

  // ── C. MAIN PROCESSING ─────────────────────────────────────────────────────
  {
    id: 'mcu_stm32h7',
    name: 'STM32H747 Controller & SNC Core',
    category: 'MCU',
    modelNumber: 'STM32H747XI Dual-Core (Cortex-M7 480MHz + Cortex-M4 240MHz)',
    status: 'ARCHITECTURAL',
    x: 800,
    y: 190,
    width: 240,
    height: 360,
    description: 'Primary real-time microcontroller running the MARISLINK Swarm-Node-Controller (SNC) deterministic protocol stack.',
    roleInMarislink: 'Executes sensor data acquisition, TDMA acoustic channel scheduling, and manages peripheral communications.',
    protocol: 'I2C, SPI, UART, CAN, SDIO, Ethernet, High-Speed USB',
    operatingVoltage: '3.3V Logic Rail',
    currentDraw: '110 mA Normal Operating',
    pins: [
      { id: 'vdd_3v3', label: '3V3', x: 20, y: 40, type: 'POWER', description: '3.3V Core Power Input' },
      { id: 'gnd', label: 'GND', x: 20, y: 70, type: 'GROUND', description: 'Digital Ground' },
      { id: 'i2c1_sda', label: 'I2C_SDA', x: 20, y: 110, type: 'I2C', description: 'Sensor Bus Data (Pressure, IMU, INA226)' },
      { id: 'i2c1_scl', label: 'I2C_SCL', x: 20, y: 140, type: 'I2C', description: 'Sensor Bus Clock Line' },
      { id: 'adc1_in0', label: 'ADC_RTD', x: 20, y: 180, type: 'ADC', description: 'Analog RTD Temperature Sensor Input' },
      { id: 'gpio_leak_int', label: 'INT_LEAK', x: 20, y: 210, type: 'GPIO', description: 'Emergency Water Leak Interrupt Pin' },
      { id: 'swdio', label: 'SWDIO', x: 20, y: 250, type: 'GPIO', description: 'SWD Serial Wire Debug Data' },
      { id: 'swclk', label: 'SWCLK', x: 20, y: 280, type: 'GPIO', description: 'SWD Serial Wire Debug Clock' },
      { id: 'eth_rxd0', label: 'ETH_RX', x: 20, y: 320, type: 'UART', description: '100BASE-TX Ethernet PHY Interface' },
      { id: 'uart1_tx', label: 'TX_AI', x: 220, y: 40, type: 'UART', description: 'High-Speed Serial Command to AMD Versal' },
      { id: 'uart1_rx', label: 'RX_AI', x: 220, y: 70, type: 'UART', description: 'High-Speed Serial Telemetry from AMD Versal' },
      { id: 'fmc_bus', label: 'FMC_PCIE', x: 220, y: 110, type: 'SPI', label: 'High-Throughput Parallel Inter-Chip Bus' },
      { id: 'spi1_miso', label: 'SPI1_RX', x: 220, y: 150, type: 'SPI', description: 'Acoustic ADC Digitized Data Input' },
      { id: 'spi1_sck', label: 'SPI1_CLK', x: 220, y: 175, type: 'SPI', description: 'Acoustic ADC SPI Clock Line' },
      { id: 'spi1_cs', label: 'SPI1_CS', x: 220, y: 200, type: 'SPI', description: 'Acoustic ADC Chip Select' },
      { id: 'spi2_mosi', label: 'SPI2_TX', x: 220, y: 235, type: 'SPI', description: 'Acoustic Modulation DAC Data Out' },
      { id: 'spi2_sck', label: 'SPI2_CLK', x: 220, y: 260, type: 'SPI', description: 'Acoustic Modulation DAC Clock Line' },
      { id: 'spi2_cs', label: 'SPI2_CS', x: 220, y: 285, type: 'SPI', description: 'Acoustic Modulation DAC Chip Select' },
      { id: 'sdio_d0', label: 'SDIO', x: 120, y: 340, type: 'SPI', description: 'High-Speed SDIO 4-Bit Storage Interface' },
      { id: 'gpio_pwr_led', label: 'LED_PWR', x: 220, y: 320, type: 'GPIO', description: 'Power Status LED Driver' },
      { id: 'gpio_comm_led', label: 'LED_COMM', x: 220, y: 340, type: 'GPIO', description: 'Acoustic Communication LED Driver' }
    ]
  },
  {
    id: 'ai_jetson_orin',
    name: 'AMD Versal™ AI Edge Adaptive SoC',
    category: 'AI_PROCESSOR',
    modelNumber: 'AMD Versal™ AI Edge VE2302 (Dual Cortex-A72 + AI Engines)',
    status: 'ARCHITECTURAL',
    x: 1080,
    y: 190,
    width: 260,
    height: 360,
    description: 'High-performance adaptive processor combining vector AI Engines with programmable logic for deep subsea acoustic signal processing.',
    roleInMarislink: 'Executes real-time CNN acoustic signal denoising, multipath Doppler compensation, and anomaly spectrogram inference.',
    protocol: 'PCIe Gen4, AXI4-Stream, High-Speed DMA',
    operatingVoltage: '3.3V I/O / 0.85V Core',
    currentDraw: '1.2A Peak Processing Burst',
    pins: [
      { id: 'vdd_core', label: 'VDD_CORE', x: 30, y: 40, type: 'POWER', description: 'Core Power Supply from DC-DC Regulator' },
      { id: 'gnd', label: 'GND', x: 30, y: 70, type: 'GROUND', description: 'Common Digital Ground' },
      { id: 'uart_rx', label: 'RX_MCU', x: 30, y: 110, type: 'UART', description: 'Command Control Stream from STM32 Core' },
      { id: 'uart_tx', label: 'TX_MCU', x: 30, y: 140, type: 'UART', description: 'Neural Inference Result Stream to STM32' },
      { id: 'pcie_lane0', label: 'PCIE_EP', x: 30, y: 180, type: 'SPI', description: 'PCIe Endpoint Bus to STM32 Controller' },
      { id: 'pcie_nvme', label: 'PCIE_NVME', x: 130, y: 340, type: 'SPI', description: 'PCIe Gen3 x2 Bus to NVMe SSD Storage' },
      { id: 'ai_demod_out', label: 'DEMOD_SYM', x: 230, y: 140, type: 'SPI', description: 'Demodulated High-Speed Acoustic Symbols' },
      { id: 'ai_mod_in', label: 'MOD_SYM', x: 230, y: 210, type: 'SPI', description: 'Modulated Multi-Carrier Acoustic Baseband' }
    ]
  },

  // ── D. ACOUSTIC RECEIVER ───────────────────────────────────────────────────
  {
    id: 'acoustics_hydrophone',
    name: 'Teledyne Reson TC4013 Hydrophone',
    category: 'ACOUSTIC',
    modelNumber: 'Teledyne Reson TC4013 Miniature Oceanographic Hydrophone',
    status: 'ARCHITECTURAL',
    x: 1420,
    y: 70,
    width: 180,
    height: 130,
    description: 'Precision miniature oceanographic hydrophone providing omnidirectional reception across a flat frequency band from 1 Hz to 170 kHz.',
    roleInMarislink: 'Converts incoming underwater acoustic sound waves into microvolt-level differential electrical signals.',
    protocol: 'Piezoelectric Ceramic Sensing (-211 dB re 1V/µPa)',
    operatingVoltage: 'Passive Voltage Projector (No Bias Required)',
    currentDraw: '0 mA Passive',
    pins: [
      { id: 'sig_out', label: 'SIG_OUT', x: 150, y: 50, type: 'ADC', description: 'Hydrophone Differential Audio Output (+)' },
      { id: 'gnd_shield', label: 'SHIELD', x: 150, y: 85, type: 'GROUND', description: 'Waterproof Coaxial Shield Ground Return' }
    ]
  },
  {
    id: 'acoustics_lna',
    name: 'Low-Noise Acoustic Front-End (LNA)',
    category: 'ACOUSTIC',
    modelNumber: 'Analog Devices AD8429 Low-Noise Instrumentation Amplifier',
    status: 'ARCHITECTURAL',
    x: 1650,
    y: 70,
    width: 190,
    height: 130,
    description: 'Shielded ultralow-noise analog preamplifier providing 40 dB gain with 0.8 nV/√Hz input noise density.',
    roleInMarislink: 'Boosts weak deep-sea acoustic signals received by the hydrophone to full-scale ADC input range.',
    protocol: 'Differential Analog Audio Amplification (10 Hz - 200 kHz)',
    operatingVoltage: '5V Regulated Dual-Supply',
    currentDraw: '12 mA',
    pins: [
      { id: 'in_pos', label: 'IN+', x: 30, y: 50, type: 'ADC', description: 'Differential Acoustic Input from Hydrophone' },
      { id: 'in_neg', label: 'IN-', x: 30, y: 85, type: 'GROUND', description: 'Shield / Ground Input Reference' },
      { id: 'out_pos', label: 'OUT+', x: 160, y: 50, type: 'ADC', description: 'Amplified Differential Output to ADC (+)' },
      { id: 'out_neg', label: 'OUT-', x: 160, y: 85, type: 'ADC', description: 'Amplified Differential Output to ADC (-)' },
      { id: 'vcc_5v', label: '5V', x: 95, y: 20, type: 'POWER', description: '5V Analog Power Supply' }
    ]
  },
  {
    id: 'acoustics_adc',
    name: '24-Bit Acoustic Sigma-Delta ADC',
    category: 'ACOUSTIC',
    modelNumber: 'Texas Instruments ADS127L11 Precision 24-Bit / 400 kSPS ADC',
    status: 'ARCHITECTURAL',
    x: 1880,
    y: 70,
    width: 180,
    height: 130,
    description: 'Ultra-low distortion 24-bit delta-sigma ADC with 111 dB SNR converting amplified acoustic analog waveforms into digital bitstreams.',
    roleInMarislink: 'Digitizes incoming acoustic communication frames for DSP demodulation by the STM32 and AMD Versal processor.',
    protocol: 'SPI (20 MHz Clock Rate)',
    operatingVoltage: '3.3V Digital / 5V Analog',
    currentDraw: '18 mA',
    pins: [
      { id: 'ain_pos', label: 'AIN+', x: 30, y: 50, type: 'ADC', description: 'Differential Analog Input (+) from LNA' },
      { id: 'ain_neg', label: 'AIN-', x: 30, y: 85, type: 'ADC', description: 'Differential Analog Input (-) from LNA' },
      { id: 'spi_dout', label: 'DOUT', x: 120, y: 110, type: 'SPI', description: 'Digitized 24-Bit Acoustic Sample Stream (SPI MISO)' },
      { id: 'spi_sck', label: 'SCK', x: 70, y: 110, type: 'SPI', description: 'High-Speed SPI Clock Input' },
      { id: 'spi_cs', label: 'CS', x: 30, y: 110, type: 'SPI', description: 'ADC Frame Chip Select' }
    ]
  },

  // ── E. ACOUSTIC TRANSMITTER ────────────────────────────────────────────────
  {
    id: 'acoustics_dac',
    name: 'Acoustic Modulation DAC Module',
    category: 'ACOUSTIC',
    modelNumber: 'Analog Devices AD5791 24-Bit / 1 MSPS Waveform Synthesizer',
    status: 'ARCHITECTURAL',
    x: 1420,
    y: 310,
    width: 180,
    height: 130,
    description: 'High-speed digital-to-analog converter generating clean modulated multi-frequency FSK/OFDM acoustic carrier waveforms.',
    roleInMarislink: 'Synthesizes transmission symbols computed by the SNC swarm routing stack into analog acoustic drive signals.',
    protocol: 'SPI Waveform Streaming (Up to 35 MHz)',
    operatingVoltage: '3.3V Logic / ±10V Analog',
    currentDraw: '15 mA',
    pins: [
      { id: 'spi_din', label: 'DIN', x: 30, y: 50, type: 'SPI', description: 'Baseband Modulated Data Input (SPI MOSI)' },
      { id: 'spi_sck', label: 'SCK', x: 30, y: 80, type: 'SPI', description: 'DAC Sample Clock' },
      { id: 'spi_cs', label: 'CS', x: 30, y: 105, type: 'SPI', description: 'DAC Chip Select' },
      { id: 'vout_analog', label: 'AOUT', x: 150, y: 60, type: 'DAC', description: 'Synthesized Analog Acoustic Waveform Output' },
      { id: 'gnd', label: 'GND', x: 150, y: 90, type: 'GROUND', description: 'Ground Reference' }
    ]
  },
  {
    id: 'acoustics_power_amp',
    name: 'High-Power Acoustic Transducer Amplifier',
    category: 'ACOUSTIC',
    modelNumber: '100W RMS Class-D / Step-Up Acoustic Power Driver',
    status: 'ARCHITECTURAL',
    x: 1640,
    y: 310,
    width: 200,
    height: 140,
    description: 'High-voltage subsea acoustic amplifier with step-up impedance matching transformer driving capacitive piezoelectric transducers.',
    roleInMarislink: 'Boosts 1V analog waveform from DAC up to 200Vrms high-voltage drive to propagate sound waves across 10 km underwater ranges.',
    protocol: 'Step-Up High-Voltage Resonant Driver (10 kHz - 35 kHz)',
    operatingVoltage: '12V DC Supply Input (Steps up to 200V RMS)',
    currentDraw: 'Peak 8A Burst during Acoustic Transmit',
    pins: [
      { id: 'sig_in', label: 'SIG_IN', x: 30, y: 50, type: 'DAC', description: 'Analog Audio Drive Signal from Modulation DAC' },
      { id: 'sig_gnd', label: 'GND', x: 30, y: 85, type: 'GROUND', description: 'Signal Ground Reference' },
      { id: 'vcc_12v', label: '12V_IN', x: 100, y: 20, type: 'POWER', description: '+12V High-Current Supply Rail from DC-DC Converter' },
      { id: 'hv_out_pos', label: 'HV+', x: 170, y: 50, type: 'POWER', description: 'High-Voltage 200Vrms Transducer Drive (+)' },
      { id: 'hv_out_neg', label: 'HV-', x: 170, y: 85, type: 'GROUND', description: 'High-Voltage Transducer Return (-)' }
    ]
  },
  {
    id: 'acoustics_transducer',
    name: 'Piezoelectric Tonpilz Acoustic Projector',
    category: 'ACOUSTIC',
    modelNumber: 'Tonpilz Piezoelectric Projector (PZT-4 Stack, 25 kHz)',
    status: 'ARCHITECTURAL',
    x: 1880,
    y: 310,
    width: 190,
    height: 140,
    description: 'High-acoustic-power Tonpilz transducer featuring prestressed PZT ceramic rings, aluminum head mass, and heavy brass tail mass.',
    roleInMarislink: 'Transmits high-intensity acoustic sound pressure pulses into the ocean water to communicate with swarm nodes.',
    protocol: 'High-Voltage Piezoelectric Resonance (25 kHz Center Freq)',
    operatingVoltage: '200V RMS Drive',
    currentDraw: 'High-Power Transmit Projector (Source Level: 185 dB re 1µPa @ 1m)',
    pins: [
      { id: 'pzt_pos', label: 'PZT+', x: 30, y: 50, type: 'POWER', description: 'High-Voltage Acoustic Projector Terminal (+)' },
      { id: 'pzt_neg', label: 'PZT-', x: 30, y: 85, type: 'GROUND', description: 'High-Voltage Acoustic Projector Return (-)' }
    ]
  },

  // ── F. STORAGE ─────────────────────────────────────────────────────────────
  {
    id: 'storage_microsd',
    name: 'Industrial SLC MicroSD Card Storage',
    category: 'STORAGE',
    modelNumber: 'Swissbit / ATP Industrial Grade 32GB SLC MicroSD',
    status: 'ARCHITECTURAL',
    x: 820,
    y: 660,
    width: 190,
    height: 130,
    description: 'High-endurance Single-Level Cell (SLC) NAND flash memory card rated for continuous subsea black-box mission flight recording.',
    roleInMarislink: 'Provides non-volatile telemetry storage logging depth, temperature, water-leak logs, and communication health.',
    protocol: 'SDIO 4-Bit High-Speed Bus (50 MHz)',
    operatingVoltage: '3.3V DC',
    currentDraw: '25 mA Active Write',
    pins: [
      { id: 'vcc', label: '3V3', x: 40, y: 40, type: 'POWER', description: '3.3V Flash Memory Power Supply' },
      { id: 'dat0', label: 'DAT0', x: 100, y: 20, type: 'SPI', description: 'SDIO Data Line 0' },
      { id: 'clk', label: 'CLK', x: 130, y: 20, type: 'SPI', description: 'SDIO High-Speed Clock Line' },
      { id: 'cmd', label: 'CMD', x: 160, y: 20, type: 'SPI', description: 'SDIO Command / Response Line' },
      { id: 'gnd', label: 'GND', x: 40, y: 80, type: 'GROUND', description: 'Ground' }
    ]
  },
  {
    id: 'storage_emmc_nvme',
    name: 'Industrial High-Endurance NVMe SSD',
    category: 'STORAGE',
    modelNumber: 'Industrial M.2 2280 NVMe SSD (256GB, Wide-Temp)',
    status: 'ARCHITECTURAL',
    x: 1080,
    y: 660,
    width: 230,
    height: 120,
    description: 'Wide-temperature industrial solid-state drive with hardware power-loss protection (PLP) for mass acoustic spectrogram archives.',
    roleInMarislink: 'Stores raw digitized acoustic hydrophone time-series data and deep learning model weights for the AMD Versal AI engine.',
    protocol: 'PCIe Gen3 x2 (NVMe 1.4, Up to 1.5 GB/s)',
    operatingVoltage: '3.3V DC',
    currentDraw: '450 mA Active Write Burst',
    pins: [
      { id: 'vcc_3v3', label: '3V3', x: 40, y: 40, type: 'POWER', description: '3.3V Power Rail' },
      { id: 'pcie_lane0', label: 'PCIe_RX', x: 120, y: 20, type: 'SPI', description: 'High-Speed PCIe Differential Data Line' },
      { id: 'gnd', label: 'GND', x: 40, y: 80, type: 'GROUND', description: 'Ground Reference' }
    ]
  },

  // ── G. EXTERNAL INTERFACES ─────────────────────────────────────────────────
  {
    id: 'interface_wetmate_data',
    name: 'Subsea Wet-Mate Data Connector',
    category: 'INTERFACE',
    modelNumber: 'SubConn Underwater 8-Pin High-Speed Ethernet Wet-Mate',
    status: 'ARCHITECTURAL',
    x: 1420,
    y: 570,
    width: 180,
    height: 130,
    description: 'Pressure-balanced underwater data connector facilitating Gigabit/Fast Ethernet links to surface vessels or AUV docking stations.',
    roleInMarislink: 'Enables high-speed bulk data offloading of historical acoustic recordings when recovered or docked.',
    protocol: '100BASE-TX / 1000BASE-T Ethernet',
    operatingVoltage: '1.2V - 3.3V Differential Signaling',
    currentDraw: 'Passive Connector (500V Insulation Breakdown)',
    pins: [
      { id: 'eth_rx_p', label: 'RX+', x: 140, y: 45, type: 'UART', description: 'Ethernet Differential Receive Pair (+)' },
      { id: 'eth_tx_p', label: 'TX+', x: 140, y: 75, type: 'UART', description: 'Ethernet Differential Transmit Pair (+)' },
      { id: 'shield', label: 'SHIELD', x: 40, y: 60, type: 'GROUND', description: 'Connector Marine Chassis Shield Ground' }
    ]
  },
  {
    id: 'interface_debug_port',
    name: 'Diagnostic & SWD Programming Port',
    category: 'INTERFACE',
    modelNumber: 'Internal USB-C Diagnostic Receptacle & 10-Pin Cortex Debug Header',
    status: 'ARCHITECTURAL',
    x: 1630,
    y: 570,
    width: 180,
    height: 130,
    description: 'Internal diagnostic port accessible during laboratory calibration before subsea canister pressure sealing.',
    roleInMarislink: 'Enables firmware flashing, real-time debugging, and benchtop hardware-in-the-loop validation.',
    protocol: 'SWD / JTAG (ARM Cortex) + USB 2.0 Full-Speed CDC',
    operatingVoltage: '3.3V Logic / 5V USB VBUS',
    currentDraw: 'Diagnostic Tap (<10 mA)',
    pins: [
      { id: 'swdio', label: 'SWDIO', x: 40, y: 45, type: 'GPIO', description: 'Serial Wire Debug Data Line to STM32' },
      { id: 'swclk', label: 'SWCLK', x: 40, y: 75, type: 'GPIO', description: 'Serial Wire Debug Clock Line to STM32' },
      { id: 'vbus', label: 'VBUS', x: 140, y: 60, type: 'POWER', description: '5V USB VBUS Sense Input' }
    ]
  },

  // ── H. STATUS INDICATORS ───────────────────────────────────────────────────
  {
    id: 'led_indicators_panel',
    name: 'Subsea Optical Status Indicator Array',
    category: 'INDICATOR',
    modelNumber: 'IP68 Sealed Marine Optical Status Beacon Array (4-Channel)',
    status: 'ARCHITECTURAL',
    x: 1870,
    y: 570,
    width: 190,
    height: 130,
    description: 'Four hermetically sealed high-luminance optical indicator lenses visible through pressure hull viewport.',
    roleInMarislink: 'Visual inspection beacon for divers and ROV cameras confirming power state, acoustic sync, and fault warnings.',
    protocol: 'Direct Microcontroller GPIO Sink/Source Drivers',
    operatingVoltage: '3.3V Logic (Current-Limited via 330Ω Resistors)',
    currentDraw: '20 mA per Channel',
    pins: [
      { id: 'pwr_in', label: 'PWR', x: 40, y: 40, type: 'GPIO', description: 'Green LED: System Power Good Indicator' },
      { id: 'sync_in', label: 'SYNC', x: 80, y: 40, type: 'GPIO', description: 'Yellow LED: Acoustic Network Time Sync Lock' },
      { id: 'comm_in', label: 'COMM', x: 120, y: 40, type: 'GPIO', description: 'Blue LED: Acoustic Active Transmission Burst' },
      { id: 'alert_in', label: 'ALERT', x: 160, y: 40, type: 'GPIO', description: 'Red LED: Critical Leak or Hardware Anomaly Alarm' },
      { id: 'gnd', label: 'GND', x: 100, y: 90, type: 'GROUND', description: 'Common Indicator Cathode Return' }
    ]
  }
];'''

# ── 3. DEFINE UNDERWATER_WIRES ───────────────────────────────────────────────
UNDERWATER_WIRES_TS = '''const UNDERWATER_WIRES: CircuitWire[] = [
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
    signalDescription: 'Raw differential analog hydrophone audio voltage generated by incoming ocean sound waves'
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
    signalDescription: 'Subsea braided coaxial cable ground return reference'
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
    signalDescription: 'Conditioned differential analog audio waveform spanning 10 Hz to 200 kHz'
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
    signalDescription: 'Balanced negative-phase analog acoustic audio stream'
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
    signalDescription: 'High-speed serialized delta-sigma digital audio bitstream'
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
    signalDescription: 'Continuous SPI Master Clock generating frame timing'
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
    signalDescription: 'Active-Low SPI slave select line'
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
    signalDescription: 'Serialized high-speed 24-bit DDS waveform synthesis samples'
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
    signalDescription: 'Precise hardware SPI clock governing acoustic carrier frequency'
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
    signalDescription: 'Active-Low hardware SPI chip select'
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
    signalDescription: 'Reconstructed analog sine/OFDM multi-tone transmission signal'
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
    signalDescription: 'Analog ground return between DAC and transducer driver'
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
    signalDescription: 'Transformer-coupled high-voltage AC acoustic power pulse'
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
    signalDescription: 'High-voltage return connection'
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
    signalDescription: 'I2C Serial Data line carrying calibrated millibar/MPa pressure values'
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
    signalDescription: 'I2C Serial Clock running at 400 kHz standard fast-mode'
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
    signalDescription: 'Analog resistance proportional to ocean temperature (0.01°C resolution)'
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
    signalDescription: 'I2C multi-sensor data bus reporting node tilt and orientation'
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
    signalDescription: 'I2C Clock Line shared with environmental bus'
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
    signalDescription: 'Emergency digital interrupt triggering distress acoustic ping and power shutdown'
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
    signalDescription: 'High-speed UART serial channel running at 921,600 baud'
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
    signalDescription: 'High-speed UART serial response telemetry'
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
    signalDescription: 'High-throughput inter-processor DMA channel'
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
    signalDescription: 'High-speed SDIO 4-bit data bus operating at 50 MHz'
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
    signalDescription: 'PCIe Gen3 x2 high-speed data stream writing at up to 1.5 GB/s'
  },

  // ── 6. Power Distribution Path (Batteries -> Path Mgr -> DC-DC -> Loads) ────
  {
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
  },
  {
    id: 'w-sec-bat-bms',
    name: 'Rechargeable Li-Ion Buffer Battery to BMS Board',
    busType: 'POWER',
    sourceComponentId: 'pwr_backup_battery',
    sourcePinId: 'bat_pos',
    destComponentId: 'pwr_bms',
    destPinId: 'b_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+14.8V DC',
    connectionPurpose: 'Connects secondary high-current buffer battery to protection and balancing circuit',
    signalDescription: 'Unregulated cell stack power connection'
  },
  {
    id: 'w-bms-path-mgr',
    name: 'Protected Li-Ion Buffer Power to Power Path Manager',
    busType: 'POWER',
    sourceComponentId: 'pwr_bms',
    sourcePinId: 'p_pos',
    destComponentId: 'pwr_path_mgmt',
    destPinId: 'sec_in',
    color: '#ef4444',
    colorName: 'Red (Power Bus)',
    voltage: '+14.8V DC',
    connectionPurpose: 'Supplies buffered surge power during high-energy acoustic transmission bursts',
    signalDescription: 'BMS-protected high-current secondary power feed'
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
    signalDescription: 'High-current external DC power line'
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
    signalDescription: 'Main unregulated DC system power bus'
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
    signalDescription: 'High-current regulated power rail designed for 8A transient pulses'
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
    signalDescription: 'Ultra-stable low-noise digital VDD power rail'
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
    signalDescription: 'High-current regulated power feed for adaptive neural processor'
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
    signalDescription: 'Clean analog supply filtered with LC network'
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
    signalDescription: 'Precision Kelvin voltage sense tap across 10 mΩ shunt'
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
    signalDescription: 'I2C telemetry stream reporting battery reserve percentage'
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
    signalDescription: 'Shared I2C clock line'
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
    signalDescription: '100BASE-TX differential receive channel'
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
    signalDescription: 'Bi-directional ARM Cortex Serial Wire Debug line'
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
    signalDescription: 'SWD Clock input line'
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
    signalDescription: 'Digital output drive current to green status LED'
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
    signalDescription: 'Digital pulse output driving blue status LED'
  }
];'''

# Replace UNDERWATER_COMPONENTS
m_uc = re.search(r'const UNDERWATER_COMPONENTS: CircuitComponent\[\] = \[.*?\n\];', content, re.DOTALL)
assert m_uc, 'UNDERWATER_COMPONENTS not found'
content = content[:m_uc.start()] + UNDERWATER_COMPS_TS + content[m_uc.end():]

# Replace UNDERWATER_WIRES
m_uw = re.search(r'const UNDERWATER_WIRES: CircuitWire\[\] = \[.*?\n\];', content, re.DOTALL)
assert m_uw, 'UNDERWATER_WIRES not found'
content = content[:m_uw.start()] + UNDERWATER_WIRES_TS + content[m_uw.end():]

# Add UNDERWATER_GROUPS right before UNDERWATER_COMPONENTS if not present
if 'UNDERWATER_GROUPS' not in content:
    idx = content.find('const UNDERWATER_COMPONENTS: CircuitComponent[]')
    content = content[:idx] + GROUPS_TS + '\n' + content[idx:]

# Update viewBox for complete_underwater
content = content.replace("viewBox={mode === 'complete_underwater' ? '0 0 1600 920' : '0 0 1000 680'}",
                          "viewBox={mode === 'complete_underwater' ? '0 0 2150 890' : '0 0 1000 680'}")

with open('src/pages/CircuitConnectionsPage.tsx', 'w') as f:
    f.write(content)

print('Successfully rebuilt Mode B components, wires, and groups in CircuitConnectionsPage.tsx!')
