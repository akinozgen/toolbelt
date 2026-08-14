use serde::{Deserialize, Serialize};

// ── Sort ──────────────────────────────────────────────────────────
#[derive(Deserialize)]
pub struct SortOpts {
    pub input: String,
    /// "alpha" | "numeric" | "length"
    #[serde(default)]
    pub mode: Option<String>,
    #[serde(default)]
    pub descending: Option<bool>,
    #[serde(default)]
    pub case_sensitive: Option<bool>,
}

#[tauri::command]
pub fn text_sort(opts: SortOpts) -> Result<String, String> {
    let mode = opts.mode.as_deref().unwrap_or("alpha");
    let desc = opts.descending.unwrap_or(false);
    let cs = opts.case_sensitive.unwrap_or(false);
    let mut lines: Vec<String> = opts.input.lines().map(|l| l.to_string()).collect();
    match mode {
        "alpha" => {
            if cs {
                lines.sort();
            } else {
                lines.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
            }
        }
        "numeric" => {
            lines.sort_by(|a, b| {
                let na = a.trim().parse::<f64>().unwrap_or(f64::INFINITY);
                let nb = b.trim().parse::<f64>().unwrap_or(f64::INFINITY);
                na.partial_cmp(&nb).unwrap_or(std::cmp::Ordering::Equal)
            });
        }
        "length" => lines.sort_by_key(|l| l.chars().count()),
        other => return Err(format!("Unknown sort mode: {other}")),
    }
    if desc { lines.reverse(); }
    Ok(lines.join("\n"))
}

// ── Dedupe ────────────────────────────────────────────────────────
#[derive(Deserialize)]
pub struct DedupeOpts {
    pub input: String,
    #[serde(default)]
    pub preserve_order: Option<bool>,
    #[serde(default)]
    pub trim_compare: Option<bool>,
    #[serde(default)]
    pub case_insensitive: Option<bool>,
}

#[tauri::command]
pub fn text_dedupe(opts: DedupeOpts) -> Result<String, String> {
    let preserve = opts.preserve_order.unwrap_or(true);
    let trim = opts.trim_compare.unwrap_or(false);
    let ci = opts.case_insensitive.unwrap_or(false);
    let key = |s: &str| -> String {
        let s = if trim { s.trim().to_string() } else { s.to_string() };
        if ci { s.to_lowercase() } else { s }
    };
    let lines: Vec<&str> = opts.input.lines().collect();
    let result: Vec<String> = if preserve {
        let mut seen = std::collections::HashSet::new();
        lines.iter()
            .filter(|l| seen.insert(key(l)))
            .map(|l| l.to_string())
            .collect()
    } else {
        let mut sorted: Vec<String> = lines.iter().map(|s| s.to_string()).collect();
        sorted.sort_by(|a, b| key(a).cmp(&key(b)));
        sorted.dedup_by(|a, b| key(a) == key(b));
        sorted
    };
    Ok(result.join("\n"))
}

// ── Case ──────────────────────────────────────────────────────────
#[derive(Deserialize)]
pub struct CaseOpts {
    pub input: String,
    /// "lower" | "upper" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab" | "constant" | "dot"
    pub target: String,
}

fn split_words(s: &str) -> Vec<String> {
    // Split on whitespace, _, -, ., then split CamelCase boundaries.
    let mut out = Vec::new();
    for raw in s.split(|c: char| c.is_whitespace() || c == '_' || c == '-' || c == '.') {
        if raw.is_empty() { continue; }
        let mut current = String::new();
        let mut prev_lower = false;
        for c in raw.chars() {
            if c.is_uppercase() && prev_lower {
                if !current.is_empty() { out.push(std::mem::take(&mut current)); }
            }
            current.push(c);
            prev_lower = c.is_lowercase() || c.is_ascii_digit();
        }
        if !current.is_empty() { out.push(current); }
    }
    out.into_iter().map(|w| w.to_lowercase()).collect()
}

