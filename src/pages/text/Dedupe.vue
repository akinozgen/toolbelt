<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiToggle } from '../../components/ui';
import { text } from '../../services/text';

const input  = ref('apple\nbanana\nApple\napple\nBanana\n  apple');
const preserve = ref(true);
const trimCmp  = ref(true);
const ci       = ref(true);
const output   = ref('');
const error    = ref('');
const copied   = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce:  ReturnType<typeof setTimeout> | null = null;

async function run() {
  error.value = '';
  try {
    output.value = await text.dedupe({
      input: input.value,
      preserve_order: preserve.value,
      trim_compare: trimCmp.value,
      case_insensitive: ci.value,
    });
  } catch (e: any) { error.value = e?.message ?? String(e); }
}
watch([input, preserve, trimCmp, ci], () => {
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
      <UiToggle v-model="preserve" label="Preserve order" />
      <UiToggle v-model="trimCmp" label="Trim before compare" />
      <UiToggle v-model="ci" label="Case-insensitive" />
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
