<template>
  <div class="tool-page">

    <div class="tool-topbar">
      <span class="tool-topbar-title">Diff</span>
      <div class="flex items-center gap-2">
        <select class="tool-lang-select" v-model="language">
          <option v-for="l in languages" :key="l" :value="l">{{ l }}</option>
        </select>
        <select class="tool-mode-select" v-model="mode">
          <option value="side">Side-by-side</option>
          <option value="unified">Unified</option>
        </select>
        <label class="tool-toggle">
          <input type="checkbox" v-model="readOnlyLeft" :disabled="mode === 'unified'">
          <span>Left read-only</span>
        </label>
        <label class="tool-toggle">
          <input type="checkbox" v-model="readOnlyRight">
          <span>Right read-only</span>
        </label>
        <label class="tool-toggle">
          <span>Context</span>
          <input class="tool-context" type="number" min="0" max="50" v-model.number="contextLines">
        </label>
        <button class="btn btn-ghost btn-sm tool-copy-patch" :class="{ success: copied }" @click="copyResult" :disabled="!left && !right">
          <Copy :size="14" />
          <span>{{ copied ? 'Copied' : 'Copy Patch' }}</span>
        </button>
        <button class="btn btn-ghost btn-sm tool-icon-btn danger" @click="clearAll" title="Clear">
          <Trash2 :size="14" />
        </button>
        <button class="btn btn-primary btn-sm" @click="compare">Compare</button>
      </div>
    </div>

    <div ref="mergeHost" class="merge-host"></div>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { lineNumbers, EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { Copy, Trash2 } from 'lucide-vue-next';
import { toolbeltCm } from '../styles/cm-theme';
import { unifiedPatch } from '../services/diff';
import { MergeView, unifiedMergeView } from '@codemirror/merge';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/lang-yaml';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { useStore } from 'vuex';
import { key } from '../store';

const store = useStore(key);
const diffSettings = computed(() => store.getters.getDiffSettings);
const editorSettings = computed(() => store.getters.getEditorSettings);

const left  = ref('name: Toolbelt\nversion: 1\nfeatures:\n  - formatter\n  - encoder\n  - requests');
const right = ref('name: Toolbelt\nversion: 2\nfeatures:\n  - formatter\n  - encoder\n  - requests\n  - diff');
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const languages = [
  'plain', 'json', 'tson', 'jsonl', 'yaml', 'html', 'css', 'js', 'ts', 'tsx', 'jsx', 'vue', 'http', 'php', 'blade', 'xml', 'md'
] as const;
type Lang = typeof languages[number];
const language = ref<Lang>(diffSettings.value.default_language as Lang);
const mode = ref<'side' | 'unified'>(diffSettings.value.default_view);
const readOnlyLeft = ref(diffSettings.value.left_readonly);
const readOnlyRight = ref(false);
const contextLines = ref(diffSettings.value.default_context);

const mergeHost = ref<HTMLElement | null>(null);
let mergeView: MergeView | null = null;
let unifiedView: EditorView | null = null;

const languageExtension = computed(() => {
  switch (language.value) {
    case 'json': return json();
    case 'tson': return json();
    case 'jsonl': return json();
    case 'yaml': return yaml();
    case 'html': return html();
    case 'css': return css();
    case 'js': return javascript();
    case 'ts': return javascript({ typescript: true });
    case 'tsx': return javascript({ typescript: true, jsx: true });
    case 'jsx': return javascript({ jsx: true });
    case 'vue': return html();
    case 'http': return [];
    case 'php': return php();
    case 'blade': return html();
    case 'xml': return xml();
    case 'md': return markdown();
    default: return [];
  }
});

const baseExtensions = computed(() => {
  const exts: any[] = [...toolbeltCm];
  if (editorSettings.value.line_numbers) exts.push(lineNumbers());
  if (editorSettings.value.word_wrap) exts.push(EditorView.lineWrapping);
  exts.push(EditorState.tabSize.of(editorSettings.value.tab_size));
  exts.push(languageExtension.value);
  return exts;
});

const leftListener = EditorView.updateListener.of((v) => {
  if (v.docChanged) left.value = v.state.doc.toString();
});
const rightListener = EditorView.updateListener.of((v) => {
  if (v.docChanged) right.value = v.state.doc.toString();
});

function buildView() {
  if (!mergeHost.value) return;
  destroyView();
  if (mode.value === 'side') {
    mergeView = new MergeView({
      parent: mergeHost.value,
      a: {
        doc: left.value,
        extensions: [
          ...baseExtensions.value,
          leftListener,
          readOnlyLeft.value ? EditorState.readOnly.of(true) : [],
          readOnlyLeft.value ? EditorView.editable.of(false) : [],
        ],
      },
      b: {
        doc: right.value,
        extensions: [
          ...baseExtensions.value,
          rightListener,
          readOnlyRight.value ? EditorState.readOnly.of(true) : [],
          readOnlyRight.value ? EditorView.editable.of(false) : [],
        ],
      },
      revertControls: false,
      highlightChanges: true,
    });
  } else {
    unifiedView = new EditorView({
      parent: mergeHost.value,
      doc: right.value,
      extensions: [
        ...baseExtensions.value,
        rightListener,
        unifiedMergeView({ original: left.value }),
        readOnlyRight.value ? EditorState.readOnly.of(true) : [],
        readOnlyRight.value ? EditorView.editable.of(false) : [],
      ],
    });
  }
}

function destroyView() {
  if (mergeView) {
    mergeView.destroy();
    mergeView = null;
  }
  if (unifiedView) {
    unifiedView.destroy();
    unifiedView = null;
  }
  if (mergeHost.value) {
    mergeHost.value.innerHTML = '';
  }
}

function compare() {
  buildView();
}

async function copyResult() {
  if (!left.value && !right.value) return;
  try {
    const patch = await unifiedPatch(left.value, right.value, contextLines.value);
    await navigator.clipboard.writeText(patch);
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 1200);
  } catch {}
}

