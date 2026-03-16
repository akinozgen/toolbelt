<template>
  <div class="tool-page">

    <div class="tool-topbar">
      <div class="tool-tabs">
        <button
          v-for="fmt in formats"
          :key="fmt"
          :class="['tool-tab', { active: selected === fmt }]"
          @click="selected = fmt"
        >{{ fmt }}</button>
      </div>
      <button class="btn btn-primary btn-sm" @click="runFormat">Format</button>
    </div>

    <div class="tool-split">
      <div class="tool-pane">
        <div class="tool-pane-label">
          <span>Input</span>
          <button class="btn btn-ghost btn-sm tool-icon-btn danger" @click="clearInput" :disabled="!input" title="Clear">
            <Trash2 :size="14" />
          </button>
        </div>
        <div class="tool-editor">
          <Codemirror
            v-model="input"
            :extensions="inputExtensions"
            :placeholder="placeholder"
            :style="{ height: '100%' }"
          />
        </div>
      </div>
      <div class="tool-resize-handle"></div>
      <div class="tool-pane">
        <div class="tool-pane-label">
          <span>Output</span>
          <div class="flex items-center gap-2">
            <span v-if="error" class="tool-error-label">{{ error }}</span>
            <button class="btn btn-ghost btn-sm tool-icon-btn" :class="{ success: formatted }" @click="copyOutput" :disabled="!output" :title="copied ? 'Copied' : 'Copy'">
              <Copy :size="14" />
            </button>
            <button v-if="error" class="btn btn-ghost btn-sm tool-copy-text" @click="copyError">
              Copy Error
            </button>
          </div>
        </div>
        <div class="tool-editor">
          <Codemirror
            :model-value="output || (error ? error : '')"
            :extensions="outputExtensions"
            :style="{ height: '100%' }"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { lineNumbers, EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { Copy, Trash2 } from 'lucide-vue-next';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/lang-yaml';
import { useStore } from 'vuex';
import { key } from '../store';
type PrettierFormat = (source: string, options: any) => Promise<string>;
type PrettierPlugins = {
  parserBabel: any;
  parserEstree: any;
  parserHtml: any;
  parserPostcss: any;
  parserTypescript: any;
  parserXml: any;
};

const formats = ['JSON', 'HTML', 'CSS', 'JS', 'XML', 'YAML'] as const;
type Format = typeof formats[number];

const store = useStore(key);

const selected = ref<Format>('JSON');
const input    = ref('');
const output   = ref('');
const error    = ref('');
const copied   = ref(false);
const formatted = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let formatTimer: ReturnType<typeof setTimeout> | null = null;
let prettierFormat: PrettierFormat | null = null;
let prettierPlugins: PrettierPlugins | null = null;

const placeholderMap: Record<Format, string> = {
  JSON: '{ "name":"Toolbelt","version":1,"features":["formatter","encoder"],"meta":{"created":"2026-02-26","active":true} }',
  HTML: '<div class="card"><h3>Toolbelt</h3><p>Quick utilities</p><ul><li>Format</li><li>Encode</li></ul></div>',
  CSS: '.card{display:flex;flex-direction:column;gap:6px;padding:12px;border:1px solid #333;border-radius:8px}',
  JS: 'const sum=(a,b)=>{return a+b};const list=[1,2,3].map(n=>n*2)',
  XML: '<note><to>Akin</to><from>Toolbelt</from><body>Hi</body></note>',
  YAML: 'name: Toolbelt\nversion: 1\nfeatures: [formatter, encoder]\nmeta: { created: 2026-02-26, active: true }',
};

const placeholder = computed(() => '');
const lastSample = ref(placeholderMap[selected.value]);
input.value = placeholderMap[selected.value];

watch(selected, (next) => {
  const nextSample = placeholderMap[next];
  if (!input.value || input.value === lastSample.value) {
    input.value = nextSample;
  }
  lastSample.value = nextSample;
  output.value = '';
  error.value = '';
  copied.value = false;
  formatted.value = false;
});

const languageExtension = computed(() => {
  switch (selected.value) {
    case 'JSON': return json();
    case 'HTML': return html();
    case 'CSS': return css();
    case 'JS': return javascript({ typescript: true });
    case 'XML': return xml();
    case 'YAML': return yaml();
    default: return [];
  }
});

const editorSettings = computed(() => store.getters.getEditorSettings);
const formatterSettings = computed(() => store.getters.getFormatterSettings);

const baseExtensions = computed(() => {
  const exts: any[] = [];
  if (editorSettings.value.theme === 'oneDark') exts.push(oneDark);
  if (editorSettings.value.line_numbers) exts.push(lineNumbers());
  if (editorSettings.value.word_wrap) exts.push(EditorView.lineWrapping);
  exts.push(EditorState.tabSize.of(editorSettings.value.tab_size));
  exts.push(languageExtension.value);
  return exts;
});

const inputExtensions = computed(() => ([
  ...baseExtensions.value,
]));

const outputExtensions = computed(() => ([
  ...baseExtensions.value,
  EditorView.editable.of(false),
]));

async function runFormat() {
  error.value = '';
  try {
    output.value = await doFormat(selected.value, input.value);
    copied.value = false;
    formatted.value = true;
    if (formatTimer) clearTimeout(formatTimer);
    formatTimer = setTimeout(() => (formatted.value = false), 1200);
  } catch (e: any) {
    error.value = e?.stack ?? e?.message ?? String(e);
    output.value = '';
    formatted.value = false;
  }
}

async function loadPrettier() {
  if (prettierFormat && prettierPlugins) return;
  const getDefault = (m: any) => m?.default ?? m;
  const [
    standalone,
    babel,
    estree,
    html,
    postcss,
    typescript,
    xml,
  ] = await Promise.all([
    import('prettier/standalone.mjs'),
    import('prettier/plugins/babel.mjs'),
    import('prettier/plugins/estree.mjs'),
    import('prettier/plugins/html.mjs'),
    import('prettier/plugins/postcss.mjs'),
    import('prettier/plugins/typescript.mjs'),
    import('@prettier/plugin-xml'),
  ]);
  prettierFormat = standalone.format as PrettierFormat;
  prettierPlugins = {
    parserBabel: getDefault(babel),
    parserEstree: getDefault(estree),
    parserHtml: getDefault(html),
    parserPostcss: getDefault(postcss),
    parserTypescript: getDefault(typescript),
    parserXml: getDefault(xml),
  };
}

async function doFormat(fmt: Format, src: string): Promise<string> {
  if (!src.trim()) return '';
  await loadPrettier();
  if (!prettierFormat || !prettierPlugins) return src;
  const options = {
    printWidth: formatterSettings.value.print_width,
    tabWidth: formatterSettings.value.tab_width,
    semi: true,
    singleQuote: formatterSettings.value.single_quote,
    trailingComma: formatterSettings.value.trailing_comma as 'none' | 'es5' | 'all',
  };

  if (fmt === 'JSON') {
    return JSON.stringify(JSON.parse(src), null, 2);
  }
  if (fmt === 'JS') {
    return await prettierFormat(src, { ...options, parser: 'typescript', plugins: [prettierPlugins.parserTypescript, prettierPlugins.parserEstree] });
  }
  if (fmt === 'HTML') {
    return await prettierFormat(src, { ...options, parser: 'html', plugins: [prettierPlugins.parserHtml] });
  }
  if (fmt === 'CSS') {
    return await prettierFormat(src, { ...options, parser: 'css', plugins: [prettierPlugins.parserPostcss] });
  }
  if (fmt === 'YAML') {
    const yaml = await import('js-yaml');
    const data = yaml.load(src);
    return yaml.dump(data, {
      indent: formatterSettings.value.tab_width,
      lineWidth: formatterSettings.value.print_width,
      noCompatMode: true,
      sortKeys: false,
    });
  }
  if (fmt === 'XML') {
    return await prettierFormat(src, {
      ...options,
      printWidth: formatterSettings.value.xml_print_width,
      xmlWhitespaceSensitivity: 'ignore',
      parser: 'xml',
      plugins: [prettierPlugins.parserXml],
    });
  }
  return src;
}

async function copyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 1200);
  } catch (e: any) {
    error.value = e?.stack ?? e?.message ?? 'Copy failed';
  }
}

