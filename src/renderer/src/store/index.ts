import { InjectionKey } from 'vue';
import { createStore, Store } from 'vuex';

export interface AppSettingsState {
  start_page: string;
  steam_install_dir: string;
  avd_home: string;
  android_sdk_home: string;
}

export interface AlarmState {
  selected_hours: string;
  selected_minutes: string;
  selected_seconds: string;
  alarm_tone: string;
}

export interface SSHSession {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  use_password?: boolean;
  private_key?: string;
}

export interface State {
  app_settings: AppSettingsState;
  alarm: AlarmState;
  ssh_sessions: SSHSession[];
  games: [];
  avds: [];
}

export const key: InjectionKey<Store<State>> = Symbol();
const localStateString: string = localStorage.getItem('toolbelt_state') || '';
const localState =
  localStateString?.length > 0 && localStateString?.includes('{')
    ? JSON.parse(localStateString)
    : undefined;

export const store = createStore<State>({
  state: localState
    ? localState
    : {
        app_settings: {
          android_sdk_home: '',
          avd_home: '',
          start_page: '/',
          steam_install_dir: ''
        },
        alarm: {
          alarm_tone: '',
          selected_hours: '',
          selected_minutes: '',
          selected_seconds: ''
        },
        avds: [],
        games: [],
        ssh_sessions: []
      },

  // Mutations
  mutations: {
    setAlarm(state, { hours = '00', minutes = '00', seconds = '00', tone = 'nuke' }) {
      state.alarm.selected_hours = hours;
      state.alarm.selected_minutes = minutes;
      state.alarm.selected_seconds = seconds;
      state.alarm.alarm_tone = tone;
    },

    setStartPage(state, { start_page }) {
      state.app_settings.start_page = start_page;
    },

    setAndroidSdkHome(state, { android_sdk_home }) {
      state.app_settings.android_sdk_home = android_sdk_home;
    },

    setAVDHome(state, { avd_home }) {
      state.app_settings.avd_home = avd_home;
    },

    setSteamDir(state, { steam_dir }) {
      state.app_settings.steam_install_dir = steam_dir;
    },

    addSSHSession(state, { ssh_session }) {
      if (!ssh_session) return;

      state.ssh_sessions.push(ssh_session);
    },

    removeSSHSession(state, { id }) {
      state.ssh_sessions = state.ssh_sessions.filter((ssh) => ssh.id !== id);
    },

    updateSSHSession(state, { id, ssh_session }) {
      let ogSession = state.ssh_sessions.filter((ssh) => ssh.id === id)[0];
      let index = state.ssh_sessions.indexOf(ogSession);

      state.ssh_sessions[index] = ssh_session;
    }
  },
  // Mutations end

  // Getters
  getters: {
    getStartPage(state) {
      return state.app_settings.start_page;
    },

    getAndroidSdkHome(state) {
      return state.app_settings.android_sdk_home;
    },

    getAVDHome(state) {
      return state.app_settings.avd_home;
    },

    getSteamDir(state) {
      return state.app_settings.steam_install_dir;
    },

    getParsedAlarmTime(state) {
      return `${state.alarm.selected_hours}:${state.alarm.selected_minutes}:${state.alarm.selected_minutes}`;
    },

    getSSHSession(state, { id }) {
      return state.ssh_sessions.filter((ssh) => ssh.id === id)[0];
    },

    getGames(state) {
      return state.games;
    },

    getAVDS(state) {
      return state.avds;
    },

    getSSHSessions(state) {
      return state.ssh_sessions;
    }
  }
  // Getters end
});

store.watch(
  (state, getters) => {
    localStorage.setItem('toolbelt_state', JSON.stringify(state));

    return state;
  },
  (value, oldValue) => {}
);
