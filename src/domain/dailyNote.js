export function hasContent(note) {
  return !!(note?.c?.text?.trim());
}

export function isEmpty(note) {
  return !note || !note.c?.text?.trim();
}
