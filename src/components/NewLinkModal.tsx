import { CheckIcon, LinkIcon, NotePencilIcon, XIcon } from 'phosphor-react-native';
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

import { TagsBox } from '@/components/TagsBox';
import { useLibrary } from '@/hooks/useLibrary';
import { type ResolvedMetadata, resolveUrlMetadata } from '@/lib/library/metadata';
import type { LinkUploadItem } from '@/lib/library/storage';
import { generateAutoTags, generateAutoTagsAsync } from '@/lib/tags/autoTags';

type NewLinkModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (item: LinkUploadItem) => void;
};

export function NewLinkModal({ visible, onClose, onSaved }: NewLinkModalProps) {
  const { addLinkItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [resolvedMetadata, setResolvedMetadata] = useState<ResolvedMetadata | null>(null);
  const lastFetchedUrlRef = useRef<string>('');
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);

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
    const tagsToRemove = [...autoTagsRef.current];
    autoTagsRef.current = [];
    setAutoTags([]);
    setTags((prev) => prev.filter((t) => !tagsToRemove.includes(t)));
  }, []);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!newUrl.trim()) {
      setResolvedMetadata(null);
      lastFetchedUrlRef.current = '';
      clearAutoTags();
      return;
    }

    let target = newUrl.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }
    try {
      const parsed = new URL(target);
      if (parsed.hostname.includes('.') && parsed.hostname.length >= 4) {
        if (target !== lastFetchedUrlRef.current) {
          clearAutoTags();
          const instantTags = generateAutoTags({
            url: target,
            note: note.trim() || undefined,
            existingTags,
          });
          updateAutoTags(instantTags);
        }
      } else {
        lastFetchedUrlRef.current = '';
        clearAutoTags();
      }
    } catch {
      lastFetchedUrlRef.current = '';
      clearAutoTags();
    }
  };

  const handleClearUrl = () => {
    setUrl('');
    setResolvedMetadata(null);
    lastFetchedUrlRef.current = '';
    clearAutoTags();
    inputRef.current?.focus();
  };

  useEffect(() => {
    let targetUrl = url.trim();
    if (!targetUrl) {
      return;
    }

    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      const parsed = new URL(targetUrl);
      if (!parsed.hostname.includes('.') || parsed.hostname.length < 4) {
        return;
      }
    } catch {
      return;
    }

    if (targetUrl === lastFetchedUrlRef.current) return;

    const timer = setTimeout(async () => {
      lastFetchedUrlRef.current = targetUrl;
      try {
        const meta = await resolveUrlMetadata(targetUrl);
        if (lastFetchedUrlRef.current !== targetUrl) return;
        setResolvedMetadata(meta);

        const title = 'title' in meta ? meta.title : 'siteTitle' in meta ? meta.siteTitle : '';
        const text = 'text' in meta ? meta.text : 'description' in meta ? meta.description : '';
        const origin = 'origin' in meta ? meta.origin : undefined;
        const author = 'author' in meta ? meta.author : undefined;
        const subreddit = 'subreddit' in meta ? meta.subreddit : undefined;

        const auto = await generateAutoTagsAsync({
          title,
          text,
          note: note.trim() || undefined,
          url: meta.url,
          origin,
          author,
          subreddit,
          type: meta.type,
          existingTags,
        });

        if (lastFetchedUrlRef.current !== targetUrl) return;

        updateAutoTags(auto);
      } catch (e) {
        console.warn('Failed to pre-fetch metadata:', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [url, existingTags, note, updateAutoTags]);

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
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    setResolvedMetadata(null);
    lastFetchedUrlRef.current = '';
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
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addLinkItem(targetUrl, {
        tags: finalTags.length > 0 ? finalTags : undefined,
        autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
        note: note.trim() || undefined,
        preloadedMetadata: resolvedMetadata ?? undefined,
      });
      setUrl('');
      setTags([]);
      setAutoTags([]);
      autoTagsRef.current = [];
      setTagInput('');
      setNote('');
      setResolvedMetadata(null);
      lastFetchedUrlRef.current = '';
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
            <View className="gap-3 p-8 pt-0">
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
                onChangeText={handleUrlChange}
                placeholder="Type or paste your link here"
                placeholderTextColor="#71717A"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="next"
                onSubmitEditing={() => {
                  tagsInputRef.current?.focus();
                }}
                className="flex-1 font-sans text-xl text-white leading-tight"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
                clearButtonMode="never"
              />

              {url.length > 0 && (
                <Pressable
                  onPress={handleClearUrl}
                  hitSlop={10}
                  className="p-1.5 rounded-full bg-zinc-800 items-center justify-center active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel="Clear link"
                >
                  <XIcon size={12} color="#E4E4E7" weight="bold" />
                </Pressable>
              )}
            </View>

            {/* Tags section */}
            <TagsBox
              tags={tags}
              autoTags={autoTags}
              onTagsChange={setTags}
              onAutoTagsChange={setAutoTags}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              inputRef={tagsInputRef}
              onSubmitEditing={() => {
                noteInputRef.current?.focus();
              }}
              onRemoveTag={(removed) => {
                autoTagsRef.current = autoTagsRef.current.filter((t) => t !== removed);
              }}
            />

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
