<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented } from '../../components/ui';
import { text } from '../../services/text';

const input = ref('# Hello\n\nThis is **markdown**.\n\n- one\n- two\n- three\n\n```js\nconst x = 1;\n```\n');
const view = ref<'html' | 'preview'>('preview');
const output = ref('');
const error = ref('');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce:  ReturnType<typeof setTimeout> | null = null;

const viewOptions = [
  { label: 'Preview', value: 'preview' },
  { label: 'HTML',    value: 'html' },
];

async function run() {
  error.value = '';
  try {
    output.value = await text.markdown(input.value);
  } catch (e: any) { error.value = e?.message ?? String(e); }
}
watch(input, () => {
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
      <UiSegmented v-model="view" :options="viewOptions" size="sm" />
    </div>

    <div class="text-grid">
      <div class="text-pane">
        <label class="text-pane-label">Markdown</label>
        <textarea v-model="input" class="text-area"></textarea>
      </div>
      <div class="text-pane">
        <label class="text-pane-label">{{ view === 'preview' ? 'Preview' : 'HTML' }}</label>
        <textarea v-if="view === 'html'" readonly class="text-area" :value="output"></textarea>
        <div v-else class="md-preview" v-html="output"></div>
      </div>
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div class="gen-actions">
      <UiButton variant="standard" size="sm" @click="copy" :disabled="!output">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied HTML' : 'Copy HTML' }}
      </UiButton>
    </div>
  </div>
</template>

<style scoped>
.md-preview {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-4);
  min-height: 220px;
  overflow: auto;
  color: var(--text-primary);
  font-size: var(--fs-body);
  line-height: 1.6;
  user-select: text;
}
.md-preview :deep(h1),
.md-preview :deep(h2),
.md-preview :deep(h3) { color: var(--text-primary); margin: 1em 0 0.4em; font-weight: 600; }
.md-preview :deep(h1) { font-size: 1.4em; }
.md-preview :deep(h2) { font-size: 1.2em; }
.md-preview :deep(h3) { font-size: 1.05em; }
.md-preview :deep(code) {
  background: var(--bg-base); color: var(--accent);
  padding: 1px 5px; border-radius: var(--radius-sm);
  font-family: var(--font-mono); font-size: 0.9em;
}
.md-preview :deep(pre) {
  background: var(--bg-base); padding: var(--space-3);
  border-radius: var(--radius); overflow: auto;
}
.md-preview :deep(pre code) { background: transparent; padding: 0; color: var(--text-primary); }
.md-preview :deep(ul), .md-preview :deep(ol) { padding-left: var(--space-6); }
.md-preview :deep(blockquote) {
  border-left: 3px solid var(--border-strong); margin: 0;
  padding-left: var(--space-4); color: var(--text-secondary); font-style: italic;
}
.md-preview :deep(a) { color: var(--accent); }
.md-preview :deep(strong) { color: var(--text-primary); }
.md-preview :deep(table) { border-collapse: collapse; }
.md-preview :deep(th), .md-preview :deep(td) {
  border: 1px solid var(--border-subtle); padding: 4px 8px;
}
</style>
