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
    try { await onRegenerate(); } finally { setLoading(false); }
  }, [onRegenerate]);

  const handleCreateDraft = useCallback(async () => {
    setLoading(true);
    try { await onCreateDraft({ learning_items: items, questions, gains }); } finally { setLoading(false); }
  }, [items, questions, gains, onCreateDraft]);

  const updateItem = (idx, field, val) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
  const addItem = () => setItems(prev => [...prev, { content: '', progress: '' }]);
  const updateGain = (idx, val) => setGains(prev => prev.map((g, i) => i === idx ? val : g));
  const removeGain = (idx) => setGains(prev => prev.filter((_, i) => i !== idx));
  const addGain = () => setGains(prev => [...prev, '']);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (visible) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 shadow-xl min-w-[520px] max-w-[640px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-200">Generate Report - {date}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl px-1 leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Learning Items</h3>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <textarea className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 text-xs p-2 h-16 resize-y rounded"
                    value={item.content} onChange={e => updateItem(i, 'content', e.target.value)} placeholder="Content" />
                  <textarea className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 text-xs p-2 h-16 resize-y rounded"
                    value={item.progress} onChange={e => updateItem(i, 'progress', e.target.value)} placeholder="Progress" />
                  <button onClick={() => removeItem(i)} className="text-gray-500 hover:text-red-400 text-lg px-1 leading-none mt-1">&times;</button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">+ Add Item</button>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Questions</h3>
            <textarea className="w-full bg-gray-800 border border-gray-600 text-gray-200 text-xs p-2 h-20 resize-y rounded"
              value={questions} onChange={e => setQuestions(e.target.value)} placeholder="Questions..." />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gains</h3>
            <div className="space-y-2">
              {gains.map((gain, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-xs text-gray-500 mt-2 min-w-4">{i + 1}.</span>
                  <textarea className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 text-xs p-2 h-12 resize-y rounded"
                    value={gain} onChange={e => updateGain(i, e.target.value)} placeholder="Gain..." />
                  <button onClick={() => removeGain(i)} className="text-gray-500 hover:text-red-400 text-lg px-1 leading-none mt-1">&times;</button>
                </div>
              ))}
            </div>
            <button onClick={addGain} className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">+ Add Gain</button>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700">
          <button onClick={handleRegenerate} disabled={loading}
            className="px-3 py-1.5 text-xs text-gray-300 border border-gray-600 hover:bg-gray-700 disabled:opacity-40 transition-colors rounded">
            {loading ? 'Working...' : 'Regenerate'}
          </button>
          <button onClick={handleCreateDraft} disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-colors rounded">
            {loading ? 'Working...' : 'Create Email Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
