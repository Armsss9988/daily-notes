export function textToDoc(text, fmts) {
  if (!text) return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };

  const sorted = [...(fmts || [])].sort((a, b) => a.s - b.s);
  const points = [];
  for (const f of sorted) {
    points.push({ pos: f.s, start: true, f });
    points.push({ pos: f.e, start: false, f });
  }
  points.sort((a, b) => a.pos - b.pos || (a.start ? -1 : 1));

  const activeMarks = [];
  const spans = [];
  let cursor = 0;

  for (const p of points) {
    if (p.pos > cursor) {
      spans.push({
        text: text.slice(cursor, p.pos),
        marks: activeMarks.flatMap(m => markForFmt(m)),
      });
    }
    if (p.start) activeMarks.push(p.f);
    else {
      const idx = activeMarks.lastIndexOf(p.f);
      if (idx >= 0) activeMarks.splice(idx, 1);
    }
    cursor = Math.max(cursor, p.pos);
  }

  if (cursor < text.length) {
    spans.push({
      text: text.slice(cursor),
      marks: activeMarks.flatMap(m => markForFmt(m)),
    });
  }

  if (spans.length === 0 && text) {
    spans.push({ text, marks: [] });
  }

  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: spans.filter(s => s.text).map(s => ({
        type: 'text',
        text: s.text,
        marks: s.marks.length > 0 ? s.marks : undefined,
      })),
    }],
  };
}

function markForFmt(f) {
  const marks = [];
  if (f.b) marks.push({ type: 'bold' });
  if (f.i) marks.push({ type: 'italic' });
  if (f.u) marks.push({ type: 'underline' });
  if (f.g) marks.push({ type: 'highlight', attrs: { color: f.g } });
  const styleParts = [];
  if (f.c) styleParts.push(`color: ${f.c}`);
  if (f.z) styleParts.push(`font-size: ${f.z}px`);
  if (styleParts.length > 0) {
    marks.push({ type: 'textStyle', attrs: { style: styleParts.join('; ') } });
  }
  return marks;
}

export function docToTextAndFmts(doc) {
  const textParts = [];
  const fmts = [];
  let offset = 0;

  function walkNode(node) {
    if (node.type === 'text') {
      const start = offset;
      textParts.push(node.text);
      const end = offset + node.text.length;

      if (node.marks && node.marks.length > 0) {
        const fmt = { s: start, e: end, b: false, i: false, u: false, c: null, g: null, z: null };
        for (const m of node.marks) {
          if (m.type === 'bold') fmt.b = true;
          if (m.type === 'italic') fmt.i = true;
          if (m.type === 'underline') fmt.u = true;
          if (m.type === 'textStyle' && m.attrs?.style) {
            const style = m.attrs.style;
            const cm = style.match(/color:\s*([^;]+)/);
            if (cm) fmt.c = cm[1].trim();
            const zm = style.match(/font-size:\s*(\d+)px/);
            if (zm) fmt.z = parseInt(zm[1]);
          }
          if (m.type === 'highlight') fmt.g = m.attrs?.color || '#fbbf24';
        }
        fmts.push(fmt);
      }
      offset = end;
    }
    if (node.content) {
      for (const child of node.content) walkNode(child);
    }
  }

  if (doc?.content) {
    for (const node of doc.content) walkNode(node);
  }

  return { text: textParts.join(''), fmts };
}
