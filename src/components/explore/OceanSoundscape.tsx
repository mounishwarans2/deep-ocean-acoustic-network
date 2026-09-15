import { useRef, useEffect, useState, useCallback } from 'react';
import type { MenuOption } from '../../data/menuContent';
import './OceanSoundscape.css';

interface Props {
  option: MenuOption;
  onClose: () => void;
}

const TOTAL_SECONDS = 222; // 03:42

const CATEGORIES = [
  {
    icon: '🐋',
    title: 'Biological',
    items: [
      { icon: '🐋', name: 'Whale Songs', freq: '10–200 Hz' },
      { icon: '🐬', name: 'Dolphin Clicks', freq: '0.2–150 kHz' },
      { icon: '🐟', name: 'Fish Choruses', freq: '50–2000 Hz' },
    ],
  },
  {
    icon: '🌧️',
    title: 'Environmental',
    items: [
      { icon: '🌧️', name: 'Rain', freq: '1–20 kHz' },
      { icon: '🌊', name: 'Waves', freq: '0.1–1000 Hz' },
      { icon: '🌪️', name: 'Storms', freq: '1–50 kHz' },
      { icon: '🧊', name: 'Ice Cracking', freq: '1–300 kHz' },
    ],
  },
  {
    icon: '🚢',
    title: 'Anthropogenic',
    items: [
      { icon: '🚢', name: 'Ship Engines', freq: '10–1000 Hz' },
      { icon: '⚙️', name: 'Machinery', freq: '100–10000 Hz' },
      { icon: '🔊', name: 'Sonar / Noise', freq: '1–100 kHz' },
    ],
  },
];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function drawSpectrogram(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  playing: boolean,
) {
  ctx.fillStyle = '#081B2A';
  ctx.fillRect(0, 0, w, h);

  const cols = 180;
  const colW = w / cols;

  for (let i = 0; i < cols; i++) {
    const t = time * 2.5 + i * 0.08;
    const x = i * colW;

    for (let y = 0; y < h; y += 2) {
      const freq = 1 - y / h;
      const wave1 = Math.sin(t * 1.2 + i * 0.15) * 0.3 + 0.3;
      const wave2 = Math.sin(t * 0.7 + i * 0.22 + freq * 5) * 0.25 + 0.25;
      const wave3 = Math.sin(t * 2.1 + i * 0.08 + freq * 3) * 0.2 + 0.2;
      const noise = Math.random() * 0.15;

      const whale = freq < 0.15 ? Math.sin(t * 0.5 + i * 0.3) * 0.4 + 0.1 : 0;
      const dolphin = freq > 0.5 && freq < 0.8 ? Math.sin(t * 3 + i * 0.1) * 0.3 + 0.15 : 0;
      const ship = freq < 0.3 ? Math.sin(t * 0.3 + i * 0.05) * 0.25 + 0.1 : 0;
      const rain = freq > 0.4 ? Math.random() * 0.12 : 0;

      let intensity = (wave1 + wave2 + wave3 + noise + whale + dolphin + ship + rain) / 4.5;
      if (!playing) intensity *= 0.08;

      let r: number, g: number, b: number;
      if (freq > 0.6) {
        r = Math.floor(intensity * 79);
        g = Math.floor(intensity * 163);
        b = Math.floor(intensity * 220);
      } else if (freq > 0.3) {
        r = Math.floor(intensity * 62);
        g = Math.floor(intensity * 155);
        b = Math.floor(intensity * 118);
      } else {
        r = Math.floor(intensity * 199);
        g = Math.floor(intensity * 92);
        b = Math.floor(intensity * 92);
      }

      const alpha = Math.min(1, intensity * 1.2);
      if (alpha > 0.02) {
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(x, y, colW + 0.5, 2);
      }
    }
  }

  const scanX = ((time * 40) % w);
  if (playing) {
    ctx.strokeStyle = 'rgba(79,163,199,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scanX, 0);
    ctx.lineTo(scanX, h);
    ctx.stroke();
  }
}

