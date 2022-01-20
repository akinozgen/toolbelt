<template>
  <section class="p-10">
    <h1 class="text-left">Home Page / App Settings</h1>
    <div class="pt-5">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Start page</span>
        </label>
        <select
          v-model="startPage"
          @change="changeStartPage"
          ref="selector"
          class="select select-bordered w-full max-w-xs"
        >
          <option :value="route.path" :key="route.path" v-for="route in router.getRoutes()">
            {{ route.name?.toString() }}
          </option>
        </select>
      </div>
    </div>
    <h1 class="text-left pt-10">Game Launcher Settings</h1>
    <div class="form-control">
      <label class="label">
        <span class="label-text">Steam Install Dir</span>
      </label>
      <div class="relative">
        <input
          type="text"
          placeholder="Search"
          readonly
          class="w-full pr-16 input input-primary input-bordered"
          v-model="steamDir"
        />
        <button
          class="absolute top-0 right-0 rounded-l-none btn btn-primary"
          @click="steamDirSelect"
        >
          Select
        </button>
      </div>
    </div>

    <h1 class="text-left pt-10">Android Virtual Devices</h1>
    <div class="pt-5">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Android SDK Home</span>
        </label>
        <div class="relative">
          <input
            type="text"
            placeholder="Search"
            readonly
            class="w-full pr-16 input input-primary input-bordered"
            v-model="androidHome"
          />
          <button
            class="absolute top-0 right-0 rounded-l-none btn btn-primary"
            @click="androidHomeSelect"
          >
            Select
          </button>
        </div>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">AVD Home</span>
        </label>
        <div class="relative">
          <input
            type="text"
            placeholder="Search"
            readonly
            class="w-full pr-16 input input-primary input-bordered"
            v-model="avdHome"
          />
          <button
            class="absolute top-0 right-0 rounded-l-none btn btn-primary"
            @click="avdHomeSelect"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { computed, ref, onMounted } from 'vue';

const selector = ref<HTMLSelectElement>();
const router = useRouter();
const routes = computed(() => router.getRoutes());
const startPage = ref(localStorage.getItem('startPage') || '/');
const androidHome = ref(localStorage.getItem('ANDROID_HOME') || '');
const avdHome = ref(localStorage.getItem('AVD_HOME') || '');
const steamDir = ref(localStorage.getItem('STEAM_DIR') || '');

function changeStartPage(e: any): void {
  startPage.value = e.target.value;
  localStorage.setItem('startPage', startPage.value);
}

function androidHomeSelect() {
  window.ipcRenderer.send('open_dir_select_android_home');
}

function avdHomeSelect() {
  window.ipcRenderer.send('open_dir_select_avd_home');
}

function steamDirSelect() {
  window.ipcRenderer.send('open_dir_select_steam_dir');
}

window.ipcRenderer.on('dir_selected_android_home', function (event, ...params) {
  localStorage.setItem('ANDROID_HOME', params[0]);
  androidHome.value = params[0];
});

window.ipcRenderer.on('dir_selected_avd_home', function (event, ...params) {
  localStorage.setItem('AVD_HOME', params[0]);
  avdHome.value = params[0];
});

window.ipcRenderer.on('dir_selected_steam', function (event, ...params) {
  localStorage.setItem('STEAM_DIR', params[0]);
  steamDir.value = params[0];
});
</script>
