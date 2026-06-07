import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppSettings, Theme } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

export interface SettingsState {
  settings: AppSettings;
  initialized: boolean;
  init: (settings: AppSettings) => void;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  setShowVirtualKeyboard: (show: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      initialized: false,
      init: (settings) => set({ settings, initialized: true }),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setAccentColor: (accentColor) => set((s) => ({ settings: { ...s.settings, accentColor } })),
      setShowVirtualKeyboard: (showVirtualKeyboard) =>
        set((s) => ({ settings: { ...s.settings, showVirtualKeyboard } })),
      setSoundEnabled: (soundEnabled) =>
        set((s) => ({ settings: { ...s.settings, soundEnabled } })),
      setSoundVolume: (soundVolume) => set((s) => ({ settings: { ...s.settings, soundVolume } })),
    }),
    {
      name: 'wubi-typemaster-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
);

export function getSettingsSnapshot(): AppSettings {
  return useSettings.getState().settings;
}
