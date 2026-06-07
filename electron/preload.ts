import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import type { WubiChar, WubiWord } from '../src/lib/wubi/lookup';
import type {
  AppSettingsValue,
  ElectronAPI,
  PracticeSessionRecord,
  SessionErrorRecord,
  SessionSummary,
  UpdaterStatus,
} from '../src/types/electron';

const api: ElectronAPI = {
  ping: () => ipcRenderer.invoke('app:ping') as Promise<string>,
  db: {
    lookupChar: (char) => ipcRenderer.invoke('wubi:lookupChar', char) as Promise<WubiChar | null>,
    lookupCode: (code) => ipcRenderer.invoke('wubi:lookupCode', code) as Promise<WubiChar[]>,
    lookupWord: (word) => ipcRenderer.invoke('wubi:lookupWord', word) as Promise<WubiWord | null>,
    listCoreChars: (limit) =>
      ipcRenderer.invoke('wubi:listCoreChars', limit) as Promise<WubiChar[]>,
    listCoreWords: (limit) =>
      ipcRenderer.invoke('wubi:listCoreWords', limit) as Promise<WubiWord[]>,
  },
  sessions: {
    insert: (session, errors) =>
      ipcRenderer.invoke('sessions:insert', session, errors) as Promise<number>,
    list: (mode, limit) =>
      ipcRenderer.invoke('sessions:list', mode, limit) as Promise<PracticeSessionRecord[]>,
    errors: (sessionId) =>
      ipcRenderer.invoke('sessions:errors', sessionId) as Promise<SessionErrorRecord[]>,
    summary: (mode) => ipcRenderer.invoke('sessions:summary', mode) as Promise<SessionSummary>,
    delete: (id) => ipcRenderer.invoke('sessions:delete', id) as Promise<boolean>,
  },
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    loadAll: () => ipcRenderer.invoke('settings:loadAll') as Promise<AppSettingsValue>,
    saveAll: (s) => ipcRenderer.invoke('settings:saveAll', s),
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check') as Promise<UpdaterStatus>,
    download: () => ipcRenderer.invoke('updater:download') as Promise<UpdaterStatus>,
    install: () => ipcRenderer.invoke('updater:install'),
    onStatusChange: (cb) => {
      const listener = (_evt: unknown, status: UpdaterStatus): void => cb(status);
      ipcRenderer.on('updater:status', listener);
      return () => ipcRenderer.removeListener('updater:status', listener);
    },
  },
  app: {
    version: () => ipcRenderer.invoke('app:version') as Promise<string>,
    platform: () => ipcRenderer.invoke('app:platform') as Promise<NodeJS.Platform>,
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  (window as unknown as { electron: typeof electronAPI }).electron = electronAPI;
  (window as unknown as { api: ElectronAPI }).api = api;
}
