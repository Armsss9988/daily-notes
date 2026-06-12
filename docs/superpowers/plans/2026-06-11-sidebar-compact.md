# Sidebar Compact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 200px ToolPanel overlay with a 48px togglable sidebar using emoji icons, and swap all Lucide icons to emoji/unicode across the app.

**Architecture:** Create `Sidebar.jsx` (48px overlay bar with 4 emoji buttons + toolbar popup), modify `App.jsx` to wire it up, modify `Toolbar.jsx` to support a popup variant with section grouping, swap icons in `NotesTab.jsx` and `NavBar.jsx` to emoji/unicode.

**Tech Stack:** React 18, Tailwind 3, Lucide-React (only for Move + Toolbar icons)

---

### Task 1: Create Sidebar.jsx

**Files:**
- Create: `src/components/Sidebar.jsx`

- [ ] **Step 1: Create the component**

```jsx
import React from 'react';

export default function Sidebar({ activeTab, onTabChange, theme, onThemeToggle, onFormatToggle, showFormat, visible }) {
  return (
    <div
      className={`absolute left-0 top-0 bottom-0 w-12 bg-gray-900/95 border-r border-gray-800 z-30 flex flex-col items-center pt-1.5 transition-transform duration-200 ease-in-out ${
        visible ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <button
        onClick={() => onTabChange('daily')}
        className={`w-9 h-9 flex items-center justify-center text-lg transition-all ${
          activeTab === 'daily' ? 'opacity-100 bg-gray-800' : 'opacity-40 hover:opacity-80'
        }`}
        title="Daily"
      >
        📅
      </button>
      <button
        onClick={() => onTabChange('notes')}
        className={`w-9 h-9 flex items-center justify-center text-lg transition-all ${
          activeTab === 'notes' ? 'opacity-100 bg-gray-800' : 'opacity-40 hover:opacity-80'
        }`}
        title="Notes"
      >
        📄
      </button>
      <div className="w-6 h-px bg-gray-800 my-1" />
      <button
        onClick={onFormatToggle}
        className={`w-9 h-9 flex items-center justify-center text-lg transition-all ${
          showFormat ? 'opacity-100 bg-gray-800' : 'opacity-40 hover:opacity-80'
        }`}
        title="Format"
      >
        🖌
      </button>
      <button
        onClick={onThemeToggle}
        className="w-9 h-9 flex items-center justify-center text-lg opacity-40 hover:opacity-80 transition-all mt-auto mb-3"
        title="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
```

---

### Task 2: Modify Toolbar.jsx — add popup variant

**Files:**
- Modify: `src/components/Toolbar.jsx`

- [ ] **Step 1: Add `variant` prop and section-grouped popup render**

Change the export signature from `export default function Toolbar({ editor })` to accept `variant`:

```jsx
export default function Toolbar({ editor, variant = 'inline' }) {
```

At the top of the return, split into two paths. Insert this immediately after the `if (!editor) return null;` guard:

```jsx
  if (variant === 'popup') {
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Style</div>
          <div className="flex gap-1 flex-wrap">
            <button className={btnClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
              <strong>B</strong>
            </button>
            <button className={btnClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
              <em>I</em>
            </button>
            <button className={btnClass(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
              <u>U</u>
            </button>
            <div className="relative">
              <button className={btnClass(false)} onClick={() => { setShowColor(!showColor); setShowBg(false); }} title="Text color">
                🎨
              </button>
              {showColor && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-10 flex flex-wrap gap-1 w-40">
                  {['#e0e0e0', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#000000'].map(c => (
                    <button key={c} className="w-6 h-6 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: c }} onClick={() => { editor.chain().focus().setColor(c).run(); setShowColor(false); }} />
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button className={btnClass(false)} onClick={() => { setShowBg(!showBg); setShowColor(false); }} title="Highlight">
                HL
              </button>
              {showBg && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-10 flex flex-wrap gap-1 w-40">
                  {['#fbbf24', '#f87171', '#34d399', '#60a5fa', '#fef08a', '#fecaca', '#d9f99d', '#bfdbfe'].map(c => (
                    <button key={c} className="w-6 h-6 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: c }} onClick={() => { editor.chain().focus().setHighlight({ color: c }).run(); setShowBg(false); }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Heading</div>
          <div className="flex gap-1">
            {[1, 2, 3].map(level => {
              const Icon = HEADING_ICONS[level];
              return (
                <button key={level} className={btnClass(editor.isActive('heading', { level }))} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} title={`Heading ${level}`}>
                  {Icon && <Icon size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">List</div>
          <div className="flex gap-1">
            <button className={btnClass(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
              <List size={14} />
            </button>
            <button className={btnClass(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list">
              <ListOrdered size={14} />
            </button>
            <button className={btnClass(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
              <Quote size={14} />
            </button>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Align</div>
          <div className="flex gap-1">
            <button className={btnClass(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left">
              <AlignLeft size={14} />
            </button>
            <button className={btnClass(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align center">
              <AlignCenter size={14} />
            </button>
            <button className={btnClass(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right">
              <AlignRight size={14} />
            </button>
            <button className={btnClass(editor.isActive({ textAlign: 'justify' }))} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justify">
              <AlignJustify size={14} />
            </button>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Size</div>
          <select
            className="text-xs px-1 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full"
            value={currentFontSize}
            onChange={(e) => {
              const size = parseInt(e.target.value);
              editor.chain().focus().setFontSize(size).run();
            }}
          >
            {FONT_SIZES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }
```

Add this immediately before the existing `return (` for the inline toolbar, inside the function body.

---

### Task 3: Modify App.jsx — replace ToolPanel with Sidebar

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace ToolPanel import with Sidebar import**

Change:
```jsx
import ToolPanel from './components/ToolPanel';
```
To:
```jsx
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
```

- [ ] **Step 2: Add sidebar state variables after `editorInstance`**

```jsx
const [sidebarOpen, setSidebarOpen] = useState(false);
const [showFormat, setShowFormat] = useState(false);
```

- [ ] **Step 3: Add keyboard shortcut handler (Ctrl+\ for sidebar toggle)**

Add in the component body, after the theme effect:
```jsx
useEffect(() => {
  const handler = (e) => {
    if (e.ctrlKey && e.key === '\\') {
      e.preventDefault();
      setSidebarOpen(prev => {
        if (!prev) return true;
        setShowFormat(false);
        return false;
      });
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

- [ ] **Step 4: Add hotzone (hover left edge) handler**

```jsx
useEffect(() => {
  if (sidebarOpen) return;
  const el = document.getElementById('sidebar-hotzone');
  if (!el) return;
  const onEnter = () => setSidebarOpen(true);
  el.addEventListener('mouseenter', onEnter);
  return () => el.removeEventListener('mouseenter', onEnter);
}, [sidebarOpen]);
```

- [ ] **Step 5: Add click-outside handler (closes both sidebar and popup)**

```jsx
useEffect(() => {
  if (!sidebarOpen) return;
  const handler = (e) => {
    const sidebar = document.getElementById('sidebar-container');
    if (sidebar && !sidebar.contains(e.target)) {
      setShowFormat(false);
      setSidebarOpen(false);
    }
  };
  window.addEventListener('mousedown', handler);
  return () => window.removeEventListener('mousedown', handler);
}, [sidebarOpen]);
```

- [ ] **Step 6: Replace ToolPanel usage with Sidebar + popup + hotzone**

Remove this block:
```jsx
<ToolPanel
  activeTab={activeTab}
  onTabChange={setActiveTab}
  theme={theme}
  onThemeToggle={toggleTheme}
  editor={editorInstance}
/>
```

Insert this block in its place:
```jsx
{/* Hotzone */}
{!sidebarOpen && (
  <div id="sidebar-hotzone" className="absolute left-0 top-0 bottom-0 w-1 z-40" />
)}

{/* Sidebar container */}
<div id="sidebar-container" className="absolute left-0 top-0 bottom-0 z-30 pointer-events-none">
  <div className="relative h-full pointer-events-auto">
    <Sidebar
      activeTab={activeTab}
      onTabChange={setActiveTab}
      theme={theme}
      onThemeToggle={toggleTheme}
      showFormat={showFormat}
      onFormatToggle={() => setShowFormat(prev => !prev)}
      visible={sidebarOpen}
    />
    {sidebarOpen && showFormat && (
      <div className="absolute left-12 top-0 bottom-0 w-50 bg-gray-900 border-r border-gray-800 z-20 overflow-y-auto p-3">
        {editorInstance ? (
          <Toolbar editor={editorInstance} variant="popup" />
        ) : (
          <p className="text-xs text-gray-500 italic">Open a note to format</p>
        )}
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 7: Add the side padding import**

```jsx
// No extra imports needed for the emoji/unicode icons
```

Note: The sidebar and hotzone use `absolute` positioning, so their parent needs `position: relative`. Add `relative` to the parent div:

Change:
```jsx
<div className="h-full min-h-0 flex">
```
To:
```jsx
<div className="h-full min-h-0 flex relative">
```

---

### Task 4: Modify NotesTab.jsx — swap icons to emoji

**Files:**
- Modify: `src/components/NotesTab.jsx`

- [ ] **Step 1: Remove lucide-react import**

Change:
```jsx
import { Plus, Trash2, Search, PanelLeft, PanelLeftClose } from 'lucide-react';
```
To: (nothing — remove the entire line)

- [ ] **Step 2: Replace Search icon in the input**

Change:
```jsx
<Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
```
To:
```jsx
<span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
```

- [ ] **Step 3: Replace list toggle icon**

Change:
```jsx
{showList ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
```
To:
```jsx
<span className="text-sm">📋</span>
```

- [ ] **Step 4: Replace Plus icon**

Change:
```jsx
<Plus size={14} />
```
To:
```jsx
<span className="text-sm">➕</span>
```

- [ ] **Step 5: Replace Trash2 icon**

Change:
```jsx
<Trash2 size={14} />
```
To:
```jsx
<span className="text-sm">🗑</span>
```

---

### Task 5: Modify NavBar.jsx — swap icons to unicode arrows

**Files:**
- Modify: `src/components/NavBar.jsx`

- [ ] **Step 1: Remove lucide-react import**

Change:
```jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
```
To: (nothing — remove the entire line)

- [ ] **Step 2: Replace ChevronLeft**

Change:
```jsx
<ChevronLeft size={20} />
```
To:
```jsx
<span className="text-lg">◀</span>
```

- [ ] **Step 3: Replace ChevronRight**

Change:
```jsx
<ChevronRight size={20} />
```
To:
```jsx
<span className="text-lg">▶</span>
```

---

### Task 6: Remove ToolPanel.jsx, clean up, build, test, package

**Files:**
- Delete: `src/components/ToolPanel.jsx`

- [ ] **Step 1: Delete ToolPanel.jsx**

```bash
Remove-Item -LiteralPath "src/components/ToolPanel.jsx" -Force
```

- [ ] **Step 2: Verify tests pass**

```bash
npm test
```

- [ ] **Step 3: Verify build succeeds**

```bash
npm run build
```

- [ ] **Step 4: Package .exe**

```bash
npm run package
```

- [ ] **Step 5: Update AGENTS.md**

Update the architecture section to reference Sidebar instead of ToolPanel.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: sidebar compact with emoji icons"
```
