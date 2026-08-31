import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../hooks/useSimulation';
import { MenuPanel } from '../components/menu/MenuPanel';
import { MenuContentView } from '../components/menu/MenuContentView';
import type { MenuOption } from '../data/menuContent';
import { OverviewPage } from './OverviewPage';
import { SNCPage } from './SNCPage';
import { EnergyPage } from './EnergyPage';
import { AcousticPage } from './AcousticPage';
import { EnvironmentPage } from './EnvironmentPage';
import { AlertsPage } from './AlertsPage';
import { BigDataPage } from './BigDataPage';
import { DeviceHealthTable } from './DeviceHealthTable';
import { HistoricalAnalytics } from './HistoricalAnalytics';

export type Page = 'overview' | 'snc' | 'energy' | 'acoustic' | 'environment' | 'health' | 'alerts' | 'history' | 'bigdata';

const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'snc', label: 'SNC Analytics' },
  { id: 'energy', label: 'Energy' },
  { id: 'acoustic', label: 'Acoustic' },
  { id: 'environment', label: 'Environment' },
  { id: 'health', label: 'Device Health' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'history', label: 'Historical' },
  { id: 'bigdata', label: 'Big Data' },
];

export default function Dashboard({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const navigate = useNavigate();
  const { state } = useSimulation();
  const [page, setPage] = useState<Page>('overview');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [, setClock] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuOption, setMenuOption] = useState<MenuOption | null>(null);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!state) return <div className="loading">Initializing underwater network simulation...</div>;

  const activeAlerts = state.alerts.filter(a => !a.acknowledged && a.severity !== 'INFO').length;
  const lastUpdated = new Date(state.lastUpdate).toLocaleTimeString('en-US', { hour12: false });

  const renderPage = () => {
    const props = { state, selectedDeviceId, onSelectDevice: setSelectedDeviceId };
    switch (page) {
      case 'overview': return <OverviewPage {...props} />;
      case 'snc': return <SNCPage {...props} />;
      case 'energy': return <EnergyPage {...props} />;
      case 'acoustic': return <AcousticPage {...props} />;
      case 'environment': return <EnvironmentPage {...props} />;
      case 'health': return <DeviceHealthTable {...props} />;
      case 'alerts': return <AlertsPage {...props} />;
      case 'history': return <HistoricalAnalytics {...props} />;
      case 'bigdata': return <BigDataPage state={state} />;
      default: return <OverviewPage {...props} />;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authenticated');
    navigate('/login');
  };

  const handleMenuSelect = (option: MenuOption) => {
    setMenuOption(option);
    setMenuOpen(false);
  };

  const handleMenuPage = (target: string) => {
    setPage(target as Page);
    setMenuOption(null);
    setMenuOpen(false);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="header-title-block">
            {onNavigate && (
              <span
                onClick={() => onNavigate('/')}
                style={{ cursor: 'pointer', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginRight: 10, letterSpacing: '0.5px' }}
              >
                &#9664; LANDING
              </span>
            )}
            <h1>Underwater Intelligence</h1>
            <span className="subtitle">Deep Ocean Acoustic Communication</span>
          </div>
        </div>
        <div className="header-right">
          <div className="header-item">
            <span className="status-dot-header" />
            <span>System Online</span>
          </div>
          <div className="header-item">
            <span>Mode:</span>
            <span className="value">Simulation</span>
          </div>
          <div className="header-item">
            <span>Last Update:</span>
            <span className="value">{lastUpdated}</span>
          </div>
          <div className="header-item">
            <span>Network:</span>
            <span className="value" style={{ color: '#4ade80' }}>Operational</span>
          </div>
          {activeAlerts > 0 && (
            <div className="alert-count-badge">{activeAlerts} Alert{activeAlerts !== 1 ? 's' : ''}</div>
          )}
          <button className="logout-btn" onClick={handleLogout}>LOGOUT</button>
          <button className="menu-bars" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <nav className="nav">
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            {item.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div
          className="nav-item nav-item-failure"
          onClick={() => navigate('/system-failure')}
        >
          System Failure
        </div>
      </nav>

      <main className="main">
        {menuOption ? (
          <MenuContentView option={menuOption} onClose={() => setMenuOption(null)} />
        ) : (
          renderPage()
        )}
      </main>

      <MenuPanel
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        selectedOption={menuOption}
        onSelectOption={handleMenuSelect}
        onPageAction={handleMenuPage}
        onLogout={handleLogout}
      />
    </div>
  );
}
