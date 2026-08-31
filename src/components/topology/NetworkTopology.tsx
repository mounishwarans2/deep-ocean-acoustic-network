import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { UnderwaterDevice, NetworkLink } from '../../types';
import { deviceTypeColor, formatDistance } from '../../utils/format';
import { xyToLatLng } from '../../simulation/nodes';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  devices: UnderwaterDevice[];
  links: NetworkLink[];
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
  flowDirection?: 'UPLINK' | 'DOWNLINK';
}

function nodeRole(d: UnderwaterDevice): string {
  switch (d.type) {
    case 'DATA_CENTER': return 'Data Center / Terrestrial Hub';
    case 'SURFACE_RECEIVER': return 'Surface Gateway';
    case 'GATEWAY': return d.id === 'MN-02' ? 'Backup Main Node' : 'Primary Main Node';
    case 'ACOUSTIC_RELAY': return 'Acoustic Relay Node';
    case 'NAVIGATION_RELAY': return 'Navigation Relay Node';
    case 'SEAFLOOR_RELAY': return 'Seafloor Relay Node';
    case 'HYDROPHONE': return 'Hydrophone Sensor';
    case 'ENVIRONMENTAL_SENSOR': return 'Environmental Sensor';
    default: return d.type;
  }
}

function linkHierarchy(a: string, b: string): string {
  const s = new Set([a, b]);
  if (s.has('DATA_CENTER') && s.has('SURFACE_RECEIVER')) return 'terrestrial';
  if (s.has('SURFACE_RECEIVER') && s.has('GATEWAY')) return 'uplink';
  const isSub = (t: string) => t === 'ACOUSTIC_RELAY' || t === 'NAVIGATION_RELAY' || t === 'SEAFLOOR_RELAY';
  if (s.has('GATEWAY') && isSub(a)) return 'aggregation';
  if (isSub(a) && isSub(b)) return 'mesh';
  return 'star';
}

function nodeSize(type: string): number {
  switch (type) {
    case 'DATA_CENTER': return 28;
    case 'SURFACE_RECEIVER': return 26;
    case 'GATEWAY': return 28;
    case 'ACOUSTIC_RELAY': case 'NAVIGATION_RELAY': case 'SEAFLOOR_RELAY': return 20;
    default: return 18;
  }
}

