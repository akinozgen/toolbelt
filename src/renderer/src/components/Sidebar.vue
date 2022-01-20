<template>
  <ul class="menu w-64 menu-compact lg:menu-normal">
    <li v-for="route in router.getRoutes()" :key="route.path">
      <router-link
        :class="{
          active: currentRoute == route.path
        }"
        :to="route.path"
      >
        {{ route.name }}
        <hr v-if="route.props.default?.divider == true" />
      </router-link>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Router, useRouter } from 'vue-router';

const router: Router = useRouter();
const currentRoute = computed(() => {
  return router.currentRoute.value.fullPath;
});
</script>
