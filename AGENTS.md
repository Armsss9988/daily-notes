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

## Architecture (Layered)

**Layers (top→bottom dependency):**
```
ui/         → React components (shell, features, shared)
app/        → Use cases (coordinate domain + state)
domain/     → Pure business logic (zero side effects, no imports)
state/      → Redux: slices, selectors persist middleware
data/       → Data access repositories
platform/   → IPC bridge (window.api wrapper)
```

### Layer responsibilities

- **`domain/`** — Pure functions (`note.js`, `dailyNote.js`, `theme.js`). No imports, no IPC, no env API. All side-effects (dates, UUIDs) injected as params.
- **`app/`** — Use-case thunks (`notesUseCases.js`, `dailyUseCases.js`). Call domain functions + dispatch slice actions.
- **`state/`** — Redux Toolkit (`slices/notesSlice.js`, `slices/uiSlice.js`, `middlewares/persistMiddleware.js`, `selectors/notesSelectors.js`, `selectors/uiSelectors.js`, `store.js`). Slices hold reducers only; middlewares persist via `data/repositories`.
- **`data/repositories/`** — `notesRepo.js`, `configRepo.js`. Call `platform/ipcClient`.
- **`platform/`** — `ipcClient.js`. Wraps `window.api.*` calls (only layer aware of IPC).
- **`ui/`** — React components organized by feature:
  - `ui/App.jsx` — shell, dispatches async thunks on mount
  - `ui/sidebar/` — Sidebar
  - `ui/editor/` — TipTapEditor, Toolbar
  - `ui/features/daily/` — DailyTab
  - `ui/features/notes/` — NotesTab, NoteList
  - `ui/features/report/` — GenerateReportModal
  - `ui/shared/` — NavBar, ConfirmDialog
- **`extensions/`** — Custom TipTap extensions (TextColor, FontSize)
- **`utils/`** — `formatSchema.js` (text↔doc conversion)

### Data flow
```
UI click → app/usecase thunk → domain fn → dispatch slice action
                                                    ↓
                                          persistMiddleware (debounce 2s)
                                                    ↓
                                          data/repositories → platform/ipcClient
                                                    ↓
                                          Electron main process / filesystem
```

### Key details
- `domain/note.js` — `createNote({ id, title, now })` returns plain object (no side effects)
- `notesSlice` — actions: `noteCreated`, `noteUpdated`, `noteDeleted`, `noteRestored`, `dailyNoteChanged`, `noteSelected`
- `persistMiddleware` — debounce 2s for `notes/*`, immediate for `noteSelected` (tab-switch safety), immediate for `ui/setTheme`/`ui/toggleTheme`
- UI components dispatch direct slice actions for simple UI state (sidebar, activeTab); use `app/` thunks for business operations

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
2. `npm run dev` — quick vite build check (compile errors only, no electron-builder)

## DO NOT Build/package the app
- NEVER run `npm run build`, `npm run package`, or `electron-builder`
- The user handles packaging themselves; we only test via `npm run electron:dev`

## Quirks
- Node.js is NOT installed system-wide — use portable at `C:\tools\node-v22.14.0-win-x64`
- `npm` commands need explicit path via `& "C:\tools\node-v22.14.0-win-x64\npm.cmd"`
- `electron-builder` fails on this env (symlink privilege issue with winCodeSign); use `npm run package` which does vite build + `electron-packager` to produce unpacked .exe
- Window position (x, y) is saved in `config.json` on close and restored on open — stays in same spot across toggle show/hide
- ProseMirror editor attributes: `class="prose prose-sm dark:prose-invert max-w-none focus:outline-none px-6 py-4"`
- `setContent` must use `{ emitUpdate: false }` to prevent save loops
- Scroll chain: `flex-1 min-h-0 overflow-y-auto` at every layout level (no percentage heights)
