import React from 'react';

export default function Sidebar({ activeTab, onTabChange, theme, onThemeToggle, onFormatToggle, showFormat, onClose }) {
  return (
    <div className="w-12 h-full bg-gray-900/95 border-r border-gray-800 flex flex-col items-center pt-1.5">
      <button
        onClick={onClose}
        className="w-9 h-9 flex items-center justify-center text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
        title="Close sidebar"
      >
        ◀
      </button>
      <div className="w-6 h-px bg-gray-800 my-1" />
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
