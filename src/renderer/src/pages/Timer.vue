<template>
  <div class="timer">
    <div class="clock">
      {{ currentTime }}
    </div>
    <div class="selects">
      <div class="select">
        <select multiple max="1" v-model="hours">
          <option v-for="hour in numberRangeFilled(25)" :value="hour">{{ hour }}</option>
        </select>
      </div>
      <div class="select">
        <select multiple max="1" v-model="minutes">
          <option v-for="minute in numberRangeFilled(61)" :value="minute">{{ minute }}</option>
        </select>
      </div>
      <div class="select">
        <select multiple max="1" v-model="seconds">
          <option v-for="second in numberRangeFilled(61)" :value="second">{{ second }}</option>
        </select>
      </div>
    </div>
    <div class="button">
      <button @click="setAlarm()" :class="isAlarmSet ? 'active' : ''">
        {{ isAlarmSet ? 'Cancel Alarm' : 'Set Alarm' }}
      </button>
    </div>
    <div class="radios">
      <label>
        <input @click="tune = 'siren'" type="radio" name="tune" :model="tune" value="siren" checked />
        Siren
      </label>
      <label>
        <input @click="tune = 'nuke'" type="radio" name="tune" :model="tune" value="nuke" />
        Nuke
      </label>
    </div>
    <div class="button" v-if="isAlarmSet">
      <button @click="unsetAlarm()" :disabled="!isAlarmSet" class="stop-alarm">
        Stop
      </button>
    </div>
    <p class="notice">{{ alarmNotice }}</p>
  </div>
</template>

<script lang="ts" setup>
  import { ref, Ref, onMounted } from 'vue';

  import sirenMP3 from '../assets/siren.mp3';
  import nukeMP3 from '../assets/nuke.mp3';

  const tune = ref('siren');
  const currentDateTime = new Date();
  const currentTime = ref(currentDateTime.toLocaleTimeString());
  const alarmSetAt = ref("00:00:00");
  const isAlarmSet = ref(false);
  const alarmNotice = ref("");
  const audioPlayer = ref(null);

  const hours = ref(0);
  const minutes = ref(0);
  const seconds = ref(0);

  setInterval(() => {
    currentTime.value = (new Date()).toLocaleTimeString();

    if (isAlarmSet.value !== true) return;

    if (alarmSetAt.value == currentTime.value) {
      playTune();
    }
  }, 1000);

  function numberRangeFilled(length: Number):Array<String> {
    return [...Array(length - 1).keys()].map(i => i.toString()).map(i => i.padStart(2, '0'));
  }

  function setAlarm() {
    if (isAlarmSet.value) {
      return unsetAlarm();
    }
    alarmSetAt.value = `${hours.value}:${minutes.value}:${seconds.value}`;
    isAlarmSet.value = true;
    alarmNotice.value = `Alarm set for ${alarmSetAt.value}`;
    console.log(tune);
  }

  function unsetAlarm() {
    alarmSetAt.value = "00:00:00";
    isAlarmSet.value = false;
    alarmNotice.value = "";

    if (audioPlayer.value) {
      audioPlayer.value.pause();
      audioPlayer.value = null;
    }
  }

  async function playTune() {
    let tuneToPlay = null;

    switch (tune.value) {
      case 'siren':
        tuneToPlay = sirenMP3;
        break;
      case 'nuke':
        tuneToPlay = nukeMP3;
        break;
    
      default:
        tuneToPlay = sirenMP3;
        break;
    }
    
    audioPlayer.value = new Audio(tuneToPlay);
    audioPlayer.value.play();
  }
  
</script>
