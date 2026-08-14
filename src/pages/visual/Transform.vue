<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSlider } from '../../components/ui';

const rotate = ref(0);
const scaleX = ref(1);
const scaleY = ref(1);
const skewX  = ref(0);
const skewY  = ref(0);
const translateX = ref(0);
const translateY = ref(0);
const perspective = ref(0);

const transformStr = computed(() => {
  const parts: string[] = [];
  if (perspective.value) parts.push(`perspective(${perspective.value}px)`);
  if (translateX.value || translateY.value) parts.push(`translate(${translateX.value}px, ${translateY.value}px)`);
  if (rotate.value) parts.push(`rotate(${rotate.value}deg)`);
  if (scaleX.value !== 1 || scaleY.value !== 1) parts.push(`scale(${scaleX.value}, ${scaleY.value})`);
  if (skewX.value) parts.push(`skewX(${skewX.value}deg)`);
  if (skewY.value) parts.push(`skewY(${skewY.value}deg)`);
  return parts.length ? parts.join(' ') : 'none';
});
const fullCss = computed(() => `transform: ${transformStr.value};`);

function reset() {
  rotate.value = 0; scaleX.value = 1; scaleY.value = 1;
  skewX.value = 0; skewY.value = 0;
  translateX.value = 0; translateY.value = 0; perspective.value = 0;
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
      <span class="viz-label">Rotate</span>
      <div class="viz-value"><UiSlider v-model="rotate" :min="-360" :max="360" /><span class="viz-num">{{ rotate }}°</span></div>
      <span class="viz-label">Scale X</span>
      <div class="viz-value"><UiSlider v-model="scaleX" :min="-2" :max="2" :step="0.05" /><span class="viz-num">{{ scaleX.toFixed(2) }}</span></div>
      <span class="viz-label">Scale Y</span>
      <div class="viz-value"><UiSlider v-model="scaleY" :min="-2" :max="2" :step="0.05" /><span class="viz-num">{{ scaleY.toFixed(2) }}</span></div>
      <span class="viz-label">Skew X</span>
      <div class="viz-value"><UiSlider v-model="skewX" :min="-60" :max="60" /><span class="viz-num">{{ skewX }}°</span></div>
      <span class="viz-label">Skew Y</span>
      <div class="viz-value"><UiSlider v-model="skewY" :min="-60" :max="60" /><span class="viz-num">{{ skewY }}°</span></div>
      <span class="viz-label">Translate X</span>
      <div class="viz-value"><UiSlider v-model="translateX" :min="-100" :max="100" /><span class="viz-num">{{ translateX }}px</span></div>
      <span class="viz-label">Translate Y</span>
      <div class="viz-value"><UiSlider v-model="translateY" :min="-100" :max="100" /><span class="viz-num">{{ translateY }}px</span></div>
      <span class="viz-label">Perspective</span>
      <div class="viz-value"><UiSlider v-model="perspective" :min="0" :max="2000" /><span class="viz-num">{{ perspective }}px</span></div>
    </div>

    <div class="viz-preview viz-preview-solid">
      <div class="transform-target" :style="{ transform: transformStr }"></div>
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
.transform-target {
  width: 140px; height: 140px;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, white));
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-on-accent);
  font-family: var(--font-mono);
  font-weight: var(--fw-semibold);
  transition: transform var(--motion-fast) var(--ease-standard);
}
.transform-target::before { content: '↑'; font-size: 28px; }
</style>
