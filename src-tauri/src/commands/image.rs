use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Serialize;
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[derive(Serialize)]
pub struct ImageEncoded {
    pub base64: String,
    pub mime: String,
    pub size_bytes: u64,
}

fn mime_from_path(path: &str) -> &'static str {
    let ext = path
        .rsplit('.')
        .next()
        .map(|s| s.to_ascii_lowercase())
        .unwrap_or_default();
    match ext.as_str() {
        "png"            => "image/png",
        "jpg" | "jpeg"   => "image/jpeg",
        "gif"            => "image/gif",
        "webp"           => "image/webp",
        "svg"            => "image/svg+xml",
        "bmp"            => "image/bmp",
        "ico"            => "image/x-icon",
        "avif"           => "image/avif",
        "tif" | "tiff"   => "image/tiff",
        "apng"           => "image/apng",
        _                => "application/octet-stream",
    }
}

#[tauri::command]
pub async fn image_to_base64(path: String) -> Result<ImageEncoded, String> {
    let mut file = File::open(&path).await.map_err(|e| e.to_string())?;
    let meta = file.metadata().await.map_err(|e| e.to_string())?;
    let size_bytes = meta.len();

    // Hard cap to keep IPC payload sane — base64 grows ~4/3, so 50 MB raw
    // becomes ~67 MB string. Anything bigger isn't a normal "image to embed"
    // case anyway.
    const MAX: u64 = 50 * 1024 * 1024;
    if size_bytes > MAX {
        return Err(format!(
            "Image is {} MB; limit is {} MB for base64 embedding.",
            size_bytes / (1024 * 1024),
            MAX / (1024 * 1024),
        ));
    }

    let mut bytes = Vec::with_capacity(size_bytes as usize);
    file.read_to_end(&mut bytes).await.map_err(|e| e.to_string())?;

    Ok(ImageEncoded {
        base64: STANDARD.encode(&bytes),
        mime: mime_from_path(&path).to_string(),
        size_bytes,
    })
}

/// Decode a base64 string and write it to `path`. Sidesteps tauri-plugin-fs
/// scope so the user can save to any path the OS save dialog returned.
#[tauri::command]
pub async fn save_base64_to_file(b64: String, path: String) -> Result<(), String> {
    let cleaned: String = b64.chars().filter(|c| !c.is_whitespace()).collect();
    let bytes = STANDARD.decode(&cleaned).map_err(|e| e.to_string())?;
    let mut file = File::create(&path).await.map_err(|e| e.to_string())?;
    file.write_all(&bytes).await.map_err(|e| e.to_string())?;
    file.flush().await.map_err(|e| e.to_string())?;
    Ok(())
}

/// Write arbitrary text to `path`. Used by Generate's QR/SVG save flows.
#[tauri::command]
pub async fn save_text_to_file(path: String, content: String) -> Result<(), String> {
    let mut file = File::create(&path).await.map_err(|e| e.to_string())?;
    file.write_all(content.as_bytes()).await.map_err(|e| e.to_string())?;
    file.flush().await.map_err(|e| e.to_string())?;
    Ok(())
}
