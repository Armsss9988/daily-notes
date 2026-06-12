import { describe, it, expect } from 'vitest';
import { textToDoc, docToTextAndFmts } from '../src/utils/formatSchema';

describe('formatSchema', () => {
  it('converts plain text round-trip', () => {
    const text = 'Hello world';
    const fmts = [{ s: 0, e: 11, b: false, i: false, u: false, c: null, g: null, z: null }];
    const doc = textToDoc(text, fmts);
    const result = docToTextAndFmts(doc);
    expect(result.text).toBe(text);
  });

  it('converts bold text', () => {
    const text = 'Hello world';
    const fmts = [{ s: 0, e: 5, b: true, i: false, u: false, c: null, g: null, z: null }];
    const doc = textToDoc(text, fmts);
    const result = docToTextAndFmts(doc);
    expect(result.fmts[0].b).toBe(true);
    expect(result.fmts[0].s).toBe(0);
    expect(result.fmts[0].e).toBe(5);
  });

  it('handles empty text', () => {
    const doc = textToDoc('', []);
    const result = docToTextAndFmts(doc);
    expect(result.text).toBe('');
    expect(result.fmts).toEqual([]);
  });
});
