<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Copy, RefreshCw, Check } from 'lucide-vue-next';
import { UiButton, UiSelect } from '../../components/ui';
import { network, type UaOpts } from '../../services/generate';

const browser = ref<UaOpts['browser']>('any');
const os      = ref<UaOpts['os']>('any');
const value   = ref('');
const copied  = ref(false);
const error   = ref('');
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const browserOptions = [
  { label: 'Any',     value: 'any'     },
  { label: 'Chrome',  value: 'Chrome'  },
  { label: 'Firefox', value: 'Firefox' },
  { label: 'Safari',  value: 'Safari'  },
  { label: 'Edge',    value: 'Edge'    },
];
const osOptions = [
  { label: 'Any',     value: 'any'     },
  { label: 'Windows', value: 'Windows' },
  { label: 'macOS',   value: 'macOS'   },
  { label: 'Linux',   value: 'Linux'   },
  { label: 'Android', value: 'Android' },
  { label: 'iOS',     value: 'iOS'     },
];

async function generate() {
  error.value = '';
  try {
    value.value = await network.ua({ browser: browser.value, os: os.value });
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
      <label class="gen-form-label">Browser</label>
      <UiSelect v-model="browser" :options="browserOptions" />

      <label class="gen-form-label">OS</label>
      <UiSelect v-model="os" :options="osOptions" />
    </div>

    <div v-if="error" class="gen-error">{{ error }}</div>

    <div class="gen-output-area">
      <textarea readonly class="gen-output-textarea" :value="value || '—'"></textarea>
    </div>

    <div class="gen-actions">
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
