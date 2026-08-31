import type { UnderwaterDevice, DeviceType, NetworkLink } from '../types';

interface DeviceDef {
  id: string;
  name: string;
  type: DeviceType;
  lat: number;
  lng: number;
  depth: number;
  x: number;
  y: number;
  connected: string[];
  freq: number;
  bw: number;
  onLand?: boolean;
}

export function xyToLatLng(x: number, y: number): [number, number] {
  const lng = 78 + (x / 100) * 20;
  const lat = 20 - (y / 100) * 15;
  return [lat, lng];
}

export function isOnLand(_x: number, _y: number): boolean {
  return false;
}

export function isPointInOcean(_x: number, _y: number): boolean {
  return true;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DEVICES: DeviceDef[] = [
  { id: 'DC-01', name: 'Terrestrial Data Center', type: 'DATA_CENTER', lat: 17.70, lng: 83.22, depth: 0, x: 26.1, y: 15.3, connected: ['SR-01'], freq: 0, bw: 0, onLand: true },
  { id: 'SR-01', name: 'Surface Receiver Alpha', type: 'SURFACE_RECEIVER', lat: 17.62, lng: 83.38, depth: 0, x: 26.9, y: 15.9, connected: ['DC-01', 'MN-01', 'MN-02'], freq: 15.0, bw: 6.0 },
  { id: 'MN-01', name: 'Main Underwater Node', type: 'GATEWAY', lat: 13.00, lng: 88.00, depth: 2000, x: 50.0, y: 46.7, connected: ['SR-01', 'MN-02', 'SUB-A', 'SUB-B', 'SUB-C', 'SUB-D'], freq: 15.0, bw: 6.0 },
  { id: 'MN-02', name: 'Backup Main Node', type: 'GATEWAY', lat: 16.00, lng: 84.50, depth: 1800, x: 32.5, y: 26.7, connected: ['SR-01', 'MN-01', 'SUB-A', 'SUB-B', 'SUB-C', 'SUB-D'], freq: 14.0, bw: 5.5 },
  { id: 'SUB-A', name: 'Sub-Node Alpha', type: 'ACOUSTIC_RELAY', lat: 15.00, lng: 85.00, depth: 2800, x: 35.0, y: 33.3, connected: ['MN-01', 'MN-02', 'SUB-B', 'SUB-C', 'SUB-D', 'S-01', 'S-02', 'S-03'], freq: 12.5, bw: 4.2 },
  { id: 'SUB-B', name: 'Sub-Node Beta', type: 'NAVIGATION_RELAY', lat: 15.00, lng: 93.00, depth: 2600, x: 75.0, y: 33.3, connected: ['MN-01', 'MN-02', 'SUB-A', 'SUB-C', 'SUB-D', 'S-04', 'S-05', 'S-06'], freq: 10.0, bw: 3.5 },
  { id: 'SUB-C', name: 'Sub-Node Gamma', type: 'SEAFLOOR_RELAY', lat: 9.50, lng: 85.00, depth: 4800, x: 35.0, y: 70.0, connected: ['MN-01', 'MN-02', 'SUB-A', 'SUB-B', 'SUB-D', 'S-07', 'S-08', 'S-09'], freq: 9.0, bw: 3.2 },
  { id: 'SUB-D', name: 'Sub-Node Delta', type: 'ACOUSTIC_RELAY', lat: 10.50, lng: 94.00, depth: 4600, x: 80.0, y: 63.3, connected: ['MN-01', 'MN-02', 'SUB-A', 'SUB-B', 'SUB-C', 'S-10', 'S-11', 'S-12'], freq: 12.5, bw: 4.2 },
  { id: 'S-01', name: 'Hydrophone Sensor 01', type: 'HYDROPHONE', lat: 16.20, lng: 84.20, depth: 2200, x: 31.0, y: 25.3, connected: ['SUB-A', 'S-02'], freq: 8.0, bw: 3.0 },
  { id: 'S-02', name: 'Environmental Sensor 02', type: 'ENVIRONMENTAL_SENSOR', lat: 14.30, lng: 84.00, depth: 3100, x: 30.0, y: 38.0, connected: ['SUB-A', 'S-01', 'S-03'], freq: 7.5, bw: 2.8 },
  { id: 'S-03', name: 'Hydrophone Sensor 03', type: 'HYDROPHONE', lat: 15.50, lng: 86.20, depth: 3500, x: 41.0, y: 30.0, connected: ['SUB-A', 'S-02'], freq: 8.0, bw: 3.0 },
  { id: 'S-04', name: 'Environmental Sensor 04', type: 'ENVIRONMENTAL_SENSOR', lat: 16.20, lng: 93.50, depth: 1800, x: 77.5, y: 25.3, connected: ['SUB-B', 'S-05'], freq: 7.5, bw: 2.8 },
  { id: 'S-05', name: 'Hydrophone Sensor 05', type: 'HYDROPHONE', lat: 14.20, lng: 93.80, depth: 2400, x: 79.0, y: 38.7, connected: ['SUB-B', 'S-04', 'S-06'], freq: 8.0, bw: 3.0 },
  { id: 'S-06', name: 'Environmental Sensor 06', type: 'ENVIRONMENTAL_SENSOR', lat: 14.80, lng: 92.00, depth: 3000, x: 70.0, y: 34.7, connected: ['SUB-B', 'S-05'], freq: 7.5, bw: 2.8 },
  { id: 'S-07', name: 'Hydrophone Sensor 07', type: 'HYDROPHONE', lat: 10.50, lng: 84.00, depth: 4200, x: 30.0, y: 63.3, connected: ['SUB-C', 'S-08'], freq: 8.0, bw: 3.0 },
  { id: 'S-08', name: 'Environmental Sensor 08', type: 'ENVIRONMENTAL_SENSOR', lat: 8.50, lng: 84.50, depth: 5000, x: 32.5, y: 76.7, connected: ['SUB-C', 'S-07', 'S-09'], freq: 7.5, bw: 2.8 },
  { id: 'S-09', name: 'Hydrophone Sensor 09', type: 'HYDROPHONE', lat: 9.80, lng: 86.50, depth: 4600, x: 42.5, y: 68.0, connected: ['SUB-C', 'S-08'], freq: 8.0, bw: 3.0 },
  { id: 'S-10', name: 'Environmental Sensor 10', type: 'ENVIRONMENTAL_SENSOR', lat: 11.50, lng: 94.50, depth: 4000, x: 82.5, y: 56.7, connected: ['SUB-D', 'S-11'], freq: 7.5, bw: 2.8 },
  { id: 'S-11', name: 'Hydrophone Sensor 11', type: 'HYDROPHONE', lat: 9.50, lng: 94.50, depth: 5200, x: 82.5, y: 70.0, connected: ['SUB-D', 'S-10', 'S-12'], freq: 8.0, bw: 3.0 },
  { id: 'S-12', name: 'Environmental Sensor 12', type: 'ENVIRONMENTAL_SENSOR', lat: 10.00, lng: 93.50, depth: 4400, x: 77.5, y: 66.7, connected: ['SUB-D', 'S-11'], freq: 7.5, bw: 2.8 },
];

const DATA_CENTER_ID = 'DC-01';
const SURFACE_ID = 'SR-01';

function buildDevice(def: DeviceDef): UnderwaterDevice {
  if (!def.onLand && isOnLand(def.x, def.y)) {
    throw new Error(`Device ${def.id} placed on land at (${def.x}, ${def.y})`);
  }
  const isDC = def.type === 'DATA_CENTER';
  const isSurface = def.type === 'SURFACE_RECEIVER';
  const isMain = def.type === 'GATEWAY';
  const isSub = def.type === 'ACOUSTIC_RELAY' || def.type === 'NAVIGATION_RELAY' || def.type === 'SEAFLOOR_RELAY';
  return {
    id: def.id,
    name: def.name,
    type: def.type,
    latitude: def.lat,
    longitude: def.lng,
    depth: def.depth,
    status: 'NORMAL',
    primaryBattery: isDC ? 100 : (isSurface || isMain) ? 100 : 97 + Math.random() * 3,
    secondaryBattery: isDC ? 100 : (isSurface || isMain) ? 100 : 84 + Math.random() * 12,
    powerLoad: isDC ? 15.0 : isSurface ? 3.0 + Math.random() * 0.5 : isMain ? 4.2 + Math.random() * 0.8 : isSub ? 2.5 + Math.random() * 1.0 : 1.2 + Math.random() * 0.8,
    temperature: isDC ? 22 : def.depth > 4000 ? 1.5 + Math.random() * 1.5 : def.depth > 2000 ? 2.5 + Math.random() * 2 : 4 + Math.random() * 2,
    pressure: isDC ? 0 : def.depth * 0.1,
    salinity: isDC ? 0 : 34.2 + Math.random() * 1.5,
    dissolvedOxygen: isDC ? 0 : 3.5 + Math.random() * 2.5,
    backgroundNoise: isDC ? 0 : 30 + Math.random() * 20,
    currentSpeed: isDC ? 0 : 0.1 + Math.random() * 0.8,
    waterDensity: isDC ? 0 : 1025 + Math.random() * 5,
    signalQuality: isDC ? 100 : 85 + Math.random() * 15,
    signalStrength: isDC ? 0 : -50 - Math.random() * 30,
    snr: isDC ? 0 : 15 + Math.random() * 25,
    frequency: def.freq,
    bandwidth: def.bw,
    propagationDelay: isDC ? 0 : 25 + Math.random() * 60,
    packetsSent: isDC ? 0 : Math.floor(8000 + Math.random() * 20000),
    packetsReceived: isDC ? 0 : 0,
    packetLoss: isDC ? 0 : 0.5 + Math.random() * 1.5,
    throughput: isDC ? 0 : 5 + Math.random() * 15,
    latency: isDC ? 0 : 100 + Math.random() * 150,
    arrivalRate: 0,
    serviceRate: 0,
    trafficIntensity: 0,
    averageDelay: 0,
    delayBound: 0,
    backlog: 0,
    bufferUtilization: 0,
    x: def.x,
    y: def.y,
    connectedNodes: def.connected,
    primaryRoute: [],
    alternateRoutes: [],
    energyState: 'NORMAL',
  };
}

function findShortestPath(
  sourceId: string,
  adj: Map<string, string[]>,
  excludeLinks?: Set<string>,
): string[] | null {
  if (sourceId === DATA_CENTER_ID) return [DATA_CENTER_ID];
  if (sourceId === SURFACE_ID) return [SURFACE_ID, DATA_CENTER_ID];
  const visited = new Set<string>();
  const queue: string[][] = [[sourceId]];
  visited.add(sourceId);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const neighbors = adj.get(current) || [];

    for (const nextId of neighbors) {
      const linkKey = [current, nextId].sort().join('-');
      if (excludeLinks && excludeLinks.has(linkKey)) continue;
      if (visited.has(nextId)) continue;
      visited.add(nextId);
      const newPath = [...path, nextId];
      if (nextId === DATA_CENTER_ID) return newPath;
      queue.push(newPath);
    }
  }
  return null;
}

