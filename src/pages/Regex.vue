<template>
  <div class="tool-page">

    <!-- Pattern bar -->
    <div class="tool-topbar">
      <span class="regex-slash">/</span>
      <input
        class="regex-pattern"
        v-model="pattern"
        placeholder="pattern"
        spellcheck="false"
        @input="run"
      />
      <span class="regex-slash">/</span>
      <div class="regex-flags">
        <button
          v-for="f in allFlags"
          :key="f"
          :class="['flag-btn', { active: flags.includes(f) }]"
          @click="toggleFlag(f)"
        >{{ f }}</button>
      </div>
      <span v-if="error" class="regex-error">{{ error }}</span>
      <span v-else-if="pattern && matches.length" class="regex-match-count">{{ matches.length }} match{{ matches.length > 1 ? 'es' : '' }}</span>
      <div class="flex items-center gap-2 ml-auto">
        <button class="btn btn-ghost btn-sm tool-icon-btn" :class="{ success: copied }" @click="copyMatches" :disabled="!matches.length" :title="copied ? 'Copied' : 'Copy'">
          <Copy :size="14" />
        </button>
        <button class="btn btn-ghost btn-sm tool-icon-btn danger" @click="clearAll" title="Clear">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <div class="regex-presets">
      <div class="regex-presets-left">
        <select class="preset-select" v-model="selectedPresetId" @change="applyPreset">
          <option value="">Presets</option>
          <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button class="btn btn-ghost btn-sm preset-btn" @click="useCurrentAsPreset">New</button>
        <button class="btn btn-ghost btn-sm preset-btn" :disabled="!selectedPreset" @click="updatePreset">Update</button>
        <button class="btn btn-ghost btn-sm preset-btn danger" :disabled="!selectedPreset || selectedPreset.builtin" @click="deletePreset">Delete</button>
      </div>
      <div class="regex-presets-right">
        <input class="preset-input" v-model="presetName" placeholder="Preset name" spellcheck="false" />
      </div>
    </div>

    <!-- Test string -->
    <div class="regex-input-wrap">
      <div class="tool-pane-label">
        <span>Test String</span>
        <button class="btn btn-ghost btn-sm tool-icon-btn danger" @click="clearTest" title="Clear Test String">
          <Trash2 :size="14" />
        </button>
      </div>
      <div class="regex-highlight-wrap">
        <!-- Highlighted layer (behind) -->
        <div ref="hlRef" class="regex-highlights" aria-hidden="true" v-html="highlighted" />
        <!-- Real textarea (on top, transparent text) -->
        <textarea
          ref="taRef"
          class="regex-textarea"
          v-model="testStr"
          @input="run"
          @scroll="syncScroll"
          placeholder="Type test string here..."
          spellcheck="false"
        />
      </div>
    </div>

    <div class="tool-pane-label" style="border-top: 1px solid var(--border);">
      <span>Matches</span>
      <button class="btn btn-ghost btn-sm tool-copy-text" @click="copyMatches" :disabled="!matches.length">
        Copy Matches
      </button>
    </div>

    <!-- Match list -->
    <div class="regex-matches">
      <div v-if="!pattern || !testStr" class="regex-empty">Enter a pattern and test string above</div>
      <div v-else-if="error" class="regex-empty" style="color: var(--danger);">{{ error }}</div>
      <div v-else-if="!matches.length" class="regex-empty">No matches</div>
      <template v-else>
        <div v-for="(m, i) in matches" :key="i" class="match-row">
          <span class="match-index">#{{ i + 1 }}</span>
          <span class="match-value">{{ m[0] }}</span>
          <span class="match-pos">index {{ m.index }}</span>
          <template v-if="m.length > 1">
            <span class="match-groups">
              Groups: {{ m.slice(1).map((g, gi) => `$${gi + 1}=${JSON.stringify(g)}`).join('  ') }}
            </span>
          </template>
        </div>
      </template>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { Copy, Trash2 } from 'lucide-vue-next';
import { useStore } from 'vuex';
import { key } from '../store';

const store = useStore(key);
const regexSettings = computed(() => store.getters.getRegexSettings);

const allFlags = ['g', 'i', 'm', 's'];
const pattern  = ref('');
const flags    = ref(regexSettings.value.default_flags);
const testStr  = ref('');
const error    = ref('');

interface Match extends RegExpExecArray {}
const matches  = ref<Match[]>([]);
const copied   = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
const taRef = ref<HTMLTextAreaElement | null>(null);
const hlRef = ref<HTMLDivElement | null>(null);

