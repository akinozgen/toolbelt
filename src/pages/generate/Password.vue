<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Copy, RefreshCw, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiSlider, UiToggle } from '../../components/ui';
import { secret } from '../../services/generate';

const length          = ref(20);
const lower           = ref(true);
const upper           = ref(true);
const digit           = ref(true);
const symbol          = ref(false);
const excludeSimilar  = ref(false);
const custom          = ref('');
const value           = ref('');
const copied          = ref(false);
const error           = ref('');
let copyTimer: ReturnType<typeof setTimeout> | null = null;

async function generate() {
  error.value = '';
  try {
    value.value = await secret.password({
      length: length.value,
      lower: lower.value,
      upper: upper.value,
      digit: digit.value,
      symbol: symbol.value,
      exclude_similar: excludeSimilar.value,
      custom: custom.value || undefined,
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
        <UiSlider v-model="length" :min="4" :max="128" />
        <span class="mono" style="min-width: 32px; color: var(--text-secondary);">{{ length }}</span>
      </div>

      <label class="gen-form-label">Lowercase a–z</label>
      <UiToggle v-model="lower" />

      <label class="gen-form-label">Uppercase A–Z</label>
      <UiToggle v-model="upper" />

      <label class="gen-form-label">Digits 0–9</label>
      <UiToggle v-model="digit" />

      <label class="gen-form-label">Symbols</label>
      <UiToggle v-model="symbol" />

      <label class="gen-form-label">Exclude similar</label>
      <div class="gen-form-value">
        <UiToggle v-model="excludeSimilar" />
        <span class="text-tertiary" style="font-size: var(--fs-caption);">I, l, 1, 0, O, o</span>
      </div>

      <label class="gen-form-label">Custom alphabet</label>
      <UiInput v-model="custom" placeholder="(overrides toggles when set)" monospace />
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
