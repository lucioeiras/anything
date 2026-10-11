import { Image as ExpoImage } from 'expo-image';
import {
  CheckIcon,
  DiscIcon,
  MagnifyingGlassIcon,
  MusicNotesIcon,
  NotePencilIcon,
  XIcon,
} from 'phosphor-react-native';
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
import type { MusicItem } from '@/lib/library/types';
import {
  formatDuration,
  formatReleaseYear,
  searchITunesMusic,
  type MusicMetadata,
} from '@/lib/music/itunes';
import { generateAutoTags } from '@/lib/tags/autoTags';

type NewMusicModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (item: MusicItem) => void;
};

export function NewMusicModal({ visible, onClose, onSaved }: NewMusicModalProps) {
  const { addMusicItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicMetadata | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef(0);

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

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    const request = ++searchRequestRef.current;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!text.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setResults([]);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const [songs, albums] = await Promise.all([
          searchITunesMusic(text.trim(), 'song', 15),
          searchITunesMusic(text.trim(), 'album', 15),
        ]);
        const found: MusicMetadata[] = [];
        for (let index = 0; index < Math.max(songs.length, albums.length); index++) {
          if (songs[index]) found.push(songs[index]);
          if (albums[index]) found.push(albums[index]);
        }
        if (request === searchRequestRef.current) setResults(found);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        if (request === searchRequestRef.current) setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectMusic = (music: MusicMetadata) => {
    setSelectedMusic(music);

    // Auto-generate tags based on the selected music metadata.
    const generated = generateAutoTags({
      title: music.title,
      author: music.artist,
      type: 'music',
      existingTags,
    });

    const additionalTags: string[] = [];
    if (music.artist) {
      additionalTags.push(
        music.artist
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
      );
    }
    if (music.genre) {
      additionalTags.push(
        music.genre
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
      );
    }

    const merged = Array.from(new Set([...generated, ...additionalTags].filter(Boolean)));
    updateAutoTags(merged);
  };

  const handleClearSearch = () => {
    handleQueryChange('');
    searchInputRef.current?.focus();
  };

  const resetModal = () => {
    ++searchRequestRef.current;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setQuery('');
    setResults([]);
    setIsSearching(false);
    setSelectedMusic(null);
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    onClose();
  };

  const handleClose = () => {
    if (saving) return;
    resetModal();
  };

  const handleSave = async () => {
    if (!selectedMusic || saving) return;

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addMusicItem(
        {
          musicKind: selectedMusic.kind,
          title: selectedMusic.title,
          artist: selectedMusic.artist,
          album: selectedMusic.album,
          cover: selectedMusic.cover,
          previewUrl: selectedMusic.previewUrl,
          externalUrl: selectedMusic.externalUrl,
          durationMs: selectedMusic.durationMs,
          releaseDate: selectedMusic.releaseDate,
          genre: selectedMusic.genre,
        },
        {
          tags: finalTags.length > 0 ? finalTags : undefined,
          autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
          note: note.trim() || undefined,
        }
      );

      resetModal();
      onSaved?.(item);
    } catch (e) {
      console.error('Failed to save music item:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save music item');
    } finally {
      setSaving(false);
    }
  };

  const canSave = selectedMusic !== null && !saving;

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
              <Text className="font-sans-semibold text-2xl text-white">Add music</Text>
              <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                Search songs or albums from the iTunes catalog to add to your library.
              </Text>
            </View>

            {/* Selected music banner or search input */}
            {selectedMusic ? (
              <View className="px-8 py-6 border-t border-b border-zinc-800 flex-row items-center gap-6">
                <ExpoImage
                  source={{ uri: selectedMusic.cover }}
                  className="w-24 h-24 rounded-lg bg-zinc-800"
                  contentFit="cover"
                />
                <View className="flex-1 gap-2">
                  <Text className="font-sans-semibold text-lg text-white" numberOfLines={1}>
                    {selectedMusic.title}
                  </Text>
                  <Text className="font-sans text-base text-zinc-300" numberOfLines={1}>
                    {selectedMusic.artist}
                  </Text>
                  {selectedMusic.kind === 'album' ? (
                    <Text className="font-sans text-sm text-zinc-400 mt-0.5">
                      Album
                      {selectedMusic.releaseDate &&
                        ` • ${formatReleaseYear(selectedMusic.releaseDate)}`}
                    </Text>
                  ) : selectedMusic.album ? (
                    <Text className="font-sans text-sm text-zinc-400 mt-0.5" numberOfLines={1}>
                      {selectedMusic.album}
                      {selectedMusic.releaseDate &&
                        ` • ${formatReleaseYear(selectedMusic.releaseDate)}`}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => setSelectedMusic(null)}
                  hitSlop={10}
                  className="p-2 rounded-full bg-zinc-800 active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel="Change music selection"
                >
                  <XIcon size={16} color="#E4E4E7" weight="bold" />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center gap-4 py-5 px-8 border-t border-b border-zinc-800">
                <MagnifyingGlassIcon size={20} color="#D4D4D8" />

                <TextInput
                  ref={searchInputRef}
                  value={query}
                  onChangeText={(text) => handleQueryChange(text)}
                  placeholder="Search song, album, or artist..."
                  placeholderTextColor="#71717A"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  className="flex-1 font-sans text-xl text-white leading-tight"
                  style={styles.borderlessInput}
                  underlineColorAndroid="transparent"
                  clearButtonMode="never"
                />

                {isSearching ? (
                  <ActivityIndicator size={16} color="#A1A1AA" />
                ) : query.length > 0 ? (
                  <Pressable
                    onPress={handleClearSearch}
                    hitSlop={10}
                    className="p-1.5 rounded-full bg-zinc-800 items-center justify-center active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <XIcon size={12} color="#E4E4E7" weight="bold" />
                  </Pressable>
                ) : null}
              </View>
            )}

            {/* Results list if no music is selected yet */}
            {!selectedMusic && (
              <View className="w-full">
                {results.map((item) => (
                  <Pressable
                    key={`${item.kind}-${item.id}`}
                    onPress={() => handleSelectMusic(item)}
                    className="flex-row items-center gap-5 px-8 py-5 border-b border-zinc-900 active:bg-zinc-900"
                    accessibilityRole="button"
                    accessibilityLabel={`${item.kind === 'album' ? 'Álbum' : 'Música'}: ${item.title}, ${item.artist}`}
                  >
                    <View className="w-12 h-12 rounded-md bg-zinc-800 overflow-hidden">
                      {item.cover ? (
                        <ExpoImage
                          source={{ uri: item.cover }}
                          className="w-full h-full"
                          contentFit="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center">
                          <DiscIcon size={24} color="#71717A" />
                        </View>
                      )}
                    </View>

                    <View className="flex-1 gap-1">
                      <Text className="font-sans-medium text-base text-zinc-100" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text className="font-sans text-sm text-zinc-400" numberOfLines={1}>
                        {item.kind === 'album' ? 'Album' : 'Música'} • {item.artist}
                        {item.album ? ` • ${item.album}` : ''}
                        {item.kind === 'album' && item.releaseDate
                          ? ` • ${formatReleaseYear(item.releaseDate)}`
                          : ''}
                      </Text>
                    </View>

                    {item.durationMs && (
                      <Text className="font-sans text-xs text-zinc-500">
                        {formatDuration(item.durationMs)}
                      </Text>
                    )}
                  </Pressable>
                ))}

                {results.length === 0 && query.trim().length > 1 && !isSearching && (
                  <View className="py-12 items-center justify-center">
                    <MusicNotesIcon size={32} color="#52525B" weight="duotone" />
                    <Text className="font-sans text-sm text-zinc-500 mt-3">
                      No songs or albums found for "{query}"
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Details section when music is selected */}
            {selectedMusic && (
              <View>
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
                <View className="py-6 px-8 gap-4 border-t border-zinc-800">
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
                      placeholder={`Add personal thoughts or notes about this ${selectedMusic.kind}...`}
                      placeholderTextColor="#71717A"
                      multiline
                      textAlignVertical="top"
                      className="w-full font-sans text-base text-zinc-100 leading-relaxed min-h-[96px]"
                      style={styles.borderlessInput}
                      underlineColorAndroid="transparent"
                    />
                  </Pressable>
                </View>
              </View>
            )}
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
                accessibilityLabel={`Save ${selectedMusic?.kind ?? 'music'}`}
              >
                {saving ? (
                  <ActivityIndicator size={24} color={canSave ? '#000000' : '#FFFFFF'} />
                ) : (
                  <CheckIcon size={24} color={canSave ? '#3B82F6' : '#71717A'} weight="bold" />
                )}

                <Text
                  className={`font-sans-semibold text-xl ${canSave ? 'text-blue-500' : 'text-zinc-500'}`}
                >
                  Save {selectedMusic?.kind ?? 'music'}
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
