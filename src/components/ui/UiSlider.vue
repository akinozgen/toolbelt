<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
});
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const percent = computed(() => {
  const range = props.max - props.min;
  return range === 0 ? 0 : ((props.modelValue - props.min) / range) * 100;
});
</script>

<template>
  <div :class="['ui-slider', { 'is-disabled': disabled }]">
    <div class="ui-slider-track">
      <div class="ui-slider-fill" :style="{ width: percent + '%' }"></div>
    </div>
    <input
      type="range"
      class="ui-slider-input"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    />
  </div>
</template>

<style scoped>
.ui-slider {
  position: relative;
  width: 100%;
  height: 20px;
  display: flex;
  align-items: center;
}
.ui-slider.is-disabled { opacity: 0.5; pointer-events: none; }

.ui-slider-track {
  position: absolute;
  inset: 0 0 0 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: var(--text-tertiary);
  border-radius: 2px;
  overflow: hidden;
}
.ui-slider-fill {
  height: 100%;
  background: var(--accent);
  transition: width var(--motion-fast) var(--ease-standard);
}

.ui-slider-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  appearance: none;
  background: transparent;
  cursor: default;
  margin: 0;
}
.ui-slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 4px solid var(--bg-base);
  box-shadow: 0 0 0 1px var(--accent);
  cursor: default;
  transition: transform var(--motion-fast) var(--ease-standard);
}
.ui-slider-input:hover::-webkit-slider-thumb { transform: scale(1.1); }
.ui-slider-input:active::-webkit-slider-thumb { transform: scale(0.9); }
.ui-slider-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 4px solid var(--bg-base);
  box-shadow: 0 0 0 1px var(--accent);
  cursor: default;
}
</style>
