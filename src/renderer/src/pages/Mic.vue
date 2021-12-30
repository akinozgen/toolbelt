<template>
    <div class="audio-player">
        <button class="play-pause" @click="playPause()">
            <img :src="currentIcon" alt="Play / Pause" tabindex="1">
            <audio class="player" ref="player" />
        </button>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref } from "vue";

import playIcon from '../assets/play.png';
import pauseIcon from '../assets/pause.png';

const player:Ref<HTMLAudioElement | null> = ref(null);
const currentIcon = ref(playIcon);
const isPlaying = ref(false);

function playPause() {
    if (isPlaying.value) return pause();
    play();
}

function play() {
    isPlaying.value = true;
    currentIcon.value = pauseIcon;

    player.value?.play();
}

function pause() {    
    isPlaying.value = false;
    currentIcon.value = playIcon;

    player.value?.pause();
}

function requestAudioPermission() {
    navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
    }).then((stream:MediaStream) => {
        if (!player.value) return; 

        player.value.srcObject = stream;
    })
    .catch(e => console.log(e));
}

onMounted(() => {
    if (!navigator.mediaDevices.getUserMedia) return alert('No camera found.');

    requestAudioPermission();
});
</script>