<script lang="ts" setup>
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { Minus, Square, X, PanelLeft } from 'lucide-vue-next';
import { getCurrentWindow } from '@tauri-apps/api/window';
import Sidebar from './components/Sidebar.vue';
import { key } from './store';

const router = useRouter();
const store  = useStore(key);
const appWindow = getCurrentWindow();

const sidebarMode = computed(() => store.state.app_settings.sidebar_mode);

onMounted(async () => {
  const startPage = store.getters.getStartPage || '/';
  if (startPage !== '/') router.push(startPage);
});

function toggleSidebar() {
  const next = sidebarMode.value === 'expanded' ? 'compact' : 'expanded';
  store.commit('setAppSetting', { path: 'sidebar_mode', value: next });
  store.dispatch('applySettingsToDOM');
}

const minimizeWindow = () => appWindow.minimize();
const maximizeWindow = async () =>
  (await appWindow.isMaximized()) ? appWindow.unmaximize() : appWindow.maximize();
const closeWindow = () => appWindow.close();
</script>

<template>
  <div class="app-mica-bg"></div>

  <header id="titlebar">
    <button
      class="tb-nav-toggle"
      @click="toggleSidebar"
      :title="sidebarMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'"
    >
      <PanelLeft :size="14" />
    </button>
    <div class="tb-title titlebar-drag">
      <span class="tb-app-name">Toolbelt</span>
    </div>
    <div class="tb-window-controls">
      <button class="wc-btn" @click="minimizeWindow" title="Minimize"><Minus  :size="13" /></button>
      <button class="wc-btn" @click="maximizeWindow" title="Maximize"><Square :size="11" /></button>
      <button class="wc-btn wc-close" @click="closeWindow" title="Close"><X :size="13" /></button>
    </div>
  </header>

  <div class="app-shell">
    <aside class="app-sidebar">
      <Sidebar />
    </aside>
    <main class="app-main">
      <div class="content-shell">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
#titlebar {
  display: flex;
  align-items: center;
  padding: 0;
  background: transparent;
  border-bottom: 1px solid var(--border-subtle);
}

.tb-nav-toggle {
  width: 46px;
  height: var(--titlebar-height);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: default;
  transition: background var(--motion-fast) var(--ease-standard),
              color      var(--motion-fast) var(--ease-standard);
}
.tb-nav-toggle:hover  { background: var(--bg-hover); color: var(--text-primary); }
.tb-nav-toggle:active { background: var(--bg-pressed); }

.tb-title {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 var(--space-3);
}
.tb-app-name {
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

.tb-window-controls {
  display: flex;
  align-items: stretch;
  height: var(--titlebar-height);
}
.tb-window-controls .wc-btn {
  height: var(--titlebar-height);
}

.app-shell {
  position: relative;
  z-index: 1;
  display: flex;
  height: 100vh;
  padding-top: var(--titlebar-height);
}

.app-sidebar {
  flex-shrink: 0;
  width: var(--sidebar-width);
  height: calc(100vh - var(--titlebar-height));
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  transition: width var(--motion-base) var(--ease-decel);
  overflow: hidden;
}

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
}

.content-shell {
  flex: 1;
  min-height: 0;
  background: transparent;
  overflow: hidden;
  padding-top: 0;
  height: auto;
}

/* Page transition (WinUI drill-in) */
.page-enter-active {
  transition: opacity var(--motion-page) var(--ease-decel),
              transform var(--motion-page) var(--ease-decel);
}
.page-leave-active {
  transition: opacity var(--motion-fast) var(--ease-accel);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
}
</style>
