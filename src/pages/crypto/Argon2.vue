<script lang="ts" setup>
import { ref } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSlider, UiSegmented } from '../../components/ui';
import { argon2 } from '../../services/crypto';

const mode = ref<'hash' | 'verify'>('hash');
const password = ref('');
const memoryKib = ref(19456);
const iterations = ref(2);
const parallelism = ref(1);
const verifyHash = ref('');
const result = ref('');
const verified = ref<boolean | null>(null);
const error = ref('');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const modeOptions = [
  { label: 'Hash', value: 'hash' },
  { label: 'Verify', value: 'verify' },
];

async function run() {
  error.value = '';
  result.value = '';
  verified.value = null;
  try {
    if (mode.value === 'hash') {
      result.value = await argon2.hash({
        password: password.value,
        memory_kib: memoryKib.value,
        iterations: iterations.value,
        parallelism: parallelism.value,
      });
    } else {
      verified.value = await argon2.verify({ password: password.value, hash: verifyHash.value });
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
      <label class="gen-form-label">Password</label>
      <UiInput v-model="password" placeholder="password" monospace />

      <template v-if="mode === 'hash'">
        <label class="gen-form-label">Memory (KiB)</label>
        <div class="gen-form-value">
          <UiSlider v-model="memoryKib" :min="4096" :max="262144" :step="1024" />
          <span class="mono" style="min-width: 64px; color: var(--text-secondary);">{{ memoryKib }} KiB</span>
        </div>

        <label class="gen-form-label">Iterations</label>
        <div class="gen-form-value">
          <UiSlider v-model="iterations" :min="1" :max="10" />
          <span class="mono" style="min-width: 32px; color: var(--text-secondary);">{{ iterations }}</span>
        </div>

        <label class="gen-form-label">Parallelism</label>
        <div class="gen-form-value">
          <UiSlider v-model="parallelism" :min="1" :max="8" />
          <span class="mono" style="min-width: 32px; color: var(--text-secondary);">{{ parallelism }}</span>
        </div>
      </template>

      <template v-else>
        <label class="gen-form-label">Hash</label>
        <UiInput v-model="verifyHash" placeholder="$argon2id$v=19$m=...$..." monospace />
      </template>
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 560px;">
      Argon2id — winner of the Password Hashing Competition (2015), recommended by OWASP. Defaults follow OWASP's 2023 minimum: 19 MiB / 2 iterations / 1 parallelism.
    </p>

    <div class="gen-actions">
      <UiButton variant="accent" size="sm" @click="run">{{ mode === 'hash' ? 'Hash' : 'Verify' }}</UiButton>
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div v-if="mode === 'hash' && result" class="gen-output-area">
      <textarea readonly class="gen-output-textarea" :value="result"></textarea>
      <div class="gen-actions" style="margin-top: var(--space-2);">
        <UiButton variant="standard" size="sm" @click="copy">
          <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
          {{ copied ? 'Copied' : 'Copy' }}
        </UiButton>
      </div>
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
