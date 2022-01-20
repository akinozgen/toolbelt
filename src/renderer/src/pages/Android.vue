<template>
  <div class="p-10">
    <h1 class="text-left pb-5">Android Virtual Devices</h1>
    <section class="grid grid-cols-2 gap-4">
      <div class="flex text-left" v-for="avd in avds" :key="avd.name">
        <div class="flex-1">
          <img
            v-if="avd.screenshotPath"
            class="rounded-lg"
            :src="`data:image/png;base64,${avd.screenshotPath.replace(/\\/g, '/')}`"
            :alt="avd.name"
          />
          <img :src="androidIcon" :alt="avd.name" v-else />
        </div>
        <div class="flex-1 ml-2 flex flex-col h-full">
          <h1>{{ avd.name }}</h1>
          <p>{{ avd.target }}</p>

          <div class="flex flex-col">
            <button @click="avdRun(avd.name)" class="btn btn-primary btn-block">Run</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import androidIcon from '../assets/android.png';

const avds = computed(() => window.androidVirtualDevices());

function avdRun(avdName: string) {
  window.ipcRenderer.send('start_avd', avdName);
}
</script>
