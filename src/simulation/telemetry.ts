import type { UnderwaterDevice, NetworkLink, SNCMetrics, AIDecision, Alert, KafkaMetrics, SparkMetrics, CassandraMetrics, PipelineStatus, HistoryPoint } from '../types';

export const PACKET_LOSS_BASELINE = 2.0;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function drift(current: number, volatility: number, min: number, max: number): number {
  const delta = (Math.random() - 0.5) * 2 * volatility;
  return clamp(current + delta, min, max);
}

export function updateDeviceTelemetry(device: UnderwaterDevice): UnderwaterDevice {
  if (device.type === 'DATA_CENTER') {
    return {
      ...device,
      packetsReceived: device.packetsReceived + Math.floor(Math.random() * 50 + 10),
      throughput: device.throughput + Math.random() * 5,
    };
  }
  const isMain = device.type === 'GATEWAY';
  const isSurface = device.type === 'SURFACE_RECEIVER';
  const isSub = device.type === 'ACOUSTIC_RELAY' || device.type === 'NAVIGATION_RELAY' || device.type === 'SEAFLOOR_RELAY';

  const newPacketsSent = device.packetsSent + Math.floor(Math.random() * 20 + 5);
  const newPacketLoss = drift(device.packetLoss, 0.12, 0, 6);
  const newPacketsReceived = Math.floor(newPacketsSent * (1 - newPacketLoss / 100));

  const newSecondary = drift(device.secondaryBattery, 0.06, 72, 100);
  const newPrimary = drift(device.primaryBattery, 0.015, 97, 100);
  const minLoad = isSurface ? 2.5 : isMain ? 3.5 : isSub ? 1.8 : 0.8;
  const maxLoad = isSurface ? 4.0 : isMain ? 5.5 : isSub ? 4.0 : 2.8;
  const newLoad = drift(device.powerLoad, 0.05, minLoad, maxLoad);

  let energyState: UnderwaterDevice['energyState'] = 'NORMAL';
  if (newSecondary < 78) energyState = 'SAVING';
  if (newSecondary < 68) energyState = 'LOW';

  let status: UnderwaterDevice['status'] = 'NORMAL';
  if (device.signalQuality < 65) status = 'WARNING';
  if (device.signalQuality < 50 || newSecondary < 62) status = 'CRITICAL';

  const throughput = drift(device.throughput, 0.8, 3, 25);

  return {
    ...device,
    status,
    primaryBattery: Math.round(newPrimary * 100) / 100,
    secondaryBattery: Math.round(newSecondary * 100) / 100,
    powerLoad: Math.round(newLoad * 100) / 100,
    temperature: drift(device.temperature, 0.08, 0.5, 8),
    pressure: device.depth * 0.1 + drift(0, 1, -2, 2),
    salinity: drift(device.salinity, 0.03, 33.5, 36.5),
    dissolvedOxygen: drift(device.dissolvedOxygen, 0.1, 2, 7),
    backgroundNoise: drift(device.backgroundNoise, 0.8, 25, 55),
    currentSpeed: drift(device.currentSpeed, 0.03, 0.05, 1.2),
    waterDensity: drift(device.waterDensity, 0.3, 1024, 1031),
    signalQuality: drift(device.signalQuality, 1.2, 55, 100),
    signalStrength: drift(device.signalStrength, 0.8, -85, -35),
    snr: drift(device.snr, 0.8, 5, 45),
    propagationDelay: drift(device.propagationDelay, 1.5, 15, 120),
    packetsSent: newPacketsSent,
    packetsReceived: newPacketsReceived,
    packetLoss: Math.round(newPacketLoss * 100) / 100,
    throughput: Math.round(throughput * 10) / 10,
    latency: drift(device.latency, 3, 50, 300),
    backlog: clamp(Math.floor(drift(device.backlog, 2, 0, 200)), 0, 200),
    bufferUtilization: clamp(Math.round(drift(device.bufferUtilization, 2, 5, 90)), 5, 95),
    energyState,
  };
}

