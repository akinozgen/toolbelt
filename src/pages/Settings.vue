<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { computed, watch, ref } from 'vue';
import { key, type Accent, type SidebarMode, type Theme } from '../store';
import { useStore } from 'vuex';
import {
  UiCard, UiButton, UiInput, UiSelect, UiToggle, UiSegmented, UiSlider,
} from '../components/ui';
import {
  Palette, Cog, Type, Braces, Binary, SendHorizontal,
  Diff as DiffIcon, Regex, Info, Trash2, Plus, Check,
} from 'lucide-vue-next';

const router = useRouter();
const store = useStore(key);

const categories = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'general',    label: 'General',    icon: Cog },
  { id: 'editor',     label: 'Editor',     icon: Type },
  { id: 'formatter',  label: 'Formatter',  icon: Braces },
  { id: 'encoder',    label: 'Encoder',    icon: Binary },
  { id: 'requests',   label: 'Requests',   icon: SendHorizontal },
  { id: 'regex',      label: 'Regex',      icon: Regex },
  { id: 'diff',       label: 'Diff',       icon: DiffIcon },
  { id: 'about',      label: 'About',      icon: Info },
] as const;

type CategoryId = typeof categories[number]['id'];
const activeCategory = ref<CategoryId>('appearance');

// ── Bound state helpers ────────────────────────────────────────────
function bindSetting<T = unknown>(path: string) {
  return computed<T>({
    get: () => path.split('.').reduce((o: any, k) => o?.[k], store.state.app_settings) as T,
    set: (v: T) => {
      store.commit('setAppSetting', { path, value: v });
      store.dispatch('applySettingsToDOM');
    },
  });
}

// Appearance
const theme        = bindSetting<Theme>('theme');
const accent       = bindSetting<Accent>('accent');
const sidebarMode  = bindSetting<SidebarMode>('sidebar_mode');
const sidebarWidth = bindSetting<number>('sidebar_width');
const appFontSize  = bindSetting<number>('app_font_size');
const reduceMotion = bindSetting<boolean>('reduce_motion');

// General
const startPage = computed({
  get: () => store.getters.getStartPage,
  set: (v: string) => store.commit('setStartPage', { start_page: v }),
});

// Editor
const editorLineNumbers = bindSetting<boolean>('editor.line_numbers');
const editorWordWrap    = bindSetting<boolean>('editor.word_wrap');
const editorFontSize    = bindSetting<number>('editor.font_size');
const editorTabSize     = bindSetting<number>('editor.tab_size');

// Formatter
const fmtPrintWidth     = bindSetting<number>('formatter.print_width');
const fmtTabWidth       = bindSetting<number>('formatter.tab_width');
const fmtSingleQuote    = bindSetting<boolean>('formatter.single_quote');
const fmtTrailingComma  = bindSetting<string>('formatter.trailing_comma');
const fmtXmlPrintWidth  = bindSetting<number>('formatter.xml_print_width');

// Encoder
const encDefaultMode      = bindSetting<string>('encoder.default_mode');
const encDefaultAlgorithm = bindSetting<string>('encoder.default_algorithm');
const encAutoTrim         = bindSetting<boolean>('encoder.auto_trim');

// Requests
const reqDefaultMethod = bindSetting<string>('requests.default_method');
const reqPrettifyMode  = bindSetting<string>('requests.prettify_mode');
const reqTimeout       = bindSetting<number>('requests.timeout_ms');
const reqRedirect      = bindSetting<string>('requests.redirect');
const reqDefaultHeaders = computed(() => store.getters.getRequestsSettings.default_headers);
const reqHeadersLocal = ref(reqDefaultHeaders.value.map((h: any) => ({ ...h })));
function addDefaultHeader()    { reqHeadersLocal.value = [...reqHeadersLocal.value, { key: '', value: '' }]; }
function removeDefaultHeader(i: number) {
  reqHeadersLocal.value = reqHeadersLocal.value.filter((_, idx) => idx !== i);
}
watch(reqHeadersLocal, (next) => {
  store.commit('setAppSetting', { path: 'requests.default_headers', value: next });
}, { deep: true });
watch(reqDefaultHeaders, (next) => {
  reqHeadersLocal.value = next.map((h: any) => ({ ...h }));
}, { deep: true });

// Regex
const regexDefaultFlags    = bindSetting<string>('regex.default_flags');
const regexHighlight       = bindSetting<boolean>('regex.highlight_matches');
const regexPersistPresets  = bindSetting<boolean>('regex.persist_presets');

