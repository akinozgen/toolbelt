<script lang="ts" setup>
interface Props {
  title?: string;
  description?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
withDefaults(defineProps<Props>(), { padding: 'md' });
</script>

<template>
  <section :class="['ui-card', `ui-card--p-${padding}`]">
    <header v-if="title || description || $slots.header" class="ui-card-header">
      <slot name="header">
        <div class="ui-card-text">
          <h3 v-if="title" class="ui-card-title">{{ title }}</h3>
          <p v-if="description" class="ui-card-description">{{ description }}</p>
        </div>
        <div v-if="$slots.action" class="ui-card-action">
          <slot name="action" />
        </div>
      </slot>
    </header>
    <div v-if="$slots.default" class="ui-card-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.ui-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
}
.ui-card--p-none { padding: 0; }
.ui-card--p-sm   { padding: var(--space-3); }
.ui-card--p-md   { padding: var(--space-4); }
.ui-card--p-lg   { padding: var(--space-5); }

.ui-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.ui-card-text {
  flex: 1;
  min-width: 0;
}
.ui-card-title {
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  margin: 0;
}
.ui-card-description {
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  margin: 2px 0 0 0;
}
.ui-card-action { flex-shrink: 0; }

.ui-card-body {
  margin-top: var(--space-3);
}
.ui-card--p-none .ui-card-body { margin-top: 0; }
</style>