export function updateLinkTelemetry(link: NetworkLink): NetworkLink {
  return {
    ...link,
    signalStrength: drift(link.signalStrength, 0.5, -85, -35),
    signalQuality: drift(link.signalQuality, 1, 55, 100),
    latencyMs: Math.round(drift(link.latencyMs, 2, 50, 300)),
    packetLoss: Math.round(drift(link.packetLoss, 0.1, 0, 6) * 100) / 100,
    throughput: Math.round(drift(link.throughput, 0.5, 2, 25) * 10) / 10,
    status: link.signalQuality > 70 ? 'ACTIVE' : link.signalQuality > 50 ? 'DEGRADED' : 'FAILED',
  };
}

export function computeNetworkSNC(devices: UnderwaterDevice[]): SNCMetrics {
  const totalThroughput = devices.reduce((s, d) => s + d.throughput, 0);
  const avgPacketLoss = devices.reduce((s, d) => s + d.packetLoss, 0) / devices.length;
  const totalBacklog = devices.reduce((s, d) => s + d.backlog, 0);
  const arrivalRate = totalThroughput;
  const serviceRate = arrivalRate * 1.28 + Math.random() * 0.5;
  const trafficIntensity = Math.round((arrivalRate / serviceRate) * 100) / 100;
  const avgDelay = devices.reduce((s, d) => s + d.latency, 0) / devices.length;
  const delayBound = avgDelay * 1.65;

  let stability: SNCMetrics['stability'] = 'STABLE';
  if (trafficIntensity > 0.80) stability = 'WARNING';
  if (trafficIntensity > 0.95) stability = 'CRITICAL';

  return {
    arrivalRate: Math.round(arrivalRate * 10) / 10,
    serviceRate: Math.round(serviceRate * 10) / 10,
    trafficIntensity,
    averageDelay: Math.round(avgDelay * 10) / 10,
    delayBound: Math.round(delayBound * 10) / 10,
    backlog: totalBacklog,
    bufferUtilization: Math.round(trafficIntensity * 100 * 0.88),
    throughput: Math.round(totalThroughput * 10) / 10,
    packetLoss: Math.round(avgPacketLoss * 100) / 100,
    stability,
  };
}

const AI_SCENARIOS = [
  { detected: 'Increasing acoustic noise near SUB-A', prediction: 'Link quality may decrease by 8%', recommendation: 'Shift traffic from SUB-A to SUB-B via mesh link', confidence: 91, action: 'PRISM route recalculation triggered' },
  { detected: 'Rising temperature gradient near S-06', prediction: 'Acoustic propagation speed affected', recommendation: 'Adjust signal frequency on S-06', confidence: 87, action: 'Acoustic parameters updated' },
  { detected: 'Queue backlog building at SUB-B', prediction: 'Throughput may decrease by 12%', recommendation: 'Activate alternate routing via SUB-D', confidence: 94, action: 'PRISM reroute initiated' },
  { detected: 'Battery degradation accelerating at S-08', prediction: 'Device uptime reduced by 6 hours', recommendation: 'Reduce sampling frequency on S-08', confidence: 89, action: 'Energy saving mode enabled' },
  { detected: 'Multi-path interference near SUB-C', prediction: 'Packet error rate may increase', recommendation: 'Switch to frequency-hopping mode', confidence: 85, action: 'Communication parameters updated' },
  { detected: 'Salinity fluctuation near S-02', prediction: 'Sound velocity profile changing', recommendation: 'Recalculate acoustic paths to SUB-A', confidence: 92, action: 'Acoustic model recalibrated' },
];

export function generateAIDecision(): AIDecision {
  const s = AI_SCENARIOS[Math.floor(Math.random() * AI_SCENARIOS.length)];
  return { ...s, timestamp: Date.now(), triggeredRouteRecalculation: s.action.includes('reroute') || s.action.includes('recalculation') };
}

export function generateKafkaMetrics(nodeCount: number): KafkaMetrics {
  return { messagesPerSec: Math.round((nodeCount * 60 + Math.random() * 200) * 10) / 10, consumerLag: Math.floor(Math.random() * 40 + 5), totalMessages: Math.floor(Date.now() / 1000 * 120 + Math.random() * 50000), online: true };
}

