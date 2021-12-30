<script lang="ts" setup>
import {onMounted, ref} from 'vue';
import Sidebar from './components/Sidebar.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const sidebarClass = ref('');
function sidebarClick() {
    if (sidebarClass.value === 'opened') sidebarClass.value = '';
    else sidebarClass.value = 'opened';
}

onMounted(() => {
  let startPage = localStorage.getItem('startPage') || '/';
  if (startPage != '/') {
    router.push(startPage);
  }
});
</script>

<template>
    <div id="titlebar"></div>
    <div class="container">
        <div class="sidebar" @click="sidebarClick()" :class="sidebarClass">
            <sidebar />
        </div>
        <div class="content">
            <router-view />
        </div>
    </div>
</template>
