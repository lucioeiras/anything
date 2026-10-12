export type TextSelection = { start: number; end: number };

export type NoteLineType =
  'paragraph' | 'heading-1' | 'heading-2' | 'heading-3' | 'bullet' | 'numbered' | 'todo' | 'quote';

export function formatQuote(
  text: string,
  selection: TextSelection
): { text: string; selection: TextSelection } {
  const start = Math.max(0, Math.min(selection.start, text.length));
  const end = Math.max(start, Math.min(selection.end, text.length));
  const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const nextBreak = text.indexOf('\n', start);
  const lineEnd = nextBreak < 0 ? text.length : nextBreak;
  const useLine = start === end;
  const rangeStart = useLine ? lineStart : start;
  const rangeEnd = useLine ? lineEnd : end;
  let selected = text.slice(rangeStart, rangeEnd);
  selected = selected.replace(/^\s*>\s?/, '');

  const isQuoted = selected.startsWith('"') && selected.endsWith('"') && selected.length >= 2;
  const replacement = isQuoted ? selected.slice(1, -1) : `"${selected}"`;
  const next = text.slice(0, rangeStart) + replacement + text.slice(rangeEnd);
  const nextStart = isQuoted ? rangeStart : rangeStart + 1;
  const nextEnd = isQuoted ? rangeStart + replacement.length : rangeStart + replacement.length - 1;
  return { text: next, selection: { start: nextStart, end: nextEnd } };
}

export function formatInline(
  text: string,
  selection: TextSelection,
  marker: '**' | '*'
): { text: string; selection: TextSelection } {
  const start = Math.max(0, Math.min(selection.start, text.length));
  const end = Math.max(start, Math.min(selection.end, text.length));
  if (start === end) {
    const next = `${text.slice(0, start)}${marker}${marker}${text.slice(end)}`;
    return { text: next, selection: { start: start + marker.length, end: start + marker.length } };
  }

  const selected = text.slice(start, end);
  const alreadyFormatted = selected.startsWith(marker) && selected.endsWith(marker);
  const replacement = alreadyFormatted
    ? selected.slice(marker.length, -marker.length)
    : `${marker}${selected}${marker}`;
  return {
    text: text.slice(0, start) + replacement + text.slice(end),
    selection: alreadyFormatted
      ? { start, end: start + replacement.length }
      : { start, end: start + replacement.length },
  };
}

export function formatLine(
  text: string,
  selection: TextSelection,
  type: NoteLineType
): { text: string; selection: TextSelection } {
  if (type === 'quote') return formatQuote(text, selection);
  const cursor = Math.max(0, Math.min(selection.start, text.length));
  const lineStart = text.lastIndexOf('\n', Math.max(0, cursor - 1)) + 1;
  const nextBreak = text.indexOf('\n', cursor);
  const lineEnd = nextBreak < 0 ? text.length : nextBreak;
  const line = text.slice(lineStart, lineEnd);
  const content = line.replace(
    /^\s*(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|[☐☑]\s+|\d+[.)]\s+|>\s?)/,
    ''
  );
  const prefix: Record<NoteLineType, string> = {
    paragraph: '',
    'heading-1': '# ',
    'heading-2': '## ',
    'heading-3': '### ',
    bullet: '- ',
    numbered: '1. ',
    todo: '☐ ',
    quote: '',
  };
  const replacement = `${prefix[type]}${content}`;
  const next = text.slice(0, lineStart) + replacement + text.slice(lineEnd);
  const delta = replacement.length - line.length;
  const adjustedStart =
    selection.start >= lineEnd
      ? selection.start + delta
      : Math.max(
          lineStart + prefix[type].length,
          selection.start + (selection.start > lineStart ? delta : 0)
        );
  const adjustedEnd =
    selection.end >= lineEnd
      ? selection.end + delta
      : Math.max(adjustedStart, selection.end + (selection.end > lineStart ? delta : 0));
  return { text: next, selection: { start: adjustedStart, end: adjustedEnd } };
}
