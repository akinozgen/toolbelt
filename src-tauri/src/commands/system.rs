use serde::Serialize;

#[derive(Serialize)]
pub struct SystemInfo {
    /// Logical CPU cores (counts SMT threads). Useful for UX hints —
    /// hashing itself is single-threaded.
    pub cpu_cores: usize,
    pub os: String,
    pub arch: String,
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    let cpu_cores = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(1);
    SystemInfo {
        cpu_cores,
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    }
}
