import type { NoteLineType, TextSelection } from '@/lib/noteFormatting';

export type NoteFormattingAction = 'bold' | 'italic' | NoteLineType;

export type NoteRichTextInputHandle = {
  focus: () => void;
  getMarkdown: () => Promise<string>;
  setMarkdown: (markdown: string) => void;
  format: (action: NoteFormattingAction, selection?: TextSelection) => void;
};

export type NoteRichTextInputProps = {
  value: string;
  onChangeMarkdown: (markdown: string) => void;
  onSelectionChange?: (selection: TextSelection) => void;
  placeholder: string;
  placeholderTextColor: string;
};
