import { Extension } from '@tiptap/core';

function updateStyle(attrs, prop, value) {
  const old = (attrs?.style || '').split(';').map(s => s.trim()).filter(Boolean);
  const filtered = old.filter(s => !s.startsWith(prop + ':'));
  if (value) filtered.push(`${prop}: ${value}`);
  return filtered.length > 0 ? filtered.join('; ') : null;
}

export const FontSize = Extension.create({
  name: 'fontSize',

  addCommands() {
    return {
      setFontSize: (size) => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        const markType = state.schema.marks.textStyle;
        if (!markType) return false;
        const oldAttrs = selection.$from.marks().find(m => m.type === markType)?.attrs;
        const style = updateStyle(oldAttrs, 'font-size', `${size}px`);
        tr.addMark(selection.$from.pos, selection.$to.pos, markType.create(style ? { style } : {}));
        if (dispatch) dispatch(tr);
        return true;
      },
    };
  },
});
