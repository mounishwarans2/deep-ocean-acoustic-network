// Rich visual responses for the Ocean Intelligence console.
// Every visual block is built from the REAL dashboard snapshot —
// never invented values. Unavailable measurements produce an honest notice.
import type { DashboardSnapshot } from './aiContext';
import { KNOWLEDGE, answerQuestion, findDevice } from './aiContext';

export type Mood = 'idle' | 'found' | 'warning' | 'failure';

export type Block =
  | { kind: 'metricCards'; cards: { label: string; value: string; tone: 'ok' | 'warn' | 'bad' | 'info' }[] }
  | { kind: 'deviceCard'; deviceId: string }
  | { kind: 'compareTable'; ids: [string, string] }
  | { kind: 'depthProfile' }
  | { kind: 'miniNetwork' }
  | { kind: 'lineChart'; metric: 'loss' | 'throughput' }
  | { kind: 'sncBoard' }
  | { kind: 'routeCard'; deviceId: string }
  | { kind: 'prismBoard' }
  | { kind: 'energyBoard' }
  | { kind: 'alertsList' }
  | { kind: 'oceanEnv' }
  | { kind: 'diagram'; diagram: 'acoustic' | 'prism' | 'snc' | 'pressure' }
  | { kind: 'confirmNav'; label: string; page: string }
  | { kind: 'notice'; text: string };

export interface RichResponse {
  text: string;
  blocks: Block[];
  mood: Mood;
  /** set only when the answer actually uses that source; greetings/casual carry none */
  source?: 'live' | 'knowledge' | 'mixed';
}

export type Intent =
  | 'GREETING' | 'CASUAL' | 'COMPARE' | 'ROUTE' | 'DEPTH' | 'NETWORK_SHOW'
  | 'NETWORK_STATUS' | 'DEVICE' | 'LOSS' | 'THROUGHPUT' | 'SNC' | 'PRISM'
  | 'ENERGY' | 'ALERTS' | 'OCEAN' | 'EXPLAIN' | 'OPEN_PAGE' | 'UNKNOWN';

export interface ConversationContext {
  lastDeviceId: string | null;
  lastTopic: string | null;
}

export function createConversationContext(): ConversationContext {
  return { lastDeviceId: null, lastTopic: null };
}

function respondGreeting(q: string): string | null {
  if (/\bgood morning\b/.test(q)) {
    return 'Good morning! 🌊\nOcean Intelligence is online and ready. What would you like me to check?';
  }
  if (/\bgood afternoon\b/.test(q)) {
    return 'Good afternoon! 🌊\nI\'m ready to help you explore the underwater network. What would you like to know?';
  }
  if (/\bgood evening\b/.test(q)) {
    return 'Good evening! 🌊\nOcean Intelligence is on watch. What can I do for you?';
  }
  if (/how are you/.test(q)) {
    return 'I\'m running well — telemetry flowing, all my circuits nominal. 🌊\nWhat can I check for you?';
  }
  if (/\b(what'?s up|whats up|how'?s it going)\b/.test(q)) {
    return 'Not much — just keeping an eye on twenty-odd nodes under the sea. 🌊\nWhat would you like to know?';
  }
  if (/\b(hi|hello|hey|yo|greetings)\b/.test(q)) {
    return 'Hello! 👋 I\'m Ocean Intelligence.\nI\'m connected to the underwater monitoring dashboard. What would you like to know?';
  }
  return null;
}

function respondCasual(q: string): string | null {
  if (/\bthank(s| you)\b|\bthx\b/.test(q)) {
    return 'You\'re welcome! 🌊\nI\'m here whenever you want to inspect the underwater system.';
  }
  if (/\b(bye|goodbye|good ?night|see you)\b/.test(q)) {
    return 'Goodbye! Ocean Intelligence will be here when you return. 🌊';
  }
  if (/\b(ok|okay|okie|got it|alright|understood|roger)\b/.test(q)) {
    return 'Got it. What would you like to explore next?';
  }
  if (/\b(great|nice|cool|awesome|perfect|excellent|amazing|neat)\b/.test(q)) {
    return 'Glad to hear it! 🌊\nLet me know what you\'d like to look into next.';
  }
  if (/^(yes|yeah|yep|yup|sure|no|nope|nah)\b/.test(q)) {
    return 'Understood. What would you like to do next?';
  }
  if (/\bwho are you\b|\byour name\b/.test(q)) {
    return 'I\'m Ocean Intelligence — the monitoring assistant for this deep-ocean acoustic communication system. 🌊\nI watch live devices, links, SNC analytics and PRISM routing, and I can explain the ocean science behind it all.';
  }
  if (/\bhelp\b|\bwhat can you do\b/.test(q)) {
    return 'I can show you live telemetry — try "show me the network", "show S-07" or "show depth profile" — explain concepts like SNC and PRISM, diagnose issues like packet loss, and report alerts. What shall we look at?';
  }
  return null;
}

