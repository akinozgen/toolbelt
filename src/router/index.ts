import { createRouter, createWebHistory } from 'vue-router';
import Home      from '../pages/Home.vue';
import Hash      from '../pages/MD5.vue';
import Notes     from '../pages/MDPad.vue';
import Format    from '../pages/Formatter.vue';
import Encode    from '../pages/Encoder.vue';
import Http      from '../pages/Requests.vue';
import Diff      from '../pages/Diff.vue';
import Regex     from '../pages/Regex.vue';
import Generate  from '../pages/Generate.vue';
import Crypto    from '../pages/Crypto.vue';
import TextTool  from '../pages/Text.vue';
import Visual    from '../pages/Visual.vue';
import Settings  from '../pages/Settings.vue';

const routes = [
  { path: '/',        name: 'Home',     component: Home },
  { path: '/hash',    name: 'Hash',     component: Hash },
  { path: '/encode',  name: 'Encode',   component: Encode },
  { path: '/format',  name: 'Format',   component: Format },
  { path: '/diff',    name: 'Diff',     component: Diff },
  { path: '/regex',   name: 'Regex',    component: Regex },
  { path: '/http',    name: 'HTTP',     component: Http },
  { path: '/generate',name: 'Generate', component: Generate },
  { path: '/crypto',  name: 'Crypto',   component: Crypto },
  { path: '/text',    name: 'Text',     component: TextTool },
  { path: '/visual',  name: 'Visual',   component: Visual },
  { path: '/notes',   name: 'Notes',    component: Notes },
  { path: '/settings',name: 'Settings', component: Settings },
  // Catch-all: stale persisted start_page (e.g. /md5, /alarm) → Home
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
