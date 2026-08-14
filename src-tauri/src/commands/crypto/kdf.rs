// Key derivation functions: bcrypt, argon2, pbkdf2.

use argon2::password_hash::{rand_core::OsRng, PasswordHasher, PasswordVerifier, SaltString};
use argon2::{Algorithm as Argon2Algorithm, Argon2, Params, Version};
use base64::{engine::general_purpose::STANDARD, Engine};
use pbkdf2::pbkdf2_hmac;
use serde::Deserialize;
use sha1::Sha1;
use sha2::{Sha256, Sha512};

#[derive(Deserialize)]
pub struct BcryptOpts {
    pub password: String,
    #[serde(default)]
    pub cost: Option<u32>,
}

#[tauri::command]
pub fn bcrypt_hash(opts: BcryptOpts) -> Result<String, String> {
    let cost = opts.cost.unwrap_or(10).clamp(4, 15);
    bcrypt::hash(opts.password, cost).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct BcryptVerifyOpts {
    pub password: String,
    pub hash: String,
}

#[tauri::command]
pub fn bcrypt_verify(opts: BcryptVerifyOpts) -> Result<bool, String> {
    bcrypt::verify(opts.password, &opts.hash).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct Argon2Opts {
    pub password: String,
    /// Memory cost in KiB. Default 19456 (~19 MB) — OWASP rec for argon2id.
    #[serde(default)]
    pub memory_kib: Option<u32>,
    /// Iterations. Default 2.
    #[serde(default)]
    pub iterations: Option<u32>,
    /// Parallelism. Default 1.
    #[serde(default)]
    pub parallelism: Option<u32>,
}

#[tauri::command]
pub fn argon2_hash(opts: Argon2Opts) -> Result<String, String> {
    let params = Params::new(
        opts.memory_kib.unwrap_or(19456),
        opts.iterations.unwrap_or(2),
        opts.parallelism.unwrap_or(1),
        None,
    )
    .map_err(|e| e.to_string())?;
    let argon = Argon2::new(Argon2Algorithm::Argon2id, Version::V0x13, params);
    let salt = SaltString::generate(&mut OsRng);
    argon
        .hash_password(opts.password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct Argon2VerifyOpts {
    pub password: String,
    pub hash: String,
}

#[tauri::command]
pub fn argon2_verify(opts: Argon2VerifyOpts) -> Result<bool, String> {
    let parsed = argon2::PasswordHash::new(&opts.hash).map_err(|e| e.to_string())?;
    Ok(Argon2::default()
        .verify_password(opts.password.as_bytes(), &parsed)
        .is_ok())
}

#[derive(Deserialize)]
pub struct Pbkdf2Opts {
    pub password: String,
    pub salt: String,
    /// "sha1" | "sha256" | "sha512"
    #[serde(default)]
    pub algorithm: Option<String>,
    /// Default 600_000 (OWASP 2023 for SHA-256).
    #[serde(default)]
    pub iterations: Option<u32>,
    /// Output key length in bytes. Default 32.
    #[serde(default)]
    pub key_length: Option<u32>,
    /// "hex" | "base64"
    #[serde(default)]
    pub format: Option<String>,
}

#[tauri::command]
pub fn pbkdf2_derive(opts: Pbkdf2Opts) -> Result<String, String> {
    let iter = opts.iterations.unwrap_or(600_000).max(1);
    let key_len = opts.key_length.unwrap_or(32).clamp(1, 256) as usize;
    let mut out = vec![0u8; key_len];
    let pwd = opts.password.as_bytes();
    let salt = opts.salt.as_bytes();
    match opts.algorithm.as_deref().unwrap_or("sha256") {
        "sha1"   => pbkdf2_hmac::<Sha1>(pwd, salt, iter, &mut out),
        "sha256" => pbkdf2_hmac::<Sha256>(pwd, salt, iter, &mut out),
        "sha512" => pbkdf2_hmac::<Sha512>(pwd, salt, iter, &mut out),
        other    => return Err(format!("Unknown algorithm: {other}")),
    }
    match opts.format.as_deref().unwrap_or("hex") {
        "hex"    => Ok(hex::encode(&out)),
        "base64" => Ok(STANDARD.encode(&out)),
        other    => Err(format!("Unknown format: {other}")),
    }
}
