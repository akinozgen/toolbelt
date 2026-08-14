# Toolbelt

An offline desktop toolbox for the small utilities you'd otherwise google every day —
hashing, encoding, formatting, ID generation, regex testing, HTTP calls and more, in
one native window.

[![Release](https://img.shields.io/github/v/release/akinozgen/toolbelt?sort=semver)](https://github.com/akinozgen/toolbelt/releases)
[![License](https://img.shields.io/github/license/akinozgen/toolbelt)](LICENSE)
![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20Linux%20%7C%20macOS-informational)

## Why

Every one of these tools exists as a website, and that's exactly the problem. When
`md5.cz` went down for a couple of weeks I lost a reflex I'd built over years: alt-tab,
paste, copy, alt-tab back, without lifting my hands off the keyboard. The replacements
were slower, ad-ridden, or wanted my data on someone else's server.

Toolbelt is where those tools live now — locally, offline, and mine.

Everything runs on the machine. Nothing is uploaded, nothing phones home, no telemetry.
The only network traffic the app ever makes is the request **you** type into the HTTP
tool.

## Tools

| Section      | What's inside                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Hash**     | MD5, SHA-1, SHA-256, SHA-512 — over text, raw bytes or a file picked from disk                                                     |
| **Encode**   | Base64, Base64URL, Hex, URL, JWT decode; image → Data URI / HTML / CSS                                                             |
| **Format**   | Pretty-print and minify JSON, YAML, XML, JavaScript, HTML, CSS (Prettier-backed, configurable)                                     |
| **Diff**     | Side-by-side or unified text comparison with syntax highlighting                                                                   |
| **Regex**    | Live match highlighting, capture groups, `g/i/m/s` flags, built-in and saved presets                                               |
| **HTTP**     | GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS, query params, headers, Bearer / Basic / API-Key auth, body editor, pretty response viewer  |
| **Generate** | UUID v4 & v7, ULID, NanoID, Snowflake, CUID2 · passwords, random bytes, AES keys, RSA key pairs · lorem ipsum, placeholder images · QR generate & read · time conversion · IPv4/IPv6/MAC/user-agent |
| **Crypto**   | Bcrypt, Argon2, PBKDF2 · HMAC, AES-GCM encrypt/decrypt · TOTP codes · password strength (zxcvbn)                                   |
| **Text**     | Sort, dedupe, trim, case conversion, slugify, Markdown → HTML, escape/unescape, character & word counter                           |
| **Visual**   | Box shadow, text shadow, CSS filters, glassmorphism, gradients, background patterns, CSS grid & flexbox playgrounds, border radius, transforms, cubic-bezier |
| **Notes**    | Markdown scratchpad ("MDpad") with a file tree, live preview and `Ctrl+S` save                                                     |

Plus a settings screen for theme (dark/light), accent colour, sidebar mode, start page,
editor preferences and per-tool defaults.

## Install

Grab the latest build from [Releases](https://github.com/akinozgen/toolbelt/releases):

| Platform | File                             | Notes                                                        |
| -------- | -------------------------------- | ------------------------------------------------------------ |
| Windows  | `Toolbelt_<version>_x64-setup.exe`    | Inno Setup installer; pulls the WebView2 runtime if missing |
| Windows  | `Toolbelt_<version>_x64-portable.exe` | Single executable, no installation                          |
| Linux    | `Toolbelt_<version>_amd64.AppImage`   | `chmod +x` and run                                          |
| Linux    | `Toolbelt_<version>_amd64.deb`        | Debian / Ubuntu package                                     |

Builds are unsigned, so Windows SmartScreen will ask for a confirmation on first run.
Verify downloads against `SHA256SUMS.txt` attached to each release.

macOS isn't built in CI yet — it works fine from source (see below).

## Tech

Migrated from Electron to **Tauri 2** — a ~10 MB binary instead of a bundled Chromium,
and the heavy lifting (hashing, KDFs, formatting, diffing, HTTP) happens in Rust rather
than JavaScript.

- **Frontend** — Vue 3 + TypeScript + Vite, Vuex for settings, Vue Router, Tailwind and
  CSS custom properties for theming, CodeMirror 6 for every editor surface
- **Backend** — Rust commands under `src-tauri/src/commands/` (`hash`, `encode`,
  `format`, `diff`, `markdown`, `http`, `image`, `generate`, `crypto`, `text`, `system`)
- **Frontend ↔ backend** — thin typed wrappers in `src/services/`, one per command module

```
src/
  pages/        one screen per sidebar entry, sub-tools in same-named folders
  components/   shared UI primitives (ui/) and tree views
  services/     typed invoke() wrappers around the Rust commands
  store/        persisted settings
src-tauri/
  src/commands/ the Rust side
  inno/         Windows installer script
```

## Build from source

Prerequisites: **Node 18+**, **Rust (stable)**, and the
[Tauri system dependencies](https://tauri.app/start/prerequisites/) for your platform.

On Debian/Ubuntu that means:

```bash
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
                 librsvg2-dev libssl-dev libxdo-dev patchelf build-essential
```

Then:

```bash
npm install
npm run dev      # dev build with hot reload
npm run build    # production build + platform bundles
```

Handy extras: `npm run dev:vite` / `npm run build:vite` run the frontend alone in a
browser, which is quicker for pure UI work (anything calling a Rust command will fail
there).

## Releasing

Version numbers come from the git tag — `scripts/set-version.mjs` writes it into
`package.json`, `tauri.conf.json` and `Cargo.toml` during the build, so there's nothing
to bump by hand.

```bash
git tag v1.4.0
git push origin v1.4.0
```

`.github/workflows/release.yml` then builds the Linux AppImage + `.deb` on Ubuntu 22.04
and the Windows Inno Setup installer + portable exe on Windows, generates
`SHA256SUMS.txt`, and publishes everything to a GitHub Release with auto-generated
notes. Tags containing a hyphen (`v1.4.0-rc.1`) are published as pre-releases.

The workflow can also be run manually from the Actions tab to test the pipeline — it
builds and uploads artifacts but doesn't publish a release.

## Contributing

Issues and PRs are welcome. Adding a tool usually means: a Rust command in
`src-tauri/src/commands/`, a wrapper in `src/services/`, and a Vue component registered
in the relevant hub page (`src/pages/Generate.vue`, `Crypto.vue`, `Text.vue`,
`Visual.vue`) or the router for a top-level screen.

## License

[MIT](LICENSE) © Akin Ozgen

Icons: <a href="https://www.flaticon.com/free-icons/motor" title="motor icons">Motor icons created by Freepik - Flaticon</a> ·
<a href="https://www.flaticon.com/free-icons/android" title="android icons">Android icons created by Freepik - Flaticon</a> ·
in-app icons from [Lucide](https://lucide.dev).
