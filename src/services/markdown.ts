import { invoke } from '@tauri-apps/api/core';

export async function render(source: string): Promise<string> {
  if (!source) return '';
  return invoke<string>('render_markdown', { source });
}
