import { useCallback, useRef, useState } from 'react';
import type { MenuOption } from '../../data/menuContent';
import { WaveformPlayer } from './WaveformPlayer';
import type { WaveformPlayerHandle } from './WaveformPlayer';
import { SpectrogramCanvas } from './SpectrogramCanvas';
import type { SignalStats } from './SpectrogramCanvas';
import './AcousticSignals.css';

const SAMPLE_SRC = `${import.meta.env.BASE_URL}dolphin.mp3`;

interface Props {
  option: MenuOption;
  onClose: () => void;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatFreq(hz: number): string {
  if (!Number.isFinite(hz) || hz <= 0) return '--';
  if (hz >= 1000) return `${(hz / 1000).toFixed(2)} kHz`;
  return `${Math.round(hz)} Hz`;
}

const STORY = [
  { icon: '〰️', label: 'MEDIUM' },
  { icon: '📡', label: 'TRANSMIT / RECEIVE' },
  { icon: '🔢', label: 'DIGITAL DATA' },
  { icon: '📊', label: 'DASHBOARD ANALYSIS' },
];

const ANALYSIS_ITEMS = [
  { icon: '〰️', title: 'Waveform', desc: 'Shows signal amplitude changing over time.' },
  { icon: '📊', title: 'Spectrogram', desc: 'Shows how the frequency content changes over time.' },
  { icon: '📡', title: 'Signal Strength', desc: 'Indicates the received signal level.' },
  { icon: '⏱️', title: 'Timing', desc: 'Shows transmission and reception timing.' },
  { icon: '🔊', title: 'Noise / Interference', desc: 'Helps identify environmental or communication disturbances.' },
];

export function AcousticSignals({ option, onClose }: Props) {
  const playerRef = useRef<WaveformPlayerHandle>(null);
  const progressRef = useRef({ t: 0, d: 0 });
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [playing, setPlaying] = useState(false);

  const handleTick = useCallback((t: number, d: number) => {
    progressRef.current = { t, d };
  }, []);

  const handleSeek = useCallback((ratio: number) => {
    playerRef.current?.seekTo(ratio);
  }, []);

  const signalPct = stats ? Math.min(100, Math.round(stats.rms * 100 * 3)) : 0;

  return (
    <div className="menu-content-view acoustic-signals">
      <div className="menu-content-header">
        <div className="menu-content-title">
          <span className="menu-content-icon">{option.icon}</span>
          <div>
            <div className="menu-content-label">{option.label}</div>
            <div className="menu-content-ctx">Underwater acoustic communication & signal analysis</div>
          </div>
        </div>
        <button className="menu-content-back" onClick={onClose}>← Back to Dashboard</button>
      </div>

      <div className="menu-content-body">
        <div className="mc-section">
          <h4 className="mc-heading">Understanding Acoustic Signals</h4>
          <p className="mc-paragraph">
            An acoustic signal is information carried through sound waves. In our underwater
            communication system, acoustic signals are used because radio-frequency
            communication is strongly limited underwater.
          </p>
          <p className="mc-paragraph" style={{ marginTop: 8 }}>
            The communication node converts digital information into an acoustic signal,
            transmits it through the water, and another node detects and processes the
            received signal.
          </p>
        </div>

        <div className="mc-section">
          <h4 className="mc-heading">How Acoustic Signals Work</h4>
          <div className="mc-flow">
            {['Digital Data', 'Signal Processing', 'Acoustic Transmitter', '〰️ Underwater Acoustic Signal', 'Water Channel', 'Acoustic Receiver', 'Signal Processing', 'Recovered Data'].map((step, j, arr) => (
              <div className="mc-flow-item" key={step}>
                <span className="mc-flow-box">{step}</span>
                {j < arr.length - 1 && <span className="mc-flow-arrow">↓</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="mc-section">
          <h4 className="mc-heading">Acoustic Sensing</h4>
          <p className="mc-paragraph">
            An acoustic sensor/transducer can detect pressure variations produced by sound
            waves. The received acoustic waveform can be sampled and converted into a digital
            representation so that the system can analyze characteristics such as:
          </p>
          <ul className="mc-bullets">
            {['Frequency', 'Amplitude', 'Duration', 'Signal strength', 'Timing', 'Repetition/pulse pattern', 'Noise and interference'].map(b => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
          <div className="mc-note">
            In a real sensing system, the captured signal is processed into digital measurements
            or signatures rather than storing unnecessary raw audio.
          </div>
        </div>

        <div className="mc-section">
          <h4 className="mc-heading">Why Acoustic Communication Underwater?</h4>
          <p className="mc-paragraph">
            Water makes conventional wireless communication difficult over useful distances,
            while sound can propagate much farther underwater. This makes acoustic
            communication useful for:
          </p>
          <ul className="mc-bullets">
            {['Underwater sensor networks', 'Autonomous underwater devices', 'Submerged monitoring systems', 'Scientific data collection', 'Node-to-node communication'].map(b => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
        </div>

        <div className="mc-section">
          <h4 className="mc-heading">Acoustic Signal Analysis</h4>
          <p className="mc-paragraph">The dashboard can visualize an acoustic transmission using:</p>
          <div className="mc-items" style={{ marginTop: 8 }}>
            {ANALYSIS_ITEMS.map(item => (
              <div className="mc-item" key={item.title}>
                <span className="mc-item-num">{item.icon}</span>
                <div>
                  <div className="mc-item-title">{item.title}</div>
                  <div className="mc-item-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mc-section">
          <h4 className="mc-heading">Acoustic Signal in Our Mission</h4>
          <p className="mc-paragraph">
            For our underwater node, the acoustic channel is the communication path between
            submerged devices. The system analyzes the transmitted and received signal to
            determine whether communication is reliable and whether the underwater channel is
            degrading — information that also feeds routing, communication, and network analytics.
          </p>
        </div>

        {/* ── Interactive signal lab ─────────────────────────── */}
        <div className="mc-section as-lab">
          <h4 className="mc-heading">Signal Lab — Live Analysis</h4>

          <div className="as-story">
            {STORY.map((s, i) => (
              <div className="as-story-step" key={s.label}>
                <span className="as-story-icon">{s.icon}</span>
                <span className="as-story-label">{s.label}</span>
                {i < STORY.length - 1 && <span className="as-story-arrow">→</span>}
              </div>
            ))}
          </div>

          <div className="as-link">
            <div className="as-node">
              <span className="as-node-tag">TRANSMITTER</span>
              <span className="as-node-name">NODE A</span>
              <span className="as-dot" />
            </div>
            <div className="as-wave" aria-hidden="true">〰️〰️〰️〰️〰️〰️〰️〰️</div>
            <div className="as-link-arrow">→</div>
            <div className="as-node">
              <span className="as-node-tag">RECEIVER</span>
              <span className="as-node-name">NODE B</span>
              <span className="as-dot" />
            </div>
          </div>

          <div className="as-panel-label">〰️ Waveform — amplitude over time (click to seek)</div>
          <WaveformPlayer
            ref={playerRef}
            src={SAMPLE_SRC}
            icon="〰️"
            title="Sample Acoustic Recording"
            meta="Actual audio signal · dolphin.mp3"
            onTick={handleTick}
            onPlayingChange={setPlaying}
          />

          <div className="as-panel-label">📊 Spectrogram — frequency over time (click to seek)</div>
          <div className="as-spec-wrap">
            <span className="as-axis-y">Frequency ↑</span>
            <SpectrogramCanvas
              src={SAMPLE_SRC}
              title="acoustic recording"
              progressRef={progressRef}
              onSeek={handleSeek}
              onStats={setStats}
            />
            <span className="as-axis-x">Time →</span>
          </div>

          <div className="as-metrics">
            <div className="as-metric">
              <span className="as-metric-k">Frequency</span>
              <span className="as-metric-v">{stats ? formatFreq(stats.dominantFreq) : '--'}</span>
            </div>
            <div className="as-metric">
              <span className="as-metric-k">Amplitude</span>
              <span className="as-metric-v">{stats ? `${stats.peak.toFixed(2)} · ${stats.peakDb.toFixed(1)} dB` : '--'}</span>
            </div>
            <div className="as-metric">
              <span className="as-metric-k">Duration</span>
              <span className="as-metric-v">{stats ? formatTime(stats.duration) : '--:--'}</span>
            </div>
            <div className="as-metric">
              <span className="as-metric-k">Signal</span>
              <span className="as-metric-v">
                <span className="as-level"><span className="as-level-fill" style={{ width: `${signalPct}%` }} /></span>
                {stats ? `${(stats.rms * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
            <div className="as-metric">
              <span className="as-metric-k">Status</span>
              <span className={`as-metric-v${playing ? ' as-live' : ''}`}>
                {playing ? '▶ PLAYING' : '● READY'}
              </span>
            </div>
          </div>
        </div>

        <div className="mc-section">
          <h4 className="mc-heading">What You Are Seeing</h4>
          <p className="mc-paragraph">
            The waveform and spectrogram above represent an acoustic recording/signal. Both
            visualizations are generated from the actual audio signal rather than a decorative
            animation. Use <b>▶ Play / Pause</b>, the <b>〰️ waveform</b>, the{' '}
            <b>📊 spectrogram</b>, <b>⏱️ time</b>, and <b>🔊 signal information</b> to inspect
            the acoustic recording.
          </p>
          <div className="mc-note">
            Acoustic sensing systems process detected acoustic information locally into numerical
            measurements or digital signatures when only signal characteristics are required. For
            our platform, the important information is the communication signal and its measurable
            characteristics — not human speech or unrelated audio.
          </div>
        </div>
      </div>
    </div>
  );
}