// Diff
const diffDefaultView    = bindSetting<string>('diff.default_view');
const diffDefaultLanguage= bindSetting<string>('diff.default_language');
const diffDefaultContext = bindSetting<number>('diff.default_context');
const diffLeftReadonly   = bindSetting<boolean>('diff.left_readonly');

// Option lists
const themeOptions = [
  { label: 'Dark',  value: 'dark' },
  { label: 'Light', value: 'light' },
];
const accentSwatches: { value: Accent; color: string; label: string }[] = [
  { value: 'blue',   color: '#0078D4', label: 'Blue' },
  { value: 'teal',   color: '#00B7C3', label: 'Teal' },
  { value: 'purple', color: '#8B5CF6', label: 'Purple' },
  { value: 'green',  color: '#107C10', label: 'Green' },
  { value: 'red',    color: '#C42B1C', label: 'Red' },
];
const sidebarModeOptions = [
  { label: 'Expanded', value: 'expanded' },
  { label: 'Compact',  value: 'compact' },
];
const startPageOptions = computed(() =>
  router.getRoutes()
    .filter((r) => r.name && !r.path.includes(':'))
    .map((r) => ({ label: String(r.name), value: r.path })),
);
const trailingCommaOptions = [
  { label: 'none', value: 'none' },
  { label: 'es5',  value: 'es5' },
  { label: 'all',  value: 'all' },
];
const encModeOptions = [
  { label: 'Encode', value: 'encode' },
  { label: 'Decode', value: 'decode' },
];
const encAlgoOptions = [
  { label: 'Base64', value: 'Base64' },
  { label: 'Base64url', value: 'Base64url' },
  { label: 'URL', value: 'URL' },
  { label: 'Hex', value: 'Hex' },
  { label: 'JWT', value: 'JWT' },
];
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(
  (m) => ({ label: m, value: m }),
);
const prettifyOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'JSON', value: 'json' },
  { label: 'Raw',  value: 'raw' },
];
const redirectOptions = [
  { label: 'Follow', value: 'follow' },
  { label: 'Manual', value: 'manual' },
  { label: 'Error',  value: 'error' },
];
const diffViewOptions = [
  { label: 'Side-by-side', value: 'side' },
  { label: 'Unified',      value: 'unified' },
];
const diffLanguageOptions = [
  'plain', 'json', 'tson', 'jsonl', 'yaml', 'html', 'css', 'js', 'ts', 'tsx',
  'jsx', 'vue', 'http', 'php', 'blade', 'xml', 'md',
].map((l) => ({ label: l, value: l }));

// About metadata — pulled from package.json at build time via Vite import
import pkg from '../../package.json';
const appVersion = pkg.version as string;
const appAuthor  = pkg.author as string;
const appLicense = pkg.license as string;
const repoUrl    = 'https://github.com/akinozgen/toolbelt';
</script>

