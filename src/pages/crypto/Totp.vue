<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSegmented } from '../../components/ui';
import { totp } from '../../services/crypto';

const secret    = ref('JBSWY3DPEHPK3PXP'); // demo
const algorithm = ref<'SHA1' | 'SHA256' | 'SHA512'>('SHA1');
const digits    = ref<6 | 8>(6);
const period    = ref(30);

const code        = ref('');
const remaining   = ref(0);
const periodVal   = ref(30);
const error       = ref('');
const copied      = ref(false);
let tickTimer: ReturnType<typeof setInterval> | null = null;
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const algoOptions = [
  { label: 'SHA-1',   value: 'SHA1'   },
  { label: 'SHA-256', value: 'SHA256' },
  { label: 'SHA-512', value: 'SHA512' },
];
const digitsOptions = [
  { label: '6 digits', value: 6 },
  { label: '8 digits', value: 8 },
];

async function refresh() {
  error.value = '';
  if (!secret.value.trim()) { code.value = ''; return; }
  try {
    const r = await totp.compute({
      secret: secret.value,
      algorithm: algorithm.value,
      digits: digits.value,
      period: period.value,
    });
    code.value = r.code;
    remaining.value = r.remaining_seconds;
    periodVal.value = r.period;
  } catch (e: any) {
    error.value = e?.message ?? String(e);
    code.value = '';
  }
}

const progress = computed(() =>
  periodVal.value > 0 ? (remaining.value / periodVal.value) * 100 : 0,
);

watch([secret, algorithm, digits, period], refresh);

onMounted(() => {
  refresh();
  tickTimer = setInterval(refresh, 1000);
});
onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer);
  if (copyTimer) clearTimeout(copyTimer);
});

async function copy() {
  if (!code.value) return;
  await navigator.clipboard.writeText(code.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}
</script>

<template>
  <div class="gen-form">
    <div class="gen-form-grid">
      <label class="gen-form-label">Secret</label>
      <UiInput v-model="secret" placeholder="base32 secret (JBSWY3DPEHPK3PXP)" monospace />

      <label class="gen-form-label">Algorithm</label>
      <UiSegmented v-model="algorithm" :options="algoOptions" size="sm" />

      <label class="gen-form-label">Digits</label>
      <UiSegmented v-model="digits" :options="digitsOptions" size="sm" />

      <label class="gen-form-label">Period (s)</label>
      <UiInput v-model.number="period" type="number" />
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 560px;">
      RFC 6238. Default settings (SHA-1 / 6 digits / 30 s) match Google Authenticator, Authy, 1Password.
    </p>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div class="totp-display">
      <div class="totp-code">{{ code || '------' }}</div>
      <div class="totp-progress">
        <div class="totp-progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="totp-meta">
        <span>{{ remaining }}s remaining</span>
        <UiButton variant="standard" size="sm" @click="copy" :disabled="!code">
          <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
          {{ copied ? 'Copied' : 'Copy' }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.totp-display {
  display: flex; flex-direction: column; gap: var(--space-3);
  padding: var(--space-5);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  align-items: center;
}
.totp-code {
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: var(--fw-semibold);
  letter-spacing: 0.16em;
  color: var(--accent);
  user-select: text;
}
.totp-progress {
  width: 100%;
  height: 4px;
  background: var(--bg-base);
  border-radius: 2px;
  overflow: hidden;
}
.totp-progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 1s linear;
}
.totp-meta {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%;
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}
</style>
