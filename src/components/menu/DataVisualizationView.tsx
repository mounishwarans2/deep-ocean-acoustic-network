import { useMemo } from 'react';
import type { MenuOption } from '../../data/menuContent';
import { useNoaaWod } from '../../services/noaaWodService';
import type { WodLevel } from '../../types/oceanData';
import { BarChart } from '../charts/BarChart';
import { BackButton } from './BackButton';
import '../menu/Menu.css';
import './DataVisualizationView.css';

interface Props {
  option: MenuOption;
}

function formatLat(lat: number): string {
  return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`;
}

function formatLng(lng: number): string {
  return `${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
}

function formatDateTime(iso: string): string {
  const [date, time] = iso.replace('Z', '').split('T');
  return time ? `${date} ${time} UTC` : date;
}

function toBars(levels: WodLevel[], pick: (l: WodLevel) => number | null) {
  return levels.map(l => ({ label: String(l.depthM), value: pick(l) }));
}

export function DataVisualizationView({ option }: Props) {
  const provider = useNoaaWod();
  const cast = provider.getProfile();
  const levels = useMemo(() => provider.getObservations(), [provider]);

  const tempBars = useMemo(() => toBars(levels, l => l.temperatureC), [levels]);
  const salBars = useMemo(() => toBars(levels, l => l.salinityPsu), [levels]);
  const oxyBars = useMemo(() => toBars(levels, l => l.oxygenMlL), [levels]);

  return (
    <div className="menu-content-view">
      <div className="menu-content-header">
        <div className="menu-content-title">
          <span className="menu-content-icon">{option.icon}</span>
          <div>
            <div className="menu-content-label">{option.label}</div>
          </div>
        </div>
        <BackButton />
      </div>

      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">NOAA CTD Observation Profile</span></div>
          {!cast ? (
            <p className="dv-empty">Ocean observation unavailable</p>
          ) : (
            <div className="dv-grid">
              <div className="card dv-chart-card">
                <div className="card-header"><span className="card-title">Temperature by Depth</span></div>
                <BarChart
                  data={tempBars}
                  color="var(--accent-cyan)"
                  height={300}
                  xAxisLabel="Depth (m)"
                  yAxisLabel="Temperature (°C)"
                  formatValue={v => v.toFixed(1)}
                />
              </div>
              <div className="card dv-chart-card">
                <div className="card-header"><span className="card-title">Salinity by Depth</span></div>
                <BarChart
                  data={salBars}
                  color="var(--accent-blue)"
                  height={300}
                  xAxisLabel="Depth (m)"
                  yAxisLabel="Salinity (PSU)"
                  formatValue={v => v.toFixed(2)}
                />
              </div>
              <div className="card dv-chart-card dv-span">
                <div className="card-header"><span className="card-title">Dissolved Oxygen by Depth</span></div>
                <BarChart
                  data={oxyBars}
                  color="var(--accent-green)"
                  height={300}
                  xAxisLabel="Depth (m)"
                  yAxisLabel="Dissolved Oxygen (mL/L)"
                  formatValue={v => v.toFixed(2)}
                />
              </div>
            </div>
          )}
        </div>

        {cast && (
          <div className="card dv-source">
            <p className="dv-source-line">Source: {cast.source} — {cast.dataset}</p>
            <p className="dv-source-line">Dataset: {cast.dataset}</p>
            <p className="dv-source-line">Cast: {cast.castId}</p>
            <p className="dv-source-line">Location: {formatLat(cast.latitude)}, {formatLng(cast.longitude)}</p>
            <p className="dv-source-line">Observation: {formatDateTime(cast.observationDate)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
