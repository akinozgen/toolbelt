<script lang="ts" setup>
import { ref, computed, watch, defineAsyncComponent, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface ItemDef {
  id: string;
  label: string;
  component: Component;
}
interface CategoryDef {
  id: string;
  label: string;
  items: ItemDef[];
}

const lazy = (loader: () => Promise<any>) => defineAsyncComponent(loader);

const categories: CategoryDef[] = [
  {
    id: 'identifiers',
    label: 'Identifiers',
    items: [
      { id: 'uuid-v4',   label: 'UUID v4',   component: lazy(() => import('./generate/UuidV4.vue')) },
      { id: 'uuid-v7',   label: 'UUID v7',   component: lazy(() => import('./generate/UuidV7.vue')) },
      { id: 'ulid',      label: 'ULID',      component: lazy(() => import('./generate/Ulid.vue')) },
      { id: 'nanoid',    label: 'NanoID',    component: lazy(() => import('./generate/NanoId.vue')) },
      { id: 'snowflake', label: 'Snowflake', component: lazy(() => import('./generate/Snowflake.vue')) },
      { id: 'cuid2',     label: 'CUID2',     component: lazy(() => import('./generate/Cuid2.vue')) },
    ],
  },
  {
    id: 'secrets',
    label: 'Secrets',
    items: [
      { id: 'password', label: 'Password',     component: lazy(() => import('./generate/Password.vue')) },
      { id: 'random',   label: 'Random Bytes', component: lazy(() => import('./generate/Random.vue')) },
      { id: 'aes',      label: 'AES Key',      component: lazy(() => import('./generate/AesKey.vue')) },
      { id: 'rsa',      label: 'RSA Key Pair', component: lazy(() => import('./generate/RsaKeyPair.vue')) },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      { id: 'lorem',       label: 'Lorem Ipsum',       component: lazy(() => import('./generate/LoremIpsum.vue')) },
      { id: 'placeholder', label: 'Placeholder Image', component: lazy(() => import('./generate/PlaceholderImage.vue')) },
    ],
  },
  {
    id: 'qr',
    label: 'QR',
    items: [
      { id: 'qr-generate', label: 'Generate', component: lazy(() => import('./generate/QrGenerate.vue')) },
      { id: 'qr-read',     label: 'Read',     component: lazy(() => import('./generate/QrRead.vue')) },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    items: [
      { id: 'time-current', label: 'Current', component: lazy(() => import('./generate/TimeCurrent.vue')) },
      { id: 'time-convert', label: 'Convert', component: lazy(() => import('./generate/TimeConvert.vue')) },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    items: [
      { id: 'ua',   label: 'User Agent', component: lazy(() => import('./generate/UserAgent.vue')) },
      { id: 'ipv4', label: 'IPv4',       component: lazy(() => import('./generate/Ipv4.vue')) },
      { id: 'ipv6', label: 'IPv6',       component: lazy(() => import('./generate/Ipv6.vue')) },
      { id: 'mac',  label: 'MAC',        component: lazy(() => import('./generate/Mac.vue')) },
    ],
  },
];

const DEFAULT_ITEM = 'password';
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
    router.replace({ path: '/generate', query: { item: id } });
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
      <div class="gen-sidebar-title">Generate</div>
      <div v-for="cat in categories" :key="cat.id" class="gen-cat">
        <div class="gen-cat-label">{{ cat.label }}</div>
        <button
          v-for="item in cat.items"
          :key="item.id"
          type="button"
          :class="['gen-item', { active: activeId === item.id }]"
          @click="selectItem(item.id)"
        >
          {{ item.label }}
        </button>
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
.gen-page {
  display: flex;
  height: 100%;
  background: transparent;
}

.gen-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  padding: var(--space-4) var(--space-2);
  overflow-y: auto;
}

.gen-sidebar-title {
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 var(--space-3);
  margin-bottom: var(--space-4);
}

.gen-cat { margin-bottom: var(--space-4); }
.gen-cat-label {
  font-size: 10px;
  font-weight: var(--fw-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 var(--space-3);
  margin-bottom: var(--space-1);
}

.gen-item {
  position: relative;
  display: block;
  width: 100%;
  text-align: left;
  height: var(--row-height);
  padding: 0 var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: var(--fs-body);
  font-family: inherit;
  cursor: default;
  transition: background var(--motion-fast) var(--ease-standard),
              color var(--motion-fast) var(--ease-standard);
}
.gen-item:hover  { background: var(--bg-hover); color: var(--text-primary); }
.gen-item:active { background: var(--bg-pressed); }
.gen-item.active {
  background: var(--bg-selected);
  color: var(--text-primary);
}
.gen-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

.gen-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gen-pane-header {
  padding: var(--space-5) var(--space-8) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}
.gen-pane-crumb {
  display: block;
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 2px;
}
.gen-pane-title {
  font-size: var(--fs-title-lg);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  margin: 0;
}

.gen-pane-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-5) var(--space-8);
}
</style>
