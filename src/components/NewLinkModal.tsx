import { CheckIcon, LinkIcon, NotePencilIcon, TagIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLibrary } from '@/hooks/useLibrary';
import type { LinkUploadItem } from '@/lib/library/storage';

type NewLinkModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (item: LinkUploadItem) => void;
};

export function NewLinkModal({ visible, onClose, onSaved }: NewLinkModalProps) {
  const { addLinkItem } = useLibrary();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

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
    setUrl('');
    setTags([]);
    setTagInput('');
    setNote('');
    onClose();
  };

  const handleSave = async () => {
    let targetUrl = url.trim();
    if (!targetUrl || saving) return;

    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }

      const item = await addLinkItem(targetUrl, {
        tags: finalTags.length > 0 ? finalTags : undefined,
        note: note.trim() || undefined,
      });
      setUrl('');
      setTags([]);
      setTagInput('');
      setNote('');
      onSaved?.(item);
      onClose();
    } catch (e) {
      console.error('Failed to save link:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save link');
    } finally {
      setSaving(false);
    }
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
        setTags((prev) => {
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
      setTagInput(remainder);
    } else {
      setTagInput(text);
    }
  };

  const handleTagInputKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleTagInputSubmit = () => {
    const clean = tagInput.replace(/^#/, '').trim();
    if (clean) {
      if (!tags.includes(clean)) {
        setTags((prev) => [...prev, clean]);
      }
      setTagInput('');
    } else {
      noteInputRef.current?.focus();
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const canSave = url.trim().length > 0 && !saving;

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
          <ScrollView
            className="flex-1 w-full"
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="gap-3 p-8">
              <Text className="font-sans-semibold text-2xl text-white">Add a new link</Text>
              <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                You can add any link, but YouTube videos, Tweets, Reddit posts, and articles have
                special views.
              </Text>
            </View>

            {/* Link Input */}
            <View className="flex-row items-center gap-4 py-5 px-8 border-t border-b border-zinc-800">
              <LinkIcon size={20} color="#D4D4D8" />

              <TextInput
                ref={inputRef}
                value={url}
                onChangeText={setUrl}
                placeholder="Type or paste your link here"
                placeholderTextColor="#71717A"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="next"
                onSubmitEditing={() => {
                  tagsInputRef.current?.focus();
                }}
                className="w-full font-sans text-xl text-white leading-tight"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
              />
            </View>

            {/* Tags section */}
            <View className="py-6 px-8 border-b border-zinc-800 gap-4">
              <View className="flex-row items-center gap-2">
                <TagIcon size={14} color="#E4E4E7" weight="bold" />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                  Tags{tags.length > 0 ? ` (${tags.length})` : ''}
                </Text>
              </View>

              <Pressable
                onPress={() => tagsInputRef.current?.focus()}
                className="w-full flex-row flex-wrap items-center gap-2 min-h-[28px]"
              >
                {tags.map((tag, idx) => (
                  <Pressable
                    key={`${tag}-${idx}`}
                    onPress={() => handleRemoveTag(idx)}
                    className="flex-row items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 active:opacity-70"
                  >
                    <Text className="font-sans-medium text-base text-blue-400">#{tag}</Text>
                    <XIcon size={14} color="#60A5FA" />
                  </Pressable>
                ))}

                <TextInput
                  ref={tagsInputRef}
                  value={tagInput}
                  onChangeText={handleTagInputChange}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder={tags.length === 0 ? 'Add tags here...' : ''}
                  placeholderTextColor="#71717A"
                  returnKeyType="done"
                  onSubmitEditing={handleTagInputSubmit}
                  className="font-sans text-lg leading-tight text-zinc-200 flex-grow min-w-[120px]"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Pressable>
            </View>

            {/* Notes section */}
            <View className="flex-1 py-6 px-8 gap-4">
              <View className="flex-row items-center gap-2">
                <NotePencilIcon size={14} color="#E4E4E7" weight="bold" />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                  Note
                </Text>
              </View>

              <Pressable onPress={() => noteInputRef.current?.focus()} className="w-full">
                <TextInput
                  ref={noteInputRef}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add a text note to this link..."
                  placeholderTextColor="#71717A"
                  multiline
                  textAlignVertical="top"
                  className="w-full font-sans text-base text-zinc-100 leading-relaxed min-h-[96px]"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                />
              </Pressable>
            </View>
          </ScrollView>

          {/* Action buttons at the bottom */}
          <View pointerEvents="box-none">
            <View className="w-full flex-row items-center justify-center border-t border-zinc-800 bg-zinc-950">
              <Pressable
                onPress={handleClose}
                disabled={saving}
                hitSlop={12}
                className="w-1/2 pt-6 pb-10 flex-row gap-4 items-center justify-center border-r border-zinc-800"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <XIcon size={24} color="#FFFFFF" weight="bold" />
                <Text className="font-sans-bold text-xl text-white">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                hitSlop={12}
                className="w-1/2 pt-6 pb-10 items-center justify-center flex-row gap-4"
                accessibilityRole="button"
                accessibilityLabel="Save link"
              >
                {saving ? (
                  <ActivityIndicator size={24} color={canSave ? '#000000' : '#FFFFFF'} />
                ) : (
                  <CheckIcon size={24} color={canSave ? '#3B82F6' : '#71717A'} weight="bold" />
                )}

                <Text
                  className={`font-sans-semibold text-xl ${canSave ? 'text-blue-500' : 'text-zinc-500'}`}
                >
                  Save link
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
