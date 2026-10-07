import { BlurView } from 'expo-blur';
import { CheckIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLibrary } from '@/hooks/useLibrary';
import type { NoteItem, QuoteItem } from '@/lib/library/types';

type NewNoteModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (item: NoteItem | QuoteItem) => void;
};

export function NewNoteModal({ visible, onClose, onSaved }: NewNoteModalProps) {
  const { addTextItem } = useLibrary();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [text, setText] = useState('');
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
    setText('');
    onClose();
  };

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const item = await addTextItem(trimmed);
      setText('');
      onSaved?.(item);
      onClose();
    } catch (e) {
      console.error('Failed to save note:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const canSave = text.trim().length > 0 && !saving;

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
            className="flex-1 w-full"
          >
            {/* Note Input starting at the top */}
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
                className="flex-1 w-full font-sans text-3xl text-white leading-10 px-8 py-8"
                style={[styles.borderlessInput, { paddingBottom: 100 }]}
                underlineColorAndroid="transparent"
              />
            </Pressable>

            {/* Floating action buttons over the text at the bottom */}
            <View
              pointerEvents="box-none"
              style={{
                bottom: Math.max(insets.bottom - 16, 12),
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
                  accessibilityLabel="Save note"
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
  borderlessInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
