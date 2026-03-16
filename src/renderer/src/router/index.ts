import { createRouter, createWebHashHistory } from 'vue-router';
import Home      from '../pages/Home.vue';
import MD5       from '../pages/MD5.vue';
import Alarm     from '../pages/Alarm.vue';
import MDPad     from '../pages/MDPad.vue';
import Formatter from '../pages/Formatter.vue';
import Encoder   from '../pages/Encoder.vue';
import Requests  from '../pages/Requests.vue';
import Diff      from '../pages/Diff.vue';
import Regex     from '../pages/Regex.vue';
import Settings  from '../pages/Settings.vue';

const routes = [
  { path: '/',          name: 'Home',        component: Home,      props: { icon: 'Home' } },
  { path: '/alarm',     name: 'Alarm',       component: Alarm,     props: { icon: 'AlarmClock' } },
  { path: '/md5',       name: 'Hasher',      component: MD5,       props: { icon: 'Hash' } },
  { path: '/mdpad',     name: 'MD Notepad',  component: MDPad,     props: { icon: 'NotebookPen' } },
  { path: '/formatter', name: 'Formatter',   component: Formatter, props: { icon: 'Braces' } },
  { path: '/encoder',   name: 'Encoder',     component: Encoder,   props: { icon: 'Binary' } },
  { path: '/requests',  name: 'Requests',    component: Requests,  props: { icon: 'SendHorizontal' } },
  { path: '/diff',      name: 'Diff',        component: Diff,      props: { icon: 'Diff' } },
  { path: '/regex',     name: 'Regex',       component: Regex,     props: { icon: 'Regex' } },
  { path: '/settings',  name: 'Settings',    component: Settings,  props: { icon: 'Settings' } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
