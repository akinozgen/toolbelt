<script lang="ts" setup>
import { computed, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import {
  Home, Hash, NotebookPen, Settings, Wand2, KeyRound, Type, Palette,
  Braces, Binary, SendHorizontal, Diff, Regex,
} from 'lucide-vue-next';
import { key } from '../store';

const router = useRouter();
const store  = useStore(key);

const iconMap: Record<string, Component> = {
  '/':         Home,
  '/hash':     Hash,
  '/encode':   Binary,
  '/format':   Braces,
  '/diff':     Diff,
  '/regex':    Regex,
  '/http':     SendHorizontal,
  '/generate': Wand2,
  '/crypto':   KeyRound,
  '/text':     Type,
  '/visual':   Palette,
  '/notes':    NotebookPen,
  '/settings': Settings,
};

const currentRoute = computed(() => router.currentRoute.value.fullPath);
const isCompact    = computed(() => store.state.app_settings.sidebar_mode === 'compact');

const primaryRoutes  = computed(() => router.getRoutes().filter((r) => r.path !== '/settings'));
const settingsRoute  = computed(() => router.getRoutes().find((r) => r.path === '/settings'));
</script>

<template>
  <nav :class="['nav-root', { 'is-compact': isCompact }]">
    <div class="nav-list">
      <router-link
        v-for="route in primaryRoutes"
        :key="route.path"
        :to="route.path"
        class="nav-item"
        :class="{ active: currentRoute === route.path }"
        :title="isCompact ? String(route.name) : ''"
      >
        <component :is="iconMap[route.path]" :size="16" class="nav-item-icon" />
        <span class="nav-item-label">{{ route.name }}</span>
      </router-link>
    </div>

    <div class="nav-footer">
      <router-link
        v-if="settingsRoute"
        :to="settingsRoute.path"
        class="nav-item"
        :class="{ active: currentRoute === settingsRoute.path }"
        :title="isCompact ? 'Settings' : ''"
      >
        <component :is="iconMap['/settings']" :size="16" class="nav-item-icon" />
        <span class="nav-item-label">Settings</span>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.nav-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-2);
  background: transparent;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow-y: auto;
}

.nav-footer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-subtle);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--row-height);
  padding: 0 var(--space-3);
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: var(--fs-body);
  text-decoration: none;
  cursor: default;
  white-space: nowrap;
  overflow: hidden;
  transition: background var(--motion-fast) var(--ease-standard),
              color      var(--motion-fast) var(--ease-standard);
}
.nav-item:hover  { background: var(--bg-hover); color: var(--text-primary); }
.nav-item:active { background: var(--bg-pressed); }
.nav-item.active {
  background: var(--bg-selected);
  color: var(--text-primary);
}
.nav-item.active::before {
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

.nav-item-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: currentColor;
}

.nav-item-label {
  font-size: var(--fs-body);
  font-weight: var(--fw-regular);
  opacity: 1;
  transition: opacity var(--motion-fast) var(--ease-standard);
}

/* Compact mode */
.is-compact .nav-item {
  justify-content: center;
  padding: 0;
  width: 32px;
  margin: 0 auto;
}
.is-compact .nav-item-label {
  display: none;
}
</style>
