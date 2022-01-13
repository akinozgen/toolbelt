<template>
  <section>
    <h1 class="page-title">Settings</h1>
    <div class="settings selectable">
      <label>
        <div class="label-text">Start page</div>
        <div class="select">
          <select
            v-model="startPage"
            @change="changeStartPage"
            ref="selector"
          ></select>
        </div>
      </label>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { computed, ref, onMounted } from 'vue';
import Choices, { Choice } from 'choices.js';
import 'choices.js/public/assets/styles/choices.min.css';

const selector = ref<HTMLSelectElement>();
const router = useRouter();
const routes = computed(() => router.getRoutes());
const startPage = ref(localStorage.getItem('startPage') || '/');

function changeStartPage(e: any) {
  startPage.value = e.target.value;
  localStorage.setItem('startPage', startPage.value);
}

onMounted(() => {
  new Choices(selector.value, {
    choices: router.getRoutes().map<Choice>(
      (route): Choice => ({
        value: route.path,
        label: route.name?.toString() || '',
        selected: route.path === startPage.value
      })
    )
  });

  selector.value?.addEventListener('change', changeStartPage);
});
</script>
