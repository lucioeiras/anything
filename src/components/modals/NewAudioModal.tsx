import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { CheckIcon, MicrophoneIcon, NotePencilIcon, TextTIcon, XIcon } from 'phosphor-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';
import { TagsBox } from '@/components/TagsBox';
import { useLibrary } from '@/hooks/useLibrary';
import type { PickedAudioAsset } from '@/lib/library/storage';
import type { AudioItem } from '@/lib/library/types';
import { generateAutoTagsAsync } from '@/lib/tags/autoTags';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type NewAudioModalProps = {
  visible: boolean;
  asset: PickedAudioAsset | null;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: AudioItem) => void;
};

export function NewAudioModal({ visible, asset, onClose, onDismiss, onSaved }: NewAudioModalProps) {
  useLocalization();
  const { addAudio, getTags } = useLibrary();
  const insets = useSafeAreaInsets();
  const titleInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const autoTagsRef = useRef<string[]>([]);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const player = useAudioPlayer(asset?.uri ?? null);
  const playerStatus = useAudioPlayerStatus(player);
  const existingTags = useMemo(
    () => (visible ? getTags().map((tag) => tag.tag) : []),
    [getTags, visible]
  );

  const updateAutoTags = useCallback((newAutoTags: string[]) => {
    const previous = autoTagsRef.current;
    const combined = [...previous];
    for (const tag of newAutoTags) if (!combined.includes(tag)) combined.push(tag);
    autoTagsRef.current = combined;
    setAutoTags(combined);
    setTags((current) => {
      const next = current.filter((tag) => !previous.includes(tag));
      for (const tag of combined) if (!next.includes(tag)) next.push(tag);
      return next;
    });
  }, []);

  const clearAutoTags = useCallback(() => {
    const remove = autoTagsRef.current;
    autoTagsRef.current = [];
    setAutoTags([]);
    setTags((current) => current.filter((tag) => !remove.includes(tag)));
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => titleInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const cleanTitle = title.trim();
    const cleanNote = note.trim();
    if (!cleanTitle && !cleanNote) {
      const timer = setTimeout(clearAutoTags, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(async () => {
      try {
        const generated = await generateAutoTagsAsync({
          title: cleanTitle || 'Recorded audio',
          note: cleanNote,
          type: 'audio',
          existingTags,
        });
        updateAutoTags(generated);
      } catch (error) {
        console.warn('Failed to generate audio tags:', error);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [visible, title, note, existingTags, clearAutoTags, updateAutoTags]);

  const resetForm = () => {
    setTitle('');
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
  };

  const handleClose = () => {
    if (saving) return;
    player.pause();
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!asset || saving) return;
    setSaving(true);
    try {
      const finalTags = [...tags];
      const pendingTag = tagInput.replace(/^#/, '').trim();
      if (pendingTag && !finalTags.includes(pendingTag)) finalTags.push(pendingTag);
      const savedAutoTags = autoTagsRef.current.filter((tag) => finalTags.includes(tag));
      const item = await addAudio(asset, {
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        tags: finalTags.length ? finalTags : undefined,
        autoTags: savedAutoTags.length ? savedAutoTags : undefined,
      });
      player.pause();
      resetForm();
      onSaved?.(item);
      onClose();
    } catch (error) {
      console.error('Failed to save audio:', error);
      Alert.alert(
        translate('Error'),
        error instanceof Error ? error.message : 'Failed to save audio'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!asset && !visible) return null;
  const canSave = Boolean(asset) && !saving;
  const durationMs = asset?.durationMs ?? playerStatus.duration * 1000;
  const durationSeconds = Math.floor(durationMs / 1000);
  const durationLabel = `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}`;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      onDismiss={onDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={{ paddingTop: Math.max(insets.top, 16) }} className="flex-1 w-full relative">
          <ScrollView
            className="flex-1 w-full"
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row p-8 pt-0 gap-6 items-center max-h-48 border-b border-zinc-800">
              <Pressable
                onPress={() => (playerStatus.playing ? player.pause() : player.play())}
                accessibilityRole="button"
                accessibilityLabel={
                  playerStatus.playing ? 'Pause recording preview' : 'Play recording preview'
                }
                className="h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-zinc-900/80 border border-zinc-800 active:opacity-70"
              >
                <MicrophoneIcon size={24} color="#EF4444" weight="duotone" />
                <Text className="mt-2 font-sans-semibold text-xs text-zinc-400">
                  {playerStatus.playing ? 'Pause' : durationLabel}
                </Text>
              </Pressable>
              <View className="flex-1 gap-3">
                <Text className="font-sans-semibold text-2xl text-white">
                  <LocalizedText>Add a recording</LocalizedText>
                </Text>
                <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                  <LocalizedText>Add a title, tags and note to this audio.</LocalizedText>
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 py-5 px-8 border-b border-zinc-800">
              <TextTIcon size={20} color="#D4D4D8" />
              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={setTitle}
                placeholder={translate('Add a title to this audio')}
                placeholderTextColor="#71717A"
                returnKeyType="next"
                onSubmitEditing={() => tagsInputRef.current?.focus()}
                className="flex-1 font-sans text-xl text-white leading-tight"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
              />
            </View>

            <TagsBox
              tags={tags}
              autoTags={autoTags}
              onTagsChange={setTags}
              onAutoTagsChange={setAutoTags}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              inputRef={tagsInputRef}
              onSubmitEditing={() => noteInputRef.current?.focus()}
              onRemoveTag={(removed) => {
                autoTagsRef.current = autoTagsRef.current.filter((tag) => tag !== removed);
              }}
            />

            <View className="flex-1 py-6 px-8 gap-4">
              <View className="flex-row items-center gap-2">
                <NotePencilIcon size={14} color="#E4E4E7" weight="bold" />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                  <LocalizedText>Note</LocalizedText>
                </Text>
              </View>
              <Pressable onPress={() => noteInputRef.current?.focus()} className="w-full">
                <TextInput
                  ref={noteInputRef}
                  value={note}
                  onChangeText={setNote}
                  placeholder={translate('Add a text note to this audio...')}
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

          <ActionFooter bottomInset={insets.bottom}>
            <Button
              accessibilityLabel={translate('Cancel')}
              onPress={handleClose}
              disabled={saving}
              icon={<XIcon size={20} color="#FFFFFF" weight="bold" />}
              text={translate('Cancel')}
            />
            <Button
              accessibilityLabel={translate('Save audio')}
              variant="primary"
              onPress={handleSave}
              disabled={!canSave}
              icon={
                saving ? (
                  <ActivityIndicator size={20} color="#000000" />
                ) : (
                  <CheckIcon size={20} color={canSave ? '#000000' : '#71717A'} weight="bold" />
                )
              }
              text={translate('Save audio')}
            />
          </ActionFooter>
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
