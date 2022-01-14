import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import MD5 from '../pages/MD5.vue';
import Camera from '../pages/Camera.vue';
import Mic from '../pages/Mic.vue';
import Timer from '../pages/Timer.vue';
import MDPad from '../pages/MDPad.vue';
import GameLauncher from '../pages/GameLauncher.vue';

const routes = [
  {
    path: '/',
    name: 'Home Page',
    component: Home
  },

  {
    path: '/timer',
    name: 'Alarm',
    component: Timer
  },

  {
    path: '/md5',
    name: 'MD5 Encrypter',
    component: MD5
  },

  {
    path: '/mdpad',
    name: 'MD Notepad',
    component: MDPad
  },

  {
    path: '/game_launcher',
    name: 'Game Launcher',
    component: GameLauncher,
    props: {
      divider: true
    }
  },

  {
    path: '/camera',
    name: 'Camera Check',
    component: Camera
  },

  {
    path: '/mic',
    name: 'Mic. Check',
    component: Mic
  }
];

const url = `http://127.0.0.1:8000`;

const router = createRouter({
  history: createWebHashHistory(url),
  routes
});

export default router;
