import React from 'react';

export default function NoteList({ items, selectedIdx, onSelect, onDelete }) {
  if (items.length === 0) {
    return <div className="text-center py-8 text-gray-400 text-sm">No notes yet</div>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${
            i === selectedIdx ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-200'
          }`}
        >
          <button onClick={() => onSelect(i)} className="flex-1 text-left truncate">
            {item.t || 'Untitled'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="p-0.5 opacity-40 hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity shrink-0"
            title="Delete"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>
      ))}
    </div>
  );
}
