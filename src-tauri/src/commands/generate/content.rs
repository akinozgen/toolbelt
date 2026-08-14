use serde::Deserialize;

#[derive(Deserialize, Default)]
pub struct LoremOpts {
    /// "paragraphs" | "sentences" | "words"
    #[serde(default)]
    pub kind: Option<String>,
    #[serde(default)]
    pub count: Option<u16>,
    #[serde(default)]
    pub start_classic: Option<bool>,
}

#[tauri::command]
pub fn generate_lorem(opts: Option<LoremOpts>) -> Result<String, String> {
    let o = opts.unwrap_or_default();
    let count = o.count.unwrap_or(3).clamp(1, 200) as usize;
    let kind = o.kind.as_deref().unwrap_or("paragraphs");
    let classic = o.start_classic.unwrap_or(true);

    let text = match kind {
        "paragraphs" => {
            let mut paras = Vec::with_capacity(count);
            for i in 0..count {
                let words = if i == 0 && classic { 50 } else { 35 + (i * 7) % 35 };
                let mut p = lipsum::lipsum(words);
                if i == 0 && classic && !p.starts_with("Lorem") {
                    p = format!("Lorem ipsum dolor sit amet, {}", p.trim_start());
                }
                paras.push(p);
            }
            paras.join("\n\n")
        }
        "sentences" => {
            // lipsum doesn't expose a sentence-count API; generate from word counts.
            (0..count)
                .map(|_| lipsum::lipsum_words(12))
                .collect::<Vec<_>>()
                .join(" ")
        }
        "words" => lipsum::lipsum_words(count),
        other   => return Err(format!("Unknown lorem kind: {other}")),
    };
    Ok(text)
}

#[derive(Deserialize)]
pub struct PlaceholderOpts {
    pub width: u32,
    pub height: u32,
    #[serde(default)]
    pub bg: Option<String>,
    #[serde(default)]
    pub fg: Option<String>,
    #[serde(default)]
    pub text: Option<String>,
}

#[tauri::command]
pub fn generate_placeholder_svg(opts: PlaceholderOpts) -> Result<String, String> {
    let w = opts.width.clamp(1, 8192);
    let h = opts.height.clamp(1, 8192);
    let bg = opts.bg.unwrap_or_else(|| "#444".into());
    let fg = opts.fg.unwrap_or_else(|| "#FFFFFF".into());
    let text = opts.text.unwrap_or_else(|| format!("{w}×{h}"));
    let font_size = (w.min(h) / 8).clamp(12, 96);
    let escaped = text
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;");
    Ok(format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><rect width="100%" height="100%" fill="{bg}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="{font_size}" font-weight="600" fill="{fg}">{escaped}</text></svg>"#
    ))
}
