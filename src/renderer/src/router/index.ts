import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import MD5 from '../pages/MD5.vue';
import Camera from '../pages/Camera.vue';
import Mic from '../pages/Mic.vue';
import Timer from '../pages/Timer.vue';

const routes = [

    {
        path: '/',
        name: 'Home Page / Settings',
        component: Home
    },

    {
        path: '/md5',
        name: 'MD5 Encrypter',
        component: MD5
    },

    {
        path: '/camera',
        name: 'Camera Check',
        component: Camera
    },

    {
        path: '/mic',
        name: 'Microphone Check',
        component: Mic
    },

    {
        path: '/timer',
        name: 'Timer',
        component: Timer
    }

];

const url = `http://127.0.0.1:8000`

const router = createRouter({
    history: createWebHashHistory(url),
    routes
});

export default router;