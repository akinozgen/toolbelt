<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Copy, RefreshCw, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSlider } from '../../components/ui';
import { id } from '../../services/generate';

const length   = ref(21);
const alphabet = ref('');
const value    = ref('');
const copied   = ref(false);
const error    = ref('');
let copyTimer: ReturnType<typeof setTimeout> | null = null;

async function generate() {
  error.value = '';
  try {
    value.value = await id.nanoid({
      length: length.value,
      alphabet: alphabet.value || undefined,
    });
    copied.value = false;
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  }
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

      <label class="gen-form-label">Custom alphabet</label>
      <div class="gen-form-value">
        <UiInput v-model="alphabet" placeholder="(default URL-safe set)" monospace />
      </div>
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

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
