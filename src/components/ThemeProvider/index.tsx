import * as React from 'react';
import { useSettings } from '@/stores/settings';
import { ACCENT_PRESETS } from '@/types/settings';

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return { h: 217, s: 91, l: 60 };
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSettings((s) => s.settings.theme);
  const accentColor = useSettings((s) => s.settings.accentColor);

  React.useEffect(() => {
    const root = document.documentElement;
    const apply = (isDark: boolean) => {
      root.classList.toggle('dark', isDark);
    };
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      apply(theme === 'dark');
    }
    return undefined;
  }, [theme]);

  React.useEffect(() => {
    const { h, s } = hexToHsl(accentColor);
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const l = isDark ? 60 : 53;
    root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
    root.style.setProperty('--ring', `${h} ${s}% ${l}%`);
  }, [accentColor]);

  return <>{children}</>;
}

export { ACCENT_PRESETS };
