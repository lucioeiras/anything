import { BlurView } from 'expo-blur';
import { CheckIcon, LinkIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
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

import { TagsNoteBox } from '@/components/TagsNoteBox';
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
  const [activeTab, setActiveTab] = useState<'tags' | 'note'>('tags');
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
    setActiveTab('tags');
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
      setActiveTab('tags');
      onSaved?.(item);
      onClose();
    } catch (e) {
      console.error('Failed to save link:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save link');
    } finally {
      setSaving(false);
    }
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
      <View style={StyleSheet.absoluteFill}>
        {/* Fullscreen blur and dark layer so board behind remains visible, blurred and darker */}
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.55)' }]} />

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
              className="flex-1 w-full px-6"
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Big link icon */}
              <View className="items-center justify-center mt-2">
                <LinkIcon size={40} color="#FFFFFF" weight="bold" />
              </View>

              {/* Title */}
              <Text className="font-sans-semibold text-3xl text-white my-4 text-center">
                Add a new link
              </Text>

              {/* Centralized text input */}
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
                  if (activeTab === 'tags') {
                    tagsInputRef.current?.focus();
                  } else {
                    noteInputRef.current?.focus();
                  }
                }}
                textAlign="center"
                className="w-full font-sans text-2xl text-white text-center mt-1"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
                multiline
              />

              {/* Tags and Note Box */}
              <TagsNoteBox
                tags={tags}
                onTagsChange={setTags}
                tagInput={tagInput}
                onTagInputChange={setTagInput}
                note={note}
                onNoteChange={setNote}
                activeTab={activeTab}
                onActiveTabChange={setActiveTab}
                tagsInputRef={tagsInputRef}
                noteInputRef={noteInputRef}
                notePlaceholder="Add a text note to this link..."
                onSubmitTag={handleSave}
                className="mt-8 mb-4"
              />
            </ScrollView>

            {/* Floating action buttons at the bottom */}
            <View
              pointerEvents="box-none"
              style={{
                bottom: Math.max(insets.bottom, 16),
              }}
              className="absolute left-0 right-0 items-center justify-center"
            >
              <View className="flex-row items-center justify-center gap-4">
                <Pressable
                  onPress={handleClose}
                  disabled={saving}
                  hitSlop={12}
                  className="w-14 h-14 rounded-full items-center justify-center bg-zinc-500 active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <XIcon size={26} color="#FFFFFF" weight="bold" />
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  disabled={!canSave}
                  hitSlop={12}
                  className={`w-14 h-14 rounded-full items-center justify-center ${
                    canSave ? 'bg-white active:opacity-80' : 'bg-white/30'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel="Save link"
                >
                  {saving ? (
                    <ActivityIndicator size={24} color={canSave ? '#000000' : '#FFFFFF'} />
                  ) : (
                    <CheckIcon size={26} color={canSave ? '#000000' : '#71717A'} weight="bold" />
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 110,
  },
  borderlessInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
