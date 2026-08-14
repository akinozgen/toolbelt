<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSlider } from '../../components/ui';

const cols = ref('1fr 1fr 1fr');
const rows = ref('80px 80px');
const gap  = ref(12);
const itemCount = ref(6);

const fullCss = computed(() =>
`display: grid;
grid-template-columns: ${cols.value};
grid-template-rows: ${rows.value};
gap: ${gap.value}px;`,
);

const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
async function copy() {
  await navigator.clipboard.writeText(fullCss.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}
</script>

<template>
  <div class="viz-form">
    <div class="viz-controls">
      <span class="viz-label">Columns</span>
      <UiInput v-model="cols" placeholder="1fr 2fr 1fr" monospace />
      <span class="viz-label">Rows</span>
      <UiInput v-model="rows" placeholder="80px 80px" monospace />
      <span class="viz-label">Gap</span>
      <div class="viz-value"><UiSlider v-model="gap" :min="0" :max="40" /><span class="viz-num">{{ gap }}px</span></div>
      <span class="viz-label">Items</span>
      <div class="viz-value"><UiSlider v-model="itemCount" :min="1" :max="20" /><span class="viz-num">{{ itemCount }}</span></div>
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 560px;">
      Track values: <code>1fr</code>, <code>200px</code>, <code>auto</code>, <code>minmax(100px, 1fr)</code>, <code>repeat(3, 1fr)</code>.
    </p>

    <div class="viz-preview viz-preview-solid">
      <div class="grid-target" :style="{
        gridTemplateColumns: cols,
        gridTemplateRows: rows,
        gap: gap + 'px',
      }">
        <div v-for="i in itemCount" :key="i" class="grid-item">{{ i }}</div>
      </div>
    </div>

    <div class="viz-css">
      <div class="viz-css-area" style="white-space: pre;">{{ fullCss }}</div>
      <UiButton variant="standard" size="sm" @click="copy" style="align-self: flex-start;">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy CSS' }}
      </UiButton>
    </div>
  </div>
</template>

<style scoped>
.grid-target {
  display: grid;
  width: 100%;
  max-width: 480px;
  background: var(--bg-base);
  padding: var(--space-3);
  border-radius: var(--radius);
}
.grid-item {
  background: var(--accent);
  color: var(--text-on-accent);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono);
  font-weight: var(--fw-semibold);
  border-radius: var(--radius-sm);
  min-height: 40px;
}
</style>
