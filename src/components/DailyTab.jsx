import React, { useState, useCallback } from 'react';
import NavBar from './NavBar';
import TipTapEditor from './TipTapEditor';

export default function DailyTab({ notesManager, editorRef }) {
  const today = new Date().toISOString().split('T')[0];
  const [cdate, setCdate] = useState(today);
  const [generating, setGenerating] = useState(false);

  const note = notesManager.dailyNote(cdate);

  const handleChange = useCallback((content) => {
    notesManager.setDailyNote(cdate, content);
  }, [cdate, notesManager]);

  const goPrev = useCallback(() => {
    const d = new Date(cdate);
    d.setDate(d.getDate() - 1);
    setCdate(d.toISOString().split('T')[0]);
  }, [cdate]);

  const goNext = useCallback(() => {
    const d = new Date(cdate);
    d.setDate(d.getDate() + 1);
    setCdate(d.toISOString().split('T')[0]);
  }, [cdate]);

  const goToday = useCallback(() => {
    setCdate(today);
  }, [today]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      notesManager.saveNow();
      const note = notesManager.dailyNote(cdate);
      const noteText = note?.c?.text?.trim() || '';
      await window.api.generateReport(noteText, cdate);
    } catch (err) {
      alert('Failed to generate report: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }, [cdate, notesManager]);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <NavBar date={cdate} onPrev={goPrev} onNext={goNext} onToday={goToday} />
      <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col">
        <TipTapEditor
          key={cdate}
          content={note || {}}
          onChange={handleChange}
          editorRef={editorRef}
        />
        <div className="flex justify-end pt-2 gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
