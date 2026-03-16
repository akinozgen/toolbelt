<template>
  <div class="files-page" ref="pageRef">
    <div class="files-sidebar" ref="sidebarRef" :style="{ width: sidebarWidth + 'px' }">
      <div class="files-section" :style="{ height: userPanelHeight + 'px' }">
        <div class="files-header">{{ userLabel }}</div>
        <div class="files-tree">
          <button
            v-for="u in userRoots"
            :key="u.realPath"
            class="user-link"
            :class="{ active: selectedPath === u.displayPath }"
            @click="selectNode(u)"
          >
            <span class="user-link-name">
              <component :is="userRootIcon(u.name)" class="user-link-icon" />
              {{ u.name }}
            </span>
          </button>
        </div>
      </div>
      <div class="files-resize" @mousedown="startResize">
        <span></span>
      </div>
      <div class="files-section files-section-grow">
        <div class="files-header">Drives</div>
        <div class="files-tree">
          <FileTreeNode
            v-for="root in roots"
            :key="root.realPath"
            :node="root"
            :depth="0"
            :selected-path="selectedPath"
            @toggle="toggleNode"
            @select="selectNode"
          />
        </div>
      </div>
    </div>

    <div class="files-resize-vertical" @mousedown="startResizeSidebar">
      <span></span>
    </div>
    <div class="files-main">
      <div class="files-header">
        <span>Path</span>
        <div class="files-path">
          <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path">
            <button class="files-crumb" @click="selectPath(crumb.path)" :class="{ active: crumb.path === selectedPath }">
              <span v-if="crumb.isRoot" class="files-crumb-home">
                <component :is="Monitor" />
              </span>
              <span v-else>{{ crumb.label }}</span>
            </button>
            <span v-if="i < breadcrumbs.length - 1" class="files-crumb-sep">/</span>
          </template>
        </div>
        <div class="files-actions">
          <button class="files-action" :class="{ active: !hideHidden }" title="Show hidden files" @click="toggleHidden">
            <component :is="hideHidden ? EyeOff : Eye" />
          </button>
          <button class="files-action" :class="{ active: showExtensions }" title="Show file extensions" @click="toggleExtensions">
            <component :is="FileType" />
          </button>
          <button class="files-action" :class="{ active: showSelection }" title="Show selection" @click="toggleSelection">
            <component :is="showSelection ? CheckSquare : SquareDashed" />
          </button>
          <button class="files-action" :class="{ active: detailsLoading }" title="Loading details">
            <component :is="Loader2" :class="['files-action-icon', { spin: detailsLoading }]" />
          </button>
        </div>
      </div>
      <div class="files-list" v-if="selectedPath">
        <div class="files-list-header" :style="{ gridTemplateColumns: listGridColumns }">
          <span v-if="showSelection" class="file-select"></span>
          <button class="files-sort" @click="setSort('name')">
            Name <span v-if="sortKey === 'name'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </button>
          <button class="files-sort" @click="setSort('type')">
            Type <span v-if="sortKey === 'type'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </button>
          <button class="files-sort size-col" @click="setSort('size')">
            Size <span v-if="sortKey === 'size'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </button>
          <button class="files-sort date-col" @click="setSort('mtime')">
            Modified <span v-if="sortKey === 'mtime'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </button>
        </div>
        <div v-for="item in listItems" :key="item.realPath" class="files-row" :style="{ gridTemplateColumns: listGridColumns }" @dblclick="item.isDir && selectNode(item)">
          <span v-if="showSelection" class="file-select">
            <input type="checkbox" :checked="isSelected(item.realPath)" @change="toggleSelected(item.realPath, $event)" />
          </span>
          <span class="file-name">
            <component :is="fileIcon(item)" class="file-icon" />
            <span class="file-name-text">
              <span class="file-name-base">{{ splitName(item.name).base }}</span
              ><span class="file-name-ext" v-if="showExtensions && splitName(item.name).ext">{{ splitName(item.name).ext }}</span>
            </span>
          </span>
          <span class="file-type">{{ item.isDir ? 'Folder' : 'File' }}</span>
          <span class="file-size">{{ item.isDir ? '' : formatSize(item.size) }}</span>
          <span class="file-date">{{ item.mtime ? formatDate(item.mtime) : '' }}</span>
        </div>
        <div v-if="!listItems.length" class="files-empty">Empty</div>
        <div v-if="listLoading" class="files-loading">
          <div class="spinner"></div>
          <span>Loading…</span>
        </div>
      </div>
      <div v-else class="files-home">
        <div class="files-home-section">
          <div class="files-home-title">User</div>
          <div class="files-home-grid">
            <button v-for="u in userRoots" :key="u.realPath" class="files-home-card" @click="selectNode(u)">
              <component :is="userRootIcon(u.name)" class="files-home-icon" />
              <span>{{ u.name }}</span>
            </button>
          </div>
        </div>
        <div class="files-home-section">
          <div class="files-home-title">Drives</div>
          <div class="files-home-grid">
            <button v-for="r in roots" :key="r.realPath" class="files-home-card" @click="selectNode(r)">
              <component :is="Folder" class="files-home-icon" />
              <span>{{ r.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
  File,
  Folder,
  FileText,
  FileJson,
  FileCode,
  FileImage,
  FileAudio,
  FileVideo,
  FileArchive,
  Monitor,
  FolderOpen,
  FolderDown,
  Film,
  Music,
  Eye,
  EyeOff,
  FileType,
  CheckSquare,
  SquareDashed,
  Loader2,
} from 'lucide-vue-next';
import FileTreeNode from '../components/FileTreeNode.vue';

interface FileNode {
  name: string;
  realPath: string;
  displayPath: string;
  isDir: boolean;
  isOpen?: boolean;
  children?: FileNode[];
  isRoot?: boolean;
  isLoading?: boolean;
  size?: number;
  mtime?: number;
}

const isWin = window.platform === 'win32';
const fsh = window.fileSystem;

const roots = ref<FileNode[]>([]);
const userRoots = ref<FileNode[]>([]);
const selectedPath = ref('');
const selectedRealPath = ref('');
const userLabel = ref('User');

const listItems = ref<FileNode[]>([]);
const listLoading = ref(false);
let listReqId = 0;
const detailsLoading = ref(false);
const autoDetailsLimit = 1200;
const hideHidden = ref(true);
const hideHiddenKey = 'toolbelt_files_hide_hidden';
const showExtensions = ref(true);
const showExtensionsKey = 'toolbelt_files_show_extensions';
const showSelection = ref(false);
const showSelectionKey = 'toolbelt_files_show_selection';
const selectedItems = ref<Record<string, boolean>>({});
const sortKey = ref<'name' | 'type' | 'size' | 'mtime'>('name');
const sortDir = ref<'asc' | 'desc'>('asc');
const pageRef = ref<HTMLElement | null>(null);
const sidebarRef = ref<HTMLElement | null>(null);
const userPanelHeight = ref(200);
const isResizing = ref(false);
const isResizingSidebar = ref(false);
const sidebarWidth = ref(260);

const minUserPanel = 120;
const minDrivesPanel = 140;
const userPanelKey = 'toolbelt_files_user_panel_height';
const sidebarWidthKey = 'toolbelt_files_sidebar_width';
const minSidebarWidth = 200;
const maxSidebarWidth = 420;

const listGridColumns = computed(() =>
  showSelection.value ? '28px 1fr 100px 120px 180px' : '1fr 100px 120px 180px'
);
const breadcrumbs = computed(() => buildBreadcrumbs(selectedPath.value || '/'));

function toRealPath(pseudo: string): string {
  if (!isWin) return pseudo;
  const m = pseudo.match(/^\/([a-zA-Z])(\/.*)?$/);
  if (m) {
    const drive = m[1].toUpperCase();
    const rest = (m[2] || '').replace(/^\//, '').replace(/\//g, '\\');
    return rest ? `${drive}:\\${rest}` : `${drive}:\\`;
  }
  return 'C:\\';
}

function toPseudoPath(real: string): string {
  if (!isWin) return real;
  const m = real.match(/^([a-zA-Z]):\\(.*)$/);
  if (!m) return '/';
  const drive = m[1].toUpperCase();
  const rest = m[2].replaceAll('\\', '/');
  return rest ? `/${drive}/${rest}` : `/${drive}`;
}

function buildRoots() {
  if (!isWin) {
    roots.value = [{
      name: '/',
      realPath: '/',
      displayPath: '/',
      isDir: true,
      isOpen: true,
      isRoot: true,
      children: [],
    }];
    return;
  }
  const drives: string[] = [];
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const path = `${letter}:\\`;
    if (fsh.exists(path)) drives.push(letter);
  }
  roots.value = drives.map(d => ({
    name: `${d}`,
    realPath: `${d}:\\`,
    displayPath: `/${d}`,
    isDir: true,
    isOpen: false,
    isRoot: true,
    children: [],
  }));
}

function isHiddenEntry(name: string): boolean {
  if (name.startsWith('.')) return true;
  if (isWin) {
    const lower = name.toLowerCase();
    if (lower === 'desktop.ini' || lower === 'thumbs.db') return true;
  }
  return false;
}

function filterEntries<T extends { name: string }>(entries: T[]): T[] {
  if (!hideHidden.value) return entries;
  return entries.filter(e => !isHiddenEntry(e.name));
}

async function readChildren(node: FileNode) {
  if (!node.isDir) return;
  node.isLoading = true;
  try {
    const entries = fsh.readDirAsync ? await fsh.readDirAsync(node.realPath) : fsh.readDir(node.realPath);
    const filtered = filterEntries(entries);
    node.children = filtered.map(e => ({
      name: e.name,
      realPath: e.path,
      displayPath: toPseudoPath(e.path),
      isDir: e.isDir,
      isOpen: false,
      children: [],
    })).sort((a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name)));
  } catch {
    node.children = [];
  } finally {
    node.isLoading = false;
  }
}

