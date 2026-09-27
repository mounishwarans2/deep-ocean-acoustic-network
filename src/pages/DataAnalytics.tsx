import { useState } from 'react';
import type { ReactNode } from 'react';
import type { SimulationState } from '../hooks/useSimulation';
import './DataAnalytics.css';

type Badge = 'LIVE' | 'SIMULATION' | 'DEMONSTRATION' | 'ARCHITECTURAL';

function Badge({ kind }: { kind: Badge }) {
  return (
    <span className={`da-badge da-badge-${kind.toLowerCase()}`}>
      {kind}
    </span>
  );
}

function QA({ q, simple, text, techText }: { q: string; simple: boolean; text: string; techText?: string }) {
  return (
    <div className="da-qa">
      <div className="da-q">{q}</div>
      <p className="da-a">{simple ? text : (techText ?? text)}</p>
    </div>
  );
}

function VArrow() {
  return <div className="da-arrow-v" aria-hidden="true" />;
}

function HArrow() {
  return <div className="da-arrow-h" aria-hidden="true" />;
}

function Box({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <div className={`da-box${accent ? ' da-box-accent' : ''}`}>{children}</div>;
}

function LearnStrip({ steps }: { steps: string[] }) {
  return (
    <div className="da-learn-strip">
      {steps.map((s, i) => (
        <span key={s} className="da-learn-item">
          <span className="da-learn-box">{s}</span>
          {i < steps.length - 1 && <span className="da-learn-arrow">→</span>}
        </span>
      ))}
    </div>
  );
}

interface PanelProps {
  id: string;
  icon: string;
  title: string;
  badge: Badge;
  tagline: string;
  open: boolean;
  onToggle: () => void;
  simple: boolean;
  what: [string, string?];
  why: [string, string?];
  project: [string, string?];
  tech: [string, string?];
  howDiagram: ReactNode;
  learnSteps: string[];
  extra?: ReactNode;
}

function Panel(p: PanelProps) {
  const [showHow, setShowHow] = useState(false);
  return (
    <div className={`da-panel${p.open ? ' da-open' : ''}`}>
      <button className="da-panel-head" onClick={p.onToggle} aria-expanded={p.open}>
        <span className="da-panel-icon">{p.icon}</span>
        <span className="da-panel-titles">
          <span className="da-panel-title">{p.title}</span>
          <span className="da-panel-tagline">{p.tagline}</span>
        </span>
        <Badge kind={p.badge} />
        <span className="da-chevron">{p.open ? '▾' : '▸'}</span>
      </button>
      {p.open && (
        <div className="da-panel-body">
          <QA q="What is it?" simple={p.simple} text={p.what[0]} techText={p.what[1]} />
          <QA q="Why do we use it?" simple={p.simple} text={p.why[0]} techText={p.why[1]} />
          <div className="da-qa">
            <div className="da-q">How does it work?</div>
            <div className="da-diagram">{p.howDiagram}</div>
          </div>
          {p.extra}
          <QA q="How does our project use it?" simple={p.simple} text={p.project[0]} techText={p.project[1]} />
          <QA q="Technical view" simple={p.simple} text={p.tech[0]} techText={p.tech[1]} />
          <button className="da-how-btn" onClick={() => setShowHow(s => !s)}>
            {showHow ? 'Hide animation ▴' : 'See How It Works ▾'}
          </button>
          {showHow && <LearnStrip steps={p.learnSteps} />}
        </div>
      )}
    </div>
  );
}

/* ── Pipeline interactive diagram ── */
interface StageInfo {
  id: string;
  icon: string;
  name: string;
  receives: string;
  produces: string;
  usedFor: string;
}

const STAGES: StageInfo[] = [
  { id: 'nodes', icon: '🌊', name: 'Underwater Nodes', receives: 'Ocean conditions', produces: 'Telemetry events', usedFor: 'Sensing and sending data' },
  { id: 'kafka', icon: '📨', name: 'Kafka', receives: 'Telemetry events', produces: 'A stream of events', usedFor: 'Moving continuous data' },
  { id: 'spark', icon: '⚙️', name: 'Spark', receives: 'Streaming data', produces: 'Processed results', usedFor: 'Fast large-scale processing' },
  { id: 'scala', icon: '🛠️', name: 'Scala', receives: 'Processing task', produces: 'Processing instructions', usedFor: 'Telling Spark what to calculate' },
  { id: 'cassandra', icon: '🗄️', name: 'Cassandra', receives: 'Processed records', produces: 'Historical data', usedFor: 'Storing history reliably' },
  { id: 'analytics', icon: '📊', name: 'Analytics', receives: 'Metrics + history', produces: 'SNC / network metrics', usedFor: 'Measuring system performance' },
  { id: 'dashboard', icon: '🌐', name: 'Dashboard', receives: 'Final results', produces: 'Screens for the operator', usedFor: 'Showing what is happening' },
];

function PipelineDiagram() {
  const [sel, setSel] = useState('kafka');
  const s = STAGES.find(x => x.id === sel)!;
  return (
    <div className="da-pipe">
      <div className="da-pipe-flow">
        {STAGES.map((st, i) => (
          <span key={st.id} className="da-pipe-item">
            <button
              className={`da-pipe-node${sel === st.id ? ' da-sel' : ''}`}
              onClick={() => setSel(st.id)}
            >
              <span className="da-pipe-icon">{st.icon}</span>
              <span className="da-pipe-name">{st.name}</span>
            </button>
            {i < STAGES.length - 1 && <span className="da-pipe-arrow">→</span>}
          </span>
        ))}
      </div>
      <div className="da-pipe-detail">
        <div className="da-pipe-detail-title">{s.icon} {s.name}</div>
        <div className="da-pipe-row"><span>Receives</span><b>{s.receives}</b></div>
        <div className="da-pipe-row"><span>Produces</span><b>{s.produces}</b></div>
        <div className="da-pipe-row"><span>Used for</span><b>{s.usedFor}</b></div>
      </div>
    </div>
  );
}

/* ═══════════ Main section ═══════════ */
const STORY = ['🌊 Nodes', '☁️ Big Data', '📨 Kafka', '⚙️ Spark', '🛠️ Scala', '🗄️ Cassandra', '📏 Metrics', '🧮 SNC', '🌐 Dashboard'];

export function DataAnalytics({ state }: { state: SimulationState }) {
  const [simple, setSimple] = useState(true);
  const [open, setOpen] = useState<string[]>(['bigdata']);
  const { devices, links, snc, kafka, spark, cassandra } = state;

  const activeLinks = links.filter(l => l.status === 'ACTIVE').length;
  const avgLatency = devices.reduce((s, d) => s + d.latency, 0) / devices.length;
  const avgLoss = devices.reduce((s, d) => s + d.packetLoss, 0) / devices.length;

  const toggle = (id: string) =>
    setOpen(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const panel = (id: string) => ({
    open: open.includes(id),
    onToggle: () => toggle(id),
    simple,
  });

  return (
    <div className="da-wrap">
      <div className="card">
        <div className="card-header">
          <span className="card-title">Data &amp; Analytics ▾</span>
          <button className={`da-teach-btn${simple ? ' da-on' : ''}`} onClick={() => setSimple(s => !s)}>
            🎓 Explain Simply: {simple ? 'ON' : 'OFF'}
          </button>
        </div>
        <p className="da-intro">
          {simple
            ? 'Follow one story: underwater devices make data, and each tool below handles one step of the journey.'
            : 'Each panel below covers one layer of the data architecture: definition, purpose, mechanism, project usage and technical view.'}
        </p>
        <div className="da-story">
          {STORY.map((s, i) => (
            <span key={s} className="da-story-item">
              <span className="da-story-box">{s}</span>
              {i < STORY.length - 1 && <span className="da-story-arrow">→</span>}
            </span>
          ))}
        </div>
        <div className="da-legend">
          <Badge kind="LIVE" /><Badge kind="SIMULATION" /><Badge kind="DEMONSTRATION" /><Badge kind="ARCHITECTURAL" />
        </div>
      </div>

      {/* ── 1. BIG DATA ── */}
      <Panel
        id="bigdata" icon="☁️" title="BIG DATA" badge="DEMONSTRATION"
        tagline="Lots of information arriving all the time"
        what={[
          'Big Data means a very large amount of information that is produced continuously and needs special tools to store and analyze it.',
          'Big Data refers to datasets whose volume, velocity and variety exceed the capacity of single-machine storage and processing.',
        ]}
        why={[
          'Our underwater nodes continuously produce information. To understand what happened over minutes, hours or months, we need a system that can handle a large amount of data.',
          'Continuous telemetry from many nodes accumulates faster than ad-hoc tools can query; a big-data layer makes long-term analysis possible.',
        ]}
        project={[
          'Our underwater system can generate continuous telemetry, acoustic, energy, routing and network-performance data.',
          'Telemetry, acoustic events, energy readings, routing events and SNC metrics form the project dataset.',
        ]}
        tech={[
          'Special storage and processing tools share the work across many machines.',
          'Distributed storage and parallel processing engines (Kafka, Spark, Cassandra) scale horizontally with data volume.',
        ]}
        howDiagram={
          <div className="da-nodes-in">
            <div className="da-nodes-col">
              {['Node 1', 'Node 2', 'Node 3', 'Node 4', 'Node 5', 'Node 6'].map(n => (
                <span key={n} className="da-mini-node">🟦 {n}</span>
              ))}
            </div>
            <HArrow />
            <Box accent>📊 HUGE DATA<div className="da-chips">{['Telemetry', 'Acoustic', 'Energy', 'Depth', 'Network', 'Alerts', 'Routing'].map(c => <span key={c} className="da-chip">{c}</span>)}</div></Box>
          </div>
        }
        learnSteps={['Small data', 'More nodes', 'Continuous data', 'Big data']}
        extra={
          <div className="da-live-row">
            <span className="da-live-chip"><Badge kind="LIVE" /> {devices.length} devices reporting</span>
            <span className="da-live-chip"><Badge kind="LIVE" /> {snc.throughput.toFixed(0)} msg/s flowing</span>
          </div>
        }
        {...panel('bigdata')}
      />

      {/* ── 2. SPARK ── */}
      <Panel
        id="spark" icon="⚙️" title="SPARK ANALYTICS" badge="SIMULATION"
        tagline="Shares big checking work among many helpers"
        what={[
          'Apache Spark is a tool that helps us process and analyze a large amount of data quickly — like dividing 100,000 exam papers among many helpers instead of one teacher.',
          'Apache Spark is a distributed data-processing engine that divides large jobs across multiple workers.',
        ]}
        why={[
          'Our system can generate a large amount of telemetry and network data. Spark can process it and calculate useful metrics.',
          'Batch and streaming telemetry (delay, loss, throughput, SNC metrics) need parallel aggregation Spark is designed for.',
        ]}
        project={[
          'Underwater data flows into Spark, which calculates delay, packet loss, throughput, traffic and SNC metrics for the dashboard.',
          'Spark jobs aggregate per-node telemetry into network-level delay, loss, throughput and traffic-intensity indicators.',
        ]}
        tech={[
          'Spark splits the work, helpers compute in parallel, results are combined.',
          'The engine partitions datasets, schedules tasks on executors and combines partial results (map / reduce semantics).',
        ]}
        howDiagram={
          <div className="da-col">
            <Box accent>📊 LARGE DATA</Box>
            <VArrow />
            <Box>⚙️ SPARK</Box>
            <div className="da-workers">
              {['Worker', 'Worker', 'Worker'].map((w, i) => (
                <span key={i} className="da-worker">⚙️ {w}</span>
              ))}
            </div>
            <VArrow />
            <Box accent>📈 ANALYTICS</Box>
          </div>
        }
        learnSteps={['Data', 'Split', 'Process', 'Combine', 'Result']}
        extra={
          <div className="da-live-row">
            <span className="da-live-chip"><Badge kind="SIMULATION" /> {spark.processingRate.toFixed(0)} rec/s</span>
            <span className="da-live-chip"><Badge kind="SIMULATION" /> {spark.activeJobs} active jobs</span>
            <span className="da-live-chip"><Badge kind="SIMULATION" /> {spark.batchDuration.toFixed(1)}s batches</span>
          </div>
        }
        {...panel('spark')}
      />

      {/* ── 3. SCALA ── */}
      <Panel
        id="scala" icon="🛠️" title="SCALA PROCESSING" badge="ARCHITECTURAL"
        tagline="The language that tells Spark workers what to do"
        what={[
          'Scala is a programming language. Here it writes the processing logic that runs with Spark — Spark is the workers, Scala is the instruction sheet.',
          'Scala is a JVM language commonly used with Spark to express distributed data-processing programs.',
        ]}
        why={[
          'Scala works closely with Spark and lets developers write data-processing programs in few lines.',
          'Native Spark APIs in Scala give concise, type-safe transformations with direct access to the Spark engine.',
        ]}
        project={[
          'Scala code can group readings by device and compute averages such as latency and packet loss.',
          'Scala jobs would implement the SNC and PRISM metric aggregations over the telemetry stream.',
        ]}
        tech={[
          'Short code describes the calculation; Spark runs it on all workers.',
          'DataFrame operations (groupBy / agg) are translated by Catalyst into distributed execution plans.',
        ]}
        howDiagram={
          <div className="da-col">
            <Box>⚙️ SPARK — “What should I calculate?”</Box>
            <VArrow />
            <Box accent>🛠️ SCALA — processing instructions</Box>
            <VArrow />
            <Box>📊 Network results</Box>
          </div>
        }
        learnSteps={['Code', 'Spark', 'Processing', 'Result']}
        extra={
          <div className="da-code">
            <div className="da-code-title">Example <Badge kind="DEMONSTRATION" /></div>
            <pre>{`val metrics = telemetry
  .groupBy("nodeId")
  .agg(
    avg("latency"),
    avg("packetLoss")
  )`}</pre>
            <p className="da-a">This code groups data by underwater device and calculates useful network measurements.</p>
          </div>
        }
        {...panel('scala')}
      />

      {/* ── 4. KAFKA ── */}
      <Panel
        id="kafka" icon="📨" title="KAFKA STREAMING" badge="SIMULATION"
        tagline="The post office for continuous data"
        what={[
          'Kafka collects and moves continuous streams of data — like a post office that receives letters and sends each to the correct place.',
          'Kafka is a distributed event-streaming platform: producers publish events to topics, consumers read them.',
        ]}
        why={[
          'Underwater devices continuously produce data. Kafka receives those events and hands them to downstream processing.',
          'A streaming buffer decouples bursty device telemetry from Spark processing so nothing is lost during peaks.',
        ]}
        project={[
          'Node telemetry, acoustic, energy, network and alert events flow through Kafka topics into Spark.',
          'One topic per event family (telemetry, acoustic, energy, network, alerts) feeds the analytics engine.',
        ]}
        tech={[
          'Senders publish to named topics; readers subscribe and process at their own pace.',
          'Partitioned append-only logs per topic give ordering, replay and parallel consumption.',
        ]}
        howDiagram={
          <div className="da-nodes-in">
            <div className="da-nodes-col">
              {['Node 01', 'Node 02', 'Node 03', 'Node 04', 'Node 05', 'Node 06'].map(n => (
                <span key={n} className="da-mini-node">🌊 {n}</span>
              ))}
            </div>
            <HArrow />
            <Box accent>📨 KAFKA<div className="da-chips">{['Telemetry', 'Acoustic', 'Energy', 'Network', 'Alerts'].map(c => <span key={c} className="da-chip">{c}</span>)}</div></Box>
            <HArrow />
            <Box>⚙️ SPARK</Box>
          </div>
        }
        learnSteps={['Producer', 'Topic', 'Consumer', 'Spark']}
        extra={
          <div className="da-live-row">
            <span className="da-live-chip"><Badge kind="SIMULATION" /> {kafka.messagesPerSec.toFixed(0)} msg/s</span>
            <span className="da-live-chip"><Badge kind="SIMULATION" /> lag {kafka.consumerLag}</span>
            <span className="da-live-chip"><Badge kind="SIMULATION" /> {kafka.totalMessages.toLocaleString()} total</span>
          </div>
        }
        {...panel('kafka')}
      />

      {/* ── 5. CASSANDRA ── */}
      <Panel
        id="cassandra" icon="🗄️" title="CASSANDRA STORAGE" badge="SIMULATION"
        tagline="A huge library spread across many rooms"
        what={[
          'Cassandra is a database built to store very large amounts of data — books organized across many rooms so everything can be stored and found efficiently.',
          'Cassandra is a distributed NoSQL database that partitions data across many servers with no single point of failure.',
        ]}
        why={[
          'Our system generates historical telemetry and network records. Cassandra keeps these records safe for later analysis.',
          'Time-series telemetry grows without bound; a wide-column distributed store scales writes and keeps history queryable.',
        ]}
        project={[
          'Telemetry rows (node, time, depth, temperature, pressure, latency, loss, signal) are stored per device and read back for analysis.',
          'An UNDERWATER_TELEMETRY table keyed by node and timestamp serves the history views.',
        ]}
        tech={[
          'Data is copied across servers, so history survives failures and can be retrieved fast.',
          'Replication plus partition keys distribute load; queries slice by node and time range.',
        ]}
        howDiagram={
          <div className="da-col">
            <Box accent>📊 DATA</Box>
            <VArrow />
            <Box>🗄️ CASSANDRA</Box>
            <div className="da-workers">
              {['Server 1', 'Server 2', 'Server 3'].map(s => (
                <span key={s} className="da-worker">🖥️ {s}</span>
              ))}
            </div>
            <VArrow />
            <Box accent>Historical data</Box>
          </div>
        }
        learnSteps={['Data', 'Distributed storage', 'Retrieve']}
        extra={
          <div>
            <div className="da-code">
              <div className="da-code-title">Example table <Badge kind="DEMONSTRATION" /></div>
              <pre>{`UNDERWATER_TELEMETRY
node_id | timestamp | depth | temperature
pressure | latency | packet_loss | signal`}</pre>
            </div>
            <div className="da-live-row">
              <span className="da-live-chip"><Badge kind="SIMULATION" /> {cassandra.writesPerSec.toFixed(0)} writes/s</span>
              <span className="da-live-chip"><Badge kind="SIMULATION" /> {cassandra.storageGB.toFixed(1)} GB</span>
            </div>
          </div>
        }
        {...panel('cassandra')}
      />

      {/* ── 6. NETWORK METRICS ── */}
      <Panel
        id="metrics" icon="📏" title="NETWORK METRICS" badge="LIVE"
        tagline="Measurements that say how well the system works"
        what={[
          'Network metrics are measurements that tell us how well our underwater communication system is working.',
          'Quantitative indicators (throughput, latency, loss, arrival/service rates, backlog, buffer) describing link and system performance.',
        ]}
        why={[
          'Without measurements we cannot tell good links from bad ones, or know when to reroute.',
          'Metrics drive PRISM routing decisions and SNC stability evaluation.',
        ]}
        project={[
          'Every value below is taken from the current dashboard data right now.',
          'All cards bind directly to the live simulation state (devices, links, SNC).',
        ]}
        tech={[
          'The dashboard recomputes these from device telemetry every update.',
          'Aggregations over per-node counters with SNC arrival/service-rate analysis.',
        ]}
        howDiagram={
          <div className="da-metrics-grid">
            <div className="da-metric">
              <b>📦 Throughput — {snc.throughput.toFixed(1)} msg/s</b>
              <span>How much data moves. 📦📦📦 → 📡 → 📦📦📦</span>
            </div>
            <div className="da-metric">
              <b>⏱️ Latency — {Math.round(avgLatency)} ms</b>
              <span>Travel time. NODE A ─── ⏱️ ───► NODE B</span>
            </div>
            <div className="da-metric">
              <b>✕ Packet loss — {avgLoss.toFixed(1)}%</b>
              <span>📦 📦 ✕ 📦 📦 — one packet was lost.</span>
            </div>
            <div className="da-metric">
              <b>📥 Arrival {snc.arrivalRate.toFixed(1)} / 📤 Service {snc.serviceRate.toFixed(1)}</b>
              <span>How fast data arrives vs how fast the system handles it.</span>
            </div>
            <div className="da-metric">
              <b>📚 Backlog — {snc.backlog}</b>
              <span>Data waiting. 📦📦📦 → PROCESSOR → 📦📦</span>
            </div>
            <div className="da-metric">
              <b>🗃️ Buffer — {snc.bufferUtilization}%</b>
              <div className="progress-bar"><div className="progress-fill cyan" style={{ width: `${Math.min(snc.bufferUtilization, 100)}%` }} /></div>
            </div>
          </div>
        }
        learnSteps={['Measure', 'Compare', 'Decide', 'Reroute']}
        extra={
          <div className="da-live-row">
            <span className="da-live-chip"><Badge kind="LIVE" /> {devices.length} nodes</span>
            <span className="da-live-chip"><Badge kind="LIVE" /> {activeLinks}/{links.length} links</span>
            <span className="da-live-chip"><Badge kind="LIVE" /> SNC {snc.stability}</span>
          </div>
        }
        {...panel('metrics')}
      />

      {/* ── 7. PIPELINE ── */}
      <Panel
        id="pipeline" icon="🔁" title="DATA PIPELINE" badge="SIMULATION"
        tagline="The journey from ocean to dashboard — click each step"
        what={[
          'The data pipeline is the journey information takes from underwater devices to the final dashboard.',
          'A staged streaming architecture: ingest → process → store → analyze → visualize.',
        ]}
        why={[
          'Each step has one job, so problems are easy to find and the system can grow step by step.',
          'Separation of concerns lets each stage scale and fail independently.',
        ]}
        project={[
          'Nodes send telemetry; the simulated Kafka, Spark/Scala and Cassandra stages shape it into metrics for this dashboard.',
          'Stage values mirror the simulator; no external Kafka/Spark/Cassandra cluster is connected.',
        ]}
        tech={[
          'Data moves down the chain; arrows animate to show the flow.',
          'Events flow through topics into streaming jobs, persisted, aggregated and served to the UI.',
        ]}
        howDiagram={<PipelineDiagram />}
        learnSteps={['Nodes', 'Kafka', 'Spark/Scala', 'Cassandra/Analytics', 'Dashboard']}
        {...panel('pipeline')}
      />
    </div>
  );
}
