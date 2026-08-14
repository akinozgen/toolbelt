<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { UiButton, UiInput, UiToggle } from '../../components/ui';
import { text } from '../../services/text';

const input     = ref('Merhaba Dünya! Hoş Geldiniz');
const asciiOnly = ref(true);
const separator = ref('-');
const output    = ref('');
const error     = ref('');
const copied    = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let debounce:  ReturnType<typeof setTimeout> | null = null;

async function run() {
  error.value = '';
  try {
    output.value = await text.slugify({
      input: input.value,
      ascii_only: asciiOnly.value,
      separator: separator.value || '-',
    });
  } catch (e: any) { error.value = e?.message ?? String(e); }
}
watch([input, asciiOnly, separator], () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(run, 150);
}, { immediate: true });

async function copy() {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = false), 1200);
}
</script>

<template>
  <div class="text-form">
    <div class="gen-form-grid" style="max-width: 480px;">
      <label class="gen-form-label">ASCII only</label>
      <div class="gen-form-value">
        <UiToggle v-model="asciiOnly" />
        <span class="text-tertiary" style="font-size: var(--fs-caption);">
          Turkish ş→s, ı→i, etc. Off keeps Unicode.
        </span>
      </div>
      <label class="gen-form-label">Separator</label>
      <UiInput v-model="separator" placeholder="-" monospace />
    </div>

    <div class="gen-form-grid" style="max-width: 720px;">
      <label class="gen-form-label">Input</label>
      <UiInput v-model="input" />
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div class="gen-output-row">
      <code class="gen-output-text" :class="{ muted: !output }">{{ output || '—' }}</code>
      <UiButton variant="standard" size="sm" @click="copy" :disabled="!output">
        <template #icon><Check v-if="copied" :size="13" /><Copy v-else :size="13" /></template>
        {{ copied ? 'Copied' : 'Copy' }}
      </UiButton>
    </div>
  </div>
</template>