/** Follow-up resolution: "it" -> last device, "that" -> last topic. */
export function resolveReferences(
  question: string,
  s: DashboardSnapshot,
  ctx: ConversationContext,
): { effective: string; deviceId: string | null; topic: string | null } {
  const q = question.toLowerCase().trim();
  let deviceId: string | null = null;
  const direct = findDevice(s, q);
  if (direct) {
    deviceId = direct.id;
  } else if (ctx.lastDeviceId && /\b(it|its|this node|that node|the node|itself)\b/.test(q)) {
    deviceId = ctx.lastDeviceId;
  }
  let topic: string | null = null;
  for (const entry of KNOWLEDGE) {
    if (entry.keys.some(k => q.includes(k))) {
      topic = entry.keys[0];
      break;
    }
  }
  if (!topic && ctx.lastTopic && /\b(that|this|it)\b/.test(q) && /(help|mean|work|matter|affect|apply)/.test(q)) {
    topic = ctx.lastTopic;
  }
  const effective = deviceId && !direct ? `${q} ${deviceId.toLowerCase()}` : q;
  return { effective, deviceId, topic };
}

export function detectIntent(q: string, s: DashboardSnapshot, ctx: ConversationContext): { intent: Intent; deviceId: string | null; topic: string | null } {
  if (!q.trim()) return { intent: 'UNKNOWN', deviceId: null, topic: null };
  if (respondGreeting(q)) return { intent: 'GREETING', deviceId: null, topic: null };
  if (respondCasual(q)) return { intent: 'CASUAL', deviceId: null, topic: null };
  if (detectPageRequest(q)) return { intent: 'OPEN_PAGE', deviceId: null, topic: null };
  if (/compare|versus|\bvs\b|difference between/.test(q)) return { intent: 'COMPARE', deviceId: null, topic: null };
  if (/route of|route for|path of|path for/.test(q)) return { intent: 'ROUTE', deviceId: null, topic: null };
  if (/depth profile|depths|what happens at|5000 m|at \d+\s*m/.test(q)) return { intent: 'DEPTH', deviceId: null, topic: null };
  // device mention (direct or pronoun follow-up) with a data-seeking verb
  const ref = resolveReferences(q, s, ctx);
  if (ref.deviceId && /(show|explain|tell|what|how|status|about|happening|health|analyze|analyse|why|deep|signal|route|compare|its|it\b)/.test(ref.effective)) {
    return { intent: 'DEVICE', deviceId: ref.deviceId, topic: ref.topic };
  }
  if (/packet.?loss|losing packets/.test(q)) return { intent: 'LOSS', deviceId: null, topic: null };
  if (/throughput/.test(q)) return { intent: 'THROUGHPUT', deviceId: null, topic: null };
  if (/\bsnc\b/.test(q)) return { intent: /(explain|what is|what does|mean)/.test(q) ? 'EXPLAIN' : 'SNC', deviceId: null, topic: 'snc' };
  if (/prism|routing/.test(q) && !/route of|route for/.test(q)) {
    return { intent: /(explain|what is|how does|help|mean)/.test(q) ? 'EXPLAIN' : 'PRISM', deviceId: null, topic: 'prism' };
  }
  if (/energy|battery|power/.test(q)) {
    return { intent: /(explain|what is|mean)/.test(q) ? 'EXPLAIN' : 'ENERGY', deviceId: null, topic: 'energy management' };
  }
  if (/alert|alarm|warning|critical|fault|failure|emergency/.test(q)) return { intent: 'ALERTS', deviceId: null, topic: null };
  if (/show.*network|network.*map|topology/.test(q) && !/neural|social/.test(q)) return { intent: 'NETWORK_SHOW', deviceId: null, topic: null };
  if (/what is happening with the network|network status|how is the network|system status|network.*(doing|health)/.test(q)) return { intent: 'NETWORK_STATUS', deviceId: null, topic: null };
  if (/ocean|environment|seabed|sea\b|water/.test(q) && !/neural/.test(q)) return { intent: 'OCEAN', deviceId: null, topic: null };
  if (/(explain|diagram|how).*(acoustic communication|underwater.*communic)/.test(q)) return { intent: 'EXPLAIN', deviceId: null, topic: 'radio' };
  if (/pressure/.test(q) && /(explain|deep|why|what)/.test(q)) return { intent: 'EXPLAIN', deviceId: null, topic: 'pressure' };
  if (/(explain|what is|what does|how does|why|tell me about)/.test(q) && ref.topic) return { intent: 'EXPLAIN', deviceId: null, topic: ref.topic };
  if (ref.deviceId) return { intent: 'DEVICE', deviceId: ref.deviceId, topic: ref.topic };
  return { intent: 'UNKNOWN', deviceId: null, topic: ref.topic };
}

