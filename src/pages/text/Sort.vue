<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented, UiToggle } from '../../components/ui';
import { text, type SortMode } from '../../services/text';

const input    = ref('banana\napple\ncherry\nApple\n10\n2');
const mode     = ref<SortMode>('alpha');
const desc     = ref(false);
const cs       = ref(false);
const output   = ref('');
const error    = ref('');
const copied   = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce:  ReturnType<typeof setTimeout> | null = null;

const modeOptions = [
  { label: 'Alphabetical', value: 'alpha' },
  { label: 'Numeric',      value: 'numeric' },
  { label: 'Length',       value: 'length' },
];

async function run() {
  error.value = '';
  try {
    output.value = await text.sort({
      input: input.value,
      mode: mode.value,
      descending: desc.value,
      case_sensitive: cs.value,
    });
  } catch (e: any) { error.value = e?.message ?? String(e); }
}
watch([input, mode, desc, cs], () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(run, 150);
}, { immediate: true });

async function copy() {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}
</script>

<template>
  <div class="text-form">
    <div class="text-form-row">
      <UiSegmented v-model="mode" :options="modeOptions" size="sm" />
      <UiToggle v-model="desc" label="Descending" />
      <UiToggle v-model="cs" label="Case-sensitive" :disabled="mode !== 'alpha'" />
    </div>

    <div class="text-grid">
      <div class="text-pane">
        <label class="text-pane-label">Input</label>
        <textarea v-model="input" class="text-area" placeholder="One item per line"></textarea>
      </div>
      <div class="text-pane">
        <label class="text-pane-label">Output</label>
        <textarea readonly class="text-area" :value="output"></textarea>
      </div>
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div class="gen-actions">
      <UiButton variant="standard" size="sm" @click="copy" :disabled="!output">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy' }}
      </UiButton>
    </div>
  </div>
</template>
