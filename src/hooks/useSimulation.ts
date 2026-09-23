import { useState, useEffect, useCallback, useRef } from 'react';
import type { UnderwaterDevice, NetworkLink, SNCMetrics, AIDecision, KafkaMetrics, SparkMetrics, CassandraMetrics, PipelineStatus, Alert, HistoryPoint, RecoveryState } from '../types';
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
  recovery: RecoveryState | null;
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

// ---- Failure / emergency-recovery engine (single source of truth) ----
// Ascent speed in meters per 3s simulation tick (MN-01 @2000m ≈ 24s to surface).
const ASCENT_PER_TICK = 250;

interface FailureCtx {
  nodeId: string;
  baselineDepth: number;
  tick: number;
  startedAt: number;
}

function failureStage(tick: number, depth: number): RecoveryState['stage'] {
  if (tick <= 1) return 'FAILED';
  if (tick <= 3) return 'BALLAST_RELEASE';
  return depth > 0 ? 'ASCENDING' : 'SURFACE';
}

function recoveryDetails(stage: RecoveryState['stage'], depth: number): string {
  switch (stage) {
    case 'FAILED':
      return 'Failure response activated. Preparing ballast release.';
    case 'BALLAST_RELEASE':
      return 'External ballast weight release initiated.';
    case 'ASCENDING':
      return `External weight detached. Ascending toward surface — depth ${Math.round(depth)} m.`;
    case 'SURFACE':
      return 'SURFACE RECOVERY — device at sea surface awaiting retrieval.';
  }
}

