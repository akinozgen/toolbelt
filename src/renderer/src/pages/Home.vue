<template>
  <section class="p-10">
    <h1 class="text-left">Home Page / App Settings</h1>
    <div class="pt-5">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Theme</span>
        </label>
        <select
          @change="changeTheme"
          v-model="theme"
          class="select select-bordered w-full max-w-xs"
        >
          <option :value="key" v-for="(name, key) in availableThemes" :key="key">
            {{ name }}
          </option>
        </select>
      </div>
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
import { key } from '../store';
import { useStore } from 'vuex';

const selector = ref<HTMLSelectElement>();
const router = useRouter();
const store = useStore(key);
const routes = computed(() => router.getRoutes());

const availableThemes = {
  dark: 'Dark',
  cupcake: 'Cupcake',
  bumblebee: 'Bumblebee',
  emerald: 'Emerald',
  corporate: 'Corporate',
  synthwave: 'Synthwave',
  retro: 'Retro',
  cyberpunk: 'Cyberpunk',
  valentine: 'Valentine',
  halloween: 'Halloween',
  garden: 'Garden',
  forest: 'Forest',
  aqua: 'Aqua',
  lofi: 'Lofi',
  pastel: 'Pastel',
  fantasy: 'Fantasy',
  wireframe: 'Wireframe',
  black: 'Black',
  luxury: 'Luxury',
  dracula: 'Dracula',
  cmyk: 'Cmyk'
};

// if we have select with v-model this values don't need to be computed
const startPage = store.getters.getStartPage;
const theme = store.getters.getTheme;
const androidHome = computed(() => store.getters.getAndroidSdkHome);
const avdHome = computed(() => store.getters.getAVDHome);
const steamDir = computed(() => store.getters.getSteamDir);

function changeStartPage(e: any): void {
  store.commit('setStartPage', {
    start_page: e.target.value
  });
}

function changeTheme(e: any) {
  store.dispatch('changeTheme', {
    theme: e.target.value
  });
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
  store.commit('setAndroidSdkHome', {
    android_sdk_home: params[0][0]
  });
});

window.ipcRenderer.on('dir_selected_avd_home', function (event, ...params) {
  store.commit('setAVDHome', {
    avd_home: params[0][0]
  });
});

window.ipcRenderer.on('dir_selected_steam', function (event, ...params) {
  store.commit('setSteamDir', {
    steam_dir: params[0][0]
  });
});
</script>
