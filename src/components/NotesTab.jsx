import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NoteList from './NoteList';
import TipTapEditor from './TipTapEditor';

const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] };

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-gray-900 border border-gray-700 p-5 shadow-xl min-w-60">
        <p className="text-sm text-gray-200 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 text-xs text-gray-300 hover:text-white transition-colors"
            onClick={onCancel}
          >Cancel</button>
          <button
            className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-500 transition-colors"
            onClick={onConfirm}
          >Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function NotesTab({ notesManager, editorRef }) {
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showList, setShowList] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const titleInputRef = useRef(null);
  const newNoteIdRef = useRef(null);

  const allNotes = notesManager.notes();
  const filtered = useMemo(() => {
    if (!search) return allNotes;
    const q = search.toLowerCase();
    return allNotes.filter(n => (n.t || '').toLowerCase().includes(q));
  }, [allNotes, search]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (newNoteIdRef.current) {
      const idx = filtered.findIndex(n => n.id === newNoteIdRef.current);
      if (idx >= 0) {
        setSelectedIdx(idx);
        newNoteIdRef.current = null;
      }
    }
  }, [filtered]);

  const selectedNote = selectedIdx !== null ? filtered[selectedIdx] || null : null;

  const handleSelect = useCallback((idx) => {
    setSelectedIdx(idx);
  }, []);

  const handleTitleSubmit = useCallback(() => {
    if (selectedNote && titleDraft.trim()) {
      notesManager.updateNote(selectedNote.id, {
        t: titleDraft.trim().slice(0, 40),
        u: new Date().toISOString(),
      });
    }
    setEditingTitle(false);
  }, [selectedNote, titleDraft, notesManager]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit();
    }
    if (e.key === 'Escape') {
      setEditingTitle(false);
    }
  }, [handleTitleSubmit]);

  const handleContentChange = useCallback((content) => {
    if (selectedNote) {
      notesManager.updateNote(selectedNote.id, {
        c: content,
        u: new Date().toISOString(),
      });
    }
  }, [selectedNote, notesManager]);

  const handleAdd = useCallback(() => {
    const id = uuidv4();
    const newNote = {
      id,
      t: 'New note',
      c: { text: '', fmts: [] },
      crt: new Date().toISOString(),
      u: new Date().toISOString(),
    };
    notesManager.addNote(newNote);
    newNoteIdRef.current = id;
    setSearch('');
  }, [notesManager]);

  const handleDelete = useCallback((id) => {
    const target = id != null ? filtered.find(n => n.id === id) : selectedNote;
    if (!target) return;
    setDeleteTarget(target);
    setConfirmDelete(true);
  }, [filtered, selectedNote]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    notesManager.deleteNote(deleteTarget.id);
    if (selectedNote?.id === deleteTarget.id) setSelectedIdx(null);
    setConfirmDelete(false);
    setDeleteTarget(null);
  }, [deleteTarget, selectedNote, notesManager]);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-1.5 px-4 pt-7 pb-2 shrink-0">
        <div className="relative flex-1 max-w-48">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowList(s => !s)}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title={showList ? 'Hide list' : 'Show list'}
        >
          <span className="text-sm">📋</span>
        </button>
        <button
          onClick={handleAdd}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Add note"
        >
          <span className="text-base">✚</span>
        </button>
        {selectedNote && (
          <button
            onClick={handleDelete}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete"
          >
            <span className="text-sm">🗑</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex gap-0 px-4 pb-4 min-h-0 relative">
        {showList && (
          <>
            <div className="absolute inset-0 z-40" onClick={() => setShowList(false)} />
            <div className="absolute top-0 left-4 z-50 w-48 max-h-80 overflow-y-auto p-2 bg-gray-900 border border-gray-700 shadow-xl">
              <NoteList items={filtered} selectedIdx={selectedIdx} onSelect={(idx) => { handleSelect(idx); setShowList(false); }} onDelete={handleDelete} />
            </div>
          </>
        )}
        <div className="flex-1 min-h-0 flex flex-col">
          {selectedNote ? (
            <>
              <div className="px-4 pt-2 pb-1 shrink-0">
                {editingTitle ? (
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={handleTitleKeyDown}
                    className="w-full text-lg font-semibold bg-transparent outline-none text-gray-900 dark:text-gray-100 pb-0.5"
                  />
                ) : (
                  <div
                    className="text-lg font-semibold text-gray-900 dark:text-gray-100 pb-0.5 cursor-pointer transition-colors hover:text-blue-500"
                    onClick={() => {
                      setTitleDraft(selectedNote.t || '');
                      setEditingTitle(true);
                    }}
                    title="Click to rename"
                  >
                    {selectedNote.t || 'Untitled'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <TipTapEditor
                  key={selectedNote.id}
                  content={selectedNote}
                  onChange={handleContentChange}
                  editorRef={editorRef}
                />
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Select or create a note
            </div>
          )}
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${deleteTarget?.t || 'Untitled'}"? It will be moved to backup.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setConfirmDelete(false); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
