import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createNoteClicked, updateNoteContent, updateNoteTitle, deleteNoteClicked, selectNote } from '../../../app/notesUseCases';
import { notesActions } from '../../../state/slices/notesSlice';
import { selectActiveNote, selectVisibleNotes } from '../../../state/selectors/notesSelectors';
import NoteList from './NoteList';
import TipTapEditor from '../../editor/TipTapEditor';
import ConfirmDialog from '../../shared/ConfirmDialog';

let savedNoteId = null;

export default function NotesTab({ editorRef }) {
  const dispatch = useDispatch();
  const items = useSelector(selectVisibleNotes);
  const selectedNoteId = useSelector(s => s.notes.selectedNoteId);
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showList, setShowList] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const titleInputRef = useRef(null);
  const newNoteIdRef = useRef(null);

  const allNotes = items;
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

  const selectedNote = selectedIdx !== null ? filtered[selectedIdx] || null : null;

  useEffect(() => {
    const id = savedNoteId || selectedNoteId;
    if (id) {
      const idx = filtered.findIndex(n => n.id === id);
      if (idx >= 0) setSelectedIdx(idx);
    }
  }, [filtered, selectedNoteId]);

  useEffect(() => {
    if (newNoteIdRef.current) {
      const idx = filtered.findIndex(n => n.id === newNoteIdRef.current);
      if (idx >= 0) {
        setSelectedIdx(idx);
        savedNoteId = newNoteIdRef.current;
        newNoteIdRef.current = null;
      }
    }
  }, [filtered]);

  const handleSelect = useCallback((idx) => {
    const note = filtered[idx];
    if (note) {
      savedNoteId = note.id;
      dispatch(selectNote(note.id));
    }
    setSelectedIdx(idx);
  }, [filtered, dispatch]);

  const handleTitleSubmit = useCallback(() => {
    if (selectedNote && titleDraft.trim()) {
      dispatch(updateNoteTitle({ id: selectedNote.id, title: titleDraft }));
    }
    setEditingTitle(false);
  }, [selectedNote, titleDraft, dispatch]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleTitleSubmit(); }
    if (e.key === 'Escape') setEditingTitle(false);
  }, [handleTitleSubmit]);

  const handleContentChange = useCallback((content) => {
    if (selectedNote) {
      dispatch(updateNoteContent({ id: selectedNote.id, content }));
    }
  }, [selectedNote, dispatch]);

  const handleAdd = useCallback(() => {
    const id = crypto.randomUUID();
    const newNote = {
      id,
      t: 'New note',
      c: { text: '', fmts: [] },
      crt: new Date().toISOString(),
      u: new Date().toISOString(),
    };
    dispatch(notesActions.noteCreated(newNote));
    savedNoteId = id;
    newNoteIdRef.current = id;
    setSearch('');
  }, [dispatch]);

  const handleDeleteToolbar = useCallback(() => {
    if (!selectedNote) return;
    setDeleteTarget(selectedNote);
    setConfirmDelete(true);
  }, [selectedNote]);

  const handleDeleteItem = useCallback((id) => {
    const target = filtered.find(n => n.id === id);
    if (!target) return;
    setDeleteTarget(target);
    setConfirmDelete(true);
  }, [filtered]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    dispatch(notesActions.noteDeleted(deleteTarget.id));
    if (selectedNote?.id === deleteTarget.id) {
      setSelectedIdx(null);
      savedNoteId = null;
    }
    setConfirmDelete(false);
    setDeleteTarget(null);
  }, [deleteTarget, selectedNote, dispatch]);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-1.5 px-4 pt-7 pb-2 shrink-0">
        <button onClick={() => setShowList(s => !s)}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title={showList ? 'Hide list' : 'Show list'}>
          <span className="text-sm">📋</span>
        </button>
        <button onClick={handleAdd}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Add note">
          <span className="text-base">✚</span>
        </button>
        {selectedNote && (
          <button onClick={handleDeleteToolbar}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete">
            <span className="text-sm">🗑</span>
          </button>
        )}
      </div>
      <div className="flex-1 flex gap-0 px-4 pb-4 min-h-0 relative">
        {showList && (
          <>
            <div className="absolute inset-0 z-40" onClick={() => setShowList(false)} />
            <div className="absolute top-0 left-4 z-50 w-56 max-h-96 overflow-y-auto bg-gray-900 border border-gray-700 shadow-xl">
              <div className="p-2 border-b border-gray-700">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                  <input type="text" placeholder="Search..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500" autoFocus />
                </div>
              </div>
              <div className="p-1">
                <NoteList items={filtered} selectedIdx={selectedIdx}
                  onSelect={(idx) => { handleSelect(idx); setShowList(false); }}
                  onDelete={handleDeleteItem} />
              </div>
            </div>
          </>
        )}
        <div className="flex-1 min-h-0 flex flex-col">
          {selectedNote ? (
            <>
              <div className="px-4 pt-2 pb-1 shrink-0">
                {editingTitle ? (
                  <input ref={titleInputRef} type="text" value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={handleTitleSubmit} onKeyDown={handleTitleKeyDown}
                    className="w-full text-lg font-semibold bg-transparent outline-none text-gray-900 dark:text-gray-100 pb-0.5" />
                ) : (
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 pb-0.5 cursor-pointer transition-colors hover:text-blue-500"
                    onClick={() => { setTitleDraft(selectedNote.t || ''); setEditingTitle(true); }}
                    title="Click to rename">
                    {selectedNote.t || 'Untitled'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <TipTapEditor key={selectedNote.id} content={selectedNote}
                  onChange={handleContentChange} editorRef={editorRef} />
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