function findAllPathsBounded(
  sourceId: string,
  adj: Map<string, string[]>,
  maxPaths: number,
): string[][] {
  if (sourceId === DATA_CENTER_ID) return [[DATA_CENTER_ID]];
  if (sourceId === SURFACE_ID) return [[SURFACE_ID, DATA_CENTER_ID]];
  const results: string[][] = [];
  const visited = new Set<string>();

  function dfs(current: string, path: string[]) {
    if (results.length >= maxPaths) return;
    if (current === DATA_CENTER_ID) {
      results.push([...path]);
      return;
    }
    const neighbors = adj.get(current) || [];
    for (const nextId of neighbors) {
      if (visited.has(nextId)) continue;
      visited.add(nextId);
      path.push(nextId);
      dfs(nextId, path);
      path.pop();
      visited.delete(nextId);
    }
  }

  visited.add(sourceId);
  dfs(sourceId, [sourceId]);
  return results;
}

function validateRoute(route: string[]): string[] {
  const seen = new Set<string>();
  const valid: string[] = [];
  for (const node of route) {
    if (seen.has(node)) break;
    seen.add(node);
    valid.push(node);
  }
  return valid;
}

function findPathFromDC(targetId: string, adj: Map<string, string[]>): string[] | null {
  if (targetId === DATA_CENTER_ID) return [DATA_CENTER_ID];
  const visited = new Set<string>();
  const queue: string[][] = [[DATA_CENTER_ID]];
  visited.add(DATA_CENTER_ID);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const neighbors = adj.get(current) || [];
    for (const nextId of neighbors) {
      if (visited.has(nextId)) continue;
      visited.add(nextId);
      const newPath = [...path, nextId];
      if (nextId === targetId) return newPath;
      queue.push(newPath);
    }
  }
  return null;
}