const f1 = (n: number): string => (Number.isFinite(n) ? n.toFixed(1) : '—');
const f2 = (n: number): string => (Number.isFinite(n) ? n.toFixed(2) : '—');

const PAGES: { keys: string[]; label: string; page: string }[] = [
  { keys: ['snc'], label: 'SNC Analytics', page: 'snc' },
  { keys: ['energy'], label: 'Energy', page: 'energy' },
  { keys: ['acoustic'], label: 'Acoustic', page: 'acoustic' },
  { keys: ['environment'], label: 'Environment', page: 'environment' },
  { keys: ['device health', 'health'], label: 'Device Health', page: 'health' },
  { keys: ['alert'], label: 'Alerts', page: 'alerts' },
  { keys: ['histor', 'history'], label: 'Historical', page: 'history' },
  { keys: ['big data'], label: 'Big Data', page: 'bigdata' },
  { keys: ['overview', 'dashboard', 'main'], label: 'Overview', page: 'overview' },
];

function detectPageRequest(q: string): { label: string; page: string } | null {
  if (!/(open|go to|navigate|switch to|take me to)\b/.test(q)) return null;
  for (const p of PAGES) {
    if (p.keys.some(k => q.includes(k))) return { label: p.label, page: p.page };
  }
  return null;
}

function findTwoDevices(s: DashboardSnapshot, q: string): [string, string] | null {
  const ids = s.devices.map(d => d.id).filter(id => q.includes(id.toLowerCase()));
  if (ids.length >= 2) return [ids[0], ids[1]];
  const m = q.match(/\b([a-z]{2,}-?\d+)\b.*\b([a-z]{2,}-?\d+)\b/);
  if (m) {
    const a = s.devices.find(d => d.id.toLowerCase() === m[1]);
    const b = s.devices.find(d => d.id.toLowerCase() === m[2]);
    if (a && b) return [a.id, b.id];
  }
  return null;
}

function networkCards(s: DashboardSnapshot): RichResponse['blocks'] {
  const lossTone = s.failedLinks > 0 || s.avgPacketLoss > 5 ? 'bad' : s.degradedLinks > 0 || s.avgPacketLoss > 2 ? 'warn' : 'ok';
  return [
    {
      kind: 'metricCards',
      cards: [
        { label: 'ACTIVE DEVICES', value: String(s.deviceCount - s.offlineDevices.length), tone: s.offlineDevices.length ? 'warn' : 'ok' },
        { label: 'ACTIVE LINKS', value: `${s.activeLinks} / ${s.linkCount}`, tone: s.failedLinks ? 'bad' : s.degradedLinks ? 'warn' : 'ok' },
        { label: 'THROUGHPUT', value: `${f1(s.avgThroughput)} msg/s`, tone: 'info' },
        { label: 'AVG LATENCY', value: `${f1(s.avgLatency)} ms`, tone: 'info' },
        { label: 'PACKET LOSS', value: `${f2(s.avgPacketLoss)}%`, tone: lossTone },
      ],
    },
  ];
}