async function copyError() {
  if (!error.value) return;
  try {
    await navigator.clipboard.writeText(error.value);
  } catch (e: any) {
    error.value = e?.stack ?? e?.message ?? 'Copy failed';
  }
}

function clearInput() {
  input.value = '';
  output.value = '';
  error.value = '';
  copied.value = false;
  formatted.value = false;
}
</script>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tool-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 44px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: transparent;
}

.tool-tabs {
  display: flex;
  gap: 2px;
}
.tool-tab {
  padding: 4px 14px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
}
.tool-tab:hover { background: var(--bg-elevated); color: var(--text-primary); }
.tool-tab.active { background: var(--primary); color: #fff; }

.tool-split {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.tool-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
.tool-pane-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  padding: 6px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: rgba(12, 15, 24, 0.4);
}
.tool-error-label {
  color: var(--danger);
  text-transform: none;
  font-weight: 400;
  letter-spacing: 0;
  font-size: 11px;
  font-family: 'Cascadia Code', Consolas, monospace;
}

.tool-textarea {
  flex: 1;
  resize: none;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  padding: 16px;
  user-select: text;
}
.tool-textarea::placeholder { color: var(--text-muted); }
.tool-textarea-out { color: var(--text-secondary); }

.tool-resize-handle {
  width: 4px;
  flex-shrink: 0;
  background: var(--border);
  cursor: col-resize;
}
.tool-resize-handle:hover { background: var(--primary); }
.tool-icon-btn {
  height: 22px;
  padding-left: 10px;
  padding-right: 10px;
}
.tool-icon-btn.danger {
  color: var(--danger);
}
.tool-icon-btn.danger:hover {
  background: var(--danger-subtle);
  color: var(--danger);
}
.tool-icon-btn.success {
  color: var(--success);
}
.tool-icon-btn.success:hover {
  background: rgba(52, 211, 153, 0.15);
  color: var(--success);
}
.tool-copy-text {
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  color: var(--text-muted);
}
.tool-copy-text:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.tool-editor {
  flex: 1;
  min-height: 0;
}
:deep(.cm-editor) {
  height: 100%;
  background: transparent;
}
:deep(.cm-scroller) {
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: var(--editor-font-size);
  line-height: 1.7;
}
:deep(.cm-gutters) {
  background: transparent;
  border-right: 1px solid var(--border);
}
</style>
