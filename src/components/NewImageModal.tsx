import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { CheckIcon, TagIcon, XIcon } from 'phosphor-react-native';
import { useRef, useState } from 'react';
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
  const { addImage } = useLibrary();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);
  const tagsInputRef = useRef<TextInput>(null);

  const handleClose = () => {
    if (saving) return;
    setTitle('');
    setTags([]);
    setTagInput('');
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
        tags: finalTags.length > 0 ? finalTags : undefined,
      });

      setTitle('');
      setTags([]);
      setTagInput('');
      onSaved?.(item);
      onClose();
    } catch (e) {
      console.error('Failed to save image:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save image');
    } finally {
      setSaving(false);
    }
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
              className="flex-1 w-full px-10"
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
                  </View>
                </View>
              )}

              {/* Title Input: big font size, no borders, no background */}
              <View className="mt-4 w-full items-center">
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Add a title to this image"
                  placeholderTextColor="#71717a"
                  returnKeyType="next"
                  onSubmitEditing={() => tagsInputRef.current?.focus()}
                  className="w-full font-sans text-3xl text-white py-2 text-center"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                  multiline
                />
              </View>

              {/* Tags Input: tag chip takes text place when typing space */}
              <View className="w-full items-center gap-3 mt-10">
                <View className="flex-row items-center justify-center gap-2">
                  <TagIcon size={14} color="#FFFFFF" weight="bold" />
                  <Text className="font-sans-semibold text-sm text-white">TAGS</Text>
                </View>

                <View className="w-full flex-row flex-wrap items-center justify-center gap-2">
                  {tags.map((tag, idx) => (
                    <Pressable
                      key={`${tag}-${idx}`}
                      onPress={() => handleRemoveTag(idx)}
                      className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 border border-white/15 active:opacity-70"
                    >
                      <Text className="font-sans-medium text-sm text-zinc-100">#{tag}</Text>
                      <XIcon size={12} color="#a1a1aa" />
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  ref={tagsInputRef}
                  value={tagInput}
                  onChangeText={handleTagInputChange}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder={tags.length === 0 ? 'Add tags here...' : 'Add more...'}
                  placeholderTextColor="#71717a"
                  returnKeyType="done"
                  onSubmitEditing={handleTagInputSubmit}
                  className="font-sans text-xl text-zinc-300 py-1 text-center min-w-[120px]"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Actions */}
              <View className="flex-row items-center gap-4 mt-16">
                <Pressable
                  onPress={handleClose}
                  disabled={saving}
                  className="w-32 px-5 py-3 flex-row items-center justify-center gap-2 bg-white/20 rounded-full"
                >
                  {saving ? (
                    <ActivityIndicator size={18} color="#FFFFFF" />
                  ) : (
                    <>
                      <XIcon size={18} color="#FFFFFF" weight="bold" />
                      <Text className="font-sans-semibold text-base text-white">Cancel</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  disabled={!canSave}
                  className="w-32 px-5 py-3 flex-row items-center justify-center gap-2 bg-white rounded-full"
                >
                  {saving ? (
                    <ActivityIndicator size={18} color="#000000" />
                  ) : (
                    <>
                      <CheckIcon size={18} color="#000000" weight="bold" />
                      <Text className="font-sans-semibold text-base text-black">Save</Text>
                    </>
                  )}
                </Pressable>
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
