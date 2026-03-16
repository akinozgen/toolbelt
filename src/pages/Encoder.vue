<template>
  <div class="tool-page">

    <div class="tool-topbar">
      <div class="tool-tabs">
        <button
          v-for="enc in encoders"
          :key="enc"
          :class="['tool-tab', { active: selected === enc }]"
          @click="selected = enc"
        >{{ enc }}</button>
      </div>
      <div class="flex items-center gap-2">
        <span class="mode-chip">{{ modeLabel }}</span>
        <button class="btn btn-primary btn-sm" @click="run(mode)">
          {{ mode === 'encode' ? 'Encode' : 'Decode' }}
        </button>
      </div>
    </div>

    <div class="tool-split" ref="splitRef">
      <div class="tool-pane" :style="{ flex: `0 0 ${leftWidth}px`, width: leftWidth + 'px' }">
        <div class="tool-pane-label">
          <span>Input</span>
          <button class="btn btn-ghost btn-sm tool-icon-btn danger" @click="clearInput" :disabled="!input" title="Clear">
            <Trash2 :size="14" />
          </button>
        </div>
        <div class="tool-editor">
          <Codemirror
            v-model="input"
            :extensions="inputExtensions"
            :style="{ height: '100%' }"
          />
        </div>
      </div>
      <div class="tool-resize-handle" @mousedown="startResize($event)">
        <button class="swap-btn" @click="swapPanels" title="Swap Input/Output">
          <ArrowLeftRight :size="14" />
        </button>
      </div>
      <div class="tool-pane" style="flex: 1 1 0%;">
        <div class="tool-pane-label">
          <span>Output</span>
          <div class="flex items-center gap-2">
            <button class="btn btn-ghost btn-sm tool-icon-btn" :class="{ success: converted }" @click="copyOutput" :disabled="!output" :title="copied ? 'Copied' : 'Copy'">
              <Copy :size="14" />
            </button>
          </div>
        </div>
        <div v-if="error" class="tool-error-row">
          <span class="tool-error-label">{{ error }}</span>
          <button class="btn btn-ghost btn-sm tool-copy-text" @click="copyError">
            Copy Error
          </button>
        </div>
        <div class="tool-editor">
          <Codemirror
            :model-value="output || (error ? error : '')"
            :extensions="outputExtensions"
            :style="{ height: '100%' }"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { lineNumbers, EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { json } from '@codemirror/lang-json';
import { Copy, Trash2, ArrowLeftRight } from 'lucide-vue-next';
import { useStore } from 'vuex';
import { key } from '../store';

const encoders = ['Base64', 'Base64url', 'URL', 'Hex', 'JWT'] as const;
type Encoder = typeof encoders[number];

const store = useStore(key);
const encoderSettings = computed(() => store.getters.getEncoderSettings);
const editorSettings = computed(() => store.getters.getEditorSettings);

const splitRef = ref<HTMLElement | null>(null);
const leftWidth = ref(0);

const selected = ref<Encoder>(encoderSettings.value.default_algorithm);
const mode     = ref<'encode' | 'decode'>(encoderSettings.value.default_mode);
const input    = ref('');
const output   = ref('');
const error    = ref('');
const copied   = ref(false);
const converted = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let convertTimer: ReturnType<typeof setTimeout> | null = null;

// ── Resize state ────────────────────────────────────────────────────────
let resizing = false;
let resizeStartX = 0;
let resizeStartW = 0;

const sampleMap: Record<Encoder, string> = {
  Base64: 'Toolbelt rocks!',
  Base64url: 'https://toolbelt.local/search?q=hello world&sort=desc',
  URL: 'https://toolbelt.local/search?q=hello world&sort=desc',
  Hex: '48656c6c6f20546f6f6c62656c74',
  JWT: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywibmFtZSI6IkFraW4iLCJyb2xlIjoiYWRtaW4ifQ.signature',
};
const lastSample = ref(sampleMap[selected.value]);
input.value = sampleMap[selected.value];

watch(selected, (next) => {
  const nextSample = sampleMap[next];
  if (!input.value || input.value === lastSample.value) {
    input.value = nextSample;
  }
  lastSample.value = nextSample;
  output.value = '';
  error.value = '';
  copied.value = false;
  converted.value = false;
});

watch(encoderSettings, (next) => {
  if (encoders.includes(next.default_algorithm as Encoder)) {
    selected.value = next.default_algorithm as Encoder;
  }
  mode.value = next.default_mode;
}, { deep: true });

const modeLabel = computed(() => (mode.value === 'encode' ? 'Encode → Decode' : 'Decode → Encode'));

const baseExtensions = computed(() => {
  const exts: any[] = [];
  if (editorSettings.value.theme === 'oneDark') exts.push(oneDark);
  if (editorSettings.value.line_numbers) exts.push(lineNumbers());
  if (editorSettings.value.word_wrap) exts.push(EditorView.lineWrapping);
  exts.push(EditorState.tabSize.of(editorSettings.value.tab_size));
  return exts;
});

const inputExtensions = computed(() => ([
  ...baseExtensions.value,
]));

const outputExtensions = computed(() => ([
  ...baseExtensions.value,
  selected.value === 'JWT' ? json() : [],
  EditorView.editable.of(false),
]));

// ── Split resize handlers ───────────────────────────────────────────────
function startResize(e: MouseEvent) {
  if (!splitRef.value) return;
  resizing = true;
  resizeStartX = e.clientX;
  resizeStartW = leftWidth.value || Math.floor((splitRef.value.clientWidth ?? 900) / 2);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('mouseup', stopResize);
}

function onResizeMove(e: MouseEvent) {
  if (!resizing || !splitRef.value) return;
  const totalW = splitRef.value.clientWidth || 900;
  const delta = e.clientX - resizeStartX;
  const next = Math.max(180, Math.min(resizeStartW + delta, totalW - 180));
  leftWidth.value = next;
}

function stopResize() {
  if (!resizing) return;
  resizing = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', stopResize);
}

function run(mode: 'encode' | 'decode') {
  error.value = '';
  try {
    const src = encoderSettings.value.auto_trim ? input.value.trim() : input.value;
    output.value = selected.value === 'Base64'
      ? base64(mode, src)
      : selected.value === 'Base64url'
        ? base64url(mode, src)
        : selected.value === 'URL'
          ? url(mode, src)
          : selected.value === 'Hex'
            ? hex(mode, src)
            : jwt(mode, src);
    copied.value = false;
    converted.value = true;
    if (convertTimer) clearTimeout(convertTimer);
    convertTimer = setTimeout(() => (converted.value = false), 1200);
  } catch (e: any) {
    error.value = e?.stack ?? e?.message ?? 'Error';
    output.value = '';
    converted.value = false;
  }
}

function base64(mode: 'encode' | 'decode', val: string): string {
  return mode === 'encode' ? btoa(unescape(encodeURIComponent(val))) : decodeURIComponent(escape(atob(val)));
}

function base64url(mode: 'encode' | 'decode', val: string): string {
  if (mode === 'encode') {
    return base64('encode', val).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  const pad = val.length % 4 ? '='.repeat(4 - (val.length % 4)) : '';
  const normalized = val.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return base64('decode', normalized);
}

function url(mode: 'encode' | 'decode', val: string): string {
  return mode === 'encode' ? encodeURIComponent(val) : decodeURIComponent(val);
}

function hex(mode: 'encode' | 'decode', val: string): string {
  if (mode === 'encode') {
    return Array.from(val)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  }
  const clean = val.replace(/\s+/g, '');
  if (clean.length % 2 !== 0) throw new Error('Invalid hex length');
  return clean.match(/.{1,2}/g)?.map((h) => String.fromCharCode(parseInt(h, 16))).join('') ?? '';
}

function jwt(mode: 'encode' | 'decode', val: string): string {
  const trimmed = val.trim();
  if (mode === 'decode') {
    const parts = trimmed.split('.');
    if (parts.length < 2) throw new Error('Invalid JWT');
    const header = JSON.parse(base64url('decode', parts[0]));
    const payload = JSON.parse(base64url('decode', parts[1]));
    return JSON.stringify({ header, payload, signature: parts[2] ?? '' }, null, 2);
  }
  // Encode: expects JSON with { header, payload, signature? }
  const data = JSON.parse(trimmed);
  const header = base64url('encode', JSON.stringify(data.header ?? { alg: 'none', typ: 'JWT' }));
  const payload = base64url('encode', JSON.stringify(data.payload ?? {}));
  const sig = data.signature ?? '';
  return `${header}.${payload}.${sig}`;
}

async function copyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 1200);
  } catch (e: any) {
    error.value = e?.stack ?? e?.message ?? 'Copy failed';
  }
}

