import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import MD5 from '../pages/MD5.vue';

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
    }

];

const pkg = await import('../../../../package.json');
const url = `http://${pkg.env.HOST || '127.0.0.1'}:${pkg.env.PORT}`

const router = createRouter({
    history: createWebHashHistory(url),
    routes
});

export default router;