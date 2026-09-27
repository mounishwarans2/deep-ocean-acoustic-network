/** One measured level of a CTD cast. Null = not recorded at this level. */
export interface WodLevel {
  depthM: number;
  /** Pressure in dbar. Derived from depth (1 dbar ≈ 1 m) unless the source reports it. */
  pressureDbar: number;
  pressureDerived: boolean;
  temperatureC: number | null;
  salinityPsu: number | null;
  oxygenMlL: number | null;
}

/** A single CTD cast: one station occupation with depth-ordered levels. */
export interface WodCast {
  source: string;
  dataset: string;
  castId: string;
  cruise: string;
  ship: string;
  observationDate: string;
  latitude: number;
  longitude: number;
  levels: WodLevel[];
}

/** Normalized application-facing observation. */
export interface OceanObservation {
  source: string;
  dataset: string;
  castId: string;
  observationDate: string;
  latitude: number;
  longitude: number;
  depth: number;
  pressure: number | null;
  pressureDerived: boolean;
  temperature: number | null;
  salinity: number | null;
  oxygen: number | null;
}

/** Replaceable data-source abstraction (hardware or live API later). */
export interface OceanDataProvider {
  readonly name: string;
  getObservations(): WodLevel[];
  getLatestObservation(): OceanObservation | null;
  getProfile(): WodCast | null;
  getSensorValue(sensor: 'temperature' | 'pressure' | 'salinity' | 'oxygen'): number | null;
}
