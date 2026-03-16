<template>
  <div class="mdpad">

    <!-- Toolbar -->
    <div class="mdpad-toolbar">
      <div class="flex items-center gap-3">
        <span class="mdpad-title">MD Notepad</span>
        <span v-if="currentFile" class="mdpad-file-label">
          {{ currentFileName }}{{ dirty ? ' •' : '' }}
        </span>
      </div>
      <div class="mdpad-toolbar-actions">
        <button class="btn btn-ghost btn-sm" @click="wrapOrInsert('**', '**')" title="Bold">
          <Bold :size="14" />
        </button>
        <button class="btn btn-ghost btn-sm" @click="wrapOrInsert('*', '*')" title="Italic">
          <Italic :size="14" />
        </button>
        <button class="btn btn-ghost btn-sm" @click="insertAtCursor('# ')" title="Heading">
          <Heading1 :size="14" />
        </button>
        <button class="btn btn-ghost btn-sm" @click="wrapOrInsert('`', '`')" title="Code">
          <Code2 :size="14" />
        </button>
        <button class="btn btn-ghost btn-sm" @click="insertAtCursor('- ')" title="List">
          <List :size="14" />
        </button>
        <div class="mdpad-sep"></div>
        <button class="btn btn-primary btn-sm" @click="saveFile" :disabled="!dirty || !currentFile">
          <Save :size="14" />
          Save
        </button>
        <div class="mdpad-sep"></div>
        <div class="layout-btns">
          <button :class="['layout-btn', { active: layoutMode === 'editor' }]"  @click="layoutMode = 'editor'"  title="Editor only"><PanelLeft  :size="14" /></button>
          <button :class="['layout-btn', { active: layoutMode === 'split' }]"   @click="layoutMode = 'split'"   title="Split"><Columns2    :size="14" /></button>
          <button :class="['layout-btn', { active: layoutMode === 'preview' }]" @click="layoutMode = 'preview'" title="Preview only"><PanelRight :size="14" /></button>
        </div>
      </div>
    </div>

    <!-- Three-panel layout -->
    <div class="mdpad-split" ref="splitRef">

      <!-- File tree -->
      <div class="mdpad-tree-panel" :style="{ width: treeWidth + 'px' }">
        <div class="mdpad-panel-label">
          <span>Notes</span>
          <div class="flex gap-1">
            <button class="tree-action-btn" title="New File"   @click="startCreate('file', notesDir)">
              <FilePlus :size="13" />
            </button>
            <button class="tree-action-btn" title="New Folder" @click="startCreate('folder', notesDir)">
              <FolderPlus :size="13" />
            </button>
          </div>
        </div>

        <!-- Inline create -->
        <div v-if="creating" class="tree-create-row">
          <component :is="creating.type === 'folder' ? Folder : FileText" :size="12" class="tree-icon-sm" />
          <input
            ref="createInputRef"
            class="tree-create-input"
            v-model="createName"
            :placeholder="creating.type === 'folder' ? 'folder-name' : 'note.md'"
            @keydown.enter="commitCreate"
            @keydown.esc="creating = null"
          />
          <button class="create-ok"     @click="commitCreate"><Check :size="11" /></button>
          <button class="create-cancel" @click="creating = null"><X :size="11" /></button>
        </div>

        <div class="mdpad-tree-scroll">
          <TreeNode
            v-for="node in tree"
            :key="node.path"
            :node="node"
            :selected-path="currentFile"
            :depth="0"
            @select="openFile"
            @delete="deleteNode"
            @create-file="startCreate('file', $event)"
            @create-folder="startCreate('folder', $event)"
            @rename="renameNode"
            @move="moveNode"
          />
          <div v-if="tree.length === 0 && !creating" class="tree-empty">
            No notes yet.<br/>Click + to create one.
          </div>
        </div>
      </div>

      <!-- Resize handle: tree ↔ editor -->
      <div v-if="layoutMode !== 'preview'" class="resize-handle" @mousedown="startResize('tree', $event)"></div>

      <!-- Editor -->
      <div
        v-if="layoutMode !== 'preview'"
        class="mdpad-panel"
        ref="editorPanelRef"
        :style="layoutMode === 'split'
          ? { width: editorWidth + 'px', '--cm-font-size': cmFontSize + 'px' }
          : { flex: 1, '--cm-font-size': cmFontSize + 'px' }"
      >
        <div class="mdpad-panel-label"><span>Editor</span></div>
        <Codemirror
          v-if="currentFile"
          ref="cmRef"
          v-model="content"
          :extensions="cmExtensions"
          :style="{ flex: 1, overflow: 'hidden' }"
          @ready="onEditorReady"
          @change="onInput"
        />
        <div v-else class="mdpad-empty">Select or create a note</div>
      </div>

      <!-- Resize handle: editor ↔ preview -->
      <div v-if="layoutMode === 'split'" class="resize-handle" @mousedown="startResize('editor', $event)"></div>

      <!-- Preview -->
      <div v-if="layoutMode !== 'editor'" class="mdpad-panel" style="flex: 1; min-width: 150px;">
        <div class="mdpad-panel-label"><span>Preview</span></div>
        <div v-if="currentFile" class="mdpad-preview" v-html="rendered"></div>
        <div v-else class="mdpad-empty"></div>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, shallowRef, watch } from 'vue';
