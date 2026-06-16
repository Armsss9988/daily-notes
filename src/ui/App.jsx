import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadNotesFromDisk } from '../state/slices/notesSlice';
import { initializeTheme, setActiveTab, setSidebarOpen, setShowFormat } from '../state/slices/uiSlice';
import { selectLoading } from '../state/selectors/notesSelectors';
import { selectThemeReady, selectTheme, selectActiveTab, selectSidebarOpen, selectShowFormat } from '../state/selectors/uiSelectors';
import DailyTab from './features/daily/DailyTab';
import NotesTab from './features/notes/NotesTab';
import Sidebar from './sidebar/Sidebar';
import Toolbar from './editor/Toolbar';
import { Move } from 'lucide-react';

export default function App() {
  const dispatch = useDispatch();
  const loading = useSelector(selectLoading);
  const themeReady = useSelector(selectThemeReady);
  const theme = useSelector(selectTheme);
  const activeTab = useSelector(selectActiveTab);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const showFormat = useSelector(selectShowFormat);
  const [editorInstance, setEditorInstance] = useState(null);
  const sidebarRef = useRef(null);
  const sidebarOpenRef = useRef(sidebarOpen);
  sidebarOpenRef.current = sidebarOpen;

  useEffect(() => {
    dispatch(loadNotesFromDisk());
    dispatch(initializeTheme());
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        const wasOpen = sidebarOpenRef.current;
        dispatch(setSidebarOpen(!wasOpen));
        if (wasOpen) dispatch(setShowFormat(false));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e) => {
      if (!sidebarRef.current) return;
      if (sidebarRef.current.contains(e.target)) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      if (e.clientX < rect.right + 12) return;
      const tag = e.target?.tagName?.toLowerCase?.();
      if (tag === 'input' || tag === 'button' || e.target?.closest?.('button, input')) return;
      if (!showFormat) dispatch(setSidebarOpen(false));
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [sidebarOpen, showFormat, dispatch]);

  if (loading || !themeReady) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-lg text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex relative">
      <div className="fixed top-0 left-0 right-0 h-2 z-50" style={{ WebkitAppRegion: 'drag' }} />
      <button className="fixed top-1 right-1 z-50 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-grab active:cursor-grabbing"
        style={{ WebkitAppRegion: 'drag' }} title="Drag to move window">
        <Move size={14} />
      </button>
      {!sidebarOpen && (
        <div className="w-5 shrink-0 hover:bg-white/5 cursor-pointer z-40"
          onMouseEnter={() => dispatch(setSidebarOpen(true))} />
      )}
      <div ref={sidebarRef} className="flex shrink-0">
        <div className={`overflow-hidden shrink-0 ${sidebarOpen ? 'w-12' : 'w-0'}`}>
          <div className="w-12 h-full"><Sidebar /></div>
        </div>
        <div className={`overflow-hidden shrink-0 relative ${sidebarOpen && showFormat ? 'w-50' : 'w-0'}`}>
          <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-5 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors bg-gray-900 rounded"
            onClick={() => dispatch(setShowFormat(false))}>◀</button>
          <div className="w-50 h-full bg-gray-900 border-r border-gray-800 overflow-y-auto p-3">
            {editorInstance ? <Toolbar editor={editorInstance} variant="popup" /> : <p className="text-xs text-gray-500 italic">Open a note to format</p>}
          </div>
        </div>
      </div>
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'daily' ? <DailyTab /> : <NotesTab editorRef={setEditorInstance} />}
      </main>
    </div>
  );
}
