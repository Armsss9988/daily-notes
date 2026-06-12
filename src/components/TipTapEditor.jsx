import React, { useMemo, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextColor } from '../extensions/TextColor';
import { FontSize } from '../extensions/FontSize';
import { textToDoc, docToTextAndFmts } from '../utils/formatSchema';

function resolveContent(content) {
  const c = content?.c || content || {};
  if (c.doc) return c.doc;
  if (c.c) return textToDoc(c.c.text, c.c.fmts);
  return textToDoc(c.text, c.fmts);
}

export default function TipTapEditor({ content, onChange, editorRef }) {
  const initialDoc = useMemo(() => resolveContent(content), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextColor,
      FontSize,
    ],
    content: initialDoc,
    onUpdate: ({ editor }) => {
      const doc = editor.getJSON();
      const { text, fmts } = docToTextAndFmts(doc);
      onChange?.({ doc, c: { text, fmts } });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-6 py-4',
      },
    },
  });

  useEffect(() => {
    if (editor && editorRef) {
      editorRef(editor);
    }
  }, [editor, editorRef]);

  if (!editor) return null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <EditorContent editor={editor} />
    </div>
  );
}
