use rand::{Rng, RngCore};
use serde::Deserialize;

#[derive(Deserialize, Default)]
pub struct NetworkOpts {
    /// IPv4 kind: "any" | "private" | "public"
    #[serde(default)]
    pub kind: Option<String>,
    /// MAC separator: ":" | "-"
    #[serde(default)]
    pub separator: Option<String>,
    #[serde(default)]
    pub uppercase: Option<bool>,
    #[serde(default)]
    pub locally_administered: Option<bool>,
    /// UA filters
    #[serde(default)]
    pub browser: Option<String>,
    #[serde(default)]
    pub os: Option<String>,
}

// ── IPv4 ───────────────────────────────────────────────────────────────
#[tauri::command]
pub fn generate_ipv4(opts: Option<NetworkOpts>) -> Result<String, String> {
    let kind = opts.and_then(|o| o.kind).unwrap_or_else(|| "any".into());
    let mut rng = rand::thread_rng();

    for _ in 0..10_000 {
        let a = rng.gen_range(1..=223);
        let b = rng.gen_range(0..=255);
        let c = rng.gen_range(0..=255);
        let d = rng.gen_range(1..=254);

        let is_private = a == 10
            || (a == 172 && (16..=31).contains(&b))
            || (a == 192 && b == 168);
        let is_loopback = a == 127;
        let is_linklocal = a == 169 && b == 254;
        let is_multicast = a >= 224;
        let reserved = is_loopback || is_linklocal || is_multicast;

        let ok = match kind.as_str() {
            "private" => is_private,
            "public"  => !is_private && !reserved,
            "any"     => !reserved,
            other     => return Err(format!("Unknown ipv4 kind: {other}")),
        };
        if ok {
            return Ok(format!("{a}.{b}.{c}.{d}"));
        }
    }
    Err("Could not generate matching address; relax filter.".into())
}

// ── IPv6 ───────────────────────────────────────────────────────────────
#[tauri::command]
pub fn generate_ipv6() -> String {
    let mut rng = rand::thread_rng();
    let parts: [u16; 8] = std::array::from_fn(|_| rng.gen());
    parts.iter().map(|p| format!("{p:04x}")).collect::<Vec<_>>().join(":")
}

// ── MAC ────────────────────────────────────────────────────────────────
#[tauri::command]
pub fn generate_mac(opts: Option<NetworkOpts>) -> String {
    let opts = opts.unwrap_or_default();
    let sep = opts.separator.as_deref().unwrap_or(":");
    let upper = opts.uppercase.unwrap_or(false);
    let local = opts.locally_administered.unwrap_or(true);

    let mut rng = rand::thread_rng();
    let mut bytes = [0u8; 6];
    rng.fill_bytes(&mut bytes);
    if local {
        bytes[0] = (bytes[0] & 0xFE) | 0x02; // unicast + locally administered
    } else {
        bytes[0] &= 0xFE; // unicast
    }
    bytes
        .iter()
        .map(|b| if upper { format!("{b:02X}") } else { format!("{b:02x}") })
        .collect::<Vec<_>>()
        .join(sep)
}

// ── User-Agent ─────────────────────────────────────────────────────────
const UA_TEMPLATES: &[(&str, &str, &str)] = &[
    ("Chrome",  "Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver}.0.0.0 Safari/537.36"),
    ("Chrome",  "macOS",   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver}.0.0.0 Safari/537.36"),
    ("Chrome",  "Linux",   "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver}.0.0.0 Safari/537.36"),
    ("Chrome",  "Android", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver}.0.0.0 Mobile Safari/537.36"),
    ("Firefox", "Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:{ver}.0) Gecko/20100101 Firefox/{ver}.0"),
    ("Firefox", "macOS",   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:{ver}.0) Gecko/20100101 Firefox/{ver}.0"),
    ("Firefox", "Linux",   "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:{ver}.0) Gecko/20100101 Firefox/{ver}.0"),
    ("Safari",  "macOS",   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/{ver}.0 Safari/605.1.15"),
    ("Safari",  "iOS",     "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/{ver}.0 Mobile/15E148 Safari/604.1"),
    ("Edge",    "Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver}.0.0.0 Safari/537.36 Edg/{ver}.0.0.0"),
    ("Edge",    "macOS",   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ver}.0.0.0 Safari/537.36 Edg/{ver}.0.0.0"),
];

const VERSION_RANGES: &[(&str, u32, u32)] = &[
    ("Chrome",  120, 132),
    ("Firefox", 120, 134),
    ("Safari",  16,  18),
    ("Edge",    120, 132),
];

#[tauri::command]
pub fn generate_ua(opts: Option<NetworkOpts>) -> Result<String, String> {
    let opts = opts.unwrap_or_default();
    let browser = opts.browser.as_deref().unwrap_or("any");
    let os = opts.os.as_deref().unwrap_or("any");
    let mut rng = rand::thread_rng();

    let candidates: Vec<&(&str, &str, &str)> = UA_TEMPLATES
        .iter()
        .filter(|(b, o, _)| {
            (browser == "any" || browser.eq_ignore_ascii_case(b))
                && (os == "any" || os.eq_ignore_ascii_case(o))
        })
        .collect();
    if candidates.is_empty() {
        return Err(format!("No UA template for {browser} on {os}."));
    }
    let pick = candidates[rng.gen_range(0..candidates.len())];
    let (lo, hi) = VERSION_RANGES
        .iter()
        .find(|(b, _, _)| *b == pick.0)
        .map(|(_, lo, hi)| (*lo, *hi))
        .unwrap_or((100, 130));
    let ver = rng.gen_range(lo..=hi);
    Ok(pick.2.replace("{ver}", &ver.to_string()))
}
