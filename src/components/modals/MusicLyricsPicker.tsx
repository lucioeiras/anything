import { Image as ExpoImage } from 'expo-image';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  MusicNotesIcon,
  MusicNotesPlusIcon,
  WarningIcon,
  XIcon,
} from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDuration, searchITunesMusic, type MusicMetadata } from '@/lib/music/itunes';
import { getSongLyrics } from '@/lib/music/lyrics';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (text: string, song: MusicMetadata) => void;
};

export function MusicLyricsPicker({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const lyricsRequestRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicMetadata[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [song, setSong] = useState<MusicMetadata | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [notice, setNotice] = useState('');
  const [selection, setSelection] = useState<{ anchor: number; end: number } | null>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      lyricsRequestRef.current?.abort();
      requestRef.current += 1;
    };
  }, []);

  const lines = useMemo(() => lyrics.replace(/\r\n/g, '\n').split('\n'), [lyrics]);
  const start = selection ? Math.min(selection.anchor, selection.end) : -1;
  const end = selection ? Math.max(selection.anchor, selection.end) : -1;
  const selectedLines = selection ? lines.slice(start, end + 1) : [];
  const selectedCount = selectedLines.filter((line) => line.trim()).length;

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setNotice('');
    const request = ++requestRef.current;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setResults([]);
    if (!value.trim()) {
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const songs = await searchITunesMusic(value.trim(), 'song', 25);
      if (request === requestRef.current) {
        setResults(songs);
        setSearching(false);
      }
    }, 350);
  };

  const handleChooseSong = async (selected: MusicMetadata) => {
    const request = ++requestRef.current;
    const controller = new AbortController();
    lyricsRequestRef.current = controller;
    searchInputRef.current?.blur();
    setNotice('');
    setLoadingLyrics(true);
    try {
      const found = await getSongLyrics(selected, controller.signal);
      if (request !== requestRef.current) return;
      if (!found) {
        setNotice('No lyrics are available for this song yet. Try another song.');
        return;
      }
      setSong(selected);
      setLyrics(found);
      setSelection(null);
    } catch (error) {
      if (request === requestRef.current) {
        setNotice(
          error instanceof Error ? error.message : 'Could not load lyrics. Please try again.'
        );
      }
    } finally {
      if (request === requestRef.current) {
        lyricsRequestRef.current = null;
        setLoadingLyrics(false);
      }
    }
  };

  const handleCancelLyrics = () => {
    requestRef.current += 1;
    lyricsRequestRef.current?.abort();
    lyricsRequestRef.current = null;
    setLoadingLyrics(false);
  };

  const handleLinePress = (index: number) => {
    setSelection((current) => {
      if (!current) return { anchor: index, end: index };
      const low = Math.min(current.anchor, current.end);
      const high = Math.max(current.anchor, current.end);
      if (index >= low && index <= high) return { anchor: index, end: index };
      return { anchor: current.anchor, end: index };
    });
  };

  const reset = () => {
    requestRef.current += 1;
    lyricsRequestRef.current?.abort();
    lyricsRequestRef.current = null;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setQuery('');
    setResults([]);
    setSearching(false);
    setLoadingLyrics(false);
    setSong(null);
    setLyrics('');
    setNotice('');
    setSelection(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!song || !selectedCount) return;
    const snippet = selectedLines.join('\n').trim();
    onSelect(snippet, song);
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-zinc-950"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="flex-row items-center px-6 py-5 border-b border-zinc-800">
          <Pressable
            onPress={
              song
                ? () => {
                    setSong(null);
                    setLyrics('');
                    setSelection(null);
                  }
                : handleClose
            }
            className="w-10 h-10 justify-center"
            accessibilityRole="button"
            accessibilityLabel={song ? 'Back to song search' : 'Close lyrics picker'}
          >
            {song ? (
              <ArrowLeftIcon size={24} color="#FFFFFF" />
            ) : (
              <XIcon size={24} color="#FFFFFF" />
            )}
          </Pressable>
          <View className="flex-1 items-center px-2 gap-0.5">
            <Text className="font-sans-semibold text-lg text-white">
              {song ? 'Select lyrics' : 'Find a song'}
            </Text>
            {song && (
              <Text className="font-sans text-xs text-zinc-400">
                {selectedCount
                  ? `${selectedCount} ${selectedCount === 1 ? 'line' : 'lines'} selected`
                  : 'Tap a line to select it'}
              </Text>
            )}
          </View>
          <View className="w-10" />
        </View>

        {song ? (
          <>
            <View className="flex-row items-center gap-4 px-8 py-5 border-b border-zinc-800">
              {song.cover ? (
                <ExpoImage
                  source={{ uri: song.cover }}
                  contentFit="cover"
                  className="w-14 h-14 rounded-lg bg-zinc-800"
                />
              ) : (
                <View className="w-14 h-14 rounded-lg bg-zinc-800 items-center justify-center">
                  <MusicNotesIcon size={25} color="#A1A1AA" />
                </View>
              )}
              <View className="flex-1 gap-1">
                <Text className="font-sans-semibold text-base text-white" numberOfLines={1}>
                  {song.title}
                </Text>
                <Text className="font-sans text-sm text-zinc-400" numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>
            </View>
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 22, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              {lines.map((line, index) =>
                line.trim() ? (
                  <Pressable
                    key={index}
                    onPress={() => handleLinePress(index)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: index >= start && index <= end }}
                    accessibilityLabel={`Lyric line ${index + 1}: ${line}`}
                    className={`rounded-2xl px-5 py-3 mb-2 ${index >= start && index <= end ? 'bg-zinc-600' : 'active:bg-zinc-900'}`}
                  >
                    <Text
                      className={`font-sans-bold text-2xl leading-9 ${index >= start && index <= end ? 'text-white' : 'text-zinc-500'}`}
                    >
                      {line.trim()}
                    </Text>
                  </Pressable>
                ) : (
                  <View key={index} className="h-5" />
                )
              )}
            </ScrollView>
            <View
              className="border-t border-zinc-800 bg-zinc-950"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <Pressable
                onPress={handleConfirm}
                disabled={!selectedCount}
                className="py-5 px-8 flex-row items-center justify-center gap-4"
                accessibilityRole="button"
                accessibilityLabel="Add selected lyrics to note"
              >
                <MusicNotesPlusIcon
                  size={20}
                  color={selectedCount ? '#FFFFFF' : '#71717A'}
                  weight="bold"
                />
                <Text
                  className={`font-sans-semibold text-lg ${selectedCount ? 'text-white' : 'text-zinc-500'}`}
                >
                  Add to note
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View className="px-8 py-6 gap-2">
              <Text className="font-sans-semibold text-2xl text-white">Song lyrics</Text>
              <Text className="font-sans text-base text-zinc-400">
                Search the iTunes catalog, then choose a passage for your note.
              </Text>
            </View>
            <View className="flex-row items-center gap-4 px-8 py-5 border-t border-b border-zinc-800">
              <MagnifyingGlassIcon size={20} color="#D4D4D8" />
              <TextInput
                ref={searchInputRef}
                value={query}
                onChangeText={handleQueryChange}
                placeholder="Search song or artist..."
                placeholderTextColor="#71717A"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                className="flex-1 font-sans text-xl text-white leading-tight"
              />
              {searching ? <ActivityIndicator size="small" color="#A1A1AA" /> : null}
            </View>

            {notice ? (
              <View className="py-5 px-8 border-b border-zinc-800 flex-row items-center gap-3">
                <WarningIcon size={14} color="#E4E4E7" />
                <Text className="font-sans text-sm text-zinc-200">{notice}</Text>
              </View>
            ) : null}

            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {results.map((result) => (
                <Pressable
                  key={result.id}
                  onPress={() => handleChooseSong(result)}
                  disabled={loadingLyrics}
                  className="flex-row items-center gap-4 px-8 py-4 border-b border-zinc-900 active:bg-zinc-900"
                  accessibilityRole="button"
                  accessibilityLabel={`${result.title}, ${result.artist}`}
                >
                  {result.cover ? (
                    <ExpoImage
                      source={{ uri: result.cover }}
                      contentFit="cover"
                      className="w-12 h-12 rounded-md bg-zinc-800"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-md bg-zinc-800 items-center justify-center">
                      <MusicNotesIcon size={22} color="#A1A1AA" />
                    </View>
                  )}
                  <View className="flex-1 gap-1">
                    <Text className="font-sans-medium text-base text-zinc-100" numberOfLines={1}>
                      {result.title}
                    </Text>
                    <Text className="font-sans text-sm text-zinc-400" numberOfLines={1}>
                      {result.artist}
                      {result.album ? ` • ${result.album}` : ''}
                    </Text>
                  </View>
                  {result.durationMs ? (
                    <Text className="font-sans text-xs text-zinc-500">
                      {formatDuration(result.durationMs)}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
              {!searching && query.trim().length > 1 && results.length === 0 && (
                <Text className="font-sans text-sm text-zinc-500 text-center py-12">
                  No songs found for "{query}"
                </Text>
              )}
            </ScrollView>

            {loadingLyrics && (
              <View className="absolute inset-0 bg-zinc-950/80 items-center justify-center gap-4 px-8">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="font-sans-medium text-zinc-200">Loading lyrics...</Text>

                <Pressable
                  onPress={handleCancelLyrics}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel loading lyrics"
                  className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-zinc-700 px-8 py-3 active:bg-zinc-900"
                >
                  <XIcon size={18} color="#FFFFFF" weight="bold" />
                  <Text className="font-sans-semibold text-base text-white">Cancel</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
