<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Copy, Check, X, ScanLine } from 'lucide-vue-next';
import { UiButton } from '../../components/ui';
import { imageToBase64 } from '../../services/encode';
import { qr as qrSvc } from '../../services/generate';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

const IMAGE_EXTS = ['png','jpg','jpeg','gif','webp','bmp'];

const filePath  = ref<string | null>(null);
const fileName  = ref('');
const previewUri= ref('');
const decoded   = ref<string[]>([]);
const error     = ref('');
const isReading = ref(false);
const copiedIdx = ref<number>(-1);
let unlistenDrop: (() => void) | null = null;
let copyTimer: ReturnType<typeof setTimeout> | null = null;

function isImagePath(p: string): boolean {
  const ext = p.toLowerCase().split('.').pop() ?? '';
  return IMAGE_EXTS.includes(ext);
}

async function loadFromPath(path: string) {
  if (!isImagePath(path)) {
    error.value = `'${path.split(/[/\\]/).pop()}' isn't a supported image (PNG, JPG, GIF, WebP, BMP).`;
    return;
  }
  error.value = '';
  isReading.value = true;
  filePath.value = path;
  fileName.value = path.split(/[/\\]/).pop() ?? path;
  decoded.value = [];
  previewUri.value = '';

  try {
    // Load preview using existing image_to_base64 helper.
    const enc = await imageToBase64(path);
    previewUri.value = `data:${enc.mime};base64,${enc.base64}`;
    // Decode QR(s).
    decoded.value = await qrSvc.read(path);
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  } finally {
    isReading.value = false;
  }
}

async function browse() {
  try {
    const picked = await openDialog({
      multiple: false,
      directory: false,
      title: 'Select an image with a QR code',
      filters: [{ name: 'Image', extensions: IMAGE_EXTS }],
    });
    if (typeof picked === 'string') await loadFromPath(picked);
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  }
}

function clear() {
  filePath.value = null;
  fileName.value = '';
  previewUri.value = '';
  decoded.value = [];
  error.value = '';
}

async function copyOne(idx: number, value: string) {
  await navigator.clipboard.writeText(value);
  copiedIdx.value = idx;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copiedIdx.value = -1), 1200);
}

onMounted(async () => {
  unlistenDrop = await getCurrentWebview().onDragDropEvent((event) => {
    if (event.payload.type !== 'drop') return;
    const path = event.payload.paths[0];
    if (path) loadFromPath(path);
  });
});
onBeforeUnmount(() => {
  unlistenDrop?.();
  if (copyTimer) clearTimeout(copyTimer);
});
</script>

<template>
  <div class="gen-form" style="max-width: 880px;">
    <div :class="['qr-read-zone', { 'is-loaded': filePath, 'is-loading': isReading }]" @dragover.prevent @drop.prevent>
      <template v-if="!filePath">
        <ScanLine :size="28" class="qr-read-glyph" />
        <span class="qr-read-hint">Drop a QR image here, or</span>
        <UiButton variant="standard" size="sm" @click="browse">Browse…</UiButton>
        <span class="qr-read-note">PNG, JPG, GIF, WebP, BMP</span>
      </template>
      <template v-else>
        <img :src="previewUri" class="qr-read-preview" alt="" />
        <div class="qr-read-info">
          <div class="qr-read-name" :title="fileName">{{ fileName }}</div>
          <div v-if="isReading" class="qr-read-status">Decoding…</div>
          <div v-else-if="decoded.length" class="qr-read-status">
            {{ decoded.length }} code{{ decoded.length > 1 ? 's' : '' }} found
          </div>
        </div>
        <UiButton variant="subtle" size="sm" @click="clear">
          <template #icon><X :size="13" /></template>
          Clear
        </UiButton>
      </template>
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div v-if="decoded.length" class="qr-results">
      <div v-for="(item, i) in decoded" :key="i" class="qr-result">
        <div class="qr-result-head">
          <span class="qr-result-index">#{{ i + 1 }}</span>
          <UiButton variant="subtle" size="sm" @click="copyOne(i, item)">
            <template #icon><Check v-if="copiedIdx === i" :size="13" /><Copy v-else :size="13" /></template>
            {{ copiedIdx === i ? 'Copied' : 'Copy' }}
          </UiButton>
        </div>
        <textarea readonly class="gen-output-textarea" :value="item"></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-read-zone {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  min-height: 120px;
  flex-direction: column;
  justify-content: center;
}
.qr-read-zone.is-loaded {
  flex-direction: row;
  border-style: solid;
  align-items: center;
  text-align: left;
  padding: var(--space-3) var(--space-4);
}
.qr-read-zone.is-loading { opacity: 0.7; }
.qr-read-glyph { color: var(--text-tertiary); }
.qr-read-hint  { font-size: var(--fs-body); color: var(--text-secondary); }
.qr-read-note  { font-size: var(--fs-caption); color: var(--text-tertiary); margin-top: var(--space-2); }

.qr-read-preview {
  width: 64px;
  height: 64px;
  object-fit: contain;
  background:
    linear-gradient(45deg, var(--bg-base) 25%, transparent 25%),
    linear-gradient(-45deg, var(--bg-base) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--bg-base) 75%),
    linear-gradient(-45deg, transparent 75%, var(--bg-base) 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius);
}
.qr-read-info { flex: 1; min-width: 0; }
.qr-read-name {
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.qr-read-status {
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.qr-results {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.qr-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.qr-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.qr-result-index {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
}
</style>
