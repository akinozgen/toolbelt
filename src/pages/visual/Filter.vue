<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSlider } from '../../components/ui';

const blur       = ref(0);
const brightness = ref(100);
const contrast   = ref(100);
const grayscale  = ref(0);
const sepia      = ref(0);
const saturate   = ref(100);
const hueRotate  = ref(0);
const invert     = ref(0);

const filterStr = computed(() => {
  const parts: string[] = [];
  if (blur.value)            parts.push(`blur(${blur.value}px)`);
  if (brightness.value !== 100) parts.push(`brightness(${brightness.value}%)`);
  if (contrast.value !== 100)   parts.push(`contrast(${contrast.value}%)`);
  if (grayscale.value)       parts.push(`grayscale(${grayscale.value}%)`);
  if (sepia.value)           parts.push(`sepia(${sepia.value}%)`);
  if (saturate.value !== 100) parts.push(`saturate(${saturate.value}%)`);
  if (hueRotate.value)       parts.push(`hue-rotate(${hueRotate.value}deg)`);
  if (invert.value)          parts.push(`invert(${invert.value}%)`);
  return parts.length ? parts.join(' ') : 'none';
});
const fullCss = computed(() => `filter: ${filterStr.value};`);

const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
async function copy() {
  await navigator.clipboard.writeText(fullCss.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}

function reset() {
  blur.value = 0; brightness.value = 100; contrast.value = 100;
  grayscale.value = 0; sepia.value = 0; saturate.value = 100;
  hueRotate.value = 0; invert.value = 0;
}
</script>

<template>
  <div class="viz-form">
    <div class="viz-controls">
      <span class="viz-label">Blur</span>
      <div class="viz-value"><UiSlider v-model="blur" :min="0" :max="20" /><span class="viz-num">{{ blur }}px</span></div>
      <span class="viz-label">Brightness</span>
      <div class="viz-value"><UiSlider v-model="brightness" :min="0" :max="200" /><span class="viz-num">{{ brightness }}%</span></div>
      <span class="viz-label">Contrast</span>
      <div class="viz-value"><UiSlider v-model="contrast" :min="0" :max="200" /><span class="viz-num">{{ contrast }}%</span></div>
      <span class="viz-label">Grayscale</span>
      <div class="viz-value"><UiSlider v-model="grayscale" :min="0" :max="100" /><span class="viz-num">{{ grayscale }}%</span></div>
      <span class="viz-label">Sepia</span>
      <div class="viz-value"><UiSlider v-model="sepia" :min="0" :max="100" /><span class="viz-num">{{ sepia }}%</span></div>
      <span class="viz-label">Saturate</span>
      <div class="viz-value"><UiSlider v-model="saturate" :min="0" :max="300" /><span class="viz-num">{{ saturate }}%</span></div>
      <span class="viz-label">Hue rotate</span>
      <div class="viz-value"><UiSlider v-model="hueRotate" :min="0" :max="360" /><span class="viz-num">{{ hueRotate }}°</span></div>
      <span class="viz-label">Invert</span>
      <div class="viz-value"><UiSlider v-model="invert" :min="0" :max="100" /><span class="viz-num">{{ invert }}%</span></div>
    </div>

    <div class="viz-preview">
      <div class="filter-target" :style="{ filter: filterStr }"></div>
    </div>

    <div class="viz-css">
      <div class="viz-css-area">{{ fullCss }}</div>
      <div class="gen-actions">
        <UiButton variant="standard" size="sm" @click="copy">
          <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
          {{ copied ? 'Copied' : 'Copy CSS' }}
        </UiButton>
        <UiButton variant="subtle" size="sm" @click="reset">Reset</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-target {
  width: 280px; height: 180px;
  background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #556270 100%);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}
.filter-target::after {
  content: '';
  position: absolute;
  inset: 30%;
  background: radial-gradient(circle, rgba(255,255,255,0.6), transparent);
  border-radius: 50%;
}
</style>
