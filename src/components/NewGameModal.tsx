import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import {
  CheckIcon,
  GameControllerIcon,
  MagnifyingGlassIcon,
  NotePencilIcon,
  StarIcon,
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
import {
  extractReleaseYear,
  getRawgGameDetails,
  searchRawgGames,
  type RawgGameDetails,
  type RawgGameResult,
} from '@/lib/games/rawg';
import type { GameItem } from '@/lib/library/types';
import { generateAutoTagsAsync } from '@/lib/tags/autoTags';

type NewGameModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (item: GameItem) => void;
};

export function NewGameModal({ visible, onClose, onSaved }: NewGameModalProps) {
  const { addGameItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<RawgGameResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState<RawgGameDetails | RawgGameResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
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
    setSearchQuery('');
    setResults([]);
    setSelectedGame(null);
    setErrorMessage(null);
    setTags([]);
    setTagInput('');
    setNote('');
    setAutoTags([]);
    autoTagsRef.current = [];
    onClose();
  };

  const executeSearch = useCallback(async (query: string) => {
    const clean = query.trim();
    if (!clean) {
      setResults([]);
      setSearching(false);
      setErrorMessage(null);
      return;
    }

    setSearching(true);
    setErrorMessage(null);

    try {
      const searchRes = await searchRawgGames(clean, 15);
      setResults(searchRes);
      if (searchRes.length === 0) {
        setErrorMessage(`No games found for "${clean}".`);
      }
    } catch (e: any) {
      setResults([]);
      setErrorMessage(e instanceof Error ? e.message : 'Failed to search games.');
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setResults([]);
      setErrorMessage(null);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      executeSearch(text);
    }, 450);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setErrorMessage(null);
  };

  const handleSelectGame = async (game: RawgGameResult) => {
    setSelectedGame(game);
    setResults([]);
    setErrorMessage(null);

    // Initial tags from platform and genre
    const platformNames = (game.platforms || []).map((p) => p.platform?.name).filter(Boolean);
    const genreNames = (game.genres || []).map((g) => g.name).filter(Boolean);

    const initialTags = ['games'];
    if (genreNames[0]) {
      initialTags.push(genreNames[0].toLowerCase().replace(/\s+/g, '-'));
    }
    if (platformNames[0]) {
      initialTags.push(platformNames[0].toLowerCase().replace(/\s+/g, '-'));
    }
    updateAutoTags(initialTags);

    // Try to load full details
    try {
      const details = await getRawgGameDetails(game.id);
      setSelectedGame(details);

      const auto = await generateAutoTagsAsync({
        title: details.name,
        text: details.description || details.description_raw || '',
        note: note.trim() || undefined,
        type: 'game',
        existingTags,
      });
      if (auto && auto.length > 0) {
        updateAutoTags(auto);
      }
    } catch {
      // Fallback is already game summary
    }
  };

  const handleSave = async () => {
    if (!selectedGame || saving) return;

    setSaving(true);
    try {
      const platformNames = (selectedGame.platforms || [])
        .map((p) => p.platform?.name)
        .filter(Boolean);
      const genreNames = (selectedGame.genres || []).map((g) => g.name).filter(Boolean);
      const releaseYear = extractReleaseYear(selectedGame.released);

      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addGameItem(
        {
          rawgId: selectedGame.id,
          title: selectedGame.name,
          cover: selectedGame.background_image || '',
          platforms: platformNames.length > 0 ? platformNames : undefined,
          genres: genreNames.length > 0 ? genreNames : undefined,
          released: selectedGame.released || undefined,
          releaseYear: releaseYear || undefined,
          rating: selectedGame.rating || undefined,
          metacritic: selectedGame.metacritic ?? undefined,
          description:
            (selectedGame as any).description_raw || (selectedGame as any).description || undefined,
          website: (selectedGame as any).website || undefined,
        },
        {
          tags: finalTags.length > 0 ? finalTags : undefined,
          autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
          note: note.trim() || undefined,
        }
      );

      handleClose();
      onSaved?.(item);
    } catch (e: any) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save game to library.');
    } finally {
      setSaving(false);
    }
  };

  const canSave = Boolean(selectedGame) && !saving;

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
              <Text className="font-sans-semibold text-2xl text-white">Add a new game</Text>
              <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                Search for any video game to automatically fetch its artwork, platforms, release
                year, and ratings.
              </Text>
            </View>

            {/* Game Search Input Section */}
            <View className="flex-row items-center gap-3 py-5 px-8 border-t border-b border-zinc-800">
              <GameControllerIcon size={22} color="#D4D4D8" />

              <TextInput
                ref={inputRef}
                value={searchQuery}
                onChangeText={handleQueryChange}
                placeholder="Game title (e.g. Witcher, Zelda, Elden Ring)"
                placeholderTextColor="#71717A"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => executeSearch(searchQuery)}
                className="flex-1 font-sans text-xl text-white leading-tight"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
                clearButtonMode="never"
              />

              {searching ? (
                <ActivityIndicator size={18} color="#10B981" />
              ) : searchQuery.length > 0 ? (
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => executeSearch(searchQuery)}
                    hitSlop={8}
                    className="p-1.5 rounded-full bg-emerald-500/20 items-center justify-center active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel="Search game"
                  >
                    <MagnifyingGlassIcon size={16} color="#10B981" weight="bold" />
                  </Pressable>

                  <Pressable
                    onPress={handleClearSearch}
                    hitSlop={8}
                    className="p-1.5 rounded-full bg-zinc-800 items-center justify-center active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <XIcon size={12} color="#E4E4E7" weight="bold" />
                  </Pressable>
                </View>
              ) : null}
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View className="mx-8 my-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60">
                <Text className="font-sans text-sm text-rose-300 leading-relaxed">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Search Results List */}
            {!selectedGame && results.length > 0 && (
              <View className="mx-8 my-4 gap-2.5">
                <Text className="font-sans-medium text-xs uppercase tracking-wider text-zinc-400">
                  {results.length} {results.length === 1 ? 'game found' : 'games found'}
                </Text>
                {results.map((item) => {
                  const year = extractReleaseYear(item.released);
                  const platforms = (item.platforms || [])
                    .slice(0, 3)
                    .map((p) => p.platform?.name)
                    .filter(Boolean);

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectGame(item)}
                      className="flex-row items-center gap-3.5 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 active:bg-zinc-800/90"
                    >
                      {item.background_image ? (
                        <ExpoImage
                          source={{ uri: item.background_image }}
                          className="w-16 h-16 rounded-xl bg-zinc-950"
                          contentFit="cover"
                          transition={150}
                        />
                      ) : (
                        <View className="w-16 h-16 rounded-xl bg-zinc-950 items-center justify-center border border-zinc-800">
                          <GameControllerIcon size={24} color="#71717A" weight="duotone" />
                        </View>
                      )}

                      <View className="flex-1 gap-1">
                        <Text
                          className="font-sans-semibold text-base text-white leading-tight"
                          numberOfLines={1}
                        >
                          {decodeHTML(item.name)}
                        </Text>

                        <View className="flex-row items-center gap-2">
                          {year ? (
                            <Text className="font-sans text-xs text-zinc-400">{year}</Text>
                          ) : null}

                          {item.metacritic ? (
                            <View className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/40">
                              <Text className="font-sans-bold text-[10px] text-emerald-400">
                                {item.metacritic}
                              </Text>
                            </View>
                          ) : item.rating > 0 ? (
                            <View className="flex-row items-center gap-1">
                              <StarIcon size={11} color="#FBBF24" weight="fill" />
                              <Text className="font-sans text-xs text-amber-300">
                                {item.rating.toFixed(1)}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {platforms.length > 0 && (
                          <View className="flex-row items-center gap-1 mt-0.5">
                            {platforms.map((plat) => (
                              <View
                                key={plat}
                                className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/40"
                              >
                                <Text
                                  className="font-sans text-[10px] text-zinc-400"
                                  numberOfLines={1}
                                >
                                  {plat}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Selected Game Preview Section */}
            {selectedGame && (
              <View className="mx-8 my-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 gap-4">
                <View className="flex-row gap-4">
                  {selectedGame.background_image ? (
                    <ExpoImage
                      source={{ uri: selectedGame.background_image }}
                      className="w-24 h-32 rounded-lg bg-zinc-950"
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View className="w-24 h-32 rounded-lg bg-emerald-950/40 items-center justify-center border border-emerald-900/40">
                      <GameControllerIcon size={32} color="#10B981" weight="duotone" />
                    </View>
                  )}

                  <View className="flex-1 justify-center gap-1.5">
                    <Text
                      className="font-sans-medium text-lg text-white leading-snug"
                      numberOfLines={2}
                    >
                      {decodeHTML(selectedGame.name)}
                    </Text>

                    <View className="flex-row flex-wrap items-center gap-2">
                      {extractReleaseYear(selectedGame.released) ? (
                        <Text className="font-sans text-xs text-zinc-400">
                          {extractReleaseYear(selectedGame.released)}
                        </Text>
                      ) : null}

                      {selectedGame.metacritic ? (
                        <View className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40">
                          <Text className="font-sans-bold text-[10px] text-emerald-400">
                            Metacritic {selectedGame.metacritic}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {(selectedGame.platforms || []).length > 0 && (
                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {(selectedGame.platforms || []).slice(0, 4).map((p) => (
                          <View
                            key={p.platform?.id}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/50"
                          >
                            <Text className="font-sans text-[10px] text-zinc-400">
                              {p.platform?.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {'description' in selectedGame && selectedGame.description ? (
                  <Text
                    className="font-sans text-xs text-zinc-400 leading-relaxed"
                    numberOfLines={4}
                  >
                    {selectedGame.description}
                  </Text>
                ) : null}

                <Pressable
                  onPress={() => {
                    setSelectedGame(null);
                    clearAutoTags();
                  }}
                  className="self-start pt-1 active:opacity-70"
                >
                  <Text className="font-sans-medium text-xs text-blue-400 underline">
                    Choose a different game
                  </Text>
                </Pressable>
              </View>
            )}

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
                  placeholder="Add a personal note about this game..."
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
                accessibilityLabel="Add to library"
              >
                {saving ? (
                  <ActivityIndicator size={24} color="#FFFFFF" />
                ) : (
                  <>
                    <CheckIcon size={24} color={canSave ? '#FFFFFF' : '#71717A'} weight="bold" />
                    <Text
                      className={`font-sans-bold text-xl ${canSave ? 'text-white' : 'text-zinc-500'}`}
                    >
                      Add to library
                    </Text>
                  </>
                )}
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
    backgroundColor: '#09090B',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  borderlessInput: {
    paddingTop: 0,
    paddingBottom: 0,
  },
});
