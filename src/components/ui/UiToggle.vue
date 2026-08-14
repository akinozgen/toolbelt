<script lang="ts" setup>
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
  <label :class="['ui-toggle', { 'is-on': modelValue, 'is-disabled': disabled }]">
    <button type="button" class="ui-toggle-track" @click="toggle" role="switch" :aria-checked="modelValue">
      <span class="ui-toggle-thumb"></span>
    </button>
    <span v-if="label" class="ui-toggle-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.ui-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  cursor: default;
  user-select: none;
}
.ui-toggle.is-disabled { opacity: 0.5; pointer-events: none; }

.ui-toggle-track {
  position: relative;
  width: 40px;
  height: 20px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid var(--text-tertiary);
  cursor: default;
  transition: background var(--motion-fast) var(--ease-standard),
              border-color var(--motion-fast) var(--ease-standard);
}
.ui-toggle-track:hover { border-color: var(--text-secondary); }

.ui-toggle.is-on .ui-toggle-track {
  background: var(--accent);
  border-color: var(--accent);
}
.ui-toggle.is-on .ui-toggle-track:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.ui-toggle-thumb {
  position: absolute;
  top: 50%;
  left: 4px;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--text-secondary);
  transition: left var(--motion-base) var(--ease-decel),
              background var(--motion-fast) var(--ease-standard),
              width var(--motion-fast) var(--ease-standard),
              height var(--motion-fast) var(--ease-standard);
}
.ui-toggle.is-on .ui-toggle-thumb {
  left: calc(100% - 16px);
  background: var(--text-on-accent);
  width: 12px;
  height: 12px;
}
.ui-toggle-track:active .ui-toggle-thumb {
  width: 14px;
}
.ui-toggle.is-on .ui-toggle-track:active .ui-toggle-thumb {
  width: 16px;
  left: calc(100% - 20px);
}

.ui-toggle-label {
  font-size: var(--fs-body);
  color: var(--text-primary);
}
</style>
