<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSegmented } from '../../components/ui';
import { text, type TrimMode } from '../../services/text';

const input  = ref('   hello   \n   world   \n');
const mode   = ref<TrimMode>('lines');
const chars  = ref('');
const output = ref('');
const error  = ref('');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce:  ReturnType<typeof setTimeout> | null = null;

const modeOptions = [
  { label: 'Both',  value: 'both' },
  { label: 'Left',  value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Each line (both)', value: 'lines' },
];

async function run() {
  error.value = '';
  try {
    output.value = await text.trim({ input: input.value, mode: mode.value, chars: chars.value || undefined });
  } catch (e: any) { error.value = e?.message ?? String(e); }
}
watch([input, mode, chars], () => {
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
    </div>
    <div class="gen-form-grid" style="max-width: 480px;">
      <label class="gen-form-label">Custom chars</label>
      <UiInput v-model="chars" placeholder="(default: whitespace)" monospace />
    </div>

    <div class="text-grid">
      <div class="text-pane">
        <label class="text-pane-label">Input</label>
        <textarea v-model="input" class="text-area"></textarea>
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
