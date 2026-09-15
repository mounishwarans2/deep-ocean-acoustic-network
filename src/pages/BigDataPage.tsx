import type { SimulationState } from '../hooks/useSimulation';
import { MiniChart } from '../components/charts/MiniChart';
import { formatNumber, formatDecimal, formatPercent, deviceTypeColor, deviceSymbol } from '../utils/format';

interface Props {
  state: SimulationState;
}

export function BigDataPage({ state }: Props) {
  const { kafka, spark, cassandra, pipeline, aiDecision } = state;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Device Telemetry — Per-Device Stream</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{state.devices.length} devices reporting</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, padding: '8px 14px' }}>
          {state.devices.map(d => (
            <div key={d.id} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6,
              padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: deviceTypeColor(d.type) }}>
                  {deviceSymbol(d.type)} {d.id}
                </span>
                <span style={{
                  fontSize: 9.5, fontWeight: 600, padding: '0 4px', borderRadius: 3,
                  color: d.status === 'NORMAL' ? 'var(--accent-green)' : d.status === 'WARNING' ? 'var(--accent-yellow)' : 'var(--accent-red)',
                  background: d.status === 'NORMAL' ? 'rgba(34,197,94,0.1)' : d.status === 'WARNING' ? 'rgba(250,204,21,0.1)' : 'rgba(239,68,68,0.1)',
                }}>{d.status}</span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{d.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: 10.5 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>TX: </span><span style={{ color: 'var(--text-secondary)' }}>{d.packetsSent.toLocaleString()}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Loss: </span><span style={{ color: d.packetLoss > 3 ? 'var(--accent-yellow)' : 'var(--text-secondary)' }}>{formatPercent(d.packetLoss)}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Rate: </span><span style={{ color: 'var(--accent-cyan)' }}>{d.throughput.toFixed(1)} msg/s</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Lat: </span><span style={{ color: 'var(--text-secondary)' }}>{Math.round(d.latency)} ms</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Sig: </span><span style={{ color: d.signalQuality > 75 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{d.signalQuality.toFixed(0)}%</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Bat: </span><span style={{ color: d.secondaryBattery > 80 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{formatPercent(d.secondaryBattery)}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Depth</span>
                <div style={{ flex: 1, height: 2, background: 'var(--bg-ocean)', borderRadius: 1 }}>
                  <div style={{ height: '100%', width: `${Math.min(d.depth / 55, 100)}%`, background: 'var(--accent-blue)', borderRadius: 1 }} />
                </div>
                <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{d.depth.toLocaleString()}m</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Data Pipeline Architecture</span>
        </div>
        <div className="pipeline-container">
          {[
            { name: 'Underwater Nodes', detail: `${state.devices.length} devices`, online: true },
            { name: 'Acoustic Telemetry', detail: `${state.devices.reduce((s, n) => s + n.throughput, 0).toFixed(0)} msg/s`, online: true },
            { name: 'Apache Kafka', detail: `${kafka.messagesPerSec} msg/s`, online: pipeline.kafka },
            { name: 'Spark Structured Streaming', detail: `${spark.processingRate} rec/s`, online: pipeline.spark },
            { name: 'Scala Analytics Engine', detail: `${spark.activeJobs} jobs`, online: pipeline.scala },
            { name: 'SNC / PROGRAMMING / PRISM', detail: `ρ=${state.snc.trafficIntensity.toFixed(2)}`, online: true },
            { name: 'Apache Cassandra', detail: `${cassandra.writesPerSec} writes/s`, online: pipeline.cassandra },
            { name: 'Dashboard API', detail: 'Real-time', online: pipeline.api },
          ].map((step, i) => (
            <div key={i}>
              <div className="pipeline-step">
                <div className={`pipeline-box ${step.online ? 'online' : ''}`}>
                  <div>
                    <div className="pipeline-box-name">{step.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{step.detail}</div>
                  </div>
                  <div className="pipeline-box-status">
                    <span className="status-dot" style={{ background: step.online ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                    {step.online ? 'ONLINE' : 'OFFLINE'}
                  </div>
                </div>
              </div>
              {i < 7 && <div className="pipeline-arrow">▼</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="page-grid-3">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Kafka</span>
            <span style={{ color: pipeline.kafka ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 11.5 }}>
              ● {pipeline.kafka ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Messages/sec</span>
            <span className="metric-value cyan">{formatDecimal(kafka.messagesPerSec)}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Consumer Lag</span>
            <span className="metric-value">{kafka.consumerLag}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Total Messages</span>
            <span className="metric-value">{formatNumber(kafka.totalMessages)}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Spark</span>
            <span style={{ color: pipeline.spark ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 11.5 }}>
              ● {pipeline.spark ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Processing Rate</span>
            <span className="metric-value cyan">{formatDecimal(spark.processingRate)} rec/s</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Batch Duration</span>
            <span className="metric-value">{formatDecimal(spark.batchDuration)} sec</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Active Jobs</span>
            <span className="metric-value">{spark.activeJobs}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Cassandra</span>
            <span style={{ color: pipeline.cassandra ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 11.5 }}>
              ● {pipeline.cassandra ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Writes/sec</span>
            <span className="metric-value cyan">{formatDecimal(cassandra.writesPerSec)}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Storage</span>
            <span className="metric-value">{cassandra.storageGB} GB</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Read Latency</span>
            <span className="metric-value">{formatDecimal(cassandra.readLatency)} ms</span>
          </div>
        </div>
      </div>

      <div className="page-grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Incoming Telemetry</span>
          </div>
          <MiniChart data={state.historyThroughput} color="var(--accent-cyan)" height={60} showDots />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div className="stat-card">
              <div className="stat-label">Records/sec</div>
              <div className="stat-value cyan">{formatNumber(Math.round(kafka.messagesPerSec))}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Consumer Lag</div>
              <div className="stat-value">{kafka.consumerLag}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Programming Decision Engine</span>
          </div>
          <div className="ai-box" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            <div style={{ marginBottom: 10 }}>
              <div className="ai-label">Detected</div>
              <div className="ai-value">{aiDecision.detected}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div className="ai-label">Prediction</div>
              <div className="ai-value">{aiDecision.prediction}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div className="ai-label">Recommendation</div>
              <div className="ai-value">{aiDecision.recommendation}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div className="ai-label">Confidence</div>
              <span className="ai-confidence">{aiDecision.confidence}%</span>
            </div>
            <div>
              <div className="ai-label">Action</div>
              <div className="ai-value" style={{ color: 'var(--accent-cyan)' }}>{aiDecision.action}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
