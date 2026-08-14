import { invoke } from '@tauri-apps/api/core';

export interface HttpBody {
  kind: 'json' | 'raw' | 'form';
  value?: string;
  fields?: [string, string][];
}

export interface HttpRequest {
  method: string;
  url: string;
  headers: [string, string][];
  query: [string, string][];
  body?: HttpBody;
  timeoutMs?: number;
  followRedirects?: 'follow' | 'manual' | 'error';
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string;
  elapsedMs: number;
}

interface RawHttpResponse {
  status: number;
  status_text: string;
  headers: [string, string][];
  body: string;
  elapsed_ms: number;
}

export async function send(req: HttpRequest): Promise<HttpResponse> {
  const raw = await invoke<RawHttpResponse>('http_send', {
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body,
      timeout_ms: req.timeoutMs,
      follow_redirects: req.followRedirects,
    },
  });
  return {
    status: raw.status,
    statusText: raw.status_text,
    headers: raw.headers,
    body: raw.body,
    elapsedMs: raw.elapsed_ms,
  };
}
