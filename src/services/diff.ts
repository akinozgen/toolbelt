import { invoke } from '@tauri-apps/api/core';

export async function unifiedPatch(
  left: string,
  right: string,
  context: number,
  nameA = 'original.txt',
  nameB = 'modified.txt',
): Promise<string> {
  return invoke<string>('diff_unified_patch', {
    left,
    right,
    context,
    nameA,
    nameB,
  });
}
