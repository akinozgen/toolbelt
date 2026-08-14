<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Copy, Check, Plus, Trash2 } from 'lucide-vue-next';
import { UiButton, UiSlider, UiToggle } from '../../components/ui';

interface Shadow {
  x: number; y: number; blur: number; spread: number; color: string; inset: boolean;
}

const shadows = ref<Shadow[]>([
  { x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(0, 0, 0, 0.20)', inset: false },
]);

const css = computed(() =>
  shadows.value
    .map((s) => `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`)
    .join(',\n          '),
);
const fullCss = computed(() => `box-shadow: ${css.value};`);

function addShadow() {
  shadows.value.push({ x: 0, y: 4, blur: 12, spread: 0, color: 'rgba(0, 0, 0, 0.15)', inset: false });
}
function removeShadow(i: number) {
  shadows.value.splice(i, 1);
}

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
    <div v-for="(s, i) in shadows" :key="i" class="shadow-card">
      <div class="shadow-card-head">
        <span class="shadow-card-title">Shadow {{ i + 1 }}</span>
        <UiButton variant="subtle" size="sm" @click="removeShadow(i)" :disabled="shadows.length === 1">
          <template #icon><Trash2 :size="13" /></template>
        </UiButton>
      </div>
      <div class="viz-controls">
        <span class="viz-label">Offset X</span>
        <div class="viz-value"><UiSlider v-model="s.x" :min="-60" :max="60" /><span class="viz-num">{{ s.x }}px</span></div>
        <span class="viz-label">Offset Y</span>
        <div class="viz-value"><UiSlider v-model="s.y" :min="-60" :max="60" /><span class="viz-num">{{ s.y }}px</span></div>
        <span class="viz-label">Blur</span>
        <div class="viz-value"><UiSlider v-model="s.blur" :min="0" :max="120" /><span class="viz-num">{{ s.blur }}px</span></div>
        <span class="viz-label">Spread</span>
        <div class="viz-value"><UiSlider v-model="s.spread" :min="-40" :max="40" /><span class="viz-num">{{ s.spread }}px</span></div>
        <span class="viz-label">Color</span>
        <div class="viz-value">
          <input type="color" class="viz-color" v-model="s.color" />
          <input class="text-area" style="min-height: 0; height: 28px; max-width: 220px; padding: 0 8px;" v-model="s.color" />
        </div>
        <span class="viz-label">Inset</span>
        <UiToggle v-model="s.inset" />
      </div>
    </div>

    <UiButton variant="subtle" size="sm" @click="addShadow">
      <template #icon><Plus :size="13" /></template>
      Add shadow
    </UiButton>

    <div class="viz-preview viz-preview-solid">
      <div class="shadow-target" :style="{ boxShadow: css }"></div>
    </div>

    <div class="viz-css">
      <div class="viz-css-area">{{ fullCss }}</div>
      <UiButton variant="standard" size="sm" @click="copy" style="align-self: flex-start;">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy CSS' }}
      </UiButton>
    </div>
  </div>
</template>

<style scoped>
.shadow-card {
  padding: var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  display: flex; flex-direction: column; gap: var(--space-3);
}
.shadow-card-head {
  display: flex; align-items: center; justify-content: space-between;
}
.shadow-card-title {
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  color: var(--text-secondary);
}
.shadow-target {
  width: 200px; height: 120px;
  background: var(--accent);
  border-radius: var(--radius-md);
}
</style>
