<template>
  <div class="req-page">

    <!-- URL bar -->
    <div class="req-urlbar">
      <select class="req-method" v-model="method" @change="onMethodChange">
        <option v-for="m in methods" :key="m">{{ m }}</option>
      </select>
      <input class="req-url" v-model="url" placeholder="https://..." spellcheck="false" @keydown.enter="send" />
      <button class="btn btn-primary btn-sm req-send" @click="send" :disabled="loading">
        {{ loading ? 'Sending…' : 'Send' }}
      </button>
      <button class="btn btn-ghost btn-sm req-clear" @click="clearAll" title="Clear">
        <Trash2 :size="14" />
      </button>
    </div>

    <div class="req-body">

      <!-- Request panel -->
      <div class="req-panel">
        <div class="req-tabs">
          <button :class="['req-tab', { active: reqTab === 'params' }]"  @click="reqTab = 'params'">Params</button>
          <button :class="['req-tab', { active: reqTab === 'headers' }]" @click="reqTab = 'headers'">Headers</button>
          <button :class="['req-tab', { active: reqTab === 'auth' }]"    @click="reqTab = 'auth'">Auth</button>
          <button :class="['req-tab', { active: reqTab === 'body' }]"    @click="reqTab = 'body'">Body</button>
        </div>

        <div v-if="reqTab === 'params'" class="req-kv-list">
          <div v-for="(p, i) in params" :key="i" class="req-kv-row">
            <input class="req-kv-input" v-model="p.key"   placeholder="Param" spellcheck="false" />
            <input class="req-kv-input" v-model="p.value" placeholder="Value" spellcheck="false" />
            <button class="req-kv-del" @click="params.splice(i, 1)">✕</button>
          </div>
          <button class="req-kv-add" @click="params.push({ key: '', value: '' })">+ Add Param</button>
        </div>

        <div v-else-if="reqTab === 'headers'" class="req-kv-list">
          <div v-for="(h, i) in headers" :key="i" class="req-kv-row">
            <input class="req-kv-input" v-model="h.key"   placeholder="Header" spellcheck="false" />
            <input class="req-kv-input" v-model="h.value" placeholder="Value"  spellcheck="false" />
            <button class="req-kv-del" @click="headers.splice(i, 1)">✕</button>
          </div>
          <button class="req-kv-add" @click="headers.push({ key: '', value: '' })">+ Add Header</button>
        </div>

        <div v-else-if="reqTab === 'auth'" class="req-body-wrap">
          <div class="req-body-topbar">
            <select class="req-body-type" v-model="authType">
              <option>none</option>
              <option>Bearer</option>
              <option>Basic</option>
              <option>API Key</option>
            </select>
          </div>
          <div class="req-auth-wrap">
            <template v-if="authType === 'Bearer'">
              <input class="req-auth-input" v-model="authBearer" placeholder="Bearer token" spellcheck="false" />
            </template>
            <template v-else-if="authType === 'Basic'">
              <input class="req-auth-input" v-model="authBasicUser" placeholder="Username" spellcheck="false" />
              <input class="req-auth-input" v-model="authBasicPass" placeholder="Password" type="password" spellcheck="false" />
            </template>
            <template v-else-if="authType === 'API Key'">
              <input class="req-auth-input" v-model="authApiKeyHeader" placeholder="Header name (e.g. X-API-Key)" spellcheck="false" />
              <input class="req-auth-input" v-model="authApiKeyValue" placeholder="API key" spellcheck="false" />
            </template>
            <div v-else class="req-no-body">No auth</div>
          </div>
        </div>

        <div v-else class="req-body-wrap">
          <div class="req-body-topbar">
            <select class="req-body-type" v-model="bodyType">
              <option>none</option>
              <option>JSON</option>
              <option>form-data</option>
              <option>raw</option>
            </select>
            <span v-if="bodyDisabled" class="req-body-disabled">Body disabled for {{ method }}</span>
          </div>
          <div v-if="bodyType === 'form-data'" class="req-kv-list">
            <div v-for="(f, i) in formDataFields" :key="i" class="req-kv-row">
              <input class="req-kv-input" v-model="f.key"   placeholder="Field" spellcheck="false" />
              <input class="req-kv-input" v-model="f.value" placeholder="Value" spellcheck="false" />
              <button class="req-kv-del" @click="formDataFields.splice(i, 1)">✕</button>
            </div>
            <button class="req-kv-add" @click="formDataFields.push({ key: '', value: '' })">+ Add Field</button>
          </div>
          <div v-else-if="bodyType !== 'none'" class="req-editor">
            <Codemirror
              v-model="body"
              :extensions="bodyExtensions"
              :placeholder="bodyType === 'JSON' ? '{\n  \n}' : ''"
              :style="{ height: '100%' }"
            />
          </div>
          <div v-else class="req-no-body">No body</div>
        </div>
      </div>

      <div class="req-divider"></div>

      <!-- Response panel -->
      <div class="req-panel">
        <div class="req-tabs">
          <button :class="['req-tab', { active: resTab === 'body' }]"    @click="resTab = 'body'">Body</button>
          <button :class="['req-tab', { active: resTab === 'headers' }]" @click="resTab = 'headers'">Headers</button>
          <div class="req-prettify">
            <label class="req-prettify-label">Prettify</label>
            <select class="req-prettify-select" v-model="prettifyMode">
              <option value="auto">auto</option>
              <option value="json">json</option>
              <option value="raw">raw</option>
            </select>
          </div>
          <div class="req-tabs-status" v-if="response">
            <span :class="['status-badge', statusClass]">{{ response.status }} {{ response.statusText }}</span>
            <span class="res-meta">{{ response.time }}ms</span>
          </div>
          <button v-if="response" class="btn btn-ghost btn-sm req-copy" @click="copyResponse" :title="copied ? 'Copied' : 'Copy'">
            <Copy :size="14" />
          </button>
        </div>

        <div v-if="response?.error" class="req-error-row">
          <span class="tool-error-label">{{ response.error }}</span>
          <button class="btn btn-ghost btn-sm req-copy-text" @click="copyError">Copy Error</button>
        </div>

        <div v-if="!response && !loading" class="req-empty">Send a request to see the response</div>
        <div v-else-if="loading" class="req-empty">Sending…</div>
        <template v-else-if="response">
          <div v-if="resTab === 'body'" class="req-editor">
            <Codemirror
              :model-value="responseBody"
              :extensions="responseExtensions"
              :style="{ height: '100%' }"
            />
          </div>
          <div v-else class="req-kv-list req-kv-readonly">
            <div v-for="[k, v] in response.headers" :key="k" class="req-kv-row">
              <span class="req-kv-key">{{ k }}</span>
              <span class="req-kv-val">{{ v }}</span>
            </div>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { lineNumbers, EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { json } from '@codemirror/lang-json';
import { Copy, Trash2 } from 'lucide-vue-next';
import { useStore } from 'vuex';
import { key } from '../store';

const store = useStore(key);
const requestsSettings = computed(() => store.getters.getRequestsSettings);
const editorSettings = computed(() => store.getters.getEditorSettings);

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const method  = ref(requestsSettings.value.default_method);
const url     = ref('https://jsonplaceholder.typicode.com/posts');
const reqTab  = ref<'params' | 'headers' | 'auth' | 'body'>('params');
const resTab  = ref<'body' | 'headers'>('body');
const loading = ref(false);
const body    = ref('{\n  "title": "Toolbelt sample",\n  "body": "Hello from Toolbelt Requests",\n  "userId": 1\n}');
const bodyType = ref('JSON');
const params  = ref<{ key: string; value: string }[]>([]);
const headers = ref<{ key: string; value: string }[]>(requestsSettings.value.default_headers ?? []);
const authType = ref<'none' | 'Bearer' | 'Basic' | 'API Key'>('none');
const authBearer = ref('');
const authBasicUser = ref('');
const authBasicPass = ref('');
const authApiKeyHeader = ref('X-API-Key');
const authApiKeyValue = ref('');
const prettifyMode = ref<'auto' | 'json' | 'raw'>(requestsSettings.value.prettify_mode);
const formDataFields = ref<{ key: string; value: string }[]>([]);
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

interface ResponseData {
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string;
  bodyFormatted: string;
  time: number;
  error?: string;
}
const response = ref<ResponseData | null>(null);

const bodyDisabled = computed(() => method.value === 'GET' || method.value === 'HEAD');

const statusClass = computed(() => {
  if (!response.value) return '';
  const s = response.value.status;
  if (s < 300) return 'status-ok';
  if (s < 400) return 'status-redirect';
  return 'status-error';
});

const baseExtensions = computed(() => {
  const exts: any[] = [];
  if (editorSettings.value.theme === 'oneDark') exts.push(oneDark);
  if (editorSettings.value.line_numbers) exts.push(lineNumbers());
  if (editorSettings.value.word_wrap) exts.push(EditorView.lineWrapping);
  exts.push(EditorState.tabSize.of(editorSettings.value.tab_size));
  return exts;
});

const bodyExtensions = computed(() => ([
  ...baseExtensions.value,
  bodyType.value === 'JSON' ? json() : [],
]));

const responseExtensions = computed(() => ([
  ...baseExtensions.value,
  json(),
  EditorView.editable.of(false),
]));

const responseBody = computed(() => {
  if (!response.value) return '';
  if (prettifyMode.value === 'raw') return response.value.body;
  if (prettifyMode.value === 'json') {
    try { return JSON.stringify(JSON.parse(response.value.body), null, 2); } catch { return response.value.body; }
  }
  return response.value.bodyFormatted;
});

watch(method, () => {
  if (bodyDisabled.value) {
    bodyType.value = 'none';
    body.value = '';
  }
});

watch(requestsSettings, (next) => {
  if (methods.includes(next.default_method)) method.value = next.default_method;
  headers.value = [...(next.default_headers ?? [])];
  prettifyMode.value = next.prettify_mode;
}, { deep: true });

function onMethodChange() {
  if (bodyDisabled.value) {
    bodyType.value = 'none';
    body.value = '';
  }
}

async function send() {
  if (!url.value.trim()) return;
  loading.value = true;
  response.value = null;
  const t0 = Date.now();
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const reqHeaders: Record<string, string> = {};
    for (const h of headers.value) {
      if (h.key.trim()) reqHeaders[h.key.trim()] = h.value;
    }
    if (authType.value === 'Bearer' && authBearer.value.trim()) {
      reqHeaders['Authorization'] = `Bearer ${authBearer.value.trim()}`;
    } else if (authType.value === 'Basic' && authBasicUser.value) {
      const token = btoa(`${authBasicUser.value}:${authBasicPass.value}`);
      reqHeaders['Authorization'] = `Basic ${token}`;
    } else if (authType.value === 'API Key' && authApiKeyHeader.value.trim()) {
      reqHeaders[authApiKeyHeader.value.trim()] = authApiKeyValue.value ?? '';
    }

    const opts: RequestInit = { method: method.value, headers: reqHeaders, redirect: requestsSettings.value.redirect };
    if (!bodyDisabled.value && bodyType.value !== 'none') {
      if (bodyType.value === 'JSON' && body.value.trim()) {
        reqHeaders['Content-Type'] = 'application/json';
        opts.body = body.value;
      } else if (bodyType.value === 'raw' && body.value) {
        opts.body = body.value;
      } else if (bodyType.value === 'form-data') {
        const fd = new FormData();
        for (const f of formDataFields.value) {
          if (f.key.trim()) fd.append(f.key.trim(), f.value ?? '');
        }
        opts.body = fd;
      }
    }
    const controller = new AbortController();
    const timeout = requestsSettings.value.timeout_ms;
    timer = setTimeout(() => controller.abort(), timeout);
    opts.signal = controller.signal;
    const res = await fetch(buildUrlWithParams(url.value, params.value), opts);
    const text = await res.text();
    let formatted = text;
    try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}
    response.value = {
      status: res.status,
      statusText: res.statusText,
      headers: [...res.headers.entries()],
      body: text,
      bodyFormatted: formatted,
      time: Date.now() - t0,
    };
  } catch (e: any) {
    response.value = {
      status: 0,
      statusText: 'Network Error',
      headers: [],
      body: e.message,
      bodyFormatted: e.message,
      time: Date.now() - t0,
      error: e?.stack ?? e?.message ?? 'Network Error',
    };
  } finally {
    if (timer) clearTimeout(timer);
    loading.value = false;
  }
}

