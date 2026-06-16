import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loadNotes } from '../../data/repositories/notesRepo';

const defaultData = { daily_notes: {}, notes: [], deleted_notes: [], _selectedNoteId: null };

export const loadNotesFromDisk = createAsyncThunk('notes/load', async () => {
  const data = await loadNotes();
  return data || defaultData;
});

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    items: [],
    dailyNotes: {},
    deletedNotes: [],
    selectedNoteId: null,
    loading: true,
  },
  reducers: {
    noteCreated(state, action) {
      state.items.push(action.payload);
      state.selectedNoteId = action.payload.id;
    },
    noteUpdated(state, action) {
      const { id, ...updates } = action.payload;
      const idx = state.items.findIndex(n => n.id === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updates };
    },
    noteDeleted(state, action) {
      const id = action.payload;
      const idx = state.items.findIndex(n => n.id === id);
      if (idx >= 0) {
        state.deletedNotes.push({ note: state.items[idx], deletedAt: new Date().toISOString() });
        state.items.splice(idx, 1);
      }
      if (state.selectedNoteId === id) state.selectedNoteId = null;
    },
    noteRestored(state, action) {
      const id = action.payload;
      const idx = state.deletedNotes.findIndex(e => e.note.id === id);
      if (idx >= 0) {
        state.items.push(state.deletedNotes[idx].note);
        state.deletedNotes.splice(idx, 1);
      }
    },
    dailyNoteChanged(state, action) {
      const { date, note } = action.payload;
      if (note && note.c?.text?.trim()) {
        state.dailyNotes[date] = note;
      } else {
        delete state.dailyNotes[date];
      }
    },
    noteSelected(state, action) {
      state.selectedNoteId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotesFromDisk.pending, (state) => { state.loading = true; })
      .addCase(loadNotesFromDisk.fulfilled, (state, action) => {
        const d = action.payload;
        state.items = d.notes || [];
        state.dailyNotes = d.daily_notes || {};
        state.deletedNotes = d.deleted_notes || [];
        state.selectedNoteId = d._selectedNoteId || null;
        state.loading = false;
      })
      .addCase(loadNotesFromDisk.rejected, (state) => { state.loading = false; });
  },
});

export const notesActions = notesSlice.actions;
export default notesSlice.reducer;