type Preset = { id: string; name: string; pattern: string; flags: string; builtin?: boolean };
const presets = ref<Preset[]>([
  { id: 'email', name: 'Email', pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}', flags: 'g', builtin: true },
  { id: 'url', name: 'URL', pattern: 'https?:\\/\\/[\\w.-]+(?:\\/[\\w./?%&=-]*)?', flags: 'g', builtin: true },
  { id: 'ipv4', name: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g', builtin: true },
  { id: 'uuid', name: 'UUID', pattern: '\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\\b', flags: 'g', builtin: true },
  { id: 'hex', name: 'Hex Color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'g', builtin: true },
  { id: 'date', name: 'ISO Date', pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b', flags: 'g', builtin: true },
]);
const selectedPresetId = ref('');
const presetName = ref('');

const selectedPreset = computed(() => presets.value.find((p) => p.id === selectedPresetId.value));

const allowHighlight = computed(() => regexSettings.value.highlight_matches);

const presetStorageKey = 'toolbelt_regex_presets';

function loadPresets() {
  if (!regexSettings.value.persist_presets) return;
  try {
    const raw = localStorage.getItem(presetStorageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const builtins = presets.value.filter((p) => p.builtin);
      const custom = parsed.filter((p: any) => p && !p.builtin);
      presets.value = [...builtins, ...custom];
    }
  } catch {}
}

function savePresets() {
  if (!regexSettings.value.persist_presets) return;
  try {
    const custom = presets.value.filter((p) => !p.builtin);
    localStorage.setItem(presetStorageKey, JSON.stringify(custom));
  } catch {}
}

function toggleFlag(f: string) {
  flags.value = flags.value.includes(f)
    ? flags.value.replace(f, '')
    : flags.value + f;
  run();
}

function run() {
  error.value  = '';
  matches.value = [];
  if (!pattern.value || !testStr.value) return;
  try {
    const f   = flags.value.includes('g') ? flags.value : flags.value + 'g';
    const re  = new RegExp(pattern.value, f);
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = re.exec(testStr.value)) !== null) {
      matches.value.push(m as Match);
      if (!f.includes('g')) break;
      if (m[0] === '') {
        if (re.lastIndex < testStr.value.length) re.lastIndex++;
        else break;
      }
      guard++;
      if (guard > 2000) {
        error.value = 'Too many matches';
        break;
      }
    }
  } catch (e: any) {
    error.value = e.message;
  }
}

async function copyMatches() {
  if (!matches.value.length) return;
  try {
    const text = matches.value.map((m) => m[0]).join('\n');
    await navigator.clipboard.writeText(text);
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 1200);
  } catch {}
}

function clearAll() {
  pattern.value = '';
  flags.value = 'g';
  testStr.value = '';
  matches.value = [];
  error.value = '';
  copied.value = false;
}

function clearTest() {
  testStr.value = '';
  matches.value = [];
  error.value = '';
  copied.value = false;
}

function syncScroll() {
  const ta = taRef.value;
  const hl = hlRef.value;
  if (!ta || !hl) return;
  hl.scrollTop = ta.scrollTop;
  hl.scrollLeft = ta.scrollLeft;
}

function applyPreset() {
  const p = selectedPreset.value;
  if (!p) return;
  pattern.value = p.pattern;
  flags.value = p.flags.includes('g') ? p.flags : p.flags + 'g';
  presetName.value = p.name;
  run();
}

function useCurrentAsPreset() {
  if (!pattern.value.trim()) return;
  const name = presetName.value.trim() || `Preset ${presets.value.length + 1}`;
  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  presets.value.push({ id, name, pattern: pattern.value, flags: flags.value });
  selectedPresetId.value = id;
}

function updatePreset() {
  const p = selectedPreset.value;
  if (!p || p.builtin) return;
  p.name = presetName.value.trim() || p.name;
  p.pattern = pattern.value;
  p.flags = flags.value;
}

function deletePreset() {
  const p = selectedPreset.value;
  if (!p || p.builtin) return;
  presets.value = presets.value.filter((x) => x.id !== p.id);
  selectedPresetId.value = '';
  presetName.value = '';
}

watch(presets, () => {
  savePresets();
}, { deep: true });

watch(regexSettings, (next) => {
  flags.value = next.default_flags;
  if (next.persist_presets) {
    loadPresets();
  }
  run();
}, { deep: true });

onMounted(() => {
  loadPresets();
});

const highlighted = computed(() => {
  if (!pattern.value || !testStr.value || error.value || !allowHighlight.value) {
    return escHtml(testStr.value);
  }
  try {
    const f  = flags.value.includes('g') ? flags.value : flags.value + 'g';
    const re = new RegExp(pattern.value, f);
    return highlightMatches(testStr.value, re);
  } catch {
    return escHtml(testStr.value);
  }
});

