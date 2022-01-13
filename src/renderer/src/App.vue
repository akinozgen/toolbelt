<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Sidebar from './components/Sidebar.vue';

const { platform } = window;
const router = useRouter();
const sidebarClass = ref("");

function sidebarClick() {
  if (sidebarClass.value === "opened") sidebarClass.value = "";
  else sidebarClass.value = "opened";
}

onMounted(async () => {
  let startPage = localStorage.getItem("startPage") || "/";
  if (startPage != "/") {
    router.push(startPage);
  }
});
</script>

<template>
  <div id="titlebar"></div>
  <div class="container" :class="platform === 'darwin' ? 'vibrant' : ''">
    <div class="sidebar" @click="sidebarClick()" :class="sidebarClass">
      <Sidebar />
    </div>
    <div class="content">
      <router-view />
    </div>
  </div>
</template>
