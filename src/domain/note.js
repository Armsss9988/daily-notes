export function createNote({ id, title = 'New note', now }) {
  return {
    id,
    t: title,
    c: { text: '', fmts: [] },
    crt: now,
    u: now,
  };
}

export function updateNote(note, updates) {
  return { ...note, ...updates, u: updates.u || note.u };
}

export function deleteNote(note) {
  return { note, deletedAt: new Date().toISOString() };
}

export function hasTitle(note, query) {
  return (note.t || '').toLowerCase().includes(query.toLowerCase());
}
