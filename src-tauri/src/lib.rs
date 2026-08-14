use tauri::Manager;

#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

mod commands;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::hash::hash_text,
            commands::hash::hash_bytes,
            commands::hash::hash_file,
            commands::encode::encode_base64,
            commands::encode::encode_base64url,
            commands::encode::encode_url,
            commands::encode::encode_hex,
            commands::encode::jwt_decode,
            commands::encode::jwt_encode,
            commands::format::format_json,
            commands::format::format_yaml,
            commands::format::format_xml,
            commands::diff::diff_unified_patch,
            commands::markdown::render_markdown,
            commands::http::http_send,
            commands::system::get_system_info,
            commands::image::image_to_base64,
            commands::image::save_base64_to_file,
            commands::image::save_text_to_file,
            commands::generate::id::generate_id,
            commands::generate::secret::generate_secret,
            commands::generate::secret::generate_rsa_keypair,
            commands::generate::content::generate_lorem,
            commands::generate::content::generate_placeholder_svg,
            commands::generate::qr::qr_generate,
            commands::generate::qr::qr_read,
            commands::generate::time::time_now,
            commands::generate::time::time_convert,
            commands::generate::network::generate_ipv4,
            commands::generate::network::generate_ipv6,
            commands::generate::network::generate_mac,
            commands::generate::network::generate_ua,
            commands::crypto::kdf::bcrypt_hash,
            commands::crypto::kdf::bcrypt_verify,
            commands::crypto::kdf::argon2_hash,
            commands::crypto::kdf::argon2_verify,
            commands::crypto::kdf::pbkdf2_derive,
            commands::crypto::mac::hmac_sign,
            commands::crypto::aes::aes_encrypt,
            commands::crypto::aes::aes_decrypt,
            commands::crypto::totp::totp_compute,
            commands::crypto::strength::password_strength,
            commands::text::text_sort,
            commands::text::text_dedupe,
            commands::text::text_case,
            commands::text::text_escape,
            commands::text::text_unescape,
            commands::text::text_slugify,
            commands::text::text_markdown_to_html,
            commands::text::text_count,
            commands::text::text_trim,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // WinUI Mica: subtle backdrop tint, content stays crisp.
            // `Some(true)` = dark variant; runtime theme switch handled CSS-side.
            #[cfg(target_os = "windows")]
            let _ = apply_mica(&window, Some(true));

            #[cfg(target_os = "macos")]
            let _ = apply_vibrancy(
                &window,
                NSVisualEffectMaterial::WindowBackground,
                None,
                None,
            );

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
