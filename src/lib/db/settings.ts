import type { Database } from 'better-sqlite3';
import {
  type AppSettings,
  DEFAULT_SETTINGS,
} from '@/types/settings';

export interface SettingsRecord {
  key: string;
  value: string;
  updated_at: number;
}

export function getSetting<K extends keyof AppSettings>(
  db: Database,
  key: K,
): AppSettings[K] | undefined {
  const row = db
    .prepare<[string], SettingsRecord>('SELECT key, value, updated_at FROM settings WHERE key = ?')
    .get(key);
  if (!row) return undefined;
  try {
    return JSON.parse(row.value) as AppSettings[K];
  } catch {
    return undefined;
  }
}

export function setSetting<K extends keyof AppSettings>(
  db: Database,
  key: K,
  value: AppSettings[K],
): void {
  const now = Date.now();
  const json = JSON.stringify(value);
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, json, now);
}

export function loadAllSettings(db: Database): AppSettings {
  const out: Partial<AppSettings> = {};
  (Object.keys(DEFAULT_SETTINGS) as Array<keyof AppSettings>).forEach((k) => {
    const v = getSetting(db, k);
    if (v !== undefined) {
      (out as Record<string, AppSettings[keyof AppSettings]>)[k] = v;
    }
  });
  return { ...DEFAULT_SETTINGS, ...out };
}

export function saveAllSettings(db: Database, settings: AppSettings): void {
  const tx = db.transaction((s: AppSettings) => {
    (Object.entries(s) as Array<[keyof AppSettings, AppSettings[keyof AppSettings]]>).forEach(
      ([k, v]) => {
        setSetting(db, k, v);
      },
    );
  });
  tx(settings);
}