async function toggleNode(node: FileNode) {
  if (!node.isDir) return;
  node.isOpen = !node.isOpen;
  if (node.isOpen && (!node.children || node.children.length === 0)) {
    await readChildren(node);
  }
}

async function selectNode(node: FileNode) {
  if (!node.isDir) return;
  selectedPath.value = node.displayPath;
  selectedRealPath.value = node.realPath;
  await updateList();
  if (!node.isOpen) {
    node.isOpen = true;
    if (!node.children || node.children.length === 0) await readChildren(node);
  }
}

async function selectPath(pseudo: string) {
  if (!pseudo) {
    selectedPath.value = '';
    selectedRealPath.value = '';
    listItems.value = [];
    detailsLoading.value = false;
    collapseAll();
    return;
  }
  const real = toRealPath(pseudo);
  selectedPath.value = pseudo;
  selectedRealPath.value = real;
  await updateList();
}

function collapseAll() {
  const collapse = (node: FileNode) => {
    node.isOpen = false;
    node.isLoading = false;
    if (node.children) node.children = [];
  };
  roots.value.forEach(collapse);
  userRoots.value.forEach(collapse);
}

async function updateList() {
  if (!selectedRealPath.value) return;
  const reqId = ++listReqId;
  listLoading.value = true;
  detailsLoading.value = false;
  try {
    const entries = await fsh.readDirAsync(selectedRealPath.value);
    const filtered = filterEntries(entries);
    const mapped = filtered.map(e => ({
      name: e.name,
      realPath: e.path,
      displayPath: toPseudoPath(e.path),
      isDir: e.isDir,
      size: undefined,
      mtime: undefined,
    }));
    if (reqId === listReqId) listItems.value = sortItems(mapped);
    loadDetails(reqId);
  } catch {
    if (reqId === listReqId) listItems.value = [];
  } finally {
    if (reqId === listReqId) listLoading.value = false;
  }
}

