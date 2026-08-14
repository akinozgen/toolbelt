<template>
  <div class="tree-node">
    <div
      class="tree-row"
      :class="{ selected: selectedPath === node.path, 'drag-over': isDragOver }"
      :style="{ paddingLeft: (depth ?? 0) * 14 + 8 + 'px' }"
      draggable="true"
      @click="handleClick"
      @dblclick="startRename"
      @contextmenu.prevent="onContextMenu"
      @dragstart="onDragStart"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <ChevronRight v-if="node.isDir && !node.isOpen" :size="12" class="tree-chevron" />
      <ChevronDown  v-else-if="node.isDir"            :size="12" class="tree-chevron" />
      <span v-else class="tree-chevron-spacer"></span>

      <FolderOpen v-if="node.isDir && node.isOpen" :size="14" class="tree-file-icon folder-open" />
      <Folder     v-else-if="node.isDir"           :size="14" class="tree-file-icon folder" />
      <FileText   v-else                            :size="14" class="tree-file-icon file" />

      <input
        v-if="isRenaming"
        ref="renameInput"
        class="tree-rename-input"
        v-model="renameValue"
        @keydown.enter="commitRename"
        @keydown.esc="isRenaming = false"
        @blur="isRenaming = false"
        @click.stop
      />
      <span v-else class="tree-name">{{ node.name }}</span>
    </div>

    <!-- Context menu teleported to body -->
    <Teleport to="body">
      <div
        v-if="showCtx"
        class="tree-ctx-global"
        :style="{ top: ctxY + 'px', left: ctxX + 'px' }"
        @click.stop
      >
        <template v-if="node.isDir">
          <div class="ctx-item" @click="emit('create-file', node.path); showCtx = false">
            <FilePlus :size="13" /> New File
          </div>
          <div class="ctx-item" @click="emit('create-folder', node.path); showCtx = false">
            <FolderPlus :size="13" /> New Folder
          </div>
          <div class="ctx-sep"></div>
        </template>
        <div class="ctx-item" @click="startRename(); showCtx = false">
          <Pencil :size="13" /> Rename
        </div>
        <div class="ctx-item danger" @click="emit('delete', node); showCtx = false">
          <Trash2 :size="13" /> Delete
        </div>
      </div>
    </Teleport>

    <!-- Children -->
    <template v-if="node.isDir && node.isOpen && node.children">
      <TreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :selected-path="selectedPath"
        :depth="(depth ?? 0) + 1"
        @select="emit('select', $event)"
        @delete="emit('delete', $event)"
        @create-file="emit('create-file', $event)"
        @create-folder="emit('create-folder', $event)"
        @rename="emit('rename', $event)"
        @move="emit('move', $event)"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import {
  ChevronRight, ChevronDown,
  Folder, FolderOpen, FolderPlus,
  FileText, FilePlus,
  Pencil, Trash2
} from 'lucide-vue-next';
import { tauriFs } from '../helpers/tauriFs';

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
  isOpen?: boolean;
}

const props = defineProps<{
  node: FileNode;
  selectedPath: string;
  depth?: number;
}>();

const emit = defineEmits<{
  (e: 'select', path: string): void;
  (e: 'delete', node: FileNode): void;
  (e: 'create-file', dirPath: string): void;
  (e: 'create-folder', dirPath: string): void;
  (e: 'rename', payload: { node: FileNode; newName: string }): void;
  (e: 'move', payload: { fromPath: string; name: string; toDirPath: string }): void;
}>();

// Context menu
const showCtx = ref(false);
const ctxX    = ref(0);
const ctxY    = ref(0);

function onContextMenu(e: MouseEvent) {
  ctxX.value = e.clientX;
  ctxY.value = e.clientY;
  showCtx.value = true;
}
const closeCtx = () => { showCtx.value = false; };
onMounted(()       => document.addEventListener('click', closeCtx));
onBeforeUnmount(() => document.removeEventListener('click', closeCtx));

