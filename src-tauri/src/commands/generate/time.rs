use serde::{Deserialize, Serialize};
use time::format_description::well_known::{Iso8601, Rfc2822, Rfc3339};
use time::OffsetDateTime;

#[derive(Serialize)]
pub struct TimeNow {
    pub unix_seconds: i64,
    pub unix_millis: i64,
    pub iso8601: String,
    pub rfc3339: String,
    pub rfc2822: String,
    pub local_iso: String,
    pub utc_offset_minutes: i32,
}

#[tauri::command]
pub fn time_now() -> TimeNow {
    let now = OffsetDateTime::now_utc();
    let local = OffsetDateTime::now_local().unwrap_or(now);
    TimeNow {
        unix_seconds: now.unix_timestamp(),
        unix_millis:  (now.unix_timestamp_nanos() / 1_000_000) as i64,
        iso8601:      now.format(&Iso8601::DEFAULT).unwrap_or_default(),
        rfc3339:      now.format(&Rfc3339).unwrap_or_default(),
        rfc2822:      now.format(&Rfc2822).unwrap_or_default(),
        local_iso:    local.format(&Iso8601::DEFAULT).unwrap_or_default(),
        utc_offset_minutes: local.offset().whole_minutes() as i32,
    }
}

#[derive(Deserialize)]
pub struct TimeConvertOpts {
    pub input: String,
    /// "unix-s" | "unix-ms" | "iso8601" | "rfc3339" | "rfc2822"
    pub format: String,
}

#[tauri::command]
pub fn time_convert(opts: TimeConvertOpts) -> Result<String, String> {
    let trimmed = opts.input.trim();
    if trimmed.is_empty() {
        return Err("Input is empty.".into());
    }

    let dt = if let Ok(n) = trimmed.parse::<i64>() {
        // Heuristic: > 10^11 → millis, else seconds.
        let (secs, nanos) = if n.abs() > 99_999_999_999 {
            (n / 1000, ((n.rem_euclid(1000)) * 1_000_000) as i32)
        } else {
            (n, 0)
        };
        let base = OffsetDateTime::from_unix_timestamp(secs).map_err(|e| e.to_string())?;
        base + time::Duration::nanoseconds(nanos as i64)
    } else if let Ok(d) = OffsetDateTime::parse(trimmed, &Rfc3339) {
        d
    } else if let Ok(d) = OffsetDateTime::parse(trimmed, &Iso8601::DEFAULT) {
        d
    } else if let Ok(d) = OffsetDateTime::parse(trimmed, &Rfc2822) {
        d
    } else {
        return Err("Could not parse input as Unix timestamp or ISO/RFC date.".into());
    };

    match opts.format.as_str() {
        "unix-s"  => Ok(dt.unix_timestamp().to_string()),
        "unix-ms" => Ok(((dt.unix_timestamp_nanos() / 1_000_000) as i64).to_string()),
        "iso8601" => dt.format(&Iso8601::DEFAULT).map_err(|e| e.to_string()),
        "rfc3339" => dt.format(&Rfc3339).map_err(|e| e.to_string()),
        "rfc2822" => dt.format(&Rfc2822).map_err(|e| e.to_string()),
        other     => Err(format!("Unknown format: {other}")),
    }
}