async function loadDetails(reqIdOverride?: number) {
  if (!selectedRealPath.value || detailsLoading.value) return;
  const reqId = reqIdOverride ?? listReqId;
  detailsLoading.value = true;
  try {
    const entries = await fsh.readDirWithStats(selectedRealPath.value);
    const filtered = filterEntries(entries);
    const mapped = filtered.map(e => ({
      name: e.name,
      realPath: e.path,
      displayPath: toPseudoPath(e.path),
      isDir: e.isDir,
      size: (e as any).size ?? 0,
      mtime: (e as any).mtimeMs ?? 0,
    }));
    if (reqId === listReqId) listItems.value = sortItems(mapped);
  } catch {
    // ignore
  } finally {
    if (reqId === listReqId) detailsLoading.value = false;
  }
}

function buildBreadcrumbs(pathStr: string) {
  if (!pathStr) return [{ label: '/', path: '', isRoot: true }];
  if (isWin) {
    const parts = pathStr.replace(/\\/g, '/').split('/').filter(Boolean);
    const crumbs: { label: string; path: string; isRoot?: boolean }[] = [{ label: '/', path: '', isRoot: true }];
    let acc = '';
    parts.forEach(p => {
      acc += `/${p}`;
      crumbs.push({ label: p, path: acc });
    });
    return crumbs;
  }
  const parts = pathStr.split('/').filter(Boolean);
  const crumbs: { label: string; path: string; isRoot?: boolean }[] = [{ label: '/', path: '', isRoot: true }];
  let acc = '';
  parts.forEach(p => {
    acc += `/${p}`;
    crumbs.push({ label: p, path: acc });
  });
  return crumbs;
}

