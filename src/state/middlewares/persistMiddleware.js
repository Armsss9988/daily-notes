import { saveNotes } from '../../data/repositories/notesRepo';
import { saveTheme } from '../../data/repositories/configRepo';

let saveTimer = null;

function saveToDisk(store) {
  const s = store.getState().notes;
  saveNotes({
    daily_notes: s.dailyNotes,
    notes: s.items,
    deleted_notes: s.deletedNotes,
    _selectedNoteId: s.selectedNoteId,
  });
}

function saveThemeToDisk(store) {
  saveTheme(store.getState().ui.theme);
}

export function createPersistMiddleware() {
  return (store) => (next) => (action) => {
    const result = next(action);

    if (action.type === 'notes/noteSelected') {
      saveToDisk(store);
    } else if (action.type.startsWith('notes/')) {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveToDisk(store), 2000);
    }

    if (action.type === 'ui/setTheme' || action.type === 'ui/toggleTheme') {
      saveThemeToDisk(store);
    }

    return result;
  };
}
