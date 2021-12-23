<script lang="ts" setup>
import {onMounted, ref} from 'vue';

const clock = ref("");

onMounted(() => {
    setInterval(() => {
        clock.value = new Date().toLocaleTimeString();
    }, 1000);
});
</script>

<template>
    <div id="titlebar"></div>
    <div id="clock">{{ clock }}</div>
    <div id="content">
        <div class="left">
            <h3>Set Alarm</h3>
        </div>
        <div class="right">
            <h3>Set Postpone</h3>
        </div>
    </div>
</template>

<style>
</style>