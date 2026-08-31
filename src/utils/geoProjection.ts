import { feature } from 'topojson-client';
import countriesTopo from 'world-atlas/countries-110m.json';

export function projectLng(lng: number): number {
  return lng;
}

export function projectLat(lat: number): number {
  const clamped = Math.max(-85, Math.min(85, lat));
  return -Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360)) * (180 / Math.PI);
}

export function projectCoord(lng: number, lat: number): [number, number] {
  return [projectLng(lng), projectLat(lat)];
}

function coordsToPath(coords: [number, number][]): string {
  if (coords.length === 0) return '';
  let d = '';
  for (let i = 0; i < coords.length; i++) {
    const [x, y] = projectCoord(coords[i][0], coords[i][1]);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
  }
  return d + 'Z';
}

function geometryToPaths(geom: GeoJSON.MultiPolygon | GeoJSON.Polygon): string[] {
  const paths: string[] = [];
  if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        const p = coordsToPath(ring as [number, number][]);
        if (p) paths.push(p);
      }
    }
  } else if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) {
      const p = coordsToPath(ring as [number, number][]);
      if (p) paths.push(p);
    }
  }
  return paths;
}

export interface WorldMapData {
  landPaths: string[];
  countryPaths: { path: string; id: string }[];
  outlinePath: string;
}

function buildWorldMapData(): WorldMapData {
  const topo = countriesTopo as unknown as { type: string; objects: Record<string, unknown>; arcs: unknown[][]; transform?: { scale: [number, number]; translate: [number, number] } };
  const countriesFeature = feature(topo, topo.objects.countries) as GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon>;
  const landFeature = feature(topo, topo.objects.land) as GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon>;

  const countryPaths: { path: string; id: string }[] = [];
  for (const f of countriesFeature.features) {
    if (!f.geometry) continue;
    const paths = geometryToPaths(f.geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon);
    for (const p of paths) {
      countryPaths.push({ path: p, id: (f.properties as Record<string, string>)?.id ?? '' });
    }
  }

  const landPaths: string[] = [];
  if (landFeature.features[0]?.geometry) {
    const paths = geometryToPaths(landFeature.features[0].geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon);
    landPaths.push(...paths);
  }

  return { landPaths, countryPaths, outlinePath: '' };
}

let _cache: WorldMapData | null = null;

export function getWorldMapData(): WorldMapData {
  if (!_cache) _cache = buildWorldMapData();
  return _cache;
}

export const WORLD_BOUNDS = {
  minX: -180,
  maxX: 180,
  minY: projectLat(85),
  maxY: projectLat(-85),
};

export const DEPLOYMENT_CENTER_LNG = -31.46;
export const DEPLOYMENT_CENTER_LAT = 48.22;
export const DEPLOYMENT_CENTER_X = projectLng(DEPLOYMENT_CENTER_LNG);
export const DEPLOYMENT_CENTER_Y = projectLat(DEPLOYMENT_CENTER_LAT);
