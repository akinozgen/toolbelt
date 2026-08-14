#!/usr/bin/env node
// Syncs a release version across package.json, src-tauri/tauri.conf.json and
// src-tauri/Cargo.toml so a `v*` tag is the single source of truth.
//
//   node scripts/set-version.mjs 1.4.0

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = (process.argv[2] ?? '').replace(/^v/, '').trim();

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`set-version: "${process.argv[2]}" is not a valid semver version`);
  process.exit(1);
}

function patchJson(relPath) {
  const file = resolve(root, relPath);
  const json = JSON.parse(readFileSync(file, 'utf8'));
  json.version = version;
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`  ${relPath} -> ${version}`);
}

function patchCargo(relPath) {
  const file = resolve(root, relPath);
  const src = readFileSync(file, 'utf8');
  // Only the first line-anchored `version = "..."` — that is the [package] one.
  let done = false;
  const out = src.replace(/^version\s*=\s*".*"$/m, (match) => {
    if (done) return match;
    done = true;
    return `version = "${version}"`;
  });
  if (!done) {
    console.error(`set-version: no [package] version found in ${relPath}`);
    process.exit(1);
  }
  writeFileSync(file, out);
  console.log(`  ${relPath} -> ${version}`);
}

console.log(`set-version: ${version}`);
patchJson('package.json');
patchJson('src-tauri/tauri.conf.json');
patchCargo('src-tauri/Cargo.toml');
