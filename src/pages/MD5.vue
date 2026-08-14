<template>
  <div class="hasher-page">

    <!-- Input -->
    <div class="hasher-section hasher-input-section">
      <div class="hasher-row-header">
        <span class="hasher-label">Input</span>
        <div class="mode-tabs">
          <button :class="['mode-tab', { active: mode === 'text' }]" @click="setMode('text')">Text</button>
          <button :class="['mode-tab', { active: mode === 'file' }]" @click="setMode('file')">File</button>
        </div>
      </div>

      <textarea
        v-if="mode === 'text'"
        class="hasher-textarea"
        placeholder="Type or paste text here..."
        autofocus
        v-model="textInput"
      ></textarea>

      <div
        v-else
        :class="['file-zone', { 'is-loaded': hasFile, 'is-hashing': isHashing, 'is-dragging': isDragging }]"
        @dragover.prevent
        @drop.prevent
      >
        <template v-if="!hasFile">
          <Upload :size="28" class="file-zone-glyph" />
          <span class="file-zone-hint">Drop a file here, or</span>
          <button class="btn btn-secondary btn-sm" @click="browseFile">Browse…</button>
          <span class="file-zone-note">Files are streamed from disk — size doesn't matter.</span>
        </template>

        <template v-else>
          <FileText :size="22" class="file-icon" />
          <div class="file-info-text">
            <span class="file-name" :title="fileName">{{ fileName }}</span>
            <span class="file-meta">{{ formatSize(fileSize) }}</span>
          </div>

          <div v-if="isHashing" class="file-progress">
            <div class="hashing-bar"><span></span></div>
            <span class="hashing-text">
              Hashing… {{ formatDuration(elapsedMs) }}
              <template v-if="estimatedMs"> · est. {{ formatDuration(estimatedMs) }}</template>
            </span>
          </div>
          <div v-else-if="hashError" class="file-error">{{ hashError }}</div>
          <div v-else-if="lastHashMs !== null" class="file-done">
            Done in {{ formatDuration(lastHashMs) }}
          </div>

          <button class="btn btn-ghost btn-sm file-clear" @click="clearFile" :disabled="isHashing">
            <X :size="14" />
          </button>
        </template>
      </div>
    </div>

    <div class="hasher-divider"></div>

    <!-- Algorithm + Output -->
    <div class="hasher-section">
      <div class="hasher-row-header">
        <span class="hasher-label">Algorithm</span>
        <div class="algo-pills">
          <button
            v-for="algo in algorithms"
            :key="algo"
            :class="['algo-btn', { active: selectedAlgo === algo }]"
            :disabled="isHashing"
            @click="selectedAlgo = algo"
          >{{ algo }}</button>
        </div>
      </div>
      <div class="hasher-hash-row">
        <span class="hasher-hash-value" :class="{ muted: !hash }">
          <template v-if="isHashing">
            Computing {{ selectedAlgo }}…
          </template>
          <template v-else>{{ hash || '—' }}</template>
        </span>
        <button v-if="hash && !isHashing" class="btn btn-secondary btn-sm hasher-copy-btn" @click="copyHash">
          <Check v-if="copied" :size="13" />
          <ClipboardCopy v-else :size="13" />
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </div>

    <div class="hasher-divider"></div>

    <!-- Verify -->
    <div class="hasher-section">
      <span class="hasher-label">Verify</span>
      <div class="hasher-verify-row">
        <input
          class="hasher-verify-input"
          placeholder="Paste a hash to compare..."
          v-model="checkHash"
          spellcheck="false"
        />
        <div v-if="matchResult !== null" :class="['match-badge', matchResult ? 'is-match' : 'no-match']">
          <Check v-if="matchResult" :size="13" />
          <X v-else :size="13" />
          {{ matchResult ? 'Match' : 'No Match' }}
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { Check, ClipboardCopy, X, Upload, FileText } from 'lucide-vue-next';
import Clipboard from '../helpers/clipboard';
import { computeHash as computeHashService, type HashAlgo } from '../services/hash';
import { getSystemInfo } from '../services/system';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { stat } from '@tauri-apps/plugin-fs';
import { open as openFileDialog } from '@tauri-apps/plugin-dialog';

const algorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'] as const;
type Algo = HashAlgo;

// Empirical streaming throughput on a modern SSD + AES-NI CPU. Used only for
// the "est." hint — real wall-time is what matters and is shown live.
const THROUGHPUT_MBPS: Record<Algo, number> = {
  'MD5':     500,
  'SHA-1':   450,
  'SHA-256': 380,
  'SHA-512': 480,
};

const mode         = ref<'text' | 'file'>('text');
const textInput    = ref('');
const selectedAlgo = ref<Algo>('MD5');
const hash         = ref('');
const copied       = ref(false);
const checkHash    = ref('');

// File state
const fileName     = ref('');
const fileSize     = ref(0);
const filePath     = ref<string | null>(null);
const isDragging   = ref(false);

