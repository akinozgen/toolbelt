use digest::Digest;
use md5::Md5;
use sha1::Sha1;
use sha2::{Sha256, Sha512};
use tokio::fs::File;
use tokio::io::AsyncReadExt;

fn digest_bytes(algo: &str, bytes: &[u8]) -> Result<String, String> {
    match algo {
        "MD5" => Ok(hex::encode(Md5::digest(bytes))),
        "SHA-1" => Ok(hex::encode(Sha1::digest(bytes))),
        "SHA-256" => Ok(hex::encode(Sha256::digest(bytes))),
        "SHA-512" => Ok(hex::encode(Sha512::digest(bytes))),
        other => Err(format!("Unsupported algorithm: {other}")),
    }
}

#[tauri::command]
pub fn hash_text(algo: String, text: String) -> Result<String, String> {
    digest_bytes(&algo, text.as_bytes())
}

#[tauri::command]
pub fn hash_bytes(algo: String, bytes: Vec<u8>) -> Result<String, String> {
    digest_bytes(&algo, &bytes)
}

async fn stream_hash<D: Digest + Default>(path: &str) -> Result<String, String> {
    let mut file = File::open(path).await.map_err(|e| e.to_string())?;
    let mut hasher = D::default();
    let mut buf = vec![0u8; 64 * 1024];
    loop {
        let n = file.read(&mut buf).await.map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(hex::encode(hasher.finalize()))
}

#[tauri::command]
pub async fn hash_file(algo: String, path: String) -> Result<String, String> {
    match algo.as_str() {
        "MD5" => stream_hash::<Md5>(&path).await,
        "SHA-1" => stream_hash::<Sha1>(&path).await,
        "SHA-256" => stream_hash::<Sha256>(&path).await,
        "SHA-512" => stream_hash::<Sha512>(&path).await,
        other => Err(format!("Unsupported algorithm: {other}")),
    }
}
