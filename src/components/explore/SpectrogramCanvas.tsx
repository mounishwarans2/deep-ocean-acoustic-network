import { useEffect, useRef, useState } from 'react';

export interface SignalStats {
  duration: number;
  sampleRate: number;
  channels: number;
  peak: number;
  peakDb: number;
  rms: number;
  dominantFreq: number;
}

interface Props {
  src: string;
  title: string;
  /** shared progress written by the player (no re-renders) */
  progressRef: { current: { t: number; d: number } };
  onSeek: (ratio: number) => void;
  onStats: (stats: SignalStats | null) => void;
}

const COLS = 180;
const N = 256;
const BINS = 128;

// dark-navy -> blue -> cyan -> white colormap
const STOPS: [number, [number, number, number]][] = [
  [0.0, [2, 10, 18]],
  [0.25, [10, 42, 74]],
  [0.55, [25, 118, 185]],
  [0.8, [56, 189, 248]],
  [1.0, [224, 242, 254]],
];

function colorFor(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t));
  for (let i = 1; i < STOPS.length; i++) {
    if (x <= STOPS[i][0]) {
      const [x0, c0] = STOPS[i - 1];
      const [x1, c1] = STOPS[i];
      const f = (x - x0) / (x1 - x0 || 1);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
      ];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

/**
 * Real spectrogram computed from the ACTUAL decoded audio file:
 * Hann-windowed DFT magnitudes per time column (frequency vs time).
 */
export function SpectrogramCanvas({ src, title, progressRef, onSeek, onStats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const readyRef = useRef(false);
  const lastDrawnRef = useRef(-1);
  const [ready, setReady] = useState(false);
  const onSeekRef = useRef(onSeek);
  const onStatsRef = useRef(onStats);
  useEffect(() => {
    onSeekRef.current = onSeek;
    onStatsRef.current = onStats;
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(src, { signal: controller.signal });
        const buf = await res.arrayBuffer();
        const tmp = new window.AudioContext();
        let decoded;
        try {
          decoded = await tmp.decodeAudioData(buf);
        } finally {
          void tmp.close().catch(() => {});
        }
        if (cancelled) return;

        const ch = decoded.getChannelData(0);
        const sr = decoded.sampleRate;

        // ---- signal stats from real samples ----
        let peak = 0;
        let sumSq = 0;
        const stride = Math.max(1, Math.floor(ch.length / 200000));
        let count = 0;
        for (let i = 0; i < ch.length; i += stride) {
          const v = ch[i];
          const a = Math.abs(v);
          if (a > peak) peak = a;
          sumSq += v * v;
          count++;
        }
        const rms = Math.sqrt(sumSq / Math.max(1, count));

        // ---- windowed DFT per column ----
        const hop = Math.max(1, Math.floor((ch.length - N) / COLS));
        const hann = new Float32Array(N);
        for (let n = 0; n < N; n++) hann[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
        const cosT = new Float32Array((BINS + 1) * N);
        const sinT = new Float32Array((BINS + 1) * N);
        for (let k = 0; k <= BINS; k++) {
          for (let n = 0; n < N; n++) {
            const a = (2 * Math.PI * k * n) / N;
            cosT[k * N + n] = Math.cos(a);
            sinT[k * N + n] = Math.sin(a);
          }
        }
        const grid = new Float32Array(COLS * BINS);
        const binMean = new Float64Array(BINS + 1);
        let globalMax = 0.0001;
        const frame = new Float32Array(N);
        for (let c = 0; c < COLS; c++) {
          const off = Math.min(c * hop, ch.length - N);
          for (let n = 0; n < N; n++) frame[n] = ch[off + n] * hann[n];
          for (let k = 1; k <= BINS; k++) {
            let re = 0;
            let im = 0;
            const base = k * N;
            for (let n = 0; n < N; n++) {
              const v = frame[n];
              re += v * cosT[base + n];
              im -= v * sinT[base + n];
            }
            const mag = Math.sqrt(re * re + im * im) / (N / 2);
            grid[c * BINS + (k - 1)] = mag;
            binMean[k] += mag;
            if (mag > globalMax) globalMax = mag;
          }
        }
        let domBin = 1;
        for (let k = 2; k <= BINS; k++) {
          if (binMean[k] > binMean[domBin]) domBin = k;
        }

        // ---- paint offscreen image (log scale, low freq at bottom) ----
        const off = document.createElement('canvas');
        off.width = COLS;
        off.height = BINS;
        const octx = off.getContext('2d');
        if (!octx) return;
        const img = octx.createImageData(COLS, BINS);
        const logMax = Math.log1p(globalMax);
        for (let c = 0; c < COLS; c++) {
          for (let b = 0; b < BINS; b++) {
            const t = Math.log1p(grid[c * BINS + b]) / logMax;
            const [r, g, bl] = colorFor(Math.pow(t, 0.7));
            const y = BINS - 1 - b; // flip: low frequencies at bottom
            const idx = (y * COLS + c) * 4;
            img.data[idx] = r;
            img.data[idx + 1] = g;
            img.data[idx + 2] = bl;
            img.data[idx + 3] = 255;
          }
        }
        octx.putImageData(img, 0, 0);
        if (cancelled) return;
        offRef.current = off;
        readyRef.current = true;
        lastDrawnRef.current = -1;
        setReady(true);
        onStatsRef.current({
          duration: decoded.duration,
          sampleRate: sr,
          channels: decoded.numberOfChannels,
          peak,
          peakDb: 20 * Math.log10(Math.max(peak, 1e-6)),
          rms,
          dominantFreq: (domBin * sr) / N,
        });
      } catch {
        if (!cancelled) onStatsRef.current(null);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [src]);

  // playhead overlay loop (early-out when progress unchanged)
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      const off = offRef.current;
      if (canvas && off && readyRef.current) {
        const { t, d } = progressRef.current;
        const p = d > 0 ? Math.min(1, Math.max(0, t / d)) : 0;
        if (Math.abs(p - lastDrawnRef.current) > 0.0015) {
          lastDrawnRef.current = p;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (w > 0 && h > 0) {
              if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
              }
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
              ctx.imageSmoothingEnabled = true;
              ctx.drawImage(off, 0, 0, w, h);
              const px = p * w;
              ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
              ctx.fillRect(px - 1, 0, 2, h);
            }
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <canvas
      ref={canvasRef}
      className="as-spec"
      onClick={e => {
        const canvas = canvasRef.current;
        if (!canvas || !ready) return;
        const rect = canvas.getBoundingClientRect();
        onSeekRef.current((e.clientX - rect.left) / rect.width);
      }}
      title={ready ? `Click to seek ${title}` : 'Computing spectrogram…'}
    />
  );
}
