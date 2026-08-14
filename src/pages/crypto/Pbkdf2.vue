<script lang="ts" setup>
import { ref } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSlider, UiSegmented } from '../../components/ui';
import { pbkdf2 } from '../../services/crypto';

const password   = ref('');
const salt       = ref('');
const algorithm  = ref<'sha1' | 'sha256' | 'sha512'>('sha256');
const iterations = ref(600_000);
const keyLength  = ref(32);
const format     = ref<'hex' | 'base64'>('hex');
const result     = ref('');
const error      = ref('');
const copied     = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const algoOptions = [
  { label: 'SHA-1',   value: 'sha1'   },
  { label: 'SHA-256', value: 'sha256' },
  { label: 'SHA-512', value: 'sha512' },
];
const formatOptions = [
  { label: 'Hex',    value: 'hex'    },
  { label: 'Base64', value: 'base64' },
];

async function run() {
  error.value = '';
  result.value = '';
  try {
    result.value = await pbkdf2.derive({
      password: password.value,
      salt: salt.value,
      algorithm: algorithm.value,
      iterations: iterations.value,
      key_length: keyLength.value,
      format: format.value,
    });
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  }
}

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
      <label class="gen-form-label">Password</label>
      <UiInput v-model="password" placeholder="password" monospace />

      <label class="gen-form-label">Salt</label>
      <UiInput v-model="salt" placeholder="salt (raw)" monospace />

      <label class="gen-form-label">Algorithm</label>
      <UiSegmented v-model="algorithm" :options="algoOptions" size="sm" />

      <label class="gen-form-label">Iterations</label>
      <div class="gen-form-value">
        <UiSlider v-model="iterations" :min="1000" :max="2_000_000" :step="1000" />
        <span class="mono" style="min-width: 96px; color: var(--text-secondary);">{{ iterations.toLocaleString() }}</span>
      </div>

      <label class="gen-form-label">Key length (bytes)</label>
      <div class="gen-form-value">
        <UiSlider v-model="keyLength" :min="8" :max="128" />
        <span class="mono" style="min-width: 32px; color: var(--text-secondary);">{{ keyLength }}</span>
      </div>

      <label class="gen-form-label">Format</label>
      <UiSegmented v-model="format" :options="formatOptions" size="sm" />
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 560px;">
      OWASP 2023 minimum: 600,000 iterations for SHA-256, 1,300,000 for SHA-1, 210,000 for SHA-512.
    </p>

    <div class="gen-actions">
      <UiButton variant="accent" size="sm" @click="run">Derive</UiButton>
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div v-if="result" class="gen-output-row">
      <code class="gen-output-text">{{ result }}</code>
      <UiButton variant="standard" size="sm" @click="copy">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy' }}
      </UiButton>
    </div>
  </div>
</template>
