<template>
  <div class="page-full-height-scrollable">
    <h1 class="page-title left">Steam Apps</h1>
    <div class="game-grid">
      <div class="game" v-for="game in gameLibrary" :key="game.steam_appid">
        <a :href="`steam://run/${game.steam_appid}`">
          <h3 class="game-title">{{ game.name }}</h3>
          <img :src="game.header_image" :alt="game.name" class="game-poster" />
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

const gameLibrary = ref<any[]>([]);

onMounted(async () => {
  const library = await window.steamLibrary();
  const apps: any[] = [];

  library.libraryfolders.forEach((lf) => {
    lf.apps?.forEach((app) => apps.push(app));
  });

  gameLibrary.value = apps;
});
</script>
