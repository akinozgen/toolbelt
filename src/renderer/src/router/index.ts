import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import MD5 from '../pages/MD5.vue';
import Camera from '../pages/Camera.vue';
import Mic from '../pages/Mic.vue';
import Alarm from '../pages/Alarm.vue';
import MDPad from '../pages/MDPad.vue';
import Android from '../pages/Android.vue';
import GameLauncher from '../pages/GameLauncher.vue';
import SSHLaunch from '../pages/SSHLaunch.vue';

import settingsIcon from '../assets/001-setting.png';
import alarmIcon from '../assets/002-alarm-clock.png';
import md5Icon from '../assets/003-shield.png';
import mdIcon from '../assets/004-asterisk.png';
import avdIcon from '../assets/005-android.png';
import sshIcon from '../assets/006-terminal.png';
import gameIcon from '../assets/007-steam.png';
import camIcon from '../assets/008-webcam.png';
import micIcon from '../assets/009-microphone-black-shape.png';

const routes = [
  {
    path: '/',
    name: 'Home Page',
    component: Home,
    props: {
      icon: settingsIcon
    }
  },

  {
    path: '/alarm',
    name: 'Alarm',
    component: Alarm,
    props: {
      icon: alarmIcon
    }
  },

  {
    path: '/md5',
    name: 'MD5 Encrypter',
    component: MD5,
    props: {
      icon: md5Icon
    }
  },

  {
    path: '/mdpad',
    name: 'MD Notepad',
    component: MDPad,
    props: {
      icon: mdIcon
    }
  },

  {
    path: '/android',
    name: 'AVDs',
    component: Android,
    props: {
      icon: avdIcon
    }
  },

  {
    path: '/ssh_launch',
    name: 'SSH Launcher',
    component: SSHLaunch,
    props: {
      icon: sshIcon
    }
  },

  {
    path: '/game_launcher',
    name: 'Game Launcher',
    component: GameLauncher,
    props: {
      divider: true,
      icon: gameIcon
    }
  },

  {
    path: '/camera',
    name: 'Camera Check',
    component: Camera,
    props: {
      icon: camIcon
    }
  },

  {
    path: '/mic',
    name: 'Mic. Check',
    component: Mic,
    props: {
      icon: micIcon
    }
  }
];

const url = `http://127.0.0.1:8000`;

const router = createRouter({
  history: createWebHashHistory(url),
  routes
});

export default router;
