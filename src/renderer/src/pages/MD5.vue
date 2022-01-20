<template>
  <section class="p-10">
    <h1 class="text-left">MD5 Encrypter</h1>
    <div class="form-control pt-2">
      <label class="label"> String to Hash </label>
      <input type="text" class="input input-bordered text-center" autofocus v-model="inputText" />
    </div>

    <div class="form-control pt-5">
      <label class="label"> <label class="label"> Hashed String </label> </label>

      <copy :text-to-copy="encryptedText">
        <input
          class="w-full input input-primary input-bordered text-center"
          type="text"
          readonly
          v-model="encryptedText"
        />
      </copy>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Md5 } from 'ts-md5/dist/md5';
import Copy from '../components/Copy.vue';

const inputText = ref('');
const encryptedText = computed<String>(() =>
  inputText.value.length ? Md5.hashStr(inputText.value) : ''
);
</script>
