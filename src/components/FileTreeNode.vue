<script lang="ts" setup>
import { computed } from 'vue';
import { Folder, File, ChevronRight, ChevronDown, HardDrive, Loader2 } from 'lucide-vue-next';

interface FileNode {
  name: string;
  realPath: string;
  displayPath: string;
  isDir: boolean;
  isOpen?: boolean;
  children?: FileNode[];
  isRoot?: boolean;
  isLoading?: boolean;
}

const props = defineProps<{
  node: FileNode;
  depth: number;
  selectedPath: string;
}>();

const emit = defineEmits<{
  (e: 'toggle', node: FileNode): void;
  (e: 'select', node: FileNode): void;
}>();

const isSelected = computed(() => props.selectedPath === props.node.displayPath);
</script>

<template>
  <div class="file-node" :class="{ selected: isSelected }" :style="{ paddingLeft: `${8 + depth * 12}px` }">
    <button class="node-caret" v-if="node.isDir" @click.stop="emit('toggle', node)">
      <ChevronDown v-if="node.isOpen" :size="14" />
      <ChevronRight v-else :size="14" />
    </button>
    <span v-else class="node-caret-spacer"></span>

    <span class="node-icon">
      <Loader2 v-if="node.isLoading" :size="14" class="spin" />
      <HardDrive v-else-if="node.isRoot" :size="14" />
      <Folder v-else-if="node.isDir" :size="14" />
      <File v-else :size="14" />
    </span>

    <button class="node-label" @click="emit('select', node)">
      {{ node.name }}
    </button>
  </div>

  <div v-if="node.isDir && node.isOpen && node.children?.length">
    <FileTreeNode
      v-for="child in node.children"
      :key="child.realPath"
      :node="child"
      :depth="depth + 1"
      :selected-path="selectedPath"
      @toggle="emit('toggle', $event)"
      @select="emit('select', $event)"
    />
  </div>
</template>

<style scoped>
.file-node {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  color: var(--text-secondary);
  border-radius: 6px;
}
.file-node:hover { background: rgba(255, 255, 255, 0.04); color: var(--text-primary); }
.file-node.selected { background: var(--primary-subtle); color: var(--primary); }
.node-caret, .node-label {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
}
.node-caret { width: 18px; display: inline-flex; align-items: center; justify-content: center; }
.node-caret-spacer { width: 18px; display: inline-flex; }
.node-icon { width: 16px; display: inline-flex; justify-content: center; }
.node-label { text-align: left; flex: 1; font-size: 12px; }
.node-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
