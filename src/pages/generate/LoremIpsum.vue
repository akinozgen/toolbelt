<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Copy, RefreshCw, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented, UiSlider, UiToggle } from '../../components/ui';
import { content } from '../../services/generate';

const kind         = ref<'paragraphs' | 'sentences' | 'words'>('paragraphs');
const count        = ref(3);
const startClassic = ref(true);
const value        = ref('');
const copied       = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const kindOptions = [
  { label: 'Paragraphs', value: 'paragraphs' },
  { label: 'Sentences',  value: 'sentences'  },
  { label: 'Words',      value: 'words'      },
];

async function generate() {
  value.value = await content.lorem({
    kind: kind.value,
    count: count.value,
    start_classic: startClassic.value,
  });
  copied.value = false;
}
async function copy() {
  if (!value.value) return;
  await navigator.clipboard.writeText(value.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}
onMounted(generate);
</script>

<template>
  <div class="gen-form" style="max-width: 880px;">
    <div class="gen-form-grid">
      <label class="gen-form-label">Kind</label>
      <UiSegmented v-model="kind" :options="kindOptions" size="sm" />

      <label class="gen-form-label">Count</label>
      <div class="gen-form-value">
        <UiSlider v-model="count" :min="1" :max="50" />
        <span class="mono" style="min-width: 32px; color: var(--text-secondary);">{{ count }}</span>
      </div>

      <label class="gen-form-label">Start classic</label>
      <div class="gen-form-value">
        <UiToggle v-model="startClassic" :disabled="kind !== 'paragraphs'" />
        <span class="text-tertiary" style="font-size: var(--fs-caption);">"Lorem ipsum dolor sit amet…"</span>
      </div>
    </div>

    <div class="gen-output-area">
      <textarea readonly class="gen-output-textarea" style="min-height: 240px; font-family: var(--font-ui); font-size: var(--fs-body); white-space: pre-wrap; word-break: normal;" :value="value"></textarea>
    </div>

    <div class="gen-actions">
      <UiButton variant="standard" size="sm" @click="copy">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy' }}
      </UiButton>
      <UiButton variant="accent" size="sm" @click="generate">
        <template #icon><RefreshCw :size="13" /></template>
        Regenerate
      </UiButton>
    </div>
  </div>
</template>
