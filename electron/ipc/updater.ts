import { app, ipcMain, type BrowserWindow } from 'electron';
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater';
import log from 'electron-log';
import type { UpdaterStatus } from '../../src/types/electron';

function formatReleaseNotes(notes: UpdateInfo['releaseNotes']): string | null {
  if (!notes) return null;
  if (typeof notes === 'string') return notes;
  if (Array.isArray(notes)) {
    return notes.map((n) => n.note ?? '').join('\n\n');
  }
  return null;
}

let status: UpdaterStatus = {
  available: false,
  downloaded: false,
  currentVersion: '',
  version: null,
  releaseNotes: null,
  progress: 0,
  error: null,
};

let statusListeners: Array<(s: UpdaterStatus) => void> = [];

function notify(): void {
  for (const cb of statusListeners) cb({ ...status });
}

function patch(p: Partial<UpdaterStatus>): void {
  status = { ...status, ...p };
  notify();
}

export function registerUpdaterIpc(getMainWindow: () => BrowserWindow | null): void {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    patch({
      available: true,
      version: info.version,
      releaseNotes: formatReleaseNotes(info.releaseNotes),
    });
  });
  autoUpdater.on('update-not-available', () => {
    patch({ available: false, version: null, releaseNotes: null });
  });
  autoUpdater.on('download-progress', (p: ProgressInfo) => {
    patch({ progress: Math.round(p.percent) });
  });
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    patch({ downloaded: true, version: info.version, progress: 100 });
  });
  autoUpdater.on('error', (err: Error) => {
    patch({ error: err.message });
  });

  ipcMain.handle('updater:check', async (): Promise<UpdaterStatus> => {
    if (!app.isPackaged) {
      patch({ error: 'Auto-update only available in packaged builds' });
      return { ...status };
    }
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      patch({ error: (e as Error).message });
    }
    return { ...status };
  });

  ipcMain.handle('updater:download', async (): Promise<UpdaterStatus> => {
    if (!app.isPackaged) {
      patch({ error: 'Auto-update only available in packaged builds' });
      return { ...status };
    }
    try {
      await autoUpdater.downloadUpdate();
    } catch (e) {
      patch({ error: (e as Error).message });
    }
    return { ...status };
  });

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle('updater:subscribe', (evt) => {
    const win = getMainWindow();
    const wc = win?.webContents ?? evt.sender;
    const cb = (s: UpdaterStatus): void => {
      wc.send('updater:status', s);
    };
    statusListeners.push(cb);
    cb({ ...status });
    return () => {
      statusListeners = statusListeners.filter((x) => x !== cb);
    };
  });
}

export function getCurrentStatus(): UpdaterStatus {
  return { ...status };
}