function sortItems(items: FileNode[]) {
  const dir = sortDir.value === 'asc' ? 1 : -1;
  return items.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    if (sortKey.value === 'name') return dir * a.name.localeCompare(b.name);
    if (sortKey.value === 'type') return dir * (a.isDir === b.isDir ? a.name.localeCompare(b.name) : (a.isDir ? -1 : 1));
    if (sortKey.value === 'size') {
      const as = a.isDir ? -1 : (a.size ?? 0);
      const bs = b.isDir ? -1 : (b.size ?? 0);
      return dir * (as - bs);
    }
    if (sortKey.value === 'mtime') {
      const am = a.isDir ? -1 : (a.mtime ?? 0);
      const bm = b.isDir ? -1 : (b.mtime ?? 0);
      return dir * (am - bm);
    }
    return 0;
  });
}

function setSort(key: 'name' | 'type' | 'size' | 'mtime') {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
  listItems.value = sortItems([...listItems.value]);
}

function formatSize(bytes?: number): string {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

function fileIcon(item: FileNode) {
  if (item.isDir) return Folder;
  const ext = getExt(item.name);
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff'].includes(ext)) return FileImage;
  if (['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'].includes(ext)) return FileAudio;
  if (['mp4', 'mkv', 'mov', 'avi', 'webm', 'mpeg'].includes(ext)) return FileVideo;
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return FileArchive;
  if (['json', 'jsonl'].includes(ext)) return FileJson;
  if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'vue', 'html', 'css', 'scss', 'sass', 'less', 'xml', 'yaml', 'yml', 'md', 'mdx', 'txt', 'log', 'env', 'ini', 'conf', 'toml'].includes(ext)) return FileCode;
  return FileText;
}

function getExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function splitName(name: string) {
  const i = name.lastIndexOf('.');
  if (i > 0 && i < name.length - 1) {
    return { base: name.slice(0, i), ext: name.slice(i) };
  }
  return { base: name, ext: '' };
}

