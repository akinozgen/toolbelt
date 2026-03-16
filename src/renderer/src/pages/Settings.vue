<template>
  <div class="page">
    <div class="settings-header">
      <h1 class="page-title">Settings</h1>
      <div class="settings-tabs">
        <button
          v-for="t in tabs"
          :key="t.id"
          :class="['settings-tab', { active: activeTab === t.id }]"
          @click="activeTab = t.id"
        >{{ t.label }}</button>
      </div>
    </div>

    <div class="settings-content">
      <div v-if="activeTab === 'general'" class="card">
        <p class="section-title">General</p>
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">Start Page</label>
            <select v-model="startPage" @change="changeStartPage" class="select-field">
              <option :value="route.path" :key="route.path" v-for="route in router.getRoutes()">
                {{ route.name?.toString() }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Theme</label>
            <select v-model="theme" class="select-field">
              <option value="default">Default</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sidebar Width (px)</label>
            <div class="settings-slider">
              <input type="range" min="160" max="400" v-model.number="sidebarWidth" />
              <span class="slider-value">{{ sidebarWidth }}px</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">App Font Size (px)</label>
            <div class="settings-slider">
              <input type="range" min="12" max="20" v-model.number="appFontSize" />
              <span class="slider-value">{{ appFontSize }}px</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Reduce Motion</label>
            <label class="toggle">
              <input type="checkbox" v-model="reduceMotion" />
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'editor'" class="card">
        <p class="section-title">Editor</p>
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">Line Numbers</label>
            <label class="toggle">
              <input type="checkbox" v-model="editorLineNumbers" />
              <span class="toggle-track"></span>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label">Word Wrap</label>
            <label class="toggle">
              <input type="checkbox" v-model="editorWordWrap" />
              <span class="toggle-track"></span>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label">Editor Font Size (px)</label>
            <div class="settings-slider">
              <input type="range" min="11" max="20" v-model.number="editorFontSize" />
              <span class="slider-value">{{ editorFontSize }}px</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Tab Size</label>
            <div class="settings-slider">
              <input type="range" min="2" max="8" v-model.number="editorTabSize" />
              <span class="slider-value">{{ editorTabSize }}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Editor Theme</label>
            <div class="segmented">
              <button :class="['seg-btn', { active: editorTheme === 'default' }]" @click="editorTheme = 'default'">Default</button>
              <button :class="['seg-btn', { active: editorTheme === 'oneDark' }]" @click="editorTheme = 'oneDark'">One Dark</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'formatter'" class="card">
        <p class="section-title">Formatter</p>
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">Print Width</label>
            <div class="settings-slider">
              <input type="range" min="40" max="200" v-model.number="fmtPrintWidth" />
              <span class="slider-value">{{ fmtPrintWidth }}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Tab Width</label>
            <div class="settings-slider">
              <input type="range" min="2" max="8" v-model.number="fmtTabWidth" />
              <span class="slider-value">{{ fmtTabWidth }}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Single Quote</label>
            <label class="toggle">
              <input type="checkbox" v-model="fmtSingleQuote" />
              <span class="toggle-track"></span>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label">Trailing Comma</label>
            <div class="segmented">
              <button :class="['seg-btn', { active: fmtTrailingComma === 'none' }]" @click="fmtTrailingComma = 'none'">none</button>
              <button :class="['seg-btn', { active: fmtTrailingComma === 'es5' }]" @click="fmtTrailingComma = 'es5'">es5</button>
              <button :class="['seg-btn', { active: fmtTrailingComma === 'all' }]" @click="fmtTrailingComma = 'all'">all</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">XML Print Width</label>
            <div class="settings-slider">
              <input type="range" min="20" max="200" v-model.number="fmtXmlPrintWidth" />
              <span class="slider-value">{{ fmtXmlPrintWidth }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'encoder'" class="card">
        <p class="section-title">Encoder</p>
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">Default Mode</label>
            <div class="segmented">
              <button :class="['seg-btn', { active: encDefaultMode === 'encode' }]" @click="encDefaultMode = 'encode'">encode</button>
              <button :class="['seg-btn', { active: encDefaultMode === 'decode' }]" @click="encDefaultMode = 'decode'">decode</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Default Algorithm</label>
            <div class="segmented wrap">
              <button :class="['seg-btn', { active: encDefaultAlgorithm === 'Base64' }]" @click="encDefaultAlgorithm = 'Base64'">Base64</button>
              <button :class="['seg-btn', { active: encDefaultAlgorithm === 'Base64url' }]" @click="encDefaultAlgorithm = 'Base64url'">Base64url</button>
              <button :class="['seg-btn', { active: encDefaultAlgorithm === 'URL' }]" @click="encDefaultAlgorithm = 'URL'">URL</button>
              <button :class="['seg-btn', { active: encDefaultAlgorithm === 'Hex' }]" @click="encDefaultAlgorithm = 'Hex'">Hex</button>
              <button :class="['seg-btn', { active: encDefaultAlgorithm === 'JWT' }]" @click="encDefaultAlgorithm = 'JWT'">JWT</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Auto-trim Input</label>
            <label class="toggle">
              <input type="checkbox" v-model="encAutoTrim" />
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'requests'" class="card">
        <p class="section-title">Requests</p>
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">Default Method</label>
            <select v-model="reqDefaultMethod" class="select-field">
              <option v-for="m in methods" :key="m">{{ m }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Prettify Mode</label>
            <div class="segmented">
              <button :class="['seg-btn', { active: reqPrettifyMode === 'auto' }]" @click="reqPrettifyMode = 'auto'">auto</button>
              <button :class="['seg-btn', { active: reqPrettifyMode === 'json' }]" @click="reqPrettifyMode = 'json'">json</button>
              <button :class="['seg-btn', { active: reqPrettifyMode === 'raw' }]" @click="reqPrettifyMode = 'raw'">raw</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Timeout (ms)</label>
            <div class="settings-slider">
              <input type="range" min="1000" max="600000" step="1000" v-model.number="reqTimeout" />
              <span class="slider-value">{{ reqTimeout }}ms</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Redirect</label>
            <div class="segmented">
              <button :class="['seg-btn', { active: reqRedirect === 'follow' }]" @click="reqRedirect = 'follow'">follow</button>
              <button :class="['seg-btn', { active: reqRedirect === 'manual' }]" @click="reqRedirect = 'manual'">manual</button>
              <button :class="['seg-btn', { active: reqRedirect === 'error' }]" @click="reqRedirect = 'error'">error</button>
            </div>
          </div>
        </div>
        <div class="form-group mt-4">
          <label class="form-label">Default Headers</label>
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2" v-for="(h, i) in reqHeadersLocal" :key="i">
              <input class="input-field" v-model="h.key" placeholder="Header" spellcheck="false" />
              <input class="input-field" v-model="h.value" placeholder="Value" spellcheck="false" />
              <button class="btn btn-ghost btn-sm" @click="removeDefaultHeader(i)">Remove</button>
            </div>
            <button class="btn btn-ghost btn-sm" @click="addDefaultHeader">+ Add Header</button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'regex'" class="card">
        <p class="section-title">Regex</p>
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">Default Flags</label>
            <input class="input-field" v-model="regexDefaultFlags" placeholder="gim" spellcheck="false" />
          </div>
          <div class="form-group">
            <label class="form-label">Highlight Matches</label>
            <label class="toggle">
              <input type="checkbox" v-model="regexHighlight" />
              <span class="toggle-track"></span>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label">Persist Presets</label>
            <label class="toggle">
              <input type="checkbox" v-model="regexPersistPresets" />
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'diff'" class="card">
        <p class="section-title">Diff</p>
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">Default View</label>
            <select v-model="diffDefaultView" class="select-field">
              <option value="side">side</option>
              <option value="unified">unified</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Default Language</label>
            <select v-model="diffDefaultLanguage" class="select-field">
              <option v-for="l in diffLanguages" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Default Context Lines</label>
            <div class="settings-slider">
              <input type="range" min="0" max="50" v-model.number="diffDefaultContext" />
              <span class="slider-value">{{ diffDefaultContext }}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Left Read-only</label>
            <label class="toggle">
              <input type="checkbox" v-model="diffLeftReadonly" />
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { computed, watch, ref } from 'vue';
import { key } from '../store';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore(key);

const startPage = computed(() => store.getters.getStartPage);
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const diffLanguages = ['plain', 'json', 'tson', 'jsonl', 'yaml', 'html', 'css', 'js', 'ts', 'tsx', 'jsx', 'vue', 'http', 'php', 'blade', 'xml', 'md'];
const tabs = [
  { id: 'general', label: 'General' },
  { id: 'editor', label: 'Editor' },
  { id: 'formatter', label: 'Formatter' },
  { id: 'encoder', label: 'Encoder' },
  { id: 'requests', label: 'Requests' },
  { id: 'regex', label: 'Regex' },
  { id: 'diff', label: 'Diff' },
];
const activeTab = ref('general');

function changeStartPage(e: any): void {
  store.commit('setStartPage', { start_page: e.target.value });
}

const theme = computed({
  get: () => store.getters.getTheme,
  set: (v) => store.commit('setTheme', { theme: v })
});
const sidebarWidth = computed({
  get: () => store.getters.getAppSettings.sidebar_width,
  set: (v) => store.commit('setAppSetting', { path: 'sidebar_width', value: v })
});
const appFontSize = computed({
  get: () => store.getters.getAppSettings.app_font_size,
  set: (v) => store.commit('setAppSetting', { path: 'app_font_size', value: v })
});
const editorFontSize = computed({
  get: () => store.getters.getEditorSettings.font_size,
  set: (v) => store.commit('setAppSetting', { path: 'editor.font_size', value: v })
});
const reduceMotion = computed({
  get: () => store.getters.getAppSettings.reduce_motion,
  set: (v) => store.commit('setAppSetting', { path: 'reduce_motion', value: v })
});

const editorLineNumbers = computed({
  get: () => store.getters.getEditorSettings.line_numbers,
  set: (v) => store.commit('setAppSetting', { path: 'editor.line_numbers', value: v })
});
const editorWordWrap = computed({
  get: () => store.getters.getEditorSettings.word_wrap,
  set: (v) => store.commit('setAppSetting', { path: 'editor.word_wrap', value: v })
});
const editorTabSize = computed({
  get: () => store.getters.getEditorSettings.tab_size,
  set: (v) => store.commit('setAppSetting', { path: 'editor.tab_size', value: v })
});
const editorTheme = computed({
  get: () => store.getters.getEditorSettings.theme,
  set: (v) => store.commit('setAppSetting', { path: 'editor.theme', value: v })
});

const fmtPrintWidth = computed({
  get: () => store.getters.getFormatterSettings.print_width,
  set: (v) => store.commit('setAppSetting', { path: 'formatter.print_width', value: v })
});
const fmtTabWidth = computed({
  get: () => store.getters.getFormatterSettings.tab_width,
  set: (v) => store.commit('setAppSetting', { path: 'formatter.tab_width', value: v })
});
const fmtSingleQuote = computed({
  get: () => store.getters.getFormatterSettings.single_quote,
  set: (v) => store.commit('setAppSetting', { path: 'formatter.single_quote', value: v })
});
const fmtTrailingComma = computed({
  get: () => store.getters.getFormatterSettings.trailing_comma,
  set: (v) => store.commit('setAppSetting', { path: 'formatter.trailing_comma', value: v })
});
const fmtXmlPrintWidth = computed({
  get: () => store.getters.getFormatterSettings.xml_print_width,
  set: (v) => store.commit('setAppSetting', { path: 'formatter.xml_print_width', value: v })
});

const encDefaultMode = computed({
  get: () => store.getters.getEncoderSettings.default_mode,
  set: (v) => store.commit('setAppSetting', { path: 'encoder.default_mode', value: v })
});
const encDefaultAlgorithm = computed({
  get: () => store.getters.getEncoderSettings.default_algorithm,
  set: (v) => store.commit('setAppSetting', { path: 'encoder.default_algorithm', value: v })
});
const encAutoTrim = computed({
  get: () => store.getters.getEncoderSettings.auto_trim,
  set: (v) => store.commit('setAppSetting', { path: 'encoder.auto_trim', value: v })
});

const reqDefaultMethod = computed({
  get: () => store.getters.getRequestsSettings.default_method,
  set: (v) => store.commit('setAppSetting', { path: 'requests.default_method', value: v })
});
const reqPrettifyMode = computed({
  get: () => store.getters.getRequestsSettings.prettify_mode,
  set: (v) => store.commit('setAppSetting', { path: 'requests.prettify_mode', value: v })
});
const reqTimeout = computed({
  get: () => store.getters.getRequestsSettings.timeout_ms,
  set: (v) => store.commit('setAppSetting', { path: 'requests.timeout_ms', value: v })
});
const reqRedirect = computed({
  get: () => store.getters.getRequestsSettings.redirect,
  set: (v) => store.commit('setAppSetting', { path: 'requests.redirect', value: v })
});
const reqDefaultHeaders = computed(() => store.getters.getRequestsSettings.default_headers);
const reqHeadersLocal = ref(reqDefaultHeaders.value.map((h: any) => ({ ...h })));

function addDefaultHeader() {
  reqHeadersLocal.value = [...reqHeadersLocal.value, { key: '', value: '' }];
}
function removeDefaultHeader(i: number) {
  reqHeadersLocal.value = reqHeadersLocal.value.filter((_, idx) => idx !== i);
}

const regexDefaultFlags = computed({
  get: () => store.getters.getRegexSettings.default_flags,
  set: (v) => store.commit('setAppSetting', { path: 'regex.default_flags', value: v })
});
const regexHighlight = computed({
  get: () => store.getters.getRegexSettings.highlight_matches,
  set: (v) => store.commit('setAppSetting', { path: 'regex.highlight_matches', value: v })
});
const regexPersistPresets = computed({
  get: () => store.getters.getRegexSettings.persist_presets,
  set: (v) => store.commit('setAppSetting', { path: 'regex.persist_presets', value: v })
});

const diffDefaultView = computed({
  get: () => store.getters.getDiffSettings.default_view,
  set: (v) => store.commit('setAppSetting', { path: 'diff.default_view', value: v })
});
const diffDefaultLanguage = computed({
  get: () => store.getters.getDiffSettings.default_language,
  set: (v) => store.commit('setAppSetting', { path: 'diff.default_language', value: v })
});
const diffDefaultContext = computed({
  get: () => store.getters.getDiffSettings.default_context,
  set: (v) => store.commit('setAppSetting', { path: 'diff.default_context', value: v })
});
const diffLeftReadonly = computed({
  get: () => store.getters.getDiffSettings.left_readonly,
  set: (v) => store.commit('setAppSetting', { path: 'diff.left_readonly', value: v })
});

watch(reqHeadersLocal, (next) => {
  store.commit('setAppSetting', { path: 'requests.default_headers', value: next });
}, { deep: true });

watch(reqDefaultHeaders, (next) => {
  reqHeadersLocal.value = next.map((h: any) => ({ ...h }));
}, { deep: true });
</script>

<style scoped>
.settings-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}
.settings-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.settings-tab {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.12s;
}
.settings-tab:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.06);
}
.settings-tab.active {
  color: var(--primary);
  background: rgba(99, 102, 241, 0.18);
  border-color: rgba(99, 102, 241, 0.6);
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.25);
}
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
@media (max-width: 900px) {
  .settings-grid { grid-template-columns: 1fr; }
}
.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 24px;
}
.toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-track {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  transition: all 0.15s;
  position: relative;
}
.toggle-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--text-secondary);
  transition: all 0.15s;
}
.toggle input:checked + .toggle-track {
  background: var(--primary-subtle);
  border-color: var(--primary);
}
.toggle input:checked + .toggle-track::after {
  transform: translateX(20px);
  background: var(--primary);
}

.settings-slider {
  display: flex;
  align-items: center;
  gap: 10px;
}
.settings-slider input[type='range'] {
  flex: 1;
  accent-color: var(--primary);
}
.slider-value {
  min-width: 64px;
  text-align: right;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: 'Cascadia Code', Consolas, monospace;
}

.segmented {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: rgba(12, 15, 24, 0.4);
  border: 1px solid var(--border);
}
.segmented.wrap { flex-wrap: wrap; }
.seg-btn {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
}
.seg-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}
.seg-btn.active {
  color: var(--primary);
  background: var(--primary-subtle);
  border-color: var(--primary);
}

.card {
  background: transparent;
  border: 1px solid var(--border);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
</style>