#[tauri::command]
pub fn text_case(opts: CaseOpts) -> Result<String, String> {
    let result = match opts.target.as_str() {
        "lower"    => opts.input.to_lowercase(),
        "upper"    => opts.input.to_uppercase(),
        "title"    => opts.input.split_whitespace()
                        .map(|w| {
                            let mut chars = w.chars();
                            chars.next()
                                .map(|c| c.to_uppercase().chain(chars.as_str().to_lowercase().chars()).collect::<String>())
                                .unwrap_or_default()
                        }).collect::<Vec<_>>().join(" "),
        "sentence" => {
            let mut out = String::with_capacity(opts.input.len());
            let mut cap_next = true;
            for c in opts.input.chars() {
                if cap_next && c.is_alphabetic() {
                    out.extend(c.to_uppercase());
                    cap_next = false;
                } else {
                    out.extend(c.to_lowercase());
                    if c == '.' || c == '!' || c == '?' { cap_next = true; }
                }
            }
            out
        }
        "camel" => {
            let words = split_words(&opts.input);
            let mut s = String::new();
            for (i, w) in words.iter().enumerate() {
                if i == 0 { s.push_str(w); }
                else if let Some(c) = w.chars().next() {
                    s.extend(c.to_uppercase());
                    s.push_str(&w[c.len_utf8()..]);
                }
            }
            s
        }
        "pascal" => split_words(&opts.input).iter().map(|w| {
            let mut chars = w.chars();
            chars.next()
                .map(|c| c.to_uppercase().chain(chars.as_str().chars()).collect::<String>())
                .unwrap_or_default()
        }).collect::<String>(),
        "snake"    => split_words(&opts.input).join("_"),
        "kebab"    => split_words(&opts.input).join("-"),
        "constant" => split_words(&opts.input).iter().map(|w| w.to_uppercase()).collect::<Vec<_>>().join("_"),
        "dot"      => split_words(&opts.input).join("."),
        other      => return Err(format!("Unknown target case: {other}")),
    };
    Ok(result)
}

// ── Escape / Unescape ─────────────────────────────────────────────
#[derive(Deserialize)]
pub struct EscapeOpts {
    pub input: String,
    /// "json" | "html" | "regex" | "shell" | "sql" | "url"
    pub kind: String,
}

#[tauri::command]
pub fn text_escape(opts: EscapeOpts) -> Result<String, String> {
    Ok(match opts.kind.as_str() {
        "json" => {
            let mut s = String::with_capacity(opts.input.len() + 2);
            for c in opts.input.chars() {
                match c {
                    '"'  => s.push_str("\\\""),
                    '\\' => s.push_str("\\\\"),
                    '\n' => s.push_str("\\n"),
                    '\r' => s.push_str("\\r"),
                    '\t' => s.push_str("\\t"),
                    '\u{08}' => s.push_str("\\b"),
                    '\u{0C}' => s.push_str("\\f"),
                    c if (c as u32) < 0x20 => s.push_str(&format!("\\u{:04x}", c as u32)),
                    c => s.push(c),
                }
            }
            s
        }
        "html" => opts.input
            .replace('&', "&amp;")
            .replace('<', "&lt;")
            .replace('>', "&gt;")
            .replace('"', "&quot;")
            .replace('\'', "&#39;"),
        "regex" => {
            let mut s = String::with_capacity(opts.input.len());
            for c in opts.input.chars() {
                if "\\^$.|?*+()[]{}".contains(c) { s.push('\\'); }
                s.push(c);
            }
            s
        }
        "shell" => {
            // POSIX-safe single-quoting: ' → '\''  wrapped in '...'.
            let mut s = String::from("'");
            for c in opts.input.chars() {
                if c == '\'' { s.push_str("'\\''"); } else { s.push(c); }
            }
            s.push('\'');
            s
        }
        "sql" => opts.input.replace('\'', "''"),
        "url" => urlencoding::encode(&opts.input).into_owned(),
        other => return Err(format!("Unknown escape kind: {other}")),
    })
}

#[tauri::command]
pub fn text_unescape(opts: EscapeOpts) -> Result<String, String> {
    Ok(match opts.kind.as_str() {
        "json" => {
            let mut s = String::with_capacity(opts.input.len());
            let mut chars = opts.input.chars().peekable();
            while let Some(c) = chars.next() {
                if c != '\\' { s.push(c); continue; }
                match chars.next() {
                    Some('"')  => s.push('"'),
                    Some('\\') => s.push('\\'),
                    Some('/')  => s.push('/'),
                    Some('n')  => s.push('\n'),
                    Some('r')  => s.push('\r'),
                    Some('t')  => s.push('\t'),
                    Some('b')  => s.push('\u{08}'),
                    Some('f')  => s.push('\u{0C}'),
                    Some('u')  => {
                        let hex: String = (0..4).filter_map(|_| chars.next()).collect();
                        if let Ok(n) = u32::from_str_radix(&hex, 16) {
                            if let Some(c) = char::from_u32(n) { s.push(c); }
                        }
                    }
                    Some(other) => { s.push('\\'); s.push(other); }
                    None => s.push('\\'),
                }
            }
            s
        }
        "html" => opts.input
            .replace("&amp;",  "&")
            .replace("&lt;",   "<")
            .replace("&gt;",   ">")
            .replace("&quot;", "\"")
            .replace("&#39;",  "'")
            .replace("&apos;", "'")
            .replace("&nbsp;", " "),
        "regex" => {
            let mut s = String::with_capacity(opts.input.len());
            let mut chars = opts.input.chars().peekable();
            while let Some(c) = chars.next() {
                if c == '\\' {
                    if let Some(&n) = chars.peek() {
                        if "\\^$.|?*+()[]{}".contains(n) { chars.next(); s.push(n); continue; }
                    }
                }
                s.push(c);
            }
            s
        }
        "shell" => {
            // Best-effort: strip outer single quotes, undo '\'' sequence.
            let trimmed = opts.input.trim();
            if trimmed.starts_with('\'') && trimmed.ends_with('\'') && trimmed.len() >= 2 {
                trimmed[1..trimmed.len() - 1].replace("'\\''", "'")
            } else {
                opts.input.clone()
            }
        }
        "sql" => opts.input.replace("''", "'"),
        "url" => urlencoding::decode(&opts.input).map(|c| c.into_owned()).map_err(|e| e.to_string())?,
        other => return Err(format!("Unknown unescape kind: {other}")),
    })
}

