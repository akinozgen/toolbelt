import os from 'os'
import path from 'path'
import {app, BrowserWindow} from 'electron'

const isWin7 = os.release().startsWith('6.1')
if (isWin7) app.disableHardwareAcceleration()

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

let win: BrowserWindow | null = null

async function bootstrap() {
    win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.cjs'),
        },
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        frame: false,
        minWidth: 400,
        minHeight: 500,
        alwaysOnTop: true,
        titleBarOverlay: false,
        vibrancy: 'dark',
    })

    if (process.platform !== 'darwin') {
        const ElectronAcrylicWindow = require('electron-acrylic-window');
        
        ElectronAcrylicWindow.setVibrancy(win, {
            theme: 'dark',
            effect: 'acrylic',
            maximumRefreshRate: 30
        });
    }

    if (app.isPackaged) {
        win.loadFile(path.join(__dirname, '../renderer/index.html'))
    } else {
        const pkg = await import('../../package.json')
        const url = `http://${pkg.env.HOST || '127.0.0.1'}:${pkg.env.PORT}`

        win.loadURL(url)
        // win.maximize()
        win.webContents.openDevTools()
    }
}

app.whenReady().then(bootstrap)

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('second-instance', () => {
    if (win) {
        // someone tried to run a second instance, we should focus our window.
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

// @TODO
// auto update
/* if (app.isPackaged) {
  app.whenReady()
    .then(() => import('electron-updater'))
    .then(({ autoUpdater }) => autoUpdater.checkForUpdatesAndNotify())
    .catch((e) =>
      // maybe you need to record some log files.
      console.error('Failed check update:', e)
    )
} */