async function copyError() {
  if (!error.value) return;
  try {
    await navigator.clipboard.writeText(error.value);
  } catch (e: any) {
    error.value = e?.stack ?? e?.message ?? 'Copy failed';
  }
}

function clearInput() {
  input.value = '';
  output.value = '';
  error.value = '';
  copied.value = false;
  converted.value = false;
}

function swapPanels() {
  const tmp = input.value;
  input.value = output.value;
  output.value = tmp;
  error.value = '';
  copied.value = false;
  converted.value = false;
  mode.value = mode.value === 'encode' ? 'decode' : 'encode';
}

onMounted(() => {
  if (splitRef.value) {
    const totalW = splitRef.value.clientWidth || 900;
    leftWidth.value = Math.floor(totalW / 2);
  } else {
    leftWidth.value = 0;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
.tool-page {
  display: flex; flex-direction: column; height: 100%;
  overflow: hidden;
}
.tool-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; height: 44px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; background: transparent;
}
.tool-tabs { display: flex; gap: 2px; }
.tool-tab {
  padding: 4px 14px; border-radius: 6px; border: none;
  background: transparent; color: var(--text-muted);
  font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.12s;
}
.tool-tab:hover { background: var(--bg-elevated); color: var(--text-primary); }
.tool-tab.active { background: var(--primary); color: #fff; }
.tool-split { display: flex; flex: 1; overflow: hidden; }
.tool-pane { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.tool-pane-label {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text-muted); padding: 6px 16px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; background: rgba(12, 15, 24, 0.4);
}
.tool-error-label { color: var(--danger); text-transform: none; font-weight: 400; letter-spacing: 0; font-size: 11px; }
.tool-textarea {
  flex: 1; resize: none; background: transparent; border: none; outline: none;
  color: var(--text-primary); font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 13px; line-height: 1.7; padding: 16px; user-select: text;
}
.tool-textarea::placeholder { color: var(--text-muted); }
.tool-textarea-out { color: var(--text-secondary); }
.tool-resize-handle {
  width: 36px;
  flex-shrink: 0;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
}
.swap-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;
}
.swap-btn:hover {
  color: var(--primary);
  border-color: var(--primary);
  background: var(--primary-subtle);
}
.swap-btn:active { transform: scale(0.97); }

.mode-chip {
  font-size: 11px;
  color: var(--text-muted);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(12, 15, 24, 0.4);
}

.tool-editor { flex: 1; min-height: 0; }
:deep(.cm-editor) { height: 100%; background: transparent; }
:deep(.cm-scroller) {
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: var(--editor-font-size);
  line-height: 1.7;
}
:deep(.cm-gutters) { background: transparent; border-right: 1px solid var(--border); }

.tool-icon-btn { height: 22px; padding-left: 10px; padding-right: 10px; }
.tool-icon-btn.danger { color: var(--danger); }
.tool-icon-btn.danger:hover { background: var(--danger-subtle); color: var(--danger); }
.tool-icon-btn.success { color: var(--success); }
.tool-icon-btn.success:hover { background: rgba(52, 211, 153, 0.15); color: var(--success); }
.tool-copy-text {
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  color: var(--text-muted);
}
.tool-copy-text:hover { color: var(--text-primary); background: var(--bg-elevated); }

.tool-error-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  background: rgba(12, 15, 24, 0.4);
}
</style>
