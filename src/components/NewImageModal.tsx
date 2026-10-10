import { Image as ExpoImage } from 'expo-image';
import { CheckIcon, NotePencilIcon, TagIcon, TextTIcon, XIcon } from 'phosphor-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { PickedImageAsset } from '@/lib/library/storage';
import type { ImageItem } from '@/lib/library/types';
import { generateAutoTagsAsync, isGibberishOrMachineId } from '@/lib/tags/autoTags';

function getCleanImageTitle(fileName?: string | null): string {
  if (!fileName) return '';
  const nameWithoutExt = fileName.replace(/\.[a-zA-Z0-9]{2,5}$/, '').trim();
  if (isGibberishOrMachineId(nameWithoutExt)) return '';
  return nameWithoutExt.replace(/[-_]+/g, ' ').trim();
}

type NewImageModalProps = {
  visible: boolean;
  imageAsset: PickedImageAsset | null;
  onClose: () => void;
  onSaved?: (item: ImageItem) => void;
};

export function NewImageModal({ visible, imageAsset, onClose, onSaved }: NewImageModalProps) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);

  const titleInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);

  const { addImage, getTags } = useLibrary();
  const insets = useSafeAreaInsets();

  const existingTags = useMemo(
    () => (visible ? getTags().map((t) => t.tag) : []),
    [getTags, visible]
  );

  const updateAutoTags = useCallback((newAutoTags: string[]) => {
    const prevAutoTags = autoTagsRef.current;
    const combinedAutoTags = [...prevAutoTags];
    for (const t of newAutoTags) {
      if (!combinedAutoTags.includes(t)) {
        combinedAutoTags.push(t);
      }
    }
    autoTagsRef.current = combinedAutoTags;
    setAutoTags(combinedAutoTags);

    setTags((prev) => {
      const manualTags = prev.filter((t) => !prevAutoTags.includes(t));
      const merged = [...manualTags];
      for (const t of combinedAutoTags) {
        if (!merged.includes(t)) {
          merged.push(t);
        }
      }
      return merged;
    });
  }, []);

  const clearAutoTags = useCallback(() => {
    setTags((prev) => prev.filter((t) => !autoTagsRef.current.includes(t)));
    autoTagsRef.current = [];
    setAutoTags([]);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const cleanTitle = title.trim();
    const cleanNote = note.trim();
    const fallbackTitle = getCleanImageTitle(imageAsset?.fileName);

    const textToAnalyze = cleanTitle || cleanNote || fallbackTitle;
    if (!textToAnalyze) {
      clearAutoTags();
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const auto = await generateAutoTagsAsync({
          title: cleanTitle || fallbackTitle,
          note: cleanNote,
          type: 'image',
          existingTags,
        });
        if (auto.length > 0) {
          updateAutoTags(auto);
        }
      } catch (e) {
        console.warn('Failed to generate image tags:', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [visible, title, note, imageAsset, existingTags, updateAutoTags, clearAutoTags]);

  const handleClose = () => {
    if (saving) return;
    setTitle('');
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    onClose();
  };

  const handleSave = async () => {
    if (!imageAsset || saving) return;

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addImage(imageAsset, {
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        tags: finalTags.length > 0 ? finalTags : undefined,
        autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
      });

      setTitle('');
      setTags([]);
      setAutoTags([]);
      autoTagsRef.current = [];
      setTagInput('');
      setNote('');
      onSaved?.(item);
      onClose();
    } catch (e) {
      console.error('Failed to save image:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save image');
    } finally {
      setSaving(false);
    }
  };

  const handleTagInputChange = (textValue: string) => {
    if (textValue.includes(' ') || textValue.includes(',')) {
      const parts = textValue.split(/[\s,]+/);
      const endsWithDelimiter = textValue.endsWith(' ') || textValue.endsWith(',');
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
      setTagInput(textValue);
    }
  };

  const handleTagInputKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => {
        const removed = prev[prev.length - 1];
        if (removed) {
          autoTagsRef.current = autoTagsRef.current.filter((t) => t !== removed);
          setAutoTags((a) => a.filter((t) => t !== removed));
        }
        return prev.slice(0, -1);
      });
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
    setTags((prev) => {
      const removed = prev[indexToRemove];
      if (removed) {
        autoTagsRef.current = autoTagsRef.current.filter((t) => t !== removed);
        setAutoTags((a) => a.filter((t) => t !== removed));
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  if (!imageAsset && !visible) {
    return null;
  }

  const canSave = Boolean(imageAsset) && !saving;

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
            <View className="flex-row p-8 pt-0 gap-8 items-center max-h-48 border-b border-zinc-800">
              {imageAsset && (
                <View
                  className="h-full overflow-hidden bg-zinc-900 border border-zinc-800"
                  style={{
                    maxHeight: 280,
                    aspectRatio: Math.min(Math.max(aspectRatio, 0.75), 1.9),
                    alignSelf: 'center',
                  }}
                >
                  <ExpoImage
                    source={{ uri: imageAsset.uri }}
                    contentFit="cover"
                    style={StyleSheet.absoluteFill}
                    onLoad={(e) => {
                      if (e.source.width && e.source.height) {
                        setAspectRatio(e.source.width / e.source.height);
                      }
                    }}
                  />
                </View>
              )}
              <View className="flex-1 gap-3">
                <Text className="font-sans-semibold text-2xl text-white">Add a new image</Text>
                <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                  Save images from your gallery to your board with tags and notes.
                </Text>
              </View>
            </View>

            {/* Title Input */}
            <View className="flex-row items-center gap-4 py-5 px-8 border-b border-zinc-800">
              <TextTIcon size={20} color="#D4D4D8" />

              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={setTitle}
                placeholder="Add a title to this image"
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
                {tags.map((tag, idx) => {
                  const isAuto = autoTags.includes(tag);
                  return (
                    <Pressable
                      key={`${tag}-${idx}`}
                      onPress={() => handleRemoveTag(idx)}
                      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 active:opacity-70 ${
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
                      <XIcon size={14} color={isAuto ? '#000000' : '#60A5FA'} />
                    </Pressable>
                  );
                })}

                <TextInput
                  ref={tagsInputRef}
                  value={tagInput}
                  onChangeText={handleTagInputChange}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder={tags.length === 0 ? 'Add tags here...' : '+ Add more'}
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
                  placeholder="Add a text note to this image..."
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
                accessibilityLabel="Save image"
              >
                {saving ? (
                  <ActivityIndicator size={24} color={canSave ? '#000000' : '#FFFFFF'} />
                ) : (
                  <CheckIcon size={24} color={canSave ? '#3B82F6' : '#71717A'} weight="bold" />
                )}

                <Text
                  className={`font-sans-semibold text-xl ${canSave ? 'text-blue-500' : 'text-zinc-500'}`}
                >
                  Save image
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
