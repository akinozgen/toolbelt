<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSegmented } from '../../components/ui';
import { hmac } from '../../services/crypto';

const message   = ref('');
const key       = ref('');
const algorithm = ref<'sha1' | 'sha256' | 'sha384' | 'sha512'>('sha256');
const format    = ref<'hex' | 'base64'>('hex');
const result    = ref('');
const error     = ref('');
const copied    = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce:  ReturnType<typeof setTimeout> | null = null;

const algoOptions = [
  { label: 'SHA-1',   value: 'sha1'   },
  { label: 'SHA-256', value: 'sha256' },
  { label: 'SHA-384', value: 'sha384' },
  { label: 'SHA-512', value: 'sha512' },
];
const formatOptions = [
  { label: 'Hex',    value: 'hex'    },
  { label: 'Base64', value: 'base64' },
];

async function run() {
  error.value = '';
  if (!message.value || !key.value) { result.value = ''; return; }
  try {
    result.value = await hmac.sign({
      message: message.value,
      key: key.value,
      algorithm: algorithm.value,
      format: format.value,
    });
  } catch (e: any) {
    error.value = e?.message ?? String(e);
    result.value = '';
  }
}

watch([message, key, algorithm, format], () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(run, 200);
});

async function copy() {
  if (!result.value) return;
  await navigator.clipboard.writeText(result.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}
</script>

<template>
  <div class="gen-form">
    <div class="gen-form-grid">
      <label class="gen-form-label">Message</label>
      <UiInput v-model="message" placeholder="data to authenticate" />

      <label class="gen-form-label">Key</label>
      <UiInput v-model="key" placeholder="secret key" monospace />

      <label class="gen-form-label">Algorithm</label>
      <UiSegmented v-model="algorithm" :options="algoOptions" size="sm" />

      <label class="gen-form-label">Format</label>
      <UiSegmented v-model="format" :options="formatOptions" size="sm" />
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 560px;">
      Used for webhook signature verification (GitHub, Stripe, Shopify) and API request signing.
    </p>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div class="gen-output-row">
      <code class="gen-output-text" :class="{ muted: !result }">{{ result || '—' }}</code>
      <UiButton variant="standard" size="sm" @click="copy" :disabled="!result">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy' }}
      </UiButton>
    </div>
  </div>
</template>
