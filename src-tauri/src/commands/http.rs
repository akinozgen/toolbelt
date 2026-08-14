use once_cell::sync::Lazy;
use reqwest::redirect::Policy;
use reqwest::{Client, Method};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

static CLIENT_FOLLOW: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .redirect(Policy::limited(10))
        .build()
        .expect("reqwest client (follow) build")
});

static CLIENT_NONE: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .redirect(Policy::none())
        .build()
        .expect("reqwest client (none) build")
});

#[derive(Deserialize)]
pub struct HttpBody {
    pub kind: String,
    #[serde(default)]
    pub value: Option<String>,
    #[serde(default)]
    pub fields: Option<Vec<(String, String)>>,
}

#[derive(Deserialize)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    #[serde(default)]
    pub headers: Vec<(String, String)>,
    #[serde(default)]
    pub query: Vec<(String, String)>,
    #[serde(default)]
    pub body: Option<HttpBody>,
    #[serde(default)]
    pub timeout_ms: Option<u64>,
    #[serde(default)]
    pub follow_redirects: Option<String>,
}

#[derive(Serialize)]
pub struct HttpResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: Vec<(String, String)>,
    pub body: String,
    pub elapsed_ms: u128,
}

fn err(msg: impl ToString) -> String {
    msg.to_string()
}

#[tauri::command]
pub async fn http_send(req: HttpRequest) -> Result<HttpResponse, String> {
    let method = Method::from_bytes(req.method.to_uppercase().as_bytes()).map_err(err)?;
    let follow = req.follow_redirects.as_deref().unwrap_or("follow");
    let client: &Client = if follow == "manual" || follow == "none" || follow == "error" {
        &CLIENT_NONE
    } else {
        &CLIENT_FOLLOW
    };

    let mut builder = client.request(method, &req.url);
    if !req.query.is_empty() {
        builder = builder.query(&req.query);
    }
    for (k, v) in &req.headers {
        if !k.trim().is_empty() {
            builder = builder.header(k, v);
        }
    }
    if let Some(body) = req.body {
        match body.kind.as_str() {
            "json" => {
                let v = body.value.unwrap_or_default();
                if !v.trim().is_empty() {
                    builder = builder
                        .header("content-type", "application/json")
                        .body(v);
                }
            }
            "raw" => {
                if let Some(v) = body.value {
                    builder = builder.body(v);
                }
            }
            "form" => {
                let fields = body.fields.unwrap_or_default();
                builder = builder.form(&fields);
            }
            _ => {}
        }
    }
    if let Some(t) = req.timeout_ms {
        builder = builder.timeout(Duration::from_millis(t));
    }

    let started = Instant::now();
    let resp = builder.send().await.map_err(err)?;
    let status = resp.status();
    let status_text = status.canonical_reason().unwrap_or("").to_string();
    let mut headers: Vec<(String, String)> = Vec::with_capacity(resp.headers().len());
    for (k, v) in resp.headers().iter() {
        headers.push((
            k.as_str().to_string(),
            v.to_str().unwrap_or("").to_string(),
        ));
    }
    let body = resp.text().await.unwrap_or_default();
    let elapsed_ms = started.elapsed().as_millis();
    Ok(HttpResponse {
        status: status.as_u16(),
        status_text,
        headers,
        body,
        elapsed_ms,
    })
}
