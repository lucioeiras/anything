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
import { LinkIcon } from 'phosphor-react-native';

import { useLibrary } from '@/hooks/useLibrary';
import type { LinkUploadItem } from '@/lib/library/storage';

type NewLinkModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (item: LinkUploadItem) => void;
};

export function NewLinkModal({ visible, onClose, onSaved }: NewLinkModalProps) {
  const { addLinkItem } = useLibrary();
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    if (saving) return;
    setUrl('');
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
      const item = await addLinkItem(targetUrl);
      setUrl('');
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

        {/* Modal container */}
        <View className="h-[88%] rounded-t-[32px] bg-zinc-900 px-6 pb-10 pt-5">
          {/* Header matching user's mockup: Cancel | NEW LINK | Save */}
          <View className="flex-row items-center justify-between pb-4">
            <Pressable
              onPress={handleClose}
              disabled={saving}
              hitSlop={12}
              className="py-1.5 pr-3 active:opacity-60"
            >
              <Text className="font-sans-medium text-base text-zinc-300">Cancel</Text>
            </Pressable>

            <Text className="font-sans-bold text-sm tracking-widest text-blue-500 uppercase">
              NEW LINK
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

          {/* Link Input Row */}
          <View className="mt-8 flex-row items-center">
            <LinkIcon size={24} color="#71717a" />
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="Paste the link here"
              placeholderTextColor="#71717a"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              className="ml-3 flex-1 font-sans text-lg text-zinc-100"
            />
          </View>

          {/* Subtitle */}
          <Text className="mt-4 font-sans text-sm leading-5 text-zinc-500">
            You can add any link, X's or Reddit posts, YouTube vídeos or articles
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
