import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  applyVisualSettings,
  cleanupObsoleteVoiceKeys,
  loadSettings,
  type DashboardSettings,
  type SettingsPatch,
} from './dashboardSettings';

export type {
  AccentChoice,
  DashboardSettings,
  DepthViewChoice,
  MonitoringModule,
  NotificationPrefs,
  SettingsPatch,
  SidebarPosition,
  TextSizeChoice,
  ThemeChoice,
} from './dashboardSettings';

interface SettingsContextValue {
  settings: DashboardSettings;
  update: (patch: SettingsPatch) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function DashboardSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DashboardSettings>(loadSettings);

  // One-time cleanup of obsolete speech-system keys (text-only assistant).
  useEffect(() => {
    cleanupObsoleteVoiceKeys();
  }, []);

  // Persist centrally (single key). Session-only when persistence is off.
  useEffect(() => {
    try {
      if (settings.savePreferences) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* storage unavailable — settings still work for the session */ }
  }, [settings]);

  // Apply visual preferences immediately.
  useEffect(() => {
    applyVisualSettings(settings);
    if (settings.theme !== 'system') return;
    let mq: MediaQueryList | null = null;
    const onChange = () => applyVisualSettings(settings);
    try {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', onChange);
    } catch { /* ignore */ }
    return () => {
      try {
        mq?.removeEventListener('change', onChange);
      } catch { /* ignore */ }
    };
  }, [settings]);

  const update = useCallback((patch: SettingsPatch) => {
    setSettings(prev => ({
      ...prev,
      ...patch,
      notifications: { ...prev.notifications, ...(patch.notifications ?? {}) },
    }));
  }, []);

  const reset = useCallback(() => {
    setSettings(prev => ({ ...DEFAULT_SETTINGS, savePreferences: prev.savePreferences }));
  }, []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useDashboardSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useDashboardSettings must be used within DashboardSettingsProvider');
  return ctx;
}
