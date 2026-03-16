<template>
  <div class="alarm-page">
    <div class="alarm-content">

      <!-- Live clock -->
      <div class="alarm-clock-wrap">
        <div class="alarm-clock">{{ currentTime }}</div>
        <div class="alarm-clock-sub">Current Time</div>
      </div>

      <!-- Presets -->
      <div class="alarm-block">
        <span class="alarm-label">Quick Presets</span>
        <div class="alarm-presets">
          <button class="preset-btn" @click="selectPreset('5_mins')">+5 min</button>
          <button class="preset-btn" @click="selectPreset('15_mins')">+15 min</button>
          <button class="preset-btn" @click="selectPreset('1_hour')">+1 h</button>
          <button class="preset-btn" @click="selectPreset('2_hours')">+2 h</button>
          <button class="preset-btn" @click="selectPreset('8_hours')">+8 h</button>
          <button class="preset-btn" @click="selectPreset('12_hours')">+12 h</button>
        </div>
      </div>

      <!-- Time picker -->
      <div class="alarm-block">
        <span class="alarm-label">Set Time</span>
        <div class="alarm-time-row">
          <div class="time-unit">
            <span class="time-unit-label">Hour</span>
            <div class="spinner-wrap">
              <div class="spinner-wheel" ref="hourRef" @scroll="onScroll('hour')" @click="onClick('hour', $event)">
                <div class="spinner-spacer" :style="{ height: spacerHeight + 'px' }"></div>
                <div v-for="h in hours" :key="h" class="spinner-item">{{ pad2(h) }}</div>
                <div class="spinner-spacer" :style="{ height: spacerHeight + 'px' }"></div>
              </div>
              <div class="spinner-highlight"></div>
            </div>
          </div>
          <span class="time-colon">:</span>
          <div class="time-unit">
            <span class="time-unit-label">Minute</span>
            <div class="spinner-wrap">
              <div class="spinner-wheel" ref="minuteRef" @scroll="onScroll('minute')" @click="onClick('minute', $event)">
                <div class="spinner-spacer" :style="{ height: spacerHeight + 'px' }"></div>
                <div v-for="m in minutes" :key="m" class="spinner-item">{{ pad2(m) }}</div>
                <div class="spinner-spacer" :style="{ height: spacerHeight + 'px' }"></div>
              </div>
              <div class="spinner-highlight"></div>
            </div>
          </div>
          <span class="time-colon">:</span>
          <div class="time-unit">
            <span class="time-unit-label">Second</span>
            <div class="spinner-wrap">
              <div class="spinner-wheel" ref="secondRef" @scroll="onScroll('second')" @click="onClick('second', $event)">
                <div class="spinner-spacer" :style="{ height: spacerHeight + 'px' }"></div>
                <div v-for="s in seconds" :key="s" class="spinner-item">{{ pad2(s) }}</div>
                <div class="spinner-spacer" :style="{ height: spacerHeight + 'px' }"></div>
              </div>
              <div class="spinner-highlight"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tone -->
      <div class="alarm-block">
        <span class="alarm-label">Tone</span>
        <div class="flex gap-3">
          <label class="radio-btn">
            <input @click="tune = 'siren'" type="radio" name="tune" value="siren" :checked="tune === 'siren'" />
            Siren
          </label>
          <label class="radio-btn">
            <input @click="tune = 'nuke'" type="radio" name="tune" value="nuke" :checked="tune === 'nuke'" />
            Nuke
          </label>
        </div>
      </div>

      <!-- Action -->
      <button
        class="alarm-set-btn btn"
        :class="isAlarmSet ? 'btn-danger' : 'btn-primary'"
        @click="setAlarm()"
      >
        <AlarmClock :size="15" />
        {{ isAlarmSet ? 'Cancel Alarm' : 'Set Alarm' }}
      </button>

      <!-- Status -->
      <div v-if="isAlarmSet" class="alarm-status">
        <AlarmClock :size="13" />
        <span>Alarm set for <strong>{{ alarmSetAt }}</strong></span>
        <button class="alarm-stop-btn" @click="unsetAlarm()">✕ Stop</button>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { AlarmClock } from 'lucide-vue-next';
import sirenMP3 from '../assets/siren.mp3';
import nukeMP3 from '../assets/nuke.mp3';
import { useStore } from 'vuex';
import { key } from '../store';

const store = useStore(key);
const tune = ref(store.state.alarm.alarm_tone);

const isAlarmSet = computed(() => store.getters.isAlarmSet);
const alarmSetAt = computed(() => store.getters.getParsedAlarmTime);
const currentTime = ref(new Date().toLocaleTimeString());
const audioPlayer = ref<HTMLAudioElement | null>(null);

const selectedHour = computed({
  get: () => parseInt(store.state.alarm.selected_hours) || 0,
  set: (v: number) => { store.state.alarm.selected_hours = String(Math.min(23, Math.max(0, v || 0))).padStart(2, '0'); }
});
const selectedMinute = computed({
  get: () => parseInt(store.state.alarm.selected_minutes) || 0,
  set: (v: number) => { store.state.alarm.selected_minutes = String(Math.min(59, Math.max(0, v || 0))).padStart(2, '0'); }
});
const selectedSecond = computed({
  get: () => parseInt(store.state.alarm.selected_seconds) || 0,
  set: (v: number) => { store.state.alarm.selected_seconds = String(Math.min(59, Math.max(0, v || 0))).padStart(2, '0'); }
});

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);
const seconds = Array.from({ length: 60 }, (_, i) => i);

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

