<template>
  <section class="p-10">
    <h1 class="text-left">Alarm</h1>
    <div class="text-left pt-5 font-bold">
      <div class="flex justify-between">
        <p class="text-left self-center">Current time: {{ currentTime }}</p>
        <div class="dropdown dropdown-end">
          <button tabindex="0" class="btn btn-error btn-block btn-sm btn-outline lowercase">
            Presets
          </button>
          <ul tabindex="0" class="shadow-lg menu dropdown-content bg-base-100 rounded-box w-52">
            <li @click="selectPreset('now')"><a>Now</a></li>
            <li @click="selectPreset('5_mins')"><a>5 Minutes Later</a></li>
            <li @click="selectPreset('15_mins')"><a>15 Minutes Later</a></li>
            <li @click="selectPreset('1_hour')"><a>1 Hour Later</a></li>
            <li @click="selectPreset('2_hours')"><a>2 Hours Later</a></li>
            <li @click="selectPreset('5_hours')"><a>5 Hours Later</a></li>
            <li @click="selectPreset('8_hours')"><a>8 Hours Later</a></li>
            <li @click="selectPreset('10_hours')"><a>10 Hours Later</a></li>
            <li @click="selectPreset('12_hours')"><a>12 Hours Later</a></li>
          </ul>
        </div>
      </div>

      <div class="pt-5 flex w-full justify-between align-baseline">
        <div class="form-control flex-1 ml-2">
          <label class="label">
            <span class="label-text">Hour</span>
          </label>
          <select v-model="hours" ref="selector" class="select select-bordered w-full max-w-xs">
            <option v-for="hour in numberRangeFilled(24)" :value="hour" :key="hour">
              {{ hour }}
            </option>
          </select>
        </div>
        <div class="form-control flex-1 ml-2">
          <label class="label">
            <span class="label-text">Minute</span>
          </label>
          <select v-model="minutes" ref="selector" class="select select-bordered w-full max-w-xs">
            <option v-for="minute in numberRangeFilled(60)" :value="minute" :key="minute">
              {{ minute }}
            </option>
          </select>
        </div>
        <div class="form-control flex-1 ml-2">
          <label class="label">
            <span class="label-text">Second</span>
          </label>
          <select v-model="seconds" ref="selector" class="select select-bordered w-full max-w-xs">
            <option v-for="second in numberRangeFilled(60)" :value="second" :key="second">
              {{ second }}
            </option>
          </select>
        </div>
      </div>

      <div class="pl-2 pt-5">
        <button
          @click="setAlarm()"
          :class="isAlarmSet ? 'active btn-error' : 'btn-primary'"
          class="btn btn-block"
        >
          {{ isAlarmSet ? 'Cancel Alarm' : 'Set Alarm' }}
        </button>
      </div>

      <h3 class="pl-2 pt-5">Select Alarm Tone</h3>
      <div class="flex w-full pl-2 pt-2 gap-5">
        <label class="btn btn-secondary btn-block btn-circle flex-1 pr-2">
          <input
            @click="tune = 'siren'"
            type="radio"
            name="tune"
            :model="tune"
            value="siren"
            checked
          />
          <span class="pl-2">Siren</span>
        </label>
        <label class="btn btn-secondary btn-block btn-circle flex-1 pl-2">
          <input @click="tune = 'nuke'" type="radio" name="tune" :model="tune" value="nuke" />
          <span class="pl-2">Nuke</span>
        </label>
      </div>

      <button
        @click="unsetAlarm()"
        v-if="isAlarmSet"
        :disabled="!isAlarmSet"
        class="stop-alarm btn btn-error btn-block btn-circle flex-1 m-2 mt-10"
      >
        Stop Alarm
      </button>
      <p class="notice text-center text-xl">{{ alarmNotice }}</p>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, Ref, onMounted } from 'vue';

import sirenMP3 from '../assets/siren.mp3';
import nukeMP3 from '../assets/nuke.mp3';

const tune = ref('siren');
const currentDateTime = new Date();
const currentTime = ref(currentDateTime.toLocaleTimeString());
const alarmSetAt = ref('00:00:00');
const isAlarmSet = ref(false);
const alarmNotice = ref('');
const audioPlayer = ref(null);

const hours = ref('00');
const minutes = ref('00');
const seconds = ref('00');

setInterval(() => {
  currentTime.value = new Date().toLocaleTimeString();

  if (isAlarmSet.value !== true) return;

  if (alarmSetAt.value == currentTime.value) {
    playTune();
  }
}, 1000);

function numberRangeFilled(length: Number): Array<String> {
  return [...Array(length).keys()].map((i) => i.toString()).map((i) => i.padStart(2, '0'));
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
  alarmSetAt.value = '00:00:00';
  isAlarmSet.value = false;
  alarmNotice.value = '';

  if (audioPlayer.value) {
    // @ts-ignore
    audioPlayer.value.pause();
    audioPlayer.value = null;
  }
}

function selectPreset(preset: string = ''): void {
  if (preset.length == 0) return;
  let now = new Date();

  switch (preset) {
    case '5_mins':
      now = now.addMinutes(5);
      break;
    case '15_mins':
      now = now.addMinutes(15);
      break;
    case '1_hour':
      now = now.addHours(1);
      break;
    case '2_hours':
      now = now.addHours(2);
      break;
    case '5_hours':
      now = now.addHours(5);
      break;
    case '8_hours':
      now = now.addHours(8);
      break;
    case '10_hours':
      now = now.addHours(8);
      break;
    case '12_hours':
      now = now.addHours(12);
      break;
  }

  let parts = now.toLocaleTimeString().split(':');
  hours.value = parts[0];
  minutes.value = parts[1];
  seconds.value = parts[2];
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
  // @ts-ignore
  audioPlayer.value = new Audio(tuneToPlay);
  // @ts-ignore
  audioPlayer.value.play();
}
</script>
