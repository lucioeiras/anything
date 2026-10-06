import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLibrary } from '@/hooks/useLibrary';
import type { NoteItem, QuoteItem } from '@/lib/library/types';

type NewNoteDrawerProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (item: NoteItem | QuoteItem) => void;
};

export function NewNoteDrawer({ visible, onClose, onSaved }: NewNoteDrawerProps) {
  const { addTextItem } = useLibrary();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

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
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        {/* Backdrop dismiss touchable */}
        <Pressable className="flex-1" onPress={handleClose} />

        {/* Drawer container */}
        <View className="bg-zinc-900 rounded-t-[32px] px-6 pt-5 pb-10 h-[88%] border-t border-zinc-800/80">
          {/* Header matching user's mockup: Cancel | NEW NOTE | Save */}
          <View className="flex-row items-center justify-between pb-4 border-b border-zinc-800/40">
            <Pressable
              onPress={handleClose}
              disabled={saving}
              hitSlop={12}
              className="py-1.5 pr-3 active:opacity-60"
            >
              <Text className="font-sans-medium text-base text-zinc-300">Cancel</Text>
            </Pressable>

            <Text className="font-sans-bold text-sm tracking-widest text-blue-500 uppercase">
              NEW NOTE
            </Text>

            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              className={`rounded-full px-5 py-2 items-center justify-center min-w-[72px] ${
                canSave ? 'bg-blue-500 active:opacity-80' : 'bg-blue-500/40'
              }`}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="font-sans-semibold text-sm text-white">Save</Text>
              )}
            </Pressable>
          </View>

          {/* Text Input */}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type here..."
            placeholderTextColor="#71717a"
            multiline
            autoFocus
            textAlignVertical="top"
            className="flex-1 font-sans text-xl text-zinc-100 pt-5 leading-7"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
