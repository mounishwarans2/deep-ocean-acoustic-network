export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatDecimal(n: number, d: number = 1): string {
  return n.toFixed(d);
}

export function formatPercent(n: number): string {
  return n.toFixed(1) + '%';
}

export function formatdB(n: number): string {
  return n.toFixed(1) + ' dB';
}

export function formatLatency(n: number): string {
  return Math.round(n) + ' ms';
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return (meters / 1000).toFixed(0) + ' km';
  }
  return Math.round(meters) + ' m';
}

export function formatBytes(mb: number): string {
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
  return Math.round(mb) + ' MB';
}

export function formatWatts(w: number): string {
  return w.toFixed(1) + ' W';
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

export function statusColor(status: string): string {
  switch (status) {
    case 'NORMAL': case 'CONNECTED': case 'STABLE': case 'ACTIVE': return 'var(--accent-green)';
    case 'WARNING': case 'DEGRADED': return 'var(--accent-yellow)';
    case 'CRITICAL': case 'OFFLINE': case 'FAILED': return 'var(--accent-red)';
    default: return 'var(--text-muted)';
  }
}

export function deviceTypeColor(type: string): string {
  switch (type) {
    case 'DATA_CENTER': return '#e11d48';
    case 'SURFACE_RECEIVER': return '#60a5fa';
    case 'GATEWAY': return '#22c55e';
    case 'ACOUSTIC_RELAY': return '#3b82f6';
    case 'NAVIGATION_RELAY': return '#f59e0b';
    case 'SEAFLOOR_RELAY': return '#f97316';
    case 'HYDROPHONE': return '#06b6d4';
    case 'ENVIRONMENTAL_SENSOR': return '#a855f7';
    default: return 'var(--text-muted)';
  }
}

export function deviceSymbol(type: string): string {
  switch (type) {
    case 'DATA_CENTER': return '■';
    case 'SURFACE_RECEIVER': return '▽';
    case 'GATEWAY': return '◆';
    case 'ACOUSTIC_RELAY': return '●';
    case 'NAVIGATION_RELAY': return '△';
    case 'SEAFLOOR_RELAY': return '◇';
    case 'HYDROPHONE': return '○';
    case 'ENVIRONMENTAL_SENSOR': return '✦';
    default: return '●';
  }
}

export function deviceTypeLabel(type: string): string {
  switch (type) {
    case 'DATA_CENTER': return 'Data Center';
    case 'SURFACE_RECEIVER': return 'Surface Receiver';
    case 'GATEWAY': return 'Main Node';
    case 'ACOUSTIC_RELAY': return 'Sub-Node';
    case 'NAVIGATION_RELAY': return 'Sub-Node';
    case 'SEAFLOOR_RELAY': return 'Sub-Node';
    case 'HYDROPHONE': return 'Sensor';
    case 'ENVIRONMENTAL_SENSOR': return 'Sensor';
    default: return type;
  }
}
