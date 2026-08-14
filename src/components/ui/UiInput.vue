<script lang="ts" setup>
import { computed, ref } from 'vue';

interface Props {
  modelValue: string | number;
  type?: 'text' | 'password' | 'number' | 'email' | 'url' | 'search';
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  spellcheck?: boolean;
  autofocus?: boolean;
  invalid?: boolean;
  size?: 'sm' | 'md';
  monospace?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  spellcheck: false,
  autofocus: false,
  invalid: false,
  size: 'md',
  monospace: false,
});

defineEmits<{
  'update:modelValue': [value: string | number];
  enter: [event: KeyboardEvent];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
defineExpose({ focus: () => inputRef.value?.focus() });

const wrapClasses = computed(() => [
  'ui-input',
  `ui-input--${props.size}`,
  { 'is-disabled': props.disabled, 'is-invalid': props.invalid, 'is-mono': props.monospace },
]);
</script>

<template>
  <div :class="wrapClasses">
    <span v-if="$slots.prefix" class="ui-input-affix"><slot name="prefix" /></span>
    <input
      ref="inputRef"
      class="ui-input-el"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :spellcheck="spellcheck"
      :autofocus="autofocus"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown.enter="$emit('enter', $event)"
    />
    <span v-if="$slots.suffix" class="ui-input-affix"><slot name="suffix" /></span>
  </div>
</template>

<style scoped>
.ui-input {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  height: var(--control-height);
  padding: 0 var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-bottom-color: var(--text-tertiary);
  border-radius: var(--radius);
  transition: background var(--motion-fast) var(--ease-standard),
              border-color var(--motion-fast) var(--ease-standard);
}
.ui-input:hover:not(.is-disabled):not(:focus-within) {
  background: var(--bg-hover);
}
.ui-input:focus-within {
  background: var(--bg-base);
  border-bottom-width: 2px;
  border-bottom-color: var(--accent);
  padding-bottom: 0;
}
.ui-input.is-invalid {
  border-bottom-color: var(--danger);
}
.ui-input.is-disabled {
  opacity: 0.5;
}

.ui-input--sm { height: var(--control-height-sm); padding: 0 var(--space-2); font-size: var(--fs-caption); }

.ui-input-el {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: var(--fs-body);
  color: var(--text-primary);
}
.ui-input-el::placeholder {
  color: var(--text-tertiary);
}

.ui-input.is-mono .ui-input-el {
  font-family: var(--font-mono);
}

.ui-input-affix {
  display: inline-flex;
  align-items: center;
  color: var(--text-tertiary);
  flex-shrink: 0;
}
</style>
