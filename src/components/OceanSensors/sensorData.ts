import type { SimulationState } from '../../hooks/useSimulation';
import type { WodCast } from '../../types/oceanData';

export type SensorStatus = 'ACTIVE' | 'WARNING' | 'OFFLINE';
export type DataSource = 'live' | 'model';

export interface SensorLiveReading {
  value: string;
  detail?: string;
}

/** Static definition for one of the 9 sensing systems. */
export interface SensorDefinition {
  id: string;
  name: string;
  category: string;
  icon: string;
  /** Location on Prototype — modular wording grounded in the prototype cutaway modules. */
  location: string;
  measurement: string;
  unit: string;
  purpose: string;
  oceanPurpose: string;
  systemUse: string;
  /** Resolve the current reading. Return null when this sensor has no live telemetry. */
  liveReading: (ref: LiveRef) => SensorLiveReading | null;
  /** Model fallback shown when liveReading returns null — always labelled MODEL DATA. */
  modelReading: SensorLiveReading;
  trend?: 'battery' | 'signal';
}

export interface LiveRef {
  state: SimulationState;
  /** Reference node (main underwater node) — undefined when absent. */
  node?: SimulationState['devices'][number];
  recoveryActive: boolean;
}

function fmt(n: number, digits = 1): string {
  return Number.isFinite(n) ? n.toFixed(digits) : '—';
}

