import { useEffect, useRef } from 'react';
import './MeshBackground.css';

interface MeshBackgroundProps {
  className?: string;
  /** Nodes per square pixel target — higher means denser mesh. */
  density?: number;
}

interface MeshNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
}

interface ClusterNode extends MeshNode {
  /** 1 at birth, decays to 0 — newborn highlight that settles into the mesh. */
  energy: number;
}

const LINK_DIST = 130;
const MOUSE_RADIUS = 170;
// Local network growth tuning: small, capped, strictly localized.
const SPAWN_PER_CLICK = 5;
const SPAWN_SPREAD = 58;
const CLUSTER_LINK_DIST = 95;
const LOCAL_DENSITY_CAP = 14;
const LOCAL_DENSITY_RADIUS = 90;
const CLUSTER_NODE_CAP = 90;
const NEWBORN_MS = 1200;

function makeNodes(w: number, h: number, density: number): MeshNode[] {
  const count = Math.max(60, Math.min(220, Math.round(((w * h) / 9000) * density)));
  const nodes: MeshNode[] = [];
  for (let i = 0; i < count; i++) {
    const speed = 6 + Math.random() * 12; // px per second — slow drift
    const angle = Math.random() * Math.PI * 2;
    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 1 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return nodes;
}

/**
 * Interactive deep-ocean network mesh rendered on canvas.
 * Slow-drifting nodes, distance-based links, cursor brightening and
 * click pulses. Pointer-events are disabled on the canvas itself —
 * cursor position is tracked on window so underlying UI stays clickable.
 */
export function MeshBackground({ className = '', density = 1 }: MeshBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let nodes: MeshNode[] = [];
    // User-grown local clusters: stable positions, persistent links.
    let clusters: ClusterNode[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = makeNodes(w, h, density);
      // keep existing clusters, clamped into the new viewport
      clusters = clusters
        .filter(c => c.x > -40 && c.x < w + 40 && c.y > -40 && c.y < h + 40)
        .slice(-CLUSTER_NODE_CAP);
      canvas.dataset.clusters = String(clusters.length);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };

    // Grow a small localized network cluster around a click. Repeated clicks
    // in the same area densify it up to a cap — positions never move afterward.
    const spawnCluster = (x: number, y: number) => {
      const all: MeshNode[] = nodes;
      let local = 0;
      const r2 = LOCAL_DENSITY_RADIUS * LOCAL_DENSITY_RADIUS;
      for (const n of all) {
        const dx = n.x - x;
        const dy = n.y - y;
        if (dx * dx + dy * dy < r2) local++;
      }
      for (const c of clusters) {
        const dx = c.x - x;
        const dy = c.y - y;
        if (dx * dx + dy * dy < r2) local++;
      }
      // approach the local maximum instead of overshooting it
      const room = Math.max(0, Math.min(SPAWN_PER_CLICK, LOCAL_DENSITY_CAP - local));
      const space = CLUSTER_NODE_CAP - clusters.length;
      const count = Math.min(room, space, SPAWN_PER_CLICK);
      for (let i = 0; i < count; i++) {
        // gaussian-ish spread around the click point
        const gx = (Math.random() + Math.random() - 1) * SPAWN_SPREAD;
        const gy = (Math.random() + Math.random() - 1) * SPAWN_SPREAD;
        clusters.push({
          x: Math.min(w - 4, Math.max(4, x + gx)),
          y: Math.min(h - 4, Math.max(4, y + gy)),
          vx: 0,
          vy: 0,
          r: 1 + Math.random() * 1.3,
          phase: Math.random() * Math.PI * 2,
          energy: 1,
        });
      }
      if (clusters.length > CLUSTER_NODE_CAP) {
        clusters.splice(0, clusters.length - CLUSTER_NODE_CAP);
      }
      canvas.dataset.clusters = String(clusters.length);
    };

    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      spawnCluster(x, y);
    };

    const draw = (now: number) => {
      if (!running) return;
      const dt = 1 / 60;

      // transparent canvas: the ocean image + overlay show through.
      // only a faint translucent depth tint keeps the mesh readable.
      ctx.clearRect(0, 0, w, h);
      const tint = ctx.createLinearGradient(0, 0, 0, h);
      tint.addColorStop(0, 'rgba(8, 28, 52, 0.18)');
      tint.addColorStop(0.55, 'rgba(5, 16, 30, 0.30)');
      tint.addColorStop(1, 'rgba(3, 10, 20, 0.42)');
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, w, h);

      // faint radial light from the top-center, like filtered surface light
      const glow = ctx.createRadialGradient(w / 2, -h * 0.25, 0, w / 2, -h * 0.25, h * 0.9);
      glow.addColorStop(0, 'rgba(56, 150, 200, 0.07)');
      glow.addColorStop(1, 'rgba(56, 150, 200, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // advance base nodes with gentle drift + wrap at edges
      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }
      // cluster nodes: essentially stable, barely breathing into the mesh
      for (const c of clusters) {
        c.x += Math.sin(now / 2400 + c.phase) * dt * 1.5;
        c.y += Math.cos(now / 2600 + c.phase) * dt * 1.5;
        c.energy = Math.max(0, c.energy - dt / (NEWBORN_MS / 1000));
      }

      const mx = mouse.active ? mouse.x : -9999;
      const my = mouse.active ? mouse.y : -9999;

      // links between nearby nodes (base mesh + user clusters in one pass)
      ctx.lineWidth = 1;
      const renderClusterLinks = (ax: number, ay: number, bx: number, by: number, isCluster: boolean): void => {
        const dx = ax - bx;
        const dy = ay - by;
        const range = isCluster ? CLUSTER_LINK_DIST : LINK_DIST;
        const d2 = dx * dx + dy * dy;
        if (d2 > range * range) return;
        const d = Math.sqrt(d2);
        const base = (1 - d / range) * (isCluster ? 0.42 : 0.34);

        // local brightening near the cursor (weaker than click growth)
        let boost = 0;
        if (mouse.active) {
          const cx = (ax + bx) / 2 - mx;
          const cy = (ay + by) / 2 - my;
          const cd = Math.sqrt(cx * cx + cy * cy);
          if (cd < MOUSE_RADIUS) boost += (1 - cd / MOUSE_RADIUS) * 0.35;
        }

        const alpha = Math.min(0.9, base + boost);
        if (alpha <= 0.02) return;
        const bright = boost > 0.02;
        ctx.strokeStyle = bright
          ? `rgba(140, 220, 255, ${alpha.toFixed(3)})`
          : `rgba(90, 170, 220, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      };

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          renderClusterLinks(a.x, a.y, nodes[j].x, nodes[j].y, false);
        }
        for (const c of clusters) {
          renderClusterLinks(a.x, a.y, c.x, c.y, true);
        }
      }
      for (let i = 0; i < clusters.length; i++) {
        const a = clusters[i];
        for (let j = i + 1; j < clusters.length; j++) {
          renderClusterLinks(a.x, a.y, clusters[j].x, clusters[j].y, true);
        }
      }

      // nodes with glow, brighter near the cursor
      const renderNode = (n: MeshNode, newborn: number): void => {
        let glowBoost = newborn * 0.9;
        if (mouse.active) {
          const dx = n.x - mx;
          const dy = n.y - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MOUSE_RADIUS) glowBoost += (1 - d / MOUSE_RADIUS) * 0.5;
        }
        const twinkle = 0.55 + 0.25 * Math.sin(now / 900 + n.phase);
        const alpha = Math.min(1, twinkle + glowBoost);
        const radius = n.r + Math.min(1.4, glowBoost * 1.6);
        if (glowBoost > 0.05) {
          ctx.fillStyle = `rgba(120, 210, 255, ${(alpha * 0.22).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(160, 225, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fill();
      };
      for (const n of nodes) renderNode(n, 0);
      for (const c of clusters) renderNode(c, c.energy);

      raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    if (reduced) {
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // density is a mount-time setting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={`mesh-bg${className ? ` ${className}` : ''}`} aria-hidden="true" />;
}
