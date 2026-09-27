import type { SimulationState } from '../hooks/useSimulation';
import { useDashboardSettings } from '../hooks/useDashboardSettings';
import { formatTimestamp } from '../utils/format';

interface Props {
  state: SimulationState;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
}

/** Display-only notification filtering (emergency logic elsewhere is untouched). */
function isRecoveryAnnouncement(a: { id: string; message: string; details: string }): boolean {
  if (a.id === 'fail-recovery') return true;
  return /ballast|ascen|recover/i.test(`${a.message} ${a.details}`);
}

export function AlertsPage({ state }: Props) {
  const { settings } = useDashboardSettings();
  const n = settings.notifications;
  const visible = state.alerts.filter(a => {
    if (a.severity === 'CRITICAL' && !n.critical) return false;
    if (a.severity === 'WARNING' && !n.network) return false;
    if (a.severity === 'INFO' && !n.system) return false;
    if (!n.recovery && isRecoveryAnnouncement(a)) return false;
    return true;
  });
  const criticals = visible.filter(a => a.severity === 'CRITICAL');
  const warnings = visible.filter(a => a.severity === 'WARNING');
  const infos = visible.filter(a => a.severity === 'INFO');
  const hasIssues = criticals.length > 0 || warnings.length > 0;

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 10 }}>
        <div className="stat-card"><div className="stat-label">Critical</div><div className={`stat-value ${criticals.length > 0 ? 'red' : 'green'}`}>{criticals.length}</div></div>
        <div className="stat-card"><div className="stat-label">Warnings</div><div className={`stat-value ${warnings.length > 0 ? 'yellow' : 'green'}`}>{warnings.length}</div></div>
        <div className="stat-card"><div className="stat-label">Info</div><div className="stat-value blue">{infos.length}</div></div>
        <div className="stat-card"><div className="stat-label">System Health</div><div className={`stat-value ${hasIssues ? 'yellow' : 'green'}`}>{hasIssues ? 'MONITORING' : 'HEALTHY'}</div></div>
      </div>

      {!hasIssues && (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 24.5, color: 'var(--accent-green)', marginBottom: 4 }}>✓</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--accent-green)' }}>SYSTEM HEALTHY</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>No active anomalies detected.</div>
        </div>
      )}

      {criticals.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title" style={{ color: 'var(--accent-red)' }}>Critical</span></div>
          {criticals.map(a => (
            <div key={a.id} className="alert-item critical">
              <span className="alert-icon">●</span>
              <div className="alert-content"><div className="alert-message">{a.message}</div><div className="alert-details">{a.details}</div></div>
              <span className="alert-time">{formatTimestamp(a.timestamp)}</span>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title" style={{ color: 'var(--accent-yellow)' }}>Warnings</span></div>
          {warnings.map(a => (
            <div key={a.id} className="alert-item warning">
              <span className="alert-icon">●</span>
              <div className="alert-content"><div className="alert-message">{a.message}</div><div className="alert-details">{a.details}</div></div>
              <span className="alert-time">{formatTimestamp(a.timestamp)}</span>
            </div>
          ))}
        </div>
      )}

      {infos.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title" style={{ color: 'var(--accent-blue)' }}>Information</span></div>
          {infos.map(a => (
            <div key={a.id} className="alert-item info">
              <span className="alert-icon">●</span>
              <div className="alert-content"><div className="alert-message">{a.message}</div><div className="alert-details">{a.details}</div></div>
              <span className="alert-time">{formatTimestamp(a.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