function clearAll() {
  left.value = '';
  right.value = '';
  copied.value = false;
  buildView();
}

function setEditorDoc(view: EditorView | null, value: string) {
  if (!view) return;
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
}

watch([mode, language, readOnlyLeft, readOnlyRight], () => {
  buildView();
});

watch(baseExtensions, () => {
  buildView();
});

watch(diffSettings, (next) => {
  if (languages.includes(next.default_language as Lang)) {
    language.value = next.default_language as Lang;
  }
  mode.value = next.default_view;
  readOnlyLeft.value = next.left_readonly;
  contextLines.value = next.default_context;
}, { deep: true });

watch(contextLines, () => {
  // Used in patch copy only, no rebuild needed.
});

watch([left, right], () => {
  if (mode.value === 'side' && mergeView) {
    setEditorDoc(mergeView.a, left.value);
    setEditorDoc(mergeView.b, right.value);
  }
  if (mode.value === 'unified' && unifiedView) {
    setEditorDoc(unifiedView, right.value);
  }
});

onMounted(() => {
  buildView();
});

onBeforeUnmount(() => {
  destroyView();
});

</script>

<style scoped>
.tool-page {
  display: flex; flex-direction: column; height: 100%;
  overflow: hidden;
}
.tool-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; height: 44px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; background: transparent;
}
.tool-topbar-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.tool-split { display: flex; }
.tool-pane { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.tool-pane-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text-tertiary); padding: 6px 16px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; background: var(--bg-surface);
}
.tool-textarea {
  flex: 1; resize: none; background: transparent; border: none; outline: none;
  color: var(--text-primary); font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 13px; line-height: 1.7; padding: 16px; user-select: text;
}
.tool-textarea::placeholder { color: var(--text-tertiary); }
.tool-resize-handle { width: 4px; flex-shrink: 0; background: var(--border); cursor: col-resize; }
.tool-resize-handle:hover { background: var(--accent); }

.merge-host {
  flex: 1;
  min-height: 0;
}
:deep(.cm-editor) { height: 100%; background: transparent; }
:deep(.cm-scroller) {
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: var(--editor-font-size);
  line-height: 1.7;
}
:deep(.cm-gutters) { background: transparent; border-right: 1px solid var(--border); }
:deep(.cm-mergeView) { height: 100%; }
:deep(.cm-mergeView .cm-mergeView-original),
:deep(.cm-mergeView .cm-mergeView-target) {
  height: 100%;
}
:deep(.cm-mergeView-gap) {
  background: var(--border);
}

.tool-icon-btn { height: 22px; padding-left: 10px; padding-right: 10px; }
.tool-icon-btn.danger { color: var(--danger); }
.tool-icon-btn.danger:hover { background: var(--danger-subtle); color: var(--danger); }

.tool-copy-patch {
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  color: var(--text-tertiary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tool-copy-patch:hover { color: var(--text-primary); background: var(--bg-elevated); }
.tool-copy-patch.success { color: var(--success); }
.tool-copy-patch.success:hover { background: rgba(52, 211, 153, 0.15); color: var(--success); }

.tool-lang-select {
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 12px;
  outline: none;
  cursor: default;
}

.tool-mode-select {
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 12px;
  outline: none;
  cursor: default;
}
.tool-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-tertiary);
}
.tool-toggle input[type='checkbox'] {
  accent-color: var(--accent);
}
.tool-context {
  width: 56px;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 11px;
  outline: none;
}
</style>
