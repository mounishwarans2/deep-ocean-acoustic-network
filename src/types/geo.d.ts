declare module 'leaflet/dist/leaflet.css' {}

declare module 'world-atlas/countries-110m.json' {
  const value: {
    type: string;
    objects: Record<string, unknown>;
    arcs: unknown[];
    bbox?: number[];
  };
  export default value;
}

declare module 'topojson-client' {
  interface Topology {
    type: string;
    objects: Record<string, unknown>;
    arcs: unknown[][];
    transform?: { scale: [number, number]; translate: [number, number] };
  }
  interface FeatureCollection {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      id?: string;
      properties: Record<string, unknown>;
      geometry: {
        type: string;
        coordinates: unknown[];
      };
    }>;
  }
  export function feature(topology: Topology, object: unknown): FeatureCollection;
  export function mesh(
    topology: Topology,
    object: unknown,
    filter?: (a: { id?: string }, b: { id?: string }) => boolean
  ): { type: string; coordinates: unknown[][] };
}
