import { invoke } from '@tauri-apps/api/core';

export type EncoderAlgo = 'Base64' | 'Base64url' | 'URL' | 'Hex' | 'JWT' | 'Image';
export type EncodeMode = 'encode' | 'decode';

export interface ImageEncoded {
  base64: string;
  mime: string;
  size_bytes: number;
}

export async function imageToBase64(path: string): Promise<ImageEncoded> {
  return invoke<ImageEncoded>('image_to_base64', { path });
}

export async function saveBase64ToFile(b64: string, path: string): Promise<void> {
  return invoke<void>('save_base64_to_file', { b64, path });
}

interface JwtParts {
  header: unknown;
  payload: unknown;
  signature: string;
}

export async function convert(algo: EncoderAlgo, mode: EncodeMode, input: string): Promise<string> {
  if (algo === 'JWT') {
    if (mode === 'decode') {
      const parts = await invoke<JwtParts>('jwt_decode', { token: input });
      return JSON.stringify(parts, null, 2);
    }
    const data = JSON.parse(input.trim());
    return invoke<string>('jwt_encode', {
      parts: {
        header: data.header,
        payload: data.payload,
        signature: data.signature ?? '',
      },
    });
  }

  const cmd =
    algo === 'Base64' ? 'encode_base64'
    : algo === 'Base64url' ? 'encode_base64url'
    : algo === 'URL' ? 'encode_url'
    : 'encode_hex';

  return invoke<string>(cmd, { mode, input });
}