function buildUserRoots() {
  const home = fsh.homedir();
  try {
    const base = home.replace(/\\/g, '/').split('/').filter(Boolean).pop();
    if (base) userLabel.value = base;
  } catch {}
  const candidates = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Videos', 'Music'];
  userRoots.value = candidates
    .map(name => {
      const realPath = fsh.join(home, name);
      return {
        name,
        realPath,
        displayPath: isWin ? toPseudoPath(realPath) : realPath,
        isDir: true,
        isOpen: false,
        children: [],
      } as FileNode;
    })
    .filter(n => fsh.exists(n.realPath));
}

function userRootIcon(name: string) {
  const key = name.toLowerCase();
  if (key.includes('desktop')) return Monitor;
  if (key.includes('documents')) return FolderOpen;
  if (key.includes('downloads')) return FolderDown;
  if (key.includes('pictures')) return FileImage;
  if (key.includes('videos')) return Film;
  if (key.includes('music')) return Music;
  return Folder;
}

onMounted(() => {
  buildRoots();
  buildUserRoots();
  if (sidebarRef.value) {
    const h = sidebarRef.value.getBoundingClientRect().height;
    const saved = Number(localStorage.getItem(userPanelKey));
    const base = Number.isFinite(saved) && saved > 0 ? saved : 200;
    userPanelHeight.value = Math.min(Math.max(base, minUserPanel), h - minDrivesPanel);
  }
  const hideSaved = localStorage.getItem(hideHiddenKey);
  if (hideSaved !== null) hideHidden.value = hideSaved === 'true';
  const extSaved = localStorage.getItem(showExtensionsKey);
  if (extSaved !== null) showExtensions.value = extSaved === 'true';
  const selSaved = localStorage.getItem(showSelectionKey);
  if (selSaved !== null) showSelection.value = selSaved === 'true';
  const savedWidth = Number(localStorage.getItem(sidebarWidthKey));
  if (Number.isFinite(savedWidth) && savedWidth > 0) {
    sidebarWidth.value = Math.min(Math.max(savedWidth, minSidebarWidth), maxSidebarWidth);
  }
});

function persistHidden() {
  localStorage.setItem(hideHiddenKey, String(hideHidden.value));
  updateList();
  roots.value.forEach(r => {
    if (r.isOpen) readChildren(r);
  });
  userRoots.value.forEach(r => {
    if (r.isOpen) readChildren(r);
  });
}

function toggleHidden() {
  hideHidden.value = !hideHidden.value;
  persistHidden();
}

function toggleExtensions() {
  showExtensions.value = !showExtensions.value;
  localStorage.setItem(showExtensionsKey, String(showExtensions.value));
}

function toggleSelection() {
  showSelection.value = !showSelection.value;
  localStorage.setItem(showSelectionKey, String(showSelection.value));
}

function isSelected(path: string) {
  return !!selectedItems.value[path];
}

function toggleSelected(path: string, e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) selectedItems.value[path] = true;
  else delete selectedItems.value[path];
}

