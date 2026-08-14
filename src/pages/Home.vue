<script lang="ts" setup>
import { computed, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import {
  Hash, NotebookPen, Braces, Binary, Wand2, KeyRound, Type, Palette,
  SendHorizontal, Diff, Regex, ArrowUpRight,
} from 'lucide-vue-next';
import { key } from '../store';

interface ToolEntry {
  path: string;
  name: string;
  blurb: string;
  icon: Component;
}

const tools: ToolEntry[] = [
  { path: '/hash',     name: 'Hash',     blurb: 'MD5, SHA-1, SHA-256 and SHA-512 for text or files', icon: Hash },
  { path: '/encode',   name: 'Encode',   blurb: 'Base64, Base64URL, Hex, URL, JWT and image',         icon: Binary },
  { path: '/format',   name: 'Format',   blurb: 'Pretty-print JSON, YAML, XML, JS, HTML and CSS',    icon: Braces },
  { path: '/generate', name: 'Generate', blurb: 'IDs, secrets, lorem, QR, time, IP, MAC and more',   icon: Wand2 },
  { path: '/crypto',   name: 'Crypto',   blurb: 'Bcrypt, Argon2, HMAC, AES, TOTP and password tests', icon: KeyRound },
  { path: '/text',     name: 'Text',     blurb: 'Sort, dedupe, case, escape, slugify, markdown',     icon: Type },
  { path: '/visual',   name: 'Visual',   blurb: 'Box shadow, gradient, grid, flex, bezier and more', icon: Palette },
  { path: '/diff',     name: 'Diff',     blurb: 'Compare two pieces of text side-by-side',           icon: Diff },
  { path: '/regex',    name: 'Regex',    blurb: 'Test patterns live with saved presets',             icon: Regex },
  { path: '/http',     name: 'HTTP',     blurb: 'Send requests with auth, body and headers',         icon: SendHorizontal },
  { path: '/notes',    name: 'Notes',    blurb: 'Markdown notes with a file tree',                   icon: NotebookPen },
];

const router = useRouter();
const store  = useStore(key);

function open(path: string) { router.push(path); }

const accentName = computed(() => {
  const a = store.state.app_settings.accent;
  return a.charAt(0).toUpperCase() + a.slice(1);
});
const themeName = computed(() => {
  const t = store.state.app_settings.theme;
  return t.charAt(0).toUpperCase() + t.slice(1);
});
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 5)  return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
});
</script>

<template>
  <div class="home">
    <header class="home-hero">
      <div class="home-hero-text">
        <div class="home-greeting">{{ greeting }}.</div>
        <h1 class="home-title">Toolbelt</h1>
        <p class="home-tagline">Pick a tool to get started.</p>
      </div>
    </header>

    <div class="home-grid">
      <button
        v-for="tool in tools"
        :key="tool.path"
        type="button"
        class="tool-card"
        @click="open(tool.path)"
      >
        <span class="tool-card-icon">
          <component :is="tool.icon" :size="20" />
        </span>
        <span class="tool-card-body">
          <span class="tool-card-name">{{ tool.name }}</span>
          <span class="tool-card-blurb">{{ tool.blurb }}</span>
        </span>
        <ArrowUpRight :size="14" class="tool-card-arrow" />
      </button>
    </div>

    <footer class="home-footer">
      <span class="home-meta">Theme · {{ themeName }}</span>
      <span class="home-dot">•</span>
      <span class="home-meta">Accent · {{ accentName }}</span>
    </footer>
  </div>
</template>

<style scoped>
.home {
  height: 100%;
  overflow-y: auto;
  padding: var(--space-8) var(--space-8) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 1080px;
  margin: 0 auto;
  width: 100%;
}

.home-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-6);
  padding-bottom: var(--space-2);
}
.home-hero-text { display: flex; flex-direction: column; gap: 2px; }
.home-greeting {
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.home-title {
  font-size: 28px;
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}
.home-tagline {
  font-size: var(--fs-body);
  color: var(--text-secondary);
  margin: 0;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-3);
}

.tool-card {
  display: grid;
  grid-template-columns: 36px 1fr 16px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  text-align: left;
  cursor: default;
  font-family: inherit;
  color: var(--text-primary);
  transition: background var(--motion-fast) var(--ease-standard),
              border-color var(--motion-fast) var(--ease-standard),
              transform var(--motion-fast) var(--ease-standard);
}
.tool-card:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}
.tool-card:hover .tool-card-arrow { color: var(--accent); transform: translate(2px, -2px); }
.tool-card:active { transform: scale(0.99); }

.tool-card-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  background: var(--accent-subtle);
  color: var(--accent);
  flex-shrink: 0;
}

.tool-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.tool-card-name {
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
}
.tool-card-blurb {
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tool-card-arrow {
  color: var(--text-tertiary);
  transition: color var(--motion-fast) var(--ease-standard),
              transform var(--motion-base) var(--ease-decel);
}

.home-footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  margin-top: auto;
}
.home-meta {
  font-size: var(--fs-caption);
  color: var(--text-tertiary);
}
.home-dot {
  color: var(--text-tertiary);
  opacity: 0.5;
}
</style>
