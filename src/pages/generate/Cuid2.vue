<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Copy, RefreshCw, Check } from 'lucide-vue-next';
import { UiButton, UiSlider } from '../../components/ui';
import { id } from '../../services/generate';

const length = ref(24);
const value  = ref('');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

async function generate() {
  value.value = await id.cuid2({ cuid_length: length.value });
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
  <div class="gen-form">
    <div class="gen-form-grid">
      <label class="gen-form-label">Length</label>
      <div class="gen-form-value">
        <UiSlider v-model="length" :min="2" :max="64" />
        <span class="mono" style="min-width: 32px; color: var(--text-secondary);">{{ length }}</span>
      </div>
    </div>
    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 520px;">
      Collision-resistant unique ID v2 — secure, horizontally scalable, default 24 chars.
    </p>
    <div class="gen-output-row">
      <code class="gen-output-text" :class="{ muted: !value }">{{ value || '—' }}</code>
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
