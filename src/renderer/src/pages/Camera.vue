<template>
  <video autoplay ref="player" class="video-checker bg-black"></video>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref } from 'vue';

const player: Ref<HTMLVideoElement | null> = ref(null);
const videoStream: Ref<MediaStream | null> = ref(null);

onMounted(() => {
  if (!navigator.mediaDevices.getUserMedia) return alert('No camera found.');

  requestVideoPermission();
});

function requestVideoPermission() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false
    })
    .then(playback)
    .catch((e) => console.log(e));
}

function playback(stream: MediaStream) {
  if (!player.value) return;

  player.value.srcObject = stream;
}
</script>
