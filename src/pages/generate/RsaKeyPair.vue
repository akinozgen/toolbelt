<script lang="ts" setup>
import { ref, onBeforeUnmount } from 'vue';
import { Copy, RefreshCw, Check, Save } from 'lucide-vue-next';
import { UiButton, UiSegmented } from '../../components/ui';
import { secret, saveText } from '../../services/generate';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';

const bits = ref<2048 | 3072 | 4096>(2048);
const isGenerating = ref(false);
const elapsedMs    = ref(0);
const totalMs      = ref<number | null>(null);
const privatePem   = ref('');
const publicPem    = ref('');
const error        = ref('');
const copiedPriv   = ref(false);
const copiedPub    = ref(false);
let elapsedTimer: ReturnType<typeof setInterval> | null = null;
let copyPrivT: ReturnType<typeof setTimeout> | null = null;
let copyPubT:  ReturnType<typeof setTimeout> | null = null;

const bitsOptions = [
  { label: '2048 (~1s)',  value: 2048 },
  { label: '3072 (~3s)',  value: 3072 },
  { label: '4096 (~10s)', value: 4096 },
];

async function generate() {
  if (isGenerating.value) return;
  error.value = '';
  privatePem.value = '';
  publicPem.value = '';
  totalMs.value = null;
  elapsedMs.value = 0;
  isGenerating.value = true;

  const started = performance.now();
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = setInterval(() => {
    elapsedMs.value = performance.now() - started;
  }, 100);

  try {
    const result = await secret.rsaKeyPair(bits.value);
    privatePem.value = result.private_pem;
    publicPem.value  = result.public_pem;
    totalMs.value    = result.elapsed_ms;
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  } finally {
    isGenerating.value = false;
    if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
  }
}

async function copyPriv() {
  if (!privatePem.value) return;
  await navigator.clipboard.writeText(privatePem.value);
  copiedPriv.value = true;
  if (copyPrivT) clearTimeout(copyPrivT);
  copyPrivT = setTimeout(() => (copiedPriv.value = false), 1200);
}
async function copyPub() {
  if (!publicPem.value) return;
  await navigator.clipboard.writeText(publicPem.value);
  copiedPub.value = true;
  if (copyPubT) clearTimeout(copyPubT);
  copyPubT = setTimeout(() => (copiedPub.value = false), 1200);
}

async function savePem(content: string, suggested: string) {
  if (!content) return;
  try {
    const path = await saveDialog({
      defaultPath: suggested,
      filters: [{ name: 'PEM', extensions: ['pem', 'key', 'txt'] }],
    });
    if (!path) return;
    await saveText(path, content);
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

onBeforeUnmount(() => {
  if (elapsedTimer) clearInterval(elapsedTimer);
  if (copyPrivT) clearTimeout(copyPrivT);
  if (copyPubT)  clearTimeout(copyPubT);
});
</script>

<template>
  <div class="gen-form" style="max-width: 920px;">
    <div class="gen-form-grid">
      <label class="gen-form-label">Key size</label>
      <UiSegmented v-model="bits" :options="bitsOptions" size="sm" :disabled="isGenerating" />
    </div>

    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 560px;">
      RSA asymmetric key pair in PKCS#8 PEM format. Generation is CPU-bound;
      4096-bit can take ~10 seconds depending on your machine.
    </p>

    <div class="gen-actions">
      <UiButton variant="accent" size="md" @click="generate" :disabled="isGenerating">
        <template #icon><RefreshCw :size="14" /></template>
        {{ isGenerating ? `Generating… ${formatDuration(elapsedMs)}` : 'Generate' }}
      </UiButton>
      <span v-if="totalMs !== null && !isGenerating" class="text-tertiary mono" style="font-size: var(--fs-caption);">
        Done in {{ formatDuration(totalMs) }}
      </span>
    </div>

    <div v-if="isGenerating" class="rsa-progress">
      <div class="rsa-progress-bar"><span></span></div>
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div v-if="privatePem || publicPem" class="rsa-output">
      <div class="rsa-output-block">
        <div class="rsa-output-head">
          <span class="form-label">Private key (PKCS#8 PEM)</span>
          <div class="gen-actions">
            <UiButton variant="subtle" size="sm" @click="copyPriv">
              <template #icon><Check v-if="copiedPriv" :size="13" /><Copy v-else :size="13" /></template>
              {{ copiedPriv ? 'Copied' : 'Copy' }}
            </UiButton>
            <UiButton variant="subtle" size="sm" @click="savePem(privatePem, `id_rsa_${bits}.pem`)">
              <template #icon><Save :size="13" /></template>
              Save…
            </UiButton>
          </div>
        </div>
        <textarea readonly class="gen-output-textarea rsa-textarea" :value="privatePem"></textarea>
      </div>
      <div class="rsa-output-block">
        <div class="rsa-output-head">
          <span class="form-label">Public key (PEM)</span>
          <div class="gen-actions">
            <UiButton variant="subtle" size="sm" @click="copyPub">
              <template #icon><Check v-if="copiedPub" :size="13" /><Copy v-else :size="13" /></template>
              {{ copiedPub ? 'Copied' : 'Copy' }}
            </UiButton>
            <UiButton variant="subtle" size="sm" @click="savePem(publicPem, `id_rsa_${bits}.pub.pem`)">
              <template #icon><Save :size="13" /></template>
              Save…
            </UiButton>
          </div>
        </div>
        <textarea readonly class="gen-output-textarea rsa-textarea" :value="publicPem"></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rsa-progress {
  height: 3px;
  background: var(--bg-base);
  border-radius: 2px;
  overflow: hidden;
}
.rsa-progress-bar {
  position: relative;
  height: 100%;
}
.rsa-progress-bar > span {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  width: 30%;
  background: var(--accent);
  border-radius: 2px;
  animation: rsa-slide 1.4s var(--ease-standard) infinite;
}
@keyframes rsa-slide {
  0%   { left: -30%; }
  100% { left: 100%; }
}

.rsa-output {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.rsa-output-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.rsa-output-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.form-label {
  font-size: var(--fs-caption);
  color: var(--text-secondary);
  font-weight: var(--fw-semibold);
}
.rsa-textarea {
  min-height: 180px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius);
  padding: var(--space-3);
  white-space: pre;
  word-break: normal;
  overflow: auto;
}
</style>
