<template>
  <div class="hasher-page">

    <!-- Input -->
    <div class="hasher-section hasher-input-section">
      <div class="hasher-row-header">
        <span class="hasher-label">Input</span>
        <div class="mode-tabs">
          <button :class="['mode-tab', { active: mode === 'text' }]" @click="mode = 'text'">Text</button>
          <button :class="['mode-tab', { active: mode === 'file' }]" @click="mode = 'file'">File</button>
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
        class="file-zone"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <input ref="fileInputRef" type="file" style="display:none" @change="onFileChange" />
        <template v-if="!fileName">
          <Upload :size="28" style="color: var(--text-muted)" />
          <span class="file-zone-hint">Drop a file here or</span>
          <button class="btn btn-secondary btn-sm" @click="fileInputRef?.click()">Browse</button>
        </template>
        <template v-else>
          <FileText :size="22" style="color: var(--primary); flex-shrink:0" />
          <div class="file-info-text">
            <span class="file-name">{{ fileName }}</span>
            <span class="file-size">{{ formatSize(fileSize) }}</span>
          </div>
          <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="clearFile"><X :size="14" /></button>
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
            @click="selectedAlgo = algo"
          >{{ algo }}</button>
        </div>
      </div>
      <div class="hasher-hash-row">
        <span class="hasher-hash-value" :class="{ muted: !hash }">{{ hash || '—' }}</span>
        <button v-if="hash" class="btn btn-secondary btn-sm hasher-copy-btn" @click="copyHash">
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
import { ref, computed, watch } from 'vue';
import { Check, ClipboardCopy, X, Upload, FileText } from 'lucide-vue-next';
import { Md5 } from 'ts-md5/dist/md5';
import Clipboard from '../helpers/clipboard';

const algorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'] as const;
type Algo = typeof algorithms[number];

const mode         = ref<'text' | 'file'>('text');
const textInput    = ref('');
const selectedAlgo = ref<Algo>('MD5');
const hash         = ref('');
const copied       = ref(false);
const checkHash    = ref('');

const fileInputRef = ref<HTMLInputElement | null>(null);
const fileName     = ref('');
const fileSize     = ref(0);
const fileData     = ref<ArrayBuffer | null>(null);

// ── Hash computation ──────────────────────────────────────────────────
async function computeHash() {
  const algo = selectedAlgo.value;

  if (mode.value === 'text') {
    if (!textInput.value) { hash.value = ''; return; }
    if (algo === 'MD5') {
      hash.value = Md5.hashStr(textInput.value) as string;
    } else {
      const buf = new TextEncoder().encode(textInput.value);
      hash.value = await digestBuf(algo, buf);
    }
  } else {
    if (!fileData.value) { hash.value = ''; return; }
    if (algo === 'MD5') {
      const md5 = new Md5();
      md5.appendByteArray(new Uint8Array(fileData.value));
      hash.value = md5.end() as string;
    } else {
      hash.value = await digestBuf(algo, fileData.value);
    }
  }
}

async function digestBuf(algo: string, buf: ArrayBuffer | Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(algo, buf);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

watch([mode, textInput, selectedAlgo, fileData], computeHash);

// ── File handling ─────────────────────────────────────────────────────
function loadFile(file: File) {
  fileName.value = file.name;
  fileSize.value = file.size;
  const reader = new FileReader();
  reader.onload = e => { fileData.value = e.target?.result as ArrayBuffer; };
  reader.readAsArrayBuffer(file);
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) loadFile(file);
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (file) loadFile(file);
}

function clearFile() {
  fileName.value = '';
  fileSize.value = 0;
  fileData.value = null;
  hash.value = '';
  if (fileInputRef.value) fileInputRef.value.value = '';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
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
  background: var(--border);
  flex-shrink: 0;
}

.hasher-section {
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
}

/* Mode tabs */
.mode-tabs {
  display: flex;
  gap: 2px;
  background: rgba(20, 24, 38, 0.7);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3px;
}
.mode-tab {
  padding: 3px 14px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.mode-tab.active {
  background: var(--primary);
  color: #fff;
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
  font-size: 15px;
  line-height: 1.7;
  font-family: inherit;
  user-select: text;
}
.hasher-textarea::placeholder { color: var(--text-muted); }

/* File zone */
.file-zone {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  transition: border-color 0.15s;
}
.file-zone:hover { border-color: var(--primary); }
.file-zone-hint { font-size: 13px; color: var(--text-muted); }

/* File loaded state */
.file-zone:has(.file-info-text) {
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0 20px;
  gap: 14px;
  border-style: solid;
  border-color: rgba(99, 102, 241, 0.3);
  background: var(--primary-subtle);
}
.file-info-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.file-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.file-size { font-size: 12px; color: var(--text-muted); }

/* Algorithm pills */
.algo-pills {
  display: flex;
  gap: 6px;
}
.algo-btn {
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(20, 24, 38, 0.7);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.algo-btn:hover { border-color: var(--primary); color: var(--primary); }
.algo-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

/* Hash output */
.hasher-hash-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.hasher-hash-value {
  flex: 1;
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: 14px;
  letter-spacing: 0.05em;
  color: var(--accent);
  user-select: text;
  word-break: break-all;
  line-height: 1.5;
}
.hasher-hash-value.muted { color: var(--text-muted); }
.hasher-copy-btn { flex-shrink: 0; }

/* Verify */
.hasher-verify-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hasher-verify-input {
  flex: 1;
  padding: 9px 14px;
  background: rgba(20, 24, 38, 0.7);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  user-select: text;
}
.hasher-verify-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--primary-subtle);
}
.hasher-verify-input::placeholder { color: var(--text-muted); font-family: inherit; }

.match-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.match-badge.is-match {
  background: rgba(52, 211, 153, 0.15);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: var(--success);
}
.match-badge.no-match {
  background: var(--danger-subtle);
  border: 1px solid rgba(248, 113, 113, 0.25);
  color: var(--danger);
}
</style>
