import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSimulation } from '../hooks/useSimulation';
import { useDashboardSettings } from '../hooks/useDashboardSettings';
import { MenuPanel } from '../components/menu/MenuPanel';
import { MenuContentView } from '../components/menu/MenuContentView';
import { NOTIFY_MAX_ATTEMPTS, NOTIFY_RETRY_DELAY_MS, writeNotifyStatus } from '../utils/notify';
import { OceanIntelligenceAssistant } from '../components/OceanIntelligenceAssistant/OceanIntelligenceAssistant';
import type { MenuOption } from '../data/menuContent';
import { findMenuOption } from '../data/menuContent';
import { BackButton } from '../components/menu/BackButton';
import { recordAppPath, resetAppHistory } from '../utils/appHistory';
import { OverviewPage } from './OverviewPage';
import { SNCPage } from './SNCPage';
import { EnergyPage } from './EnergyPage';
import { AcousticPage } from './AcousticPage';
import { EnvironmentPage } from './EnvironmentPage';
import { AlertsPage } from './AlertsPage';
import { BigDataPage } from './BigDataPage';
import { DeviceHealthTable } from './DeviceHealthTable';
import { HistoricalAnalytics } from './HistoricalAnalytics';
import { Sim3DPage } from './Sim3DPage';
import { OceanSensorsPage } from './OceanSensorsPage';
import { PrototypePage } from './PrototypePage';
import { AboutProjectPage } from './AboutProjectPage';

export type Page = 'overview' | 'snc' | 'energy' | 'acoustic' | 'environment' | 'health' | 'alerts' | 'history' | 'bigdata' | 'sim3d' | 'sensors' | 'prototype' | 'about';

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
  { id: 'sim3d', label: '3D Simulation' },
  { id: 'sensors', label: '🌊 Ocean Sensors' },
  { id: 'prototype', label: '🔬 Exploded View' },
  { id: 'about', label: '📖 About the Project' },
];

const VALID_PAGES = new Set<string>(NAV_ITEMS.map(i => i.id));

// Tab <-> URL slug mapping. Overview is the index route (plain `/dashboard`);
// every other tab has its own URL so browser history, Back, and refresh work.
const PAGE_PATHS: Record<Page, string> = {
  overview: '',
  snc: 'snc-analytics',
  energy: 'energy',
  acoustic: 'acoustic',
  environment: 'environment',
  health: 'device-health',
  alerts: 'alerts',
  history: 'historical',
  bigdata: 'big-data',
  sim3d: '3d-simulation',
  sensors: 'ocean-sensors',
  prototype: 'exploded-view',
  about: 'about-project',
};

const PATH_PAGES: Record<string, Page> = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, slug]) => [slug, page as Page]),
);

/** Active tab is derived from the URL — refresh preserves it, Back walks it. */
function pageFromPath(pathname: string): Page {
  const rest = pathname.startsWith('/dashboard') ? pathname.slice('/dashboard'.length) : pathname;
  const slug = rest.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!slug) return 'overview';
  return PATH_PAGES[slug] ?? 'overview';
}

function pageToPath(page: Page): string {
  const slug = PAGE_PATHS[page];
  return slug ? `/dashboard/${slug}` : '/dashboard';
}

