import fs from 'fs';
import { contextBridge, ipcRenderer, IpcRenderer } from 'electron';
import { domReady } from './utils';
import { useLoading } from './loading';
import loadSteamApps, { mapLibraryToGameInfo } from 'get-installed-steam-apps';
import getAndroidAVDS, { IAVD } from '../main/src/getAndroidAVDS';

const isDev = process.env.NODE_ENV === 'development';
const { removeLoading, appendLoading } = useLoading();

domReady().then(() => {
  appendLoading();
});

// --------- Expose some API to Renderer process. ---------
contextBridge.exposeInMainWorld('fs', fs);
contextBridge.exposeInMainWorld('removeLoading', removeLoading);
contextBridge.exposeInMainWorld('ipcRenderer', {
  ...ipcRenderer,
  // `exposeInMainWorld` will not expose attribute and mothods from the prototype
  on(...args: Parameters<IpcRenderer['on']>) {
    return ipcRenderer.on(...args);
  }
});

contextBridge.exposeInMainWorld('platform', process.platform);
contextBridge.exposeInMainWorld('steamLibrary', async function () {
  const steamLibrary = loadSteamApps();
  return await mapLibraryToGameInfo(steamLibrary);
});
contextBridge.exposeInMainWorld('androidVirtualDevices', function (): IAVD[] {
  return getAndroidAVDS();
});
