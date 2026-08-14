import { InjectionKey } from 'vue';
import { createStore, Store } from 'vuex';
import { load } from '@tauri-apps/plugin-store';

export type Theme = 'light' | 'dark';
export type Accent = 'blue' | 'teal' | 'purple' | 'green' | 'red';
export type SidebarMode = 'expanded' | 'compact';

export interface AppSettingsState {
  start_page: string;
  theme: Theme;
  accent: Accent;
  sidebar_mode: SidebarMode;
  sidebar_width: number;
  app_font_size: number;
  reduce_motion: boolean;
  editor: {
    line_numbers: boolean;
    word_wrap: boolean;
    font_size: number;
    tab_size: number;
    theme: 'default' | 'oneDark';
  };
  formatter: {
    print_width: number;
    tab_width: number;
    single_quote: boolean;
    trailing_comma: 'none' | 'es5' | 'all';
    xml_print_width: number;
  };
  encoder: {
    default_mode: 'encode' | 'decode';
    default_algorithm: 'Base64' | 'Base64url' | 'URL' | 'Hex' | 'JWT';
    auto_trim: boolean;
  };
  requests: {
    default_method: string;
    default_headers: { key: string; value: string }[];
    prettify_mode: 'auto' | 'json' | 'raw';
    timeout_ms: number;
    redirect: 'follow' | 'manual' | 'error';
  };
  regex: {
    default_flags: string;
    highlight_matches: boolean;
    persist_presets: boolean;
  };
  diff: {
    default_view: 'side' | 'unified';
    default_language: string;
    default_context: number;
    left_readonly: boolean;
  };
}

export interface State {
  app_settings: AppSettingsState;
}

export const key: InjectionKey<Store<State>> = Symbol();
const localStateString: string = localStorage.getItem('toolbelt_state') || '';
const localState =
  localStateString?.length > 0 && localStateString?.includes('{')
    ? JSON.parse(localStateString)
    : undefined;

// ── Tauri persistent store ───────────────────────────────────────────────
let _tauriStore: Awaited<ReturnType<typeof load>> | null = null;

async function getTauriStore() {
  if (!_tauriStore) _tauriStore = await load('toolbelt.json', { autoSave: true });
  return _tauriStore;
}

const defaultState: State = {
  app_settings: {
    start_page: '/',
    theme: 'dark',
    accent: 'blue',
    sidebar_mode: 'expanded',
    sidebar_width: 240,
    app_font_size: 13,
    reduce_motion: false,
    editor: {
      line_numbers: true,
      word_wrap: true,
      font_size: 13,
      tab_size: 2,
      theme: 'oneDark',
    },
    formatter: {
      print_width: 100,
      tab_width: 2,
      single_quote: true,
      trailing_comma: 'es5',
      xml_print_width: 60,
    },
    encoder: {
      default_mode: 'encode',
      default_algorithm: 'Base64',
      auto_trim: false,
    },
    requests: {
      default_method: 'POST',
      default_headers: [{ key: 'Accept', value: 'application/json' }],
      prettify_mode: 'auto',
      timeout_ms: 15000,
      redirect: 'follow',
    },
    regex: {
      default_flags: 'g',
      highlight_matches: true,
      persist_presets: false,
    },
    diff: {
      default_view: 'side',
      default_language: 'plain',
      default_context: 3,
      left_readonly: false,
    },
  },
};

function mergeDeep<T>(base: T, update: any): T {
  if (update === null || update === undefined) return base;
  if (Array.isArray(base) || Array.isArray(update)) return (update ?? base) as T;
  if (typeof base !== 'object' || typeof update !== 'object') return (update ?? base) as T;
  const result: any = { ...base };
  for (const key of Object.keys(update)) {
    result[key] = mergeDeep((base as any)[key], update[key]);
  }
  return result;
}

export const store = createStore<State>({
  state: localState ? mergeDeep(defaultState, localState) : defaultState,

  mutations: {
    setStartPage(state, { start_page }) {
      state.app_settings.start_page = start_page;
    },
    setTheme(state, { theme }) {
      state.app_settings.theme = theme;
    },
    setAppSetting(state, { path, value }) {
      const parts = Array.isArray(path) ? path : path.split('.');
      let target: any = state.app_settings;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (!(key in target)) target[key] = {};
        target = target[key];
      }
      target[parts[parts.length - 1]] = value;
    },
  },

  getters: {
    getStartPage(state) {
      return state.app_settings.start_page;
    },

    getTheme(state)            { return state.app_settings.theme; },
    getAppSettings(state)      { return state.app_settings; },
    getEditorSettings(state)   { return state.app_settings.editor; },
    getFormatterSettings(state){ return state.app_settings.formatter; },
    getEncoderSettings(state)  { return state.app_settings.encoder; },
    getRequestsSettings(state) { return state.app_settings.requests; },
    getRegexSettings(state)    { return state.app_settings.regex; },
    getDiffSettings(state)     { return state.app_settings.diff; },
  },

  actions: {
    changeTheme(state, { theme }) {
      if (theme != '') {
        state.state.app_settings.theme = theme;
      }

      let html = document.querySelector('html');
      if (html) {
        html.dataset.theme = state.state.app_settings.theme;
      }
    },

    applySettingsToDOM(state) {
      const app = state.state.app_settings;
      const html = document.querySelector('html');
      if (html) {
        html.dataset.theme = app.theme;
        html.dataset.accent = app.accent;
        html.dataset.sidebarMode = app.sidebar_mode;
        html.dataset.reduceMotion = app.reduce_motion ? 'true' : 'false';
        const sidebarWidth = app.sidebar_mode === 'compact' ? 48 : app.sidebar_width;
        html.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
        html.style.setProperty('--app-font-size', `${app.app_font_size}px`);
        html.style.setProperty('--editor-font-size', `${app.editor.font_size}px`);
      }
    },
  }
});

store.watch(
  (state) => {
    localStorage.setItem('toolbelt_state', JSON.stringify(state));
    getTauriStore().then(s => s.set('toolbelt_state', JSON.stringify(state)));
    store.dispatch('applySettingsToDOM');
    return state;
  },
  () => {}
);

store.dispatch('applySettingsToDOM');

// Hydrate from Tauri store on startup (overrides localStorage if present)
getTauriStore().then(s =>
  s.has('toolbelt_state').then(has => {
    if (!has) {
      s.set('toolbelt_state', JSON.stringify(store.state));
      return;
    }
    s.get<string>('toolbelt_state').then(val => {
      if (!val) return;
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      store.replaceState(mergeDeep(store.state, parsed));
      store.dispatch('applySettingsToDOM');
    });
  })
);
