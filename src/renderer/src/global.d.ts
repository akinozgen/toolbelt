import { ILibraryFolders } from 'get-installed-steam-apps/interfaces';
import { IAVD } from '../../main/src/getAndroidAVDS';

export {};

declare global {
  interface Window {
    fs: typeof import('fs');
    ipcRenderer: import('electron').IpcRenderer;
    platform: string;
    steamLibrary: () => Promise<ILibraryFolders>;
    removeLoading: () => void;
    androidVirtualDevices: () => IAVD[];
  }
}
