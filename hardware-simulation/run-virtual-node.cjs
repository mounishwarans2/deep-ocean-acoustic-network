/**
 * ==============================================================================
 * MARISLINK: Intelligent Underwater Acoustic Communication & Monitoring System
 * ==============================================================================
 * Virtual Hardware IoT Node Engine & Live Bridge
 *
 * Implements the exact same physical sensor dynamics, hydrostatic transfer
 * functions, and acoustic communication state machine as the ESP32 C++ firmware.
 *
 * Transmits real-time simulated virtual hardware measurements directly to the
 * MARISLINK Node.js Express backend (Port 5000).
 *
 * Telemetry Cadence: 2000 ms (2.0 seconds)
 * ==============================================================================
 */

const http = require('http');

const BACKEND_URL = process.env.MARISLINK_API || 'http://localhost:5000/api/hardware/telemetry';
const BACKEND_HOST = process.env.MARISLINK_HOST || '127.0.0.1';
const BACKEND_PORT = Number(process.env.MARISLINK_PORT || 5000);
const BACKEND_PATH = '/api/hardware/telemetry';

const NODE_ID = 'ESP32-UW01';
const DEVICE_NAME = 'Virtual ESP32 Deep Acoustic Node';
const NOMINAL_DEPTH_M = 2000.0;
const NOMINAL_TEMP_C = 3.4;
const SEAWATER_DENSITY = 1025.0; // kg/m^3
const GRAVITY = 9.80665; // m/s^2

let sequence = 0;
let batteryVoltage = 4.12; // Start with healthy LiPo
let batteryLevel = 95.8;
let running = true;
let totalSent = 0;
let totalSuccess = 0;
let totalFailed = 0;

console.log('\x1b[36m%s\x1b[0m', '======================================================================');
console.log('\x1b[1m\x1b[34m%s\x1b[0m', ' MARISLINK: Virtual ESP32 Underwater IoT Hardware Node');
console.log('\x1b[36m%s\x1b[0m', '======================================================================');
console.log(` Target Ingestion URL : http://${BACKEND_HOST}:${BACKEND_PORT}${BACKEND_PATH}`);
console.log(` Emulated Node ID     : ${NODE_ID}`);
console.log(` Transducers Emulated : BMP280 (Temp + Pressure), LiPo ADC, Acoustic RSSI`);
console.log(` Measurement Model   : SIMULATED_VIRTUAL_HARDWARE (Atmospheric-to-Hydrostatic)`);
console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------------------\n');

