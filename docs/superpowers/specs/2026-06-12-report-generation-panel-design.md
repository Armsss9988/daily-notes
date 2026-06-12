# Report Generation Panel — Design Spec

## Overview

Replace the current one-click "Generate Report → Email Draft" flow with a two-step process:

1. **Generate → Show editable panel** with AI-generated Content, Progress, Questions, Gains
2. **User edits → Click "Create Email Draft"** → creates Outlook draft with the edited content

## Current Flow (Baseline)

- `DailyTab.jsx` has a "Generate Report" button
- Click → IPC `report:generate` → Python script does: load .eml template → call NVIDIA API → fill template → create Outlook draft via COM
- No user editing, no preview, no regeneration

## New Flow

```
User clicks "Generate Report"
  → IPC report:generate-content (main process fetches NVIDIA API via JS)
  → Returns JSON to renderer
  → Opens GenerateReportModal with editable data

User edits table/textarea/list

User clicks "Regenerate"
  → IPC report:generate-content again
  → Modal data replaced with fresh AI output

User clicks "Create Email Draft"
  → IPC report:create-draft with edited content
  → Main process calls Python script with --json flag (skip AI step)
  → Python creates Outlook draft via COM
```

## Architecture

### IPC — Main Process (`electron/main.cjs`)

#### `report:generate-content`
- **Input:** `{ noteText: string }`
- **Action:** Calls NVIDIA NIM API via `fetch()` (Node.js built-in)
  - URL: `https://integrate.api.nvidia.com/v1/chat/completions`
  - Model: `meta/llama-3.1-8b-instruct`
  - API Key: `process.env.NVIDIA_API_KEY` (same as current)
  - System prompt: same as current Python script (instruct to output raw JSON)
  - Temperature: 0.1, Max tokens: 8192
- **Output:** `{ learning_items: [{ content: string, progress: string }], questions: string, gains: string[] }`
- **Error:** Reject with error message

#### `report:create-draft`
- **Input:** `{ content: { learning_items: [], questions: string, gains: string[] }, date: string }`
- **Action:** Calls `python.exe generate_report.py --json <json_string>`
  - The `--json` flag tells Python to skip NVIDIA API and use provided data directly
- **Output:** Resolves on success (Outlook draft opened), rejects on error

### Preload (`electron/preload.cjs`)

Add two new methods to `window.api`:
- `generateContent(noteText)` → `ipcRenderer.invoke('report:generate-content', { noteText })`
- `createDraft(content, date)` → `ipcRenderer.invoke('report:create-draft', { content, date })`

### Python Script (`generate_report.py`)

Modified to support two modes:
1. **Default (no `--json` flag):** Current behavior (load template → NVIDIA API → fill → create draft) — kept for backward compatibility
2. **`--json` mode:** Load template → parse JSON input → fill template → create draft (skip NVIDIA API)

### UI Components

#### `GenerateReportModal` (`src/components/GenerateReportModal.jsx`)

A new modal component, following `ConfirmDialog` pattern:

```jsx
<GenerateReportModal
  visible={bool}
  date={string}
  learningItems={[{content, progress}]}
  questions={string}
  gains={string[]}
  onRegenerate={fn}
  onCreateDraft={fn}
  onClose={fn}
/>
```

**Modal layout:**

```
┌──────────────────────────────────────┐
│ Generate Report - DD/MM/YYYY     [X] │
├──────────────────────────────────────┤
│                                      │
│ ─── Learning Items ───              │
│ ┌──────────────┬──────────────────┐  │
│ │ Content      │ Progress         │  │
│ ├──────────────┼──────────────────┤  │
│ │ <textarea>   │ <textarea>     [×]│  │
│ ├──────────────┼──────────────────┤  │
│ │ <textarea>   │ <textarea>     [×]│  │
│ ├──────────────┴──────────────────┤  │
│ │ [+ Add Item]                    │  │
│ └─────────────────────────────────┘  │
│                                      │
│ ─── Questions ───                    │
│ ┌──────────────────────────────────┐ │
│ │ <textarea full width, 3 rows>   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ─── Gains ───                        │
│ ┌──────────────────────────────────┐ │
│ │ 1. <textarea>               [×] │ │
│ │ 2. <textarea>                    │ │
│ │ [+ Add Gain]                     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [Regenerate]    [Create Email Draft] │
└──────────────────────────────────────┘
```

**Features:**
- Each learning item row: two textareas (Content, Progress) + delete button
- Each gain row: textarea with auto-numbering + delete button
- "Add Item" / "Add Gain" buttons append new empty rows
- "X" button on each row deletes it
- "Regenerate" button re-calls `report:generate-content` and replaces all data
- "Create Email Draft" calls `report:create-draft` with current edited data
- Close button (X) or Escape key dismisses modal
- Loading state while generating or creating draft
- Error handling with alert on failure

**State (local useState):**
- `loading` — true during AI generation or draft creation
- `items` — learning items array (editable)
- `questions` — questions text (editable)
- `gains` — gains array (editable)

#### `DailyTab.jsx` Changes

- Replace `handleGenerate` logic:
  1. Save note, get noteText
  2. Call `window.api.generateContent(noteText)`
  3. On success: set modal state, show `GenerateReportModal`
  4. On error: alert
- Keep date navigation, editor, etc. unchanged
- Modal `onCreateDraft`: receives edited data + date → calls `window.api.createDraft(data, date)`
- Modal `onRegenerate`: calls `window.api.generateContent(noteText)` again

### Error Handling

- **AI generation failure:** Alert user, modal doesn't open
- **Email draft failure:** Alert user, modal stays open (can retry)
- **Empty note text:** Alert "No content to generate report from" before calling API

### Testing

- `npm test` — existing tests must pass
- Manual test: generate report, edit content, create draft

## Files Changed

| File | Change |
|------|--------|
| `electron/main.cjs` | Add `report:generate-content` handler (NVIDIA API fetch); modify `report:create-draft` to accept JSON; add `NVIDIA_API_KEY` env handling |
| `electron/preload.cjs` | Add `generateContent` and `createDraft` API methods |
| `electron/tray.cjs` | No change |
| `src/components/GenerateReportModal.jsx` | **New file** — modal component |
| `src/components/DailyTab.jsx` | Replace `handleGenerate` logic, add modal state |
| `generate_report.py` | Add `--json` flag mode to skip AI step |
| `AGENTS.md` | Document new IPC channels and modal |

## Key Design Decisions

1. **AI in JS, not Python:** Faster, simpler, avoids Python subprocess for AI step. Python only used for Outlook COM (which has no JS equivalent).
2. **Modal, not side panel:** Consistent with existing ConfirmDialog pattern, less layout disruption.
3. **Local state, not global:** Modal manages its own data. No need for React Context or state lifting.
4. **Separate IPC for content vs draft:** Clean separation of concerns, allows independent error handling.
