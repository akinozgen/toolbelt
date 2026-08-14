<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented, UiSlider } from '../../components/ui';

type Pattern = 'dots' | 'grid' | 'diagonal' | 'crosshatch';
const pattern = ref<Pattern>('dots');
const bg      = ref('#1B1B1B');
const fg      = ref('#3A3A3A');
const size    = ref(24);
const dotSize = ref(2);
const stroke  = ref(1);

const patternOptions = [
  { label: 'Dots',       value: 'dots' },
  { label: 'Grid',       value: 'grid' },
  { label: 'Diagonal',   value: 'diagonal' },
  { label: 'Crosshatch', value: 'crosshatch' },
];

const svg = computed(() => {
  const s = size.value;
  switch (pattern.value) {
    case 'dots':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="100%" height="100%" fill="${bg.value}"/><circle cx="${s/2}" cy="${s/2}" r="${dotSize.value}" fill="${fg.value}"/></svg>`;
    case 'grid':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="100%" height="100%" fill="${bg.value}"/><path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="${fg.value}" stroke-width="${stroke.value}"/></svg>`;
    case 'diagonal':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="100%" height="100%" fill="${bg.value}"/><path d="M -1 1 l 2 -2 M 0 ${s} l ${s} -${s} M ${s-1} ${s+1} l 2 -2" stroke="${fg.value}" stroke-width="${stroke.value}"/></svg>`;
    case 'crosshatch':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="100%" height="100%" fill="${bg.value}"/><path d="M 0 ${s} l ${s} -${s} M -1 1 l 2 -2 M ${s-1} ${s+1} l 2 -2 M 0 0 l ${s} ${s} M ${s} 0 l -${s} ${s}" stroke="${fg.value}" stroke-width="${stroke.value}"/></svg>`;
  }
});

const dataUri = computed(() => `data:image/svg+xml;utf8,${encodeURIComponent(svg.value)}`);
const fullCss = computed(() => `background-color: ${bg.value};\nbackground-image: url("${dataUri.value}");`);
const previewStyle = computed(() => ({
  backgroundColor: bg.value,
  backgroundImage: `url("${dataUri.value}")`,
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
      <span class="viz-label">Pattern</span>
      <UiSegmented v-model="pattern" :options="patternOptions" size="sm" />
      <span class="viz-label">Background</span>
      <div class="viz-value">
        <input type="color" class="viz-color" v-model="bg" />
        <input class="text-area" style="min-height: 0; height: 28px; max-width: 130px; padding: 0 8px;" v-model="bg" />
      </div>
      <span class="viz-label">Foreground</span>
      <div class="viz-value">
        <input type="color" class="viz-color" v-model="fg" />
        <input class="text-area" style="min-height: 0; height: 28px; max-width: 130px; padding: 0 8px;" v-model="fg" />
      </div>
      <span class="viz-label">Tile size</span>
      <div class="viz-value"><UiSlider v-model="size" :min="8" :max="80" /><span class="viz-num">{{ size }}px</span></div>
      <template v-if="pattern === 'dots'">
        <span class="viz-label">Dot size</span>
        <div class="viz-value"><UiSlider v-model="dotSize" :min="1" :max="12" /><span class="viz-num">{{ dotSize }}px</span></div>
      </template>
      <template v-else>
        <span class="viz-label">Stroke</span>
        <div class="viz-value"><UiSlider v-model="stroke" :min="1" :max="6" /><span class="viz-num">{{ stroke }}px</span></div>
      </template>
    </div>

    <div class="pattern-preview" :style="previewStyle"></div>

    <div class="viz-css">
      <div class="viz-css-area" style="white-space: pre-wrap; word-break: break-all;">{{ fullCss }}</div>
      <UiButton variant="standard" size="sm" @click="copy" style="align-self: flex-start;">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy CSS' }}
      </UiButton>
    </div>
  </div>
</template>

<style scoped>
.pattern-preview {
  width: 100%;
  height: 240px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}
</style>
