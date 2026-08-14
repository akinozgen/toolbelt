use serde::{Deserialize, Serialize};
use totp_rs::{Algorithm, Secret, TOTP};

#[derive(Deserialize)]
pub struct TotpOpts {
    /// Secret as base32 (Google Authenticator default) or raw text.
    pub secret: String,
    /// "SHA1" | "SHA256" | "SHA512"
    #[serde(default)]
    pub algorithm: Option<String>,
    /// 6 | 8
    #[serde(default)]
    pub digits: Option<u32>,
    /// Period in seconds (default 30).
    #[serde(default)]
    pub period: Option<u64>,
}

#[derive(Serialize)]
pub struct TotpResult {
    pub code: String,
    pub remaining_seconds: u64,
    pub period: u64,
}

#[tauri::command]
pub fn totp_compute(opts: TotpOpts) -> Result<TotpResult, String> {
    let algo = match opts.algorithm.as_deref().unwrap_or("SHA1") {
        "SHA1"   => Algorithm::SHA1,
        "SHA256" => Algorithm::SHA256,
        "SHA512" => Algorithm::SHA512,
        other => return Err(format!("Unknown algorithm: {other}")),
    };
    let digits = opts.digits.unwrap_or(6).clamp(6, 8) as usize;
    let period = opts.period.unwrap_or(30).max(1);

    let secret_bytes = Secret::Encoded(opts.secret.replace(' ', ""))
        .to_bytes()
        .or_else(|_| Secret::Raw(opts.secret.as_bytes().to_vec()).to_bytes())
        .map_err(|e| format!("Invalid secret: {e}"))?;

    let totp = TOTP::new(algo, digits, 1, period, secret_bytes)
        .map_err(|e| e.to_string())?;
    let code = totp.generate_current().map_err(|e| e.to_string())?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let remaining = period - (now % period);
    Ok(TotpResult { code, remaining_seconds: remaining, period })
}
