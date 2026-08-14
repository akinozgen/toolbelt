<script lang="ts" setup>
import { Check } from 'lucide-vue-next';

interface Props {
  modelValue: boolean;
  disabled?: boolean;
  label?: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
function toggle() {
  if (props.disabled) return;
  emit('update:modelValue', !props.modelValue);
}
</script>

<template>
  <label :class="['ui-checkbox', { 'is-checked': modelValue, 'is-disabled': disabled }]">
    <button type="button" class="ui-checkbox-box" @click="toggle" role="checkbox" :aria-checked="modelValue">
      <Check v-if="modelValue" :size="11" class="ui-checkbox-check" />
    </button>
    <span v-if="label" class="ui-checkbox-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.ui-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: default;
  user-select: none;
}
.ui-checkbox.is-disabled { opacity: 0.5; pointer-events: none; }

.ui-checkbox-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: transparent;
  border: 1px solid var(--text-tertiary);
  border-radius: var(--radius-sm);
  cursor: default;
  transition: background var(--motion-fast) var(--ease-standard),
              border-color var(--motion-fast) var(--ease-standard);
}
.ui-checkbox-box:hover { border-color: var(--text-secondary); background: var(--bg-hover); }

.ui-checkbox.is-checked .ui-checkbox-box {
  background: var(--accent);
  border-color: var(--accent);
}
.ui-checkbox.is-checked .ui-checkbox-box:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.ui-checkbox-check { color: var(--text-on-accent); }
.ui-checkbox-label { font-size: var(--fs-body); color: var(--text-primary); }
</style>
