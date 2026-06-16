import { notesActions } from '../state/slices/notesSlice';

export function changeDailyNote({ date, doc, c }) {
  return notesActions.dailyNoteChanged({ date, doc, c });
}