// Hashing UI state
const isHashing    = ref(false);
const hashError    = ref('');
const elapsedMs    = ref(0);
const estimatedMs  = ref<number | null>(null);
const lastHashMs   = ref<number | null>(null);
let   hashStart    = 0;
let   elapsedTimer: ReturnType<typeof setInterval> | null = null;
let   hashGen = 0; // monotonically incremented, lets us drop stale results

const hasFile = computed(() => filePath.value !== null);

// ── Tauri drop listener ───────────────────────────────────────────────
let unlistenDrop: (() => void) | null = null;

onMounted(async () => {
  // (Pre-cache, even if unused right now, for future hints.)
  await getSystemInfo().catch(() => null);

  unlistenDrop = await getCurrentWebview().onDragDropEvent((event) => {
    isDragging.value = event.payload.type === 'over';
    if (event.payload.type === 'drop') {
      const paths = event.payload.paths;
      if (paths.length > 0) {
        mode.value = 'file';
        loadFromPath(paths[0]);
      }
    }
  });
});

onBeforeUnmount(() => {
  unlistenDrop?.();
  if (elapsedTimer) clearInterval(elapsedTimer);
});

// ── Loading ───────────────────────────────────────────────────────────
async function loadFromPath(path: string) {
  try {
    const meta = await stat(path);
    if (meta.isDirectory) {
      hashError.value = 'Directories are not supported';
      return;
    }
    filePath.value  = path;
    fileSize.value  = Number(meta.size ?? 0);
    fileName.value  = path.split(/[/\\]/).pop() ?? path;
    hashError.value = '';
    runFileHash();
  } catch (e: any) {
    hashError.value = e?.message ?? String(e);
  }
}

async function browseFile() {
  try {
    const picked = await openFileDialog({
      multiple: false,
      directory: false,
      title: 'Select a file to hash',
    });
    if (typeof picked === 'string') {
      mode.value = 'file';
      await loadFromPath(picked);
    }
  } catch (e: any) {
    hashError.value = e?.message ?? String(e);
  }
}

function clearFile() {
  filePath.value  = null;
  fileName.value  = '';
  fileSize.value  = 0;
  hash.value      = '';
  hashError.value = '';
  lastHashMs.value = null;
  estimatedMs.value = null;
  elapsedMs.value = 0;
}

function setMode(next: 'text' | 'file') {
  mode.value = next;
  hash.value = '';
  hashError.value = '';
}

// ── Hash runners ──────────────────────────────────────────────────────
async function runTextHash() {
  if (!textInput.value) { hash.value = ''; return; }
  const myGen = ++hashGen;
  try {
    const out = await computeHashService(selectedAlgo.value, { kind: 'text', value: textInput.value });
    if (myGen === hashGen) hash.value = out;
  } catch (e: any) {
    if (myGen === hashGen) {
      hash.value = '';
      hashError.value = e?.message ?? String(e);
    }
  }
}

async function runFileHash() {
  if (!hasFile.value) return;
  const myGen = ++hashGen;
  isHashing.value = true;
  hash.value = '';
  hashError.value = '';
  lastHashMs.value = null;
  estimatedMs.value = estimateMs(fileSize.value, selectedAlgo.value);
  hashStart = performance.now();
  elapsedMs.value = 0;
  startElapsedTimer();

  try {
    const out = await computeHashService(
      selectedAlgo.value,
      { kind: 'path', value: filePath.value! },
    );

    if (myGen !== hashGen) return;
    hash.value = out;
    lastHashMs.value = performance.now() - hashStart;
  } catch (e: any) {
    if (myGen === hashGen) {
      hash.value = '';
      hashError.value = e?.message ?? String(e);
    }
  } finally {
    if (myGen === hashGen) {
      isHashing.value = false;
      stopElapsedTimer();
    }
  }
}

function startElapsedTimer() {
  stopElapsedTimer();
  elapsedTimer = setInterval(() => {
    elapsedMs.value = performance.now() - hashStart;
  }, 100);
}
function stopElapsedTimer() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer);
    elapsedTimer = null;
  }
}

watch([textInput, selectedAlgo, mode], () => {
  if (mode.value === 'text') {
    runTextHash();
  } else if (hasFile.value) {
    runFileHash();
  }
});

// ── Estimation & formatting ───────────────────────────────────────────
function estimateMs(sizeBytes: number, algo: Algo): number | null {
  if (!sizeBytes) return null;
  const sizeMB = sizeBytes / (1024 * 1024);
  return Math.round((sizeMB / THROUGHPUT_MBPS[algo]) * 1000);
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${Math.max(0, Math.round(ms))} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)} s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return r ? `${m}m ${r}s` : `${m}m`;
}

