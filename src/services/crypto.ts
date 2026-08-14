import { invoke } from '@tauri-apps/api/core';

export interface BcryptOpts { password: string; cost?: number }
export interface BcryptVerifyOpts { password: string; hash: string }
export interface Argon2Opts {
  password: string;
  memory_kib?: number;
  iterations?: number;
  parallelism?: number;
}
export interface Argon2VerifyOpts { password: string; hash: string }
export interface Pbkdf2Opts {
  password: string;
  salt: string;
  algorithm?: 'sha1' | 'sha256' | 'sha512';
  iterations?: number;
  key_length?: number;
  format?: 'hex' | 'base64';
}
export interface HmacOpts {
  message: string;
  key: string;
  algorithm?: 'sha1' | 'sha256' | 'sha384' | 'sha512';
  format?: 'hex' | 'base64';
}
export interface AesEncryptOpts {
  plaintext: string;
  key: string;
  key_kind?: 'passphrase' | 'hex' | 'base64';
  bits?: 128 | 256;
}
export interface AesEncrypted {
  ciphertext: string;
  nonce: string;
  combined: string;
}
export interface AesDecryptOpts {
  combined: string;
  key: string;
  key_kind?: 'passphrase' | 'hex' | 'base64';
  bits?: 128 | 256;
}
export interface TotpOpts {
  secret: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: 6 | 8;
  period?: number;
}
export interface TotpResult { code: string; remaining_seconds: number; period: number }
export interface StrengthResult {
  score: number;
  label: string;
  guesses: number;
  guesses_log10: number;
  crack_time_online_throttling: string;
  crack_time_offline_fast: string;
  feedback_warning: string;
  feedback_suggestions: string[];
}

export const bcrypt = {
  hash:   (opts: BcryptOpts)       => invoke<string>('bcrypt_hash', { opts }),
  verify: (opts: BcryptVerifyOpts) => invoke<boolean>('bcrypt_verify', { opts }),
};
export const argon2 = {
  hash:   (opts: Argon2Opts)       => invoke<string>('argon2_hash', { opts }),
  verify: (opts: Argon2VerifyOpts) => invoke<boolean>('argon2_verify', { opts }),
};
export const pbkdf2 = {
  derive: (opts: Pbkdf2Opts) => invoke<string>('pbkdf2_derive', { opts }),
};
export const hmac = {
  sign: (opts: HmacOpts) => invoke<string>('hmac_sign', { opts }),
};
export const aes = {
  encrypt: (opts: AesEncryptOpts) => invoke<AesEncrypted>('aes_encrypt', { opts }),
  decrypt: (opts: AesDecryptOpts) => invoke<string>('aes_decrypt', { opts }),
};
export const totp = {
  compute: (opts: TotpOpts) => invoke<TotpResult>('totp_compute', { opts }),
};
export const strength = {
  check: (password: string) => invoke<StrengthResult>('password_strength', { password }),
};
