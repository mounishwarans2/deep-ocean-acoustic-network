import { useState, useEffect, useCallback, useRef } from 'react';
import type { UnderwaterDevice, NetworkLink, SNCMetrics, AIDecision, KafkaMetrics, SparkMetrics, CassandraMetrics, PipelineStatus, Alert, HistoryPoint } from '../types';
import { generateDevices, generateLinks, recomputeAllRoutes } from '../simulation/nodes';
import { updateDeviceTelemetry, updateLinkTelemetry, computeNetworkSNC, generateAIDecision, generateKafkaMetrics, generateSparkMetrics, generateCassandraMetrics, generatePipelineStatus, generateAlerts, generateHistory } from '../simulation/telemetry';

const MAX_HISTORY = 120;

export interface SimulationState {
  devices: UnderwaterDevice[];
  links: NetworkLink[];
  snc: SNCMetrics;
  aiDecision: AIDecision;
  kafka: KafkaMetrics;
  spark: SparkMetrics;
  cassandra: CassandraMetrics;
  pipeline: PipelineStatus;
  alerts: Alert[];
  historyLatency: HistoryPoint[];
  historyPacketLoss: HistoryPoint[];
  historyTrafficIntensity: HistoryPoint[];
  historyBattery: HistoryPoint[];
  historyThroughput: HistoryPoint[];
  historySignalQuality: HistoryPoint[];
  lastUpdate: number;
}

function trimHistory(arr: HistoryPoint[]): HistoryPoint[] {
  return arr.length > MAX_HISTORY ? arr.slice(arr.length - MAX_HISTORY) : arr;
}

export function useSimulation() {
  const [state, setState] = useState<SimulationState | null>(null);
  const initialized = useRef(false);

  const initialize = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;
    const devices = generateDevices();
    const links = generateLinks(devices);
    const snc = computeNetworkSNC(devices);
    const aiDecision = generateAIDecision();
    const kafka = generateKafkaMetrics(devices.length);
    const spark = generateSparkMetrics();
    const cassandra = generateCassandraMetrics();
    const pipeline = generatePipelineStatus();
    const alerts = generateAlerts(devices, links);
    const avgLatency = devices.reduce((s, d) => s + d.latency, 0) / devices.length;
    const avgLoss = devices.reduce((s, d) => s + d.packetLoss, 0) / devices.length;
    const avgBattery = devices.reduce((s, d) => s + d.secondaryBattery, 0) / devices.length;
    const avgSignal = devices.reduce((s, d) => s + d.signalQuality, 0) / devices.length;

    setState({
      devices, links, snc, aiDecision, kafka, spark, cassandra, pipeline, alerts,
      historyLatency: generateHistory(MAX_HISTORY, avgLatency, 40),
      historyPacketLoss: generateHistory(MAX_HISTORY, avgLoss, 3),
      historyTrafficIntensity: generateHistory(MAX_HISTORY, snc.trafficIntensity, 0.15),
      historyBattery: generateHistory(MAX_HISTORY, avgBattery, 8),
      historyThroughput: generateHistory(MAX_HISTORY, snc.throughput, 10),
      historySignalQuality: generateHistory(MAX_HISTORY, avgSignal, 10),
      lastUpdate: Date.now(),
    });
  }, []);

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (!state) return;
    const interval = setInterval(() => {
      setState(prev => {
        if (!prev) return prev;
        const devices = prev.devices.map(d => updateDeviceTelemetry(d));
        devices.forEach(d => computeSNCInline(d));
        const links = prev.links.map(l => updateLinkTelemetry(l));
        const { routesChanged } = recomputeAllRoutes(devices, links);
        const snc = computeNetworkSNC(devices);
        const alerts = generateAlerts(devices, links, routesChanged);
        const kafka = generateKafkaMetrics(devices.length);
        const spark = generateSparkMetrics();
        const cassandra = generateCassandraMetrics();
        const avgLatency = devices.reduce((s, d) => s + d.latency, 0) / devices.length;
        const avgLoss = devices.reduce((s, d) => s + d.packetLoss, 0) / devices.length;
        const avgBattery = devices.reduce((s, d) => s + d.secondaryBattery, 0) / devices.length;
        const avgSignal = devices.reduce((s, d) => s + d.signalQuality, 0) / devices.length;

        return {
          ...prev, devices, links, snc, alerts, kafka, spark, cassandra,
          historyLatency: trimHistory([...prev.historyLatency, { timestamp: Date.now(), value: Math.round(avgLatency * 10) / 10 }]),
          historyPacketLoss: trimHistory([...prev.historyPacketLoss, { timestamp: Date.now(), value: Math.round(avgLoss * 100) / 100 }]),
          historyTrafficIntensity: trimHistory([...prev.historyTrafficIntensity, { timestamp: Date.now(), value: snc.trafficIntensity }]),
          historyBattery: trimHistory([...prev.historyBattery, { timestamp: Date.now(), value: Math.round(avgBattery * 100) / 100 }]),
          historyThroughput: trimHistory([...prev.historyThroughput, { timestamp: Date.now(), value: snc.throughput }]),
          historySignalQuality: trimHistory([...prev.historySignalQuality, { timestamp: Date.now(), value: Math.round(avgSignal * 10) / 10 }]),
          lastUpdate: Date.now(),
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [state !== null]);

  return { state };
}

function computeSNCInline(device: UnderwaterDevice): void {
  const arr = device.throughput;
  const svc = arr * 1.3 + Math.random() * 0.5;
  device.arrivalRate = Math.round(arr * 10) / 10;
  device.serviceRate = Math.round(svc * 10) / 10;
  device.trafficIntensity = Math.round((arr / svc) * 100) / 100;
  device.averageDelay = Math.round(device.latency * 10) / 10;
  device.delayBound = Math.round(device.averageDelay * 1.7 * 10) / 10;
  device.backlog = Math.floor(device.packetsSent * device.packetLoss / 100 * 0.3);
  device.bufferUtilization = Math.min(95, Math.round(device.trafficIntensity * 100 * 0.9));
}
