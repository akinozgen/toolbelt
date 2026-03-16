import path from 'path';
import fs from 'fs';
import os from 'os';
import electron, { app, BrowserWindow, ipcMain } from 'electron';
import Store from 'electron-store';

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const eStore = new Store({ name: 'toolbelt' });

async function bootstrap() {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      sandbox: false
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    frame: false,
    minWidth: 1280,
    minHeight: 800,
    titleBarOverlay: false,
    backgroundColor: '#00000000',
    ...(process.platform === 'darwin' ? { vibrancy: 'dark' } : {}),
    ...(process.platform === 'win32'  ? { backgroundMaterial: 'acrylic' } : {}),
    width: 815
  });

  win.setMenu(null);

  // Keep acrylic; color consistency is handled by unified UI overlay

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  } else {
    win.loadURL(`http://127.0.0.1:8000`);
    win.webContents.openDevTools();
  }
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// ── Window controls ──────────────────────────────────────────────────
ipcMain.on('window_minimize', () => win?.minimize());
ipcMain.on('window_maximize', () => {
  win?.isMaximized() ? win.unmaximize() : win?.maximize();
});
ipcMain.on('window_close', () => win?.close());

// ─── Electron Store IPC ──────────────────────────────────────────────
ipcMain.handle('estore:get', (_e, key: string) => eStore.get(key));
ipcMain.handle('estore:set', (_e, key: string, value: any) => eStore.set(key, value));
ipcMain.handle('estore:delete', (_e, key: string) => eStore.delete(key));
ipcMain.handle('estore:has', (_e, key: string) => eStore.has(key));

// ─── File System IPC (read-only) ─────────────────────────────────────
ipcMain.handle('fs:homedir', () => os.homedir());
ipcMain.handle('fs:exists', (_e, p: string) => fs.existsSync(p));
ipcMain.handle('fs:readDir', async (_e, p: string) => {
  const entries = await fs.promises.readdir(p, { withFileTypes: true });
  return entries
    .map(e => ({ name: e.name, path: path.join(p, e.name), isDir: e.isDirectory() }))
    .sort((a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name)));
});
ipcMain.handle('fs:readDirWithStats', async (_e, p: string) => {
  const entries = await fs.promises.readdir(p, { withFileTypes: true });
  const mapped = entries.map(e => ({
    name: e.name,
    path: path.join(p, e.name),
    isDir: e.isDirectory(),
  }));
  const maxConcurrency = 64;
  let idx = 0;
  const results: { name: string; path: string; isDir: boolean; size: number; mtimeMs: number }[] = new Array(mapped.length);

  const worker = async () => {
    while (idx < mapped.length) {
      const i = idx++;
      const entry = mapped[i];
      try {
        const stat = await fs.promises.stat(entry.path);
        results[i] = { ...entry, size: stat.size, mtimeMs: stat.mtimeMs };
      } catch {
        results[i] = { ...entry, size: 0, mtimeMs: 0 };
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(maxConcurrency, mapped.length) }, worker));
  return results.sort((a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name)));
});
ipcMain.handle('fs:stat', async (_e, p: string) => {
  const stat = await fs.promises.stat(p);
  return { size: stat.size, mtimeMs: stat.mtimeMs };
});