function escHtml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function highlightMatches(text: string, re: RegExp) {
  let result = '';
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let guard = 0;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    result += escHtml(text.slice(lastIndex, start));
    result += `<mark class="hl">${escHtml(m[0])}</mark>`;
    lastIndex = end;
    if (!re.flags.includes('g')) break;
    if (m[0] === '') {
      if (re.lastIndex < text.length) re.lastIndex++;
      else break;
    }
    guard++;
    if (guard > 2000) {
      result += escHtml(text.slice(lastIndex));
      return result;
    }
  }
  result += escHtml(text.slice(lastIndex));
  return result;
}
</script>

<style scoped>
.tool-page {
  display: flex; flex-direction: column; height: 100%;
  overflow: hidden;
}

.tool-topbar {
  display: flex; align-items: center; gap: 8px;
  padding: 0 16px; height: 44px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; background: transparent;
}
.regex-slash { font-size: 18px; color: var(--accent); font-weight: 300; line-height: 1; }
.regex-pattern {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--text-primary); font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 14px; user-select: text;
}
.regex-pattern::placeholder { color: var(--text-tertiary); }
.regex-flags { display: flex; gap: 3px; }
.flag-btn {
  width: 24px; height: 22px; border-radius: 4px; border: 1px solid var(--border);
  background: transparent; color: var(--text-tertiary); font-size: 12px;
  font-family: 'Cascadia Code', monospace; cursor: default; transition: all 0.12s;
  display: flex; align-items: center; justify-content: center;
}
.flag-btn:hover  { border-color: var(--accent); color: var(--accent); }
.flag-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.regex-error       { font-size: 12px; color: var(--danger); font-family: monospace; }
.regex-match-count { font-size: 12px; color: var(--success); }

.regex-input-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.tool-pane-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text-tertiary); padding: 6px 16px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; background: transparent;
  display: flex; align-items: center; justify-content: space-between;
}

.regex-highlight-wrap { position: relative; flex: 1; overflow: hidden; }
.regex-highlights, .regex-textarea {
  position: absolute; inset: 0;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 13px; line-height: 1.7;
  padding: 16px; white-space: pre-wrap; word-break: break-all;
  overflow: auto;
}
.regex-highlights {
  color: transparent; pointer-events: none; z-index: 0;
}
.regex-highlights :deep(.hl) {
  background: var(--accent-subtle);
  border-radius: 2px;
  color: transparent;
}
.regex-textarea {
  background: transparent; border: none; outline: none; resize: none;
  color: var(--text-primary); z-index: 1; user-select: text;
}
.regex-textarea::placeholder { color: var(--text-tertiary); }

.regex-matches { flex: 0 0 auto; max-height: 200px; overflow-y: auto; }
.regex-empty { padding: 20px 16px; font-size: 13px; color: var(--text-tertiary); }
.match-row {
  display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap;
  padding: 5px 16px; border-bottom: 1px solid rgba(50,58,88,0.3);
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 12px;
}
.match-row:hover { background: var(--bg-elevated); }
.match-index { color: var(--text-tertiary); min-width: 24px; }
.match-value { color: var(--accent); font-weight: 600; user-select: text; }
.match-pos   { color: var(--text-tertiary); font-size: 11px; }
.match-groups { color: var(--accent); font-size: 11px; user-select: text; }

.tool-icon-btn { height: 22px; padding-left: 10px; padding-right: 10px; }
.tool-icon-btn.danger { color: var(--danger); }
.tool-icon-btn.danger:hover { background: var(--danger-subtle); color: var(--danger); }
.tool-icon-btn.success { color: var(--success); }
.tool-icon-btn.success:hover { background: rgba(52, 211, 153, 0.15); color: var(--success); }
.tool-copy-text {
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  color: var(--text-tertiary);
}
.tool-copy-text:hover { color: var(--text-primary); background: var(--bg-elevated); }

.regex-presets {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  border-bottom: 1px solid var(--border);
  background: transparent;
  gap: 8px;
}
.regex-presets-left { display: flex; align-items: center; gap: 8px; }
.regex-presets-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.preset-select {
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 12px;
  outline: none;
  cursor: default;
}
.preset-input {
  padding: 5px 10px;
  border-radius: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  min-width: 180px;
}
.preset-btn {
  height: 24px;
  padding: 0 10px;
  font-size: 11px;
  color: var(--text-tertiary);
}
.preset-btn:hover { color: var(--text-primary); background: var(--bg-elevated); }
.preset-btn.danger { color: var(--danger); }
.preset-btn.danger:hover { background: var(--danger-subtle); color: var(--danger); }
</style>
