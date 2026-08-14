use base64::{engine::general_purpose::STANDARD, Engine};
use hmac::{Hmac, Mac};
use serde::Deserialize;
use sha1::Sha1;
use sha2::{Sha256, Sha384, Sha512};

#[derive(Deserialize)]
pub struct HmacOpts {
    pub message: String,
    pub key: String,
    /// "sha1" | "sha256" | "sha384" | "sha512"
    #[serde(default)]
    pub algorithm: Option<String>,
    /// "hex" | "base64"
    #[serde(default)]
    pub format: Option<String>,
}

#[tauri::command]
pub fn hmac_sign(opts: HmacOpts) -> Result<String, String> {
    let alg = opts.algorithm.as_deref().unwrap_or("sha256");
    let bytes = match alg {
        "sha1" => {
            let mut m = Hmac::<Sha1>::new_from_slice(opts.key.as_bytes())
                .map_err(|e| e.to_string())?;
            m.update(opts.message.as_bytes());
            m.finalize().into_bytes().to_vec()
        }
        "sha256" => {
            let mut m = Hmac::<Sha256>::new_from_slice(opts.key.as_bytes())
                .map_err(|e| e.to_string())?;
            m.update(opts.message.as_bytes());
            m.finalize().into_bytes().to_vec()
        }
        "sha384" => {
            let mut m = Hmac::<Sha384>::new_from_slice(opts.key.as_bytes())
                .map_err(|e| e.to_string())?;
            m.update(opts.message.as_bytes());
            m.finalize().into_bytes().to_vec()
        }
        "sha512" => {
            let mut m = Hmac::<Sha512>::new_from_slice(opts.key.as_bytes())
                .map_err(|e| e.to_string())?;
            m.update(opts.message.as_bytes());
            m.finalize().into_bytes().to_vec()
        }
        other => return Err(format!("Unknown algorithm: {other}")),
    };
    match opts.format.as_deref().unwrap_or("hex") {
        "hex"    => Ok(hex::encode(&bytes)),
        "base64" => Ok(STANDARD.encode(&bytes)),
        other    => Err(format!("Unknown format: {other}")),
    }
}
