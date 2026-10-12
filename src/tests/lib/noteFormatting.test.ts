import { formatInline, formatLine, formatQuote } from '@/lib/noteFormatting';

describe('note formatting', () => {
  it('wraps and unwraps the selected text with inline Markdown', () => {
    expect(formatInline('hello world', { start: 6, end: 11 }, '**')).toEqual({
      text: 'hello **world**',
      selection: { start: 6, end: 15 },
    });
    expect(formatInline('hello **world**', { start: 6, end: 15 }, '**').text).toBe('hello world');
  });

  it('inserts inline markers at the cursor', () => {
    expect(formatInline('hello', { start: 2, end: 2 }, '*')).toEqual({
      text: 'he**llo',
      selection: { start: 3, end: 3 },
    });
  });

  it.each([
    ['heading-2', 'before\n## current\nafter'],
    ['bullet', 'before\n- current\nafter'],
    ['numbered', 'before\n1. current\nafter'],
    ['todo', 'before\n☐ current\nafter'],
    ['quote', 'before\n"current"\nafter'],
    ['paragraph', 'before\ncurrent\nafter'],
  ] as const)('changes the current line to %s', (type, expected) => {
    const result = formatLine('before\ncurrent\nafter', { start: 9, end: 9 }, type);
    expect(result.text).toBe(expected);
  });

  it('replaces an existing line prefix instead of stacking prefixes', () => {
    expect(formatLine('- item', { start: 4, end: 4 }, 'todo').text).toBe('☐ item');
  });

  it('wraps selected text in quotes and unwraps text already quoted', () => {
    expect(formatQuote('hello world', { start: 6, end: 11 })).toEqual({
      text: 'hello "world"',
      selection: { start: 7, end: 12 },
    });
    expect(formatQuote('hello "world"', { start: 6, end: 13 }).text).toBe('hello world');
  });

  it('converts a legacy blockquote line to quoted text', () => {
    expect(formatLine('before\n> current\nafter', { start: 10, end: 10 }, 'quote').text).toBe(
      'before\n"current"\nafter'
    );
  });
});