// Rename
const isRenaming  = ref(false);
const renameValue = ref('');
const renameInput = ref<HTMLInputElement | null>(null);

function startRename() {
  isRenaming.value  = true;
  renameValue.value = props.node.name;
  nextTick(() => renameInput.value?.select());
}
function commitRename() {
  const n = renameValue.value.trim();
  if (n && n !== props.node.name) emit('rename', { node: props.node, newName: n });
  isRenaming.value = false;
}

// Click — load children asynchronously on expand
async function handleClick() {
  showCtx.value = false;
  if (props.node.isDir) {
    props.node.isOpen = !props.node.isOpen;
    if (props.node.isOpen && props.node.children?.length === 0) {
      const entries = await tauriFs.readDir(props.node.path);
      props.node.children = entries
        .filter(e => e.isDir || e.name.endsWith('.md'))
        .map(e => ({ ...e, children: e.isDir ? [] : undefined, isOpen: false }));
    }
  } else {
    emit('select', props.node.path);
  }
}

// Drag & drop
const isDragOver = ref(false);

function onDragStart(e: DragEvent) {
  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('application/toolbelt-node', JSON.stringify({
    path: props.node.path, name: props.node.name, isDir: props.node.isDir,
  }));
}
function onDragOver(e: DragEvent) {
  if (!props.node.isDir) return;
  e.dataTransfer!.dropEffect = 'move';
  isDragOver.value = true;
}
function onDragLeave() { isDragOver.value = false; }
function onDrop(e: DragEvent) {
  isDragOver.value = false;
  if (!props.node.isDir) return;
  const raw = e.dataTransfer!.getData('application/toolbelt-node');
  if (!raw) return;
  const dragged = JSON.parse(raw);
  if (dragged.path === props.node.path) return;
  emit('move', { fromPath: dragged.path, name: dragged.name, toDirPath: props.node.path });
}
</script>

<style scoped>
.tree-node { user-select: none; }

.tree-row {
  display: flex; align-items: center; gap: 4px;
  height: 28px; cursor: default;
  border-radius: 6px; margin: 1px 4px;
  font-size: 13px; color: var(--text-secondary);
  transition: background 0.1s, color 0.1s;
}
.tree-row:hover    { background: var(--bg-hover); color: var(--text-primary); }
.tree-row.selected { background: var(--accent-subtle); color: var(--accent); }
.tree-row.drag-over {
  background: var(--accent-subtle);
  outline: 1px solid var(--accent); outline-offset: -1px;
}

.tree-chevron        { color: var(--text-tertiary); flex-shrink: 0; }
.tree-chevron-spacer { width: 12px; flex-shrink: 0; }

.tree-file-icon { flex-shrink: 0; }
.tree-file-icon.folder      { color: #f59e0b; }
.tree-file-icon.folder-open { color: #fbbf24; }
.tree-file-icon.file        { color: var(--text-tertiary); }
.tree-row.selected .tree-file-icon { color: var(--accent); }

.tree-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.tree-rename-input {
  flex: 1; min-width: 0;
  background: transparent; border: 1px solid var(--accent);
  border-radius: 4px; color: var(--text-primary);
  font-size: 12px; padding: 1px 4px; outline: none; user-select: text;
}
</style>

<style>
.tree-ctx-global {
  position: fixed; z-index: var(--z-popover);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-1);
  min-width: 150px;
  box-shadow: var(--shadow-flyout);
}
.ctx-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 11px; border-radius: 6px;
  font-size: 12px; color: var(--text-secondary);
  cursor: default; transition: background 0.1s, color 0.1s;
}
.ctx-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.ctx-item.danger { color: var(--danger); }
.ctx-item.danger:hover { background: rgba(248,113,113,0.12); }
.ctx-sep { height: 1px; background: var(--border); margin: 3px 6px; }
</style>
