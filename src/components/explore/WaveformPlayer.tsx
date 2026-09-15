import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import './WaveformPlayer.css';

interface Props {
  src: string;
  icon: string;
  title: string;
  meta: string;
  /** per-frame progress callback (time, duration) — parent should write to a ref, not setState */
  onTick?: (currentTime: number, duration: number) => void;
  onPlayingChange?: (playing: boolean) => void;
}

export interface WaveformPlayerHandle {
  seekTo: (ratio: number) => void;
}

const BAR_COUNT = 220;
const PLAYED_COLOR = '#38bdf8';
const REMAIN_COLOR = 'rgba(56, 189, 248, 0.22)';
const PLAYHEAD_COLOR = '#e0f2fe';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Reusable marine-audio player.
 * Waveform bars are computed from the ACTUAL decoded audio file
 * (Web Audio API decodeAudioData -> channel peaks), never random.
 */
export const WaveformPlayer = forwardRef<WaveformPlayerHandle, Props>(function WaveformPlayer(
  { src, icon, title, meta, onTick, onPlayingChange }: Props,
  ref,
) {
  const playerId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const peaksRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const energyRef = useRef(0);

  const [peaksReady, setPeaksReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);

  // ---- draw waveform -------------------------------------------------
  const draw = useCallback((progress: number, energy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const peaks = peaksRef.current;
    const midY = h / 2;
    const slot = w / BAR_COUNT;
    const barW = Math.max(1, Math.floor(slot * 0.55));
    const playedBars = Math.floor(progress * BAR_COUNT);

    for (let i = 0; i < BAR_COUNT; i++) {
      const peak = peaks.length > 0 ? peaks[i] : 0.08;
      // subtle live reaction: boost bars near the playhead while playing
      let boost = 0;
      if (energy > 0 && i >= playedBars - 6 && i <= playedBars + 6) {
        boost = energy * 0.35 * peak;
      }
      const amp = Math.min(1, peak + boost);
      const barH = Math.max(2, amp * (h - 8));
      const x = i * slot + (slot - barW) / 2;
      const y = midY - barH / 2;
      ctx.fillStyle = i < playedBars ? PLAYED_COLOR : REMAIN_COLOR;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, barW, barH, barW / 2);
      } else {
        ctx.rect(x, y, barW, barH);
      }
      ctx.fill();
    }

    // playhead
    const px = progress * w;
    ctx.fillStyle = PLAYHEAD_COLOR;
    ctx.fillRect(px - 1, 4, 2, h - 8);
  }, []);

  const renderStatic = useCallback(() => {
    const audio = audioRef.current;
    const d = audio?.duration ?? 0;
    const c = audio?.currentTime ?? 0;
    draw(d > 0 ? c / d : 0, 0);
  }, [draw]);

  // ---- live render loop (only while playing) --------------------------
  useEffect(() => {
    if (!playing) return;
    const loop = () => {
      const audio = audioRef.current;
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        setElapsed(audio.currentTime);
      }
      // live energy from analyser (0..1), decays when quiet
      const analyser = analyserRef.current;
      const freq = freqRef.current;
      if (analyser && freq) {
        analyser.getByteFrequencyData(freq);
        let sum = 0;
        for (let i = 0; i < freq.length; i++) sum += freq[i];
        const target = sum / (freq.length * 255);
        energyRef.current += (target - energyRef.current) * 0.35;
      }
      const a = audioRef.current;
      const p = a && a.duration > 0 ? a.currentTime / a.duration : 0;
      draw(p, energyRef.current);
      if (a && Number.isFinite(a.duration)) onTick?.(a.currentTime, a.duration);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, draw, onTick]);

  // ---- decode real peaks from the MP3 ----------------------------------
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(src, { signal: controller.signal });
        const buf = await res.arrayBuffer();
        const Ctx = window.AudioContext;
        const tmp = new Ctx();
        try {
          const decoded = await tmp.decodeAudioData(buf);
          if (cancelled) return;
          const ch = decoded.getChannelData(0);
          const block = Math.floor(ch.length / BAR_COUNT);
          const peaks: number[] = [];
          for (let i = 0; i < BAR_COUNT; i++) {
            let max = 0;
            const start = i * block;
            const step = Math.max(1, Math.floor(block / 40));
            for (let j = start; j < start + block && j < ch.length; j += step) {
              const v = Math.abs(ch[j]);
              if (v > max) max = v;
            }
            peaks.push(max);
          }
          const top = Math.max(...peaks, 0.001);
          peaksRef.current = peaks.map(p => Math.pow(p / top, 0.8));
          setPeaksReady(true);
        } finally {
          void tmp.close().catch(() => {});
        }
      } catch {
        if (!cancelled) {
          // fallback: gentle flat shape so UI still works
          peaksRef.current = Array.from({ length: BAR_COUNT }, (_, i) => {
            const t = i / BAR_COUNT;
            return 0.25 + 0.2 * Math.sin(t * Math.PI * 3) ** 2;
          });
          setPeaksReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [src]);

  // redraw when peaks arrive / on resize
  useEffect(() => {
    if (!peaksReady) return;
    renderStatic();
    const onResize = () => renderStatic();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [peaksReady, renderStatic]);

  // exclusive playback: pause when another waveform player starts
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== playerId) {
        audioRef.current?.pause();
      }
    };
    window.addEventListener('waveform-play', onOther);
    return () => window.removeEventListener('waveform-play', onOther);
  }, [playerId]);

  // lazy AudioContext + analyser wiring (created on user gesture only)
  const ensureGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioCtxRef.current) return;
    try {
      const Ctx = window.AudioContext;
      const actx = new Ctx();
      const source = actx.createMediaElementSource(audio);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyser.connect(actx.destination);
      audioCtxRef.current = actx;
      analyserRef.current = analyser;
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      // analyser is enhancement-only; plain playback still works
    }
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      ensureGraph();
      if (audioCtxRef.current?.state === 'suspended') {
        void audioCtxRef.current.resume().catch(() => {});
      }
      window.dispatchEvent(new CustomEvent('waveform-play', { detail: playerId }));
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [ensureGraph, playerId]);

  const seekTo = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) return;
    const r = Math.min(1, Math.max(0, ratio));
    audio.currentTime = r * audio.duration;
    setElapsed(audio.currentTime);
    onTick?.(audio.currentTime, audio.duration);
    renderStatic();
  }, [onTick, renderStatic]);

  useImperativeHandle(ref, () => ({ seekTo }), [seekTo]);

  const seek = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    seekTo((e.clientX - rect.left) / rect.width);
  }, [seekTo]);

  const onVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = v;
      audio.muted = v === 0 ? true : false;
    }
    setMuted(v === 0);
  }, []);

  const onMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    setMuted(next);
    audio.muted = next;
  }, [muted]);

  return (
    <div className="wp-card">
      <div className="wp-head">
        <span className="wp-icon">{icon}</span>
        <div>
          <div className="wp-title">{title}</div>
          <div className="wp-meta">{meta}</div>
        </div>
        {!peaksReady && <span className="wp-loading">loading waveform…</span>}
      </div>

      <canvas
        ref={canvasRef}
        className="wp-wave"
        onClick={seek}
        title={peaksReady ? 'Click to seek' : 'Loading waveform…'}
      />

      {/* hidden audio element: custom UI is the interface */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => {
          const a = audioRef.current;
          if (a && Number.isFinite(a.duration)) setDuration(a.duration);
        }}
        onPlay={() => {
          setPlaying(true);
          onPlayingChange?.(true);
        }}
        onPause={() => {
          setPlaying(false);
          onPlayingChange?.(false);
          energyRef.current = 0;
          renderStatic();
        }}
        onEnded={() => {
          setPlaying(false);
          onPlayingChange?.(false);
          energyRef.current = 0;
          const a = audioRef.current;
          if (a) {
            a.currentTime = 0;
            setElapsed(0);
            onTick?.(0, a.duration);
          }
          renderStatic();
        }}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a) {
            setElapsed(a.currentTime);
            onTick?.(a.currentTime, a.duration);
          }
        }}
      />

      <div className="wp-controls">
        <button
          type="button"
          className={`wp-play${playing ? ' is-playing' : ''}`}
          onClick={toggle}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <span className="wp-time">{formatTime(elapsed)}</span>
        <input
          type="range"
          className="wp-seek"
          min={0}
          max={Number.isFinite(duration) && duration > 0 ? duration : 0}
          step={0.1}
          value={Math.min(elapsed, duration || 0)}
          onChange={e => {
            const a = audioRef.current;
            const v = Number(e.target.value);
            if (a && Number.isFinite(a.duration)) {
              a.currentTime = v;
              setElapsed(v);
            }
          }}
          aria-label={`Seek ${title}`}
        />
        <span className="wp-time">{formatTime(duration)}</span>
        <button
          type="button"
          className="wp-mute"
          onClick={onMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted || volume === 0 ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          className="wp-vol"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={onVolume}
          aria-label={`${title} volume`}
        />
      </div>
    </div>
  );
});
