<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSlider } from '../../components/ui';

const x = ref(2);
const y = ref(2);
const blur = ref(4);
const color = ref('rgba(0, 0, 0, 0.5)');
const text = ref('Toolbelt');
const fontSize = ref(48);

const fullCss = computed(() => `text-shadow: ${x.value}px ${y.value}px ${blur.value}px ${color.value};`);

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
      <span class="viz-label">Text</span>
      <UiInput v-model="text" />
      <span class="viz-label">Font size</span>
      <div class="viz-value"><UiSlider v-model="fontSize" :min="14" :max="120" /><span class="viz-num">{{ fontSize }}px</span></div>
      <span class="viz-label">Offset X</span>
      <div class="viz-value"><UiSlider v-model="x" :min="-30" :max="30" /><span class="viz-num">{{ x }}px</span></div>
      <span class="viz-label">Offset Y</span>
      <div class="viz-value"><UiSlider v-model="y" :min="-30" :max="30" /><span class="viz-num">{{ y }}px</span></div>
      <span class="viz-label">Blur</span>
      <div class="viz-value"><UiSlider v-model="blur" :min="0" :max="60" /><span class="viz-num">{{ blur }}px</span></div>
      <span class="viz-label">Color</span>
      <div class="viz-value">
        <input type="color" class="viz-color" v-model="color" />
        <input class="text-area" style="min-height: 0; height: 28px; max-width: 220px; padding: 0 8px;" v-model="color" />
      </div>
    </div>

    <div class="viz-preview viz-preview-solid">
      <span :style="{ fontSize: fontSize + 'px', textShadow: `${x}px ${y}px ${blur}px ${color}`, fontWeight: 700, color: 'var(--text-primary)' }">{{ text }}</span>
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
