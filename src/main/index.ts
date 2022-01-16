import os from 'os';
import path from 'path';
import { app, BrowserWindow, session, ipcMain } from 'electron';
import { startAvd } from './src/getAndroidAVDS';

const isWin7 = os.release().startsWith('6.1');
if (isWin7) app.disableHardwareAcceleration();

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;

async function bootstrap() {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs')
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    frame: false,
    minWidth: 400,
    minHeight: 640,
    titleBarOverlay: false,
    vibrancy: 'dark',
    width: 815
  });

  if (process.platform === 'win32') {
    const ElectronAcrylicWindow = require('electron-acrylic-window');

    ElectronAcrylicWindow.setVibrancy(win, {
      theme: 'dark',
      effect: 'acrylic',
      maximumRefreshRate: 60
    });
  }

  win.setMenu(null);

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  } else {
    const url = `http://127.0.0.1:8000`;

    win.loadURL(url);
    win.webContents.openDevTools();
  }
}

app.on('ready', function (e) {
  const filter = {
    urls: ['*://*.steampowered.com/*']
  };
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    details.requestHeaders['Origin'] = 'http://example.com/*';
    callback({ requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    if (!details?.responseHeaders) {
      details.responseHeaders = {};
    }
    details.responseHeaders['access-control-allow-origin'] = ['http://127.0.0.1:8000'];
    callback({ responseHeaders: details.responseHeaders });
  });
});

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('second-instance', () => {
  if (win) {
    // someone tried to run a second instance, we should focus our window.
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

ipcMain.on('start_avd', function (e, avdName) {
  startAvd(avdName);
});
