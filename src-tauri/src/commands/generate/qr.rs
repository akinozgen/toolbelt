use qrcode::render::svg;
use qrcode::{EcLevel, QrCode};
use rqrr::PreparedImage;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct QrGenOpts {
    pub content: String,
    /// "L" | "M" | "Q" | "H"
    #[serde(default)]
    pub ecc: Option<String>,
    #[serde(default)]
    pub module_size: Option<u32>,
    #[serde(default)]
    pub fg: Option<String>,
    #[serde(default)]
    pub bg: Option<String>,
}

#[tauri::command]
pub fn qr_generate(opts: QrGenOpts) -> Result<String, String> {
    if opts.content.is_empty() {
        return Err("Content is empty.".into());
    }
    let ecc = match opts.ecc.as_deref().unwrap_or("M") {
        "L" => EcLevel::L,
        "M" => EcLevel::M,
        "Q" => EcLevel::Q,
        "H" => EcLevel::H,
        other => return Err(format!("Unknown ECC: {other}")),
    };
    let code = QrCode::with_error_correction_level(opts.content.as_bytes(), ecc)
        .map_err(|e| e.to_string())?;
    let module = opts.module_size.unwrap_or(8).clamp(1, 40);
    let fg = opts.fg.unwrap_or_else(|| "#000000".into());
    let bg = opts.bg.unwrap_or_else(|| "#FFFFFF".into());
    let svg = code
        .render::<svg::Color>()
        .min_dimensions(module * 21, module * 21)
        .dark_color(svg::Color(fg.as_str()))
        .light_color(svg::Color(bg.as_str()))
        .build();
    Ok(svg)
}

#[tauri::command]
pub async fn qr_read(path: String) -> Result<Vec<String>, String> {
    tokio::task::spawn_blocking(move || -> Result<Vec<String>, String> {
        let img = image::open(&path)
            .map_err(|e| e.to_string())?
            .to_luma8();
        let mut prepared = PreparedImage::prepare(img);
        let grids = prepared.detect_grids();
        if grids.is_empty() {
            return Err("No QR code detected in the image.".into());
        }
        let mut out = Vec::with_capacity(grids.len());
        for g in grids {
            match g.decode() {
                Ok((_meta, content)) => out.push(content),
                Err(e) => out.push(format!("[decode error: {e}]")),
            }
        }
        Ok(out)
    })
    .await
    .map_err(|e| e.to_string())?
}
