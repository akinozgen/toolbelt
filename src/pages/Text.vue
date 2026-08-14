<script lang="ts" setup>
import { ref, computed, watch, defineAsyncComponent, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface ItemDef { id: string; label: string; component: Component }
interface CategoryDef { id: string; label: string; items: ItemDef[] }

const lazy = (loader: () => Promise<any>) => defineAsyncComponent(loader);

const categories: CategoryDef[] = [
  {
    id: 'manipulate', label: 'Manipulate',
    items: [
      { id: 'sort',   label: 'Sort',   component: lazy(() => import('./text/Sort.vue')) },
      { id: 'dedupe', label: 'Dedupe', component: lazy(() => import('./text/Dedupe.vue')) },
      { id: 'trim',   label: 'Trim',   component: lazy(() => import('./text/Trim.vue')) },
    ],
  },
  {
    id: 'convert', label: 'Convert',
    items: [
      { id: 'case',     label: 'Case',           component: lazy(() => import('./text/Case.vue')) },
      { id: 'slugify',  label: 'Slugify',        component: lazy(() => import('./text/Slugify.vue')) },
      { id: 'markdown', label: 'Markdown → HTML',component: lazy(() => import('./text/Markdown.vue')) },
    ],
  },
  {
    id: 'encode', label: 'Escape',
    items: [
      { id: 'escape',   label: 'Escape',   component: lazy(() => import('./text/Escape.vue')) },
      { id: 'unescape', label: 'Unescape', component: lazy(() => import('./text/Unescape.vue')) },
    ],
  },
  {
    id: 'inspect', label: 'Inspect',
    items: [
      { id: 'counter', label: 'Counter', component: lazy(() => import('./text/Counter.vue')) },
    ],
  },
];

const DEFAULT_ITEM = 'sort';
const allItemIds = new Set(categories.flatMap((c) => c.items.map((i) => i.id)));
const router = useRouter();
const route = useRoute();
const requested = computed(() => String(route.query.item ?? ''));
const activeId = ref<string>(allItemIds.has(requested.value) ? requested.value : DEFAULT_ITEM);

watch(requested, (next) => {
  if (allItemIds.has(next)) activeId.value = next;
  else if (next === '') activeId.value = DEFAULT_ITEM;
});

function selectItem(id: string) {
  activeId.value = id;
  if (route.query.item !== id) {
    router.replace({ path: '/text', query: { item: id } });
  }
}

const activeItem = computed(() => {
  for (const cat of categories) {
    const found = cat.items.find((i) => i.id === activeId.value);
    if (found) return { ...found, category: cat.label };
  }
  return null;
});
</script>

<template>
  <div class="gen-page">
    <aside class="gen-sidebar">
      <div class="gen-sidebar-title">Text</div>
      <div v-for="cat in categories" :key="cat.id" class="gen-cat">
        <div class="gen-cat-label">{{ cat.label }}</div>
        <button
          v-for="item in cat.items"
          :key="item.id"
          type="button"
          :class="['gen-item', { active: activeId === item.id }]"
          @click="selectItem(item.id)"
        >{{ item.label }}</button>
      </div>
    </aside>

    <main class="gen-pane">
      <header class="gen-pane-header">
        <span class="gen-pane-crumb">{{ activeItem?.category }}</span>
        <h1 class="gen-pane-title">{{ activeItem?.label }}</h1>
      </header>
      <div class="gen-pane-body">
        <component :is="activeItem?.component" v-if="activeItem" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.gen-page { display: flex; height: 100%; background: transparent; }
.gen-sidebar {
  width: 220px; flex-shrink: 0;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  padding: var(--space-4) var(--space-2);
  overflow-y: auto;
}
.gen-sidebar-title {
  font-size: var(--fs-caption); font-weight: var(--fw-semibold);
  color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em;
  padding: 0 var(--space-3); margin-bottom: var(--space-4);
}
.gen-cat { margin-bottom: var(--space-4); }
.gen-cat-label {
  font-size: 10px; font-weight: var(--fw-semibold);
  color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em;
  padding: 0 var(--space-3); margin-bottom: var(--space-1);
}
.gen-item {
  position: relative; display: block; width: 100%; text-align: left;
  height: var(--row-height); padding: 0 var(--space-3);
  background: transparent; border: none; border-radius: var(--radius);
  color: var(--text-secondary); font-size: var(--fs-body); font-family: inherit;
  cursor: default;
  transition: background var(--motion-fast), color var(--motion-fast);
}
.gen-item:hover  { background: var(--bg-hover); color: var(--text-primary); }
.gen-item:active { background: var(--bg-pressed); }
.gen-item.active { background: var(--bg-selected); color: var(--text-primary); }
.gen-item.active::before {
  content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 3px; height: 16px; background: var(--accent); border-radius: 0 2px 2px 0;
}
.gen-pane { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
.gen-pane-header {
  padding: var(--space-5) var(--space-8) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}
.gen-pane-crumb {
  display: block; font-size: var(--fs-caption); color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px;
}
.gen-pane-title {
  font-size: var(--fs-title-lg); font-weight: var(--fw-semibold);
  color: var(--text-primary); margin: 0;
}
.gen-pane-body { flex: 1; min-height: 0; overflow-y: auto; padding: var(--space-5) var(--space-8); }
</style>