function buildSvg(d: UnderwaterDevice, isSelected: boolean, isHovered: boolean, isRouteNode: boolean): string {
  const col = deviceTypeColor(d.type);
  const sz = nodeSize(d.type);
  const cx = sz;
  const cy = sz;
  const total = sz * 2 + 8;
  const parts: string[] = [];

  if (isSelected) {
    parts.push(
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (sz * 0.85) + '" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.9">' +
      '<animate attributeName="r" values="' + (sz * 0.75) + ';' + (sz * 0.95) + ';' + (sz * 0.75) + '" dur="2s" repeatCount="indefinite"/>' +
      '<animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>' +
      '</circle>'
    );
  } else if (isHovered) {
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (sz * 0.65) + '" fill="none" stroke="' + col + '" stroke-width="1.5" opacity="0.3"/>');
  } else if (isRouteNode) {
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (sz * 0.55) + '" fill="' + col + '" opacity="0.15"/>');
  }

  switch (d.type) {
    case 'DATA_CENTER':
      parts.push(
        '<rect x="' + (cx - 9) + '" y="' + (cy - 8) + '" width="18" height="16" rx="3" fill="rgba(15,25,45,0.92)" stroke="' + col + '" stroke-width="1.5"/>',
        '<polygon points="' + cx + ',' + (cy - 9) + ' ' + (cx - 10) + ',' + (cy - 3) + ' ' + (cx + 10) + ',' + (cy - 3) + '" fill="rgba(15,25,45,0.95)" stroke="' + col + '" stroke-width="1.2"/>',
        '<line x1="' + (cx - 5) + '" y1="' + (cy - 2) + '" x2="' + (cx + 5) + '" y2="' + (cy - 2) + '" stroke="' + col + '" stroke-width="0.8" opacity="0.6"/>',
        '<line x1="' + (cx - 5) + '" y1="' + (cy + 1) + '" x2="' + (cx + 5) + '" y2="' + (cy + 1) + '" stroke="' + col + '" stroke-width="0.8" opacity="0.5"/>',
        '<line x1="' + (cx - 5) + '" y1="' + (cy + 4) + '" x2="' + (cx + 5) + '" y2="' + (cy + 4) + '" stroke="' + col + '" stroke-width="0.8" opacity="0.4"/>',
        '<circle cx="' + (cx + 7) + '" cy="' + (cy - 6) + '" r="2" fill="#22c55e" opacity="' + (d.status === 'NORMAL' ? '1' : '0.5') + '"><animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/></circle>'
      );
      break;
    case 'SURFACE_RECEIVER':
      parts.push(
        '<rect x="' + (cx - 7) + '" y="' + (cy - 2) + '" width="14" height="10" rx="2" fill="rgba(15,25,45,0.92)" stroke="' + col + '" stroke-width="1.5"/>',
        '<line x1="' + cx + '" y1="' + (cy - 2) + '" x2="' + cx + '" y2="' + (cy - 10) + '" stroke="' + col + '" stroke-width="1.2"/>',
        '<path d="M' + (cx - 5) + ',' + (cy - 6) + ' Q' + cx + ',' + (cy - 14) + ' ' + (cx + 5) + ',' + (cy - 6) + '" fill="none" stroke="' + col + '" stroke-width="0.9" opacity="0.7"/>',
        '<path d="M' + (cx - 3) + ',' + (cy - 9) + ' Q' + cx + ',' + (cy - 12) + ' ' + (cx + 3) + ',' + (cy - 9) + '" fill="none" stroke="' + col + '" stroke-width="0.6" opacity="0.4"/>'
      );
      break;
    case 'GATEWAY':
      parts.push(
        '<polygon points="' + cx + ',' + (cy - 12) + ' ' + (cx - 10) + ',' + cy + ' ' + cx + ',' + (cy + 5) + ' ' + (cx + 10) + ',' + cy + '" fill="rgba(15,25,45,0.92)" stroke="' + col + '" stroke-width="1.8" stroke-linejoin="round"/>',
        '<circle cx="' + cx + '" cy="' + (cy - 2) + '" r="2.5" fill="' + col + '" opacity="0.6"/>',
        '<circle cx="' + cx + '" cy="' + (cy - 2) + '" r="5" fill="none" stroke="' + col + '" stroke-width="0.6" opacity="0.3"/>',
        '<circle cx="' + cx + '" cy="' + (cy - 2) + '" r="8" fill="none" stroke="' + col + '" stroke-width="0.4" opacity="0.15"/>'
      );
      break;
    case 'ACOUSTIC_RELAY': case 'NAVIGATION_RELAY': case 'SEAFLOOR_RELAY':
      parts.push(
        '<rect x="' + (cx - 10) + '" y="' + (cy - 7) + '" width="20" height="14" rx="3" fill="rgba(15,25,45,0.92)" stroke="' + col + '" stroke-width="1.2"/>',
        '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="' + col + '" opacity="0.5"/>'
      );
      break;
    case 'HYDROPHONE': case 'ENVIRONMENTAL_SENSOR':
      parts.push(
        '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="rgba(15,25,45,0.92)" stroke="' + col + '" stroke-width="1.2"/>',
        '<circle cx="' + cx + '" cy="' + cy + '" r="2.5" fill="' + col + '" opacity="0.5"/>'
      );
      break;
  }

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + total + '" height="' + total + '" viewBox="-4 -4 ' + total + ' ' + total + '">' + parts.join('') + '</svg>';
}



