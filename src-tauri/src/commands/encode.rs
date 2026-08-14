use base64::{
    engine::general_purpose::{STANDARD, URL_SAFE_NO_PAD},
    Engine,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

fn err(msg: impl ToString) -> String {
    msg.to_string()
}

#[tauri::command]
pub fn encode_base64(mode: String, input: String) -> Result<String, String> {
    match mode.as_str() {
        "encode" => Ok(STANDARD.encode(input.as_bytes())),
        "decode" => {
            let bytes = STANDARD.decode(input.trim()).map_err(err)?;
            String::from_utf8(bytes).map_err(err)
        }
        other => Err(format!("Unknown mode: {other}")),
    }
}

#[tauri::command]
pub fn encode_base64url(mode: String, input: String) -> Result<String, String> {
    match mode.as_str() {
        "encode" => Ok(URL_SAFE_NO_PAD.encode(input.as_bytes())),
        "decode" => {
            let bytes = URL_SAFE_NO_PAD.decode(input.trim()).map_err(err)?;
            String::from_utf8(bytes).map_err(err)
        }
        other => Err(format!("Unknown mode: {other}")),
    }
}

#[tauri::command]
pub fn encode_url(mode: String, input: String) -> Result<String, String> {
    match mode.as_str() {
        "encode" => Ok(urlencoding::encode(&input).into_owned()),
        "decode" => urlencoding::decode(&input).map(|c| c.into_owned()).map_err(err),
        other => Err(format!("Unknown mode: {other}")),
    }
}

#[tauri::command]
pub fn encode_hex(mode: String, input: String) -> Result<String, String> {
    match mode.as_str() {
        "encode" => Ok(hex::encode(input.as_bytes())),
        "decode" => {
            let cleaned: String = input.chars().filter(|c| !c.is_whitespace()).collect();
            let bytes = hex::decode(cleaned).map_err(err)?;
            String::from_utf8(bytes).map_err(err)
        }
        other => Err(format!("Unknown mode: {other}")),
    }
}

#[derive(Serialize)]
pub struct JwtParts {
    pub header: Value,
    pub payload: Value,
    pub signature: String,
}

#[derive(Deserialize)]
pub struct JwtPartsInput {
    #[serde(default)]
    pub header: Option<Value>,
    #[serde(default)]
    pub payload: Option<Value>,
    #[serde(default)]
    pub signature: Option<String>,
}

fn b64url_decode_to_string(s: &str) -> Result<String, String> {
    let bytes = URL_SAFE_NO_PAD.decode(s).map_err(err)?;
    String::from_utf8(bytes).map_err(err)
}

#[tauri::command]
pub fn jwt_decode(token: String) -> Result<JwtParts, String> {
    let trimmed = token.trim();
    let parts: Vec<&str> = trimmed.split('.').collect();
    if parts.len() < 2 {
        return Err("Invalid JWT".into());
    }
    let header: Value = serde_json::from_str(&b64url_decode_to_string(parts[0])?).map_err(err)?;
    let payload: Value = serde_json::from_str(&b64url_decode_to_string(parts[1])?).map_err(err)?;
    let signature = parts.get(2).map(|s| (*s).to_string()).unwrap_or_default();
    Ok(JwtParts { header, payload, signature })
}

#[tauri::command]
pub fn jwt_encode(parts: JwtPartsInput) -> Result<String, String> {
    let header = parts.header.unwrap_or_else(|| {
        serde_json::json!({ "alg": "none", "typ": "JWT" })
    });
    let payload = parts.payload.unwrap_or_else(|| serde_json::json!({}));
    let header_str = URL_SAFE_NO_PAD.encode(serde_json::to_string(&header).map_err(err)?);
    let payload_str = URL_SAFE_NO_PAD.encode(serde_json::to_string(&payload).map_err(err)?);
    let sig = parts.signature.unwrap_or_default();
    Ok(format!("{header_str}.{payload_str}.{sig}"))
}
