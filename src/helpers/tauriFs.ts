import {
  readDir,
  stat,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
  rename,
  remove,
} from '@tauri-apps/plugin-fs';
import { homeDir } from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';

/** Cross-platform path join that avoids async overhead for simple concatenation. */
export function joinPath(dir: string, ...parts: string[]): string {
  const sep = dir.includes('\\') ? '\\' : '/';
  let result = dir.endsWith(sep) ? dir.slice(0, -1) : dir;
  for (const part of parts) {
    const p = part.startsWith(sep) ? part.slice(1) : part;
    result = `${result}${sep}${p}`;
  }
  return result;
}

export const tauriFs = {
  async homedir(): Promise<string> {
    return homeDir();
  },

  async exists(p: string): Promise<boolean> {
    return exists(p);
  },

  async mkdir(p: string): Promise<void> {
    await mkdir(p, { recursive: true });
  },

  async readDir(p: string): Promise<{ name: string; path: string; isDir: boolean }[]> {
    const entries = await readDir(p);
    return entries
      .map(e => ({ name: e.name, path: joinPath(p, e.name), isDir: e.isDirectory }))
      .sort((a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name)));
  },

  async readDirWithStats(
    p: string
  ): Promise<{ name: string; path: string; isDir: boolean; size: number; mtimeMs: number }[]> {
    const entries = await readDir(p);
    return Promise.all(
      entries.map(async e => {
        const fullPath = joinPath(p, e.name);
        let size = 0;
        let mtimeMs = 0;
        try {
          const s = await stat(fullPath);
          size = s.size;
          mtimeMs = s.mtime ? new Date(s.mtime).getTime() : 0;
        } catch {
          // ignore stat errors for inaccessible entries
        }
        return { name: e.name, path: fullPath, isDir: e.isDirectory, size, mtimeMs };
      })
    );
  },

  async readFile(p: string): Promise<string> {
    return readTextFile(p);
  },

  async writeFile(p: string, content: string): Promise<void> {
    return writeTextFile(p, content);
  },

  async rename(oldPath: string, newPath: string): Promise<void> {
    return rename(oldPath, newPath);
  },

  async unlink(p: string): Promise<void> {
    return remove(p);
  },

  async rmdir(p: string): Promise<void> {
    return remove(p, { recursive: true });
  },
};

export async function getPlatform(): Promise<string> {
  return platform();
}
