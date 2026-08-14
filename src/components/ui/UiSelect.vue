<script lang="ts" setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

interface Option { label: string; value: string | number; }

interface Props {
  modelValue: string | number;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select…',
  disabled: false,
  size: 'md',
});

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const selectedLabel = computed(
  () => props.options.find((o) => o.value === props.modelValue)?.label ?? props.placeholder,
);

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
}
function pick(opt: Option) {
  emit('update:modelValue', opt.value);
  open.value = false;
}

function onClickOutside(e: MouseEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false;
  }
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) open.value = false;
}

onMounted(() => {
  window.addEventListener('mousedown', onClickOutside);
  window.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onClickOutside);
  window.removeEventListener('keydown', onKey);
});
</script>

<template>
  <div ref="rootRef" :class="['ui-select', `ui-select--${size}`, { 'is-open': open, 'is-disabled': disabled }]">
    <button class="ui-select-trigger" type="button" @click="toggle">
      <span class="ui-select-label">{{ selectedLabel }}</span>
      <ChevronDown :size="14" class="ui-select-chevron" />
    </button>
    <div v-if="open" class="ui-select-menu" role="listbox">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="ui-select-option"
        :class="{ 'is-selected': opt.value === modelValue }"
        @click="pick(opt)"
        type="button"
      >
        <Check v-if="opt.value === modelValue" :size="13" class="ui-select-check" />
        <span v-else style="width: 13px"></span>
        <span>{{ opt.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ui-select {
  position: relative;
  display: inline-block;
  width: 100%;
}

.ui-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: var(--control-height);
  padding: 0 var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-bottom-color: var(--text-tertiary);
  border-radius: var(--radius);
  font-size: var(--fs-body);
  color: var(--text-primary);
  cursor: default;
  transition: background var(--motion-fast) var(--ease-standard),
              border-color var(--motion-fast) var(--ease-standard);
}
.ui-select-trigger:hover { background: var(--bg-hover); }
.ui-select.is-open .ui-select-trigger {
  background: var(--bg-base);
  border-bottom-width: 2px;
  border-bottom-color: var(--accent);
  padding-bottom: 0;
}
.ui-select.is-disabled { opacity: 0.5; pointer-events: none; }

.ui-select--sm .ui-select-trigger {
  height: var(--control-height-sm);
  padding: 0 var(--space-2);
  font-size: var(--fs-caption);
}

.ui-select-chevron {
  flex-shrink: 0;
  color: var(--text-tertiary);
  transition: transform var(--motion-fast) var(--ease-standard);
}
.ui-select.is-open .ui-select-chevron { transform: rotate(180deg); }

.ui-select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-flyout);
  padding: var(--space-1);
  z-index: var(--z-popover);
  max-height: 320px;
  overflow-y: auto;
}

.ui-select-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  height: var(--row-height);
  padding: 0 var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: var(--fs-body);
  color: var(--text-primary);
  cursor: default;
  text-align: left;
  transition: background var(--motion-fast) var(--ease-standard);
}
.ui-select-option:hover  { background: var(--bg-hover); }
.ui-select-option:active { background: var(--bg-pressed); }
.ui-select-option.is-selected { color: var(--text-primary); }

.ui-select-check { color: var(--accent); }
</style>
