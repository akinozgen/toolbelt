use serde::Serialize;
use zxcvbn::zxcvbn;

#[derive(Serialize)]
pub struct StrengthResult {
    /// 0..=4 — zxcvbn score.
    pub score: u8,
    pub label: String,
    pub guesses: f64,
    pub guesses_log10: f64,
    /// Human-readable crack-time (online throttling).
    pub crack_time_online_throttling: String,
    /// Human-readable crack-time (offline fast hash, e.g. bcrypt-low).
    pub crack_time_offline_fast: String,
    pub feedback_warning: String,
    pub feedback_suggestions: Vec<String>,
}

#[tauri::command]
pub fn password_strength(password: String) -> Result<StrengthResult, String> {
    if password.is_empty() {
        return Ok(StrengthResult {
            score: 0,
            label: "empty".into(),
            guesses: 0.0,
            guesses_log10: 0.0,
            crack_time_online_throttling: "—".into(),
            crack_time_offline_fast: "—".into(),
            feedback_warning: String::new(),
            feedback_suggestions: vec![],
        });
    }
    let est = zxcvbn(&password, &[]);
    let score_u8 = u8::from(est.score());
    let label = match score_u8 {
        0 => "very weak",
        1 => "weak",
        2 => "fair",
        3 => "strong",
        _ => "very strong",
    };
    let times = est.crack_times();
    let warning = est
        .feedback()
        .and_then(|f| f.warning())
        .map(|w| w.to_string())
        .unwrap_or_default();
    let suggestions = est
        .feedback()
        .map(|f| f.suggestions().iter().map(|s| s.to_string()).collect())
        .unwrap_or_default();
    Ok(StrengthResult {
        score: score_u8,
        label: label.to_string(),
        guesses: est.guesses() as f64,
        guesses_log10: est.guesses_log10(),
        crack_time_online_throttling: times.online_throttling_100_per_hour().to_string(),
        crack_time_offline_fast: times.offline_fast_hashing_1e10_per_second().to_string(),
        feedback_warning: warning,
        feedback_suggestions: suggestions,
    })
}
