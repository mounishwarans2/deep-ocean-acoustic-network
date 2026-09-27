import { useEffect, useRef, useState } from 'react';
import type { MenuOption } from '../../data/menuContent';
import {
  useDashboardSettings,
  type AccentChoice,
  type DepthViewChoice,
  type MonitoringModule,
  type TextSizeChoice,
  type ThemeChoice,
} from '../../hooks/useDashboardSettings';
import { BackButton } from './BackButton';
import '../menu/Menu.css';
import './SettingsView.css';

interface Props {
  option: MenuOption;
  onNavigatePage?: (page: string) => void;
}

const THEMES: { id: ThemeChoice; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

const ACCENTS: { id: AccentChoice; label: string; swatch: string }[] = [
  { id: 'ocean', label: 'Ocean Blue', swatch: '#1565A8' },
  { id: 'cyan', label: 'Cyan', swatch: '#06B6D4' },
  { id: 'deep', label: 'Deep Blue', swatch: '#1D4ED8' },
  { id: 'teal', label: 'Teal', swatch: '#0F766E' },
];

const TEXT_SIZES: { id: TextSizeChoice; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

const DEPTH_VIEWS: { id: DepthViewChoice; label: string; page: string }[] = [
  { id: 'overview', label: 'Ocean Overview', page: 'overview' },
  { id: 'network', label: 'Network Depth', page: 'health' },
  { id: 'sensor', label: 'Sensor Depth', page: 'sensors' },
];

const MODULES: { id: MonitoringModule; label: string; page: string }[] = [
  { id: 'overview', label: 'Overview', page: 'overview' },
  { id: 'sensors', label: 'Ocean Sensors', page: 'sensors' },
  { id: 'simulation', label: 'Simulation', page: 'sim3d' },
  { id: 'network', label: 'Network', page: 'acoustic' },
  { id: 'analytics', label: 'Analytics', page: 'snc' },
];

function Row({ name, desc, control }: { name: string; desc: string; control: React.ReactNode }) {
  return (
    <div className="st-row">
      <div className="st-row-text">
        <b>{name}</b>
        <span>{desc}</span>
      </div>
      <div className="st-control">{control}</div>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`st-toggle${on ? ' on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className="st-knob" />
      <span className="st-toggle-label">{on ? 'ON' : 'OFF'}</span>
    </button>
  );
}

function Segmented<T extends string>({ options, value, onChange, label }: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="st-seg" role="group" aria-label={label}>
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          className={`st-seg-btn${value === o.id ? ' active' : ''}`}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsView({ option, onNavigatePage }: Props) {
  const { settings, update, reset } = useDashboardSettings();
  const [confirmReset, setConfirmReset] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const firstRender = useRef(true);
  const flashTimer = useRef(0);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSavedFlash(true);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setSavedFlash(false), 1500);
    return () => window.clearTimeout(flashTimer.current);
  }, [settings]);

  const gotoModule = (page: string) => {
    if (onNavigatePage) onNavigatePage(page);
  };

  const n = settings.notifications;
  const notifSummary = [n.system, n.critical, n.recovery, n.network, n.ai].every(Boolean)
    ? 'Enabled'
    : [n.system, n.critical, n.recovery, n.network, n.ai].some(Boolean)
      ? 'Custom'
      : 'Muted';

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
        <p className="st-subtitle">Customize your dashboard, monitoring and notification experience</p>
        <p className="st-savedline" aria-live="polite">
          {savedFlash ? 'Settings saved' : 'Preferences saved automatically'}
        </p>
      </div>

      <div className="menu-content-body">
        <div className="card">
          <div className="card-header"><span className="card-title">Appearance</span></div>
          <Row
            name="Theme"
            desc="Choose how the dashboard should appear. Light is the default."
            control={<Segmented label="Theme" options={THEMES} value={settings.theme} onChange={v => update({ theme: v })} />}
          />
          <Row
            name="Accent Color"
            desc="Update dashboard accent variables without changing the design."
            control={
              <div className="st-swatches" role="group" aria-label="Accent color">
                {ACCENTS.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    className={`st-swatch${settings.accentColor === a.id ? ' active' : ''}`}
                    aria-pressed={settings.accentColor === a.id}
                    title={a.label}
                    onClick={() => update({ accentColor: a.id })}
                  >
                    <span className="st-swatch-dot" style={{ background: a.swatch }} />
                    {a.label}
                  </button>
                ))}
              </div>
            }
          />
          <Row
            name="Text Size"
            desc="Adjust scalable dashboard typography. Default is Medium."
            control={<Segmented label="Text size" options={TEXT_SIZES} value={settings.textSize} onChange={v => update({ textSize: v })} />}
          />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Navigation Preferences</span></div>
          <Row
            name="Explore Sidebar"
            desc="When off, the Explore sidebar is collapsed. Navigation is restored when on."
            control={<Toggle label="Explore sidebar" on={settings.exploreSidebar} onChange={v => update({ exploreSidebar: v })} />}
          />

          <Row
            name="Sidebar Position"
            desc="Place the Explore sidebar on the right or left. Default is Right."
            control={
              <Segmented
                label="Sidebar position"
                options={[{ id: 'right', label: 'Right' }, { id: 'left', label: 'Left' }]}
                value={settings.sidebarPosition}
                onChange={v => update({ sidebarPosition: v })}
              />
            }
          />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Notification Preferences</span></div>
          <p className="st-hint">These control dashboard notification display only — never the underlying emergency system.</p>
          <Row name="System Alerts" desc="General system notifications." control={<Toggle label="System alerts" on={n.system} onChange={v => update({ notifications: { system: v } })} />} />
          <Row name="Critical Failures" desc="Critical failure announcements." control={<Toggle label="Critical failures" on={n.critical} onChange={v => update({ notifications: { critical: v } })} />} />
          <Row name="Recovery Events" desc="Recovery progress announcements." control={<Toggle label="Recovery events" on={n.recovery} onChange={v => update({ notifications: { recovery: v } })} />} />
          <Row name="Network Warnings" desc="Network warning announcements." control={<Toggle label="Network warnings" on={n.network} onChange={v => update({ notifications: { network: v } })} />} />
          <Row name="AI Notifications" desc="Assistant alert announcements." control={<Toggle label="AI notifications" on={n.ai} onChange={v => update({ notifications: { ai: v } })} />} />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">AI Assistant</span></div>
          <Row
            name="AI Assistant"
            desc="When off, the assistant launcher is hidden. Default is on."
            control={<Toggle label="AI assistant" on={settings.aiAssistant} onChange={v => update({ aiAssistant: v })} />}
          />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Dashboard Display</span></div>
          <Row
            name="Animations"
            desc="Reduce or disable non-essential dashboard animations."
            control={<Toggle label="Animations" on={settings.animations} onChange={v => update({ animations: v })} />}
          />
          <Row
            name="Auto Refresh"
            desc="Automatic telemetry display updates. Emergency behavior always continues."
            control={<Toggle label="Auto refresh" on={settings.autoRefresh} onChange={v => update({ autoRefresh: v })} />}
          />
          <Row
            name="Compact Cards"
            desc="Reduce card spacing and padding."
            control={<Toggle label="Compact cards" on={settings.compactCards} onChange={v => update({ compactCards: v })} />}
          />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Monitoring Preferences</span></div>
          <Row
            name="Default Depth View"
            desc="Preferred monitoring context used when the dashboard is opened."
            control={
              <Segmented
                label="Default depth view"
                options={DEPTH_VIEWS.map(d => ({ id: d.id, label: d.label }))}
                value={settings.defaultDepthView}
                onChange={v => {
                  update({ defaultDepthView: v });
                  gotoModule(DEPTH_VIEWS.find(d => d.id === v)?.page ?? 'overview');
                }}
              />
            }
          />
          <Row
            name="Default Monitoring Module"
            desc="Preferred starting module when the dashboard is opened."
            control={
              <Segmented
                label="Default monitoring module"
                options={MODULES.map(m => ({ id: m.id, label: m.label }))}
                value={settings.defaultMonitoringModule}
                onChange={v => {
                  update({ defaultMonitoringModule: v });
                  gotoModule(MODULES.find(m => m.id === v)?.page ?? 'overview');
                }}
              />
            }
          />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Data &amp; Privacy</span></div>
          <Row
            name="Save Preferences Locally"
            desc="Store preferences in this browser. When off, session defaults are used."
            control={<Toggle label="Save preferences locally" on={settings.savePreferences} onChange={v => update({ savePreferences: v })} />}
          />
          <Row
            name="Reset Local Preferences"
            desc="Restore all dashboard preferences to their default values."
            control={
              <button type="button" className="st-reset-btn" onClick={() => setConfirmReset(true)}>
                Reset Preferences
              </button>
            }
          />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Accessibility</span></div>
          <Row
            name="High Contrast"
            desc="Increase text and background contrast."
            control={<Toggle label="High contrast" on={settings.highContrast} onChange={v => update({ highContrast: v })} />}
          />
          <Row
            name="Reduce Motion"
            desc="Reduce non-essential animations and transitions."
            control={<Toggle label="Reduce motion" on={settings.reduceMotion} onChange={v => update({ reduceMotion: v })} />}
          />
          <Row
            name="Keyboard Navigation"
            desc="Keep interactive controls clearly keyboard accessible."
            control={<Toggle label="Keyboard navigation" on={settings.keyboardNavigation} onChange={v => update({ keyboardNavigation: v })} />}
          />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Current Preferences</span></div>
          <div className="st-summary">
            {[
              ['Theme', settings.theme[0].toUpperCase() + settings.theme.slice(1)],
              ['Accent', ACCENTS.find(a => a.id === settings.accentColor)?.label ?? settings.accentColor],
              ['Text Size', settings.textSize[0].toUpperCase() + settings.textSize.slice(1)],
              ['Explore Sidebar', settings.exploreSidebar ? 'Enabled' : 'Disabled'],
              ['Notifications', notifSummary],
              ['AI Assistant', settings.aiAssistant ? 'Enabled' : 'Disabled'],
              ['Animations', settings.animations ? 'Enabled' : 'Disabled'],
              ['Auto Refresh', settings.autoRefresh ? 'Enabled' : 'Disabled'],
            ].map(([k, v]) => (
              <div className="st-summary-row" key={k}>
                <span>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {confirmReset && (
        <div className="st-dialog-backdrop" role="presentation" onClick={() => setConfirmReset(false)}>
          <div className="st-dialog" role="alertdialog" aria-modal="true" aria-label="Reset preferences" onClick={e => e.stopPropagation()}>
            <b>Reset all dashboard preferences to their default values?</b>
            <div className="st-dialog-actions">
              <button type="button" className="st-dialog-btn" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button
                type="button"
                className="st-dialog-btn primary"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
