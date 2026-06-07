import { ipcMain } from 'electron';
import {
  getSetting,
  setSetting,
  loadAllSettings,
  saveAllSettings,
} from '../../src/lib/db/settings';
import { getDatabase } from './db';
import type { AppSettings } from '../../src/types/settings';

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', (_evt, key: keyof AppSettings) => getSetting(getDatabase(), key));
  ipcMain.handle(
    'settings:set',
    (_evt, key: keyof AppSettings, value: AppSettings[keyof AppSettings]) =>
      setSetting(getDatabase(), key, value),
  );
  ipcMain.handle('settings:loadAll', () => loadAllSettings(getDatabase()));
  ipcMain.handle('settings:saveAll', (_evt, s: AppSettings) => saveAllSettings(getDatabase(), s));
}