import TreeNode from '../components/TreeNode.vue';
import { Codemirror } from 'vue-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { lineNumbers, highlightActiveLine, EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  Bold, Italic, Heading1, Code2, List, Save,
  FilePlus, FolderPlus, Check, X, Folder, FileText,
  PanelLeft, Columns2, PanelRight
} from 'lucide-vue-next';
import { useStore } from 'vuex';
import { key } from '../store';

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
  isOpen?: boolean;
}

const fs = window.fileSystem;
const notesDir = fs.join(fs.homedir(), 'Toolbelt Notes');

// ── CodeMirror extensions ─────────────────────────────────────────────
const store = useStore(key);
const editorSettings = computed(() => store.getters.getEditorSettings);
const cmExtensions = computed(() => {
  const exts: any[] = [markdown(), highlightActiveLine()];
  if (editorSettings.value.theme === 'oneDark') exts.push(oneDark);
  if (editorSettings.value.line_numbers) exts.push(lineNumbers());
  if (editorSettings.value.word_wrap) exts.push(EditorView.lineWrapping);
  exts.push(EditorState.tabSize.of(editorSettings.value.tab_size));
  return exts;
});
const cmRef     = shallowRef<InstanceType<typeof Codemirror> | null>(null);
const editorView = shallowRef<EditorView | null>(null);

function onEditorReady(payload: { view: EditorView }) {
  editorView.value = payload.view;
}

// ── Layout mode ───────────────────────────────────────────────────────
type LayoutMode = 'editor' | 'split' | 'preview';
const layoutMode = ref<LayoutMode>('split');

// ── Panel sizes ───────────────────────────────────────────────────────
const splitRef      = ref<HTMLElement | null>(null);
const editorPanelRef = ref<HTMLElement | null>(null);
const treeWidth     = ref(200);
const editorWidth   = ref(0); // set on mount
const cmFontSize    = ref(13);

watch(editorSettings, (next) => {
  cmFontSize.value = next.font_size;
}, { immediate: true });

// ── File state ────────────────────────────────────────────────────────
const tree           = ref<FileNode[]>([]);
const currentFile    = ref('');
const content        = ref('');
const dirty          = ref(false);
const createInputRef = ref<HTMLInputElement | null>(null);
const creating       = ref<{ type: 'file' | 'folder'; dirPath: string } | null>(null);
const createName     = ref('');
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const currentFileName = computed(() => currentFile.value.split(fs.sep).pop() ?? '');

