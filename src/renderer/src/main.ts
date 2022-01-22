import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { store, key } from './store';

import './index.css';

Date.prototype.addHours = function (hours = 1) {
  if (hours <= 0) return this;
  this.setTime(this.getTime() + hours * 60 * 60 * 1000);
  return this;
};

Date.prototype.addMinutes = function (minutes = 1) {
  if (minutes <= 0) return this;
  this.setTime(this.getTime() + minutes * 60 * 1000);
  return this;
};

Date.prototype.addSeconds = function (seconds = 1) {
  if (seconds <= 0) return this;
  this.setTime(this.getTime() + seconds * 1000);
  return this;
};

createApp(App).use(router).use(store, key).mount('#app').$nextTick(window.removeLoading);
