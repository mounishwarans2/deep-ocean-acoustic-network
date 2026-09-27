export type ThemeChoice = 'light' | 'dark' | 'system';
export type AccentChoice = 'ocean' | 'cyan' | 'deep' | 'teal';
export type TextSizeChoice = 'small' | 'medium' | 'large';
export type SidebarPosition = 'left' | 'right';
export type DepthViewChoice = 'overview' | 'network' | 'sensor';
export type MonitoringModule = 'overview' | 'sensors' | 'simulation' | 'network' | 'analytics';

export interface NotificationPrefs {
  system: boolean;
  critical: boolean;
  recovery: boolean;
  network: boolean;
  ai: boolean;
}

export interface DashboardSettings {
  theme: ThemeChoice;
  accentColor: AccentChoice;
  textSize: TextSizeChoice;
  exploreSidebar: boolean;
  rememberLastPage: boolean;
  sidebarPosition: SidebarPosition;
  notifications: NotificationPrefs;
  aiAssistant: boolean;
  animations: boolean;
  autoRefresh: boolean;
  compactCards: boolean;
  defaultDepthView: DepthViewChoice;
  defaultMonitoringModule: MonitoringModule;
  savePreferences: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  keyboardNavigation: boolean;
  /** last dashboard section, stored in the same object (session use when persistence is off) */
  lastPage: string | null;
}

export const STORAGE_KEY = 'dashboardSettings';

/** Obsolete speech-system keys, removed one-time (text-only assistant). */
const OBSOLETE_VOICE_KEYS = ['oi-voice-enabled', 'oi-voice-volume', 'oi-voice-rate', 'oi-voice-name'];

export function cleanupObsoleteVoiceKeys(): void {
  try {
    for (const key of OBSOLETE_VOICE_KEYS) localStorage.removeItem(key);
  } catch { /* storage unavailable — nothing to clean */ }
}

export const DEFAULT_SETTINGS: DashboardSettings = {
  theme: 'light',
  accentColor: 'ocean',
  textSize: 'medium',
  exploreSidebar: true,
  rememberLastPage: true,
  sidebarPosition: 'right',
  notifications: { system: true, critical: true, recovery: true, network: true, ai: true },
  aiAssistant: true,
  animations: true,
  autoRefresh: true,
  compactCards: false,
  defaultDepthView: 'overview',
  defaultMonitoringModule: 'overview',
  savePreferences: true,
  highContrast: false,
  reduceMotion: false,
  keyboardNavigation: true,
  lastPage: null,
};

export function loadSettings(): DashboardSettings {
  let base: DashboardSettings = { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DashboardSettings>;
      // Drop obsolete speech-system fields persisted by older versions.
      const legacy = parsed as Record<string, unknown>;
      delete legacy.voiceAlerts;
      delete legacy.assistantSound;
      delete legacy.assistantVolume;
      base = {
        ...base,
        ...parsed,
        notifications: { ...base.notifications, ...(parsed.notifications ?? {}) },
      };
    }
  } catch {
    /* corrupted storage — fall back to defaults */
  }
  return base;
}

/** Read the persisted settings without React (for initial page resolution). */
export function readStoredSettings(): DashboardSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DashboardSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications ?? {}) },
    };
  } catch {
    return null;
  }
}

export type SettingsPatch = Partial<Omit<DashboardSettings, 'notifications'>> & {
  notifications?: Partial<NotificationPrefs>;
};

function resolveThemeChoice(theme: ThemeChoice): 'light' | 'dark' {
  if (theme === 'light') return 'light';
  if (theme === 'dark') return 'dark';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyVisualSettings(s: DashboardSettings): void {
  const app = document.querySelector('.app');
  if (app) {
    app.setAttribute('data-dashboard-theme', resolveThemeChoice(s.theme));
    app.setAttribute('data-accent', s.accentColor);
    app.setAttribute('data-compact', s.compactCards ? 'on' : 'off');
    app.setAttribute('data-animations', s.animations ? 'on' : 'off');
    app.setAttribute('data-motion', s.reduceMotion ? 'reduced' : 'full');
    app.setAttribute('data-contrast', s.highContrast ? 'high' : 'normal');
    app.setAttribute('data-kb', s.keyboardNavigation ? 'on' : 'off');
    app.setAttribute('data-sidebar', s.sidebarPosition);
  }
  try {
    document.documentElement.style.fontSize =
      s.textSize === 'small' ? '14px' : s.textSize === 'large' ? '19px' : '';
  } catch { /* ignore */ }
}