<template>
  <div class="settings-page">
    <!-- Sidebar: categories -->
    <aside class="settings-sidebar">
      <div class="settings-sidebar-title">Settings</div>
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        :class="['settings-cat', { active: activeCategory === cat.id }]"
        @click="activeCategory = cat.id"
      >
        <component :is="cat.icon" :size="16" class="settings-cat-icon" />
        <span>{{ cat.label }}</span>
      </button>
    </aside>

    <!-- Pane: cards for active category -->
    <main class="settings-pane">
      <h1 class="settings-pane-title">{{ categories.find((c) => c.id === activeCategory)?.label }}</h1>

      <template v-if="activeCategory === 'appearance'">
        <UiCard title="Theme" description="Choose between light and dark surfaces.">
          <UiSegmented v-model="theme" :options="themeOptions" />
        </UiCard>

        <UiCard title="Accent color" description="App-wide highlight color.">
          <div class="accent-row">
            <button
              v-for="a in accentSwatches"
              :key="a.value"
              type="button"
              class="accent-swatch"
              :class="{ active: accent === a.value }"
              :style="{ '--swatch': a.color }"
              :title="a.label"
              @click="accent = a.value"
            >
              <Check v-if="accent === a.value" :size="14" />
            </button>
          </div>
        </UiCard>

        <UiCard title="Sidebar" description="Navigation panel display mode and width.">
          <div class="setting-row">
            <UiSegmented v-model="sidebarMode" :options="sidebarModeOptions" />
          </div>
          <div class="setting-row" v-if="sidebarMode === 'expanded'">
            <label class="setting-label">Width</label>
            <div class="setting-slider">
              <UiSlider v-model="sidebarWidth" :min="180" :max="360" />
              <span class="setting-value">{{ sidebarWidth }}px</span>
            </div>
          </div>
        </UiCard>

        <UiCard title="App font size">
          <div class="setting-slider">
            <UiSlider v-model="appFontSize" :min="11" :max="18" />
            <span class="setting-value">{{ appFontSize }}px</span>
          </div>
        </UiCard>

        <UiCard title="Reduce motion" description="Disable transitions and page animations.">
          <template #action>
            <UiToggle v-model="reduceMotion" />
          </template>
        </UiCard>
      </template>

      <template v-else-if="activeCategory === 'general'">
        <UiCard title="Start page" description="Page shown when the app launches.">
          <UiSelect v-model="startPage" :options="startPageOptions" />
        </UiCard>
      </template>

      <template v-else-if="activeCategory === 'editor'">
        <UiCard title="Line numbers">
          <template #action><UiToggle v-model="editorLineNumbers" /></template>
        </UiCard>
        <UiCard title="Word wrap">
          <template #action><UiToggle v-model="editorWordWrap" /></template>
        </UiCard>
        <UiCard title="Font size">
          <div class="setting-slider">
            <UiSlider v-model="editorFontSize" :min="11" :max="20" />
            <span class="setting-value">{{ editorFontSize }}px</span>
          </div>
        </UiCard>
        <UiCard title="Tab size">
          <div class="setting-slider">
            <UiSlider v-model="editorTabSize" :min="2" :max="8" />
            <span class="setting-value">{{ editorTabSize }}</span>
          </div>
        </UiCard>
      </template>

      <template v-else-if="activeCategory === 'formatter'">
        <UiCard title="Print width">
          <div class="setting-slider">
            <UiSlider v-model="fmtPrintWidth" :min="40" :max="200" />
            <span class="setting-value">{{ fmtPrintWidth }}</span>
          </div>
        </UiCard>
        <UiCard title="Tab width">
          <div class="setting-slider">
            <UiSlider v-model="fmtTabWidth" :min="2" :max="8" />
            <span class="setting-value">{{ fmtTabWidth }}</span>
          </div>
        </UiCard>
        <UiCard title="Single quotes">
          <template #action><UiToggle v-model="fmtSingleQuote" /></template>
        </UiCard>
        <UiCard title="Trailing comma">
          <UiSegmented v-model="fmtTrailingComma" :options="trailingCommaOptions" />
        </UiCard>
        <UiCard title="XML print width">
          <div class="setting-slider">
            <UiSlider v-model="fmtXmlPrintWidth" :min="20" :max="200" />
            <span class="setting-value">{{ fmtXmlPrintWidth }}</span>
          </div>
        </UiCard>
      </template>

      <template v-else-if="activeCategory === 'encoder'">
        <UiCard title="Default mode">
          <UiSegmented v-model="encDefaultMode" :options="encModeOptions" />
        </UiCard>
        <UiCard title="Default algorithm">
          <UiSegmented v-model="encDefaultAlgorithm" :options="encAlgoOptions" />
        </UiCard>
        <UiCard title="Auto-trim input" description="Strip leading/trailing whitespace before encode/decode.">
          <template #action><UiToggle v-model="encAutoTrim" /></template>
        </UiCard>
      </template>

      <template v-else-if="activeCategory === 'requests'">
        <UiCard title="Default method">
          <UiSelect v-model="reqDefaultMethod" :options="methodOptions" />
        </UiCard>
        <UiCard title="Prettify response">
          <UiSegmented v-model="reqPrettifyMode" :options="prettifyOptions" />
        </UiCard>
        <UiCard title="Timeout">
          <div class="setting-slider">
            <UiSlider v-model="reqTimeout" :min="1000" :max="600000" :step="1000" />
            <span class="setting-value">{{ Math.round(reqTimeout / 1000) }}s</span>
          </div>
        </UiCard>
        <UiCard title="Redirect policy">
          <UiSegmented v-model="reqRedirect" :options="redirectOptions" />
        </UiCard>
        <UiCard title="Default headers" description="Headers applied to every new request.">
          <div class="header-list">
            <div v-for="(h, i) in reqHeadersLocal" :key="i" class="header-row">
              <UiInput v-model="h.key"   placeholder="Header" />
              <UiInput v-model="h.value" placeholder="Value" />
              <UiButton variant="subtle" iconOnly size="md" @click="removeDefaultHeader(i)">
                <template #icon><Trash2 :size="14" /></template>
              </UiButton>
            </div>
            <UiButton variant="subtle" size="sm" @click="addDefaultHeader">
              <template #icon><Plus :size="14" /></template>
              Add header
            </UiButton>
          </div>
        </UiCard>
      </template>

      <template v-else-if="activeCategory === 'regex'">
        <UiCard title="Default flags">
          <UiInput v-model="regexDefaultFlags" placeholder="gim" monospace />
        </UiCard>
        <UiCard title="Highlight matches" description="Render match overlays in the test string area.">
          <template #action><UiToggle v-model="regexHighlight" /></template>
        </UiCard>
        <UiCard title="Persist presets" description="Save custom presets across sessions.">
          <template #action><UiToggle v-model="regexPersistPresets" /></template>
        </UiCard>
      </template>

      <template v-else-if="activeCategory === 'diff'">
        <UiCard title="Default view">
          <UiSegmented v-model="diffDefaultView" :options="diffViewOptions" />
        </UiCard>
        <UiCard title="Default language">
          <UiSelect v-model="diffDefaultLanguage" :options="diffLanguageOptions" />
        </UiCard>
        <UiCard title="Default context lines">
          <div class="setting-slider">
            <UiSlider v-model="diffDefaultContext" :min="0" :max="50" />
            <span class="setting-value">{{ diffDefaultContext }}</span>
          </div>
        </UiCard>
        <UiCard title="Left side read-only">
          <template #action><UiToggle v-model="diffLeftReadonly" /></template>
        </UiCard>
      </template>

      <template v-else-if="activeCategory === 'about'">
        <UiCard padding="lg">
          <div class="about-head">
            <div class="about-app">
              <div class="about-name">Toolbelt</div>
              <div class="about-version">Version {{ appVersion }}</div>
            </div>
          </div>
          <p class="about-tagline">A small set of utilities for everyday developer work.</p>
          <dl class="about-meta">
            <div class="about-meta-row">
              <dt>Author</dt>
              <dd>{{ appAuthor }}</dd>
            </div>
            <div class="about-meta-row">
              <dt>License</dt>
              <dd>{{ appLicense }}</dd>
            </div>
            <div class="about-meta-row">
              <dt>Source</dt>
              <dd>
                <a :href="repoUrl" target="_blank" rel="noopener" class="about-link">
                  github.com/akinozgen/toolbelt
                </a>
              </dd>
            </div>
          </dl>
        </UiCard>
      </template>
    </main>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  height: 100%;
  background: transparent;
}

