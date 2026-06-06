import { describe, it, expect, beforeEach } from 'vitest';
import { useSettings, getSettingsSnapshot } from '@/stores/settings';
import { DEFAULT_SETTINGS, ACCENT_PRESETS } from '@/types/settings';

describe('settings store', () => {
  beforeEach(() => {
    useSettings.setState({
      settings: { ...DEFAULT_SETTINGS },
      initialized: false,
    });
  });

  it('starts with default settings', () => {
    const state = useSettings.getState();
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
    expect(state.initialized).toBe(false);
  });

  it('init overrides settings and marks initialized', () => {
    useSettings.getState().init({ ...DEFAULT_SETTINGS, theme: 'dark' });
    const state = useSettings.getState();
    expect(state.settings.theme).toBe('dark');
    expect(state.initialized).toBe(true);
  });

  it('setTheme updates only theme', () => {
    useSettings.getState().setTheme('dark');
    expect(useSettings.getState().settings.theme).toBe('dark');
    expect(useSettings.getState().settings.accentColor).toBe(DEFAULT_SETTINGS.accentColor);
  });

  it('setAccentColor stores hex', () => {
    useSettings.getState().setAccentColor('#ff0000');
    expect(useSettings.getState().settings.accentColor).toBe('#ff0000');
  });

  it('setShowVirtualKeyboard toggles', () => {
    useSettings.getState().setShowVirtualKeyboard(true);
    expect(useSettings.getState().settings.showVirtualKeyboard).toBe(true);
  });

  it('setSoundEnabled toggles', () => {
    useSettings.getState().setSoundEnabled(true);
    expect(useSettings.getState().settings.soundEnabled).toBe(true);
  });

  it('setSoundVolume stores 0..1', () => {
    useSettings.getState().setSoundVolume(0.8);
    expect(useSettings.getState().settings.soundVolume).toBe(0.8);
  });

  it('getSettingsSnapshot returns current state', () => {
    useSettings.getState().setTheme('dark');
    const snap = getSettingsSnapshot();
    expect(snap.theme).toBe('dark');
  });

  it('ACCENT_PRESETS contains the default color', () => {
    const values = ACCENT_PRESETS.map((p) => p.value.toLowerCase());
    expect(values).toContain(DEFAULT_SETTINGS.accentColor.toLowerCase());
  });
});
