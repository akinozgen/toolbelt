<script lang="ts" setup>
import { ref } from 'vue';
import { Copy, Check, RefreshCw } from 'lucide-vue-next';
import { UiButton, UiInput, UiSlider, UiSegmented } from '../../components/ui';
import { bcrypt } from '../../services/crypto';
import { secret as generateSecret } from '../../services/generate';

const mode = ref<'hash' | 'verify'>('hash');
const password = ref('');
const cost     = ref(10);
const result   = ref('');
const verified = ref<boolean | null>(null);
const verifyHash = ref('');
const error    = ref('');
const copied   = ref(false);
const generating = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const modeOptions = [
  { label: 'Hash',   value: 'hash' },
  { label: 'Verify', value: 'verify' },
];

async function run() {
  error.value = '';
  result.value = '';
  verified.value = null;
  try {
    if (mode.value === 'hash') {
      result.value = await bcrypt.hash({ password: password.value, cost: cost.value });
    } else {
      verified.value = await bcrypt.verify({ password: password.value, hash: verifyHash.value });
    }
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  }
}

async function fillRandomSecret() {
  generating.value = true;
  try {
    password.value = await generateSecret.randomBytes({ length: 32, format: 'base64' });
  } finally {
    generating.value = false;
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
      <label class="gen-form-label">Password</label>
      <div class="gen-form-value" style="gap: var(--space-2);">
        <UiInput v-model="password" placeholder="password to hash" monospace />
        <UiButton variant="subtle" size="sm" @click="fillRandomSecret" :disabled="generating" title="Fill with random 32-byte base64 (Laravel APP_KEY format)">
          <template #icon><RefreshCw :size="13" /></template>
          Random
        </UiButton>
      </div>

      <template v-if="mode === 'hash'">
        <label class="gen-form-label">Cost</label>
        <div class="gen-form-value">
          <UiSlider v-model="cost" :min="4" :max="15" />
          <span class="mono" style="min-width: 32px; color: var(--text-secondary);">{{ cost }}</span>
        </div>
      </template>

      <template v-else>
        <label class="gen-form-label">Hash</label>
        <UiInput v-model="verifyHash" placeholder="$2y$10$..." monospace />
      </template>
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 560px;">
      Cost 10 = Laravel/Symfony default. Each step doubles the time. ≥12 recommended for new apps.
      Use the <strong>Random</strong> button to fill a 32-byte base64 secret (Laravel <code>APP_KEY</code> format).
    </p>

    <div class="gen-actions">
      <UiButton variant="accent" size="sm" @click="run">
        {{ mode === 'hash' ? 'Hash' : 'Verify' }}
      </UiButton>
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div v-if="mode === 'hash' && result" class="gen-output-row">
      <code class="gen-output-text">{{ result }}</code>
      <UiButton variant="standard" size="sm" @click="copy">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy' }}
      </UiButton>
    </div>

    <div v-if="mode === 'verify' && verified !== null"
         :class="['verify-badge', verified ? 'ok' : 'no']">
      {{ verified ? '✓ Match' : '✗ No match' }}
    </div>
  </div>
</template>

<style scoped>
.verify-badge {
  display: inline-flex; align-items: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius);
  font-weight: var(--fw-semibold);
  font-size: var(--fs-body);
}
.verify-badge.ok { background: var(--success-bg); color: var(--success); border: 1px solid var(--success); }
.verify-badge.no { background: var(--danger-bg);  color: var(--danger);  border: 1px solid var(--danger); }
</style>