// ── Slugify ───────────────────────────────────────────────────────
#[derive(Deserialize)]
pub struct SlugifyOpts {
    pub input: String,
    /// If true (default), strips non-ASCII to nearest equivalent.
    #[serde(default)]
    pub ascii_only: Option<bool>,
    /// Separator character (default '-').
    #[serde(default)]
    pub separator: Option<String>,
}

#[tauri::command]
pub fn text_slugify(opts: SlugifyOpts) -> Result<String, String> {
    let sep = opts.separator.as_deref().unwrap_or("-");
    if opts.ascii_only.unwrap_or(true) {
        let s = slug::slugify(&opts.input);
        if sep == "-" { Ok(s) } else { Ok(s.replace('-', sep)) }
    } else {
        // Preserve unicode letters; just lowercase + replace whitespace/punct with sep.
        let mut out = String::with_capacity(opts.input.len());
        let mut last_sep = true;
        for c in opts.input.chars() {
            if c.is_alphanumeric() {
                out.extend(c.to_lowercase());
                last_sep = false;
            } else if !last_sep {
                out.push_str(sep);
                last_sep = true;
            }
        }
        Ok(out.trim_matches(|c| sep.contains(c)).to_string())
    }
}

// ── Markdown → HTML ────────────────────────────────────────────────
#[tauri::command]
pub fn text_markdown_to_html(input: String) -> Result<String, String> {
    use pulldown_cmark::{html, Options, Parser};
    let mut opts = Options::empty();
    opts.insert(Options::ENABLE_STRIKETHROUGH);
    opts.insert(Options::ENABLE_TABLES);
    opts.insert(Options::ENABLE_TASKLISTS);
    opts.insert(Options::ENABLE_SMART_PUNCTUATION);
    let parser = Parser::new_ext(&input, opts);
    let mut out = String::with_capacity(input.len());
    html::push_html(&mut out, parser);
    Ok(out)
}

// ── Counter ───────────────────────────────────────────────────────
#[derive(Serialize)]
pub struct CountResult {
    pub chars: usize,
    pub bytes: usize,
    pub words: usize,
    pub lines: usize,
    pub sentences: usize,
    pub paragraphs: usize,
}

#[tauri::command]
pub fn text_count(input: String) -> CountResult {
    let chars = input.chars().count();
    let bytes = input.len();
    let words = input.split_whitespace().count();
    let lines = if input.is_empty() { 0 } else { input.lines().count() };
    let sentences = input.matches(|c| c == '.' || c == '!' || c == '?').count();
    let paragraphs = input
        .split("\n\n")
        .filter(|p| !p.trim().is_empty())
        .count();
    CountResult { chars, bytes, words, lines, sentences, paragraphs }
}

// ── Trim ──────────────────────────────────────────────────────────
#[derive(Deserialize)]
pub struct TrimOpts {
    pub input: String,
    /// "both" | "left" | "right" | "lines" (per-line both)
    #[serde(default)]
    pub mode: Option<String>,
    /// Custom characters to strip (default: whitespace)
    #[serde(default)]
    pub chars: Option<String>,
}

#[tauri::command]
pub fn text_trim(opts: TrimOpts) -> Result<String, String> {
    let mode = opts.mode.as_deref().unwrap_or("both");
    let custom = opts.chars.as_deref();
    let trim_str = |s: &str| -> String {
        if let Some(set) = custom {
            let chars: Vec<char> = set.chars().collect();
            match mode {
                "both"  => s.trim_matches(|c| chars.contains(&c)).to_string(),
                "left"  => s.trim_start_matches(|c| chars.contains(&c)).to_string(),
                "right" => s.trim_end_matches(|c| chars.contains(&c)).to_string(),
                _       => s.trim_matches(|c| chars.contains(&c)).to_string(),
            }
        } else {
            match mode {
                "both"  => s.trim().to_string(),
                "left"  => s.trim_start().to_string(),
                "right" => s.trim_end().to_string(),
                _       => s.trim().to_string(),
            }
        }
    };
    if mode == "lines" {
        Ok(opts.input.lines().map(|l| trim_str(l)).collect::<Vec<_>>().join("\n"))
    } else {
        Ok(trim_str(&opts.input))
    }
}
