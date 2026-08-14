use base64::{
    engine::general_purpose::{STANDARD, URL_SAFE_NO_PAD},
    Engine,
};
use rand::{Rng, RngCore};
use rsa::pkcs8::{EncodePrivateKey, EncodePublicKey, LineEnding};
use rsa::{RsaPrivateKey, RsaPublicKey};
use serde::{Deserialize, Serialize};

const LOWER:   &str = "abcdefghijklmnopqrstuvwxyz";
const UPPER:   &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGIT:   &str = "0123456789";
const SYMBOL:  &str = "!@#$%^&*()-_=+[]{}|;:,.<>?/";
const SIMILAR: &[char] = &['I', 'l', '1', '0', 'O', 'o'];

#[derive(Deserialize, Default)]
pub struct SecretOpts {
    #[serde(default)]
    pub length: Option<u16>,
    #[serde(default)]
    pub lower: Option<bool>,
    #[serde(default)]
    pub upper: Option<bool>,
    #[serde(default)]
    pub digit: Option<bool>,
    #[serde(default)]
    pub symbol: Option<bool>,
    #[serde(default)]
    pub exclude_similar: Option<bool>,
    #[serde(default)]
    pub custom: Option<String>,
    #[serde(default)]
    pub format: Option<String>,
    #[serde(default)]
    pub bits: Option<u16>,
}

#[tauri::command]
pub fn generate_secret(kind: String, opts: Option<SecretOpts>) -> Result<String, String> {
    let opts = opts.unwrap_or_default();
    match kind.as_str() {
        "password" => generate_password(&opts),
        "random"   => generate_random(&opts),
        "aes-key"  => generate_aes_key(&opts),
        other => Err(format!("Unknown secret kind: {other}")),
    }
}

fn generate_password(o: &SecretOpts) -> Result<String, String> {
    let len = o.length.unwrap_or(20).clamp(1, 256) as usize;
    let exclude_similar = o.exclude_similar.unwrap_or(false);

    let mut alphabet: Vec<char> = if let Some(custom) = o.custom.as_deref().filter(|s| !s.is_empty()) {
        custom.chars().collect()
    } else {
        let mut s = String::new();
        if o.lower.unwrap_or(true)   { s.push_str(LOWER); }
        if o.upper.unwrap_or(true)   { s.push_str(UPPER); }
        if o.digit.unwrap_or(true)   { s.push_str(DIGIT); }
        if o.symbol.unwrap_or(false) { s.push_str(SYMBOL); }
        s.chars().collect()
    };

    if exclude_similar {
        alphabet.retain(|c| !SIMILAR.contains(c));
    }
    if alphabet.is_empty() {
        return Err("Character set is empty.".into());
    }

    let mut rng = rand::thread_rng();
    let pwd: String = (0..len)
        .map(|_| alphabet[rng.gen_range(0..alphabet.len())])
        .collect();
    Ok(pwd)
}

fn generate_random(o: &SecretOpts) -> Result<String, String> {
    let len = o.length.unwrap_or(32).clamp(1, 1024) as usize;
    let mut bytes = vec![0u8; len];
    rand::thread_rng().fill_bytes(&mut bytes);
    let format = o.format.as_deref().unwrap_or("hex");
    match format {
        "hex"       => Ok(hex::encode(&bytes)),
        "base64"    => Ok(STANDARD.encode(&bytes)),
        "base64url" => Ok(URL_SAFE_NO_PAD.encode(&bytes)),
        other       => Err(format!("Unknown format: {other}")),
    }
}

fn generate_aes_key(o: &SecretOpts) -> Result<String, String> {
    let bits = o.bits.unwrap_or(256);
    let len = match bits {
        128 => 16,
        192 => 24,
        256 => 32,
        _   => return Err(format!("AES bits must be 128/192/256, got {bits}")),
    };
    let mut bytes = vec![0u8; len];
    rand::thread_rng().fill_bytes(&mut bytes);
    let format = o.format.as_deref().unwrap_or("hex");
    match format {
        "hex"    => Ok(hex::encode(&bytes)),
        "base64" => Ok(STANDARD.encode(&bytes)),
        other    => Err(format!("Unknown format: {other}")),
    }
}

#[derive(Serialize)]
pub struct RsaKeyPair {
    pub private_pem: String,
    pub public_pem: String,
    pub bits: u32,
    pub elapsed_ms: u128,
}

#[tauri::command]
pub async fn generate_rsa_keypair(bits: u32) -> Result<RsaKeyPair, String> {
    if !matches!(bits, 2048 | 3072 | 4096) {
        return Err(format!("RSA bits must be 2048, 3072 or 4096; got {bits}"));
    }
    // RSA generation is CPU-bound (seconds at 4096) — run on blocking pool.
    tokio::task::spawn_blocking(move || -> Result<RsaKeyPair, String> {
        let started = std::time::Instant::now();
        let mut rng = rand::thread_rng();
        let private = RsaPrivateKey::new(&mut rng, bits as usize)
            .map_err(|e| e.to_string())?;
        let public = RsaPublicKey::from(&private);
        let private_pem = private
            .to_pkcs8_pem(LineEnding::LF)
            .map_err(|e| e.to_string())?
            .to_string();
        let public_pem = public
            .to_public_key_pem(LineEnding::LF)
            .map_err(|e| e.to_string())?;
        Ok(RsaKeyPair {
            private_pem,
            public_pem,
            bits,
            elapsed_ms: started.elapsed().as_millis(),
        })
    })
    .await
    .map_err(|e| e.to_string())?
}
