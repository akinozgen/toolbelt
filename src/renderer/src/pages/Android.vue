<template>
  <h1 class="page-title left">Android Virtual Devices</h1>
  <div class="page-full-height-scrollable">
    <section class="avd-list">
      <div class="avd-list-item" v-for="avd in avds" :key="avd.name">
        <div class="left">
          <img
            v-if="avd.screenshotPath"
            :src="`data:image/png;base64,${avd.screenshotPath.replace(/\\/g, '/')}`"
            :alt="avd.name"
          />
          <img :src="androidIcon" :alt="avd.name" v-else />
        </div>
        <div class="right">
          <h3>{{ avd.name }}</h3>
          <p>{{ avd.target }}</p>

          <button @click="avdRun(avd.name)">Run</button>
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
