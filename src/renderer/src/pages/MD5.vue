<template>
    <section class="tool">
        <h1 class="page-title">
            MD5 Encrypter
        </h1>
        <label class="md5-label">
            String to Hash <br>
            <input type="text" class="input-text md5-text-plain" autofocus v-model="inputText">
        </label>
        <label class="md5-label">
            Hashed String <br>
            <copy :text-to-copy="encryptedText">
                <input type="text" readonly class="input-readonly md5-text-encrypted" v-model="encryptedText">
            </copy>
        </label>
    </section>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Md5 } from 'ts-md5/dist/md5';
import Copy from '../components/Copy.vue';

const inputText = ref('');
const encryptedText = computed<String>(() => inputText.value.length ? Md5.hashStr(inputText.value) : '');
</script>