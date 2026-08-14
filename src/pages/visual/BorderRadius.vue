<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSlider, UiToggle } from '../../components/ui';

const tl = ref(20);
const tr = ref(20);
const br = ref(20);
const bl = ref(20);
const linked = ref(true);
const asymmetric = ref(false);
const tlH = ref(20);
const trH = ref(20);
const brH = ref(20);
const blH = ref(20);

watch(linked, (v) => {
  if (v) { tr.value = tl.value; br.value = tl.value; bl.value = tl.value; }
});
watch(tl, (v) => { if (linked.value) { tr.value = v; br.value = v; bl.value = v; } });

const fullCss = computed(() => {
  if (asymmetric.value) {
    return `border-radius: ${tl.value}px ${tr.value}px ${br.value}px ${bl.value}px / ${tlH.value}px ${trH.value}px ${brH.value}px ${blH.value}px;`;
  }
  if (linked.value) {
    return `border-radius: ${tl.value}px;`;
  }
  return `border-radius: ${tl.value}px ${tr.value}px ${br.value}px ${bl.value}px;`;
});

const previewStyle = computed(() => ({
  borderRadius: asymmetric.value
    ? `${tl.value}px ${tr.value}px ${br.value}px ${bl.value}px / ${tlH.value}px ${trH.value}px ${brH.value}px ${blH.value}px`
    : `${tl.value}px ${tr.value}px ${br.value}px ${bl.value}px`,
}));

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
      <span class="viz-label">All corners</span>
      <UiToggle v-model="linked" />
      <span class="viz-label">Asymmetric (x/y)</span>
      <UiToggle v-model="asymmetric" />

      <template v-if="linked">
        <span class="viz-label">Radius</span>
        <div class="viz-value"><UiSlider v-model="tl" :min="0" :max="200" /><span class="viz-num">{{ tl }}px</span></div>
      </template>
      <template v-else>
        <span class="viz-label">Top-left</span>
        <div class="viz-value"><UiSlider v-model="tl" :min="0" :max="200" /><span class="viz-num">{{ tl }}px</span></div>
        <span class="viz-label">Top-right</span>
        <div class="viz-value"><UiSlider v-model="tr" :min="0" :max="200" /><span class="viz-num">{{ tr }}px</span></div>
        <span class="viz-label">Bottom-right</span>
        <div class="viz-value"><UiSlider v-model="br" :min="0" :max="200" /><span class="viz-num">{{ br }}px</span></div>
        <span class="viz-label">Bottom-left</span>
        <div class="viz-value"><UiSlider v-model="bl" :min="0" :max="200" /><span class="viz-num">{{ bl }}px</span></div>
      </template>

      <template v-if="asymmetric">
        <span class="viz-label">TL vertical</span>
        <div class="viz-value"><UiSlider v-model="tlH" :min="0" :max="200" /><span class="viz-num">{{ tlH }}px</span></div>
        <span class="viz-label">TR vertical</span>
        <div class="viz-value"><UiSlider v-model="trH" :min="0" :max="200" /><span class="viz-num">{{ trH }}px</span></div>
        <span class="viz-label">BR vertical</span>
        <div class="viz-value"><UiSlider v-model="brH" :min="0" :max="200" /><span class="viz-num">{{ brH }}px</span></div>
        <span class="viz-label">BL vertical</span>
        <div class="viz-value"><UiSlider v-model="blH" :min="0" :max="200" /><span class="viz-num">{{ blH }}px</span></div>
      </template>
    </div>

    <div class="viz-preview viz-preview-solid">
      <div class="radius-target" :style="previewStyle"></div>
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
.radius-target {
  width: 240px; height: 180px;
  background: var(--accent);
}
</style>
