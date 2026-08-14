<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Copy, Check, Plus, Trash2 } from 'lucide-vue-next';
import { UiButton, UiSegmented, UiSlider } from '../../components/ui';

interface Stop { color: string; pos: number }
type GradientType = 'linear' | 'radial' | 'conic';

const type   = ref<GradientType>('linear');
const angle  = ref(135);
const stops  = ref<Stop[]>([
  { color: '#6366F1', pos: 0 },
  { color: '#EC4899', pos: 100 },
]);

const typeOptions = [
  { label: 'Linear', value: 'linear' },
  { label: 'Radial', value: 'radial' },
  { label: 'Conic',  value: 'conic' },
];

const stopsStr = computed(() =>
  [...stops.value].sort((a, b) => a.pos - b.pos)
    .map((s) => `${s.color} ${s.pos}%`).join(', '),
);

const gradientStr = computed(() => {
  if (type.value === 'linear') return `linear-gradient(${angle.value}deg, ${stopsStr.value})`;
  if (type.value === 'radial') return `radial-gradient(circle, ${stopsStr.value})`;
  return `conic-gradient(from ${angle.value}deg, ${stopsStr.value})`;
});

const fullCss = computed(() => `background: ${gradientStr.value};`);

function addStop() {
  stops.value.push({ color: '#FFFFFF', pos: 50 });
}
function removeStop(i: number) {
  if (stops.value.length > 2) stops.value.splice(i, 1);
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
    <div class="viz-controls">
      <span class="viz-label">Type</span>
      <UiSegmented v-model="type" :options="typeOptions" size="sm" />
      <template v-if="type !== 'radial'">
        <span class="viz-label">Angle</span>
        <div class="viz-value"><UiSlider v-model="angle" :min="0" :max="360" /><span class="viz-num">{{ angle }}°</span></div>
      </template>
    </div>

    <div class="stops-list">
      <div v-for="(s, i) in stops" :key="i" class="stop-row">
        <input type="color" class="viz-color" v-model="s.color" />
        <input class="text-area" style="min-height: 0; height: 28px; max-width: 130px; padding: 0 8px;" v-model="s.color" />
        <UiSlider v-model="s.pos" :min="0" :max="100" />
        <span class="viz-num">{{ s.pos }}%</span>
        <UiButton variant="subtle" size="sm" @click="removeStop(i)" :disabled="stops.length <= 2">
          <template #icon><Trash2 :size="13" /></template>
        </UiButton>
      </div>
    </div>

    <UiButton variant="subtle" size="sm" @click="addStop">
      <template #icon><Plus :size="13" /></template>
      Add stop
    </UiButton>

    <div class="viz-preview viz-preview-solid">
      <div class="gradient-target" :style="{ background: gradientStr }"></div>
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
.stops-list {
  display: flex; flex-direction: column; gap: var(--space-2);
  max-width: 720px;
}
.stop-row {
  display: grid;
  grid-template-columns: 36px 130px 1fr 56px auto;
  align-items: center;
  gap: var(--space-2);
}
.gradient-target {
  width: 320px; height: 200px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}
</style>