// ── Markdown ──────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
    .replace(/^##### (.+)$/gm,  '<h5>$1</h5>')
    .replace(/^#### (.+)$/gm,   '<h4>$1</h4>')
    .replace(/^### (.+)$/gm,    '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,     '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,      '<h1>$1</h1>')
    .replace(/^[-*_]{3,}$/gm,   '<hr>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,         '<em>$1</em>')
    .replace(/`(.+?)`/g,           '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^[-*+] (.+)$/gm,     '<li>$1</li>')
    .replace(/^&gt; (.+)$/gm,      '<blockquote>$1</blockquote>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');
}
const rendered = computed(() => renderMarkdown(content.value));

// ── Tree ──────────────────────────────────────────────────────────────
function loadTree() {
  if (!fs.exists(notesDir)) fs.mkdir(notesDir);
  tree.value = fs.readDir(notesDir)
    .filter(e => e.isDir || e.name.endsWith('.md'))
    .map(e => ({ ...e, children: e.isDir ? [] : undefined, isOpen: false }));
}

function openFile(filePath: string) {
  if (dirty.value && currentFile.value) saveFile();
  currentFile.value = filePath;
  content.value = fs.readFile(filePath);
  dirty.value = false;
}

function saveFile() {
  if (!currentFile.value) return;
  fs.writeFile(currentFile.value, content.value);
  dirty.value = false;
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
}

function onInput() {
  dirty.value = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveFile, 1500);
}

// ── Create ────────────────────────────────────────────────────────────
function startCreate(type: 'file' | 'folder', dirPath: string) {
  creating.value = { type, dirPath };
  createName.value = '';
  nextTick(() => createInputRef.value?.focus());
}

function commitCreate() {
  if (!creating.value || !createName.value.trim()) { creating.value = null; return; }
  const { type, dirPath } = creating.value;
  const raw = createName.value.trim();
  if (type === 'file') {
    const fileName = raw.endsWith('.md') ? raw : raw + '.md';
    const filePath = fs.join(dirPath, fileName);
    fs.writeFile(filePath, '');
    loadTree();
    openFile(filePath);
  } else {
    fs.mkdir(fs.join(dirPath, raw));
    loadTree();
  }
  creating.value = null;
}

// ── Delete / rename / move ────────────────────────────────────────────
function deleteNode(node: FileNode) {
  node.isDir ? fs.rmdir(node.path) : fs.unlink(node.path);
  if (currentFile.value === node.path) { currentFile.value = ''; content.value = ''; }
  loadTree();
}

function renameNode({ node, newName }: { node: FileNode; newName: string }) {
  const dir = node.path.slice(0, node.path.length - node.name.length);
  const newPath = fs.join(dir, newName);
  fs.rename(node.path, newPath);
  if (currentFile.value === node.path) currentFile.value = newPath;
  loadTree();
}

function moveNode({ fromPath, name, toDirPath }: { fromPath: string; name: string; toDirPath: string }) {
  const newPath = fs.join(toDirPath, name);
  if (fromPath === newPath) return;
  fs.rename(fromPath, newPath);
  if (currentFile.value === fromPath) currentFile.value = newPath;
  loadTree();
}

// ── Resize panels ─────────────────────────────────────────────────────
type ResizeTarget = 'tree' | 'editor';
let resizing: ResizeTarget | null = null;
let resizeStartX = 0;
let resizeStartW = 0;

function startResize(target: ResizeTarget, e: MouseEvent) {
  resizing = target;
  resizeStartX = e.clientX;
  resizeStartW = target === 'tree' ? treeWidth.value : editorWidth.value;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('mouseup', stopResize);
}

function onResizeMove(e: MouseEvent) {
  if (!resizing) return;
  const delta = e.clientX - resizeStartX;
  const totalW = splitRef.value?.clientWidth ?? 900;
  if (resizing === 'tree') {
    treeWidth.value = Math.max(140, Math.min(resizeStartW + delta, totalW * 0.4));
  } else {
    editorWidth.value = Math.max(150, Math.min(resizeStartW + delta, totalW * 0.6));
  }
}

function stopResize() {
  resizing = null;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', stopResize);
}

// ── Editor snippets ───────────────────────────────────────────────────
function wrapOrInsert(before: string, after: string) {
  const view = editorView.value;
  if (!view) return;
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  const insert = before + selected + after;
  view.dispatch({
    changes: { from, to, insert },
    selection: selected.length
      ? { anchor: from, head: from + insert.length }
      : { anchor: from + before.length }
  });
  dirty.value = true;
  view.focus();
}

function insertAtCursor(text: string) {
  const view = editorView.value;
  if (!view) return;
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length }
  });
  dirty.value = true;
  view.focus();
}

function onKeydown(ev: KeyboardEvent) {
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 's') { ev.preventDefault(); saveFile(); }
}

function onEditorWheel(e: WheelEvent) {
  if (!e.ctrlKey) return;
  e.preventDefault();
  cmFontSize.value = Math.min(28, Math.max(8, cmFontSize.value + (e.deltaY < 0 ? 1 : -1)));
}

onMounted(() => {
  loadTree();
  window.addEventListener('keydown', onKeydown);
  nextTick(() => {
    editorPanelRef.value?.addEventListener('wheel', onEditorWheel, { passive: false });
    const totalW = splitRef.value?.clientWidth ?? 900;
    editorWidth.value = Math.floor((totalW - treeWidth.value) / 2);
  });
});
onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer);
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', stopResize);
  editorPanelRef.value?.removeEventListener('wheel', onEditorWheel);
});
</script>

