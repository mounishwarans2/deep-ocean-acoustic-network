import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

export function resolveSystemTheme(): 'dark' | 'light' {
  return 'dark';
}

export function resolveTheme(_t: Theme): 'dark' | 'light' {
  return 'dark';
}

export function applyTheme(_t: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', 'dark');
    // Force dark only - persist dark to localStorage
    try {
      localStorage.setItem('ui-theme', 'dark');
    } catch {}
  }
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme] = useState<Theme>('dark');

  useEffect(() => {
    applyTheme('dark');
    // Cleanup any old light/system preference
    try {
      localStorage.setItem('ui-theme', 'dark');
    } catch {}
  }, []);

  // setter is no-op but keeps API compatible - always stays dark
  const setTheme = (_t: Theme) => {
    applyTheme('dark');
  };

  return [theme, setTheme];
}
