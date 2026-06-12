# Report Generation Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace one-click "Generate Report → Email Draft" with an editable modal panel showing AI-generated Content/Progress/Questions/Gains.

**Architecture:** New IPC `report:generate-content` calls NVIDIA API from main process (Node.js `https` module) returning JSON. New `GenerateReportModal` component renders editable table/list. Existing `report:create-draft` IPC passes edited content to Python via `--json` flag, skipping AI step in Python. Python only used for Outlook COM automation.

**Tech Stack:** Electron 28 (Node 18), React 18, Python 3.12 + win32com (Outlook)

---

### Task 1: Update Preload — add new IPC bridges

**Files:**
- Modify: `electron/preload.cjs`

- [ ] **Step 1: Add generateContent and createDraft to contextBridge**

Replace existing `generateReport` with two new methods:

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme) => ipcRenderer.invoke('theme:set', theme),
  onThemeChanged: (cb) => {
    ipcRenderer.on('theme:changed', (_, theme) => cb(theme));
  },
  getStartOnBoot: () => ipcRenderer.invoke('app:getStartOnBoot'),
  setStartOnBoot: (val) => ipcRenderer.invoke('app:setStartOnBoot', val),
  generateContent: (noteText) => ipcRenderer.invoke('report:generate-content', noteText),
  createDraft: (content, date) => ipcRenderer.invoke('report:create-draft', { content, date }),
});
```

- [ ] **Step 2: Commit**

```bash
git add electron/preload.cjs
git commit -m "feat: add generateContent and createDraft IPC bridges"
```

---

### Task 2: Main process — new report:generate-content handler

**Files:**
- Modify: `electron/main.cjs`

- [ ] **Step 1: Add NVIDIA API call function using Node.js https**

```js
const https = require('https');

