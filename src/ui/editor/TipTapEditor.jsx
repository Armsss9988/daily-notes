import React, { useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextColor } from '../../extensions/TextColor';
import { FontSize } from '../../extensions/FontSize';
import { textToDoc, docToTextAndFmts } from '../../utils/formatSchema';

function resolveContent(content) {
  if (!content) return { type: 'doc', content: [{ type: 'paragraph' }] };
  if (content.doc) return content.doc;
  const c = content.c;
  if (!c) return textToDoc(content.text, content.fmts);
  if (c.doc) return c.doc;
  if (c.c) return textToDoc(c.c.text, c.c.fmts);
  return textToDoc(c.text, c.fmts);
}

export default function TipTapEditor({ content, onChange, editorRef }) {
  const theme = useSelector(s => s.ui.theme);
  const initialDoc = useMemo(() => resolveContent(content), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
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
        class: 'prose prose-sm max-w-none focus:outline-none px-6 py-4',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: `prose prose-sm max-w-none focus:outline-none px-6 py-4${theme === 'dark' ? ' prose-invert' : ''}`,
        },
      },
    });
  }, [editor, theme]);

  useEffect(() => {
    if (editor && editorRef) editorRef(editor);
  }, [editor, editorRef]);

  if (!editor) return null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200/40 dark:border-gray-600/40 cursor-text">
      <EditorContent editor={editor} />
    </div>
  );
}
