export type Theme = 'light' | 'dark' | 'system';
export type UpdateSource = 'github' | 'gitee';

export interface AppSettings {
  theme: Theme;
  accentColor: string;
  showVirtualKeyboard: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  updateSource: UpdateSource;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  accentColor: '#3b82f6',
  showVirtualKeyboard: false,
  soundEnabled: false,
  soundVolume: 0.5,
  updateSource: 'github',
};

export const ACCENT_PRESETS: ReadonlyArray<{ name: string; value: string }> = [
  { name: '蓝 (默认)', value: '#3b82f6' },
  { name: '青', value: '#06b6d4' },
  { name: '绿', value: '#22c55e' },
  { name: '琥珀', value: '#f59e0b' },
  { name: '红', value: '#ef4444' },
  { name: '紫', value: '#a855f7' },
  { name: '粉', value: '#ec4899' },
  { name: '灰', value: '#64748b' },
];
