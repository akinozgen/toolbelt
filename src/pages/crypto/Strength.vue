<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { UiInput } from '../../components/ui';
import { strength, type StrengthResult } from '../../services/crypto';

const password = ref('');
const result = ref<StrengthResult | null>(null);
let debounce: ReturnType<typeof setTimeout> | null = null;

async function check() {
  if (!password.value) { result.value = null; return; }
  try {
    result.value = await strength.check(password.value);
  } catch {
    result.value = null;
  }
}

watch(password, () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(check, 150);
});

const score = computed(() => result.value?.score ?? 0);
const label = computed(() => result.value?.label ?? '—');
const barColor = computed(() => {
  switch (score.value) {
    case 0: return 'var(--danger)';
    case 1: return '#FF8A4C';
    case 2: return 'var(--warning)';
    case 3: return '#83C56E';
    default: return 'var(--success)';
  }
});
</script>

<template>
  <div class="gen-form">
    <div class="gen-form-grid">
      <label class="gen-form-label">Password</label>
      <UiInput v-model="password" placeholder="type a password to evaluate" monospace />
    </div>

    <div class="strength-display">
      <div class="strength-bar-wrap">
        <div class="strength-bar" :style="{ width: `${(score / 4) * 100}%`, background: barColor }"></div>
      </div>
      <div class="strength-label" :style="{ color: barColor }">{{ label.toUpperCase() }}</div>
    </div>

    <div v-if="result" class="strength-meta">
      <div class="strength-row">
        <span class="strength-row-label">Score</span>
        <span class="strength-row-value">{{ score }} / 4</span>
      </div>
      <div class="strength-row">
        <span class="strength-row-label">Guesses</span>
        <span class="strength-row-value">10<sup>{{ result.guesses_log10.toFixed(1) }}</sup></span>
      </div>
      <div class="strength-row">
        <span class="strength-row-label">Online (throttled)</span>
        <span class="strength-row-value">{{ result.crack_time_online_throttling }}</span>
      </div>
      <div class="strength-row">
        <span class="strength-row-label">Offline (fast hash)</span>
        <span class="strength-row-value">{{ result.crack_time_offline_fast }}</span>
      </div>
    </div>

    <div v-if="result?.feedback_warning" class="gen-error">{{ result.feedback_warning }}</div>
    <ul v-if="result?.feedback_suggestions.length" class="strength-tips">
      <li v-for="(tip, i) in result.feedback_suggestions" :key="i">{{ tip }}</li>
    </ul>
  </div>
</template>

<style scoped>
.strength-display {
  display: flex; flex-direction: column; gap: var(--space-2);
}
.strength-bar-wrap {
  width: 100%; height: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  overflow: hidden;
}
.strength-bar {
  height: 100%;
  transition: width var(--motion-base) var(--ease-decel),
              background var(--motion-base) var(--ease-standard);
}
.strength-label {
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.06em;
}
.strength-meta {
  display: flex; flex-direction: column; gap: var(--space-1);
  padding: var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.strength-row {
  display: flex; justify-content: space-between;
  font-size: var(--fs-body);
}
.strength-row-label { color: var(--text-secondary); }
.strength-row-value {
  font-family: var(--font-mono); color: var(--text-primary);
}
.strength-tips {
  margin: 0; padding-left: var(--space-5);
  font-size: var(--fs-caption);
  color: var(--text-secondary);
}
</style>
