<template>
  <section class="p-10">
    <h1 class="text-left">Alarm</h1>
    <div class="text-left pt-5 font-bold">
      <div class="flex justify-between">
        <p class="text-left self-center">Current time: {{ currentTime }}</p>
        <div class="dropdown dropdown-end">
          <button tabindex="0" class="btn text-secondary btn-block btn-sm lowercase btn-ghost">
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
          <select
            v-model="store.state.alarm.selected_hours"
            ref="selector"
            class="select select-bordered w-full max-w-xs"
          >
            <option v-for="hour in numberRangeFilled(24)" :value="hour" :key="hour">
              {{ hour }}
            </option>
          </select>
        </div>
        <div class="form-control flex-1 ml-2">
          <label class="label">
            <span class="label-text">Minute</span>
          </label>
          <select
            v-model="store.state.alarm.selected_minutes"
            ref="selector"
            class="select select-bordered w-full max-w-xs"
          >
            <option v-for="minute in numberRangeFilled(60)" :value="minute" :key="minute">
              {{ minute }}
            </option>
          </select>
        </div>
        <div class="form-control flex-1 ml-2">
          <label class="label">
            <span class="label-text">Second</span>
          </label>
          <select
            v-model="store.state.alarm.selected_seconds"
            ref="selector"
            class="select select-bordered w-full max-w-xs"
          >
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
import { ref, Ref, onMounted, computed } from 'vue';

import sirenMP3 from '../assets/siren.mp3';
import nukeMP3 from '../assets/nuke.mp3';

import { useStore } from 'vuex';
import { key } from '../store';

const store = useStore(key);
const tune = ref(store.state.alarm.alarm_tone);

const hours = computed(() => store.state.alarm.selected_hours);
const minutes = computed(() => store.state.alarm.selected_minutes);
const seconds = computed(() => store.state.alarm.selected_seconds);

const isAlarmSet = computed(() => store.getters.isAlarmSet);
const alarmSetAt = computed(() => store.getters.getParsedAlarmTime);

const currentTime = ref(new Date().toLocaleTimeString());
const alarmNotice = ref('');
const audioPlayer = ref(null);

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

  store.commit('setAlarm', {
    hours: hours.value,
    minutes: minutes.value,
    seconds: seconds.value,
    tone: tune.value
  });

  alarmNotice.value = `Alarm set for ${alarmSetAt.value}`;
}

function unsetAlarm() {
  store.commit('clearAlarm');
  alarmNotice.value = '';

  if (audioPlayer.value) {
    // @ts-ignore
    audioPlayer.value.pause();
    audioPlayer.value = null;
  }
}

function selectPreset(preset: string = ''): void {
  if (preset.length == 0) return;

  store.dispatch('setAlarmFromPreset', { preset });
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
