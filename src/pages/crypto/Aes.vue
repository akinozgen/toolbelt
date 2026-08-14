<script lang="ts" setup>
import { ref } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSegmented } from '../../components/ui';
import { aes } from '../../services/crypto';

const mode    = ref<'encrypt' | 'decrypt'>('encrypt');
const text    = ref('');
const key     = ref('');
const keyKind = ref<'passphrase' | 'hex' | 'base64'>('passphrase');
const bits    = ref<128 | 256>(256);
const result  = ref('');
const error   = ref('');
const copied  = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const modeOptions = [
  { label: 'Encrypt', value: 'encrypt' },
  { label: 'Decrypt', value: 'decrypt' },
];
const keyKindOptions = [
  { label: 'Passphrase', value: 'passphrase' },
  { label: 'Hex',        value: 'hex' },
  { label: 'Base64',     value: 'base64' },
];
const bitsOptions = [
  { label: '128 bit', value: 128 },
  { label: '256 bit', value: 256 },
];

async function run() {
  error.value = '';
  result.value = '';
  try {
    if (mode.value === 'encrypt') {
      const enc = await aes.encrypt({
        plaintext: text.value,
        key: key.value,
        key_kind: keyKind.value,
        bits: bits.value,
      });
      result.value = enc.combined;
    } else {
      result.value = await aes.decrypt({
        combined: text.value,
        key: key.value,
        key_kind: keyKind.value,
        bits: bits.value,
      });
    }
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
    <UiSegmented v-model="mode" :options="modeOptions" size="sm" />

    <div class="gen-form-grid">
      <label class="gen-form-label">{{ mode === 'encrypt' ? 'Plaintext' : 'Ciphertext (combined)' }}</label>
      <UiInput v-model="text" :placeholder="mode === 'encrypt' ? 'text to encrypt' : 'base64 nonce||ciphertext||tag'" monospace />

      <label class="gen-form-label">Key</label>
      <UiInput v-model="key" placeholder="key or passphrase" monospace />

      <label class="gen-form-label">Key kind</label>
      <UiSegmented v-model="keyKind" :options="keyKindOptions" size="sm" />

      <label class="gen-form-label">Key size</label>
      <UiSegmented v-model="bits" :options="bitsOptions" size="sm" />
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 580px;">
      AES-GCM authenticated encryption. <strong>Passphrase</strong> mode SHA-256–derives a deterministic key.
      Output combines a random 12-byte nonce + ciphertext + 16-byte auth tag in base64 — paste the same string back to decrypt.
    </p>

    <div class="gen-actions">
      <UiButton variant="accent" size="sm" @click="run">{{ mode === 'encrypt' ? 'Encrypt' : 'Decrypt' }}</UiButton>
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div v-if="result" class="gen-output-area">
      <textarea readonly class="gen-output-textarea" :value="result"></textarea>
      <div class="gen-actions" style="margin-top: var(--space-2);">
        <UiButton variant="standard" size="sm" @click="copy">
          <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
          {{ copied ? 'Copied' : 'Copy' }}
        </UiButton>
      </div>
    </div>
  </div>
</template>
