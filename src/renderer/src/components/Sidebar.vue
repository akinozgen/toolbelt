<template>
    <ul>
        <li>
            <router-link :class="currentRoute == '/' ? 'active' : ''" to="/">Home</router-link>
        </li>
        <li>
            <router-link :class="currentRoute == '/timer' ? 'active' : ''" to="/timer">Timer</router-link>
        </li>
        <li>
            <router-link :class="currentRoute == '/md5' ? 'active' : ''" to="/md5">MD5</router-link>
        </li>
        <li>
            <router-link :class="currentRoute == '/mdpad' ? 'active' : ''" to="/mdpad">MDPad</router-link>
        </li>
        <li>
            <router-link :class="currentRoute == '/camera' ? 'active' : ''" to="/camera">Camera Check</router-link>
        </li>
        <li>
            <router-link :class="currentRoute == '/mic' ? 'active' : ''" to="/mic">Mic. Check</router-link>
        </li>
    </ul>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentRoute = computed(() => {
    console.log(router.currentRoute.value);
    
    return router.currentRoute.value.fullPath;
});
</script>