function generateTelemetry() {
  sequence++;
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  const nowMs = Date.now();

  // 1. BMP280 Physical Transducer Emulation
  // Room/chamber pressure in hPa with atmospheric barometric jitter
  const rawSensorHpa = Math.round((1013.25 + Math.sin(nowMs / 6000) * 1.5 + (Math.random() - 0.5) * 0.4) * 100) / 100;
  const rawChamberTempC = Math.round((24.8 + Math.sin(nowMs / 8000) * 0.4 + (Math.random() - 0.5) * 0.1) * 100) / 100;

  // 2. Ocean Hydrostatic Transfer Function
  // Deep abyssal temperature at 2000m: ~3.4 °C with internal tide micro-oscillation
  const tempJitter = (Math.sin(nowMs / 4500) * 0.12) + ((Math.random() - 0.5) * 0.05);
  const temperatureC = Math.round((NOMINAL_TEMP_C + tempJitter) * 100) / 100;

  // Calibrated Depth & Hydrostatic Pressure
  const depthJitter = (Math.sin(nowMs / 7000) * 2.2) + ((rawSensorHpa - 1013.25) * 0.6);
  const depthM = Math.round((NOMINAL_DEPTH_M + depthJitter) * 10) / 10;

  // Hydrostatic pressure in MPa: P = (rho * g * h) / 10^6
  // At 2000m: ~20.35 MPa (200 atmospheres)
  const pressureMpa = Math.round(((depthM * SEAWATER_DENSITY * GRAVITY) / 1000000.0 + (Math.sin(nowMs / 12000) * 0.04)) * 1000) / 1000;

  // 3. Battery Voltage & Capacity Simulation
  // Continuous microscopic discharge: -0.0003V per cycle
  batteryVoltage = Math.max(3.25, Math.round((batteryVoltage - 0.00025 + (Math.random() - 0.5) * 0.0001) * 1000) / 1000);
  batteryLevel = Math.max(0, Math.min(100, Math.round((((batteryVoltage - 3.25) / (4.20 - 3.25)) * 100) * 10) / 10));

  // 4. Acoustic Signal Strength (RSSI in dBm)
  // Distance attenuation + multipath fading + thermocline refraction
  const sigJitter = (Math.sin(nowMs / 5000) * 3.5) + ((Math.random() - 0.5) * 1.5);
  const signalStrength = Math.round((-68.0 + sigJitter) * 10) / 10;

  // Acoustic Latency & Packet Loss
  const latencyMs = Math.round((138.0 + Math.sin(nowMs / 3500) * 8.0 + (Math.random() - 0.5) * 4.0) * 10) / 10;
  const packetLoss = Math.round((2.1 + (signalStrength < -72 ? 1.5 : 0) + (Math.random() * 0.6)) * 100) / 100;

  // Operational Classification
  let commStatus = 'OPTIMAL';
  let nodeStatus = 'ACTIVE';
  if (batteryLevel < 20 || packetLoss > 10 || latencyMs > 280) {
    commStatus = 'CRITICAL';
    nodeStatus = 'CRITICAL';
  } else if (batteryLevel < 35 || packetLoss > 5 || latencyMs > 180) {
    commStatus = 'DEGRADED';
    nodeStatus = 'WARNING';
  }

  const payload = {
    node_id: NODE_ID,
    device_name: DEVICE_NAME,
    sequence,
    timestamp,
    depth_m: depthM,
    temperature_c: temperatureC,
    pressure_mpa: pressureMpa,
    raw_sensor_hpa: rawSensorHpa,
    raw_chamber_temp_c: rawChamberTempC,
    battery_voltage_v: batteryVoltage,
    battery_level: batteryLevel,
    signal_strength: signalStrength,
    latency_ms: latencyMs,
    packet_loss: packetLoss,
    communication_status: commStatus,
    node_status: nodeStatus,
    source: 'nodejs-virtual-hardware-fallback',
    source_label: 'NODE.JS VIRTUAL HARDWARE FALLBACK',
    is_actual_wokwi: false,
    firmware_type: 'NODEJS_ENGINE_FALLBACK',
    hardware_execution: 'HOST_ENGINE_FALLBACK',
    measurement_type: 'SIMULATED_VIRTUAL_HARDWARE',
    calibration_model: 'BMP280_ATMOSPHERIC_TO_HYDROSTATIC_TRANSFER_FN',
    leds: {
      tx_green: true,
      sync_yellow: true,
      alert_red: nodeStatus === 'CRITICAL',
    },
  };

  return payload;
}

function sendTelemetry() {
  if (!running) return;
  const payload = generateTelemetry();
  const dataString = JSON.stringify(payload);
  totalSent++;

  const reqOptions = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: BACKEND_PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataString),
    },
    timeout: 3000,
  };

  const req = http.request(reqOptions, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        totalSuccess++;
        process.stdout.write(
          `\x1b[32m[TX #${payload.sequence}]\x1b[0m ${payload.timestamp} | ` +
          `\x1b[1mTemp: ${payload.temperature_c}°C\x1b[0m | ` +
          `\x1b[34mPress: ${payload.pressure_mpa} MPa (${payload.depth_m}m)\x1b[0m | ` +
          `\x1b[33mBat: ${payload.battery_voltage_v}V (${payload.battery_level}%)\x1b[0m | ` +
          `\x1b[35mRSSI: ${payload.signal_strength} dBm\x1b[0m | ` +
          `\x1b[36mHTTP ${res.statusCode} OK\x1b[0m\n`
        );
      } else {
        totalFailed++;
        process.stdout.write(
          `\x1b[31m[TX #${payload.sequence} WARN]\x1b[0m Backend responded HTTP ${res.statusCode}: ${body.slice(0, 80)}\n`
        );
      }
    });
  });

  req.on('error', (err) => {
    totalFailed++;
    process.stdout.write(
      `\x1b[33m[TX #${payload.sequence} RETRY]\x1b[0m Connection to MARISLINK server failed (${err.message}). Buffering...\n`
    );
  });

  req.on('timeout', () => {
    req.destroy();
    totalFailed++;
    process.stdout.write(`\x1b[33m[TX #${payload.sequence} TIMEOUT]\x1b[0m Request timed out.\n`);
  });

  req.write(dataString);
  req.end();
}

// Start continuous loop
const timer = setInterval(sendTelemetry, 2000);
// Send first packet immediately
sendTelemetry();

// Graceful exit handling
process.on('SIGINT', () => {
  running = false;
  clearInterval(timer);
  console.log('\n\x1b[36m%s\x1b[0m', '----------------------------------------------------------------------');
  console.log(` Virtual Node Stopped. Packets Sent: ${totalSent} | Ingested: ${totalSuccess} | Failed: ${totalFailed}`);
  console.log('\x1b[36m%s\x1b[0m', '======================================================================');
  process.exit(0);
});
