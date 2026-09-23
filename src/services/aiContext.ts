// Ocean Intelligence context layer.
// Builds a live snapshot from the REAL simulation state (no invented data)
// and answers questions with a local rule/context engine — no paid LLM,
// no secrets. A future LLM can plug in via setLlmAdapter() without UI changes.
import type { SimulationState } from '../hooks/useSimulation';

export interface DashboardSnapshot {
  updatedAt: string;
  deviceCount: number;
  devices: {
    id: string;
    name: string;
    type: string;
    status: string;
    depth: number;
    latitude: number;
    longitude: number;
    temperature: number;
    pressure: number;
    salinity: number;
    dissolvedOxygen: number;
    primaryBattery: number;
    secondaryBattery: number;
    energyState: string;
    signalQuality: number;
    signalStrength: number;
    snr: number;
    frequency: number;
    bandwidth: number;
    packetLoss: number;
    latency: number;
    throughput: number;
    primaryRoute: string[];
    connectedNodes: string[];
    x: number;
    y: number;
  }[];
  historyLoss: number[];
  historyThroughput: number[];
  linkCount: number;
  links: { id: string; from: string; to: string; status: string; packetLoss: number; latencyMs: number; signalStrength: number }[];
  activeLinks: number;
  degradedLinks: number;
  failedLinks: number;
  worstLinks: { id: string; from: string; to: string; packetLoss: number; latencyMs: number; status: string }[];
  avgPacketLoss: number;
  avgLatency: number;
  avgThroughput: number;
  avgSignalQuality: number;
  avgFrequency: number;
  avgNoise: number;
  avgDepth: number;
  maxDepth: number;
  avgTemperature: number;
  avgPressure: number;
  lowBatteryDevices: { id: string; secondaryBattery: number }[];
  offlineDevices: string[];
  criticalDevices: string[];
  snc: {
    arrivalRate: number;
    serviceRate: number;
    trafficIntensity: number;
    averageDelay: number;
    delayBound: number;
    backlog: number;
    bufferUtilization: number;
    throughput: number;
    packetLoss: number;
    stability: string;
  };
  sampleRoutes: { device: string; route: string[] }[];
  aiDetected: string;
  aiPrediction: string;
  aiRecommendation: string;
  aiConfidence: number;
  aiAction: string;
  kafka: { messagesPerSec: number; consumerLag: number; online: boolean };
  spark: { processingRate: number; activeJobs: number; online: boolean };
  cassandra: { writesPerSec: number; storageGB: number; online: boolean };
  alerts: { severity: string; nodeId: string; message: string; time: string }[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

const f1 = (n: number): string => (Number.isFinite(n) ? n.toFixed(1) : '—');
const f2 = (n: number): string => (Number.isFinite(n) ? n.toFixed(2) : '—');
const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

export function buildSnapshot(state: SimulationState): DashboardSnapshot {
  const devices = state.devices.map(d => ({
    id: d.id,
    name: d.name,
    type: d.type,
    status: d.status,
    depth: d.depth,
    latitude: d.latitude,
    longitude: d.longitude,
    temperature: d.temperature,
    pressure: d.pressure,
    salinity: d.salinity,
    dissolvedOxygen: d.dissolvedOxygen,
    primaryBattery: d.primaryBattery,
    secondaryBattery: d.secondaryBattery,
    energyState: d.energyState,
    signalQuality: d.signalQuality,
    signalStrength: d.signalStrength,
    snr: d.snr,
    frequency: d.frequency,
    bandwidth: d.bandwidth,
    packetLoss: d.packetLoss,
    latency: d.latency,
    throughput: d.throughput,
    primaryRoute: d.primaryRoute,
    connectedNodes: d.connectedNodes,
    x: d.x,
    y: d.y,
  }));
  const tail = (h: { value: number }[], n: number): number[] => h.slice(-n).map(p => p.value);
  const links = state.links;
  const worstLinks = [...links]
    .sort((a, b) => b.packetLoss - a.packetLoss)
    .slice(0, 3)
    .map(l => ({ id: l.id, from: l.sourceNode, to: l.destinationNode, packetLoss: l.packetLoss, latencyMs: l.latencyMs, status: l.status }));
  const alerts = state.alerts.map(a => ({
    severity: a.severity,
    nodeId: a.nodeId,
    message: a.message,
    time: new Date(a.timestamp).toLocaleTimeString('en-US', { hour12: false }),
  }));
  return {
    updatedAt: new Date(state.lastUpdate).toLocaleTimeString('en-US', { hour12: false }),
    deviceCount: devices.length,
    devices,
    linkCount: links.length,
    links: links.map(l => ({ id: l.id, from: l.sourceNode, to: l.destinationNode, status: l.status, packetLoss: l.packetLoss, latencyMs: l.latencyMs, signalStrength: l.signalStrength })),
    activeLinks: links.filter(l => l.status === 'ACTIVE').length,
    degradedLinks: links.filter(l => l.status === 'DEGRADED').length,
    failedLinks: links.filter(l => l.status === 'FAILED').length,
    worstLinks,
    avgPacketLoss: avg(devices.map(d => d.packetLoss)),
    avgLatency: avg(devices.map(d => d.latency)),
    avgThroughput: avg(devices.map(d => d.throughput)),
    avgSignalQuality: avg(devices.map(d => d.signalQuality)),
    avgFrequency: avg(devices.map(d => d.frequency)),
    avgNoise: avg(state.devices.map(d => d.backgroundNoise)),
    avgDepth: avg(devices.map(d => d.depth)),
    maxDepth: Math.max(...devices.map(d => d.depth)),
    avgTemperature: avg(devices.map(d => d.temperature)),
    avgPressure: avg(devices.map(d => d.pressure)),
    lowBatteryDevices: devices
      .filter(d => d.secondaryBattery < 30)
      .map(d => ({ id: d.id, secondaryBattery: d.secondaryBattery })),
    offlineDevices: devices.filter(d => d.status === 'OFFLINE' || d.status === 'CRITICAL').map(d => `${d.id} (${d.status})`),
    criticalDevices: devices.filter(d => d.status === 'CRITICAL').map(d => d.id),
    snc: {
      arrivalRate: state.snc.arrivalRate,
      serviceRate: state.snc.serviceRate,
      trafficIntensity: state.snc.trafficIntensity,
      averageDelay: state.snc.averageDelay,
      delayBound: state.snc.delayBound,
      backlog: state.snc.backlog,
      bufferUtilization: state.snc.bufferUtilization,
      throughput: state.snc.throughput,
      packetLoss: state.snc.packetLoss,
      stability: state.snc.stability,
    },
    sampleRoutes: devices.slice(0, 4).map(d => ({ device: d.id, route: d.primaryRoute })),
    aiDetected: state.aiDecision.detected,
    aiPrediction: state.aiDecision.prediction,
    aiRecommendation: state.aiDecision.recommendation,
    aiConfidence: state.aiDecision.confidence,
    aiAction: state.aiDecision.action,
    kafka: { messagesPerSec: state.kafka.messagesPerSec, consumerLag: state.kafka.consumerLag, online: state.kafka.online },
    spark: { processingRate: state.spark.processingRate, activeJobs: state.spark.activeJobs, online: state.spark.online },
    cassandra: { writesPerSec: state.cassandra.writesPerSec, storageGB: state.cassandra.storageGB, online: state.cassandra.online },
    historyLoss: tail(state.historyPacketLoss, 40),
    historyThroughput: tail(state.historyThroughput, 40),
    alerts,
    criticalCount: alerts.filter(a => a.severity === 'CRITICAL').length,
    warningCount: alerts.filter(a => a.severity === 'WARNING').length,
    infoCount: alerts.filter(a => a.severity === 'INFO').length,
  };
}

// ---- future LLM seam (unused locally; UI never touches secrets) ----
export interface LlmAdapter {
  complete: (systemPrompt: string, userQuestion: string) => Promise<string>;
}
let llm: LlmAdapter | null = null;
export function setLlmAdapter(adapter: LlmAdapter | null): void {
  llm = adapter;
}
export function snapshotSystemPrompt(s: DashboardSnapshot): string {
  return [
    'You are Ocean Intelligence, a monitoring assistant for an underwater acoustic communication dashboard.',
    'Answer ONLY from the live snapshot below. Never invent sensor values.',
    `Snapshot @ ${s.updatedAt}: ${s.deviceCount} devices, ${s.activeLinks}/${s.linkCount} links active,`,
    `avg packet loss ${f2(s.avgPacketLoss)}%, avg latency ${f1(s.avgLatency)} ms, SNC stability ${s.snc.stability}.`,
  ].join(' ');
}

// ---- local knowledge base (project/ocean concepts) ----
export const KNOWLEDGE: { keys: string[]; answer: string }[] = [
  {
    keys: ['snc', 'stochastic network calculus'],
    answer:
      'Stochastic Network Calculus (SNC) is the mathematical framework this project uses to give probabilistic guarantees on network behaviour — delay bounds and backlog bounds even though the underwater channel is random. In our dashboard it shows up as arrival rate vs service rate: their ratio is traffic intensity (below 1 means stable), plus average delay, maximum delay bound, backlog, buffer utilisation and throughput. Right now the network reports its SNC stability from those live values — check the SNC Analytics page for the full breakdown.',
  },
  {
    keys: ['prism'],
    answer:
      'PRISM is this project\u2019s adaptive routing layer: it continuously compares candidate acoustic paths using live link health, latency, packet loss and energy, then picks the most suitable route and reroutes around failed nodes or degraded links. Each device keeps a primary route plus alternate routes, and the AI monitor can trigger a network-wide route recalculation when conditions change. You can see current primary routes per device in the network overview.',
  },
  {
    keys: ['why radio', 'radio', 'wi-fi', 'wifi', 'electromagnetic'],
    answer:
      'Radio and Wi-Fi barely penetrate seawater: electromagnetic waves attenuate within metres because conductive salt water absorbs their energy. Sound, a pressure wave, travels kilometres underwater with far less loss — which is why this project communicates acoustically. The trade-off is low bandwidth, high latency (sound is slow, ~1500 m/s), multipath echoes and ambient noise, and that is exactly what the SNC analytics and PRISM routing layers manage.',
  },
  {
    keys: ['attenuation'],
    answer:
      'Acoustic attenuation underwater grows with distance and frequency: high frequencies are absorbed quickly (good for short-range high-rate links), low frequencies travel far (whale calls cross oceans). That is why our nodes operate in a chosen acoustic band balancing range against data rate — the dashboard shows each device\u2019s operating frequency and the resulting signal quality.',
  },
  {
    keys: ['multipath'],
    answer:
      'Multipath happens when sound reaches the receiver along several paths — direct, surface-reflected, seabed-reflected — arriving at slightly different times and interfering. It causes fading and inter-symbol interference, which shows up as packet loss and jitter. PRISM routing avoids persistently bad links, and retransmission plus local buffering recover the rest.',
  },
  {
    keys: ['doppler'],
    answer:
      'Doppler shift matters underwater because sound is slow: even a drifting node or moving water creates a noticeable frequency shift relative to the narrow acoustic bandwidth. Receivers must track and compensate for it, otherwise decoding degrades and packet loss rises. Our signal-quality and SNR readings reflect the end result of effects like this.',
  },
  {
    keys: ['ambient noise', 'background noise'],
    answer:
      'Ambient ocean noise — waves, rain, shipping, marine life, shrimp snaps — competes directly with our communication signals. The dashboard tracks background noise per device; when it rises, SNR falls and the AI monitor may reroute traffic or lower data rates. The acoustic pages visualise the signal environment.',
  },
  {
    keys: ['pressure', 'deep-ocean pressure'],
    answer:
      'Pressure rises about 1 atmosphere every 10 metres — at 1000 m the housings endure ~100 atmospheres. That drives the mechanical design: titanium-alloy pressure vessels, syntactic foam for buoyancy, and sealed connectors. The dashboard reports live pressure per device alongside depth.',
  },
  {
    keys: ['syntactic foam'],
    answer:
      'Syntactic foam is a buoyancy material made of hollow glass microspheres in resin: strong enough to survive deep-ocean pressure while staying light. It gives our nodes positive buoyancy, so dropping the external ballast weight lets a failed node float up for recovery — the mechanism behind the emergency ascent concept.',
  },
  {
    keys: ['ballast'],
    answer:
      'The ballast is an external weight that overcomes the foam\u2019s buoyancy to hold the node at operational depth. On critical failure the release mechanism drops the weight and the buoyant node ascends toward the surface for recovery. You can step through the release sequence in Technology & Device → Ballast Release.',
  },
  {
    keys: ['emergency recovery'],
    answer:
      'Emergency recovery is the last-resort path: on critical failure the node enters low-power mode, preserves energy, releases ballast, ascends by buoyancy, and activates its surface recovery beacon. The System Failure page walks through the MN-01 failover scenario, and the dashboard fires Twilio SMS plus voice-call alerts alongside the local speaker announcement.',
  },
  {
    keys: ['local storage', '1gb', 'buffer'],
    answer:
      'Each node carries local 1 GB storage used as a communication buffer: packets are held before forwarding and preserved across interruptions, then retransmitted after route recovery. Per-device stored byte counts are not part of the live telemetry, so I don\u2019t currently have that measurement in the available dashboard data — the concept is documented under Technology & Device → Local 1GB Storage.',
  },
  {
    keys: ['digital twin'],
    answer:
      'The 3D device prototype and live telemetry together act like a lightweight digital twin: the virtual model mirrors the physical concept while real-time depth, energy, link and SNC values stream into the dashboard. What you see in the 3D view and Device Health table is the twin\u2019s current state.',
  },
  {
    keys: ['latency'],
    answer:
      'Underwater latency is dominated by physics: sound crawls at ~1500 m/s, so a 3 km hop already costs ~2 s each way before any processing. The dashboard tracks per-device latency and propagation delay plus SNC delay bounds — use the SNC Analytics page to see whether delay is within guaranteed bounds.',
  },
  {
    keys: ['packet loss'],
    answer:
      'Packet loss here comes from fading, multipath, noise bursts, weak links and failed nodes. The system answers with retransmission from local storage, PRISM rerouting around bad links, and AI monitoring that flags degrading trends. Ask me "why is the network experiencing packet loss" and I will break down the live causes.',
  },
  {
    keys: ['seabed', 'sea bed', 'ocean floor'],
    answer:
      'The seabed matters twice: acoustically it reflects sound (multipath, reverberation) and absorbs low frequencies, and operationally it is where seafloor relay nodes sit. Our deepest devices approach the lower water column — check the environment page for the depth profile.',
  },
  {
    keys: ['energy management', 'power management'],
    answer:
      'Energy is mission life: every device reports primary and secondary battery plus an energy state (NORMAL, SAVING, LOW) and power load. The hybrid concept uses a long-life primary source for baseline operation and a secondary pack for high-power acoustic bursts. Ask "how is energy" for the live numbers.',
  },
  {
    keys: ['ai monitoring', 'ai-based', 'artificial intelligence'],
    answer:
      'The AI monitor watches link health, packet-loss trends, latency and energy, then decides: hold course, switch PRISM route, reduce power, or escalate to emergency procedures. Its latest detection, prediction, recommendation and confidence are live in the dashboard state — ask "what is the AI seeing" for the current reading.',
  },
  {
    keys: ['autonomous'],
    answer:
      'Autonomy means the nodes make communication decisions without a human in the loop: sensing link quality, choosing PRISM routes, buffering through outages and triggering recovery. The dashboard is the window into those decisions — AI recommendations, route changes and alerts show what the autonomy layer decided and why.',
  },
];

// ---- answer engine ----
export function findDevice(s: DashboardSnapshot, q: string): DashboardSnapshot['devices'][number] | null {
  const lowered = q.toLowerCase();
  for (const d of s.devices) {
    if (lowered.includes(d.id.toLowerCase())) return d;
  }
  const m = lowered.match(/\b([a-z]{2,}-?\d+)\b/);
  if (m) {
    const hit = s.devices.find(d => d.id.toLowerCase() === m[1]);
    if (hit) return hit;
  }
  return null;
}

export function answerQuestion(question: string, s: DashboardSnapshot): string {
  const q = question.toLowerCase().trim();
  if (!q) return 'Ask me about devices, the network, SNC, PRISM, energy, acoustics, alerts or ocean concepts.';

  // 1) specific device lookup
  const dev = findDevice(s, q);
  if (dev && /(what|how|status|happening|about|tell|show|health|state|doing)/.test(q)) {
    return (
      `${dev.id} (${dev.name}, ${dev.type.replace(/_/g, ' ')}) is currently ${dev.status}. ` +
      `Depth ${f1(dev.depth)} m at ${f1(dev.latitude)}, ${f1(dev.longitude)}. ` +
      `Temperature ${f1(dev.temperature)} °C, pressure ${f1(dev.pressure)} bar. ` +
      `Primary battery ${f1(dev.primaryBattery)}%, secondary ${f1(dev.secondaryBattery)}% (energy state ${dev.energyState}). ` +
      `Signal quality ${f1(dev.signalQuality)}%, strength ${f1(dev.signalStrength)} dB, SNR ${f1(dev.snr)} dB at ${f1(dev.frequency)} Hz. ` +
      `Packet loss ${f2(dev.packetLoss)}%, latency ${f1(dev.latency)} ms, throughput ${f1(dev.throughput)} msg/s. ` +
      `Primary route: ${dev.primaryRoute.length ? dev.primaryRoute.join(' → ') : 'none assigned'}. ` +
      `Connected to ${dev.connectedNodes.length} node(s). ` +
      `Stored-data volume per device is not part of the live telemetry, so I don't currently have that measurement in the available dashboard data.`
    );
  }

  // 2) packet-loss diagnosis
  if (q.includes('packet loss') || q.includes('packet-loss') || q.includes('losing packets')) {
    const bad = s.worstLinks.map(l => `${l.from}→${l.to} (${f2(l.packetLoss)}%, ${l.status})`).join('; ');
    return (
      `Network-wide packet loss is averaging ${f2(s.avgPacketLoss)}% with SNC stability ${s.snc.stability}. ` +
      `Links: ${s.activeLinks} active, ${s.degradedLinks} degraded, ${s.failedLinks} failed out of ${s.linkCount}. ` +
      `Worst links right now: ${bad || 'none standing out'}. ` +
      `Contributors in this data: degraded/failed links forcing reroutes (PRISM), background noise averaging ${f1(s.avgNoise)} dB against SNR, and backlog of ${s.snc.backlog} packets with buffer utilisation at ${f1(s.snc.bufferUtilization)}%. ` +
      `The AI monitor's latest call: ${s.aiDetected} — ${s.aiRecommendation} (confidence ${f1(s.aiConfidence)}%).`
    );
  }

  // 3) explanation intent goes to the knowledge base first
  if (/(explain|what is|what does|what's|means?|how does|how do|why|tell me about)/.test(q)) {
    for (const entry of KNOWLEDGE) {
      if (entry.keys.some(k => q.includes(k))) return entry.answer;
    }
  }

  // 4) SNC live state
  if (q.includes('snc')) {
    const n = s.snc;
    return (
      `Live SNC picture: arrival rate ${f2(n.arrivalRate)} vs service rate ${f2(n.serviceRate)} msg/s — traffic intensity ${f2(n.trafficIntensity)} ` +
      `(${n.trafficIntensity < 1 ? 'below 1, so the network is stable' : 'at or above 1, the network is saturated'}). ` +
      `Average delay ${f1(n.averageDelay)} ms against a maximum delay bound of ${f1(n.delayBound)} ms, backlog ${n.backlog} packets, ` +
      `buffer utilisation ${f1(n.bufferUtilization)}%, throughput ${f1(n.throughput)} msg/s, loss ${f2(n.packetLoss)}%. ` +
      `Overall stability: ${n.stability}. Say "explain SNC" and I will explain what these quantities mean.`
    );
  }

  // 5) knowledge base catch-all for non-explanation phrasings
  for (const entry of KNOWLEDGE) {
    if (entry.keys.some(k => q.includes(k))) return entry.answer;
  }

  // 6) network overview
  if (/(network|overview|happening|status.*system|everything|summary)/.test(q)) {
    return (
      `As of ${s.updatedAt}: ${s.deviceCount} devices tracked, ${s.activeLinks}/${s.linkCount} links active ` +
      `(${s.degradedLinks} degraded, ${s.failedLinks} failed). ` +
      `${s.offlineDevices.length ? `Attention needed on: ${s.offlineDevices.join(', ')}.` : 'All devices reporting normal or warning status.'} ` +
      `Averages — loss ${f2(s.avgPacketLoss)}%, latency ${f1(s.avgLatency)} ms, throughput ${f1(s.avgThroughput)} msg/s, signal quality ${f1(s.avgSignalQuality)}%. ` +
      `SNC stability ${s.snc.stability}; alerts: ${s.criticalCount} critical, ${s.warningCount} warning, ${s.infoCount} info. ` +
      `AI monitor: ${s.aiDetected}.`
    );
  }

  // 7) PRISM live state
  if (q.includes('prism') || q.includes('rout')) {
    const routes = s.sampleRoutes.map(r => `${r.device}: ${r.route.join(' → ') || 'unassigned'}`).join('; ');
    return (
      `PRISM currently holds primary routes such as — ${routes}. ` +
      `${s.failedLinks + s.degradedLinks > 0 ? `With ${s.failedLinks} failed and ${s.degradedLinks} degraded links, alternates are engaged where available. ` : 'All links healthy, so primaries are holding. '} ` +
      `Latest AI routing input: ${s.aiDetected} → ${s.aiAction} (confidence ${f1(s.aiConfidence)}%).`
    );
  }

  // 8) energy
  if (/(energy|battery|batteries|power|charging|consumption)/.test(q)) {
    const low = s.lowBatteryDevices.length
      ? s.lowBatteryDevices.map(d => `${d.id} at ${f1(d.secondaryBattery)}%`).join(', ')
      : 'none below 30%';
    return (
      `Energy across ${s.deviceCount} devices: secondary batteries averaging ${f1(avg(s.devices.map(d => d.secondaryBattery)))}%, ` +
      `primary averaging ${f1(avg(s.devices.map(d => d.primaryBattery)))}%. Low units: ${low}. ` +
      `Charging state and per-device consumption rates are not part of the live telemetry, so I don't currently have those measurements in the available dashboard data.`
    );
  }

  // 9) acoustics
  if (/(acoustic|frequency|signal|snr|noise|waveform|spectrogram|hydrophone)/.test(q)) {
    return (
      `Acoustic picture: devices operating around ${f1(s.avgFrequency)} Hz average, signal quality ${f1(s.avgSignalQuality)}%, ` +
      `background noise ${f1(s.avgNoise)} dB. Per-device SNR, signal strength and propagation delay are tracked live — ` +
      `ask about a specific node (e.g. "what is happening with MN-01") for its exact readings. ` +
      `The Listen to the Ocean section plays real hydrophone recordings with waveform and spectrogram views.`
    );
  }

  // 10) alerts
  if (/(alert|alarm|warning|critical|fault|failure|emergency)/.test(q)) {
    if (s.alerts.length === 0) return 'No alerts in the current dashboard state — the network is quiet.';
    const top = s.alerts.slice(0, 4).map(a => `[${a.severity}] ${a.nodeId}: ${a.message} (${a.time})`).join(' ');
    return (
      `${s.criticalCount} critical, ${s.warningCount} warning, ${s.infoCount} info alerts. Latest: ${top} ` +
      `Open the Alerts page or press System Failure for the full failure drill with Twilio SMS/call escalation.`
    );
  }

  // 11) ocean environment
  if (/(ocean|environment|depth|pressure|temperature|seabed|sea\b|water)/.test(q)) {
    return (
      `Monitored water column: average depth ${f1(s.avgDepth)} m, deepest node ${f1(s.maxDepth)} m. ` +
      `Average temperature ${f1(s.avgTemperature)} °C and pressure ${f1(s.avgPressure)} bar across nodes. ` +
      `Depth, pressure and temperature shape acoustic propagation (sound speed, absorption, noise), which is why link quality varies with depth — ` +
      `compare a shallow and deep node to see it. Seabed composition maps are not in the telemetry, so I don't currently have that measurement.`
    );
  }

  // 12) pipeline / big data
  if (/(kafka|spark|cassandra|pipeline|big data|scala|ingest)/.test(q)) {
    return (
      `Data pipeline: Kafka ${s.kafka.online ? 'online' : 'OFFLINE'} at ${f1(s.kafka.messagesPerSec)} msg/s (consumer lag ${f1(s.kafka.consumerLag)}), ` +
      `Spark ${s.spark.online ? 'online' : 'OFFLINE'} processing ${f1(s.spark.processingRate)} msg/s across ${s.spark.activeJobs} jobs, ` +
      `Cassandra ${s.cassandra.online ? 'online' : 'OFFLINE'} writing ${f1(s.cassandra.writesPerSec)}/s, ${f1(s.cassandra.storageGB)} GB stored.`
    );
  }

  // 13) AI monitor state
  if (/(ai\b|artificial|monitor|detect|predict|recommend)/.test(q)) {
    return (
      `Latest AI reading: detected "${s.aiDetected}", predicts "${s.aiPrediction}", recommends "${s.aiRecommendation}" ` +
      `(confidence ${f1(s.aiConfidence)}%), action taken: ${s.aiAction}.`
    );
  }

  return (
    `I can report on live devices, links, routes, SNC, energy, acoustics, alerts, pipeline and ocean environment — ` +
    `or explain concepts like SNC, PRISM, attenuation and ballast release. ` +
    `What you asked about isn't in the available dashboard data, so I don't currently have that measurement. Try "what is happening with the network?"`
  );
}

export async function answerWithOptionalLlm(question: string, s: DashboardSnapshot): Promise<string> {
  if (llm) {
    try {
      return await llm.complete(snapshotSystemPrompt(s), question);
    } catch {
      // fall through to local engine on LLM failure
    }
  }
  return answerQuestion(question, s);
}