export function buildRichResponse(
  question: string,
  s: DashboardSnapshot,
  ctx: ConversationContext = createConversationContext(),
): RichResponse {
  const q = question.toLowerCase().trim();
  const { intent, deviceId, topic } = detectIntent(q, s, ctx);
  // remember context for follow-ups ("it" -> device, "that" -> topic)
  if (deviceId) ctx.lastDeviceId = deviceId;
  if (topic) ctx.lastTopic = topic;

  const live = (text: string, blocks: Block[] = [], mood: Mood = 'found'): RichResponse =>
    ({ text, blocks, mood, source: 'live' });
  const mixed = (text: string, blocks: Block[] = [], mood: Mood = 'found'): RichResponse =>
    ({ text, blocks, mood, source: 'mixed' });

  if (!q) {
    return { text: 'Ask me to show the network, a device, SNC, PRISM, energy, alerts or the ocean environment.', blocks: [], mood: 'idle', source: undefined };
  }

  switch (intent) {
    case 'GREETING': {
      const g = respondGreeting(q) || 'Hello! 👋 I\'m Ocean Intelligence. How can I help you today?';
      return { text: g, blocks: [], mood: 'idle', source: undefined };
    }
    case 'CASUAL': {
      const c = respondCasual(q) || 'Got it. What would you like to explore next?';
      return { text: c, blocks: [], mood: 'idle', source: undefined };
    }
    case 'OPEN_PAGE': {
      const pageReq = detectPageRequest(q);
      if (pageReq) {
        return {
          text: `I can open the ${pageReq.label} page for you. Nothing has changed on your screen — confirm and I will take you there.`,
          blocks: [{ kind: 'confirmNav', label: pageReq.label, page: pageReq.page }],
          mood: 'idle',
          source: undefined,
        };
      }
      break;
    }
    case 'COMPARE': {
      const pair = findTwoDevices(s, q);
      if (pair) {
        ctx.lastDeviceId = pair[1];
        return live(`Here's ${pair[0]} next to ${pair[1]} — live numbers side by side.`, [{ kind: 'compareTable', ids: pair }]);
      }
      return { text: 'Sure — to compare, name two node IDs, for example "compare S-07 and S-11".', blocks: [], mood: 'idle', source: undefined };
    }
    case 'ROUTE': {
      const dev = deviceId ? s.devices.find(d => d.id === deviceId) : findDevice(s, q);
      if (dev) {
        ctx.lastDeviceId = dev.id;
        return live(`Here's how ${dev.id} is routed right now.`, [{ kind: 'routeCard', deviceId: dev.id }]);
      }
      return { text: 'Sure — tell me which node, for example "show the route of S-07".', blocks: [], mood: 'idle', source: undefined };
    }
    case 'DEPTH': {
      const deep = [...s.devices].sort((a, b) => b.depth - a.depth)[0];
      return live(
        `Absolutely — here's the current depth distribution. Deepest monitored node is ${deep.id} at ${f1(deep.depth)} m, and pressure rises about 1 bar every 10 m, which is why deep nodes need titanium housings and syntactic-foam buoyancy.`,
        [{ kind: 'depthProfile' }],
      );
    }
    case 'NETWORK_SHOW': {
      return live(
        `Sure — here's the current underwater network. All positions mirror the operations map, and I'm staying right here with you.`,
        [{ kind: 'miniNetwork' }, ...networkCards(s)],
        s.failedLinks > 0 ? 'warning' : 'found',
      );
    }
    case 'NETWORK_STATUS': {
      const stateWord = s.failedLinks > 0 ? 'degraded — failed links need attention' : s.degradedLinks > 0 ? 'operational with degraded links' : 'currently operational';
      const nDev = s.deviceCount - s.offlineDevices.length;
      const plural = (n: number, w: string): string => `${n} ${w}${n === 1 ? '' : 's'}`;
      return live(
        `Sure. The underwater network is ${stateWord}. I can see ${plural(nDev, 'active device')} and ${plural(s.activeLinks, 'active link')}. Current throughput is ${f1(s.avgThroughput)} msg/s, average latency is ${f1(s.avgLatency)} ms, and packet loss is ${f2(s.avgPacketLoss)}%.`,
        networkCards(s),
        s.failedLinks > 0 || s.criticalCount > 0 ? 'warning' : 'found',
      );
    }
    case 'DEVICE': {
      const dev = deviceId ? s.devices.find(d => d.id === deviceId) : findDevice(s, q);
      if (!dev) {
        return { text: 'Which node do you mean? Give me an ID like S-07 or MN-01 and I will pull its live telemetry.', blocks: [], mood: 'idle', source: undefined };
      }
      ctx.lastDeviceId = dev.id;
      const bad = dev.status === 'CRITICAL' || dev.status === 'OFFLINE';
      if (/why/.test(q)) {
        const causes: string[] = [];
        if (dev.packetLoss > 3) causes.push(`elevated packet loss (${f2(dev.packetLoss)}%)`);
        if (dev.signalQuality < 60) causes.push(`weak signal quality (${f1(dev.signalQuality)}%)`);
        if (dev.secondaryBattery < 30) causes.push(`low secondary battery (${f1(dev.secondaryBattery)}%)`);
        if (dev.latency > 500) causes.push(`high latency (${f1(dev.latency)} ms)`);
        if (dev.status === 'OFFLINE' || dev.status === 'CRITICAL') causes.push(`reported status ${dev.status}`);
        const why = causes.length
          ? `Looking at ${dev.id}'s live telemetry: ${causes.join('; ')}. Those are the likely contributors.`
          : `I checked ${dev.id}'s telemetry and no single reading stands out — status ${dev.status}, loss ${f2(dev.packetLoss)}%, latency ${f1(dev.latency)} ms. It looks nominal.`;
        return mixed(why, [{ kind: 'deviceCard', deviceId: dev.id }], bad ? 'warning' : 'found');
      }
      let lead: string;
      if (/how deep|depth/.test(q)) {
        return live(`${dev.id} is currently at ${f1(dev.depth)} m.`, [{ kind: 'deviceCard', deviceId: dev.id }], bad ? 'warning' : 'found');
      }
      if (/signal/.test(q)) {
        return live(
          `Based on the available telemetry, ${dev.id}'s signal looks like this: quality ${f1(dev.signalQuality)}%, strength ${f1(dev.signalStrength)} dB, SNR ${f1(dev.snr)} dB at ${f1(dev.frequency)} Hz.`,
          [{ kind: 'deviceCard', deviceId: dev.id }],
          bad ? 'warning' : 'found',
        );
      }
      if (/explain/.test(q)) {
        lead = `${dev.name} is a ${dev.type.replace(/_/g, ' ').toLowerCase()} node. It's ${dev.status} at ${f1(dev.depth)} m, operating at ${f1(dev.frequency)} Hz and routed via ${dev.primaryRoute.join(' → ') || 'no route'}. Here's the full picture:`;
      } else {
        lead = `Sure. Here's the current information available for ${dev.id} — it's ${dev.status} at ${f1(dev.depth)} m:`;
      }
      return live(lead, [{ kind: 'deviceCard', deviceId: dev.id }], bad ? 'warning' : 'found');
    }
    case 'LOSS': {
      return mixed(
        `Packet loss is averaging ${f2(s.avgPacketLoss)}% network-wide. Worst right now: ${s.worstLinks[0] ? `${s.worstLinks[0].from}→${s.worstLinks[0].to} at ${f2(s.worstLinks[0].packetLoss)}% (${s.worstLinks[0].status})` : 'no standout link'}. Here's the trend:`,
        [{ kind: 'lineChart', metric: 'loss' }],
        s.failedLinks > 0 ? 'warning' : 'found',
      );
    }
    case 'THROUGHPUT': {
      return live(`Here's the throughput trend — averaging ${f1(s.avgThroughput)} msg/s across the network.`, [{ kind: 'lineChart', metric: 'throughput' }]);
    }
    case 'SNC': {
      return live(
        `Here's the live SNC board: traffic intensity ${f2(s.snc.trafficIntensity)} (${s.snc.trafficIntensity < 1 ? 'stable' : 'saturated'}), average delay ${f1(s.snc.averageDelay)} ms within a ${f1(s.snc.delayBound)} ms bound, stability ${s.snc.stability}.`,
        [{ kind: 'sncBoard' }],
      );
    }
    case 'PRISM': {
      return live(`Here are the current PRISM primary routes for the core relay nodes:`, [{ kind: 'prismBoard' }]);
    }
    case 'ENERGY': {
      return live(`Here's the live energy picture across all ${s.deviceCount} nodes:`, [{ kind: 'energyBoard' }]);
    }
    case 'ALERTS': {
      if (s.alerts.length === 0) return live(`All quiet — no alerts in the current dashboard state. The network is nominal.`, []);
      return live(
        `I see ${s.criticalCount} critical, ${s.warningCount} warning and ${s.infoCount} info alerts right now. Latest first:`,
        [{ kind: 'alertsList' }],
        s.criticalCount > 0 ? 'warning' : 'found',
      );
    }
    case 'OCEAN': {
      return live(
        `The monitored water column averages ${f1(s.avgDepth)} m deep at ${f1(s.avgTemperature)} °C and ${f1(s.avgPressure)} bar. Depth shapes everything acoustic — sound speed, absorption and noise all shift with it:`,
        [{ kind: 'oceanEnv' }, { kind: 'depthProfile' }],
      );
    }
    case 'EXPLAIN': {
      if (topic === 'latency') {
        const slow = [...s.devices].sort((a, b) => b.latency - a.latency).slice(0, 3);
        return mixed(
          `Good question — the current average latency is ${f1(s.avgLatency)} ms against an SNC bound of ${f1(s.snc.delayBound)} ms. ` +
            `Slowest right now: ${slow.map(d => `${d.id} at ${f1(d.latency)} ms`).join(', ')}. ` +
            `Most of it is physics (sound crawls at ~1500 m/s), plus queueing when traffic intensity nears 1 — currently ${f2(s.snc.trafficIntensity)}.`,
          [],
          'found',
        );
      }
      const kb = topic ? KNOWLEDGE.find(e => e.keys.some(k => topic.includes(k) || k.includes(topic))) : undefined;
      const diagram = topic === 'snc' ? 'snc' as const : topic === 'prism' ? 'prism' as const : /acoustic|radio/.test(topic || '') ? 'acoustic' as const : /pressure/.test(topic || '') ? 'pressure' as const : null;
      const offer = topic === 'snc' ? '\n\nWould you like me to show the SNC metrics from the live dashboard?'
        : topic === 'prism' ? '\n\nWant me to pull the current PRISM routes from the live dashboard?'
        : topic === 'energy management' ? '\n\nWant the live energy board for all nodes?'
        : '';
      if (kb) {
        if (topic) ctx.lastTopic = topic;
        return {
          text: kb.answer + offer,
          blocks: diagram ? [{ kind: 'diagram', diagram }] : [],
          mood: 'idle',
          source: 'knowledge',
        };
      }
      break;
    }
    default:
      break;
  }

  // latency diagnosis (network-wide why-analysis)
  if (/latency/.test(q)) {
    const slow = [...s.devices].sort((a, b) => b.latency - a.latency).slice(0, 3);
    return mixed(
      `The current average latency is ${f1(s.avgLatency)} ms against an SNC delay bound of ${f1(s.snc.delayBound)} ms. ` +
        `Slowest right now: ${slow.map(d => `${d.id} at ${f1(d.latency)} ms`).join(', ')}. ` +
        `Underwater latency is mostly physics — sound crawls at ~1500 m/s — plus queueing when traffic intensity nears 1 (currently ${f2(s.snc.trafficIntensity)}).`,
      [],
      'found',
    );
  }

  // generic why-analysis against last-discussed device
  if (/^why\b|why is|why are|why does|why do|reason/.test(q)) {
    const wd = (ctx.lastDeviceId && s.devices.find(d => d.id === ctx.lastDeviceId)) || findDevice(s, q);
    if (wd) {
      const causes: string[] = [];
      if (wd.packetLoss > 3) causes.push(`packet loss ${f2(wd.packetLoss)}%`);
      if (wd.signalQuality < 60) causes.push(`signal quality ${f1(wd.signalQuality)}%`);
      if (wd.secondaryBattery < 30) causes.push(`battery ${f1(wd.secondaryBattery)}%`);
      if (wd.latency > 500) causes.push(`latency ${f1(wd.latency)} ms`);
      if (wd.status === 'OFFLINE' || wd.status === 'CRITICAL') causes.push(`status ${wd.status}`);
      ctx.lastDeviceId = wd.id;
      return mixed(
        causes.length
          ? `Good question — looking at ${wd.id}'s live readings: ${causes.join('; ')}. That's where I'd start digging.`
          : `I checked ${wd.id} across loss, signal, battery and latency and nothing stands out — it looks nominal from here.`,
        [{ kind: 'deviceCard', deviceId: wd.id }],
        'found',
      );
    }
  }

  // fallback: legacy text engine (pipeline, AI state, remaining concepts)
  const text = answerQuestion(question, s);
  const noData = /don't currently have that measurement|isn't in the available dashboard data/.test(text);
  const fromKb = KNOWLEDGE.some(e => text.includes(e.answer.slice(0, 48)));
  if (noData) {
    return { text, blocks: [{ kind: 'notice', text: 'Unavailable measurement — not in live telemetry.' }], mood: 'found', source: 'live' };
  }
  if (fromKb) return { text, blocks: [], mood: 'idle', source: 'knowledge' };
  return { text, blocks: [], mood: 'found', source: 'mixed' };
}
