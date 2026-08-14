<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented, UiSelect, UiSlider } from '../../components/ui';

const direction = ref<'row' | 'row-reverse' | 'column' | 'column-reverse'>('row');
const wrap      = ref<'nowrap' | 'wrap' | 'wrap-reverse'>('nowrap');
const justify   = ref<'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'>('flex-start');
const align     = ref<'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'>('stretch');
const gap       = ref(8);
const itemCount = ref(4);

const dirOptions = [
  { label: 'row', value: 'row' },
  { label: 'row-reverse', value: 'row-reverse' },
  { label: 'column', value: 'column' },
  { label: 'col-reverse', value: 'column-reverse' },
];
const wrapOptions = [
  { label: 'nowrap', value: 'nowrap' },
  { label: 'wrap',   value: 'wrap' },
  { label: 'wrap-reverse', value: 'wrap-reverse' },
];
const justifyOptions = [
  { label: 'flex-start',     value: 'flex-start' },
  { label: 'flex-end',       value: 'flex-end' },
  { label: 'center',         value: 'center' },
  { label: 'space-between',  value: 'space-between' },
  { label: 'space-around',   value: 'space-around' },
  { label: 'space-evenly',   value: 'space-evenly' },
];
const alignOptions = [
  { label: 'stretch',    value: 'stretch' },
  { label: 'flex-start', value: 'flex-start' },
  { label: 'flex-end',   value: 'flex-end' },
  { label: 'center',     value: 'center' },
  { label: 'baseline',   value: 'baseline' },
];

const fullCss = computed(() =>
`display: flex;
flex-direction: ${direction.value};
flex-wrap: ${wrap.value};
justify-content: ${justify.value};
align-items: ${align.value};
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
      <span class="viz-label">Direction</span>
      <UiSegmented v-model="direction" :options="dirOptions" size="sm" />
      <span class="viz-label">Wrap</span>
      <UiSegmented v-model="wrap" :options="wrapOptions" size="sm" />
      <span class="viz-label">Justify</span>
      <UiSelect v-model="justify" :options="justifyOptions" />
      <span class="viz-label">Align</span>
      <UiSelect v-model="align" :options="alignOptions" />
      <span class="viz-label">Gap</span>
      <div class="viz-value"><UiSlider v-model="gap" :min="0" :max="48" /><span class="viz-num">{{ gap }}px</span></div>
      <span class="viz-label">Items</span>
      <div class="viz-value"><UiSlider v-model="itemCount" :min="1" :max="12" /><span class="viz-num">{{ itemCount }}</span></div>
    </div>

    <div class="viz-preview viz-preview-solid">
      <div class="flex-target" :style="{
        flexDirection: direction,
        flexWrap: wrap,
        justifyContent: justify,
        alignItems: align,
        gap: gap + 'px',
      }">
        <div v-for="i in itemCount" :key="i" class="flex-item" :style="{ height: (40 + (i % 3) * 14) + 'px' }">{{ i }}</div>
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
.flex-target {
  display: flex;
  width: 100%;
  max-width: 520px;
  min-height: 200px;
  background: var(--bg-base);
  padding: var(--space-3);
  border-radius: var(--radius);
}
.flex-item {
  background: var(--accent);
  color: var(--text-on-accent);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono);
  font-weight: var(--fw-semibold);
  border-radius: var(--radius-sm);
  min-width: 48px;
  padding: 0 var(--space-3);
}
</style>
