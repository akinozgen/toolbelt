<script lang="ts" setup>
import { ref, watch } from 'vue';
import { text, type CountResult } from '../../services/text';

const input  = ref('Hello world!\n\nThis is a sample paragraph. It has two sentences.\n\nAnother paragraph here.');
const stats  = ref<CountResult | null>(null);
let debounce: ReturnType<typeof setTimeout> | null = null;

async function run() {
  try {
    stats.value = await text.count(input.value);
  } catch {
    stats.value = null;
  }
}
watch(input, () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(run, 100);
}, { immediate: true });
</script>

<template>
  <div class="text-form">
    <div class="text-pane">
      <label class="text-pane-label">Text</label>
      <textarea v-model="input" class="text-area" style="min-height: 200px;"></textarea>
    </div>

    <div v-if="stats" class="counter-grid">
      <div class="counter-card">
        <div class="counter-value">{{ stats.chars.toLocaleString() }}</div>
        <div class="counter-label">Characters</div>
      </div>
      <div class="counter-card">
        <div class="counter-value">{{ stats.bytes.toLocaleString() }}</div>
        <div class="counter-label">Bytes (UTF-8)</div>
      </div>
      <div class="counter-card">
        <div class="counter-value">{{ stats.words.toLocaleString() }}</div>
        <div class="counter-label">Words</div>
      </div>
      <div class="counter-card">
        <div class="counter-value">{{ stats.lines.toLocaleString() }}</div>
        <div class="counter-label">Lines</div>
      </div>
      <div class="counter-card">
        <div class="counter-value">{{ stats.sentences.toLocaleString() }}</div>
        <div class="counter-label">Sentences</div>
      </div>
      <div class="counter-card">
        <div class="counter-value">{{ stats.paragraphs.toLocaleString() }}</div>
        <div class="counter-label">Paragraphs</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.counter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-3);
  max-width: 720px;
}
.counter-card {
  display: flex; flex-direction: column; gap: 2px;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.counter-value {
  font-family: var(--font-mono);
  font-size: var(--fs-title);
  font-weight: var(--fw-semibold);
  color: var(--accent);
}
.counter-label {
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
