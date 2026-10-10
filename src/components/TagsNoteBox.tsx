import { NotePencilIcon, TagIcon, XIcon } from 'phosphor-react-native';
import { useRef } from 'react';
import {
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';

export type TagsNoteBoxProps = {
  tags: string[];
  autoTags?: string[];
  onTagsChange: (tags: string[] | ((prev: string[]) => string[])) => void;
  tagInput: string;
  onTagInputChange: (text: string) => void;
  note: string;
  onNoteChange: (text: string) => void;
  activeTab: 'tags' | 'note';
  onActiveTabChange: (tab: 'tags' | 'note') => void;
  tagsInputRef?: React.RefObject<TextInput | null>;
  noteInputRef?: React.RefObject<TextInput | null>;
  notePlaceholder?: string;
  onSubmitTag?: () => void;
  className?: string;
};

export function TagsNoteBox({
  tags,
  autoTags,
  onTagsChange,
  tagInput,
  onTagInputChange,
  note,
  onNoteChange,
  activeTab,
  onActiveTabChange,
  tagsInputRef,
  noteInputRef,
  notePlaceholder = 'Add a text note...',
  onSubmitTag,
  className = '',
}: TagsNoteBoxProps) {
  const fallbackTagsRef = useRef<TextInput>(null);
  const fallbackNoteRef = useRef<TextInput>(null);

  const effectiveTagsRef = tagsInputRef ?? fallbackTagsRef;
  const effectiveNoteRef = noteInputRef ?? fallbackNoteRef;

  const handleSelectTagsTab = () => {
    onActiveTabChange('tags');
    setTimeout(() => {
      effectiveTagsRef.current?.focus();
    }, 100);
  };

  const handleSelectNoteTab = () => {
    onActiveTabChange('note');
    setTimeout(() => {
      effectiveNoteRef.current?.focus();
    }, 100);
  };

  const handleTagInputChange = (text: string) => {
    if (text.includes(' ') || text.includes(',')) {
      const parts = text.split(/[\s,]+/);
      const endsWithDelimiter = text.endsWith(' ') || text.endsWith(',');
      const tokensToAdd = endsWithDelimiter
        ? parts.filter(Boolean)
        : parts.slice(0, -1).filter(Boolean);
      const remainder = endsWithDelimiter ? '' : parts[parts.length - 1];

      if (tokensToAdd.length > 0) {
        onTagsChange((prev) => {
          const next = [...prev];
          for (const token of tokensToAdd) {
            const clean = token.replace(/^#/, '').trim();
            if (clean && !next.includes(clean)) {
              next.push(clean);
            }
          }
          return next;
        });
      }
      onTagInputChange(remainder);
    } else {
      onTagInputChange(text);
    }
  };

  const handleTagInputKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      onTagsChange((prev) => prev.slice(0, -1));
    }
  };

  const handleTagInputSubmit = () => {
    const clean = tagInput.replace(/^#/, '').trim();
    if (clean) {
      if (!tags.includes(clean)) {
        onTagsChange((prev) => [...prev, clean]);
      }
      onTagInputChange('');
    } else {
      onSubmitTag?.();
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onTagsChange((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <View className={`w-full min-h-[220px] ${className}`}>
      {/* 2 Tabs Switcher */}
      <View className="w-full flex-row items-center justify-center gap-2 mb-3 self-center">
        <Pressable
          onPress={handleSelectTagsTab}
          className="flex-grow justify-center flex-row items-center gap-1.5 px-5 py-2 rounded-xl"
        >
          <TagIcon size={16} color={activeTab === 'tags' ? '#FFFFFF' : '#71717A'} weight="bold" />
          <Text
            className={`font-sans-semibold text-sm tracking-wider uppercase ${
              activeTab === 'tags' ? 'text-white' : 'text-zinc-500'
            }`}
          >
            TAGS{tags.length > 0 ? ` (${tags.length})` : ''}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSelectNoteTab}
          className="flex-grow justify-center flex-row items-center gap-1.5 px-5 py-2 rounded-xl"
        >
          <NotePencilIcon
            size={16}
            color={activeTab === 'note' ? '#FFFFFF' : '#71717A'}
            weight="bold"
          />
          <Text
            className={`font-sans-semibold text-sm tracking-wider uppercase ${
              activeTab === 'note' ? 'text-white' : 'text-zinc-400'
            }`}
          >
            NOTE{note.trim().length > 0 ? ' •' : ''}
          </Text>
        </Pressable>
      </View>

      {/* Tab 1: Tags Content */}
      {activeTab === 'tags' && (
        <View className="flex-1 w-full flex-row flex-wrap items-center justify-start min-h-[140px] gap-2 p-6 bg-zinc-900/70 rounded-3xl">
          {tags.length > 0 &&
            tags.map((tag, idx) => {
              const isAuto = autoTags?.includes(tag);
              return (
                <Pressable
                  key={`${tag}-${idx}`}
                  onPress={() => handleRemoveTag(idx)}
                  className={`flex-row items-center gap-2 rounded-full px-3 py-1 active:opacity-70 ${
                    isAuto ? 'bg-white' : 'bg-blue-500/15'
                  }`}
                >
                  <Text
                    className={`font-sans-medium text-base ${
                      isAuto ? 'text-black' : 'text-blue-400'
                    }`}
                  >
                    #{tag}
                  </Text>
                  <XIcon size={14} color={isAuto ? '#000000' : '#61A5FA'} />
                </Pressable>
              );
            })}

          <TextInput
            ref={effectiveTagsRef}
            value={tagInput}
            onChangeText={handleTagInputChange}
            onKeyPress={handleTagInputKeyPress}
            placeholder={tags.length === 0 ? 'Add tags here...' : '+ Add more'}
            placeholderTextColor="#71717a"
            returnKeyType="done"
            onSubmitEditing={handleTagInputSubmit}
            className="font-sans text-base leading-tight text-zinc-300 flex-grow"
            style={styles.borderlessInput}
            underlineColorAndroid="transparent"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      {/* Tab 2: Note Content */}
      {activeTab === 'note' && (
        <View className="flex-1 w-full justify-start min-h-[140px] p-6 pt-4 bg-zinc-900/70 rounded-3xl">
          <TextInput
            ref={effectiveNoteRef}
            value={note}
            onChangeText={onNoteChange}
            placeholder={notePlaceholder}
            placeholderTextColor="#71717a"
            multiline
            textAlignVertical="top"
            className="w-full flex-1 font-sans text-base text-zinc-100 leading-6"
            style={styles.borderlessInput}
            underlineColorAndroid="transparent"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  borderlessInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