export const SENSORS: SensorDefinition[] = [
  {
    id: 'temperature',
    name: 'Temperature Sensor',
    category: 'Environmental',
    icon: '🌡',
    location: 'Environmental sensing module — external water-contact section',
    measurement: 'Water temperature',
    unit: '°C',
    purpose: 'Measures surrounding seawater temperature.',
    oceanPurpose: 'Temperature changes the physical properties of seawater and is relevant to underwater acoustic communication conditions.',
    systemUse: 'Feed temperature telemetry into the digital twin and environmental/acoustic analysis.',
    liveReading: ({ node }) => (node ? { value: `${fmt(node.temperature)} °C` } : null),
    modelReading: { value: '4.2 °C' },
  },
  {
    id: 'pressure-depth',
    name: 'Pressure / Depth Sensor',
    category: 'Environmental',
    icon: '🌊',
    location: 'Pressure sensing interface — titanium-alloy pressure housing penetration',
    measurement: 'Water pressure and derived depth',
    unit: 'bar / m',
    purpose: 'Determines how deep the node is operating.',
    oceanPurpose: 'Deep-ocean pressure is critical for monitoring the operating environment of the prototype.',
    systemUse: 'Depth profile, node position, environmental monitoring and safety/recovery logic.',
    liveReading: ({ node }) => (node ? { value: `${fmt(node.pressure)} bar`, detail: `Depth ${fmt(node.depth, 0)} m` } : null),
    modelReading: { value: '— bar' },
  },
  {
    id: 'hydrophone',
    name: 'Hydrophone Array',
    category: 'Acoustic',
    icon: '🎧',
    location: 'Acoustic receiver section of the prototype',
    measurement: 'Underwater acoustic signals',
    unit: '% signal quality',
    purpose: 'Receives acoustic signals from the surrounding underwater environment and communication network.',
    oceanPurpose: 'Sound is the primary communication medium used by the underwater acoustic network.',
    systemUse: 'Acoustic signal analysis, communication reception, noise analysis and network monitoring.',
    liveReading: ({ node }) => (node ? { value: `${fmt(node.signalQuality)} %`, detail: `Ambient noise ${fmt(node.backgroundNoise, 0)} dB` } : null),
    modelReading: { value: '— %' },
    trend: 'signal',
  },
  {
    id: 'imu',
    name: 'IMU',
    category: 'Motion',
    icon: '🧭',
    location: 'Internal electronics bay — processing module',
    measurement: 'Acceleration, angular motion and orientation',
    unit: '°',
    purpose: 'Determines movement and orientation of the node.',
    oceanPurpose: 'An underwater node can move, rotate or drift due to currents and deployment conditions.',
    systemUse: 'Motion awareness, orientation tracking and support for underwater navigation/state estimation.',
    liveReading: () => null,
    modelReading: { value: 'Pitch 1.2°', detail: 'Roll −0.8° · Yaw drift 0.3°/min' },
  },
  {
    id: 'power-energy',
    name: 'Power / Energy Monitor',
    category: 'Energy',
    icon: '🔋',
    location: 'Power monitoring section — energy system (primary micro nuclear + secondary LiPo)',
    measurement: 'Voltage, current and energy consumption',
    unit: '% · W',
    purpose: 'Monitors the electrical condition of the node.',
    oceanPurpose: 'Underwater nodes must operate for long periods with limited available energy.',
    systemUse: 'Energy monitoring, battery management and emergency-power decisions.',
    liveReading: ({ node }) => (node ? { value: `${fmt(node.secondaryBattery)} %`, detail: `Load ${fmt(node.powerLoad, 2)} W` } : null),
    modelReading: { value: '— %' },
    trend: 'battery',
  },
  {
    id: 'conductivity-salinity',
    name: 'Conductivity / Salinity Sensor',
    category: 'Environmental',
    icon: '🧪',
    location: 'External water-contact sensing module',
    measurement: 'Water conductivity and estimated salinity',
    unit: 'PSU',
    purpose: 'Characterizes seawater composition.',
    oceanPurpose: 'Salinity is an important environmental parameter for ocean monitoring and seawater characterization.',
    systemUse: 'Environmental telemetry and support for underwater acoustic/environmental modelling.',
    liveReading: ({ node }) => (node ? { value: `${fmt(node.salinity, 2)} PSU` } : null),
    modelReading: { value: '— PSU' },
  },
  {
    id: 'turbidity',
    name: 'Turbidity Sensor',
    category: 'Environmental',
    icon: '🌫️',
    location: 'External water-contact sensing module',
    measurement: 'Suspended particles / water clarity',
    unit: 'NTU',
    purpose: 'Detects changes in water clarity caused by suspended material.',
    oceanPurpose: 'Can indicate sediment, biological material or other changes in the surrounding water.',
    systemUse: 'Environmental monitoring and anomaly detection.',
    liveReading: () => null,
    modelReading: { value: '2.4 NTU', detail: 'Clear water baseline' },
  },
  {
    id: 'dissolved-oxygen',
    name: 'Dissolved Oxygen Sensor',
    category: 'Environmental',
    icon: '🫧',
    location: 'External water-contact sensing module',
    measurement: 'Dissolved oxygen concentration',
    unit: 'mg/L',
    purpose: 'Measures oxygen availability in the surrounding water.',
    oceanPurpose: 'Useful for understanding underwater environmental and biological conditions.',
    systemUse: 'Environmental telemetry and ocean-condition analysis.',
    liveReading: ({ node }) => (node ? { value: `${fmt(node.dissolvedOxygen, 2)} mg/L` } : null),
    modelReading: { value: '— mg/L' },
  },
  {
    id: 'ph',
    name: 'pH Sensor',
    category: 'Environmental',
    icon: '⚗️',
    location: 'External water-contact sensing module',
    measurement: 'Water acidity / alkalinity',
    unit: 'pH',
    purpose: 'Measures the chemical condition of seawater.',
    oceanPurpose: 'Useful for ocean chemistry and environmental monitoring.',
    systemUse: 'Environmental telemetry, trend analysis and ocean-condition monitoring.',
    liveReading: () => null,
    modelReading: { value: '8.1 pH', detail: 'Typical seawater baseline' },
  },
];

/** Real NOAA observation backing a sensor card (surface level of the cast). */
export interface NoaaObservationMeta {
  value: string;
  detail?: string;
  depthM: number;
  observationDate: string;
  latitude: number;
  longitude: number;
  castId: string;
  dataset: string;
  source: string;
  pressureDerived?: boolean;
}