function startResize(e: MouseEvent) {
  if (!sidebarRef.value) return;
  isResizing.value = true;
  const sidebarTop = sidebarRef.value.getBoundingClientRect().top;
  const sidebarHeight = sidebarRef.value.getBoundingClientRect().height;
  const onMove = (ev: MouseEvent) => {
    if (!isResizing.value) return;
    let next = ev.clientY - sidebarTop;
    next = Math.max(minUserPanel, next);
    next = Math.min(sidebarHeight - minDrivesPanel, next);
    userPanelHeight.value = next;
  };
  const onUp = () => {
    isResizing.value = false;
    localStorage.setItem(userPanelKey, String(userPanelHeight.value));
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function startResizeSidebar(e: MouseEvent) {
  if (!pageRef.value) return;
  isResizingSidebar.value = true;
  const pageLeft = pageRef.value.getBoundingClientRect().left;
  const onMove = (ev: MouseEvent) => {
    if (!isResizingSidebar.value) return;
    let next = ev.clientX - pageLeft;
    next = Math.max(minSidebarWidth, next);
    next = Math.min(maxSidebarWidth, next);
    sidebarWidth.value = next;
  };
  const onUp = () => {
    isResizingSidebar.value = false;
    localStorage.setItem(sidebarWidthKey, String(sidebarWidth.value));
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

onBeforeUnmount(() => {
  if (isResizing.value) {
    isResizing.value = false;
  }
  if (isResizingSidebar.value) {
    isResizingSidebar.value = false;
  }
});
</script>

<style scoped>
.files-page {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.files-sidebar {
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: relative;
}
.files-resize-vertical {
  width: 8px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}
.files-resize-vertical span {
  width: 3px;
  height: 32px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}
.files-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.files-section-grow {
  flex: 1;
  min-height: 0;
}
.files-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}
.files-tree {
  padding: 6px 6px 12px;
  overflow-y: auto;
}
.files-resize {
  height: 12px;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}
.files-resize span {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}
.user-link {
  width: 100%;
  text-align: left;
  padding: 6px 8px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-link:hover { background: rgba(255, 255, 255, 0.04); color: var(--text-primary); }
.user-link.active { background: var(--primary-subtle); color: var(--primary); }
.user-link-name { font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.user-link-icon { width: 14px; height: 14px; color: var(--text-muted); }
.files-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.files-path {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: none;
  letter-spacing: 0;
  font-family: 'Cascadia Code', Consolas, monospace;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.files-crumb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.files-crumb:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
}
.files-crumb.active {
  background: rgba(106, 132, 255, 0.12);
  border-color: rgba(106, 132, 255, 0.5);
  color: var(--primary);
}
.files-crumb-sep {
  color: rgba(255, 255, 255, 0.2);
}
.files-crumb-home svg {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}
.files-home {
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.files-home-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.files-home-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
}
.files-home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.files-home-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}
.files-home-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
}
.files-home-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}
.files-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.files-action {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}
.files-action svg { width: 16px; height: 16px; }
.files-action-icon.spin { animation: spin 0.8s linear infinite; }
.files-action:hover { background: rgba(255, 255, 255, 0.08); color: var(--text-primary); }
.files-action.active {
  color: var(--primary);
  border-color: rgba(106, 132, 255, 0.5);
  background: rgba(106, 132, 255, 0.12);
}
.files-list {
  flex: 1;
  overflow-y: auto;
  position: relative;
}
.files-list-header {
  display: grid;
  column-gap: 16px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.files-sort {
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
  text-align: left;
}
.files-row {
  display: grid;
  column-gap: 16px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13px;
  color: var(--text-primary);
}
.files-row:hover { background: rgba(255, 255, 255, 0.03); }
.file-name { user-select: text; display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; }
.file-name-text { display: flex; min-width: 0; align-items: center; }
.file-name-base { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.file-name-ext { white-space: nowrap; }
.file-icon { width: 16px; height: 16px; color: var(--text-muted); flex: 0 0 auto; }
.file-type { color: var(--text-muted); }
.file-size { color: var(--text-secondary); text-align: right; font-family: 'Cascadia Code', Consolas, monospace; font-variant-numeric: tabular-nums; }
.file-date { color: var(--text-secondary); font-family: 'Cascadia Code', Consolas, monospace; font-variant-numeric: tabular-nums; }
.files-empty {
  padding: 20px 14px;
  color: var(--text-muted);
  font-size: 12px;
}
.files-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  background: rgba(12, 14, 20, 0.4);
  backdrop-filter: blur(4px);
}
.spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.7);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@media (max-width: 900px) {
  .files-sidebar { width: 200px; }
}
</style>
.file-select {
  display: flex;
  align-items: center;
  justify-content: center;
}
.file-select input {
  width: 14px;
  height: 14px;
  accent-color: var(--primary);
}
