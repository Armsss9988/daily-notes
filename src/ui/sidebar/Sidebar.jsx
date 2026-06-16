import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab, toggleTheme, setShowFormat } from '../../state/slices/uiSlice';

export default function Sidebar() {
  const dispatch = useDispatch();
  const theme = useSelector(s => s.ui.theme);
  const activeTab = useSelector(s => s.ui.activeTab);
  const showFormat = useSelector(s => s.ui.showFormat);

  const tabs = [
    { id: 'daily', label: '📅' },
    { id: 'notes', label: '📄' },
    { id: 'format', label: '🖌' },
  ];

  return (
    <div className="h-full flex flex-col items-center py-3 gap-3 bg-gray-900 border-r border-gray-800">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => {
            if (tab.id === 'format') {
              dispatch(setShowFormat(!showFormat));
            } else {
              dispatch(setActiveTab(tab.id));
            }
          }}
          className={`w-9 h-9 flex items-center justify-center text-lg transition-colors ${
            (tab.id === 'format' ? showFormat : activeTab === tab.id)
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
          title={tab.id}
        >
          {tab.label}
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={() => dispatch(toggleTheme())}
        className="w-9 h-9 flex items-center justify-center text-base text-gray-500 hover:text-gray-300 transition-colors"
        title="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
