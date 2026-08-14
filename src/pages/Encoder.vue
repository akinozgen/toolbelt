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
      <div v-if="selected !== 'Image'" class="flex items-center gap-2">
        <span class="mode-chip">{{ modeLabel }}</span>
        <button class="btn btn-primary btn-sm" @click="run(mode)">
          {{ mode === 'encode' ? 'Encode' : 'Decode' }}
        </button>
      </div>
      <div v-else class="flex items-center gap-2">
        <UiSegmented v-model="imageMode" :options="imageModeOptions" size="sm" />
      </div>
    </div>

    <!-- Image / Encode mode: file → base64 -->
    <div v-if="selected === 'Image' && imageMode === 'encode'" class="image-mode">
      <div class="image-input-pane">
        <div class="tool-pane-label"><span>Source</span></div>
        <div
          :class="['image-zone', { 'is-loaded': hasImage, 'is-dragging': isImageDragging, 'is-loading': imageLoading }]"
          @dragover.prevent
          @drop.prevent
        >
          <template v-if="!hasImage">
            <ImageIcon :size="28" class="image-zone-glyph" />
            <span class="image-zone-hint">Drop an image, or</span>
            <button class="btn btn-secondary btn-sm" @click="browseImage" :disabled="imageLoading">
              {{ imageLoading ? 'Loading…' : 'Browse…' }}
            </button>
            <span class="image-zone-note">PNG, JPG, GIF, WebP, SVG, BMP, ICO, AVIF</span>
            <span v-if="imageError" class="image-error-text">{{ imageError }}</span>
          </template>
          <template v-else>
            <div class="image-preview-wrap">
              <img :src="imagePreviewUri" class="image-preview" alt="" />
            </div>
            <div class="image-info">
              <span class="image-name" :title="imageName">{{ imageName }}</span>
              <span class="image-meta">{{ imageMime }} · {{ formatSize(imageSize) }}</span>
              <span class="image-meta-out">Output ≈ {{ formatSize(Math.round(imageSize * 4 / 3)) }}</span>
            </div>
            <div class="image-actions">
              <button class="btn btn-ghost btn-sm" @click="browseImage" :disabled="imageLoading">Replace…</button>
              <button class="btn btn-ghost btn-sm" @click="clearImage" :disabled="imageLoading">
                <X :size="14" /> Clear
              </button>
            </div>
          </template>
        </div>
      </div>

      <div class="tool-resize-handle"></div>

      <div class="image-output-pane">
        <div class="tool-pane-label">
          <span>Output</span>
          <div class="flex items-center gap-2">
            <UiSegmented v-model="imageFormat" :options="imageFormatOptions" size="sm" />
            <button
              class="btn btn-ghost btn-sm tool-icon-btn"
              :class="{ success: imageCopied }"
              @click="copyImageOutput"
              :disabled="!imageOutput"
              :title="imageCopied ? 'Copied' : 'Copy'"
            >
              <Copy :size="14" /> {{ imageCopied ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </div>
        <div class="image-output-area">
          <textarea
            v-if="imageOutput"
            class="image-output-text"
            :value="imageOutput"
            readonly
            spellcheck="false"
          />
          <div v-else class="image-output-empty">Select an image to see the encoded output.</div>
        </div>
      </div>
    </div>

    <!-- Image / Decode mode: base64 → image -->
    <div v-else-if="selected === 'Image' && imageMode === 'decode'" class="image-mode">
      <div class="image-input-pane">
        <div class="tool-pane-label">
          <span>Base64 input</span>
          <button class="btn btn-ghost btn-sm tool-icon-btn danger" @click="clearDecodeInput" :disabled="!decodeInput">
            <Trash2 :size="14" />
          </button>
        </div>
        <div class="image-output-area">
          <textarea
            v-model="decodeInput"
            class="image-output-text"
            placeholder="Paste base64 or data URI…"
            spellcheck="false"
          />
        </div>
      </div>

      <div class="tool-resize-handle"></div>

      <div class="image-output-pane">
        <div class="tool-pane-label">
          <span>Preview</span>
          <button
            class="btn btn-ghost btn-sm tool-icon-btn"
            @click="saveDecodedImage"
            :disabled="!decodedB64 || decodeSaving"
            :title="decodeSaved ? 'Saved' : 'Save image…'"
          >
            <Check v-if="decodeSaved" :size="14" />
            <Save v-else :size="14" />
            {{ decodeSaving ? 'Saving…' : decodeSaved ? 'Saved' : 'Save…' }}
          </button>
        </div>

        <div v-if="decodeError" class="decode-error">{{ decodeError }}</div>

        <div v-if="decodedPreviewUri" class="decode-preview">
          <div class="image-preview-wrap decode-preview-canvas">
            <img :src="decodedPreviewUri" class="image-preview" alt="" />
          </div>
          <div class="image-info decode-info">
            <span class="image-meta">
              {{ decodedMime || 'unknown type' }} · {{ formatSize(decodedSize) }}
            </span>
          </div>
        </div>
        <div v-else-if="!decodeError" class="image-output-empty">
          Paste a base64 string or data URI on the left to preview the image.
        </div>
      </div>
    </div>

    <!-- Other modes: original split layout -->
    <div v-else class="tool-split" ref="splitRef">
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
import { json } from '@codemirror/lang-json';
import { Copy, Trash2, ArrowLeftRight, Image as ImageIcon, X, Save, Check } from 'lucide-vue-next';
import { useStore } from 'vuex';
import { key } from '../store';
import { convert as convertEncoding, imageToBase64, saveBase64ToFile } from '../services/encode';
import { toolbeltCm } from '../styles/cm-theme';
import { UiSegmented } from '../components/ui';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { open as openFileDialog, save as saveFileDialog } from '@tauri-apps/plugin-dialog';

const encoders = ['Base64', 'Base64url', 'URL', 'Hex', 'JWT', 'Image'] as const;
type Encoder = typeof encoders[number];

const IMAGE_EXTS = ['png','jpg','jpeg','gif','webp','svg','bmp','ico','avif','tif','tiff','apng'];

type ImageFormat = 'raw' | 'data-uri' | 'html' | 'css';
const imageFormatOptions = [
  { label: 'Raw',      value: 'raw' },
  { label: 'Data URI', value: 'data-uri' },
  { label: 'HTML',     value: 'html' },
  { label: 'CSS',      value: 'css' },
];

type ImageMode = 'encode' | 'decode';
const imageModeOptions = [
  { label: 'Encode', value: 'encode' },
  { label: 'Decode', value: 'decode' },
];

const MIME_TO_EXT: Record<string, string> = {
  'image/png':     'png',
  'image/jpeg':    'jpg',
  'image/gif':     'gif',
  'image/webp':    'webp',
  'image/svg+xml': 'svg',
  'image/bmp':     'bmp',
  'image/x-icon':  'ico',
  'image/avif':    'avif',
  'image/tiff':    'tiff',
  'image/apng':    'apng',
};

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

// ── Image / Encode state ────────────────────────────────────────────────
const imageMode        = ref<ImageMode>('encode');
const imagePath        = ref<string | null>(null);
const imageName        = ref('');
const imageSize        = ref(0);
const imageMime        = ref('');
const imageBase64      = ref('');
const imageFormat      = ref<ImageFormat>('data-uri');
const imageError       = ref('');
const imageLoading     = ref(false);
const imageCopied      = ref(false);
const isImageDragging  = ref(false);
let   imageCopyTimer: ReturnType<typeof setTimeout> | null = null;
let   imageGen = 0;
let   unlistenImageDrop: (() => void) | null = null;

// ── Image / Decode state ────────────────────────────────────────────────
const decodeInput  = ref('');
const decodedB64   = ref('');
const decodedMime  = ref('');
const decodedSize  = ref(0);
const decodeError  = ref('');
const decodeSaving = ref(false);
const decodeSaved  = ref(false);
let   decodeSavedTimer: ReturnType<typeof setTimeout> | null = null;

const hasImage = computed(() => imageBase64.value !== '' && imagePath.value !== null);

const imagePreviewUri = computed(() =>
  imageBase64.value ? `data:${imageMime.value};base64,${imageBase64.value}` : '',
);

const imageOutput = computed(() => {
  if (!imageBase64.value) return '';
  const uri = `data:${imageMime.value};base64,${imageBase64.value}`;
  const alt = imageName.value.replace(/\.[^.]+$/, '');
  switch (imageFormat.value) {
    case 'raw':       return imageBase64.value;
    case 'data-uri':  return uri;
    case 'html':      return `<img src="${uri}" alt="${alt}" />`;
    case 'css':       return `background-image: url("${uri}");`;
  }
});

const decodedPreviewUri = computed(() =>
  decodedB64.value ? `data:${decodedMime.value || 'application/octet-stream'};base64,${decodedB64.value}` : '',
);

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
const lastSample = ref<string>(sampleMap[selected.value as keyof typeof sampleMap] ?? '');
if (selected.value !== 'Image') input.value = lastSample.value;

watch(selected, (next) => {
  output.value = '';
  error.value = '';
  copied.value = false;
  converted.value = false;
  if (next === 'Image') return; // image mode keeps its own state
  const nextSample = sampleMap[next as keyof typeof sampleMap] ?? '';
  if (!input.value || input.value === lastSample.value) {
    input.value = nextSample;
  }
  lastSample.value = nextSample;
});

watch(encoderSettings, (next) => {
  if (encoders.includes(next.default_algorithm as Encoder)) {
    selected.value = next.default_algorithm as Encoder;
  }
  mode.value = next.default_mode;
}, { deep: true });

const modeLabel = computed(() => (mode.value === 'encode' ? 'Encode → Decode' : 'Decode → Encode'));

const baseExtensions = computed(() => {
  const exts: any[] = [...toolbeltCm];
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

async function run(mode: 'encode' | 'decode') {
  error.value = '';
  try {
    const src = encoderSettings.value.auto_trim ? input.value.trim() : input.value;
    output.value = await convertEncoding(selected.value, mode, src);
    copied.value = false;
    converted.value = true;
    if (convertTimer) clearTimeout(convertTimer);
    convertTimer = setTimeout(() => (converted.value = false), 1200);
  } catch (e: any) {
    error.value = e?.stack ?? e?.message ?? String(e);
    output.value = '';
    converted.value = false;
  }
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

// ── Image mode functions ──────────────────────────────────────────────
function isImagePath(p: string): boolean {
  const ext = p.toLowerCase().split('.').pop() ?? '';
  return IMAGE_EXTS.includes(ext);
}

async function loadImage(path: string) {
  imageError.value = '';
  imageLoading.value = true;
  const myGen = ++imageGen;
  try {
    const result = await imageToBase64(path);
    if (myGen !== imageGen) return;
    imagePath.value   = path;
    imageName.value   = path.split(/[/\\]/).pop() ?? path;
    imageMime.value   = result.mime;
    imageSize.value   = result.size_bytes;
    imageBase64.value = result.base64;
  } catch (e: any) {
    if (myGen === imageGen) {
      imageError.value = e?.message ?? String(e);
      clearImage();
    }
  } finally {
    if (myGen === imageGen) imageLoading.value = false;
  }
}

async function browseImage() {
  try {
    const picked = await openFileDialog({
      multiple: false,
      directory: false,
      title: 'Select an image',
      filters: [{
        name: 'Images',
        extensions: IMAGE_EXTS,
      }],
    });
    if (typeof picked === 'string') {
      selected.value = 'Image';
      await loadImage(picked);
    }
  } catch (e: any) {
    imageError.value = e?.message ?? String(e);
  }
}

function clearImage() {
  imagePath.value   = null;
  imageName.value   = '';
  imageSize.value   = 0;
  imageMime.value   = '';
  imageBase64.value = '';
  imageError.value  = '';
  imageCopied.value = false;
}

async function copyImageOutput() {
  if (!imageOutput.value) return;
  try {
    await navigator.clipboard.writeText(imageOutput.value);
    imageCopied.value = true;
    if (imageCopyTimer) clearTimeout(imageCopyTimer);
    imageCopyTimer = setTimeout(() => (imageCopied.value = false), 1200);
  } catch (e: any) {
    imageError.value = e?.message ?? 'Copy failed';
  }
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// ── Image / Decode functions ───────────────────────────────────────────
function detectMimeFromBase64(b64: string): string {
  try {
    const head = atob(b64.slice(0, 24));
    const b: number[] = [];
    for (let i = 0; i < head.length; i++) b.push(head.charCodeAt(i));
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image/png';
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
    if (b[0] === 0x42 && b[1] === 0x4D) return 'image/bmp';
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
        && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
    if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) return 'image/x-icon';
    if (head.startsWith('<?xml') || head.startsWith('<svg')) return 'image/svg+xml';
  } catch { /* ignore */ }
  return '';
}

function parseDecodeInput(raw: string): void {
  decodeError.value = '';
  decodedB64.value  = '';
  decodedMime.value = '';
  decodedSize.value = 0;

  const trimmed = raw.trim();
  if (!trimmed) return;

  let b64: string;
  let mime = '';
  const m = trimmed.match(/^data:([^;,]+);base64,([\s\S]+)$/);
  if (m) {
    mime = m[1].trim();
    b64  = m[2].replace(/\s+/g, '');
  } else {
    b64 = trimmed.replace(/\s+/g, '');
  }

  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(b64)) {
    decodeError.value = 'Input is not valid base64.';
    return;
  }

  // Sanity-decode the first few bytes; full decode happens in <img>.
  try {
    atob(b64.slice(0, Math.min(b64.length, 64)).replace(/-/g, '+').replace(/_/g, '/'));
  } catch {
    decodeError.value = 'Input is not valid base64.';
    return;
  }

  // Normalize URL-safe → standard for atob/img compatibility.
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');

  if (!mime) mime = detectMimeFromBase64(normalized);

  decodedB64.value  = normalized;
  decodedMime.value = mime;
  let estimated = Math.floor(normalized.length * 3 / 4);
  if (normalized.endsWith('==')) estimated -= 2;
  else if (normalized.endsWith('=')) estimated -= 1;
  decodedSize.value = estimated;
}

let decodeDebounce: ReturnType<typeof setTimeout> | null = null;
watch(decodeInput, (v) => {
  if (decodeDebounce) clearTimeout(decodeDebounce);
  decodeDebounce = setTimeout(() => parseDecodeInput(v), 150);
});

function clearDecodeInput() {
  decodeInput.value = '';
  decodedB64.value  = '';
  decodedMime.value = '';
  decodedSize.value = 0;
  decodeError.value = '';
  decodeSaved.value = false;
}

async function saveDecodedImage() {
  if (!decodedB64.value) return;
  const ext = MIME_TO_EXT[decodedMime.value] ?? 'bin';
  decodeSaved.value = false;
  try {
    const path = await saveFileDialog({
      defaultPath: `decoded.${ext}`,
      filters: ext !== 'bin'
        ? [{ name: 'Image', extensions: [ext] }]
        : undefined,
    });
    if (!path) return;
    decodeSaving.value = true;
    await saveBase64ToFile(decodedB64.value, path);
    decodeSaved.value = true;
    if (decodeSavedTimer) clearTimeout(decodeSavedTimer);
    decodeSavedTimer = setTimeout(() => (decodeSaved.value = false), 1500);
  } catch (e: any) {
    decodeError.value = e?.message ?? String(e);
  } finally {
    decodeSaving.value = false;
  }
}

onMounted(async () => {
  if (splitRef.value) {
    const totalW = splitRef.value.clientWidth || 900;
    leftWidth.value = Math.floor(totalW / 2);
  } else {
    leftWidth.value = 0;
  }
  unlistenImageDrop = await getCurrentWebview().onDragDropEvent((event) => {
    isImageDragging.value = event.payload.type === 'over';
    if (event.payload.type === 'drop') {
      const path = event.payload.paths[0];
      if (!path) return;
      selected.value = 'Image';
      imageMode.value = 'encode';
      if (!isImagePath(path)) {
        clearImage();
        imageError.value = `'${path.split(/[/\\]/).pop()}' isn't a supported image format.`;
        return;
      }
      loadImage(path);
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', stopResize);
  unlistenImageDrop?.();
  if (imageCopyTimer) clearTimeout(imageCopyTimer);
  if (decodeDebounce) clearTimeout(decodeDebounce);
  if (decodeSavedTimer) clearTimeout(decodeSavedTimer);
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
  background: transparent; color: var(--text-tertiary);
  font-size: 12px; font-weight: 500; cursor: default; transition: all 0.12s;
}
.tool-tab:hover { background: var(--bg-elevated); color: var(--text-primary); }
.tool-tab.active { background: var(--accent); color: #fff; }
.tool-split { display: flex; flex: 1; overflow: hidden; }
.tool-pane { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.tool-pane-label {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text-tertiary); padding: 6px 16px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; background: var(--bg-surface);
}
.tool-error-label { color: var(--danger); text-transform: none; font-weight: 400; letter-spacing: 0; font-size: 11px; }
.tool-textarea {
  flex: 1; resize: none; background: transparent; border: none; outline: none;
  color: var(--text-primary); font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 13px; line-height: 1.7; padding: 16px; user-select: text;
}
.tool-textarea::placeholder { color: var(--text-tertiary); }
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
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: all 0.12s;
}
.swap-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-subtle);
}
.swap-btn:active { transform: scale(0.97); }

.mode-chip {
  font-size: 11px;
  color: var(--text-tertiary);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--bg-surface);
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
  color: var(--text-tertiary);
}
.tool-copy-text:hover { color: var(--text-primary); background: var(--bg-elevated); }

.tool-error-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
}

/* ── Image mode ───────────────────────────────────────────────────── */
.image-mode {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
.image-input-pane,
.image-output-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.image-input-pane  { flex: 0 0 360px; }
.image-output-pane { flex: 1; }

.image-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-5);
  margin: var(--space-4);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  text-align: center;
  transition: border-color var(--motion-fast) var(--ease-standard),
              background   var(--motion-fast) var(--ease-standard);
}
.image-zone.is-dragging {
  border-color: var(--accent);
  background: var(--accent-subtle);
}
.image-zone.is-loaded {
  border-style: solid;
  text-align: left;
  align-items: stretch;
  justify-content: flex-start;
}
.image-zone.is-loading { opacity: 0.7; }

.image-zone-glyph { color: var(--text-tertiary); }
.image-zone-hint  { font-size: var(--fs-body); color: var(--text-secondary); }
.image-zone-note  {
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  margin-top: var(--space-2);
}
.image-error-text {
  font-size: var(--fs-caption);
  color: var(--danger);
  margin-top: var(--space-3);
}

.image-preview-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(45deg, var(--bg-base) 25%, transparent 25%),
    linear-gradient(-45deg, var(--bg-base) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--bg-base) 75%),
    linear-gradient(-45deg, transparent 75%, var(--bg-base) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-3);
  min-height: 0;
  overflow: hidden;
}
.image-preview {
  max-width: 100%;
  max-height: 240px;
  object-fit: contain;
  display: block;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}
.image-name {
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.image-meta,
.image-meta-out {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
}
.image-meta-out { color: var(--text-secondary); }

.image-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

.image-output-area {
  flex: 1;
  display: flex;
  min-height: 0;
  padding: var(--space-3) var(--space-4) var(--space-4);
}
.image-output-text {
  flex: 1;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  line-height: 1.5;
  padding: var(--space-3);
  outline: none;
  resize: none;
  user-select: text;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: auto;
}
.image-output-text:focus {
  border-color: var(--accent);
}
.image-output-text::placeholder {
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}
.image-output-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: var(--fs-body);
  color: var(--text-tertiary);
  padding: var(--space-5);
}

/* Decode-specific */
.decode-preview {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: var(--space-3) var(--space-4) var(--space-4);
  gap: var(--space-3);
}
.decode-preview-canvas {
  flex: 1;
  margin: 0;
  min-height: 0;
}
.decode-info {
  padding: 0;
  border: none;
}
.decode-info .image-meta {
  font-size: var(--fs-caption);
}
.decode-error {
  font-size: var(--fs-caption);
  color: var(--danger);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}
</style>
