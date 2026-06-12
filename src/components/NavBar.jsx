import React from 'react';

export default function NavBar({ date, onPrev, onNext, onToday }) {
  const d = new Date(date);
  const formatted = d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <button onClick={onPrev} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <span className="text-lg">◀</span>
      </button>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm">{formatted}</span>
        {!isToday && (
          <button
            onClick={onToday}
            className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Today
          </button>
        )}
      </div>
      <button onClick={onNext} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <span className="text-lg">▶</span>
      </button>
    </div>
  );
}