<style scoped>
.mdpad { display: flex; flex-direction: column; height: 100%; overflow: hidden; width: 100%; }

.mdpad-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px;
  height: 44px;
  background: transparent;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.mdpad-title    { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.mdpad-file-label { font-size: 12px; color: var(--text-muted); }
.mdpad-toolbar-actions { display: flex; align-items: center; gap: 2px; }
.mdpad-sep { width: 1px; height: 18px; background: var(--border); margin: 0 6px; }

/* Layout toggle */
.layout-btns {
  display: flex;
  gap: 1px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 2px;
}
.layout-btn {
  width: 26px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 5px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.12s;
}
.layout-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.layout-btn.active { background: var(--primary); color: #fff; }

/* Split */
.mdpad-split { display: flex; flex: 1; overflow: hidden; }

/* Resize handle */
.resize-handle {
  width: 4px;
  flex-shrink: 0;
  background: var(--border);
  cursor: col-resize;
  transition: background 0.15s;
}
.resize-handle:hover { background: var(--primary); }

/* Tree panel */
.mdpad-tree-panel {
  display: flex; flex-direction: column;
  flex-shrink: 0; overflow: hidden;
  background: transparent;
  min-width: 140px;
  border-right: 1px solid var(--border);
}
.mdpad-tree-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 4px 0; }
.tree-empty {
  padding: 24px 16px; font-size: 12px; color: var(--text-muted);
  text-align: center; line-height: 1.7;
}

/* Inline create */
.tree-create-row {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 8px; border-bottom: 1px solid var(--border);
}
.tree-icon-sm { font-size: 12px; flex-shrink: 0; color: var(--text-muted); }
.tree-create-input {
  flex: 1; min-width: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--primary);
  border-radius: 5px;
  color: var(--text-primary); font-size: 12px;
  padding: 3px 6px; outline: none; user-select: text;
}
.create-ok, .create-cancel {
  width: 20px; height: 20px; border: none; border-radius: 4px;
  background: transparent; cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.create-ok    { color: var(--success); }
.create-ok:hover { background: rgba(52,211,153,0.15); }
.create-cancel { color: var(--danger); }
.create-cancel:hover { background: var(--danger-subtle); }

/* Panel */
.mdpad-panel { display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden; min-width: 150px; }
.mdpad-panel-label {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text-muted); padding: 6px 12px;
  background: transparent;
  border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.tree-action-btn {
  width: 20px; height: 20px; border: none; border-radius: 4px;
  background: transparent; color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.tree-action-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

/* CodeMirror overrides */
:deep(.cm-editor) { height: 100%; background: transparent !important; }
:deep(.cm-scroller) { overflow: auto; font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace !important; font-size: var(--cm-font-size, 13px) !important; line-height: 1.7 !important; }
:deep(.cm-focused) { outline: none !important; }
:deep(.cm-content) { padding: 16px 20px !important; }

/* Preview */
.mdpad-preview {
  flex: 1; overflow-y: auto; padding: 20px 24px;
  background: transparent; color: var(--text-primary);
  font-size: 14px; line-height: 1.7; user-select: text;
}
.mdpad-preview :deep(h1),
.mdpad-preview :deep(h2),
.mdpad-preview :deep(h3),
.mdpad-preview :deep(h4) { color: var(--text-primary); font-weight: 600; margin: 1.2em 0 0.4em; }
.mdpad-preview :deep(h1) { font-size: 1.5em; }
.mdpad-preview :deep(h2) { font-size: 1.25em; }
.mdpad-preview :deep(h3) { font-size: 1.1em; }
.mdpad-preview :deep(code) {
  background: var(--bg-elevated); color: var(--accent);
  padding: 2px 6px; border-radius: 4px;
  font-family: 'Cascadia Code', monospace; font-size: 0.88em;
}
.mdpad-preview :deep(blockquote) {
  border-left: 3px solid var(--border); color: var(--text-secondary);
  padding-left: 16px; margin-left: 0; font-style: italic;
}
.mdpad-preview :deep(hr)     { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
.mdpad-preview :deep(ul)     { padding-left: 20px; list-style: disc; }
.mdpad-preview :deep(li)     { color: var(--text-primary); margin: 4px 0; }
.mdpad-preview :deep(a)      { color: var(--primary); text-decoration: underline; }
.mdpad-preview :deep(strong) { color: var(--text-primary); font-weight: 600; }
.mdpad-preview :deep(em)     { color: var(--text-secondary); }

.mdpad-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: var(--text-muted);
}
</style>
