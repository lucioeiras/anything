import {
  CheckIcon,
  InfoIcon,
  LinkIcon,
  MusicNotesIcon,
  NotePencilIcon,
  TextTIcon,
  UserIcon,
  XIcon,
} from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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
import { MarkdownNote } from '@/components/card/MarkdownNote';
import { LinkedContentPicker } from '@/components/LinkedContentPicker';
import { LinkedContentPreview } from '@/components/LinkedContentPreview';
import { MusicLyricsPicker } from '@/components/modals/MusicLyricsPicker';
import { TagsBox } from '@/components/TagsBox';

import { useLibrary } from '@/hooks/useLibrary';
import { isLinkableItem } from '@/lib/library/links';
import { isQuoteText } from '@/lib/library/quotes';
import type { NoteItem, QuoteItem } from '@/lib/library/types';
import type { MusicMetadata } from '@/lib/music/itunes';
import { generateAutoTags, generateAutoTagsAsync } from '@/lib/tags/autoTags';

type NewNoteModalProps = {
  visible: boolean;
  initialText?: string;
  editingItem?: NoteItem;
  onClose: () => void;
  onDismiss?: () => void;
  onSaved?: (item: NoteItem | QuoteItem) => void;
};

export function NewNoteModal({
  visible,
  initialText,
  editingItem,
  onClose,
  onDismiss,
  onSaved,
}: NewNoteModalProps) {
  const { addMusicItem, addTextItem, updateItem, getTags, state } = useLibrary();
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const authorInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);

  const [view, setView] = useState<'editor' | 'info'>('editor');
  const [isPreviewingMarkdown, setIsPreviewingMarkdown] = useState(false);
  const [text, setText] = useState(editingItem?.text ?? initialText ?? '');
  const [title, setTitle] = useState(editingItem?.title ?? '');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState<string[]>(editingItem?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkedItemId, setLinkedItemId] = useState<string | undefined>(editingItem?.linkedItemId);
  const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);
  const [isLyricsPickerOpen, setIsLyricsPickerOpen] = useState(false);
  const [lyricsSong, setLyricsSong] = useState<MusicMetadata | null>(null);
  const [lyricsSnippet, setLyricsSnippet] = useState('');
  const libraryItems = state.status === 'ready' ? state.result.items : [];
  const linkedItem = libraryItems.find((item) => item.id === linkedItemId);
  const [autoTags, setAutoTags] = useState<string[]>(editingItem?.autoTags ?? []);
  const autoTagsRef = useRef<string[]>(editingItem?.autoTags ?? []);

  const existingTags = useMemo(
    () => (visible ? getTags().map((t) => t.tag) : []),
    [getTags, visible]
  );

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
    setTitle('');
    setAuthor('');
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setLinkedItemId(undefined);
    setIsLinkPickerOpen(false);
    setIsLyricsPickerOpen(false);
    setLyricsSong(null);
    setLyricsSnippet('');
    setView('editor');
    setIsPreviewingMarkdown(false);
    onClose();
  };

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      let musicId = linkedItemId;
      if (lyricsSong) {
        const existing = libraryItems.find(
          (candidate) =>
            candidate.type === 'music' &&
            candidate.musicKind !== 'album' &&
            (lyricsSong.externalUrl
              ? candidate.externalUrl === lyricsSong.externalUrl
              : candidate.title === lyricsSong.title &&
                candidate.artist === lyricsSong.artist &&
                candidate.album === lyricsSong.album)
        );
        if (existing) {
          musicId = existing.id;
        } else {
          const music = await addMusicItem({
            musicKind: 'song',
            title: lyricsSong.title,
            artist: lyricsSong.artist,
            album: lyricsSong.album,
            cover: lyricsSong.cover,
            previewUrl: lyricsSong.previewUrl,
            externalUrl: lyricsSong.externalUrl,
            durationMs: lyricsSong.durationMs,
            releaseDate: lyricsSong.releaseDate,
            genre: lyricsSong.genre,
          });
          musicId = music.id;
        }
      }

      const item = editingItem
        ? ((await updateItem(editingItem.id, {
            text: trimmed,
            title: title.trim() || undefined,
            tags: finalTags.length > 0 ? finalTags : undefined,
            autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
            linkedItemId: musicId,
          })) as NoteItem | QuoteItem)
        : await addTextItem(trimmed, title.trim() || undefined, {
            tags: finalTags.length > 0 ? finalTags : undefined,
            autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
            linkedItemId: musicId,
            forceNote: Boolean(lyricsSong),
            author: isQuoteText(trimmed) && !lyricsSong ? author.trim() || undefined : undefined,
          });
      setText('');
      setTitle('');
      setAuthor('');
      setTags([]);
      setAutoTags([]);
      autoTagsRef.current = [];
      setTagInput('');
      setLinkedItemId(undefined);
      setLyricsSong(null);
      setLyricsSnippet('');
      setIsLyricsPickerOpen(false);
      setView('editor');
      setIsPreviewingMarkdown(false);
      onSaved?.(item);
      onClose();
    } catch (e) {
      console.error('Failed to save note:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToInfo = () => {
    // 1. Instant baseline tags
    const auto = generateAutoTags({
      title: title.trim(),
      text: text.trim(),
      existingTags,
    });
    if (auto.length > 0) {
      setTags((prev) => {
        const next = [...prev];
        for (const t of auto) {
          if (!next.includes(t)) {
            next.push(t);
          }
        }
        return next;
      });
      const nextAuto = [...new Set([...autoTagsRef.current, ...auto])];
      autoTagsRef.current = nextAuto;
      setAutoTags(nextAuto);
    }

    // 2. On-device LLM semantic enrichment in background
    generateAutoTagsAsync({
      title: title.trim(),
      text: text.trim(),
      existingTags,
    })
      .then((aiTags) => {
        if (aiTags.length > 0) {
          setTags((prev) => {
            const next = [...prev];
            for (const t of aiTags) {
              if (!next.includes(t)) {
                next.push(t);
              }
            }
            return next;
          });
          const nextAiAuto = [...new Set([...autoTagsRef.current, ...aiTags])];
          autoTagsRef.current = nextAiAuto;
          setAutoTags(nextAiAuto);
        }
      })
      .catch(() => {});

    setView('info');
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleSwitchToEditor = () => {
    setView('editor');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const canSave = text.trim().length > 0 && !saving;
  const isQuote = !lyricsSong && isQuoteText(text);
  const hasInfo = Boolean(
    title.trim() ||
    (isQuote && author.trim()) ||
    tags.length > 0 ||
    tagInput.trim() ||
    linkedItemId ||
    lyricsSong
  );

  const handleLyricsSelect = (snippet: string, song: MusicMetadata) => {
    setText((current) => {
      const previous = current.trimEnd();
      const base =
        lyricsSnippet && previous.endsWith(lyricsSnippet)
          ? previous.slice(0, -lyricsSnippet.length).trimEnd()
          : previous;
      return base ? `${base}\n\n${snippet}` : snippet;
    });
    setLyricsSong(song);
    setLyricsSnippet(snippet);
    setLinkedItemId(undefined);
    setIsLyricsPickerOpen(false);
    setIsPreviewingMarkdown(false);
    setView('editor');
  };

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
        <View
          style={{
            paddingTop: Math.max(insets.top, 16),
          }}
          className="flex-1 w-full relative"
        >
          {view === 'editor' ? (
            isPreviewingMarkdown ? (
              <ScrollView
                className="flex-1 w-full"
                contentContainerStyle={{
                  paddingHorizontal: 32,
                  paddingTop: 32,
                  paddingBottom: 128,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {text.trim() ? (
                  <MarkdownNote
                    markdown={text}
                    onMarkdownChange={setText}
                    onEdit={() => {
                      setIsPreviewingMarkdown(false);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                  />
                ) : (
                  <Text className="font-sans text-lg text-zinc-500">
                    Your Markdown preview will appear here.
                  </Text>
                )}
              </ScrollView>
            ) : (
              /* Note Editor Mode: Only the text editor with large font */
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
                  className="flex-1 w-full font-sans text-3xl text-white leading-10 px-8 pt-8 pb-32"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                />
              </Pressable>
            )
          ) : (
            /* Note Info Mode: Title and Tags sections */
            <ScrollView
              className="flex-1 w-full"
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View className="gap-3 p-8">
                <Text className="font-sans-semibold text-2xl text-white">
                  {isQuote ? 'Quote info' : 'Note info'}
                </Text>
                <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                  {isQuote
                    ? 'Add an author, title and tags to organize this quote on your board.'
                    : 'Add a title and tags to organize this note on your board.'}
                </Text>
              </View>

              {/* Title Section */}
              <View className="flex-row items-center gap-4 py-5 px-8 border-t border-b border-zinc-800">
                <TextTIcon size={20} color="#D4D4D8" />

                <TextInput
                  ref={titleInputRef}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Add a title to this note"
                  placeholderTextColor="#71717A"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    (isQuote ? authorInputRef : tagsInputRef).current?.focus();
                  }}
                  className="w-full font-sans text-xl text-white leading-tight"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                />
              </View>

              {isQuote && (
                <View className="flex-row items-center gap-4 py-5 px-8 border-b border-zinc-800">
                  <UserIcon size={20} color="#D4D4D8" />
                  <TextInput
                    ref={authorInputRef}
                    value={author}
                    onChangeText={setAuthor}
                    placeholder="Add an author to this quote"
                    placeholderTextColor="#71717A"
                    returnKeyType="next"
                    onSubmitEditing={() => tagsInputRef.current?.focus()}
                    className="flex-1 font-sans text-xl text-white leading-tight"
                    style={styles.borderlessInput}
                    underlineColorAndroid="transparent"
                  />
                </View>
              )}

              {/* Tags Section */}
              <TagsBox
                tags={tags}
                autoTags={autoTags}
                onTagsChange={setTags}
                onAutoTagsChange={setAutoTags}
                tagInput={tagInput}
                onTagInputChange={setTagInput}
                inputRef={tagsInputRef}
                onSubmitEditing={handleSave}
                onRemoveTag={(removed) => {
                  autoTagsRef.current = autoTagsRef.current.filter((t) => t !== removed);
                }}
              />

              {lyricsSong ? (
                <LinkedContentPreview
                  pendingMusic={lyricsSong}
                  onChange={() => setIsLyricsPickerOpen(true)}
                  onRemove={() => setLyricsSong(null)}
                  containerClassName="px-8 py-6 border-b border-zinc-800"
                />
              ) : linkedItem && isLinkableItem(linkedItem) ? (
                <LinkedContentPreview
                  item={linkedItem}
                  onChange={() => setIsLinkPickerOpen(true)}
                  onRemove={() => setLinkedItemId(undefined)}
                  containerClassName="px-8 py-6 border-b border-zinc-800"
                />
              ) : (
                <Pressable
                  onPress={() => setIsLinkPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Link note to content"
                  className="flex-row items-center gap-4 py-5 px-8 border-b border-zinc-800"
                >
                  <LinkIcon size={20} color="#FFFFFF" />
                  <Text className="font-sans-semibold text-lg text-white">Link to content</Text>
                </Pressable>
              )}
            </ScrollView>
          )}

          {/* Action buttons at the bottom */}
          <ActionFooter bottomInset={insets.bottom} overlay>
            <Button
              accessibilityLabel="Cancel"
              onPress={handleClose}
              disabled={saving}
              icon={<XIcon size={20} color="#FFFFFF" weight="bold" />}
            />

            {view === 'editor' && (
              <Button
                accessibilityLabel="Add song lyrics"
                onPress={() => setIsLyricsPickerOpen(true)}
                disabled={saving}
                icon={
                  <MusicNotesIcon
                    size={20}
                    color={lyricsSong ? '#3B82F6' : '#FFFFFF'}
                    weight="bold"
                  />
                }
              />
            )}
            {view === 'editor' && (
              <Button
                accessibilityLabel={isPreviewingMarkdown ? 'Edit markdown' : 'Preview markdown'}
                onPress={() => {
                  Keyboard.dismiss();
                  setIsPreviewingMarkdown((current) => !current);
                }}
                disabled={saving}
                icon={
                  isPreviewingMarkdown ? (
                    <NotePencilIcon size={20} color="#FFFFFF" weight="bold" />
                  ) : (
                    <TextTIcon size={20} color="#FFFFFF" weight="bold" />
                  )
                }
              />
            )}
            {view === 'editor' ? (
              <Button
                accessibilityLabel="Note info"
                onPress={handleSwitchToInfo}
                icon={<InfoIcon size={20} color={hasInfo ? '#3B82F6' : '#FFFFFF'} weight="bold" />}
              />
            ) : (
              <Button
                accessibilityLabel="Back to note editor"
                onPress={handleSwitchToEditor}
                icon={<NotePencilIcon size={20} color="#FFFFFF" weight="bold" />}
                text="Note"
              />
            )}

            <Button
              accessibilityLabel="Save note"
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
              text="Save"
            />
          </ActionFooter>
        </View>
      </KeyboardAvoidingView>
      <LinkedContentPicker
        visible={isLinkPickerOpen}
        items={libraryItems}
        selectedId={linkedItemId}
        onSelect={setLinkedItemId}
        onClose={() => setIsLinkPickerOpen(false)}
      />
      <MusicLyricsPicker
        visible={isLyricsPickerOpen}
        onClose={() => setIsLyricsPickerOpen(false)}
        onSelect={handleLyricsSelect}
      />
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
    paddingBottom: 128,
  },
  borderlessInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
