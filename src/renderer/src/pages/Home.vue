<template>
    <section>
      <h1 class="page-title">
        Settings
      </h1>
      <div class="settings">
        <label>
          <div class="label-text">Start page</div>
          <div class="input">
            <select v-model="startPage" @change="changeStartPage">
              <option v-for="(route, i) in routes" :selected="startPage == route.path" :value="route.path" :key="i">{{ route.name }}</option>
            </select>
          </div>
        </label>
      </div>
    </section>
</template>

<script lang="ts" setup>
  import { useRouter } from 'vue-router';
  import { computed, ref } from 'vue';

  const router = useRouter();
  const routes = computed(() => router.getRoutes());
  const startPage = ref(localStorage.getItem('startPage') || '/');

  function changeStartPage(e) {
    startPage.value = e.target.value;
    localStorage.setItem('startPage', startPage.value);
  }
</script>