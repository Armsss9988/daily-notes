export const selectItems = (state) => state.notes.items;
export const selectDailyNotes = (state) => state.notes.dailyNotes;
export const selectDeletedNotes = (state) => state.notes.deletedNotes;
export const selectSelectedNoteId = (state) => state.notes.selectedNoteId;
export const selectLoading = (state) => state.notes.loading;

export const selectActiveNote = (state) => {
  const id = state.notes.selectedNoteId;
  if (!id) return null;
  return state.notes.items.find(n => n.id === id) || null;
};

export const selectVisibleNotes = (state) => {
  return [...state.notes.items].sort((a, b) => (b.u || '').localeCompare(a.u || ''));
};

export const selectDailyNote = (date) => (state) => {
  return state.notes.dailyNotes[date] || null;
};
