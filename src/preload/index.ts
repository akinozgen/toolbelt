import fs from 'fs';
import os from 'os';
import { contextBridge, ipcRenderer, IpcRenderer } from 'electron';
import { domReady } from './utils';
import { useLoading } from './loading';
import * as path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const { removeLoading, appendLoading } = useLoading();

domReady().then(() => {
  appendLoading();
});

// --------- Expose some API to Renderer process. ---------
contextBridge.exposeInMainWorld('fs', fs);
contextBridge.exposeInMainWorld('removeLoading', removeLoading);
contextBridge.exposeInMainWorld('ipcRenderer', {
  // prototype methods must be explicitly bound — spread doesn't copy them
  send(...args: Parameters<IpcRenderer['send']>) {
    return ipcRenderer.send(...args);
  },
  on(...args: Parameters<IpcRenderer['on']>) {
    return ipcRenderer.on(...args);
  },
  removeListener(...args: Parameters<IpcRenderer['removeListener']>) {
    return ipcRenderer.removeListener(...args);
  }
});

contextBridge.exposeInMainWorld('platform', process.platform);

// ─── File system helpers (plain objects — contextBridge-safe) ─────────
contextBridge.exposeInMainWorld('fileSystem', {
  homedir(): string {
    return os.homedir();
  },
  homedirAsync(): Promise<string> {
    return ipcRenderer.invoke('fs:homedir');
  },
  join(...parts: string[]): string {
    return path.join(...parts);
  },
  sep: path.sep,
  exists(p: string): boolean {
    return fs.existsSync(p);
  },
  existsAsync(p: string): Promise<boolean> {
    return ipcRenderer.invoke('fs:exists', p);
  },
  mkdir(p: string): void {
    fs.mkdirSync(p, { recursive: true });
  },
  readDir(p: string): { name: string; path: string; isDir: boolean }[] {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    return entries
      .map(e => ({ name: e.name, path: path.join(p, e.name), isDir: e.isDirectory() }))
      .sort((a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name)));
  },
  async readDirAsync(p: string): Promise<{ name: string; path: string; isDir: boolean }[]> {
    return ipcRenderer.invoke('fs:readDir', p);
  },
  async readDirWithStats(p: string): Promise<{ name: string; path: string; isDir: boolean; size: number; mtimeMs: number }[]> {
    return ipcRenderer.invoke('fs:readDirWithStats', p);
  },
  async statAsync(p: string): Promise<{ size: number; mtimeMs: number }> {
    return ipcRenderer.invoke('fs:stat', p);
  },
  readFile(p: string): string {
    return fs.readFileSync(p, 'utf-8');
  },
  writeFile(p: string, content: string): void {
    fs.writeFileSync(p, content, 'utf-8');
  },
  rename(oldPath: string, newPath: string): void {
    fs.renameSync(oldPath, newPath);
  },
  unlink(p: string): void {
    fs.unlinkSync(p);
  },
  rmdir(p: string): void {
    fs.rmSync(p, { recursive: true, force: true });
  },
});

contextBridge.exposeInMainWorld('eStore', {
  get(key: string) {
    return ipcRenderer.invoke('estore:get', key);
  },
  set(key: string, value: any) {
    return ipcRenderer.invoke('estore:set', key, value);
  },
  delete(key: string) {
    return ipcRenderer.invoke('estore:delete', key);
  },
  has(key: string) {
    return ipcRenderer.invoke('estore:has', key);
  },
});