function computeRoutes(deviceId: string, adj: Map<string, string[]>): { primary: string[]; alternates: string[][] } {
  const primary = validateRoute(findShortestPath(deviceId, adj) || [deviceId]);
  const allPaths = findAllPathsBounded(deviceId, adj, 5).map(validateRoute);
  const alternates = allPaths.filter(p => {
    if (p.length !== primary.length) return true;
    return p.some((node, i) => node !== primary[i]);
  }).slice(0, 3);
  return { primary, alternates };
}

export function computeDownlinkRoute(deviceId: string, adj: Map<string, string[]>): string[] {
  if (deviceId === DATA_CENTER_ID) return [DATA_CENTER_ID];
  return validateRoute(findPathFromDC(deviceId, adj) || [DATA_CENTER_ID, deviceId]);
}

function buildAdjacency(devices: UnderwaterDevice[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  devices.forEach(d => adj.set(d.id, [...d.connectedNodes]));
  return adj;
}

export function generateDevices(): UnderwaterDevice[] {
  const deviceMap = new Map<string, UnderwaterDevice>();
  DEVICES.forEach(d => deviceMap.set(d.id, buildDevice(d)));

  const devices = Array.from(deviceMap.values());
  const adj = buildAdjacency(devices);

  devices.forEach(d => {
    if (d.type === 'DATA_CENTER') return;
    const { primary, alternates } = computeRoutes(d.id, adj);
    d.primaryRoute = primary;
    d.alternateRoutes = alternates;
    d.packetsReceived = Math.floor(d.packetsSent * (1 - d.packetLoss / 100));
    d.arrivalRate = d.throughput;
    computeSNCForDevice(d);
  });

  const dc = deviceMap.get(DATA_CENTER_ID);
  if (dc) {
    dc.primaryRoute = [DATA_CENTER_ID];
    dc.alternateRoutes = [];
    dc.packetsReceived = devices.reduce((s, d) => s + d.packetsSent, 0);
    dc.throughput = devices.reduce((s, d) => s + d.throughput, 0);
    dc.packetsSent = 0;
    dc.packetLoss = 0;
    dc.latency = 0;
  }

  return devices;
}

export function generateLinks(devices: UnderwaterDevice[]): NetworkLink[] {
  const links: NetworkLink[] = [];
  const seen = new Set<string>();

  devices.forEach(device => {
    device.connectedNodes.forEach(targetId => {
      const key = [device.id, targetId].sort().join('-');
      if (seen.has(key)) return;
      seen.add(key);

      const target = devices.find(d => d.id === targetId);
      if (!target) return;

      const distKm = haversineDistance(device.latitude, device.longitude, target.latitude, target.longitude);
      const distMeters = Math.round(distKm * 1000);

      const isDataLink = device.type === 'DATA_CENTER' || target.type === 'DATA_CENTER';
      const isSurfaceLink = device.type === 'SURFACE_RECEIVER' || target.type === 'SURFACE_RECEIVER';

      links.push({
        id: key,
        sourceNode: device.id,
        destinationNode: targetId,
        distanceMeters: distMeters,
        signalStrength: isDataLink ? 0 : isSurfaceLink ? -30 - Math.random() * 10 : -50 - Math.random() * 30,
        signalQuality: isDataLink ? 100 : isSurfaceLink ? 95 + Math.random() * 5 : 80 + Math.random() * 20,
        latencyMs: isDataLink ? 5 : isSurfaceLink ? 15 + Math.random() * 10 : Math.round(50 + distKm * 0.5 + Math.random() * 30),
        packetLoss: isDataLink ? 0 : isSurfaceLink ? 0.1 : Math.round((0.2 + Math.random() * 2) * 100) / 100,
        throughput: isDataLink ? 50 : isSurfaceLink ? 40 : Math.round((5 + Math.random() * 15) * 10) / 10,
        status: 'ACTIVE',
      });
    });
  });

  return links;
}

export function recomputeAllRoutes(
  devices: UnderwaterDevice[],
  links: NetworkLink[],
): { routesChanged: { nodeId: string; oldRoute: string[]; newRoute: string[] }[] } {
  const adj = new Map<string, string[]>();
  devices.forEach(d => adj.set(d.id, [...d.connectedNodes]));

  const failedLinks = new Set(
    links.filter(l => l.status === 'FAILED').map(l => [l.sourceNode, l.destinationNode].sort().join('-'))
  );

  const routesChanged: { nodeId: string; oldRoute: string[]; newRoute: string[] }[] = [];

  devices.forEach(d => {
    if (d.type === 'DATA_CENTER' || d.type === 'SURFACE_RECEIVER' || d.type === 'GATEWAY') return;
    const oldRoute = [...d.primaryRoute];
    const { primary, alternates } = computeRoutes(d.id, adj);
    d.primaryRoute = primary;
    d.alternateRoutes = alternates;

    if (failedLinks.size > 0) {
      const blockedPrimary = oldRoute.slice(0, -1).some((_node, i) => {
        if (i >= oldRoute.length - 1) return false;
        const linkKey = [oldRoute[i], oldRoute[i + 1]].sort().join('-');
        return failedLinks.has(linkKey);
      });

      if (blockedPrimary && JSON.stringify(oldRoute) !== JSON.stringify(primary)) {
        routesChanged.push({ nodeId: d.id, oldRoute, newRoute: primary });
      }
    }
  });

  return { routesChanged };
}

function computeSNCForDevice(device: UnderwaterDevice): void {
  const arr = device.throughput;
  const svc = arr * 1.3 + Math.random() * 0.5;
  device.arrivalRate = Math.round(arr * 10) / 10;
  device.serviceRate = Math.round(svc * 10) / 10;
  device.trafficIntensity = Math.round((arr / svc) * 100) / 100;
  device.averageDelay = Math.round(device.latency * 10) / 10;
  device.delayBound = Math.round(device.averageDelay * 1.7 * 10) / 10;
  device.backlog = Math.floor(device.packetsSent * device.packetLoss / 100 * 0.3);
  device.bufferUtilization = Math.min(95, Math.round(device.trafficIntensity * 100 * 0.9));
}

export function findAvailableRoutes(
  sourceId: string,
  devices: UnderwaterDevice[]
): { path: string[]; score: number; latency: number; reliability: number; energyCost: number }[] {
  const device = devices.find(d => d.id === sourceId);
  if (!device || device.type === 'DATA_CENTER' || device.type === 'SURFACE_RECEIVER' || device.type === 'GATEWAY') return [];

  const routes: { path: string[]; score: number; latency: number; reliability: number; energyCost: number }[] = [];

  const allPaths = [device.primaryRoute, ...device.alternateRoutes];
  allPaths.forEach(path => {
    if (path.length < 2) return;
    routes.push(makeRoute(path, 80 + Math.random() * 20));
  });

  if (routes.length === 0 && device.connectedNodes.length > 0) {
    routes.push(makeRoute([sourceId, device.connectedNodes[0], 'MN-01', SURFACE_ID, DATA_CENTER_ID], 70 + Math.random() * 20));
  }

  return routes;
}

function makeRoute(path: string[], baseScore: number) {
  return {
    path,
    score: Math.min(99, Math.round(baseScore * 10) / 10),
    latency: Math.round((20 + path.length * 30 + Math.random() * 20) * 10) / 10,
    reliability: Math.round((85 + Math.random() * 15) * 10) / 10,
    energyCost: Math.round((path.length * 1.2 + Math.random() * 2) * 10) / 10,
  };
}