export function OceanSoundscape({ option, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const playingRef = useRef(false);
  const elapsedRef = useRef(0);

  const animate = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const w = rect.width;
    const h = rect.height;

    if (playingRef.current) {
      elapsedRef.current += 1 / 60;
      if (elapsedRef.current >= TOTAL_SECONDS) {
        elapsedRef.current = 0;
        playingRef.current = false;
        setPlaying(false);
      }
      setElapsed(elapsedRef.current);
    }

    drawSpectrogram(ctx, w, h, ts / 1000, playingRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  const togglePlay = () => {
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);
  };

  const progress = (elapsed / TOTAL_SECONDS) * 100;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    elapsedRef.current = pct * TOTAL_SECONDS;
    setElapsed(elapsedRef.current);
  };

  return (
    <div className="menu-content-view">
      <div className="menu-content-header">
        <div className="menu-content-title">
          <span className="menu-content-icon">{option.icon}</span>
          <div>
            <div className="menu-content-label">{option.label}</div>
            <div className="menu-content-ctx">Explore the Deep · Acoustic Environment</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="os-live-badge"><span className="os-live-dot" /> LIVE</div>
          <button className="menu-content-back" onClick={onClose}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="menu-content-body">
        <div className="mc-section os-hero">
          <h4 className="mc-heading">Ocean Soundscape</h4>
          <p className="os-intro">
            The ocean is not acoustically silent. Its soundscape is a constantly changing mixture of
            biological, environmental, and human-generated sounds. Experience the complete
            underwater acoustic environment below.
          </p>
        </div>

        {/* Spectrogram */}
        <div className="mc-section" style={{ padding: 0 }}>
          <div className="os-spectrogram-wrap">
            <div className="os-spectrogram-label">
              <span>FREQUENCY</span>
              <span>SPECTROGRAM</span>
            </div>
            <div style={{ position: 'relative' }}>
              <canvas ref={canvasRef} className="os-spectrogram-canvas" />
              <div className="os-freq-axis">
                <span className="os-freq-label">200 kHz</span>
                <span className="os-freq-label">100 kHz</span>
                <span className="os-freq-label">10 kHz</span>
                <span className="os-freq-label">1 kHz</span>
                <span className="os-freq-label">100 Hz</span>
              </div>
            </div>
            <div className="os-time-axis">
              <span>TIME</span>
              <span>→</span>
            </div>
          </div>
        </div>

        {/* Player */}
        <div className="os-player">
          <button className={`os-play-btn${playing ? ' playing' : ''}`} onClick={togglePlay}>
            {playing ? '⏸' : '▶'}
          </button>
          <div className="os-progress-wrap">
            <div className="os-progress-bar" onClick={handleBarClick}>
              <div className="os-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="os-progress-times">
              <span>{formatTime(elapsed)}</span>
              <span>{formatTime(TOTAL_SECONDS)}</span>
            </div>
          </div>
          <span className="os-duration">{formatTime(TOTAL_SECONDS)}</span>
        </div>

        {/* Categories */}
        <div className="os-categories">
          {CATEGORIES.map(cat => (
            <div className="os-cat-card" key={cat.title}>
              <div className="os-cat-header">
                <span className="os-cat-icon">{cat.icon}</span>
                <span className="os-cat-title">{cat.title}</span>
              </div>
              <div className="os-cat-items">
                {cat.items.map(item => (
                  <div className="os-cat-item" key={item.name}>
                    <span className="os-cat-item-icon">{item.icon}</span>
                    <span className="os-cat-item-name">{item.name}</span>
                    <span className="os-cat-item-freq">{item.freq}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Note from sections */}
        {option.sections?.map((s, i) => (
          <div className="mc-section" key={i}>
            {s.heading && <h4 className="mc-heading">{s.heading}</h4>}
            {s.paragraph && <p className="mc-paragraph">{s.paragraph}</p>}
            {s.note && <div className="mc-note">{s.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