.settings-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  padding: var(--space-4) var(--space-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.settings-sidebar-title {
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 var(--space-3);
  margin-bottom: var(--space-3);
}

.settings-cat {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-3);
  height: var(--row-height);
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: var(--fs-body);
  font-family: inherit;
  cursor: default;
  text-align: left;
  position: relative;
  transition: background var(--motion-fast) var(--ease-standard),
              color var(--motion-fast) var(--ease-standard);
}
.settings-cat:hover  { background: var(--bg-hover); color: var(--text-primary); }
.settings-cat:active { background: var(--bg-pressed); }
.settings-cat.active {
  background: var(--bg-selected);
  color: var(--text-primary);
}
.settings-cat.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}
.settings-cat-icon {
  flex-shrink: 0;
  color: currentColor;
}

.settings-pane {
  flex: 1;
  min-width: 0;
  padding: var(--space-6) var(--space-8);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.settings-pane-title {
  font-size: var(--fs-title-lg);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-3) 0;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
.setting-row:first-child { margin-top: 0; }
.setting-label {
  font-size: var(--fs-caption);
  color: var(--text-secondary);
  min-width: 60px;
}

.setting-slider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
}
.setting-value {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  color: var(--text-secondary);
  min-width: 56px;
  text-align: right;
}

.accent-row {
  display: flex;
  gap: var(--space-3);
}
.accent-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--swatch);
  border: 2px solid transparent;
  cursor: default;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: transform var(--motion-fast) var(--ease-standard);
}
.accent-swatch:hover  { transform: scale(1.1); }
.accent-swatch:active { transform: scale(0.95); }
.accent-swatch.active {
  border-color: var(--text-primary);
}

.header-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.header-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--space-2);
  align-items: center;
}

.about-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.about-app { display: flex; align-items: baseline; gap: var(--space-3); }
.about-name {
  font-size: var(--fs-title-lg);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
}
.about-version {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
}
.about-tagline {
  font-size: var(--fs-body);
  color: var(--text-secondary);
  line-height: var(--lh-relaxed);
  margin: 0 0 var(--space-5) 0;
}
.about-meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.about-meta-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: baseline;
  gap: var(--space-3);
}
.about-meta-row dt {
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.about-meta-row dd {
  margin: 0;
  font-size: var(--fs-body);
  color: var(--text-primary);
}
.about-link {
  color: var(--accent);
  text-decoration: none;
  cursor: pointer;
}
.about-link:hover { text-decoration: underline; }
</style>
