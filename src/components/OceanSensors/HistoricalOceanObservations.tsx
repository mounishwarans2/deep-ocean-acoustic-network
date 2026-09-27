import { useMemo } from 'react';
import { MiniChart } from '../charts/MiniChart';
import { useNoaaWod, getSourceUrl } from '../../services/noaaWodService';
import type { WodLevel } from '../../types/oceanData';
import './HistoricalOceanObservations.css';

function formatDate(iso: string): string {
  const [date, time] = iso.replace('Z', '').split('T');
  return time ? `${date} ${time} UTC` : date;
}

function countPresent(levels: WodLevel[], pick: (l: WodLevel) => number | null): number {
  return levels.filter(l => pick(l) !== null).length;
}

export function HistoricalOceanObservations() {
  const provider = useNoaaWod();
  const cast = provider.getProfile();
  const levels = useMemo(() => provider.getObservations(), [provider]);

  const toHistory = (pick: (l: WodLevel) => number | null) =>
    levels
      .map((l, i) => ({ timestamp: i, value: pick(l) ?? NaN }))
      .filter(p => Number.isFinite(p.value));

  if (!cast) {
    return (
      <section className="hist-obs" aria-label="Historical ocean observations">
        <div className="card">
          <div className="card-header"><span className="card-title">Historical Ocean Observations</span></div>
          <p className="hist-obs-sub">Historical ocean measurements and environmental profiles</p>
          <p className="hist-obs-empty">Ocean observation unavailable</p>
        </div>
      </section>
    );
  }

  const total = levels.length;
  const depths = levels.map(l => l.depthM);
  const depthRange = total > 0 ? `${Math.min(...depths)}–${Math.max(...depths)} m` : '—';
  const tempCount = countPresent(levels, l => l.temperatureC);
  const salCount = countPresent(levels, l => l.salinityPsu);
  const oxyCount = countPresent(levels, l => l.oxygenMlL);

  return (
    <section className="hist-obs" aria-label="Historical ocean observations">
      <div className="card">
        <div className="card-header"><span className="card-title">Historical Ocean Observations</span></div>
        <p className="hist-obs-sub">Historical ocean measurements and environmental profiles</p>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">CTD Observation Record</span></div>
        <p className="hist-obs-sub">
          Observation levels by depth — {formatDate(cast.observationDate)} at{' '}
          {cast.latitude.toFixed(4)}°N, {Math.abs(cast.longitude).toFixed(4)}°W.
        </p>
        <div className="hist-obs-table-wrap">
          <table className="health-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Depth (m)</th>
                <th>Temp (°C)</th>
                <th>Salinity (PSU)</th>
                <th>Oxygen (ml/l)</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((l, i) => (
                <tr key={`${l.depthM}-${i}`}>
                  <td>{cast.observationDate.slice(0, 10)}</td>
                  <td>{cast.latitude.toFixed(4)}</td>
                  <td>{cast.longitude.toFixed(4)}</td>
                  <td>{l.depthM}</td>
                  <td>{l.temperatureC !== null ? l.temperatureC.toFixed(2) : '—'}</td>
                  <td>{l.salinityPsu !== null ? l.salinityPsu.toFixed(2) : '—'}</td>
                  <td>{l.oxygenMlL !== null ? l.oxygenMlL.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="hist-obs-profile-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Temperature by Depth</span></div>
          <div className="big-metric-label">Depth levels ({depthRange})</div>
          <MiniChart data={toHistory(l => l.temperatureC)} color="var(--accent-cyan)" height={56} showDots />
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Salinity by Depth</span></div>
          <div className="big-metric-label">Depth levels ({depthRange})</div>
          <MiniChart data={toHistory(l => l.salinityPsu)} color="var(--accent-blue)" height={56} showDots />
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Oxygen by Depth</span></div>
          <div className="big-metric-label">Depth levels ({depthRange})</div>
          <MiniChart data={toHistory(l => l.oxygenMlL)} color="var(--accent-green)" height={56} showDots />
        </div>
      </div>

      <div className="card hist-obs-dataset">
        <div className="card-header"><span className="card-title">Historical Dataset</span></div>
        <p className="hist-obs-sub"><strong>WOD CTD observations</strong></p>
        <p className="hist-obs-sub">CalCOFI cruise {cast.cruise || '201407'}</p>
        <p className="hist-obs-sub">Observation period: {cast.observationDate.slice(0, 10)}</p>
        <p className="hist-obs-sub">
          Location: {cast.latitude.toFixed(4)}°N, {Math.abs(cast.longitude).toFixed(4)}°W
        </p>
        <p className="hist-obs-note">
          Source: {cast.source} · {getSourceUrl()}
        </p>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Historical Dataset Coverage</span></div>
        <p className="hist-obs-sub">
          Variables present in the bundled cast ({cast.castId}, {total} depth levels).
        </p>
        <div className="hist-obs-table-wrap">
          <table className="health-table">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Levels present</th>
                <th>Depth range</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Depth</td><td>{total} of {total}</td><td>{depthRange}</td></tr>
              <tr><td>Temperature (°C)</td><td>{tempCount} of {total}</td><td>{depthRange}</td></tr>
              <tr><td>Salinity (PSU)</td><td>{salCount} of {total}</td><td>{depthRange}</td></tr>
              <tr><td>Oxygen (ml/l)</td><td>{oxyCount} of {total}</td><td>{depthRange}</td></tr>
              <tr><td>Pressure (dbar, derived from depth)</td><td>{total} of {total}</td><td>{depthRange}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="hist-obs-note">
          Broader WOD documentation describes additional Oceanographic Station Data and CTD
          variable families (nutrients, carbonate chemistry, chlorophyll, transmissivity,
          plankton taxonomy/biomass). Only the variables counted above are bundled in this
          cast; nothing else is shown here.
        </p>
      </div>
    </section>
  );
}
