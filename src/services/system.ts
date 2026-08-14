import { invoke } from '@tauri-apps/api/core';

export interface SystemInfo {
  cpu_cores: number;
  os: string;
  arch: string;
}

let _cached: SystemInfo | null = null;

export async function getSystemInfo(): Promise<SystemInfo> {
  if (_cached) return _cached;
  _cached = await invoke<SystemInfo>('get_system_info');
  return _cached;
}
