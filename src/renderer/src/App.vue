<script lang="ts" setup>
import {onMounted, ref} from 'vue';
import Sidebar from './components/Sidebar.vue';
</script>

<template>
    <div id="titlebar"></div>
    <div class="container">
        <div class="sidebar">
            <sidebar />
        </div>
        <div class="content">
            <router-view />
        </div>
    </div>
</template>

<style>
</style>