export {};

interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
}

interface FileSystemAPI {
  homedir(): string;
  homedirAsync(): Promise<string>;
  join(...parts: string[]): string;
  sep: string;
  exists(p: string): boolean;
  existsAsync(p: string): Promise<boolean>;
  mkdir(p: string): void;
  readDir(p: string): FileEntry[];
  readDirAsync(p: string): Promise<FileEntry[]>;
  readDirWithStats(p: string): Promise<(FileEntry & { size: number; mtimeMs: number })[]>;
  statAsync(p: string): Promise<{ size: number; mtimeMs: number }>;
  readFile(p: string): string;
  writeFile(p: string, content: string): void;
  rename(oldPath: string, newPath: string): void;
  unlink(p: string): void;
  rmdir(p: string): void;
}

declare global {
  interface Window {
    fs: typeof import('fs');
    fileSystem: FileSystemAPI;
    ipcRenderer: import('electron').IpcRenderer;
    platform: string;
    removeLoading: () => void;
    eStore: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: any) => Promise<void>;
      delete: (key: string) => Promise<void>;
      has: (key: string) => Promise<boolean>;
    };
  }
}