const hourRef = ref<HTMLDivElement | null>(null);
const minuteRef = ref<HTMLDivElement | null>(null);
const secondRef = ref<HTMLDivElement | null>(null);
const itemHeight = ref(32);
const spacerHeight = computed(() => itemHeight.value * 2);

function onScroll(type: 'hour' | 'minute' | 'second') {
  const el = type === 'hour' ? hourRef.value : type === 'minute' ? minuteRef.value : secondRef.value;
  if (!el) return;
  const idx = Math.round((el.scrollTop - spacerHeight.value) / itemHeight.value);
  if (type === 'hour') selectedHour.value = Math.min(23, Math.max(0, idx));
  if (type === 'minute') selectedMinute.value = Math.min(59, Math.max(0, idx));
  if (type === 'second') selectedSecond.value = Math.min(59, Math.max(0, idx));
}

function scrollToValue(type: 'hour' | 'minute' | 'second', value: number) {
  const el = type === 'hour' ? hourRef.value : type === 'minute' ? minuteRef.value : secondRef.value;
  if (!el) return;
  const top = spacerHeight.value + value * itemHeight.value;
  if (Math.abs(el.scrollTop - top) > itemHeight.value / 2) el.scrollTop = top;
}

function onClick(type: 'hour' | 'minute' | 'second', e: MouseEvent) {
  const el = type === 'hour' ? hourRef.value : type === 'minute' ? minuteRef.value : secondRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const center = rect.height / 2;
  const upper = center - itemHeight.value / 2;
  const lower = center + itemHeight.value / 2;
  let delta = 0;
  if (y < upper) delta = -1;
  else if (y > lower) delta = 1;
  const current = type === 'hour' ? selectedHour.value : type === 'minute' ? selectedMinute.value : selectedSecond.value;
  const max = type === 'hour' ? 23 : 59;
  const next = delta === 0
    ? Math.round((el.scrollTop + y - spacerHeight.value - itemHeight.value / 2) / itemHeight.value)
    : current + delta;
  const clamped = Math.min(max, Math.max(0, next));
  if (type === 'hour') selectedHour.value = clamped;
  if (type === 'minute') selectedMinute.value = clamped;
  if (type === 'second') selectedSecond.value = clamped;
}

const ticker = setInterval(() => {
  currentTime.value = new Date().toLocaleTimeString();
  if (isAlarmSet.value && alarmSetAt.value === currentTime.value) playTune();
}, 1000);

onBeforeUnmount(() => clearInterval(ticker));

onMounted(() => {
  const sample = hourRef.value?.querySelector('.spinner-item') as HTMLElement | null;
  if (sample) itemHeight.value = sample.getBoundingClientRect().height || 32;
  scrollToValue('hour', selectedHour.value);
  scrollToValue('minute', selectedMinute.value);
  scrollToValue('second', selectedSecond.value);
});

watch(selectedHour, (v) => scrollToValue('hour', v));
watch(selectedMinute, (v) => scrollToValue('minute', v));
watch(selectedSecond, (v) => scrollToValue('second', v));

function setAlarm() {
  if (isAlarmSet.value) return unsetAlarm();
  store.commit('setAlarm', {
    hours: store.state.alarm.selected_hours,
    minutes: store.state.alarm.selected_minutes,
    seconds: store.state.alarm.selected_seconds,
    tone: tune.value
  });
}

function unsetAlarm() {
  store.commit('clearAlarm');
  if (audioPlayer.value) { audioPlayer.value.pause(); audioPlayer.value = null; }
}

function selectPreset(preset: string) {
  store.dispatch('setAlarmFromPreset', { preset });
}

async function playTune() {
  const src = tune.value === 'nuke' ? nukeMP3 : sirenMP3;
  audioPlayer.value = new Audio(src);
  audioPlayer.value.play();
}
</script>

<style scoped>
/* Page fills the content area, adds a subtle dark veil over acrylic */
.alarm-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Single centered column — not a card, just organized content */
.alarm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
  max-width: 480px;
  padding: 48px 24px;
}

/* Clock */
.alarm-clock-wrap { text-align: center; }
.alarm-clock {
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 700;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  line-height: 1;
}
.alarm-clock-sub {
  margin-top: 8px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
}

/* Blocks */
.alarm-block {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.alarm-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
}

/* Preset pills */
.alarm-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.preset-btn {
  padding: 6px 18px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(20, 24, 38, 0.7);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  backdrop-filter: blur(4px);
}
.preset-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-subtle);
}

/* Time inputs */
.alarm-time-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}
.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.time-unit-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}
.spinner-wrap {
  position: relative;
  width: 96px;
  height: 120px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: rgba(20, 24, 38, 0.8);
  backdrop-filter: blur(4px);
  overflow: hidden;
}
.spinner-wheel {
  height: 100%;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  padding: 0 8px;
}
.spinner-item {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  font-size: 1.2rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}
.spinner-spacer { height: 0; }
.spinner-highlight {
  position: absolute;
  top: 44px;
  left: 6px;
  right: 6px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(99, 102, 241, 0.12);
  pointer-events: none;
}
.time-colon {
  font-size: 2rem;
  font-weight: 300;
  color: var(--text-muted);
  padding-bottom: 10px;
  line-height: 1;
  user-select: none;
}

/* Set button */
.alarm-set-btn {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  gap: 8px;
}

/* Status */
.alarm-status {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radius);
  background: var(--primary-subtle);
  border: 1px solid rgba(99, 102, 241, 0.25);
  color: var(--primary);
  font-size: 13px;
}
.alarm-status strong {
  font-variant-numeric: tabular-nums;
}
.alarm-stop-btn {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: 6px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  background: transparent;
  color: var(--primary);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.alarm-stop-btn:hover { background: rgba(99, 102, 241, 0.15); }
</style>