function generateContentFromNvidia(noteText) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return Promise.reject(new Error('NVIDIA_API_KEY not found in environment'));

  const prompt =
    'You are a helpful assistant. Extract learning items, questions, and gains from the daily notes. ' +
    'Return ONLY raw JSON without markdown formatting or code blocks. ' +
    'Use this exact structure:\n' +
    '{"learning_items":[{"content":"...","progress":"..."}],"questions":"...","gains":["..."]}';

  const body = JSON.stringify({
    model: 'meta/llama-3.1-8b-instruct',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: noteText },
    ],
    temperature: 0.1,
    max_tokens: 8192,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const raw = json.choices?.[0]?.message?.content || '';
            const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
            const parsed = JSON.parse(cleaned);
            resolve({
              learning_items: parsed.learning_items || [],
              questions: parsed.questions || '',
              gains: parsed.gains || [],
            });
          } catch (e) {
            reject(new Error('Failed to parse NVIDIA response: ' + e.message + '\nRaw: ' + data));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
```

- [ ] **Step 2: Add IPC handler for report:generate-content**

Add after existing `report:generate` handler:

```js
ipcMain.handle('report:generate-content', async (_, noteText) => {
  return generateContentFromNvidia(noteText);
});
```

- [ ] **Step 3: Commit**

```bash
git add electron/main.cjs
git commit -m "feat: add report:generate-content IPC handler with NVIDIA API"
```

---

### Task 3: Main process — update report:create-draft to accept JSON

**Files:**
- Modify: `electron/main.cjs`

- [ ] **Step 1: Add createDraft IPC handler that passes JSON to Python**

Replace the old `report:generate` handler with `report:create-draft`:

Find this block:
```js
ipcMain.handle('report:generate', async (_, { noteText, date }) => {
  const { execFile } = require('child_process');
  return new Promise((resolve, reject) => {
    const child = execFile(PYTHON, [GENERATOR, noteText], {
      encoding: 'utf-8', timeout: 300000
    }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve();
    });
  });
});
```

Replace with:
```js
ipcMain.handle('report:create-draft', async (_, { content, date }) => {
  const { execFile } = require('child_process');
  const jsonStr = JSON.stringify(content);
  return new Promise((resolve, reject) => {
    const child = execFile(PYTHON, [GENERATOR, '--json', date || ''], {
      encoding: 'utf-8',
      timeout: 300000,
    }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve();
    });
    child.stdin.write(jsonStr);
    child.stdin.end();
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add electron/main.cjs
git commit -m "feat: update report:create-draft to accept JSON content, skip AI in Python"
```

---

### Task 4: Python script — add --json flag mode

**Files:**
- Modify: `generate_report.py`

- [ ] **Step 1: Add --json argument parsing at the top of the script**

Replace the `note_text = sys.argv[1] if len(sys.argv) > 1 else ""` line with argument parsing. Find this near the top and replace:

Find:
```python
note_text = sys.argv[1] if len(sys.argv) > 1 else ""
```

Replace with:
```python
# Parse arguments
# --json <date> : read JSON from stdin, skip AI, use provided data directly
# otherwise: first positional arg is note_text (backward compat)
json_data = None
note_text = ""
date_str = ""

if len(sys.argv) > 1 and sys.argv[1] == '--json':
    json_data = json.loads(sys.stdin.read())
    if len(sys.argv) > 2:
        date_str = sys.argv[2]
elif len(sys.argv) > 1:
    note_text = sys.argv[1]
```

- [ ] **Step 2: Wrap NVIDIA API call in conditional**

Find the NVIDIA API call block (starts around the `url = "https://integrate.api.nvidia.com/v1/chat/completions"` lines and ends before `# Fill template`). Wrap it so it only runs when `json_data` is None:

```python
if json_data is None:
    # --- existing NVIDIA API call ---
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    # ... (keep existing code)
    # --- end of NVIDIA API call ---
    learning_items = result.get("learning_items", [])
    questions = result.get("questions", "")
    gains = result.get("gains", [])
else:
    learning_items = json_data.get("learning_items", [])
    questions = json_data.get("questions", "")
    gains = json_data.get("gains", [])

# ... (rest of script: Fill template, Create Outlook draft - unchanged)
```

- [ ] **Step 3: Use date_str for email subject instead of datetime.now()**

Find in the Python script the line that sets the subject, e.g.:
```python
date_today = datetime.now().strftime("%d/%m/%Y")
subject = f"Daily Report {date_today} - Reed Le"
```

Replace with:
```python
if date_str:
    display_date = datetime.strptime(date_str, "%Y-%m-%d").strftime("%d/%m/%Y")
else:
    display_date = datetime.now().strftime("%d/%m/%Y")
subject = f"Daily Report {display_date} - Reed Le"
```

Also update the `DD/MM/YYYY` placeholder replacement below to use `display_date`.

- [ ] **Step 4: Commit**

```bash
git add generate_report.py
git commit -m "feat: add --json flag to skip AI, use date from arg"
```

---

### Task 5: GenerateReportModal component

**Files:**
- Create: `src/components/GenerateReportModal.jsx`

- [ ] **Step 1: Create modal component scaffold**

```jsx
import { useState, useCallback, useEffect } from 'react';

export default function GenerateReportModal({ visible, date, content, onRegenerate, onCreateDraft, onClose }) {
  const [items, setItems] = useState([]);
  const [questions, setQuestions] = useState('');
  const [gains, setGains] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (content) {
      setItems(content.learning_items || []);
      setQuestions(content.questions || '');
      setGains(content.gains || []);
    }
  }, [content]);

  const handleRegenerate = useCallback(async () => {
    setLoading(true);
    try {
      await onRegenerate();
    } finally {
      setLoading(false);
    }
  }, [onRegenerate]);

  const handleCreateDraft = useCallback(async () => {
    setLoading(true);
    try {
      await onCreateDraft({ learning_items: items, questions, gains });
    } finally {
      setLoading(false);
    }
  }, [items, questions, gains, onCreateDraft]);

  // Item editing
  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };
  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };
  const addItem = () => {
    setItems(prev => [...prev, { content: '', progress: '' }]);
  };

  // Gain editing
  const updateGain = (idx, val) => {
    setGains(prev => prev.map((g, i) => i === idx ? val : g));
  };
  const removeGain = (idx) => {
    setGains(prev => prev.filter((_, i) => i !== idx));
  };
  const addGain = () => {
    setGains(prev => [...prev, '']);
  };

  // Handle escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (visible) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 shadow-xl min-w-[520px] max-w-[640px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-200">Generate Report - {date}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-1">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Learning Items */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Learning Items</h3>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <textarea className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 text-xs p-2 h-16 resize-y"
                    value={item.content} onChange={e => updateItem(i, 'content', e.target.value)} placeholder="Content" />
                  <textarea className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 text-xs p-2 h-16 resize-y"
                    value={item.progress} onChange={e => updateItem(i, 'progress', e.target.value)} placeholder="Progress" />
                  <button onClick={() => removeItem(i)} className="text-gray-500 hover:text-red-400 text-xs mt-1 px-1">&times;</button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              + Add Item
            </button>
          </div>

          {/* Questions */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Questions</h3>
            <textarea className="w-full bg-gray-800 border border-gray-600 text-gray-200 text-xs p-2 h-20 resize-y"
              value={questions} onChange={e => setQuestions(e.target.value)} placeholder="Questions..." />
          </div>

          {/* Gains */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gains</h3>
            <div className="space-y-2">
              {gains.map((gain, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-xs text-gray-500 mt-2 min-w-4">{i + 1}.</span>
                  <textarea className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 text-xs p-2 h-12 resize-y"
                    value={gain} onChange={e => updateGain(i, e.target.value)} placeholder="Gain..." />
                  <button onClick={() => removeGain(i)} className="text-gray-500 hover:text-red-400 text-xs mt-1 px-1">&times;</button>
                </div>
              ))}
            </div>
            <button onClick={addGain} className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              + Add Gain
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700">
          <button onClick={handleRegenerate} disabled={loading}
            className="px-3 py-1.5 text-xs text-gray-300 border border-gray-600 hover:bg-gray-700 disabled:opacity-40 transition-colors">
            {loading ? 'Working...' : 'Regenerate'}
          </button>
          <button onClick={handleCreateDraft} disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-colors">
            {loading ? 'Working...' : 'Create Email Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GenerateReportModal.jsx
git commit -m "feat: add GenerateReportModal component"
```

---

### Task 6: DailyTab — wire up new flow

**Files:**
- Modify: `src/components/DailyTab.jsx`

- [ ] **Step 1: Replace handleGenerate, add modal state**

Read the full current file first. Then:

Add import at top:
```jsx
import GenerateReportModal from './GenerateReportModal';
```

Add state variables:
```jsx
const [modalVisible, setModalVisible] = useState(false);
const [reportContent, setReportContent] = useState(null);
```

Replace existing `handleGenerate`:
```jsx
const handleGenerate = useCallback(async () => {
  setGenerating(true);
  try {
    notesManager.saveNow();
    const note = notesManager.dailyNote(cdate);
    const noteText = note?.c?.text?.trim() || '';
    if (!noteText) {
      alert('No content to generate report from');
      return;
    }
    const content = await window.api.generateContent(noteText);
    setReportContent(content);
    setModalVisible(true);
  } catch (err) {
    alert('Failed to generate report: ' + err.message);
  } finally {
    setGenerating(false);
  }
}, [cdate, notesManager]);
```

Add handlers for modal callbacks (before the return):
```jsx
const handleRegenerate = useCallback(async () => {
  notesManager.saveNow();
  const note = notesManager.dailyNote(cdate);
  const noteText = note?.c?.text?.trim() || '';
  const content = await window.api.generateContent(noteText);
  setReportContent(content);
}, [cdate, notesManager]);

const handleCreateDraft = useCallback(async (content) => {
  await window.api.createDraft(content, cdate);
  setModalVisible(false);
}, [cdate]);
```

Add modal component inside the return (at the bottom, after the button row):
```jsx
<GenerateReportModal
  visible={modalVisible}
  date={cdate}
  content={reportContent}
  onRegenerate={handleRegenerate}
  onCreateDraft={handleCreateDraft}
  onClose={() => setModalVisible(false)}
/>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DailyTab.jsx
git commit -m "feat: wire GenerateReportModal into DailyTab"
```

---

### Task 7: Update AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Document new IPC channels**

Add to the IPC handlers section:
```
- `report:generate-content` → Main process calls NVIDIA API directly, returns JSON `{ learning_items, questions, gains }`
- `report:create-draft` → Passes edited content JSON to Python via `--json` flag, creates Outlook draft
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md with new IPC channels"
```

---

### Task 8: Update app.asar and rebuild

**Files:**
- Modify: `daily-notes-win32-x64/resources/app.asar`
- Modify: `release/daily-notes-win32-x64/resources/app.asar`

- [ ] **Step 1: Build vite, update asar for both locations**

```bash
cd C:\daily_notes\daily-notes
$env:PATH = "C:\tools\node-v22.14.0-win-x64;" + $env:PATH
& "C:\tools\node-v22.14.0-win-x64\npm.cmd" run build
```

Then update asar files following the existing pattern (extract → copy new files → repack).

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "build: rebuild app.asar with report panel changes"
```
