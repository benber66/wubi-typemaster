import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

const api = {
  // 占位：后续暴露数据库 / 统计 / 更新 IPC
  ping: () => ipcRenderer.invoke('app:ping'),
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error - fallback
  window.electron = electronAPI;
  // @ts-expect-error - fallback
  window.api = api;
}
