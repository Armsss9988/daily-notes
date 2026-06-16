import React, { useState, useMemo } from 'react';
import { List, ListOrdered, Quote, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];
const HEADING_ICONS = [null, Heading1, Heading2, Heading3];

export default function Toolbar({ editor, variant = 'inline' }) {
  const [showColor, setShowColor] = useState(false);
  const [showBg, setShowBg] = useState(false);

  const currentFontSize = useMemo(() => {
    if (!editor) return '10';
    const style = editor.getAttributes('textStyle').style || '';
    const m = style.match(/font-size:\s*(\d+)px/);
    return m ? m[1] : '10';
  }, [editor?.getAttributes('textStyle')?.style]);

  if (!editor) return null;

  const btnClass = (active) =>
    `px-2 py-1 text-sm rounded transition-colors ${
      active
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  if (variant === 'popup') {
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Style</div>
          <div className="flex gap-1 flex-wrap">
            <button className={btnClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><strong>B</strong></button>
            <button className={btnClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><em>I</em></button>
            <button className={btnClass(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><u>U</u></button>
            <div className="relative">
              <button className={btnClass(false)} onClick={() => { setShowColor(!showColor); setShowBg(false); }} title="Text color">🎨</button>
              {showColor && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-10 flex flex-wrap gap-1 w-40">
                  {['#e0e0e0', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#000000'].map(c => (
                    <button key={c} className="w-6 h-6 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: c }} onClick={() => { editor.chain().focus().setColor(c).run(); setShowColor(false); }} />
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button className={btnClass(false)} onClick={() => { setShowBg(!showBg); setShowColor(false); }} title="Highlight">HL</button>
              {showBg && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-10 flex flex-wrap gap-1 w-40">
                  {['#fbbf24', '#f87171', '#34d399', '#60a5fa', '#fef08a', '#fecaca', '#d9f99d', '#bfdbfe'].map(c => (
                    <button key={c} className="w-6 h-6 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: c }} onClick={() => { editor.chain().focus().setHighlight({ color: c }).run(); setShowBg(false); }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Heading</div>
          <div className="flex gap-1">
            {[1, 2, 3].map(level => {
              const Icon = HEADING_ICONS[level];
              return (
                <button key={level} className={btnClass(editor.isActive('heading', { level }))} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} title={`Heading ${level}`}>
                  {Icon && <Icon size={14} />}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">List</div>
          <div className="flex gap-1">
            <button className={btnClass(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List size={14} /></button>
            <button className={btnClass(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list"><ListOrdered size={14} /></button>
            <button className={btnClass(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote"><Quote size={14} /></button>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Align</div>
          <div className="flex gap-1">
            <button className={btnClass(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left"><AlignLeft size={14} /></button>
            <button className={btnClass(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align center"><AlignCenter size={14} /></button>
            <button className={btnClass(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right"><AlignRight size={14} /></button>
            <button className={btnClass(editor.isActive({ textAlign: 'justify' }))} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justify"><AlignJustify size={14} /></button>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Size</div>
          <select className="text-xs px-1 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full"
            value={currentFontSize} onChange={(e) => { editor.chain().focus().setFontSize(parseInt(e.target.value)).run(); }}>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 flex-wrap shrink-0">
      <button className={btnClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)"><strong>B</strong></button>
      <button className={btnClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)"><em>I</em></button>
      <button className={btnClass(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)"><u>U</u></button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <div className="relative">
        <button className={btnClass(false)} onClick={() => { setShowColor(!showColor); setShowBg(false); }} title="Text color"><span style={{ color: '#f87171' }}>A</span></button>
        {showColor && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 flex flex-wrap gap-1 w-40">
            {['#e0e0e0', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#000000'].map(c => (
              <button key={c} className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600" style={{ backgroundColor: c }} onClick={() => { editor.chain().focus().setColor(c).run(); setShowColor(false); }} />
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        <button className={btnClass(false)} onClick={() => { setShowBg(!showBg); setShowColor(false); }} title="Highlight"><span style={{ color: '#fbbf24' }}>HL</span></button>
        {showBg && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 flex flex-wrap gap-1 w-40">
            {['#fbbf24', '#f87171', '#34d399', '#60a5fa', '#fef08a', '#fecaca', '#d9f99d', '#bfdbfe'].map(c => (
              <button key={c} className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600" style={{ backgroundColor: c }} onClick={() => { editor.chain().focus().setHighlight({ color: c }).run(); setShowBg(false); }} />
            ))}
          </div>
        )}
      </div>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button className={btnClass(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List size={16} /></button>
      <button className={btnClass(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list"><ListOrdered size={16} /></button>
      <button className={btnClass(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote"><Quote size={16} /></button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      {[1, 2, 3].map(level => {
        const Icon = HEADING_ICONS[level];
        return (
          <button key={level} className={btnClass(editor.isActive('heading', { level }))} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} title={`Heading ${level}`}>
            {Icon && <Icon size={16} />}
          </button>
        );
      })}
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button className={btnClass(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left"><AlignLeft size={16} /></button>
      <button className={btnClass(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align center"><AlignCenter size={16} /></button>
      <button className={btnClass(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right"><AlignRight size={16} /></button>
      <button className={btnClass(editor.isActive({ textAlign: 'justify' }))} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justify"><AlignJustify size={16} /></button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <select className="text-xs px-1 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        value={currentFontSize} onChange={(e) => { editor.chain().focus().setFontSize(parseInt(e.target.value)).run(); }}>
        {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}
