<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented } from '../../components/ui';
import { text, type EscapeKind } from '../../services/text';

const input  = ref('Hello "world"\nLine 2\tTabbed');
const kind   = ref<EscapeKind>('json');
const output = ref('');
const error  = ref('');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce:  ReturnType<typeof setTimeout> | null = null;

const kindOptions = [
  { label: 'JSON',  value: 'json' },
  { label: 'HTML',  value: 'html' },
  { label: 'Regex', value: 'regex' },
  { label: 'Shell', value: 'shell' },
  { label: 'SQL',   value: 'sql' },
  { label: 'URL',   value: 'url' },
];

async function run() {
  error.value = '';
  try {
    output.value = await text.escape({ input: input.value, kind: kind.value });
  } catch (e: any) { error.value = e?.message ?? String(e); }
}
watch([input, kind], () => {
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
      <UiSegmented v-model="kind" :options="kindOptions" size="sm" />
    </div>

    <div class="text-grid">
      <div class="text-pane">
        <label class="text-pane-label">Input</label>
        <textarea v-model="input" class="text-area"></textarea>
      </div>
      <div class="text-pane">
        <label class="text-pane-label">Escaped</label>
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