export default function Dashboard({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useDashboardSettings();
  const { state, triggerFailure, acknowledgeFailure } = useSimulation(settings.autoRefresh);
  // Tab comes from the URL (never restored from storage): login always lands
  // on /dashboard (Overview), refresh keeps the current sub-page.
  const page = pageFromPath(location.pathname);
  const goPage = useCallback((target: string) => {
    if (!VALID_PAGES.has(target)) return;
    navigate(pageToPath(target as Page));
  }, [navigate]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [, setClock] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const notifySentRef = useRef(false);
  const [failureSignal, setFailureSignal] = useState<{ key: number; nodeId: string; reason: string } | null>(null);
  // Red emergency dashboard state — only true while a real failure event is active.
  const [failureActive, setFailureActive] = useState(false);

  // Confirmed page-open requests from the assistant console (never automatic).
  const openAssistantPage = useCallback((target: string) => {
    goPage(target);
  }, [goPage]);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Mirror dashboard locations into the in-app trail so Back buttons can
  // decide between browser history and the Dashboard fallback.
  useEffect(() => {
    recordAppPath(location.pathname);
  }, [location.pathname]);

  // Explore-sidebar preference off collapses the sidebar (restored when on).
  const menuOpenEffective = settings.exploreSidebar && menuOpen;

  // Explicit user action only: EVERY System Failure click navigates AND
  // fires notify request(s) — up to 3 attempts with visible Retrying state
  // (ref guard blocks only an accidental same-tick double-click before
  // navigation unmounts this page).
  const handleSystemFailure = () => {
    // NOTE: no page navigation here — the failure drill runs in place and the
    // Ocean Intelligence console opens with diagnostics. /system-failure route stays available.
    if (notifySentRef.current) return;
    notifySentRef.current = true;
    // Drive the REAL simulation state first — map, metrics, alerts, AI all react.
    triggerFailure('MN-01');
    // Visual failure announcement uses the real failing node from live state.
    // (Text-only: no browser speech. Twilio SMS/call below is untouched.)
    const failingNode = state?.devices.find(d => d.id === 'MN-01') || state?.devices.find(d => d.status === 'CRITICAL' || d.status === 'OFFLINE');
    const failNodeId = failingNode?.id || 'MN-01';
    const failReason = failingNode ? `${failingNode.status === 'CRITICAL' ? 'critical condition' : 'communication failure'} detected. Emergency recovery has been initiated` : 'communication failure detected. Emergency recovery has been initiated';
    // Red emergency state + assistant alert (Twilio request below is untouched).
    setFailureActive(true);
    setFailureSignal({ key: Date.now(), nodeId: failNodeId, reason: failReason });
    writeNotifyStatus({ phase: 'sending', sms: 'Sending...', call: 'Initiating...', at: Date.now() });
    void (async () => {
      for (let attempt = 1; attempt <= NOTIFY_MAX_ATTEMPTS; attempt++) {
        if (attempt > 1) {
          writeNotifyStatus({
            phase: 'retrying',
            sms: 'Retrying...',
            call: 'Retrying...',
            attempt,
            detail: `Notification attempt ${attempt} of ${NOTIFY_MAX_ATTEMPTS}...`,
            at: Date.now(),
          });
          await new Promise(r => setTimeout(r, NOTIFY_RETRY_DELAY_MS));
        }
        try {
          const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/api/notify/failure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeId: 'MN-01',
              status: 'CRITICAL',
              message: 'Primary power failure — manual System Failure drill from dashboard',
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            sms?: { sid: string; status: string };
            call?: { sid: string; status: string };
            warning?: string;
            error?: string;
          };
          // A real Twilio call SID = success -> stop retrying, show Ringing.
          if (res.ok && data.ok && data.call) {
            writeNotifyStatus({
              phase: 'done',
              sms: data.sms ? `Sent (${data.sms.status})` : 'Failed',
              call: `🔔 Ringing (${data.call.status})`,
              detail: data.warning,
              at: Date.now(),
            });
            return;
          }
          const reason = data.error || `Notify request failed (HTTP ${res.status})`;
          if (attempt === NOTIFY_MAX_ATTEMPTS) {
            writeNotifyStatus({
              phase: 'error',
              sms: data.sms ? `Sent (${data.sms.status})` : 'Failed',
              call: 'Failed',
              detail: `${reason} — retried ${NOTIFY_MAX_ATTEMPTS}x. Check that the notify backend is running.`,
              at: Date.now(),
            });
            return;
          }
          // otherwise fall through to next retry attempt
        } catch {
          if (attempt === NOTIFY_MAX_ATTEMPTS) {
            writeNotifyStatus({
              phase: 'error',
              sms: 'Failed',
              call: 'Failed',
              detail: `Notify backend unreachable after ${NOTIFY_MAX_ATTEMPTS} attempts. Start it with: npm run server. Failure view still available.`,
              at: Date.now(),
            });
            return;
          }
          // otherwise fall through to next retry attempt
        }
      }
    })();
  };

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
      case 'sim3d': return <Sim3DPage />;
      case 'sensors': return <OceanSensorsPage state={state} />;
      case 'prototype': return <PrototypePage />;
      case 'about': return <AboutProjectPage />;
      default: return <OverviewPage {...props} />;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authenticated');
    resetAppHistory();
    navigate('/login', { replace: true });
  };

  const handleMenuSelect = (option: MenuOption) => {
    // Explore content destinations are real routes (one history entry each).
    // Re-selecting the current destination creates no duplicate entry.
    const dest = `/dashboard/info/${option.id}`;
    if (location.pathname !== dest) navigate(dest);
  };

  const handleMenuPage = (target: string) => {
    goPage(target);
  };

  const handleAcknowledgeFailure = () => {
    acknowledgeFailure();
    notifySentRef.current = false;
    setFailureActive(false);
  };

  // Explore content renders from the URL so every destination owns a
  // browser history entry (Back, refresh and trackpad all work naturally).
  const infoOptionId = (() => {
    const rest = location.pathname.startsWith('/dashboard')
      ? location.pathname.slice('/dashboard'.length)
      : location.pathname;
    const match = rest.match(/^\/info\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]).toLowerCase() : null;
  })();
  const infoOption = infoOptionId ? findMenuOption(infoOptionId) : null;

  return (
    <div className={`app${failureActive ? ' emergency' : ''}`}>
      <header className="header">
        <div className="header-left">
          <div className="header-title-block">
            {onNavigate && (
              <span
                onClick={() => onNavigate('/')}
                style={{ cursor: 'pointer', fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginRight: 10, letterSpacing: '0.5px' }}
              >
                &#9664; LANDING
              </span>
            )}
            <h1>MARISLINK</h1>
            <span className="subtitle">Intelligent Underwater Acoustic Communication &amp; Monitoring System</span>
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
          {settings.exploreSidebar && (
            <button className="menu-bars" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <span />
              <span />
              <span />
            </button>
          )}
        </div>
      </header>

      <nav className="nav">
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => goPage(item.id)}
          >
            {item.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div
          className="nav-item nav-item-failure"
          onClick={handleSystemFailure}
        >
          System Failure
        </div>
      </nav>

      {failureActive && (
        <div className="emergency-banner" role="alert">
          <span className="emergency-dot" aria-hidden="true" />
          <div className="emergency-text">
            <div className="emergency-title">🔴 SYSTEM FAILURE DETECTED</div>
            <div className="emergency-sub">Underwater communication node failure{failureSignal ? ` — ${failureSignal.nodeId}` : ''}</div>
          </div>
          <button type="button" className="emergency-ack" onClick={handleAcknowledgeFailure}>
            Acknowledge & Reset
          </button>
        </div>
      )}

      <div className="app-body">
        <main className="main">
          {infoOption ? (
            <MenuContentView option={infoOption} state={state} onNavigatePage={handleMenuPage} />
          ) : infoOptionId ? (
            <div className="card">
              <div className="card-header"><span className="card-title">Content Not Found</span></div>
              <BackButton />
            </div>
          ) : (
            renderPage()
          )}
        </main>

        <MenuPanel
          open={menuOpenEffective}
          onClose={() => setMenuOpen(false)}
          selectedOption={infoOption}
          onSelectOption={handleMenuSelect}
          onPageAction={handleMenuPage}
          onLogout={handleLogout}
        />
      </div>

      {settings.aiAssistant && (
        <OceanIntelligenceAssistant
          state={state}
          failure={failureSignal}
          failureActive={failureActive}
          exploreOpen={menuOpenEffective}
          onOpenPage={openAssistantPage}
          announcementsEnabled={settings.notifications.ai}
        />
      )}
    </div>
  );
}
