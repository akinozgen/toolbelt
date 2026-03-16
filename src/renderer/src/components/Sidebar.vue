<script lang="ts" setup>
import { computed, type Component } from 'vue';
import { useRouter } from 'vue-router';
import {
  Home, AlarmClock, Hash, NotebookPen, Settings,
  Braces, Binary, SendHorizontal, Diff, Regex
} from 'lucide-vue-next';

const iconMap: Record<string, Component> = {
  '/':         Home,
  '/alarm':    AlarmClock,
  '/md5':      Hash,
  '/mdpad':    NotebookPen,
  '/formatter': Braces,
  '/encoder':   Binary,
  '/requests':  SendHorizontal,
  '/diff':      Diff,
  '/regex':     Regex,
  '/settings':  Settings,
};

const router = useRouter();
const currentRoute = computed(() => router.currentRoute.value.fullPath);
</script>

<template>
  <nav class="flex flex-col gap-0.5 p-2 flex-1">
    <template v-for="route in router.getRoutes()" :key="route.path">
      <hr v-if="route.props.default?.divider" class="divider" />
      <router-link
        :to="route.path"
        class="nav-link"
        :class="{ active: currentRoute === route.path }"
      >
        <component :is="iconMap[route.path]" :size="16" class="nav-icon" />
        <span>{{ route.name }}</span>
      </router-link>
    </template>
  </nav>
</template>
