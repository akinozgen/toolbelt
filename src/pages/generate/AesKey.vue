<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Copy, RefreshCw, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented } from '../../components/ui';
import { secret } from '../../services/generate';

const bits   = ref<128 | 192 | 256>(256);
const format = ref<'hex' | 'base64'>('hex');
const value  = ref('');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const bitsOptions = [
  { label: '128 bit', value: 128 },
  { label: '192 bit', value: 192 },
  { label: '256 bit', value: 256 },
];
const formatOptions = [
  { label: 'Hex',    value: 'hex' },
  { label: 'Base64', value: 'base64' },
];

async function generate() {
  value.value = await secret.aesKey({ bits: bits.value, format: format.value });
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
      <label class="gen-form-label">Key size</label>
      <UiSegmented v-model="bits" :options="bitsOptions" size="sm" />

      <label class="gen-form-label">Format</label>
      <UiSegmented v-model="format" :options="formatOptions" size="sm" />
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 560px;">
      AES is symmetric — single key. For asymmetric public/private key pairs, use RSA Key Pair.
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
