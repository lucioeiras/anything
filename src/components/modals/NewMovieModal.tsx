import { Image as ExpoImage } from 'expo-image';
import {
  CheckIcon,
  FilmSlateIcon,
  MagnifyingGlassIcon,
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
import type { MovieItem } from '@/lib/library/types';
import {
  getBackdropUrl,
  getPosterUrl,
  getReleaseYear,
  getTmdbKeyInfo,
  getTmdbMovieDetails,
  searchTmdbMovies,
  type TmdbMovieDetails,
  type TmdbMovieResult,
} from '@/lib/movies/tmdb';
import { generateAutoTags } from '@/lib/tags/autoTags';

type NewMovieModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (item: MovieItem) => void;
};

export function NewMovieModal({ visible, onClose, onSaved }: NewMovieModalProps) {
  const { addMovieItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();

  const searchInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbMovieResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovieDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    let mounted = true;

    if (visible) {
      getTmdbKeyInfo().then((info) => {
        if (!mounted) return;
        const exists = info.source !== 'none';
        if (exists) {
          setTimeout(() => {
            if (mounted) searchInputRef.current?.focus();
          }, 100);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [visible]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      setIsSearching(false);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setIsSearching(true);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const found = await searchTmdbMovies(text.trim());
        setResults(found);
      } catch (err) {
        console.warn('Movie search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectMovie = async (movieResult: TmdbMovieResult) => {
    setIsLoadingDetails(true);
    try {
      const details = await getTmdbMovieDetails(movieResult.id);
      setSelectedMovie(details);

      const generated = generateAutoTags({
        title: details.title,
        type: 'movie',
        existingTags,
      });

      const additionalTags: string[] = [];
      if (details.genres && details.genres.length > 0) {
        for (const g of details.genres) {
          if (g.name) {
            additionalTags.push(
              g.name
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .trim()
            );
          }
        }
      }

      const director = details.credits?.crew?.find((c) => c.job === 'Director')?.name;
      if (director) {
        additionalTags.push(
          director
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
        );
      }

      const merged = Array.from(new Set([...generated, ...additionalTags].filter(Boolean)));
      updateAutoTags(merged);
    } catch (e) {
      console.warn('Failed to load movie details:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not fetch movie details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setIsSearching(false);
    searchInputRef.current?.focus();
  };

  const handleClose = () => {
    if (saving) return;
    setQuery('');
    setResults([]);
    setIsSearching(false);
    setSelectedMovie(null);
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    onClose();
  };

  const handleSave = async () => {
    if (!selectedMovie || saving) return;

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const director = selectedMovie.credits?.crew?.find((c) => c.job === 'Director')?.name;
      const genres = selectedMovie.genres?.map((g) => g.name);
      const posterUrl = getPosterUrl(selectedMovie.poster_path, 'w500');
      const backdropUrl = getBackdropUrl(selectedMovie.backdrop_path, 'w780');
      const releaseYear = getReleaseYear(selectedMovie.release_date);

      const item = await addMovieItem(
        {
          tmdbId: selectedMovie.id,
          title: selectedMovie.title,
          originalTitle: selectedMovie.original_title,
          poster: posterUrl,
          backdrop: backdropUrl || undefined,
          releaseDate: selectedMovie.release_date || undefined,
          releaseYear: releaseYear || undefined,
          overview: selectedMovie.overview || undefined,
          voteAverage: selectedMovie.vote_average,
          genres: genres && genres.length > 0 ? genres : undefined,
          director: director || undefined,
          runtime: selectedMovie.runtime || undefined,
        },
        {
          tags: finalTags.length > 0 ? finalTags : undefined,
          autoTags: savedAutoTags.length > 0 ? savedAutoTags : undefined,
          note: note.trim() || undefined,
        }
      );

      handleClose();
      onSaved?.(item);
    } catch (e) {
      console.error('Failed to save movie item:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save movie item');
    } finally {
      setSaving(false);
    }
  };

  const canSave = selectedMovie !== null && !saving;

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
              <Text className="font-sans-semibold text-2xl text-white">Add movie</Text>
              <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                Search movies from The Movie Database (TMDB) to add to your library.
              </Text>
            </View>

            {/* Selected Movie Banner or Search Input */}
            {selectedMovie ? (
              <View className="px-8 py-6 border-t border-b border-zinc-800 flex-row items-center gap-6">
                <View className="w-16 h-24 rounded-lg bg-zinc-800 overflow-hidden items-center justify-center">
                  {selectedMovie.poster_path ? (
                    <ExpoImage
                      source={{ uri: getPosterUrl(selectedMovie.poster_path, 'w185') }}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  ) : (
                    <FilmSlateIcon size={24} color="#71717A" />
                  )}
                </View>
                <View className="flex-1 gap-2">
                  <Text className="font-sans-semibold text-lg text-white" numberOfLines={1}>
                    {selectedMovie.title}
                  </Text>
                  <Text className="font-sans text-base text-zinc-400" numberOfLines={1}>
                    {getReleaseYear(selectedMovie.release_date) || '—'}
                    {selectedMovie.runtime ? ` • ${selectedMovie.runtime} min` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedMovie(null)}
                  hitSlop={10}
                  className="p-2 rounded-full bg-zinc-800 active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel="Change movie"
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
                  onChangeText={handleQueryChange}
                  placeholder="Search movie title..."
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

            {/* Results List if no movie is selected yet */}
            {!selectedMovie && (
              <View className="w-full">
                {isLoadingDetails && (
                  <View className="py-8 items-center justify-center">
                    <ActivityIndicator size={24} color="#60A5FA" />
                    <Text className="font-sans text-sm text-zinc-400 mt-2">
                      Loading movie details...
                    </Text>
                  </View>
                )}

                {!isLoadingDetails &&
                  results.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectMovie(item)}
                      className="flex-row items-center gap-5 px-8 py-5 border-b border-zinc-900 active:bg-zinc-900"
                    >
                      <View className="w-12 h-16 rounded-md bg-zinc-800 overflow-hidden items-center justify-center">
                        {item.poster_path ? (
                          <ExpoImage
                            source={{ uri: getPosterUrl(item.poster_path, 'w185') }}
                            className="w-full h-full"
                            contentFit="cover"
                          />
                        ) : (
                          <FilmSlateIcon size={24} color="#71717A" />
                        )}
                      </View>

                      <View className="flex-1 gap-1.5">
                        <Text
                          className="font-sans-medium text-base text-zinc-100"
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text className="font-sans text-sm text-zinc-400" numberOfLines={1}>
                          {getReleaseYear(item.release_date) || '—'}
                          {item.original_title && item.original_title !== item.title
                            ? ` • ${item.original_title}`
                            : ''}
                        </Text>
                      </View>
                    </Pressable>
                  ))}

                {!isLoadingDetails &&
                  results.length === 0 &&
                  query.trim().length > 1 &&
                  !isSearching && (
                    <View className="py-12 items-center justify-center">
                      <FilmSlateIcon size={32} color="#52525B" weight="duotone" />
                      <Text className="font-sans text-sm text-zinc-500 mt-3">
                        No movies found for "{query}"
                      </Text>
                    </View>
                  )}
              </View>
            )}

            {/* Details Section when a movie is selected */}
            {selectedMovie && (
              <View className="mt-6">
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
                      placeholder="Add personal thoughts or notes about this movie..."
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
                accessibilityLabel="Save movie"
              >
                {saving ? (
                  <ActivityIndicator size={24} color={canSave ? '#000000' : '#FFFFFF'} />
                ) : (
                  <CheckIcon size={24} color={canSave ? '#3B82F6' : '#71717A'} weight="bold" />
                )}

                <Text
                  className={`font-sans-semibold text-xl ${canSave ? 'text-blue-500' : 'text-zinc-500'}`}
                >
                  Save movie
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
