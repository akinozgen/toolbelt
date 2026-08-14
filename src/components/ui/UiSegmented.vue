<script lang="ts" setup>
interface Option { label: string; value: string | number; }
interface Props {
  modelValue: string | number;
  options: Option[];
  size?: 'sm' | 'md';
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), { size: 'md', disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>();
function pick(v: string | number) {
  if (props.disabled) return;
  emit('update:modelValue', v);
}
</script>

<template>
  <div :class="['ui-segmented', `ui-segmented--${size}`, { 'is-disabled': disabled }]">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :class="['ui-segmented-item', { 'is-active': opt.value === modelValue }]"
      @click="pick(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-segmented {
  display: inline-flex;
  align-items: stretch;
  height: var(--control-height);
  padding: 2px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius);
  gap: 2px;
}
.ui-segmented.is-disabled { opacity: 0.5; pointer-events: none; }
.ui-segmented--sm { height: var(--control-height-sm); }

.ui-segmented-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 var(--space-3);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius) - 2px);
  font-family: inherit;
  font-size: var(--fs-body);
  color: var(--text-secondary);
  cursor: default;
  transition: background var(--motion-fast) var(--ease-standard),
              color var(--motion-fast) var(--ease-standard);
  white-space: nowrap;
}
.ui-segmented--sm .ui-segmented-item { padding: 0 var(--space-2); font-size: var(--fs-caption); }

.ui-segmented-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.ui-segmented-item.is-active {
  background: var(--bg-base);
  color: var(--text-primary);
  box-shadow: 0 1px 0 var(--border-subtle);
}
</style>
