import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import MD5 from '../pages/MD5.vue';
import Camera from '../pages/Camera.vue';
import Mic from '../pages/Mic.vue';
import Timer from '../pages/Timer.vue';

const routes = [

    {
        path: '/',
        name: 'Home',
        component: Home
    },

    {
        path: '/md5',
        name: 'MD5 Encrypter',
        component: MD5
    },

    {
        path: '/camera',
        name: 'CameraCheck',
        component: Camera
    },

    {
        path: '/mic',
        name: 'Mic. Check',
        component: Mic
    },

    {
        path: '/timer',
        name: 'Timer',
        component: Timer
    }

];

const pkg = await import('../../../../package.json');
const url = `http://${pkg.env.HOST || '127.0.0.1'}:${pkg.env.PORT}`

const router = createRouter({
    history: createWebHashHistory(url),
    routes
});

export default router;