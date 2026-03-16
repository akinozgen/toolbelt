import { InjectionKey } from 'vue';
import { createStore, Store } from 'vuex';

export interface AppSettingsState {
  start_page: string;
  theme: 'default';
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

export interface AlarmState {
  selected_hours: string;
  selected_minutes: string;
  selected_seconds: string;
  alarm_tone: string;
  isAlarmSet: boolean;
}

export interface State {
  app_settings: AppSettingsState;
  alarm: AlarmState;
}

export const key: InjectionKey<Store<State>> = Symbol();
const localStateString: string = localStorage.getItem('toolbelt_state') || '';
const localState =
  localStateString?.length > 0 && localStateString?.includes('{')
    ? JSON.parse(localStateString)
    : undefined;

let electronState: any = undefined;
const eStoreAvailable = typeof window !== 'undefined' && typeof window.eStore?.get === 'function';

const defaultState: State = {
  app_settings: {
    start_page: '/',
    theme: 'default',
    sidebar_width: 220,
    app_font_size: 14,
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
  alarm: {
    alarm_tone: 'siren',
    selected_hours: '00',
    selected_minutes: '00',
    selected_seconds: '00',
    isAlarmSet: false,
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
    setAlarm(state, { hours = '00', minutes = '00', seconds = '00', tone = 'nuke' }) {
      state.alarm.selected_hours = hours;
      state.alarm.selected_minutes = minutes;
      state.alarm.selected_seconds = seconds;
      state.alarm.alarm_tone = tone;
      state.alarm.isAlarmSet = true;
    },

    clearAlarm(state) {
      state.alarm.isAlarmSet = false;
    },

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

    getParsedAlarmTime(state) {
      return `${state.alarm.selected_hours}:${state.alarm.selected_minutes}:${state.alarm.selected_seconds}`;
    },

    isAlarmSet(state) {
      return state.alarm.isAlarmSet;
    },

    getAlarmHours(state) {
      return state.alarm.selected_hours;
    },

    getAlarmMinutes(state) {
      return state.alarm.selected_minutes;
    },

    getAlarmSeconds(state) {
      return state.alarm.selected_seconds;
    },

    getTheme(state) {
      return state.app_settings.theme;
    },
    getAppSettings(state) {
      return state.app_settings;
    },
    getEditorSettings(state) {
      return state.app_settings.editor;
    },
    getFormatterSettings(state) {
      return state.app_settings.formatter;
    },
    getEncoderSettings(state) {
      return state.app_settings.encoder;
    },
    getRequestsSettings(state) {
      return state.app_settings.requests;
    },
    getRegexSettings(state) {
      return state.app_settings.regex;
    },
    getDiffSettings(state) {
      return state.app_settings.diff;
    },
  },

  actions: {
    setAlarmFromPreset(state, { preset }) {
      let now = new Date();

      switch (preset) {
        case '5_mins':
          now = now.addMinutes(5);
          break;
        case '15_mins':
          now = now.addMinutes(15);
          break;
        case '1_hour':
          now = now.addHours(1);
          break;
        case '2_hours':
          now = now.addHours(2);
          break;
        case '5_hours':
          now = now.addHours(5);
          break;
        case '8_hours':
          now = now.addHours(8);
          break;
        case '10_hours':
          now = now.addHours(8);
          break;
        case '12_hours':
          now = now.addHours(12);
          break;
      }

      let parts = now.toLocaleTimeString().split(':');
      if (parts.length != 3) return;

      state.state.alarm.selected_hours = parts[0];
      state.state.alarm.selected_minutes = parts[1];
      state.state.alarm.selected_seconds = parts[2];
    },

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
        html.dataset.reduceMotion = app.reduce_motion ? 'true' : 'false';
        html.style.setProperty('--sidebar-width', `${app.sidebar_width}px`);
        html.style.setProperty('--app-font-size', `${app.app_font_size}px`);
        html.style.setProperty('--editor-font-size', `${app.editor.font_size}px`);
      }
    },
  }
});

store.watch(
  (state, getters) => {
    localStorage.setItem('toolbelt_state', JSON.stringify(state));
    if (eStoreAvailable) {
      window.eStore.set('toolbelt_state', JSON.stringify(state));
    }
    store.dispatch('applySettingsToDOM');
    return state;
  },
  (value, oldValue) => {}
);

store.dispatch('applySettingsToDOM');

if (eStoreAvailable) {
  window.eStore.has('toolbelt_state').then((has) => {
    if (!has) {
      window.eStore.set('toolbelt_state', JSON.stringify(store.state));
      return;
    }
    window.eStore.get('toolbelt_state').then((val) => {
      if (!val) return;
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      store.replaceState(mergeDeep(store.state, parsed));
      store.dispatch('applySettingsToDOM');
    });
  });
}
