import React from 'react';

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-gray-900 border border-gray-700 p-5 shadow-xl min-w-60">
        <p className="text-sm text-gray-200 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 text-xs text-gray-300 hover:text-white transition-colors" onClick={onCancel}>
            Cancel
          </button>
          <button className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-500 transition-colors" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