export function NetworkTopology({ devices, links, selectedDeviceId, onSelectDevice, flowDirection = 'UPLINK' }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const linksLayerRef = useRef<L.LayerGroup | null>(null);
  const particlesLayerRef = useRef<L.LayerGroup | null>(null);
  const labelsLayerRef = useRef<L.LayerGroup | null>(null);
  const particleAnimFramesRef = useRef<number[]>([]);
  const onSelectDeviceRef = useRef(onSelectDevice);
  useEffect(() => { onSelectDeviceRef.current = onSelectDevice; });

  const sel = selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) : null;

  const displayRoute = useMemo(() => {
    if (!sel || sel.type === 'DATA_CENTER' || sel.primaryRoute.length < 2) return sel?.primaryRoute || [];
    return flowDirection === 'DOWNLINK' ? [...sel.primaryRoute].reverse() : sel.primaryRoute;
  }, [sel, flowDirection]);

  const activeRouteNodes = useMemo(() => new Set(displayRoute), [displayRoute]);

  const activeRouteLinkKeys = useMemo(() => {
    const ls = new Set<string>();
    for (let i = 0; i < displayRoute.length - 1; i++) {
      ls.add([displayRoute[i], displayRoute[i + 1]].sort().join('-'));
    }
    return ls;
  }, [displayRoute]);

  const allRoutesLinkKeys = useMemo(() => {
    const ls = new Set<string>();
    devices.forEach(d => {
      if (!d.primaryRoute || d.primaryRoute.length < 2) return;
      for (let i = 0; i < d.primaryRoute.length - 1; i++) {
        ls.add([d.primaryRoute[i], d.primaryRoute[i + 1]].sort().join('-'));
      }
    });
    return ls;
  }, [devices]);

  const neighborLinks = useMemo(() => {
    if (!selectedDeviceId) return new Set<string>();
    const ls = new Set<string>();
    links.forEach(l => {
      if (l.sourceNode === selectedDeviceId || l.destinationNode === selectedDeviceId) ls.add(l.id);
    });
    return ls;
  }, [selectedDeviceId, links]);

  const devicePosMap = useMemo(() => {
    const m = new Map<string, L.LatLng>();
    devices.forEach(d => {
      const [lat, lng] = xyToLatLng(d.x, d.y);
      m.set(d.id, L.latLng(lat, lng));
    });
    return m;
  }, [devices]);

  const routeLabel = flowDirection === 'DOWNLINK' ? 'CONTROL DOWNLINK' : 'TELEMETRY UPLINK';
  const routeArrow = flowDirection === 'DOWNLINK' ? 'LAND \u2192 OCEAN' : 'OCEAN \u2192 LAND';

  const hovered = hoveredId ? devices.find(d => d.id === hoveredId) : null;

  const popupDeviceInfo = useMemo(() => {
    if (!sel) return null;

    const routeIndex = displayRoute.indexOf(sel.id);
    const nextHop = routeIndex >= 0 && routeIndex < displayRoute.length - 1 ? displayRoute[routeIndex + 1] : null;

    let distanceToNextHop = 0;
    let linkLatency = 0;
    let linkThroughput = 0;
    if (nextHop) {
      const linkKey = [sel.id, nextHop].sort().join('-');
      const matchingLink = links.find(l => {
        const lk = [l.sourceNode, l.destinationNode].sort().join('-');
        return lk === linkKey;
      });
      if (matchingLink) {
        distanceToNextHop = matchingLink.distanceMeters;
        linkLatency = matchingLink.latencyMs;
        linkThroughput = matchingLink.throughput;
      }
    }

    return {
      device: sel,
      nextHop,
      distanceToNextHop,
      linkLatency,
      linkThroughput,
      route: displayRoute,
    };
  }, [sel, displayRoute, links]);

  const updatePopupPosition = useCallback(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;
    const id = selectedDeviceId;
    if (!id) {
      setPopupPos(null);
      return;
    }
    const pos = devicePosMap.get(id);
    if (!pos) {
      setPopupPos(null);
      return;
    }
    const point = map.latLngToContainerPoint(pos);
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    let x = point.x + 20;
    let y = point.y - 10;

    const popupWidth = 300;
    const popupMaxHeight = 380;

    if (x + popupWidth > containerWidth - 10) {
      x = point.x - popupWidth - 20;
    }
    if (x < 10) x = 10;

    if (y + popupMaxHeight > containerHeight - 10) {
      y = containerHeight - popupMaxHeight - 10;
    }
    if (y < 10) y = 10;

    setPopupPos({ x, y });
  }, [selectedDeviceId, devicePosMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMoveZoom = () => updatePopupPosition();
    map.on('move', onMoveZoom);
    map.on('zoom', onMoveZoom);

    return () => {
      map.off('move', onMoveZoom);
      map.off('zoom', onMoveZoom);
    };
  }, [updatePopupPosition]);

  useEffect(() => {
    updatePopupPosition();
  }, [selectedDeviceId, devicePosMap, updatePopupPosition]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [12.5, 88],
      zoom: 5,
      minZoom: 3,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
      zoomAnimation: true,
      zoomAnimationThreshold: 4,
      fadeAnimation: true,
      wheelPxPerZoomLevel: 60,
      bounceAtZoomLimits: true,
    });

    map.on('click', () => {
      onSelectDeviceRef.current(null);
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    const linksLayer = L.layerGroup().addTo(map);
    const particlesLayer = L.layerGroup().addTo(map);
    const labelsLayer = L.layerGroup().addTo(map);

    linksLayerRef.current = linksLayer;
    particlesLayerRef.current = particlesLayer;
    labelsLayerRef.current = labelsLayer;
    mapRef.current = map;

    const markers = markersRef.current;

    const geoLabels: [number, number, string, string][] = [
      [12.5, 87, 'Bay of Bengal', 'rgba(255,255,255,0.35)'],
      [10, 94, 'Andaman Sea', 'rgba(255,255,255,0.3)'],
      [11.5, 93, 'Andaman and Nicobar Islands', 'rgba(255,255,255,0.28)'],
    ];
    geoLabels.forEach(([lat, lng, text, color]) => {
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'satellite-label',
          html: '<div style="color:' + color + ';font-size:10px;font-family:monospace;font-style:italic;text-shadow:0 1px 3px rgba(0,0,0,0.8);white-space:nowrap">' + text + '</div>',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
      }).addTo(labelsLayer);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
      linksLayerRef.current = null;
      particlesLayerRef.current = null;
      labelsLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const linksLayer = linksLayerRef.current;
    const particlesLayer = particlesLayerRef.current;
    const map = mapRef.current;
    if (!linksLayer || !particlesLayer || !map) return;

    linksLayer.clearLayers();
    particlesLayer.clearLayers();

    particleAnimFramesRef.current.forEach(id => cancelAnimationFrame(id));
    particleAnimFramesRef.current = [];

    links.forEach(l => {
      const sPos = devicePosMap.get(l.sourceNode);
      const dPos = devicePosMap.get(l.destinationNode);
      if (!sPos || !dPos) return;

      const key = [l.sourceNode, l.destinationNode].sort().join('-');
      const hier = linkHierarchy(l.sourceNode, l.destinationNode);
      const isSelectedRoute = activeRouteLinkKeys.has(key);
      const isAnyRoute = allRoutesLinkKeys.has(key);
      const isFailed = l.status === 'FAILED';
      const isNeighbor = neighborLinks.has(l.id);
      const isHidden = selectedDeviceId && !isSelectedRoute && !isNeighbor;

      let color = 'rgba(120,140,160,0.15)';
      let weight = 1.5;
      let dashArray: string | undefined;
      let opacity = isHidden ? 0.03 : 0.7;

      if (isSelectedRoute) {
        color = isFailed ? '#ef4444' : '#ffffff';
        weight = isFailed ? 2.5 : 3;
        opacity = 1;
      } else if (isAnyRoute) {
        color = isFailed ? '#ef4444' : '#ffffff';
        weight = isFailed ? 2 : 2.5;
        opacity = 0.9;
      } else if (isNeighbor) {
        color = 'rgba(255,255,255,0.5)';
        weight = 2;
      } else if (hier === 'terrestrial') {
        color = 'rgba(120,120,120,0.5)';
        weight = 2;
        dashArray = '8, 6';
      } else if (hier === 'uplink') {
        color = 'rgba(180,200,220,0.35)';
        weight = 2;
      } else if (hier === 'mesh') {
        color = 'rgba(200,200,200,0.12)';
        weight = 1;
        dashArray = '4, 6';
      } else {
        color = 'rgba(200,200,200,0.18)';
        weight = 1.5;
      }

      linksLayer.addLayer(L.polyline([sPos, dPos], {
        color, weight, opacity, dashArray,
        lineCap: 'round', lineJoin: 'round', interactive: false,
      }));

      if ((isSelectedRoute || isAnyRoute) && !isFailed) {
        linksLayer.addLayer(L.polyline([sPos, dPos], {
          color: 'rgba(255,255,255,0.2)',
          weight: weight + 4, opacity: 0.4,
          lineCap: 'round', interactive: false,
        }));
      }

      if ((isSelectedRoute || isAnyRoute) && isFailed) {
        const mid = L.latLng((sPos.lat + dPos.lat) / 2, (sPos.lng + dPos.lng) / 2);
        linksLayer.addLayer(L.marker(mid, {
          icon: L.divIcon({
            className: 'fail-icon',
            html: '<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="rgba(239,68,68,0.3)"/><line x1="4" y1="4" x2="12" y2="12" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="4" x2="4" y2="12" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>',
            iconSize: [16, 16], iconAnchor: [8, 8],
          }),
          interactive: false,
        }));
      }

      const showDistLabel = (isSelectedRoute || isAnyRoute || hier === 'uplink' || hier === 'terrestrial') && !isHidden;
      if (showDistLabel) {
        const mid = L.latLng((sPos.lat + dPos.lat) / 2, (sPos.lng + dPos.lng) / 2);
        linksLayer.addLayer(L.marker(mid, {
          icon: L.divIcon({
            className: 'route-label',
            html: '<div style="background:rgba(0,0,0,0.75);color:rgba(255,255,255,0.6);font-size:9px;font-family:monospace;padding:1px 4px;border-radius:2px;border:1px solid rgba(255,255,255,0.1);white-space:nowrap">' + formatDistance(l.distanceMeters) + '</div>',
            iconSize: [0, 0], iconAnchor: [0, 0],
          }),
          interactive: false,
        }));
      }
    });

    const allRoutePairs: { from: string; to: string }[] = [];
    if (selectedDeviceId) {
      for (let i = 0; i < displayRoute.length - 1; i++) {
        allRoutePairs.push({ from: displayRoute[i], to: displayRoute[i + 1] });
      }
    } else {
      const seenPairs = new Set<string>();
      devices.forEach(d => {
        if (!d.primaryRoute || d.primaryRoute.length < 2) return;
        for (let i = 0; i < d.primaryRoute.length - 1; i++) {
          const pairKey = [d.primaryRoute[i], d.primaryRoute[i + 1]].sort().join('-');
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            allRoutePairs.push({ from: d.primaryRoute[i], to: d.primaryRoute[i + 1] });
          }
        }
      });
    }

    allRoutePairs.forEach((rp, i) => {
      const sPos = devicePosMap.get(rp.from);
      const dPos = devicePosMap.get(rp.to);
      if (!sPos || !dPos) return;

      const dist = Math.sqrt((dPos.lng - sPos.lng) ** 2 + (dPos.lat - sPos.lat) ** 2);
      const dur = 2500 + dist * 8000;
      const delay = (i % 5) * 600;

      const bigIcon = L.divIcon({
        className: 'particle-marker',
        html: '<div style="width:8px;height:8px;border-radius:50%;background:#ffffff;box-shadow:0 0 6px #ffffff,0 0 12px #ffffff"></div>',
        iconSize: [8, 8], iconAnchor: [4, 4],
      });
      const bigMarker = L.marker(sPos, { icon: bigIcon, interactive: false }).addTo(particlesLayer);

      const smallIcon = L.divIcon({
        className: 'particle-marker-w',
        html: '<div style="width:4px;height:4px;border-radius:50%;background:#ffffff;opacity:0.7"></div>',
        iconSize: [4, 4], iconAnchor: [2, 2],
      });
      const smallMarker = L.marker(sPos, { icon: smallIcon, interactive: false }).addTo(particlesLayer);

      let animId: number | null = null;
      const startTime = performance.now() + delay;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        if (elapsed < 0) {
          bigMarker.setLatLng(sPos);
          smallMarker.setLatLng(sPos);
          animId = requestAnimationFrame(animate);
          return;
        }

        let progress = (elapsed % dur) / dur;
        if (progress > 1) progress = 1;

        const lat = sPos.lat + (dPos.lat - sPos.lat) * progress;
        const lng = sPos.lng + (dPos.lng - sPos.lng) * progress;
        const pos = L.latLng(lat, lng);

        bigMarker.setLatLng(pos);
        smallMarker.setLatLng(pos);

        animId = requestAnimationFrame(animate);
      };

      animId = requestAnimationFrame(animate);
      particleAnimFramesRef.current.push(animId);
    });
  }, [devices, links, activeRouteLinkKeys, allRoutesLinkKeys, neighborLinks, selectedDeviceId, flowDirection, devicePosMap, displayRoute]);

  useEffect(() => {
    const map = mapRef.current;
    const labelsLayer = labelsLayerRef.current;
    if (!map || !labelsLayer) return;

    markersRef.current.forEach((marker, id) => {
      if (!devices.find(d => d.id === id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    devices.forEach(d => {
      const pos = devicePosMap.get(d.id);
      if (!pos) return;

      const isSelected = selectedDeviceId === d.id;
      const isHovered = hoveredId === d.id;
      const isRouteNode = activeRouteNodes.has(d.id);

      const existing = markersRef.current.get(d.id);
      if (existing) map.removeLayer(existing);

      const sz = nodeSize(d.type);
      const marker = L.marker(pos, {
        icon: L.divIcon({
          className: 'device-node',
          html: buildSvg(d, isSelected, isHovered, isRouteNode),
          iconSize: [sz * 2 + 8, sz * 2 + 8],
          iconAnchor: [sz + 4, sz + 4],
        }),
      })
        .addTo(map)
        .on('click', () => onSelectDevice(selectedDeviceId === d.id ? null : d.id))
        .on('mouseover', () => setHoveredId(d.id))
        .on('mouseout', () => setHoveredId(null));

      markersRef.current.set(d.id, marker);
    });
  }, [devices, selectedDeviceId, hoveredId, activeRouteNodes, devicePosMap, onSelectDevice]);

  useEffect(() => {
    const labelsLayer = labelsLayerRef.current;
    if (!labelsLayer) return;
    labelsLayer.eachLayer(l => {
      if ((l as L.Marker).options?.icon?.options?.className === 'node-label') labelsLayer.removeLayer(l);
    });

    devices.forEach(d => {
      const pos = devicePosMap.get(d.id);
      if (!pos) return;
      const isSelected = selectedDeviceId === d.id;
      const isHovered = hoveredId === d.id;
      const sz = nodeSize(d.type);
      const col = isSelected || isHovered ? deviceTypeColor(d.type) : 'rgba(255,255,255,0.7)';
      labelsLayer.addLayer(L.marker(pos, {
        icon: L.divIcon({
          className: 'node-label',
          html: '<div style="color:' + col + ';font-size:10px;font-family:monospace;font-weight:600;text-shadow:0 0 3px rgba(0,0,0,0.9),0 1px 4px rgba(0,0,0,0.8);white-space:nowrap;text-align:center;transform:translateY(' + (sz + 10) + 'px)">' + d.id + '</div>',
          iconSize: [0, 0], iconAnchor: [0, 0],
        }),
        interactive: false,
      }));
    });
  }, [devices, selectedDeviceId, hoveredId, devicePosMap]);

  const popupData = popupDeviceInfo;
  const popupDevice = popupData?.device;
  const statusDotColor = popupDevice ? (popupDevice.status === 'NORMAL' ? '#22c55e' : popupDevice.status === 'WARNING' ? '#fbbf24' : '#ef4444') : '#fff';
  const statusLabel = popupDevice ? (popupDevice.status === 'NORMAL' ? 'Online' : popupDevice.status === 'WARNING' ? 'Warning' : popupDevice.status === 'CRITICAL' ? 'Critical' : 'Offline') : '';

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .leaflet-container { background: #091a2a !important; }
        .node-label, .route-label, .satellite-label, .fail-icon,
        .particle-marker, .particle-marker-w, .device-node {
          background: none !important; border: none !important;
        }
        .leaflet-control-zoom {
          background: rgba(0,0,0,0.6) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          border-radius: 4px !important;
        }
        .leaflet-control-zoom a {
          color: #94a3b8 !important;
          background: transparent !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          font-size: 14px !important;
          width: 28px !important;
          height: 28px !important;
          line-height: 28px !important;
        }
        .leaflet-control-zoom a:hover { color: #e2e8f0 !important; }
        .leaflet-control-zoom a:last-child { border-bottom: none !important; }
        .leaflet-control-scale {
          background: rgba(0,0,0,0.5) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 3px !important;
        }
        .leaflet-control-scale-line {
          color: rgba(255,255,255,0.5) !important;
          border-color: rgba(255,255,255,0.3) !important;
          background: transparent !important;
          font-size: 9px !important;
        }
      `}</style>
      {sel && sel.type !== 'DATA_CENTER' && displayRoute.length > 1 && (
        <div style={{ position: 'absolute', top: 6, left: 10, zIndex: 20, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, backdropFilter: 'blur(4px)' }}>
          <span style={{ fontWeight: 700, color: '#ffffff', letterSpacing: 0.5 }}>{routeLabel}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{routeArrow}</span>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{displayRoute.join(' \u2192 ')}</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: 480, borderRadius: 4, position: 'relative' }} />
      {popupPos && popupDevice && (
        <div style={{ position: 'absolute', left: popupPos.x, top: popupPos.y, zIndex: 40, background: 'rgba(6,14,22,0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: 0, color: '#fff', fontSize: 11, lineHeight: '16px', width: 290, maxHeight: 380, overflowY: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.6)', pointerEvents: 'auto' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => onSelectDevice(null)} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16, lineHeight: '16px', padding: '2px 4px', zIndex: 1 }}>&#10005;</button>
            <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: deviceTypeColor(popupDevice.type), fontWeight: 700, fontSize: 13 }}>{popupDevice.id}</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{popupDevice.name}</div>
            </div>
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Status</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusDotColor, display: 'inline-block' }} />
                  <span style={{ color: statusDotColor }}>{statusLabel}</span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Role</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{nodeRole(popupDevice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Depth</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{formatDistance(popupDevice.depth)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Battery</span>
                <span style={{ color: popupDevice.secondaryBattery > 50 ? '#22c55e' : popupDevice.secondaryBattery > 20 ? '#fbbf24' : '#ef4444' }}>{popupDevice.secondaryBattery}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Signal Quality</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{popupDevice.signalQuality}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Connected Nodes</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'right', maxWidth: 160 }}>{popupDevice.connectedNodes.length > 0 ? popupDevice.connectedNodes.join(', ') : 'None'}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6 }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>PRISM Route</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, wordBreak: 'break-all' }}>{popupData.route.length > 0 ? popupData.route.join(' \u2192 ') : 'No route'}</div>
              </div>
              {popupData.nextHop && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Next Hop</span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{popupData.nextHop}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Distance to Next Hop</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{formatDistance(popupData.distanceToNextHop)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Latency</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{popupData.linkLatency} ms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Throughput</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{popupData.linkThroughput} Mbps</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {hovered && !selectedDeviceId && (
        <div style={{ position: 'absolute', top: 40, right: 10, zIndex: 30, background: 'rgba(6,14,22,0.94)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4, padding: '6px 10px', color: '#cbd5e1', fontSize: 10, lineHeight: '15px', pointerEvents: 'none', minWidth: 130, backdropFilter: 'blur(6px)' }}>
          <div style={{ fontWeight: 700, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 3, marginBottom: 3 }}>
            <span style={{ color: deviceTypeColor(hovered.type), marginRight: 5 }}>{hovered.name}</span>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>{hovered.id}</span>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>
            Depth: {formatDistance(hovered.depth)}
            <span style={{ marginLeft: 6, color: hovered.status === 'NORMAL' ? '#22c55e' : hovered.status === 'WARNING' ? '#fbbf24' : '#ef4444' }}>{hovered.status}</span>
          </div>
          <div style={{ marginTop: 3, fontSize: 8, color: 'rgba(255,255,255,0.45)' }}>
            Click to inspect {'\u00b7'} Use flow toggle to view routes
          </div>
        </div>
      )}
    </div>
  );
}
