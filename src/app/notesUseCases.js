import { createNote } from '../domain/note';
import { notesActions } from '../state/slices/notesSlice';

export function createNoteClicked(title = 'New note') {
  return (dispatch) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const note = createNote({ id, title, now });
    dispatch(notesActions.noteCreated(note));
  };
}

export function updateNoteContent({ id, content }) {
  return (dispatch) => {
    dispatch(notesActions.noteUpdated({ id, c: content, u: new Date().toISOString() }));
  };
}

export function updateNoteTitle({ id, title }) {
  return (dispatch) => {
    dispatch(notesActions.noteUpdated({
      id,
      t: title.trim().slice(0, 40),
      u: new Date().toISOString(),
    }));
  };
}

export function deleteNoteClicked(noteId) {
  return notesActions.noteDeleted(noteId);
}

export function restoreNoteClicked(noteId) {
  return notesActions.noteRestored(noteId);
}

export function selectNote(noteId) {
  return notesActions.noteSelected(noteId);
}
