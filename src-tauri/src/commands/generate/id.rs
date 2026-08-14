use serde::Deserialize;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Deserialize, Default)]
pub struct IdOpts {
    /// NanoID length (default 21)
    #[serde(default)]
    pub length: Option<u16>,
    /// NanoID custom alphabet (overrides default url-safe)
    #[serde(default)]
    pub alphabet: Option<String>,
    /// CUID2 length (default 24)
    #[serde(default)]
    pub cuid_length: Option<u16>,
}

#[tauri::command]
pub fn generate_id(kind: String, opts: Option<IdOpts>) -> Result<String, String> {
    let opts = opts.unwrap_or_default();
    match kind.as_str() {
        "uuid-v4"   => Ok(uuid::Uuid::new_v4().to_string()),
        "uuid-v7"   => Ok(uuid::Uuid::now_v7().to_string()),
        "ulid"      => Ok(ulid::Ulid::new().to_string()),
        "nanoid"    => {
            let len = opts.length.unwrap_or(21).max(2).min(255) as usize;
            if let Some(alpha) = opts.alphabet.as_deref().filter(|s| !s.is_empty()) {
                let chars: Vec<char> = alpha.chars().collect();
                if chars.is_empty() {
                    return Err("alphabet cannot be empty".into());
                }
                Ok(nanoid::nanoid!(len, &chars))
            } else {
                Ok(nanoid::nanoid!(len))
            }
        }
        "snowflake" => Ok(next_snowflake().to_string()),
        "cuid2"     => {
            let len = opts.cuid_length.unwrap_or(24).max(2).min(64) as u16;
            Ok(cuid2::CuidConstructor::new().with_length(len).create_id())
        }
        other => Err(format!("Unknown id kind: {other}")),
    }
}

// ── Snowflake (Twitter-compat) ───────────────────────────────────────
const TWITTER_EPOCH_MS: u64 = 1_288_834_974_657;
const WORKER_ID: u64 = 1;
static SF_LAST: AtomicU64 = AtomicU64::new(0);

/// Combines (timestamp_ms - epoch) << 22 | (worker << 12) | sequence.
/// SEQ packed into the bottom 12 bits of SF_LAST so we can advance both
/// atomically with a CAS loop.
fn next_snowflake() -> u64 {
    loop {
        let now_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(TWITTER_EPOCH_MS);
        let ts = now_ms.saturating_sub(TWITTER_EPOCH_MS);

        let prev = SF_LAST.load(Ordering::Acquire);
        let prev_ts = prev >> 12;
        let prev_seq = prev & 0xFFF;

        let (new_ts, new_seq) = if ts == prev_ts {
            // Same millisecond — advance sequence.
            let next_seq = (prev_seq + 1) & 0xFFF;
            if next_seq == 0 {
                // 4096 IDs in one ms — bump to next millisecond.
                (ts + 1, 0)
            } else {
                (ts, next_seq)
            }
        } else if ts < prev_ts {
            // Clock went backwards — stay at prev_ts, advance seq.
            let next_seq = (prev_seq + 1) & 0xFFF;
            (prev_ts, next_seq)
        } else {
            (ts, 0)
        };

        let packed = (new_ts << 12) | new_seq;
        if SF_LAST
            .compare_exchange(prev, packed, Ordering::AcqRel, Ordering::Acquire)
            .is_ok()
        {
            return (new_ts << 22) | (WORKER_ID << 12) | new_seq;
        }
    }
}
