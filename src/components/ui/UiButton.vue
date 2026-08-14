<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  variant?: 'accent' | 'standard' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'standard',
  size: 'md',
  iconOnly: false,
  disabled: false,
  loading: false,
  type: 'button',
});

defineEmits<{ click: [event: MouseEvent] }>();

const classes = computed(() => [
  'ui-btn',
  `ui-btn--${props.variant}`,
  `ui-btn--${props.size}`,
  { 'ui-btn--icon-only': props.iconOnly, 'is-loading': props.loading },
]);
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <slot name="icon" />
    <span v-if="$slots.default && !iconOnly" class="ui-btn-label"><slot /></span>
  </button>
</template>

<style scoped>
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: var(--control-height);
  padding: 0 var(--space-4);
  border-radius: var(--radius);
  border: 1px solid transparent;
  font-family: inherit;
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  cursor: default;
  user-select: none;
  white-space: nowrap;
  transition: background var(--motion-fast) var(--ease-standard),
              border-color var(--motion-fast) var(--ease-standard),
              color var(--motion-fast) var(--ease-standard);
}
.ui-btn:disabled, .ui-btn.is-loading {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Variants */
.ui-btn--accent {
  background: var(--accent);
  color: var(--text-on-accent);
  border-color: var(--accent);
}
.ui-btn--accent:not(:disabled):hover  { background: var(--accent-hover);  border-color: var(--accent-hover); }
.ui-btn--accent:not(:disabled):active { background: var(--accent-pressed); border-color: var(--accent-pressed); }

.ui-btn--standard {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-color: var(--border-strong);
  border-bottom-color: var(--text-tertiary);
}
.ui-btn--standard:not(:disabled):hover  { background: var(--bg-hover); }
.ui-btn--standard:not(:disabled):active {
  background: var(--bg-pressed);
  border-bottom-color: var(--border-strong);
}

.ui-btn--subtle {
  background: transparent;
  color: var(--text-secondary);
}
.ui-btn--subtle:not(:disabled):hover  { background: var(--bg-hover); color: var(--text-primary); }
.ui-btn--subtle:not(:disabled):active { background: var(--bg-pressed); }

.ui-btn--danger {
  background: var(--danger-bg);
  color: var(--danger);
  border-color: var(--border-subtle);
}
.ui-btn--danger:not(:disabled):hover  {
  background: var(--danger);
  color: var(--text-on-accent);
  border-color: var(--danger);
}
.ui-btn--danger:not(:disabled):active { filter: brightness(0.9); }

/* Sizes */
.ui-btn--sm {
  height: var(--control-height-sm);
  padding: 0 var(--space-3);
  font-size: var(--fs-caption);
  gap: var(--space-1);
}
.ui-btn--lg {
  height: var(--control-height-lg);
  padding: 0 var(--space-5);
  font-size: var(--fs-subtitle);
}

/* Icon-only square */
.ui-btn--icon-only {
  width: var(--control-height);
  padding: 0;
}
.ui-btn--sm.ui-btn--icon-only { width: var(--control-height-sm); }
.ui-btn--lg.ui-btn--icon-only { width: var(--control-height-lg); }
</style>
