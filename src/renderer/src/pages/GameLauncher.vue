<template>
  <h1 class="page-title left">Steam Apps</h1>
  <div
    class="p-10 grid grid-cols-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-5"
  >
    <GameCard
      :key="game.steam_appid"
      :name="game.name"
      :steam_appid="game.steam_appid"
      :header_image="game.header_image"
      v-for="game in gameLibrary"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import GameCard from '../components/GameCard.vue';

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