export interface ResolvedSensor {
  def: SensorDefinition;
  reading: string;
  detail?: string;
  source: DataSource;
  status: SensorStatus;
  observation?: NoaaObservationMeta;
  /** Overrides def.unit when the real source uses different units (e.g. ml/l). */
  unit?: string;
}

function noaaMetaFor(
  def: SensorDefinition,
  cast: WodCast,
  value: string,
  detail: string | undefined,
  depthM: number,
): NoaaObservationMeta {
  return {
    value,
    detail,
    depthM,
    observationDate: cast.observationDate,
    latitude: cast.latitude,
    longitude: cast.longitude,
    castId: cast.castId,
    dataset: cast.dataset,
    source: cast.source,
    pressureDerived: def.id === 'pressure-depth' ? true : undefined,
  };
}

export function resolveSensors(state: SimulationState, cast: WodCast | null): ResolvedSensor[] {
  const node = state.devices.find(d => d.id === 'MN-01') ?? state.devices[0];
  const recoveryActive = state.recovery !== null;
  const ref: LiveRef = { state, node, recoveryActive };
  const surface = cast && cast.levels.length > 0 ? cast.levels[0] : null;
  return SENSORS.map(def => {
    // Real NOAA observations take precedence for the four environmental sensors.
    // Depth context ALWAYS comes from the device deployment configuration
    // (node.depth) — never from NOAA observation levels.
    if (surface && cast && node) {
      const deviceDepth = `Depth ${fmt(node.depth, 0)} m`;
      if (def.id === 'temperature' && surface.temperatureC !== null) {
        const value = fmt(surface.temperatureC);
        return {
          def, reading: value, detail: deviceDepth,
          source: 'live' as const,
          status: recoveryActive ? ('WARNING' as const) : ('ACTIVE' as const),
          observation: noaaMetaFor(def, cast, `${value} °C`, deviceDepth, surface.depthM),
        };
      }
      if (def.id === 'pressure-depth') {
        const value = fmt(node.depth, 0);
        const detail = `Pressure ≈ ${fmt(node.depth, 0)} dbar (derived from depth)`;
        return {
          def, reading: value, detail, unit: 'm',
          source: 'live' as const,
          status: recoveryActive ? ('WARNING' as const) : ('ACTIVE' as const),
          observation: noaaMetaFor(def, cast, `${value} m`, detail, surface.depthM),
        };
      }
      if (def.id === 'conductivity-salinity' && surface.salinityPsu !== null) {
        const value = fmt(surface.salinityPsu, 2);
        return {
          def, reading: value, detail: deviceDepth,
          source: 'live' as const, status: 'ACTIVE' as const,
          observation: noaaMetaFor(def, cast, `${value} PSU`, deviceDepth, surface.depthM),
        };
      }
      if (def.id === 'dissolved-oxygen' && surface.oxygenMlL !== null) {
        const value = fmt(surface.oxygenMlL, 2);
        return {
          def, reading: value, detail: deviceDepth, unit: 'ml/l',
          source: 'live' as const, status: 'ACTIVE' as const,
          observation: noaaMetaFor(def, cast, `${value} ml/l`, deviceDepth, surface.depthM),
        };
      }
    }
    const live = node ? def.liveReading(ref) : null;
    // Stable deterministic status: WARNING only while its reference node is in recovery.
    const status: SensorStatus = recoveryActive && (def.id === 'power-energy' || def.id === 'hydrophone' || def.id === 'pressure-depth')
      ? 'WARNING'
      : 'ACTIVE';
    if (live) {
      return { def, reading: live.value, detail: live.detail, source: 'live' as const, status };
    }
    return { def, reading: def.modelReading.value, detail: def.modelReading.detail, source: 'model' as const, status };
  });
}
