import { invoke } from '@tauri-apps/api/core';

export type HashAlgo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

export type HashInput =
  | { kind: 'text'; value: string }
  | { kind: 'bytes'; value: Uint8Array }
  | { kind: 'path'; value: string };

export async function computeHash(algo: HashAlgo, input: HashInput): Promise<string> {
  switch (input.kind) {
    case 'text':
      return invoke<string>('hash_text', { algo, text: input.value });
    case 'bytes':
      return invoke<string>('hash_bytes', { algo, bytes: Array.from(input.value) });
    case 'path':
      return invoke<string>('hash_file', { algo, path: input.value });
  }
}