export function generateSparkMetrics(): SparkMetrics {
  return { processingRate: Math.round((1500 + Math.random() * 400) * 10) / 10, batchDuration: Math.round((1.5 + Math.random() * 1.5) * 10) / 10, activeJobs: Math.floor(3 + Math.random() * 4), online: true };
}

export function generateCassandraMetrics(): CassandraMetrics {
  return { writesPerSec: Math.round((1400 + Math.random() * 400) * 10) / 10, storageGB: Math.round((10 + Math.random() * 5) * 10) / 10, readLatency: Math.round((2 + Math.random() * 3) * 10) / 10, online: true };
}

export function generatePipelineStatus(): PipelineStatus {
  return { kafka: true, spark: true, scala: true, cassandra: true, api: true };
}

export function generateAlerts(
  devices: UnderwaterDevice[],
  links: NetworkLink[],
  routeChanges?: { nodeId: string; oldRoute: string[]; newRoute: string[] }[],
): Alert[] {
  const alerts: Alert[] = [];
  let id = 1;
  const now = Date.now();

  devices.forEach(d => {
    if (d.packetLoss > PACKET_LOSS_BASELINE) {
      const severity = d.packetLoss > PACKET_LOSS_BASELINE * 2.5 ? 'WARNING' : 'INFO';
      const action = d.packetLoss > PACKET_LOSS_BASELINE * 2.5
        ? 'HIGH PACKET LOSS - PRISM searching for alternate route'
        : 'RESENDING THE DATA - PRISM evaluating route reliability';
      alerts.push({
        id: `a-${id++}`, timestamp: now - Math.random() * 120000, severity,
        nodeId: d.id,
        message: `Packet loss above baseline on ${d.id}`,
        details: `Current: ${d.packetLoss.toFixed(1)}% | Baseline: ${PACKET_LOSS_BASELINE}% | Action: ${action}`,
        acknowledged: false,
      });
    }
  });

  links.forEach(l => {
    if (l.status === 'DEGRADED') {
      alerts.push({
        id: `a-${id++}`, timestamp: now - Math.random() * 180000, severity: 'INFO',
        nodeId: l.sourceNode,
        message: `Link ${l.sourceNode} <-> ${l.destinationNode} signal degraded`,
        details: `Signal quality: ${l.signalQuality.toFixed(1)}% | PRISM evaluating alternate route`,
        acknowledged: false,
      });
    }
    if (l.status === 'FAILED') {
      alerts.push({
        id: `a-${id++}`, timestamp: now - Math.random() * 60000, severity: 'WARNING',
        nodeId: l.sourceNode,
        message: `LINK FAILURE: ${l.sourceNode} <-> ${l.destinationNode} unavailable`,
        details: `PRISM: Detect -> Evaluate -> Reroute -> Resend -> Recover`,
        acknowledged: false,
      });
    }
  });

  if (routeChanges && routeChanges.length > 0) {
    routeChanges.forEach(rc => {
      alerts.push({
        id: `a-${id++}`, timestamp: now - Math.random() * 30000, severity: 'INFO',
        nodeId: rc.nodeId,
        message: `ROUTE CHANGED for ${rc.nodeId}`,
        details: `New route: ${rc.newRoute.join(' -> ')} | RETRANSMISSION SUCCESSFUL - Traffic resumed`,
        acknowledged: false,
      });
    });
  }

  if (alerts.length === 0) {
    alerts.push({ id: 'a-ok', timestamp: now, severity: 'INFO', nodeId: 'SYSTEM', message: 'All systems nominal', details: 'No anomalies detected - Network operational', acknowledged: false });
  }

  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}

export function generateHistory(points: number, baseValue: number, variance: number): HistoryPoint[] {
  const now = Date.now();
  const history: HistoryPoint[] = [];
  let value = baseValue;
  for (let i = 0; i < points; i++) {
    value = drift(value, variance * 0.15, baseValue - variance, baseValue + variance);
    history.push({ timestamp: now - (points - i) * 3000, value: Math.round(value * 100) / 100 });
  }
  return history;
}
