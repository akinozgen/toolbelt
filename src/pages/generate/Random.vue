<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Copy, RefreshCw, Check } from 'lucide-vue-next';
import { UiButton, UiSlider, UiSegmented } from '../../components/ui';
import { secret, type ByteFormat } from '../../services/generate';

const length = ref(32);
const format = ref<ByteFormat>('hex');
const value  = ref('');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const formatOptions = [
  { label: 'Hex',        value: 'hex' },
  { label: 'Base64',     value: 'base64' },
  { label: 'Base64URL',  value: 'base64url' },
];

async function generate() {
  value.value = await secret.randomBytes({ length: length.value, format: format.value });
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
      <label class="gen-form-label">Bytes</label>
      <div class="gen-form-value">
        <UiSlider v-model="length" :min="1" :max="256" />
        <span class="mono" style="min-width: 48px; color: var(--text-secondary);">{{ length }} B</span>
      </div>

      <label class="gen-form-label">Format</label>
      <UiSegmented v-model="format" :options="formatOptions" size="sm" />
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 520px;">
      Cryptographically secure random bytes from the OS entropy pool. Useful for JWT secrets, API keys, salts, IVs.
    </p>

    <div class="gen-output-area">
      <textarea readonly class="gen-output-textarea" :value="value || '—'"></textarea>
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