function clampNum(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function useSimulation() {
  const [state, setState] = useState<SimulationState | null>(null);
  const initialized = useRef(false);
  const failureRef = useRef<FailureCtx | null>(null);

  // Overlay the failure/recovery state onto freshly updated devices+links.
  // Returns updated devices, links and the current recovery snapshot.
  const applyFailure = (
    devices: UnderwaterDevice[],
    links: NetworkLink[],
    advanceTick: boolean,
  ): { devices: UnderwaterDevice[]; links: NetworkLink[]; recovery: RecoveryState | null } => {
    const ctx = failureRef.current;
    if (!ctx) return { devices, links, recovery: null };
    if (advanceTick) ctx.tick += 1;

    const failed = devices.map(d => {
      if (d.id !== ctx.nodeId) return d;
      const stage = failureStage(ctx.tick, d.depth);
      const ascending = stage === 'ASCENDING' || stage === 'SURFACE';
      const depth = stage === 'SURFACE' ? 0 : ascending ? Math.max(0, Math.round((d.depth - ASCENT_PER_TICK) * 10) / 10) : d.depth;
      return {
        ...d,
        status: 'CRITICAL' as const,
        depth,
        pressure: Math.round(depth * 0.1 * 10) / 10,
        packetLoss: 90 + Math.random() * 5,
        latency: 4000 + Math.random() * 1000,
        throughput: 0,
        signalQuality: 8 + Math.random() * 7,
        signalStrength: -85,
        snr: 3 + Math.random() * 2,
        backlog: clampNum(Math.floor(d.backlog + 12 + Math.random() * 8), 0, 400),
        bufferUtilization: 95,
      };
    });

    const failedLinks = links.map(l => {
      if (l.sourceNode !== ctx.nodeId && l.destinationNode !== ctx.nodeId) return l;
      return {
        ...l,
        status: 'FAILED' as const,
        signalStrength: -85,
        signalQuality: 8 + Math.random() * 5,
        latencyMs: 4000 + Math.floor(Math.random() * 500),
        packetLoss: Math.round((90 + Math.random() * 5) * 100) / 100,
        throughput: 0,
      };
    });

    const target = failed.find(d => d.id === ctx.nodeId);
    const stage = failureStage(ctx.tick, target ? target.depth : 0);
    return {
      devices: failed,
      links: failedLinks,
      recovery: {
        nodeId: ctx.nodeId,
        stage,
        startedAt: ctx.startedAt,
        depthAtTrigger: ctx.baselineDepth,
        ballastReleased: stage !== 'FAILED',
      },
    };
  };

  const injectFailureAlerts = (alerts: Alert[], recovery: RecoveryState | null, depth: number): Alert[] => {
    if (!recovery) return alerts;
    return [
      {
        id: 'fail-critical', timestamp: recovery.startedAt, severity: 'CRITICAL' as const,
        nodeId: recovery.nodeId, message: `${recovery.nodeId} — System Failure`,
        details: 'Underwater communication node failure detected.', acknowledged: false,
      },
      {
        id: 'fail-recovery', timestamp: recovery.startedAt + 1000, severity: 'WARNING' as const,
        nodeId: recovery.nodeId, message: `${recovery.nodeId} — Emergency recovery initiated`,
        details: recoveryDetails(recovery.stage, depth), acknowledged: false,
      },
      ...alerts,
    ];
  };

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
      devices, links, snc, aiDecision, kafka, spark, cassandra, pipeline, alerts, recovery: null,
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
        const updated = prev.devices.map(d => updateDeviceTelemetry(d));
        updated.forEach(d => computeSNCInline(d));
        const updatedLinks = prev.links.map(l => updateLinkTelemetry(l));
        // Failure overlay advances the recovery sequence (no-op when healthy).
        const failed = applyFailure(updated, updatedLinks, true);
        const { routesChanged } = recomputeAllRoutes(failed.devices, failed.links);
        const snc = computeNetworkSNC(failed.devices);
        const baseAlerts = generateAlerts(failed.devices, failed.links, routesChanged);
        const failedNode = failed.devices.find(d => d.id === failureRef.current?.nodeId);
        const alerts = injectFailureAlerts(baseAlerts, failed.recovery, failedNode ? failedNode.depth : 0);
        const kafka = generateKafkaMetrics(failed.devices.length);
        const spark = generateSparkMetrics();
        const cassandra = generateCassandraMetrics();
        const avgLatency = failed.devices.reduce((s, d) => s + d.latency, 0) / failed.devices.length;
        const avgLoss = failed.devices.reduce((s, d) => s + d.packetLoss, 0) / failed.devices.length;
        const avgBattery = failed.devices.reduce((s, d) => s + d.secondaryBattery, 0) / failed.devices.length;
        const avgSignal = failed.devices.reduce((s, d) => s + d.signalQuality, 0) / failed.devices.length;

        return {
          ...prev, devices: failed.devices, links: failed.links, snc, alerts, kafka, spark, cassandra,
          recovery: failed.recovery,
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

  const triggerFailure = useCallback((nodeId: string) => {
    if (failureRef.current || !state) return;
    const target = state.devices.find(d => d.id === nodeId);
    if (!target) return;
    failureRef.current = { nodeId, baselineDepth: target.depth, tick: 0, startedAt: Date.now() };
    setState(prev => {
      if (!prev) return prev;
      const failed = applyFailure(prev.devices, prev.links, false);
      const snc = computeNetworkSNC(failed.devices);
      const baseAlerts = generateAlerts(failed.devices, failed.links);
      const failedNode = failed.devices.find(d => d.id === nodeId);
      const alerts = injectFailureAlerts(baseAlerts, failed.recovery, failedNode ? failedNode.depth : 0);
      return { ...prev, devices: failed.devices, links: failed.links, snc, alerts, recovery: failed.recovery, lastUpdate: Date.now() };
    });
  }, [state]);

  const acknowledgeFailure = useCallback(() => {
    const ctx = failureRef.current;
    failureRef.current = null;
    setState(prev => {
      if (!prev || !ctx) return prev;
      const devices = prev.devices.map(d =>
        d.id === ctx.nodeId
          ? { ...d, status: 'NORMAL' as const, depth: ctx.baselineDepth, pressure: Math.round(ctx.baselineDepth * 0.1 * 10) / 10 }
          : d,
      );
      return { ...prev, devices, recovery: null, lastUpdate: Date.now() };
    });
  }, []);

  return { state, triggerFailure, acknowledgeFailure };
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