async function copyResponse() {
  if (!response.value) return;
  try {
    await navigator.clipboard.writeText(response.value.bodyFormatted);
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 1200);
  } catch {}
}

async function copyError() {
  if (!response.value?.error) return;
  try {
    await navigator.clipboard.writeText(response.value.error);
  } catch {}
}

function clearAll() {
  url.value = '';
  params.value = [];
  headers.value = [];
  body.value = '';
  bodyType.value = 'none';
  formDataFields.value = [];
  response.value = null;
  copied.value = false;
}

function buildUrlWithParams(baseUrl: string, list: { key: string; value: string }[]) {
  try {
    const u = new URL(baseUrl);
    for (const p of list) {
      if (p.key.trim()) u.searchParams.set(p.key.trim(), p.value ?? '');
    }
    return u.toString();
  } catch {
    if (!list.length) return baseUrl;
    const query = list
      .filter((p) => p.key.trim())
      .map((p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value ?? '')}`)
      .join('&');
    return baseUrl.includes('?') ? `${baseUrl}&${query}` : `${baseUrl}?${query}`;
  }
}
</script>

<style scoped>
.req-page {
  display: flex; flex-direction: column; height: 100%;
  overflow: hidden;
}

.req-urlbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; background: transparent;
}
.req-method {
  padding: 6px 10px; border-radius: var(--radius-sm);
  background: var(--bg-elevated); border: 1px solid var(--border);
  color: var(--primary); font-size: 12px; font-weight: 600;
  cursor: pointer; outline: none; flex-shrink: 0;
}
.req-method option { background: var(--bg-elevated); color: var(--text-primary); }
.req-url {
  flex: 1; padding: 6px 12px; border-radius: var(--radius-sm);
  background: var(--bg-elevated); border: 1px solid var(--border);
  color: var(--text-primary); font-size: 13px; outline: none;
  transition: border-color 0.15s; user-select: text;
}
.req-url:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--primary-subtle); }
.req-url::placeholder { color: var(--text-muted); }
.req-send { flex-shrink: 0; }

.req-body { display: flex; flex: 1; overflow: hidden; }
.req-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.req-divider { width: 4px; flex-shrink: 0; background: var(--border); }

.req-tabs {
  display: flex; align-items: center; gap: 2px;
  padding: 6px 12px; border-bottom: 1px solid var(--border);
  background: transparent; flex-shrink: 0;
}
.req-tab {
  padding: 3px 12px; border-radius: 5px; border: none;
  background: transparent; color: var(--text-muted);
  font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.12s;
}
.req-tab:hover { color: var(--text-primary); background: var(--bg-elevated); }
.req-tab.active { background: var(--primary-subtle); color: var(--primary); }
.req-tabs-status { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.req-copy { margin-left: 6px; }

.status-badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px;
  border-radius: 4px;
}
.status-ok       { background: rgba(52,211,153,0.15); color: var(--success); }
.status-redirect { background: rgba(251,191,36,0.15); color: #fbbf24; }
.status-error    { background: var(--danger-subtle); color: var(--danger); }
.res-meta { font-size: 11px; color: var(--text-muted); }

.req-error-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  background: transparent;
}

.req-kv-list { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; overflow-y: auto; flex: 1; }
.req-kv-row { display: flex; align-items: center; gap: 6px; }
.req-kv-input {
  flex: 1; padding: 5px 10px; border-radius: var(--radius-sm);
  background: var(--bg-elevated); border: 1px solid var(--border);
  color: var(--text-primary); font-size: 12px; outline: none; user-select: text;
}
.req-kv-input:focus { border-color: var(--border-focus); }
.req-kv-input::placeholder { color: var(--text-muted); }
.req-kv-del {
  width: 22px; height: 22px; border: none; border-radius: 4px;
  background: transparent; color: var(--text-muted); cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.req-kv-del:hover { background: var(--danger-subtle); color: var(--danger); }
.req-kv-add {
  margin-top: 4px; padding: 5px 12px; border-radius: var(--radius-sm);
  border: 1px dashed var(--border); background: transparent;
  color: var(--text-muted); font-size: 12px; cursor: pointer; transition: all 0.12s;
  align-self: flex-start;
}
.req-kv-add:hover { border-color: var(--primary); color: var(--primary); }
.req-kv-readonly .req-kv-row { gap: 12px; }
.req-kv-key { font-size: 12px; color: var(--text-muted); font-family: monospace; min-width: 160px; }
.req-kv-val { font-size: 12px; color: var(--text-primary); font-family: monospace; user-select: text; }

.req-body-wrap { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.req-body-topbar {
  padding: 6px 12px; border-bottom: 1px solid var(--border);
  background: transparent; flex-shrink: 0;
}
.req-body-type {
  padding: 3px 8px; border-radius: 5px; background: var(--bg-elevated);
  border: 1px solid var(--border); color: var(--text-secondary);
  font-size: 12px; cursor: pointer; outline: none;
}
.req-no-body {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: var(--text-muted);
}
.req-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: var(--text-muted);
}
.req-editor { flex: 1; min-height: 0; }
:deep(.cm-editor) { height: 100%; background: transparent; }
:deep(.cm-scroller) {
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: var(--editor-font-size);
  line-height: 1.7;
}
:deep(.cm-gutters) { background: transparent; border-right: 1px solid var(--border); }

.req-body-disabled {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
}
.req-clear {
  color: var(--danger);
}
.req-clear:hover { background: var(--danger-subtle); color: var(--danger); }
.req-copy-text {
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  color: var(--text-muted);
}
.req-copy-text:hover { color: var(--text-primary); background: var(--bg-elevated); }

.req-auth-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
}
.req-auth-input {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}
.req-auth-input:focus { border-color: var(--border-focus); }

.req-prettify {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 10px;
}
.req-prettify-label {
  font-size: 11px;
  color: var(--text-muted);
}
.req-prettify-select {
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  outline: none;
}
</style>
