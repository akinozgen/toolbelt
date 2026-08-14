<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { time, type TimeNow } from '../../services/generate';

const now = ref<TimeNow | null>(null);
const copiedKey = ref<string>('');
let tickTimer: ReturnType<typeof setInterval> | null = null;
let copyTimer: ReturnType<typeof setTimeout> | null = null;

async function refresh() {
  try {
    now.value = await time.now();
  } catch (e) {
    console.error('time_now failed', e);
  }
}

async function copy(key: string, value: string | number) {
  if (value === undefined || value === null) return;
  await navigator.clipboard.writeText(String(value));
  copiedKey.value = key;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copiedKey.value = ''), 1000);
}

onMounted(() => {
  refresh();
  tickTimer = setInterval(refresh, 1000);
});
onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer);
  if (copyTimer) clearTimeout(copyTimer);
});

const rows = [
  { key: 'unix_seconds', label: 'Unix seconds' },
  { key: 'unix_millis',  label: 'Unix milliseconds' },
  { key: 'iso8601',      label: 'ISO 8601' },
  { key: 'rfc3339',      label: 'RFC 3339' },
  { key: 'rfc2822',      label: 'RFC 2822' },
  { key: 'local_iso',    label: 'Local time (ISO)' },
];
</script>

<template>
  <div class="gen-form" style="max-width: 880px;">
    <p class="text-secondary" style="font-size: var(--fs-caption); max-width: 560px;">
      Live current timestamp updated every second. Times are UTC except where labeled local.
      <span v-if="now" class="text-tertiary">
        Local offset: UTC{{ now.utc_offset_minutes >= 0 ? '+' : '' }}{{ Math.floor(now.utc_offset_minutes / 60) }}:{{ String(Math.abs(now.utc_offset_minutes) % 60).padStart(2, '0') }}
      </span>
    </p>

    <div class="time-rows">
      <div v-for="row in rows" :key="row.key" class="time-row">
        <div class="time-row-label">{{ row.label }}</div>
        <code class="time-row-value">{{ now ? (now as any)[row.key] : '—' }}</code>
        <button
          type="button"
          class="time-row-copy"
          :class="{ copied: copiedKey === row.key }"
          @click="copy(row.key, now ? (now as any)[row.key] : '')"
          :title="copiedKey === row.key ? 'Copied' : 'Copy'"
        >
          <Check v-if="copiedKey === row.key" :size="13" />
          <Copy v-else :size="13" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-rows {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-elevated);
}
.time-row {
  display: grid;
  grid-template-columns: 200px 1fr 36px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}
.time-row:last-child { border-bottom: none; }
.time-row-label {
  font-size: var(--fs-caption);
  color: var(--text-secondary);
}
.time-row-value {
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  color: var(--text-primary);
  user-select: text;
  word-break: break-all;
}
.time-row-copy {
  width: 28px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text-tertiary);
  cursor: default;
  transition: background var(--motion-fast), color var(--motion-fast);
}
.time-row-copy:hover { background: var(--bg-hover); color: var(--text-primary); }
.time-row-copy.copied { color: var(--success); }
</style>
