import { CheckIcon, InfoIcon, NotePencilIcon, TextTIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TagsBox } from '@/components/TagsBox';

import { useLibrary } from '@/hooks/useLibrary';
import type { NoteItem, QuoteItem } from '@/lib/library/types';
import { generateAutoTags, generateAutoTagsAsync } from '@/lib/tags/autoTags';

type NewNoteModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (item: NoteItem | QuoteItem) => void;
};

export function NewNoteModal({ visible, onClose, onSaved }: NewNoteModalProps) {
  const { addTextItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);

  const [view, setView] = useState<'editor' | 'info'>('editor');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);

  const existingTags = useMemo(
    () => (visible ? getTags().map((t) => t.tag) : []),
    [getTags, visible]
  );

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    if (saving) return;
    setText('');
    setTitle('');
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setView('editor');
    onClose();
  };

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addTextItem(trimmed, title.trim() || undefined, {
        tags: finalTags.length > 0 ? finalTags : undefined,
        autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
      });
      setText('');
      setTitle('');
      setTags([]);
      setAutoTags([]);
      autoTagsRef.current = [];
      setTagInput('');
      setView('editor');
      onSaved?.(item);
      onClose();
    } catch (e) {
      console.error('Failed to save note:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToInfo = () => {
    // 1. Instant baseline tags
    const auto = generateAutoTags({
      title: title.trim(),
      text: text.trim(),
      existingTags,
    });
    if (auto.length > 0) {
      setTags((prev) => {
        const next = [...prev];
        for (const t of auto) {
          if (!next.includes(t)) {
            next.push(t);
          }
        }
        return next;
      });
      const nextAuto = [...new Set([...autoTagsRef.current, ...auto])];
      autoTagsRef.current = nextAuto;
      setAutoTags(nextAuto);
    }

    // 2. On-device LLM semantic enrichment in background
    generateAutoTagsAsync({
      title: title.trim(),
      text: text.trim(),
      existingTags,
    })
      .then((aiTags) => {
        if (aiTags.length > 0) {
          setTags((prev) => {
            const next = [...prev];
            for (const t of aiTags) {
              if (!next.includes(t)) {
                next.push(t);
              }
            }
            return next;
          });
          const nextAiAuto = [...new Set([...autoTagsRef.current, ...aiTags])];
          autoTagsRef.current = nextAiAuto;
          setAutoTags(nextAiAuto);
        }
      })
      .catch(() => {});

    setView('info');
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleSwitchToEditor = () => {
    setView('editor');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const canSave = text.trim().length > 0 && !saving;
  const hasInfo = Boolean(title.trim() || tags.length > 0 || tagInput.trim());

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View
          style={{
            paddingTop: Math.max(insets.top, 16),
          }}
          className="flex-1 w-full relative"
        >
          {view === 'editor' ? (
            /* Note Editor Mode: Only the text editor with large font */
            <Pressable className="flex-1 w-full" onPress={() => inputRef.current?.focus()}>
              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder="Type here..."
                placeholderTextColor="#71717A"
                multiline
                autoFocus
                textAlignVertical="top"
                className="flex-1 w-full font-sans text-3xl text-white leading-10 px-8 pt-8 pb-8"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
              />
            </Pressable>
          ) : (
            /* Note Info Mode: Title and Tags sections */
            <ScrollView
              className="flex-1 w-full"
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View className="gap-3 p-8">
                <Text className="font-sans-semibold text-2xl text-white">Note info</Text>
                <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                  Add a title and tags to organize this note on your board.
                </Text>
              </View>

              {/* Title Section */}
              <View className="flex-row items-center gap-4 py-5 px-8 border-t border-b border-zinc-800">
                <TextTIcon size={20} color="#D4D4D8" />

                <TextInput
                  ref={titleInputRef}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Add a title to this note"
                  placeholderTextColor="#71717A"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    tagsInputRef.current?.focus();
                  }}
                  className="w-full font-sans text-xl text-white leading-tight"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                />
              </View>

              {/* Tags Section */}
              <TagsBox
                tags={tags}
                autoTags={autoTags}
                onTagsChange={setTags}
                onAutoTagsChange={setAutoTags}
                tagInput={tagInput}
                onTagInputChange={setTagInput}
                inputRef={tagsInputRef}
                onSubmitEditing={handleSave}
                onRemoveTag={(removed) => {
                  autoTagsRef.current = autoTagsRef.current.filter((t) => t !== removed);
                }}
              />
            </ScrollView>
          )}

          {/* Action buttons at the bottom */}
          <View pointerEvents="box-none">
            <View className="w-full flex-row items-center justify-center border-t border-zinc-800 bg-zinc-950">
              {/* Cancel Button */}
              <Pressable
                onPress={handleClose}
                disabled={saving}
                hitSlop={12}
                className="flex-1 pt-6 pb-10 flex-row gap-2.5 items-center justify-center border-r border-zinc-800"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <XIcon size={22} color="#FFFFFF" weight="bold" />
                <Text className="font-sans-bold text-lg text-white">Cancel</Text>
              </Pressable>

              {/* Info / Note Switcher Button */}
              {view === 'editor' ? (
                <Pressable
                  onPress={handleSwitchToInfo}
                  hitSlop={12}
                  className="flex-1 pt-6 pb-10 flex-row gap-2.5 items-center justify-center border-r border-zinc-800"
                  accessibilityRole="button"
                  accessibilityLabel="Note info"
                >
                  <InfoIcon
                    size={22}
                    color={hasInfo ? '#3B82F6' : '#FFFFFF'}
                    weight={hasInfo ? 'fill' : 'bold'}
                  />
                  <Text
                    className={`font-sans-bold text-lg ${hasInfo ? 'text-blue-500' : 'text-white'}`}
                  >
                    Info
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSwitchToEditor}
                  hitSlop={12}
                  className="flex-1 pt-6 pb-10 flex-row gap-2.5 items-center justify-center border-r border-zinc-800"
                  accessibilityRole="button"
                  accessibilityLabel="Back to note editor"
                >
                  <NotePencilIcon size={22} color="#FFFFFF" weight="bold" />
                  <Text className="font-sans-bold text-lg text-white">Note</Text>
                </Pressable>
              )}

              {/* Save Button */}
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                hitSlop={12}
                className="flex-1 pt-6 pb-10 items-center justify-center flex-row gap-2.5"
                accessibilityRole="button"
                accessibilityLabel="Save note"
              >
                {saving ? (
                  <ActivityIndicator size={22} color={canSave ? '#000000' : '#FFFFFF'} />
                ) : (
                  <CheckIcon size={22} color={canSave ? '#3B82F6' : '#71717A'} weight="bold" />
                )}

                <Text
                  className={`font-sans-bold text-lg ${canSave ? 'text-blue-500' : 'text-zinc-500'}`}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#09090B',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  borderlessInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
