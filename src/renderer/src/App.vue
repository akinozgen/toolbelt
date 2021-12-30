<script lang="ts" setup>
import {onMounted, ref} from 'vue';
import Sidebar from './components/Sidebar.vue';

const sidebarClass = ref('');
function sidebarClick() {
    if (sidebarClass.value === 'opened') sidebarClass.value = '';
    else sidebarClass.value = 'opened';
}
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
