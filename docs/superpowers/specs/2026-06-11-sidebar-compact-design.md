# Sidebar Compact — UI Redesign

## Overview

Replace the current 200px overlay ToolPanel with a **48px togglable sidebar** using emoji icons, and swap all Lucide icons across the app to emoji/natural icons. The goal: cleaner, more professional, more "note-like" appearance while keeping the same toggle behavior (hotzone + Ctrl+\\).

## Layout States

**Sidebar hidden (default):**
- Full-width editor, no left chrome
- Hotzone 4px on left edge (invisible trigger zone)
- Ctrl+\\ keyboard toggle

**Sidebar visible:**
- 48px vertical bar slides in from left (overlay, does NOT push editor)
- Transition: slide 0.2s ease
- Dismiss: ◀ button in sidebar, Ctrl+\\ again, or click outside

## Sidebar Contents

| # | Emoji | Action | Notes |
|---|-------|--------|-------|
| 1 | 📅 | Switch to Daily tab | Active highlight — bold or brighter emoji + background |
| 2 | 📄 | Switch to Notes tab | Active highlight |
| 3 | 🖌 | Toggle format toolbar popup | 200px panel slides right from sidebar; active state when popup is open |
| 4 | ☀️/🌙 | Toggle dark/light theme | Sun in dark mode, Moon in light mode |

**Tab persistence:** Tab state is preserved when sidebar is hidden. If Notes tab was active, closing and reopening the sidebar still shows Notes tab highlighted.

## Format Toolbar Popup

- Trigger: click 🖌 in sidebar (toggle)
- 200px wide, positioned at `left: 48px; top: 0; bottom: 0` (full height), z-index between sidebar and editor
- Contains same controls as current Toolbar.jsx grouped into sections:
  - **Style**: B, I, U, 🎨 (color/highlight)
  - **Heading**: H1, H2, H3
  - **List**: bullet, ordered
  - **Align**: left, center, right, justify
- Dismiss: click 🖌 again, click outside popup, or hide sidebar
- Transition: slide in/out with sidebar (not independent)
- Click-outside handling: both sidebar and popup share the same click-outside mechanism — click outside either dismisses both

## Icon Mapping (Lucide → Emoji)

| Component | Old Icon | New Emoji | Notes |
|-----------|----------|-----------|-------|
| App.jsx drag handle | Move | Move | Keep Lucide Move — cross arrows are more universally recognized for window drag |
| Sidebar daily | — | 📅 | |
| Sidebar notes | — | 📄 | |
| Sidebar format | — | 🖌 | |
| Sidebar theme | Sun/Moon | ☀️/🌙 | |
| Sidebar close | ChevronLeft | ◀ | |
| Toolbar color | — | 🎨 | |
| Notes search | Search | 🔍 | |
| Notes add | Plus | ➕ | |
| Notes delete | Trash2 | 🗑 | |
| Notes list toggle | PanelLeft/PanelLeftClose | 📋 | Single emoji, rotates or toggles |
| NavBar prev | ChevronLeft | ◀ | |
| NavBar next | ChevronRight | ▶ | |

**Toolbar B/I/U and heading buttons**: keep as text (`B`, `I`, `U`, `H1`, `H2`, `H3`) — they are more readable than emoji alternatives.

**Notes:** `List`, `ListOrdered`, `Quote` in toolbar remain as-is (small text labels work better).

## Component Changes

### New: Sidebar.jsx
- 48px wide, absolute-positioned overlay
- Props: `activeTab`, `onTabChange`, `theme`, `onThemeToggle`, `onFormatToggle`, `showFormat`
- Emoji buttons with active/hover states
- Close button (◀) at top

### Modified: ToolPanel.jsx → removed (replaced by Sidebar.jsx)

### Modified: Toolbar.jsx
- Accept new prop `variant`: `"popup"` (default) or `"inline"` (for future use)
- In popup mode: renders inside the 200x popup container with section grouping

### Modified: App.jsx
- Import Sidebar instead of ToolPanel
- Add `showFormat` state for toolbar popup
- Wire click-outside handler for popup dismiss
- Change Move → 🖱 for drag handle

### Modified: NotesTab.jsx
- Search icon: 🔍 (unicode, no component)
- Plus button: ➕
- Trash button: 🗑
- List toggle: 📋

### Modified: NavBar.jsx
- ChevronLeft → ◀ (unicode)
- ChevronRight → ▶ (unicode)

## Implementation Order

1. Create Sidebar.jsx with emoji buttons, overlay behavior, slide transition
2. Modify App.jsx: replace ToolPanel with Sidebar, add showFormat state
3. Modify Toolbar.jsx: add popup variant with section grouping
4. Modify NotesTab.jsx: swap Lucide icons for emoji
5. Modify NavBar.jsx: swap Chevron icons for unicode arrows
6. Remove ToolPanel.jsx (no longer needed)
7. Update App.jsx drag handle icon
8. Build, test, package
