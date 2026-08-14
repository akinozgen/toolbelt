import { invoke } from '@tauri-apps/api/core';

// ── Identifiers ─────────────────────────────────────────────────────
export interface NanoIdOpts { length?: number; alphabet?: string }
export interface Cuid2Opts  { cuid_length?: number }

export const id = {
  uuidV4:    () => invoke<string>('generate_id', { kind: 'uuid-v4'   }),
  uuidV7:    () => invoke<string>('generate_id', { kind: 'uuid-v7'   }),
  ulid:      () => invoke<string>('generate_id', { kind: 'ulid'      }),
  nanoid:    (opts: NanoIdOpts = {}) =>
              invoke<string>('generate_id', { kind: 'nanoid', opts }),
  snowflake: () => invoke<string>('generate_id', { kind: 'snowflake' }),
  cuid2:     (opts: Cuid2Opts = {}) =>
              invoke<string>('generate_id', { kind: 'cuid2',  opts }),
};

// ── Secrets ─────────────────────────────────────────────────────────
export type ByteFormat = 'hex' | 'base64' | 'base64url';

export interface PasswordOpts {
  length?: number;
  lower?: boolean;
  upper?: boolean;
  digit?: boolean;
  symbol?: boolean;
  exclude_similar?: boolean;
  custom?: string;
}
export interface RandomOpts { length?: number; format?: ByteFormat }
export interface AesOpts    { bits?: 128 | 192 | 256; format?: 'hex' | 'base64' }

export interface RsaKeyPair {
  private_pem: string;
  public_pem: string;
  bits: number;
  elapsed_ms: number;
}

export const secret = {
  password:    (opts: PasswordOpts = {}) =>
                invoke<string>('generate_secret', { kind: 'password', opts }),
  randomBytes: (opts: RandomOpts = {})   =>
                invoke<string>('generate_secret', { kind: 'random',   opts }),
  aesKey:      (opts: AesOpts = {})      =>
                invoke<string>('generate_secret', { kind: 'aes-key',  opts }),
  rsaKeyPair:  (bits: 2048 | 3072 | 4096) =>
                invoke<RsaKeyPair>('generate_rsa_keypair', { bits }),
};

// ── Content ─────────────────────────────────────────────────────────
export interface LoremOpts {
  kind?: 'paragraphs' | 'sentences' | 'words';
  count?: number;
  start_classic?: boolean;
}
export interface PlaceholderOpts {
  width: number;
  height: number;
  bg?: string;
  fg?: string;
  text?: string;
}

export const content = {
  lorem:           (opts: LoremOpts = {}) =>
                    invoke<string>('generate_lorem', { opts }),
  placeholderSvg:  (opts: PlaceholderOpts) =>
                    invoke<string>('generate_placeholder_svg', { opts }),
};

// ── QR ──────────────────────────────────────────────────────────────
export interface QrGenOpts {
  content: string;
  ecc?: 'L' | 'M' | 'Q' | 'H';
  module_size?: number;
  fg?: string;
  bg?: string;
}

export const qr = {
  generate: (opts: QrGenOpts) =>
             invoke<string>('qr_generate', { opts }),
  read:     (path: string) =>
             invoke<string[]>('qr_read', { path }),
};

// ── Time ────────────────────────────────────────────────────────────
export interface TimeNow {
  unix_seconds: number;
  unix_millis: number;
  iso8601: string;
  rfc3339: string;
  rfc2822: string;
  local_iso: string;
  utc_offset_minutes: number;
}
export type TimeFormat = 'unix-s' | 'unix-ms' | 'iso8601' | 'rfc3339' | 'rfc2822';

export const time = {
  now:     () => invoke<TimeNow>('time_now'),
  convert: (input: string, format: TimeFormat) =>
            invoke<string>('time_convert', { opts: { input, format } }),
};

// ── Network ─────────────────────────────────────────────────────────
export type Ipv4Kind = 'any' | 'private' | 'public';
export interface MacOpts {
  separator?: ':' | '-';
  uppercase?: boolean;
  locally_administered?: boolean;
}
export interface UaOpts {
  browser?: 'any' | 'Chrome' | 'Firefox' | 'Safari' | 'Edge';
  os?: 'any' | 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS';
}

export const network = {
  ipv4: (kind: Ipv4Kind = 'any') =>
         invoke<string>('generate_ipv4', { opts: { kind } }),
  ipv6: () => invoke<string>('generate_ipv6'),
  mac:  (opts: MacOpts = {}) =>
         invoke<string>('generate_mac', { opts }),
  ua:   (opts: UaOpts = {}) =>
         invoke<string>('generate_ua', { opts }),
};

// ── Save helpers ────────────────────────────────────────────────────
export async function saveText(path: string, content: string): Promise<void> {
  return invoke<void>('save_text_to_file', { path, content });
}
