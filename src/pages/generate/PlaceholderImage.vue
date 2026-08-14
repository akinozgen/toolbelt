<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Copy, RefreshCw, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSegmented } from '../../components/ui';
import { content } from '../../services/generate';

const width  = ref(640);
const height = ref(360);
const bg     = ref('#1F2937');
const fg     = ref('#F9FAFB');
const text   = ref('');
const format = ref<'data-uri' | 'svg'>('data-uri');
const svg    = ref('');
const error  = ref('');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce: ReturnType<typeof setTimeout> | null = null;

const formatOptions = [
  { label: 'Data URI', value: 'data-uri' },
  { label: 'Raw SVG',  value: 'svg' },
];

const dataUri = computed(() =>
  svg.value ? `data:image/svg+xml;utf8,${encodeURIComponent(svg.value)}` : '',
);
const output = computed(() => format.value === 'svg' ? svg.value : dataUri.value);

async function generate() {
  error.value = '';
  try {
    svg.value = await content.placeholderSvg({
      width: width.value,
      height: height.value,
      bg: bg.value,
      fg: fg.value,
      text: text.value || undefined,
    });
    copied.value = false;
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  }
}

watch([width, height, bg, fg, text], () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(generate, 200);
});

async function copy() {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}

generate();
</script>

<template>
  <div class="gen-form" style="max-width: 880px;">
    <div class="gen-form-grid">
      <label class="gen-form-label">Width</label>
      <UiInput v-model.number="width" type="number" />

      <label class="gen-form-label">Height</label>
      <UiInput v-model.number="height" type="number" />

      <label class="gen-form-label">Background</label>
      <UiInput v-model="bg" placeholder="#1F2937" monospace />

      <label class="gen-form-label">Text color</label>
      <UiInput v-model="fg" placeholder="#F9FAFB" monospace />

      <label class="gen-form-label">Text override</label>
      <UiInput v-model="text" :placeholder="`(default: ${width}×${height})`" />

      <label class="gen-form-label">Output format</label>
      <UiSegmented v-model="format" :options="formatOptions" size="sm" />
    </div>

    <div class="placeholder-preview">
      <img v-if="dataUri" :src="dataUri" alt="" class="placeholder-img" />
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div class="gen-output-area">
      <textarea readonly class="gen-output-textarea" :value="output"></textarea>
    </div>

    <div class="gen-actions">
      <UiButton variant="standard" size="sm" @click="copy">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy' }}
      </UiButton>
      <UiButton variant="accent" size="sm" @click="generate">
        <template #icon><RefreshCw :size="13" /></template>
        Refresh
      </UiButton>
    </div>
  </div>
</template>

<style scoped>
.placeholder-preview {
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
  padding: var(--space-4);
  min-height: 200px;
}
.placeholder-img {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
}
</style>
