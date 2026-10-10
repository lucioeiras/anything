import {
  BookIcon,
  CheckIcon,
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

import { BookCover } from '@/components/BookCover';
import { TagsBox } from '@/components/TagsBox';
import { useLibrary } from '@/hooks/useLibrary';
import { fetchBookByIsbn, normalizeIsbn, type BookMetadata } from '@/lib/books/isbn';
import type { BookItem } from '@/lib/library/types';
import { generateAutoTagsAsync } from '@/lib/tags/autoTags';

type NewBookModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (item: BookItem) => void;
};

export function NewBookModal({ visible, onClose, onSaved }: NewBookModalProps) {
  const { addBookItem, getTags } = useLibrary();
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const [isbn, setIsbn] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [book, setBook] = useState<BookMetadata | null>(null);
  const [coverAspectRatio, setCoverAspectRatio] = useState<number>(2 / 3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const autoTagsRef = useRef<string[]>([]);
  const lastSearchedIsbnRef = useRef<string>('');

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

  const handleSearch = useCallback(
    async (targetIsbn: string) => {
      const clean = normalizeIsbn(targetIsbn);
      if (!clean || clean.length < 9) return;
      if (clean === lastSearchedIsbnRef.current && book) return;

      lastSearchedIsbnRef.current = clean;
      setLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchBookByIsbn(clean);
        if (normalizeIsbn(isbn) !== clean) return;

        setBook(result);
        setErrorMessage(null);

        // Generate smart tags from book data
        const authorText = result.authors.join(' ');
        const auto = await generateAutoTagsAsync({
          title: result.title,
          text: `${authorText}\n${result.description || ''}`,
          author: result.authors[0],
          note: note.trim() || undefined,
          type: 'book',
          existingTags,
        });

        updateAutoTags(auto);
      } catch (e) {
        if (normalizeIsbn(isbn) === clean) {
          setBook(null);
          clearAutoTags();
          setErrorMessage(e instanceof Error ? e.message : 'Could not find book for this ISBN.');
        }
      } finally {
        setLoading(false);
      }
    },
    [isbn, book, note, existingTags, updateAutoTags, clearAutoTags]
  );

  const handleIsbnChange = (newIsbn: string) => {
    setIsbn(newIsbn);
    const clean = normalizeIsbn(newIsbn);
    if (!clean) {
      setBook(null);
      setErrorMessage(null);
      clearAutoTags();
      lastSearchedIsbnRef.current = '';
    }
  };

  // Auto-search when user pastes or types a 10 or 13-character ISBN
  useEffect(() => {
    const clean = normalizeIsbn(isbn);
    if (clean.length === 10 || clean.length === 13) {
      const timer = setTimeout(() => {
        handleSearch(clean);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isbn, handleSearch]);

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
    setIsbn('');
    setBook(null);
    setCoverAspectRatio(2 / 3);
    setErrorMessage(null);
    setTags([]);
    setAutoTags([]);
    autoTagsRef.current = [];
    setTagInput('');
    setNote('');
    lastSearchedIsbnRef.current = '';
    onClose();
  };

  const handleClearIsbn = () => {
    setIsbn('');
    setBook(null);
    setCoverAspectRatio(2 / 3);
    setErrorMessage(null);
    clearAutoTags();
    lastSearchedIsbnRef.current = '';
    inputRef.current?.focus();
  };

  const handleSave = async () => {
    if (!book || saving) return;

    setSaving(true);
    try {
      const finalTags = [...tags];
      const pending = tagInput.replace(/^#/, '').trim();
      if (pending && !finalTags.includes(pending)) {
        finalTags.push(pending);
      }
      const savedAutoTags = autoTagsRef.current.filter((t) => finalTags.includes(t));

      const item = await addBookItem(
        {
          isbn: book.isbn,
          title: book.title,
          authors: book.authors,
          cover: book.cover,
          coverAspectRatio: book.cover ? coverAspectRatio : undefined,
          description: book.description,
          publisher: book.publisher,
          publishedDate: book.publishedDate,
          pageCount: book.pageCount,
          url: book.url,
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
      console.error('Failed to save book:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save book');
    } finally {
      setSaving(false);
    }
  };

  const canSave = Boolean(book) && !saving && !loading;

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
              <Text className="font-sans-semibold text-2xl text-white">Add a new book</Text>
              <Text className="font-sans text-base text-zinc-400 leading-relaxed">
                Enter the book&apos;s ISBN (10 or 13 digits) to automatically fetch its details,
                authors, cover and synopsis.
              </Text>
            </View>

            {/* ISBN Input Section */}
            <View className="flex-row items-center gap-3 py-5 px-8 border-t border-b border-zinc-800">
              <BookIcon size={22} color="#D4D4D8" />

              <TextInput
                ref={inputRef}
                value={isbn}
                onChangeText={handleIsbnChange}
                placeholder="ISBN (e.g. 9780132350884)"
                placeholderTextColor="#71717A"
                autoCapitalize="characters"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
                returnKeyType="search"
                onSubmitEditing={() => handleSearch(isbn)}
                className="flex-1 font-sans text-xl text-white leading-tight"
                style={styles.borderlessInput}
                underlineColorAndroid="transparent"
                clearButtonMode="never"
              />

              {loading ? (
                <ActivityIndicator size={18} color="#F59E0B" />
              ) : isbn.length > 0 ? (
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => handleSearch(isbn)}
                    hitSlop={8}
                    className="p-1.5 rounded-full bg-amber-500/20 items-center justify-center active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel="Search ISBN"
                  >
                    <MagnifyingGlassIcon size={16} color="#F59E0B" weight="bold" />
                  </Pressable>

                  <Pressable
                    onPress={handleClearIsbn}
                    hitSlop={8}
                    className="p-1.5 rounded-full bg-zinc-800 items-center justify-center active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel="Clear ISBN"
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

            {/* Book Preview Section */}
            {book && (
              <View className="mx-8 my-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 gap-4">
                <View className="flex-row gap-4">
                  <BookCover
                    cover={book.cover}
                    title={book.title}
                    aspectRatio={coverAspectRatio}
                    onAspectRatioChange={setCoverAspectRatio}
                    className="w-24 shadow-md"
                    roundedCorners
                  />

                  <View className="flex-1 justify-center gap-1.5">
                    <Text
                      className="font-sans-medium text-lg text-white leading-snug"
                      numberOfLines={3}
                    >
                      {book.title}
                    </Text>

                    {book.authors.length > 0 && (
                      <Text
                        className="font-sans text-sm text-amber-400 leading-tight"
                        numberOfLines={2}
                      >
                        {book.authors.join(', ')}
                      </Text>
                    )}

                    <View className="flex-row flex-wrap items-center gap-2 mt-1">
                      {book.publishedDate && (
                        <Text className="font-sans text-xs text-zinc-400">
                          {book.publishedDate.split('-')[0]}
                        </Text>
                      )}
                      {book.pageCount && (
                        <Text className="font-sans text-xs text-zinc-500">
                          • {book.pageCount} pgs
                        </Text>
                      )}
                      {book.publisher && (
                        <Text className="font-sans text-xs text-zinc-500" numberOfLines={1}>
                          • {book.publisher}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {book.description ? (
                  <Text
                    className="font-sans text-xs text-zinc-400 leading-relaxed"
                    numberOfLines={4}
                  >
                    {book.description}
                  </Text>
                ) : null}
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
                  placeholder="Add a personal note about this book..."
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
                accessibilityLabel="Save book"
              >
                {saving ? (
                  <ActivityIndicator size={24} color={canSave ? '#F59E0B' : '#71717A'} />
                ) : (
                  <CheckIcon size={24} color={canSave ? '#F59E0B' : '#71717A'} weight="bold" />
                )}

                <Text
                  className={`font-sans-semibold text-xl ${
                    canSave ? 'text-amber-500' : 'text-zinc-500'
                  }`}
                >
                  Save book
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
