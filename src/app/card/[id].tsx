import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { File } from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import {
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  CopyIcon,
  DownloadSimpleIcon,
  ExportIcon,
  HashIcon,
  NotePencilIcon,
  TagIcon,
  TrashSimpleIcon,
  XIcon,
} from 'phosphor-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import QuoteClose from '@/../assets/quote-close.svg';
import QuoteOpen from '@/../assets/quote-open.svg';
import { ArticleCard } from '@/components/ArticleCard';
import { LinkCard } from '@/components/LinkCard';
import { RedditCard } from '@/components/RedditCard';
import { TweetCard } from '@/components/TweetCard';
import { YouTubeCard } from '@/components/YouTubeCard';
import { useLibrary } from '@/hooks/useLibrary';
import type { LibraryItem } from '@/lib/library/types';

const SCREEN_HEIGHT = Dimensions.get('window').height;

function isLinkType(type: LibraryItem['type']): boolean {
  return (
    type === 'link' ||
    type === 'article' ||
    type === 'youtube' ||
    type === 'tweet' ||
    type === 'reddit'
  );
}

function formatDateAdded(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

type CardDetailContentProps = {
  item: LibraryItem;
  onDismiss: () => void;
  onSelectTag: (tag: string) => void;
};

function CardDetailContent({ item, onDismiss, onSelectTag }: CardDetailContentProps) {
  const { deleteItem, updateItem } = useLibrary();
  const insets = useSafeAreaInsets();

  const initialTitle = 'title' in item && typeof item.title === 'string' ? item.title : '';
  const initialText = 'text' in item && typeof item.text === 'string' ? item.text : '';

  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState(item.note || '');
  const [editedText, setEditedText] = useState(initialText);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [shakeAnim] = useState(() => new Animated.Value(0));
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [imageRatio, setImageRatio] = useState<number>(1);

  const tagInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const textInputRef = useRef<TextInput>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const section2Y = useRef(350);
  const tagsY = useRef(140);
  const notesY = useRef(280);
  const activeInputRef = useRef<'top' | 'title' | 'tags' | 'notes' | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const performScroll = useCallback((target?: 'top' | 'title' | 'tags' | 'notes' | null) => {
    if (!scrollViewRef.current || !target) return;
    if (target === 'notes') {
      scrollViewRef.current.scrollToEnd({ animated: true });
      return;
    }
    let targetY = 0;
    if (target === 'top') {
      targetY = 0;
    } else if (target === 'title') {
      targetY = Math.max(0, section2Y.current - 20);
    } else if (target === 'tags') {
      targetY = Math.max(0, section2Y.current + tagsY.current - 30);
    }
    scrollViewRef.current.scrollTo({ y: targetY, animated: true });
  }, []);

  const scrollToTopSection = () => {
    activeInputRef.current = 'top';
    performScroll('top');
  };

  const scrollToTitle = () => {
    activeInputRef.current = 'title';
    if (keyboardHeight > 0) {
      performScroll('title');
    }
  };

  const scrollToTags = () => {
    activeInputRef.current = 'tags';
    if (keyboardHeight > 0) {
      performScroll('tags');
    }
  };

  const scrollToNotes = () => {
    activeInputRef.current = 'notes';
    if (keyboardHeight > 0) {
      performScroll('notes');
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        performScroll(activeInputRef.current);
      }, 150);
    });

    const didShowSub = Keyboard.addListener('keyboardDidShow', () => {
      performScroll(activeInputRef.current);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      activeInputRef.current = null;
    });

    return () => {
      showSub.remove();
      didShowSub.remove();
      hideSub.remove();
    };
  }, [performScroll]);

  useEffect(() => {
    return () => {
      if (textSaveTimerRef.current) {
        clearTimeout(textSaveTimerRef.current);
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isEditingTags) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0.8,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -0.8,
            duration: 80,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      shakeAnim.stopAnimation();
      shakeAnim.setValue(0);
    }
    return () => {
      animation?.stop();
    };
  }, [isEditingTags, shakeAnim]);

  const rotationEven = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-2.5deg', '0deg', '2.5deg'],
  });

  const rotationOdd = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['2.5deg', '0deg', '-2.5deg'],
  });

  const showFeedback = (msg: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setActionFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => {
      setActionFeedback(null);
    }, 2000);
  };

  const handleSaveTitle = async () => {
    const cleanTitle = title.trim();
    if ('title' in item && item.title === cleanTitle) return;
    try {
      await updateItem(item.id, { title: cleanTitle || undefined } as Partial<LibraryItem>);
    } catch (e) {
      console.warn('Failed to save title', e);
    }
  };

  const handleSaveNote = async () => {
    const cleanNote = note.trim();
    if (item.note === cleanNote) return;
    try {
      await updateItem(item.id, { note: cleanNote || undefined });
    } catch (e) {
      console.warn('Failed to save note', e);
    }
  };

  const handleAddTag = async (tagToAdd: string) => {
    const clean = tagToAdd.replace(/^#/, '').trim();
    if (!clean || tags.includes(clean)) {
      setTagInput('');
      return;
    }
    const updatedTags = [...tags, clean];
    setTags(updatedTags);
    setTagInput('');
    try {
      await updateItem(item.id, { tags: updatedTags });
    } catch (e) {
      console.warn('Failed to update tags', e);
    }
  };

  const handleRemoveTag = async (indexToRemove: number) => {
    const updatedTags = tags.filter((_, idx) => idx !== indexToRemove);
    setTags(updatedTags);
    if (updatedTags.length === 0) {
      setIsEditingTags(false);
    }
    try {
      await updateItem(item.id, { tags: updatedTags.length > 0 ? updatedTags : undefined });
    } catch (e) {
      console.warn('Failed to remove tag', e);
    }
  };

  const handleCardTextChange = (newText: string) => {
    setEditedText(newText);
    if (textSaveTimerRef.current) {
      clearTimeout(textSaveTimerRef.current);
    }
    textSaveTimerRef.current = setTimeout(async () => {
      const clean = newText.trim();
      if (!clean) return;
      try {
        await updateItem(item.id, { text: clean } as Partial<LibraryItem>);
      } catch (e) {
        console.warn('Failed to auto-save note text', e);
      }
    }, 350);
  };

  const handleCardTextBlur = async () => {
    if (textSaveTimerRef.current) {
      clearTimeout(textSaveTimerRef.current);
    }
    const clean = editedText.trim();
    if (!clean) return;
    try {
      await updateItem(item.id, { text: clean } as Partial<LibraryItem>);
    } catch (e) {
      console.warn('Failed to save note text on blur', e);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Card', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(item.id);
            onDismiss();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete card');
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    try {
      if (item.type === 'image') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare && item.image.startsWith('file:')) {
          await Sharing.shareAsync(item.image);
          return;
        }
        await Share.share({ url: item.image, message: item.title });
      } else if (isLinkType(item.type) && 'url' in item) {
        await Share.share({ url: item.url, message: item.url });
      }
    } catch (e) {
      console.warn('Share error', e);
    }
  };

  const handleCopy = async () => {
    try {
      if (item.type === 'image') {
        try {
          const file = new File(item.image);
          if (file.exists) {
            const bytes = await file.bytes();
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const b64 = btoa(binary);
            await Clipboard.setImageAsync(b64);
            showFeedback('Image copied to clipboard');
            return;
          }
        } catch {
          // fallback
        }
        await Clipboard.setStringAsync(item.image);
        showFeedback('Image link copied');
      } else if (item.type === 'note' || item.type === 'quote') {
        await Clipboard.setStringAsync(editedText.trim() || item.text);
        showFeedback('Text copied to clipboard');
      }
    } catch (e) {
      console.warn('Copy error', e);
      showFeedback('Failed to copy');
    }
  };

  const handleDownload = async () => {
    if (item.type !== 'image') return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photos permission is required to save to Camera Roll.');
        return;
      }

      await MediaLibrary.saveToLibraryAsync(item.image);
      showFeedback('Saved to Camera Roll!');
    } catch (e) {
      console.warn('Download error', e);
      Alert.alert('Error', 'Failed to save image to Camera Roll.');
    }
  };

  const handleOpenLink = async () => {
    if (!('url' in item)) return;
    try {
      if (await Linking.canOpenURL(item.url)) {
        await WebBrowser.openBrowserAsync(item.url);
      }
    } catch {
      await Linking.openURL(item.url);
    }
  };

  const isLink = isLinkType(item.type);
  const isImage = item.type === 'image';
  const isNoteOrQuote = item.type === 'note' || item.type === 'quote';

  return (
    <View className="flex-1 w-full">
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <View className="absolute top-2 self-center z-50 bg-zinc-800/90 border border-zinc-700 px-4 py-2 rounded-full shadow-lg">
          <Text className="font-sans-medium text-xs text-white">{actionFeedback}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top, 12) + 24 : 0}
        className="flex-1 w-full"
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => {
            Keyboard.dismiss();
            if (isEditingTags) setIsEditingTags(false);
          }}
          onScrollEndDrag={(e) => {
            if (e.nativeEvent.contentOffset.y < -60) {
              onDismiss();
            }
          }}
          className="flex-1 w-full"
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          {/* SECTION 1: TOP SECTION (CARD DISPLAY) */}
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              if (isEditingTags) setIsEditingTags(false);
            }}
            className="w-full items-center justify-center px-6 pt-8 pb-16 min-h-[300px]"
          >
            {/* If it's an image: only display the image */}
            {isImage && (
              <View className="w-full max-w-sm max-h-[300px] items-center justify-center rounded-2xl overflow-hidden shadow-2xl">
                <ExpoImage
                  source={{ uri: item.image }}
                  className="w-full rounded-2xl"
                  style={{
                    aspectRatio: imageRatio,
                    maxHeight: 290,
                  }}
                  contentFit="contain"
                  onLoad={(e) => {
                    if (e.source.width && e.source.height) {
                      setImageRatio(e.source.width / e.source.height);
                    }
                  }}
                />
              </View>
            )}

            {/* If it's any sort of link: show the card */}
            {isLink && (
              <View className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
                {item.type === 'link' && (
                  <LinkCard
                    favicon={item.favicon}
                    siteTitle={item.siteTitle}
                    description={item.description}
                    url={item.url}
                  />
                )}
                {item.type === 'article' && (
                  <ArticleCard
                    articleTitle={item.title}
                    thumbnail={item.thumbnail}
                    origin={item.origin}
                  />
                )}
                {item.type === 'youtube' && (
                  <YouTubeCard videoTitle={item.title} thumbnail={item.thumbnail} />
                )}
                {item.type === 'tweet' && (
                  <TweetCard
                    avatar={item.avatar}
                    author={item.author}
                    text={item.text}
                    images={item.images}
                  />
                )}
                {item.type === 'reddit' && (
                  <RedditCard
                    subredditAvatar={item.subredditAvatar}
                    subredditName={item.subreddit}
                    postTitle={item.title}
                    text={item.text}
                    image={item.image}
                  />
                )}
              </View>
            )}

            {/* If it's a note or quote: show text without background in bigger font size like new note modal */}
            {isNoteOrQuote && (
              <View className="w-full max-w-lg px-2">
                {item.type === 'quote' ? (
                  <View className="items-center gap-4 w-full py-2">
                    <QuoteOpen width={24} height={24} />
                    <TextInput
                      ref={textInputRef}
                      value={editedText}
                      onChangeText={handleCardTextChange}
                      onBlur={handleCardTextBlur}
                      onFocus={() => {
                        scrollToTopSection();
                        if (isEditingTags) setIsEditingTags(false);
                      }}
                      multiline
                      placeholder="Type quote here..."
                      placeholderTextColor="#71717A"
                      className="w-full font-sans-medium text-2xl text-white leading-10 text-center"
                      style={{ backgroundColor: 'transparent' }}
                      underlineColorAndroid="transparent"
                    />
                    <QuoteClose width={24} height={24} />
                  </View>
                ) : (
                  <TextInput
                    ref={textInputRef}
                    value={editedText}
                    onChangeText={handleCardTextChange}
                    onBlur={handleCardTextBlur}
                    onFocus={() => {
                      scrollToTopSection();
                      if (isEditingTags) setIsEditingTags(false);
                    }}
                    multiline
                    placeholder="Type note here..."
                    placeholderTextColor="#71717A"
                    className="w-full font-sans text-2xl text-white leading-10 text-left py-2"
                    style={{ backgroundColor: 'transparent' }}
                    underlineColorAndroid="transparent"
                  />
                )}
              </View>
            )}
          </Pressable>

          {/* ACTIONS ROW (Between the two sections, over them, centralized horizontally) */}
          <View className="z-30 self-center -my-9">
            <View className="bg-zinc-900 rounded-full px-5 py-4 shadow-2xl flex-row items-center justify-center gap-6">
              {/* For all of them: delete */}
              <Pressable
                onPress={handleDelete}
                hitSlop={8}
                className="rounded-full active:bg-red-500/30 items-center justify-center"
                accessibilityLabel="Delete"
              >
                <TrashSimpleIcon size={24} color="#EF4444" />
              </Pressable>

              {/* Only for images: download (save at camera roll) */}
              {isImage && (
                <Pressable
                  onPress={handleDownload}
                  hitSlop={8}
                  className="rounded-full active:bg-zinc-700 items-center justify-center"
                  accessibilityLabel="Download image"
                >
                  <DownloadSimpleIcon size={24} color="#FFFFFF" />
                </Pressable>
              )}

              {/* For images, notes and quotes: copy */}
              {(isImage || isNoteOrQuote) && (
                <Pressable
                  onPress={handleCopy}
                  hitSlop={8}
                  className="rounded-full active:bg-zinc-700 items-center justify-center"
                  accessibilityLabel="Copy"
                >
                  <CopyIcon size={24} color="#FFFFFF" />
                </Pressable>
              )}

              {/* For links and images: share */}
              {(isLink || isImage) && (
                <Pressable
                  onPress={handleShare}
                  hitSlop={8}
                  className="rounded-full active:bg-zinc-700 items-center justify-center"
                  accessibilityLabel="Share"
                >
                  <ExportIcon size={24} color="#FFFFFF" />
                </Pressable>
              )}

              {/* Only for links: open link */}
              {isLink && (
                <Pressable
                  onPress={handleOpenLink}
                  hitSlop={8}
                  className="rounded-full active:bg-zinc-700 items-center justify-center"
                  accessibilityLabel="Open link"
                >
                  <ArrowSquareOutIcon size={24} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          </View>

          {/* SECTION 2: BOTTOM SECTION (INFORMATION ABOUT THE CARD) */}
          <Pressable
            onLayout={(e) => {
              section2Y.current = e.nativeEvent.layout.y;
            }}
            onPress={() => {
              Keyboard.dismiss();
              if (isEditingTags) setIsEditingTags(false);
            }}
            className="w-full flex-1 bg-zinc-950 pt-8 pb-16 px-6 gap-4 mt-1"
          >
            {/* Title (besides links, that don't have titles) */}
            {item.type !== 'link' && (
              <View className="w-full">
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  onFocus={() => {
                    scrollToTitle();
                    if (isEditingTags) setIsEditingTags(false);
                  }}
                  onBlur={handleSaveTitle}
                  placeholder="Add a title here"
                  placeholderTextColor="#71717A"
                  className="font-sans text-3xl text-zinc-100 mt-6 text-center"
                  multiline
                  textAlign="center"
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Date Added */}
            <View className="flex-row items-center gap-1.5 self-center">
              <CalendarBlankIcon size={13} color="#A1A1AA" />
              <Text className="font-sans text-sm text-zinc-400">
                Added {formatDateAdded(item.createdAt)}
              </Text>
            </View>

            {/* Box with Tags */}
            <View className="flex-row items-center gap-2 mt-4">
              <TagIcon size={14} color="#A1A1AA" weight="bold" />
              <Text className="font-sans-semibold text-sm text-zinc-400 tracking-wider uppercase">
                Tags ({tags.length})
              </Text>
            </View>

            <Pressable
              onLayout={(e) => {
                tagsY.current = e.nativeEvent.layout.y;
              }}
              onPress={() => {
                if (isEditingTags) {
                  setIsEditingTags(false);
                } else {
                  tagInputRef.current?.focus();
                }
              }}
              className="w-full mt-1"
            >
              <View className="flex-row flex-wrap items-center gap-2">
                {tags.map((tag, idx) => (
                  <Animated.View
                    key={`${tag}-${idx}`}
                    style={{
                      transform: [
                        {
                          rotate: isEditingTags
                            ? idx % 2 === 0
                              ? rotationEven
                              : rotationOdd
                            : '0deg',
                        },
                      ],
                    }}
                  >
                    <Pressable
                      onLongPress={() => setIsEditingTags(true)}
                      delayLongPress={250}
                      onPress={() => {
                        if (isEditingTags) {
                          handleRemoveTag(idx);
                        } else {
                          onSelectTag(tag);
                        }
                      }}
                      className="flex-row items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1.5 active:opacity-70"
                    >
                      <HashIcon size={12} color="#60A5FA" weight="bold" />
                      <Text className="font-sans-semibold text-sm text-blue-400">{tag}</Text>
                      {isEditingTags && <XIcon size={14} color="#60A5FA" />}
                    </Pressable>
                  </Animated.View>
                ))}

                <TextInput
                  ref={tagInputRef}
                  value={tagInput}
                  onFocus={() => {
                    scrollToTags();
                    if (isEditingTags) setIsEditingTags(false);
                  }}
                  onChangeText={(text) => {
                    if (text.includes(' ') || text.includes(',')) {
                      const parts = text.split(/[\s,]+/);
                      const endsWithDelimiter = text.endsWith(' ') || text.endsWith(',');
                      const tokens = endsWithDelimiter
                        ? parts.filter(Boolean)
                        : parts.slice(0, -1).filter(Boolean);
                      const remainder = endsWithDelimiter ? '' : parts[parts.length - 1];

                      tokens.forEach((t) => handleAddTag(t));
                      setTagInput(remainder);
                    } else {
                      setTagInput(text);
                    }
                  }}
                  placeholder={tags.length === 0 ? 'Add tags here' : ''}
                  placeholderTextColor="#71717A"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (tagInput.trim()) {
                      handleAddTag(tagInput);
                    }
                  }}
                  className="font-sans text-base text-zinc-200 flex-grow leading-tight"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Pressable>

            {/* Box with Notes */}
            <View className="flex-row items-center gap-2 mt-8">
              <NotePencilIcon size={14} color="#A1A1AA" weight="bold" />
              <Text className="font-sans-semibold text-sm text-zinc-400 tracking-wider uppercase">
                Notes
              </Text>
            </View>

            <Pressable
              onLayout={(e) => {
                notesY.current = e.nativeEvent.layout.y;
              }}
              onPress={() => {
                if (isEditingTags) setIsEditingTags(false);
                noteInputRef.current?.focus();
              }}
              className="w-full"
            >
              <TextInput
                ref={noteInputRef}
                value={note}
                onFocus={() => {
                  scrollToNotes();
                  if (isEditingTags) setIsEditingTags(false);
                }}
                onChangeText={setNote}
                onBlur={handleSaveNote}
                placeholder="Add notes about this card..."
                placeholderTextColor="#71717A"
                multiline
                textAlignVertical="top"
                className="font-sans text-base text-zinc-200 leading-relaxed"
              />
            </Pressable>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, setSearchQuery } = useLibrary();

  const item = useMemo(() => {
    if (state.status !== 'ready') return null;
    return state.result.items.find((i) => i.id === id) ?? null;
  }, [state, id]);

  const [translateY] = useState(() => new Animated.Value(0));

  const dismissScreen = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  }, [translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 8 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 120 || gestureState.vy > 0.6) {
            dismissScreen();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              bounciness: 4,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [translateY, dismissScreen]
  );

  const handleSelectTag = useCallback(
    (tag: string) => {
      setSearchQuery(tag);
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/board');
        }
      });
    },
    [translateY, setSearchQuery]
  );

  if (!item) {
    return (
      <View className="flex-1 bg-black/70 items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} className="flex-1">
      {/* Background Blur + Dark Layer */}
      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} />

      <Animated.View
        style={[
          styles.animatedContainer,
          {
            paddingTop: Math.max(insets.top, 12),
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Swipe Down Drag Handle Area */}
        <Pressable
          onPress={() => Keyboard.dismiss()}
          {...panResponder.panHandlers}
          className="w-full items-center py-2"
        >
          <View className="w-12 h-1.5 rounded-full bg-zinc-500/70 active:bg-zinc-300" />
        </Pressable>

        <CardDetailContent
          key={item.id}
          item={item}
          onDismiss={dismissScreen}
          onSelectTag={handleSelectTag}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
    width: '100%',
  },
});
