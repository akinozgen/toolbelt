<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Copy, RefreshCw, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented } from '../../components/ui';
import { network, type Ipv4Kind } from '../../services/generate';

const kind   = ref<Ipv4Kind>('any');
const value  = ref('');
const copied = ref(false);
const error  = ref('');
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const kindOptions = [
  { label: 'Any',     value: 'any'     },
  { label: 'Private', value: 'private' },
  { label: 'Public',  value: 'public'  },
];

async function generate() {
  error.value = '';
  try {
    value.value = await network.ipv4(kind.value);
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
      <label class="gen-form-label">Range</label>
      <UiSegmented v-model="kind" :options="kindOptions" size="sm" />
    </div>
    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 520px;">
      Excludes loopback (127/8), link-local (169.254/16) and multicast (224+).
      Private uses 10/8, 172.16/12, 192.168/16.
    </p>
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
