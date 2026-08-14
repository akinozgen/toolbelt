// AES-256-GCM authenticated encryption.
// Output combines nonce (12 bytes) + ciphertext + tag (16 bytes), all base64.

use aes_gcm::aead::{Aead, KeyInit, OsRng};
use aes_gcm::{AeadCore, Aes128Gcm, Aes256Gcm, Key, Nonce};
use base64::{engine::general_purpose::STANDARD, Engine};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Deserialize)]
pub struct AesEncryptOpts {
    pub plaintext: String,
    /// Either passphrase (hashed to 32 bytes via SHA-256 → AES-256-GCM)
    /// or raw key (hex/base64) — see `key_kind`.
    pub key: String,
    /// "passphrase" | "hex" | "base64"
    #[serde(default)]
    pub key_kind: Option<String>,
    /// 128 | 256
    #[serde(default)]
    pub bits: Option<u16>,
}

#[derive(Serialize)]
pub struct AesEncrypted {
    pub ciphertext: String,
    pub nonce: String,
    pub combined: String,
}

fn key_bytes(opts: &AesEncryptOpts) -> Result<Vec<u8>, String> {
    let target = match opts.bits.unwrap_or(256) {
        128 => 16,
        256 => 32,
        other => return Err(format!("AES bits must be 128 or 256; got {other}")),
    };
    let raw = match opts.key_kind.as_deref().unwrap_or("passphrase") {
        "passphrase" => {
            // Derive a deterministic key from passphrase via SHA-256.
            let digest = Sha256::digest(opts.key.as_bytes());
            digest.to_vec()
        }
        "hex"    => hex::decode(opts.key.trim()).map_err(|e| e.to_string())?,
        "base64" => STANDARD.decode(opts.key.trim()).map_err(|e| e.to_string())?,
        other    => return Err(format!("Unknown key_kind: {other}")),
    };
    if raw.len() < target {
        return Err(format!("Key too short: {} bytes; need {}", raw.len(), target));
    }
    Ok(raw[..target].to_vec())
}

#[tauri::command]
pub fn aes_encrypt(opts: AesEncryptOpts) -> Result<AesEncrypted, String> {
    let bits = opts.bits.unwrap_or(256);
    let key = key_bytes(&opts)?;
    let nonce_bytes = Aes256Gcm::generate_nonce(&mut OsRng);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ct = match bits {
        128 => {
            let cipher = Aes128Gcm::new(Key::<Aes128Gcm>::from_slice(&key));
            cipher.encrypt(nonce, opts.plaintext.as_bytes()).map_err(|e| e.to_string())?
        }
        256 => {
            let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key));
            cipher.encrypt(nonce, opts.plaintext.as_bytes()).map_err(|e| e.to_string())?
        }
        other => return Err(format!("AES bits must be 128 or 256; got {other}")),
    };
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ct);
    Ok(AesEncrypted {
        ciphertext: STANDARD.encode(&ct),
        nonce: STANDARD.encode(nonce_bytes.as_slice()),
        combined: STANDARD.encode(&combined),
    })
}

#[derive(Deserialize)]
pub struct AesDecryptOpts {
    /// base64 nonce(12) || ciphertext || tag(16) packed.
    pub combined: String,
    pub key: String,
    #[serde(default)]
    pub key_kind: Option<String>,
    #[serde(default)]
    pub bits: Option<u16>,
}

#[tauri::command]
pub fn aes_decrypt(opts: AesDecryptOpts) -> Result<String, String> {
    let bits = opts.bits.unwrap_or(256);
    let key = key_bytes(&AesEncryptOpts {
        plaintext: String::new(),
        key: opts.key.clone(),
        key_kind: opts.key_kind.clone(),
        bits: opts.bits,
    })?;
    let combined = STANDARD.decode(opts.combined.trim()).map_err(|e| e.to_string())?;
    if combined.len() < 12 + 16 {
        return Err("Combined payload too short.".into());
    }
    let (nonce_bytes, ct_and_tag) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    let plain = match bits {
        128 => {
            let cipher = Aes128Gcm::new(Key::<Aes128Gcm>::from_slice(&key));
            cipher.decrypt(nonce, ct_and_tag).map_err(|e| format!("Decryption failed: {e}"))?
        }
        256 => {
            let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key));
            cipher.decrypt(nonce, ct_and_tag).map_err(|e| format!("Decryption failed: {e}"))?
        }
        other => return Err(format!("AES bits must be 128 or 256; got {other}")),
    };
    String::from_utf8(plain).map_err(|e| e.to_string())
}
