<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Copy, RefreshCw, Check } from 'lucide-vue-next';
import { UiButton, UiSegmented, UiToggle } from '../../components/ui';
import { network } from '../../services/generate';

const separator = ref<':' | '-'>(':');
const uppercase = ref(false);
const local     = ref(true);
const value     = ref('');
const copied    = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const sepOptions = [
  { label: 'Colon (aa:bb)',  value: ':' },
  { label: 'Hyphen (aa-bb)', value: '-' },
];

async function generate() {
  value.value = await network.mac({
    separator: separator.value,
    uppercase: uppercase.value,
    locally_administered: local.value,
  });
  copied.value = false;
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
      <label class="gen-form-label">Separator</label>
      <UiSegmented v-model="separator" :options="sepOptions" size="sm" />

      <label class="gen-form-label">Uppercase</label>
      <UiToggle v-model="uppercase" />

      <label class="gen-form-label">Locally administered</label>
      <div class="gen-form-value">
        <UiToggle v-model="local" />
        <span class="text-tertiary" style="font-size: var(--fs-caption);">
          Sets the LA bit so the address won't collide with hardware vendors.
        </span>
      </div>
    </div>
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
