import { useMemo } from 'react';
import type { UnderwaterDevice } from '../types';
import { deviceTypeColor, statusColor } from '../utils/format';
import './DepthProfile.css';

interface Props {
  devices: UnderwaterDevice[];
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
}

const MAX_DEPTH = 6000;
const DEPTH_MARKS = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function DepthProfile({ devices, selectedDeviceId, onSelectDevice }: Props) {
  const sortedDevices = useMemo(() =>
    [...devices]
      .filter(d => d.depth > 0)
      .sort((a, b) => a.depth - b.depth),
    [devices]
  );

  const devicePositions = useMemo(() => {
    const positions = new Map<string, { left: number }>();
    const depthGroups = new Map<number, UnderwaterDevice[]>();

    sortedDevices.forEach(d => {
      const existing = depthGroups.get(d.depth) || [];
      existing.push(d);
      depthGroups.set(d.depth, existing);
    });

    depthGroups.forEach((group, depth) => {
      if (group.length === 1) {
        const seed = depth;
        const left = 18 + seededRandom(seed) * 52;
        positions.set(group[0].id, { left });
      } else {
        const step = 60 / (group.length + 1);
        group.forEach((d, i) => {
          const baseLeft = 15 + step * (i + 1);
          const jitter = (seededRandom(depth + i * 100) - 0.5) * 8;
          positions.set(d.id, { left: Math.max(15, Math.min(75, baseLeft + jitter)) });
        });
      }
    });

    return positions;
  }, [sortedDevices]);

  const handleDeviceClick = (id: string) => {
    onSelectDevice(selectedDeviceId === id ? null : id);
  };

  return (
    <div className="depth-profile">
      <div className="dp-ocean">
        <div className="dp-surface" />

        <div className="dp-depth-scale">
          {DEPTH_MARKS.map(m => (
            <div
              key={m}
              className="dp-depth-mark"
              style={{ top: `${(m / MAX_DEPTH) * 100}%` }}
            >
              <span className="dp-depth-label">{m.toLocaleString()} m</span>
              <div className="dp-depth-tick" />
            </div>
          ))}
        </div>

        <div className="dp-devices">
          {sortedDevices.map(d => {
            const pos = devicePositions.get(d.id);
            if (!pos) return null;
            const topPercent = (d.depth / MAX_DEPTH) * 100;
            const color = deviceTypeColor(d.type);
            const isSelected = selectedDeviceId === d.id;
            const isLeftSide = pos.left < 45;

            return (
              <div
                key={d.id}
                className={`dp-node${isSelected ? ' selected' : ''}`}
                style={{ top: `${topPercent}%`, left: `${pos.left}%` }}
                onClick={() => handleDeviceClick(d.id)}
              >
                <div className="dp-node-dot" style={{ background: color }}>
                  <div className="dp-node-ping" style={{ borderColor: color }} />
                </div>
                <div className={`dp-node-label ${isLeftSide ? 'left' : 'right'}`}>
                  <div className="dp-node-name" style={{ color }}>{d.id}</div>
                  <div className="dp-node-depth">{d.depth.toLocaleString()} m</div>
                  <div className="dp-node-status" style={{ color: statusColor(d.status) }}>
                    {d.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="dp-seabed" />
      </div>
    </div>
  );
}
