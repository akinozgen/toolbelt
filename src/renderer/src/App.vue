<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { Minus, Square, X } from 'lucide-vue-next';
import Sidebar from './components/Sidebar.vue';
import { key } from './store';

const router = useRouter();
const store  = useStore(key);

onMounted(async () => {
  const startPage = store.getters.getStartPage || '/';
  if (startPage !== '/') router.push(startPage);
});

const minimizeWindow = () => window.ipcRenderer.send('window_minimize');
const maximizeWindow = () => window.ipcRenderer.send('window_maximize');
const closeWindow    = () => window.ipcRenderer.send('window_close');
</script>

<template>
  <div id="titlebar">
    <button class="wc-btn"       @click="minimizeWindow" title="Minimize"><Minus  :size="13" /></button>
    <button class="wc-btn"       @click="maximizeWindow" title="Maximize"><Square :size="11" /></button>
    <button class="wc-btn wc-close" @click="closeWindow" title="Close"  ><X      :size="13" /></button>
  </div>
  <div class="app-unified-bg"></div>

  <div class="flex min-h-screen" style="background: transparent; position: relative; z-index: 2;">
    <aside
      class="fixed z-10 flex flex-col"
      style="top: var(--titlebar-height); bottom: 0; width: var(--sidebar-width); background: transparent; border-right: none; padding-top: 0;"
    >
      <Sidebar />
    </aside>
    <main class="flex flex-col flex-grow" style="margin-left: var(--sidebar-width);">
      <div class="content-shell">
        <router-view />
      </div>
    </main>
  </div>
</template>