// ── Copy & verify ─────────────────────────────────────────────────────
function copyHash() {
  if (!hash.value) return;
  const cp = Clipboard({ appendToBody: false });
  cp.toClipboard(hash.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}

const matchResult = computed<boolean | null>(() => {
  if (!checkHash.value.trim() || !hash.value) return null;
  return checkHash.value.trim().toLowerCase() === hash.value.toLowerCase();
});
</script>

<style scoped>
.hasher-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.hasher-divider {
  height: 1px;
  background: var(--border-subtle);
  flex-shrink: 0;
}

.hasher-section {
  padding: var(--space-5) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex-shrink: 0;
}
.hasher-input-section {
  flex: 1;
  min-height: 0;
}

.hasher-row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hasher-label {
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}

/* Mode tabs */
.mode-tabs {
  display: flex;
  gap: 2px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius);
  padding: 2px;
}
.mode-tab {
  padding: 0 var(--space-3);
  height: 24px;
  border-radius: calc(var(--radius) - 2px);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--fs-caption);
  cursor: default;
  transition: background var(--motion-fast) var(--ease-standard),
              color var(--motion-fast) var(--ease-standard);
}
.mode-tab:hover { background: var(--bg-hover); color: var(--text-primary); }
.mode-tab.active {
  background: var(--bg-base);
  color: var(--text-primary);
}

/* Textarea */
.hasher-textarea {
  flex: 1;
  min-height: 0;
  width: 100%;
  resize: none;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--fs-subtitle);
  line-height: 1.6;
  font-family: inherit;
  user-select: text;
}
.hasher-textarea::placeholder { color: var(--text-tertiary); }

/* File zone */
.file-zone {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  transition: border-color var(--motion-fast) var(--ease-standard),
              background var(--motion-fast) var(--ease-standard);
}
.file-zone.is-dragging {
  border-color: var(--accent);
  background: var(--accent-subtle);
}
.file-zone-glyph { color: var(--text-tertiary); }
.file-zone-hint  { font-size: var(--fs-body); color: var(--text-secondary); }
.file-zone-note  {
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  margin-top: var(--space-2);
}

/* File loaded layout */
.file-zone.is-loaded {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  border-style: solid;
  padding: var(--space-3) var(--space-4);
  gap: var(--space-3);
}
.file-zone.is-hashing {
  border-color: var(--accent);
}
.file-icon { color: var(--accent); flex-shrink: 0; }

.file-info-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.file-name {
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-meta {
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.file-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
  margin-left: var(--space-3);
}
.hashing-bar {
  position: relative;
  height: 3px;
  border-radius: 2px;
  background: var(--bg-base);
  overflow: hidden;
}
.hashing-bar > span {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 30%;
  background: var(--accent);
  border-radius: 2px;
  animation: hashing-slide 1.4s var(--ease-standard) infinite;
}
@keyframes hashing-slide {
  0%   { left: -30%; }
  100% { left: 100%; }
}
.hashing-text {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  color: var(--text-secondary);
}

.file-error {
  flex: 1;
  margin-left: var(--space-3);
  font-size: var(--fs-caption);
  color: var(--danger);
}
.file-done {
  flex: 1;
  margin-left: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  color: var(--success);
}
.file-clear { margin-left: auto; }

/* Algorithm pills */
.algo-pills {
  display: flex;
  gap: var(--space-2);
}
.algo-btn {
  padding: 0 var(--space-3);
  height: var(--control-height-sm);
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: var(--fs-caption);
  font-weight: var(--fw-medium);
  cursor: default;
  transition: background var(--motion-fast) var(--ease-standard),
              border-color var(--motion-fast) var(--ease-standard),
              color var(--motion-fast) var(--ease-standard);
}
.algo-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--text-primary);
}
.algo-btn.active {
  background: var(--accent-subtle);
  border-color: var(--accent);
  color: var(--accent);
}
.algo-btn:disabled { opacity: 0.5; }

/* Hash output */
.hasher-hash-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: var(--control-height);
}
.hasher-hash-value {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  letter-spacing: 0.04em;
  color: var(--accent);
  user-select: text;
  word-break: break-all;
  line-height: 1.5;
}
.hasher-hash-value.muted { color: var(--text-tertiary); }
.hasher-copy-btn { flex-shrink: 0; }

/* Verify */
.hasher-verify-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.hasher-verify-input {
  flex: 1;
  height: var(--control-height);
  padding: 0 var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-bottom-color: var(--text-tertiary);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  outline: none;
  transition: border-color var(--motion-fast) var(--ease-standard);
  user-select: text;
}
.hasher-verify-input:focus {
  border-bottom: 2px solid var(--accent);
  padding-bottom: 0;
}
.hasher-verify-input::placeholder { color: var(--text-tertiary); font-family: inherit; }

.match-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 var(--space-3);
  height: var(--control-height-sm);
  border-radius: var(--radius);
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  flex-shrink: 0;
}
.match-badge.is-match {
  background: var(--success-bg);
  border: 1px solid var(--success);
  color: var(--success);
}
.match-badge.no-match {
  background: var(--danger-bg);
  border: 1px solid var(--danger);
  color: var(--danger);
}
</style>
