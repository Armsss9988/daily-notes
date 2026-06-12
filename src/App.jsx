import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from './hooks/useNotes';
import DailyTab from './components/DailyTab';
import NotesTab from './components/NotesTab';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import { Move } from 'lucide-react';

export default function App() {
  const notesManager = useNotes();
  const [activeTab, setActiveTab] = useState('daily');
  const [theme, setTheme] = useState('dark');
  const [editorInstance, setEditorInstance] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    window.api?.getTheme().then(t => {
      setTheme(t);
      document.documentElement.classList.toggle('dark', t === 'dark');
    });
  }, []);

  useEffect(() => {
    const handler = (event, t) => {
      setTheme(t);
      document.documentElement.classList.toggle('dark', t === 'dark');
    };
    window.api?.onThemeChanged?.(handler);
    return () => {};
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    window.api?.setTheme(next);
  };

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

  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e) => {
      if (!sidebarRef.current || sidebarRef.current.contains(e.target)) return;
      const tag = e.target?.tagName?.toLowerCase?.();
      if (tag === 'input' || tag === 'button' || e.target?.closest?.('button, input')) return;
      if (!showFormat) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [sidebarOpen, showFormat]);

  if (notesManager.loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-lg text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex relative">
      <div className="fixed top-0 left-0 right-0 h-2 z-50" style={{ WebkitAppRegion: 'drag' }} />
      <button
        className="fixed top-1 right-1 z-50 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-grab active:cursor-grabbing"
        style={{ WebkitAppRegion: 'drag' }}
        title="Drag to move window"
      >
        <Move size={14} />
      </button>
      {/* Hotzone */}
      {!sidebarOpen && (
        <div className="w-5 shrink-0 hover:bg-white/5 cursor-pointer z-40" onMouseEnter={() => setSidebarOpen(true)} />
      )}

      {/* Sidebar + Toolbar popup container */}
      <div ref={sidebarRef} className="flex shrink-0">
        {/* Sidebar — push layout */}
        <div className={`transition-all duration-200 ease-in-out overflow-hidden shrink-0 ${sidebarOpen ? 'w-12' : 'w-0'}`}>
          <div className="w-12 h-full">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              theme={theme}
              onThemeToggle={toggleTheme}
              showFormat={showFormat}
              onFormatToggle={() => setShowFormat(prev => !prev)}
              onClose={() => { setShowFormat(false); setSidebarOpen(false); }}
            />
          </div>
        </div>

        {/* Toolbar popup */}
        <div className={`transition-all duration-200 ease-in-out overflow-hidden shrink-0 relative ${sidebarOpen && showFormat ? 'w-50' : 'w-0'}`}>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-5 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors bg-gray-900 rounded"
            onClick={() => setShowFormat(false)}
          >◀</button>
          <div className="w-50 h-full bg-gray-900 border-r border-gray-800 overflow-y-auto p-3">
            {editorInstance ? (
              <Toolbar editor={editorInstance} variant="popup" />
            ) : (
              <p className="text-xs text-gray-500 italic">Open a note to format</p>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'daily' ? (
          <DailyTab notesManager={notesManager} editorRef={setEditorInstance} />
        ) : (
          <NotesTab notesManager={notesManager} editorRef={setEditorInstance} />
        )}
      </main>
    </div>
  );
}
