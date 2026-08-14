<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { Copy, RefreshCw, Check, Save } from 'lucide-vue-next';
import { UiButton, UiInput, UiSegmented, UiSlider } from '../../components/ui';
import { qr, saveText } from '../../services/generate';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';

const text       = ref('https://toolbelt.local');
const ecc        = ref<'L' | 'M' | 'Q' | 'H'>('M');
const moduleSize = ref(8);
const fg         = ref('#000000');
const bg         = ref('#FFFFFF');
const svg        = ref('');
const error      = ref('');
const copied     = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce:  ReturnType<typeof setTimeout> | null = null;

const eccOptions = [
  { label: 'L (~7%)',  value: 'L' },
  { label: 'M (~15%)', value: 'M' },
  { label: 'Q (~25%)', value: 'Q' },
  { label: 'H (~30%)', value: 'H' },
];

const dataUri = computed(() =>
  svg.value ? `data:image/svg+xml;utf8,${encodeURIComponent(svg.value)}` : '',
);

async function generate() {
  error.value = '';
  if (!text.value.trim()) {
    svg.value = '';
    return;
  }
  try {
    svg.value = await qr.generate({
      content: text.value,
      ecc: ecc.value,
      module_size: moduleSize.value,
      fg: fg.value,
      bg: bg.value,
    });
    copied.value = false;
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  }
}

watch([text, ecc, moduleSize, fg, bg], () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(generate, 200);
});
generate();

async function copy() {
  if (!svg.value) return;
  await navigator.clipboard.writeText(svg.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}

async function save() {
  if (!svg.value) return;
  try {
    const path = await saveDialog({
      defaultPath: 'qrcode.svg',
      filters: [{ name: 'SVG', extensions: ['svg'] }],
    });
    if (!path) return;
    await saveText(path, svg.value);
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  }
}

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer);
  if (debounce)  clearTimeout(debounce);
});
</script>

<template>
  <div class="gen-form" style="max-width: 920px;">
    <div class="gen-form-grid">
      <label class="gen-form-label">Content</label>
      <UiInput v-model="text" placeholder="URL or any text" />

      <label class="gen-form-label">Error correction</label>
      <UiSegmented v-model="ecc" :options="eccOptions" size="sm" />

      <label class="gen-form-label">Module size</label>
      <div class="gen-form-value">
        <UiSlider v-model="moduleSize" :min="2" :max="20" />
        <span class="mono" style="min-width: 32px; color: var(--text-secondary);">{{ moduleSize }}px</span>
      </div>

      <label class="gen-form-label">Foreground</label>
      <UiInput v-model="fg" placeholder="#000000" monospace />

      <label class="gen-form-label">Background</label>
      <UiInput v-model="bg" placeholder="#FFFFFF" monospace />
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div class="qr-preview">
      <img v-if="dataUri" :src="dataUri" class="qr-img" alt="" />
      <div v-else class="qr-empty">Enter content to render a QR code.</div>
    </div>

    <div class="gen-actions">
      <UiButton variant="standard" size="sm" @click="copy" :disabled="!svg">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied SVG' : 'Copy SVG' }}
      </UiButton>
      <UiButton variant="standard" size="sm" @click="save" :disabled="!svg">
        <template #icon><Save :size="13" /></template>
        Save…
      </UiButton>
      <UiButton variant="accent" size="sm" @click="generate">
        <template #icon><RefreshCw :size="13" /></template>
        Refresh
      </UiButton>
    </div>
  </div>
</template>

<style scoped>
.qr-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  min-height: 240px;
}
.qr-img {
  max-width: 320px;
  max-height: 320px;
  display: block;
}
.qr-empty {
  font-size: var(--fs-body);
  color: var(--text-tertiary);
}
</style>
