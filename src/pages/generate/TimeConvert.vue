<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSelect } from '../../components/ui';
import { time, type TimeFormat } from '../../services/generate';

const input  = ref('');
const format = ref<TimeFormat>('iso8601');
const value  = ref('');
const error  = ref('');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce:  ReturnType<typeof setTimeout> | null = null;

const formatOptions = [
  { label: 'Unix seconds',     value: 'unix-s'  },
  { label: 'Unix milliseconds', value: 'unix-ms' },
  { label: 'ISO 8601',          value: 'iso8601' },
  { label: 'RFC 3339',          value: 'rfc3339' },
  { label: 'RFC 2822',          value: 'rfc2822' },
];

async function convert() {
  error.value = '';
  value.value = '';
  if (!input.value.trim()) return;
  try {
    value.value = await time.convert(input.value, format.value);
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  }
}

watch([input, format], () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(convert, 200);
});

async function copy() {
  if (!value.value) return;
  await navigator.clipboard.writeText(value.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}
</script>

<template>
  <div class="gen-form" style="max-width: 720px;">
    <div class="gen-form-grid">
      <label class="gen-form-label">Input</label>
      <UiInput v-model="input" placeholder="1700000000 or 2023-11-14T22:13:20Z" monospace />

      <label class="gen-form-label">Output format</label>
      <UiSelect v-model="format" :options="formatOptions" />
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 560px;">
      Auto-detects Unix timestamps (seconds vs milliseconds by magnitude) and ISO/RFC date strings.
    </p>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div class="gen-output-row">
      <code class="gen-output-text" :class="{ muted: !value }">{{ value || '—' }}</code>
      <UiButton variant="standard" size="sm" @click="copy" :disabled="!value">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy' }}
      </UiButton>
    </div>
  </div>
</template>
