import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { CheckIcon, NotePencilIcon, TagIcon, XIcon } from 'phosphor-react-native';
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
import type { PickedImageAsset } from '@/lib/library/storage';
import type { ImageItem } from '@/lib/library/types';

type NewImageModalProps = {
  visible: boolean;
  imageAsset: PickedImageAsset | null;
  onClose: () => void;
  onSaved?: (item: ImageItem) => void;
};

export function parseTags(raw: string): string[] {
  if (!raw.trim()) return [];
  let tokens: string[] = [];
  if (raw.includes(',')) {
    tokens = raw.split(',').map((t) => t.trim().replace(/^#/, ''));
  } else if (raw.includes('#')) {
    tokens = raw.split(/[\s#]+/).map((t) => t.trim());
  } else {
    tokens = raw.split(/\s+/).map((t) => t.trim());
  }
  const clean = tokens.filter((t) => t.length > 0);
  return Array.from(new Set(clean));
}

export function NewImageModal({ visible, imageAsset, onClose, onSaved }: NewImageModalProps) {
  const [activeTab, setActiveTab] = useState<'tags' | 'note'>('tags');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);

  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);

  const { addImage } = useLibrary();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    if (saving) return;
    setTitle('');
    setTags([]);
    setTagInput('');
    setNote('');
    setActiveTab('tags');
    onClose();
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
      handleSave();
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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

      const item = await addImage(imageAsset, {
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        tags: finalTags.length > 0 ? finalTags : undefined,
      });

      setTitle('');
      setTags([]);
      setTagInput('');
      setNote('');
      setActiveTab('tags');
      onSaved?.(item);
      onClose();
    } catch (e) {
      console.error('Failed to save image:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save image');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTagsTab = () => {
    setActiveTab('tags');
    setTimeout(() => {
      tagsInputRef.current?.focus();
    }, 100);
  };

  const handleSelectNoteTab = () => {
    setActiveTab('note');
    setTimeout(() => {
      noteInputRef.current?.focus();
    }, 100);
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
      <View style={StyleSheet.absoluteFill}>
        {/* Fullscreen blur and dark layer so board behind remains visible, blurred and darker */}
        <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.55)' }]} />

        <View
          style={[
            styles.container,
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Form Content */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 w-full"
          >
            <ScrollView
              className="flex-1 w-full px-6"
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Image Preview before inputs */}
              {imageAsset && (
                <View className="w-full my-3 items-center justify-center">
                  <View
                    className="w-full rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/10"
                    style={{
                      maxHeight: 300,
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

                    {/* Dark layer between the buttons and the image */}
                    <View className="absolute inset-0 bg-black/40" />

                    {/* Actions over the image, centralized */}
                    <View
                      pointerEvents="box-none"
                      className="absolute inset-0 flex-row items-center justify-center gap-6"
                    >
                      <Pressable
                        onPress={handleClose}
                        disabled={saving}
                        hitSlop={12}
                        className="w-20 h-20 rounded-full items-center justify-center bg-black/70 active:opacity-70"
                        accessibilityRole="button"
                        accessibilityLabel="Cancel"
                      >
                        <XIcon size={40} color="#FFFFFF" />
                      </Pressable>

                      <Pressable
                        onPress={handleSave}
                        disabled={!canSave}
                        hitSlop={12}
                        className={`w-20 h-20 rounded-full items-center justify-center ${
                          canSave ? 'bg-white active:opacity-80' : 'bg-white/30'
                        }`}
                        accessibilityRole="button"
                        accessibilityLabel="Save image"
                      >
                        {saving ? (
                          <ActivityIndicator size={24} color={canSave ? '#000000' : '#FFFFFF'} />
                        ) : (
                          <CheckIcon size={40} color={canSave ? '#000000' : '#71717A'} />
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              {/* Title Input: big font size, no borders, no background */}
              <View className="mt-4 w-full items-center">
                <TextInput
                  value={title}
                  ref={titleInputRef}
                  onChangeText={setTitle}
                  placeholder="Add a title to this image"
                  placeholderTextColor="#A0A0AA"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    if (activeTab === 'tags') {
                      tagsInputRef.current?.focus();
                    } else {
                      noteInputRef.current?.focus();
                    }
                  }}
                  className="w-full font-sans text-3xl text-white py-2 text-center"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                />
              </View>

              {/* 2-Tab Box for Tags and Attached Note */}
              <View className="w-full mt-10 min-h-[220px] mb-6">
                {/* 2 Tabs Switcher */}
                <View className="w-full flex-row items-center justify-center gap-2 mb-3 self-center">
                  <Pressable
                    onPress={handleSelectTagsTab}
                    className="flex-grow justify-center flex-row items-center gap-1.5 px-5 py-2 rounded-xl"
                  >
                    <TagIcon
                      size={16}
                      color={activeTab === 'tags' ? '#FFFFFF' : '#71717A'}
                      weight="bold"
                    />
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
                  <View className="flex-1 w-full flex-row flex-wrap items-center justify-start min-h-[140px] gap-2 p-6 bg-zinc-900/50 rounded-3xl">
                    {tags.length > 0 &&
                      tags.map((tag, idx) => (
                        <Pressable
                          key={`${tag}-${idx}`}
                          onPress={() => handleRemoveTag(idx)}
                          className="flex-row items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 active:opacity-70"
                        >
                          <Text className="font-sans-medium text-base text-blue-400">#{tag}</Text>
                          <XIcon size={14} color="#61A5FA" />
                        </Pressable>
                      ))}

                    <TextInput
                      ref={tagsInputRef}
                      value={tagInput}
                      onChangeText={handleTagInputChange}
                      onKeyPress={handleTagInputKeyPress}
                      placeholder={tags.length === 0 ? 'Add tags here...' : ''}
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
                  <View className="flex-1 w-full justify-start min-h-[140px] p-6 pt-4 bg-zinc-900/50 rounded-3xl">
                    <TextInput
                      ref={noteInputRef}
                      value={note}
                      onChangeText={setNote}
                      placeholder="Add a text note to this image..."
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
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  borderlessInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
