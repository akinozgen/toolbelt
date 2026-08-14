<script lang="ts" setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented } from '../../components/ui';

// Control points in normalized 0..1 (X) and y can be -0.5..1.5 (overshoot allowed for back-easings).
const p1 = ref({ x: 0.42, y: 0.0 });
const p2 = ref({ x: 0.58, y: 1.0 });

const SIZE = 240;
const PAD  = 30;

function toCanvas(x: number, y: number) {
  return { cx: PAD + x * SIZE, cy: PAD + (1 - y) * SIZE };
}
function fromCanvas(cx: number, cy: number) {
  let x = (cx - PAD) / SIZE;
  let y = 1 - (cy - PAD) / SIZE;
  x = Math.max(0, Math.min(1, x));
  y = Math.max(-0.5, Math.min(1.5, y));
  return { x, y };
}

const p1canvas = computed(() => toCanvas(p1.value.x, p1.value.y));
const p2canvas = computed(() => toCanvas(p2.value.x, p2.value.y));

const startPt = computed(() => toCanvas(0, 0));
const endPt   = computed(() => toCanvas(1, 1));

const pathD = computed(() =>
  `M ${startPt.value.cx} ${startPt.value.cy} C ${p1canvas.value.cx} ${p1canvas.value.cy} ${p2canvas.value.cx} ${p2canvas.value.cy} ${endPt.value.cx} ${endPt.value.cy}`,
);

const cubicCss = computed(() =>
  `cubic-bezier(${p1.value.x.toFixed(2)}, ${p1.value.y.toFixed(2)}, ${p2.value.x.toFixed(2)}, ${p2.value.y.toFixed(2)})`,
);
const fullCss = computed(() => `transition-timing-function: ${cubicCss.value};\nanimation-timing-function: ${cubicCss.value};`);

let dragging: 'p1' | 'p2' | null = null;
const svgRef = ref<SVGSVGElement | null>(null);

function startDrag(which: 'p1' | 'p2') {
  dragging = which;
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', stopDrag);
}
function onMove(e: MouseEvent) {
  if (!dragging || !svgRef.value) return;
  const rect = svgRef.value.getBoundingClientRect();
  const cx = ((e.clientX - rect.left) / rect.width) * (SIZE + PAD * 2);
  const cy = ((e.clientY - rect.top) / rect.height) * (SIZE + PAD * 2);
  const pt = fromCanvas(cx, cy);
  if (dragging === 'p1') p1.value = pt;
  else p2.value = pt;
}
function stopDrag() {
  dragging = null;
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseup', stopDrag);
}
onBeforeUnmount(stopDrag);

const presets = [
  { label: 'linear',     value: '0,0,1,1' },
  { label: 'ease',       value: '0.25,0.1,0.25,1' },
  { label: 'ease-in',    value: '0.42,0,1,1' },
  { label: 'ease-out',   value: '0,0,0.58,1' },
  { label: 'ease-in-out',value: '0.42,0,0.58,1' },
];
const presetSel = ref('');

function applyPreset(v: string) {
  presetSel.value = v;
  const [a, b, c, d] = v.split(',').map(Number);
  p1.value = { x: a, y: b };
  p2.value = { x: c, y: d };
}

const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
async function copy() {
  await navigator.clipboard.writeText(cubicCss.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}

// Animation key — bumping resets the animation
const animKey = ref(0);
function replay() { animKey.value++; }
</script>

<template>
  <div class="viz-form">
    <div class="bezier-row">
      <svg
        ref="svgRef"
        class="bezier-svg"
        :viewBox="`0 0 ${SIZE + PAD * 2} ${SIZE + PAD * 2}`"
      >
        <!-- guide -->
        <rect :x="PAD" :y="PAD" :width="SIZE" :height="SIZE" fill="var(--bg-base)" stroke="var(--border-subtle)" />
        <line :x1="startPt.cx" :y1="startPt.cy" :x2="endPt.cx" :y2="endPt.cy"
              stroke="var(--border-strong)" stroke-dasharray="4 3" />
        <!-- handles -->
        <line :x1="startPt.cx" :y1="startPt.cy" :x2="p1canvas.cx" :y2="p1canvas.cy"
              stroke="var(--accent)" stroke-width="1.5" />
        <line :x1="endPt.cx" :y1="endPt.cy" :x2="p2canvas.cx" :y2="p2canvas.cy"
              stroke="var(--accent)" stroke-width="1.5" />
        <!-- curve -->
        <path :d="pathD" fill="none" stroke="var(--accent)" stroke-width="2.5" />
        <!-- endpoints -->
        <circle :cx="startPt.cx" :cy="startPt.cy" r="4" fill="var(--text-tertiary)" />
        <circle :cx="endPt.cx"   :cy="endPt.cy"   r="4" fill="var(--text-tertiary)" />
        <!-- control handles (drag) -->
        <circle :cx="p1canvas.cx" :cy="p1canvas.cy" r="8" fill="var(--accent)"
                style="cursor: grab" @mousedown.prevent="startDrag('p1')" />
        <circle :cx="p2canvas.cx" :cy="p2canvas.cy" r="8" fill="var(--accent)"
                style="cursor: grab" @mousedown.prevent="startDrag('p2')" />
      </svg>

      <div class="bezier-meta">
        <div class="bezier-coord">P1 ({{ p1.x.toFixed(2) }}, {{ p1.y.toFixed(2) }})</div>
        <div class="bezier-coord">P2 ({{ p2.x.toFixed(2) }}, {{ p2.y.toFixed(2) }})</div>
        <UiSegmented :model-value="presetSel" :options="presets" size="sm"
          @update:model-value="(v) => applyPreset(v as string)" />

        <div class="bezier-preview" @click="replay">
          <div :key="animKey" class="bezier-ball" :style="{ animationTimingFunction: cubicCss }"></div>
        </div>
        <p class="text-tertiary" style="font-size: var(--fs-caption); margin: 0;">Click strip to replay</p>
      </div>
    </div>

    <div class="viz-css">
      <div class="viz-css-area" style="white-space: pre;">{{ fullCss }}</div>
      <UiButton variant="standard" size="sm" @click="copy" style="align-self: flex-start;">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy cubic-bezier()' }}
      </UiButton>
    </div>
  </div>
</template>

<style scoped>
.bezier-row {
  display: flex; gap: var(--space-5);
  flex-wrap: wrap;
}
.bezier-svg {
  width: 320px; height: 320px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  user-select: none;
}
.bezier-meta {
  display: flex; flex-direction: column; gap: var(--space-3);
  flex: 1; min-width: 240px;
}
.bezier-coord {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  color: var(--text-secondary);
}
.bezier-preview {
  position: relative;
  height: 24px;
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  cursor: default;
  margin-top: var(--space-3);
}
.bezier-ball {
  position: absolute;
  top: 4px; left: 4px;
  width: 16px; height: 16px;
  background: var(--accent);
  border-radius: 50%;
  animation: bezier-ride 1.6s infinite;
}
@keyframes bezier-ride {
  0%   { left: 4px;  }
  50%  { left: calc(100% - 20px); }
  100% { left: 4px;  }
}
</style>
