<script lang="ts" setup>
interface Props {
  modelValue: string | number;
  value: string | number;
  disabled?: boolean;
  label?: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>();
function pick() {
  if (props.disabled) return;
  emit('update:modelValue', props.value);
}
</script>

<template>
  <label :class="['ui-radio', { 'is-checked': modelValue === value, 'is-disabled': disabled }]">
    <button type="button" class="ui-radio-circle" @click="pick" role="radio" :aria-checked="modelValue === value">
      <span v-if="modelValue === value" class="ui-radio-dot"></span>
    </button>
    <span v-if="label" class="ui-radio-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.ui-radio {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: default;
  user-select: none;
}
.ui-radio.is-disabled { opacity: 0.5; pointer-events: none; }

.ui-radio-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: transparent;
  border: 1px solid var(--text-tertiary);
  border-radius: 50%;
  cursor: default;
  transition: border-color var(--motion-fast) var(--ease-standard),
              background var(--motion-fast) var(--ease-standard);
}
.ui-radio-circle:hover { border-color: var(--text-secondary); background: var(--bg-hover); }

.ui-radio.is-checked .ui-radio-circle {
  border-color: var(--accent);
  border-width: 1px;
}
.ui-radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  transition: transform var(--motion-fast) var(--ease-decel);
}
.ui-radio-circle:active .ui-radio-dot { transform: scale(0.8); }

.ui-radio-label { font-size: var(--fs-body); color: var(--text-primary); }
</style>
