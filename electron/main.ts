import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { ensureSeeded, ensureUserDataDir, getDatabase } from './ipc/db';
import { registerWubiIpc } from './ipc/wubi';
import { registerSessionIpc } from './ipc/sessions';
import { registerSettingsIpc } from './ipc/settings';
import { registerUpdaterIpc } from './ipc/updater';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'WubiTypeMaster',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function registerIpc(): void {
  ipcMain.handle('app:ping', () => `pong from electron ${app.getVersion()}`);
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:platform', () => process.platform);

  registerWubiIpc();
  registerSessionIpc();
  registerSettingsIpc();
  registerUpdaterIpc(() => mainWindow);
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('cc.wubi.typemaster');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  await ensureUserDataDir();
  getDatabase(); // 初始化 + 自动迁移
  try {
    await ensureSeeded();
  } catch (e) {
    console.warn('[seed] Skipped:', (e as Error).message);
  }

  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
