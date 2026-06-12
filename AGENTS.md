# Daily Notes — Agent Guide

## Stack
- Electron 28 + React 18 + Vite 5 + Tailwind 3 + TipTap 2 (rich text editor)
- `npm` (v11) — no yarn/pnpm
- `vitest` for testing (only `test/formatSchema.test.js` exists)

## Commands
- `npm run dev` — Vite dev server (port 5173)
- `npm run electron:dev` — Vite + Electron concurrently (use this for live dev)
- `npm test` — vitest run (currently 1 file, 3 tests)
- `npm run build` — vite build + electron-builder (fails on this env due to winCodeSign symlink issue; use `electron-packager` as fallback)

## Architecture
- **`electron/main.cjs`** — main process: window creation (frameless), tray, IPC handlers, data migration, auto-start (`app.setLoginItemSettings`); includes `report:generate-content` (calls NVIDIA API via https) and `report:create-draft` (passes JSON to Python via stdin)
- **`electron/tray.cjs`** — system tray: show/hide, "Launch at startup" checkbox, Quit
- **`electron/preload.cjs`** — contextBridge: exposes `window.api.*` (load/save data, theme, start-on-boot, generateContent, createDraft)
- **`src/components/GenerateReportModal.jsx`** — modal for reviewing/editing AI-generated report content before creating email draft
- **`src/App.jsx`** — shell: Sidebar (48px overlay) + Toolbar popup + DailyTab/NotesTab, theme state, editor ref wiring
- **`src/components/Sidebar.jsx`** — 48px left sidebar (emoji icons: 📅 Daily, 📄 Notes, 🖌 Format, ☀️/🌙 Theme), hotzone/Ctrl+\ toggle, slide transition
- **`src/components/Toolbar.jsx`** — formatting toolbar with `variant` prop: inline (flat row) or popup (section-grouped: Style, Heading, List, Align, Size)
- **`src/utils/formatSchema.js`** — `textToDoc`/`docToTextAndFmts` for TipTap JSON ↔ plain text+fmts conversion
- **`src/extensions/TextColor.js`**, `FontSize.js` — custom TipTap extensions (avoid `@tiptap/extension-color` due to peer dep version conflict)

## Data Model
- Saved as `notes.json` in Electron userData
- Each note: `{ doc: TipTapJSON, c: { text, fmts } }` — full TipTap JSON doc + backward-compat text/fmts
- Structural formatting (lists, headings, alignment) only preserved in `doc` field; `c` stores only inline formatting

## Key Conventions
- All borders/rounded removed from UI (target is borderless look)
- Window is frameless (`frame: false`); drag via top-right `Move` icon button + top 8px strip (`-webkit-app-region: drag`)
- Close window → hide to tray (not quit); quit only from tray menu
- `Alt+Z` toggles show/hide (global hotkey)
- `Ctrl+\` toggles left panel (renderer-side)
- Theme is persisted in `config.json` (`dark`/`light`), applied via Tailwind `dark:` class on `<html>`
- `darkMode: 'class'` in tailwind config — use `dark:` prefixes throughout

## Must Do After Every Change

1. `npm test` — verify existing tests still pass
2. `npm run build` — check for compile errors (vite build only)
3. `npm run package` — rebuild the .exe (vite build + `electron-packager` to `release/daily-notes-win32-x64/daily-notes.exe`)
4. Update shortcuts if path changed (Start Menu + Startup)

## Build Workarounds
- SentinelOne antivirus blocks `electron-packager` rename in `%TEMP%` — set `TMP`/`TEMP` env vars to `C:\ep-tmp` before packaging (already done in `npm run package` script)
- Vite output dir: `app/`; packager output dir: `release/` (changed from `dist/` to avoid EPERM issues)

## Quirks
- Node.js is NOT installed system-wide — use portable at `C:\tools\node-v22.14.0-win-x64`
- `npm` commands need explicit path via `& "C:\tools\node-v22.14.0-win-x64\npm.cmd"`
- `electron-builder` fails on this env (symlink privilege issue with winCodeSign); use `npm run package` which does vite build + `electron-packager` to produce unpacked .exe
- Window position (x, y) is saved in `config.json` on close and restored on open — stays in same spot across toggle show/hide
- ProseMirror editor attributes: `class="prose prose-sm dark:prose-invert max-w-none focus:outline-none px-6 py-4"`
- `setContent` must use `{ emitUpdate: false }` to prevent save loops
- Scroll chain: `flex-1 min-h-0 overflow-y-auto` at every layout level (no percentage heights)
