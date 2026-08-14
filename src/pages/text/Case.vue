<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented } from '../../components/ui';
import { text, type CaseTarget } from '../../services/text';

const input  = ref('helloWorld foo_bar BAZ-quux');
const target = ref<CaseTarget>('camel');
const output = ref('');
const error  = ref('');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce:  ReturnType<typeof setTimeout> | null = null;

const targetOptions = [
  { label: 'lower',     value: 'lower' },
  { label: 'UPPER',     value: 'upper' },
  { label: 'Title',     value: 'title' },
  { label: 'Sentence',  value: 'sentence' },
  { label: 'camelCase', value: 'camel' },
  { label: 'PascalCase',value: 'pascal' },
  { label: 'snake_case',value: 'snake' },
  { label: 'kebab-case',value: 'kebab' },
  { label: 'CONST',     value: 'constant' },
  { label: 'dot.case',  value: 'dot' },
];

async function run() {
  error.value = '';
  try {
    output.value = await text.case({ input: input.value, target: target.value });
  } catch (e: any) { error.value = e?.message ?? String(e); }
}
watch([input, target], () => {
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
    <div class="case-grid">
      <button
        v-for="opt in targetOptions"
        :key="opt.value"
        type="button"
        :class="['case-pill', { active: target === opt.value }]"
        @click="target = opt.value"
      >{{ opt.label }}</button>
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

<style scoped>
.case-grid {
  display: flex; flex-wrap: wrap; gap: var(--space-2);
}
.case-pill {
  padding: 0 var(--space-3);
  height: var(--control-height-sm);
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  cursor: default;
  transition: all var(--motion-fast) var(--ease-standard);
}
.case-pill:hover  { border-color: var(--accent); color: var(--text-primary); }
.case-pill.active {
  background: var(--accent-subtle);
  border-color: var(--accent);
  color: var(--accent);
}
</style>
