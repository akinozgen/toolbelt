<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSlider } from '../../components/ui';

const blur     = ref(16);
const opacity  = ref(20);
const saturate = ref(160);
const radius   = ref(16);
const borderOpacity = ref(30);
const tint     = ref('#FFFFFF');

const tintRgb = computed(() => {
  const hex = tint.value.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
});
const bgRgba = computed(() => `rgba(${tintRgb.value.join(', ')}, ${opacity.value / 100})`);
const borderRgba = computed(() => `rgba(${tintRgb.value.join(', ')}, ${borderOpacity.value / 100})`);

const fullCss = computed(() =>
`background: ${bgRgba.value};
backdrop-filter: blur(${blur.value}px) saturate(${saturate.value}%);
-webkit-backdrop-filter: blur(${blur.value}px) saturate(${saturate.value}%);
border: 1px solid ${borderRgba.value};
border-radius: ${radius.value}px;`,
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
      <span class="viz-label">Blur</span>
      <div class="viz-value"><UiSlider v-model="blur" :min="0" :max="60" /><span class="viz-num">{{ blur }}px</span></div>
      <span class="viz-label">Opacity</span>
      <div class="viz-value"><UiSlider v-model="opacity" :min="0" :max="100" /><span class="viz-num">{{ opacity }}%</span></div>
      <span class="viz-label">Saturation</span>
      <div class="viz-value"><UiSlider v-model="saturate" :min="0" :max="300" /><span class="viz-num">{{ saturate }}%</span></div>
      <span class="viz-label">Radius</span>
      <div class="viz-value"><UiSlider v-model="radius" :min="0" :max="50" /><span class="viz-num">{{ radius }}px</span></div>
      <span class="viz-label">Border</span>
      <div class="viz-value"><UiSlider v-model="borderOpacity" :min="0" :max="100" /><span class="viz-num">{{ borderOpacity }}%</span></div>
      <span class="viz-label">Tint</span>
      <div class="viz-value">
        <input type="color" class="viz-color" v-model="tint" />
        <input class="text-area" style="min-height: 0; height: 28px; max-width: 120px; padding: 0 8px;" v-model="tint" />
      </div>
    </div>

    <div class="glass-preview">
      <div class="glass-target" :style="{
        background: bgRgba,
        backdropFilter: `blur(${blur}px) saturate(${saturate}%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(${saturate}%)`,
        border: `1px solid ${borderRgba}`,
        borderRadius: radius + 'px',
      }">
        Glass Card
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
.glass-preview {
  display: flex; align-items: center; justify-content: center;
  min-height: 240px;
  padding: var(--space-5);
  background:
    linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #556270 100%);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}
.glass-target {
  width: 220px; height: 130px;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--fs-subtitle);
  font-weight: var(--fw-semibold);
  color: #fff;
}
</style>
