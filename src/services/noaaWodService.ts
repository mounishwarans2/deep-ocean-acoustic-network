import { useMemo } from 'react';
import rawCsv from '../data/noaa/wod-calcofi-ctd.csv?raw';
import type { OceanDataProvider, OceanObservation, WodCast, WodLevel } from '../types/oceanData';

const SOURCE = 'NOAA / NCEI World Ocean Database';
const DATASET = 'WOD CTD observations (CalCOFI cruise 201407)';
const SOURCE_URL = 'https://oceanview.pfeg.noaa.gov/erddap/tabledap/erdCalCOFINOAAhydros';

function toNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const t = raw.trim();
  if (t === '' || t.toLowerCase() === 'nan') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Parse the bundled ERDDAP CSV (data row + units row + value rows). Returns null when unusable. */
export function parseWodCsv(csv: string): WodCast | null {
  const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 3) return null;
  const header = lines[0].split(',').map(h => h.trim());
  const idx = (name: string): number => header.indexOf(name);
  const iTime = idx('time');
  const iLat = idx('latitude');
  const iLon = idx('longitude');
  const iLine = idx('line');
  const iStation = idx('station');
  const iCruise = idx('cruise');
  const iShip = idx('ship');
  const iDepth = idx('ctd_depth');
  const iTemp = idx('temperature');
  const iSal = idx('salinity');
  const iOxy = idx('oxygen');
  if ([iTime, iLat, iLon, iDepth, iTemp, iSal, iOxy].some(i => i < 0)) return null;

  // Row 2 is the ERDDAP units row — data starts at row 3.
  const levels: WodLevel[] = [];
  let time = '';
  let lat = NaN;
  let lon = NaN;
  let line = '';
  let station = '';
  let cruise = '';
  let ship = '';
  for (const lineText of lines.slice(2)) {
    const c = lineText.split(',');
    const depth = toNumber(c[iDepth]);
    if (depth === null) continue;
    if (!time) {
      time = (c[iTime] ?? '').trim();
      lat = toNumber(c[iLat]) ?? NaN;
      lon = toNumber(c[iLon]) ?? NaN;
      line = (c[iLine] ?? '').trim();
      station = (c[iStation] ?? '').trim();
      cruise = (c[iCruise] ?? '').trim();
      ship = (c[iShip] ?? '').trim();
    }
    levels.push({
      depthM: depth,
      pressureDbar: depth,
      pressureDerived: true,
      temperatureC: toNumber(c[iTemp]),
      salinityPsu: toNumber(c[iSal]),
      oxygenMlL: toNumber(c[iOxy]),
    });
  }
  if (!time || levels.length === 0 || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  levels.sort((a, b) => a.depthM - b.depthM);
  return {
    source: SOURCE,
    dataset: DATASET,
    castId: `${cruise}/L${line}/S${station}`,
    cruise,
    ship,
    observationDate: time,
    latitude: lat,
    longitude: lon,
    levels,
  };
}

/** Convert one cast level into the application's sensor format. Values come only from the record. */
export function normalizeWodObservation(cast: WodCast, levelIndex: number): OceanObservation | null {
  const level = cast.levels[levelIndex];
  if (!level) return null;
  return {
    source: cast.source,
    dataset: cast.dataset,
    castId: cast.castId,
    observationDate: cast.observationDate,
    latitude: cast.latitude,
    longitude: cast.longitude,
    depth: level.depthM,
    pressure: level.pressureDbar,
    pressureDerived: level.pressureDerived,
    temperature: level.temperatureC,
    salinity: level.salinityPsu,
    oxygen: level.oxygenMlL,
  };
}

export class NOAAWodProvider implements OceanDataProvider {
  readonly name = 'NOAAWodProvider';
  private cast: WodCast | null;

  constructor(csv: string = rawCsv) {
    this.cast = parseWodCsv(csv);
  }

  getObservations(): WodLevel[] {
    return this.cast ? [...this.cast.levels] : [];
  }

  getLatestObservation(): OceanObservation | null {
    if (!this.cast) return null;
    return normalizeWodObservation(this.cast, 0);
  }

  getProfile(): WodCast | null {
    return this.cast;
  }

  getSensorValue(sensor: 'temperature' | 'pressure' | 'salinity' | 'oxygen'): number | null {
    const latest = this.getLatestObservation();
    if (!latest) return null;
    switch (sensor) {
      case 'temperature': return latest.temperature;
      case 'pressure': return latest.pressure;
      case 'salinity': return latest.salinity;
      case 'oxygen': return latest.oxygen;
    }
  }
}

export function getSourceUrl(): string {
  return SOURCE_URL;
}

let cached: NOAAWodProvider | null = null;

function getSharedProvider(): NOAAWodProvider {
  if (!cached) cached = new NOAAWodProvider();
  return cached;
}

/** Shared provider instance (parsed once, cached in memory). */
export function useNoaaWod(): NOAAWodProvider {
  return useMemo(() => getSharedProvider(), []);
}
