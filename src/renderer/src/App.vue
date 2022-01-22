<script lang="ts" setup>
import { onBeforeMount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Sidebar from './components/Sidebar.vue';
import { key } from './store';

const { platform } = window;
const router = useRouter();
const store = useStore(key);
const sidebarClass = ref('');

function sidebarClick() {
  if (sidebarClass.value === 'opened') sidebarClass.value = '';
  else sidebarClass.value = 'opened';
}

onBeforeMount(() => {
  store.dispatch('changeTheme', {
    theme: ''
  });
});

onMounted(async () => {
  let startPage = store.getters.getStartPage || '/';
  if (startPage != '/') {
    router.push(startPage);
  }
});
</script>

<template>
  <div id="titlebar"></div>
  <div class="container flex flex-row min-h-screen" :class="platform === 'darwin' ? 'vibrant' : ''">
    <aside
      @click="sidebarClick()"
      :class="{
        opened: sidebarClass == 'opened',
        'bg-opacity-10 text-white': platform === 'darwin'
      }"
      class="sidebar pt-10 w-64 md:shadow bg-primary fixed h-full z-10 overflow-auto"
    >
      <Sidebar />
    </aside>
    <main class="main pt-10 flex flex-col flex-grow ml-64">
      <router-view />
    </main>
  </div>
</template>
