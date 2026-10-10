import { decodeHTML } from 'entities';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { File } from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { useVideoPlayer } from 'expo-video';
import {
  ArrowSquareOutIcon,
  BookOpenIcon,
  CalendarBlankIcon,
  ClockIcon,
  CopyIcon,
  DiscIcon,
  DownloadSimpleIcon,
  ExportIcon,
  FilmSlateIcon,
  InfoIcon,
  MusicNotesIcon,
  NotePencilIcon,
  PauseIcon,
  PlayIcon,
  StarIcon,
  TextTIcon,
  TrashSimpleIcon,
} from 'phosphor-react-native';
import { formatDuration, formatReleaseYear } from '@/lib/music/itunes';
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
import { BookCard } from '@/components/BookCard';
import { GameCard } from '@/components/GameCard';
import { LinkCard } from '@/components/LinkCard';
import { MovieCard } from '@/components/MovieCard';
import { PdfCard } from '@/components/PdfCard';
import { RedditCard } from '@/components/RedditCard';
import { TagsBox } from '@/components/TagsBox';
import { TweetCard } from '@/components/TweetCard';
import { VinylRecord } from '@/components/VinylRecord';
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

function MusicPreviewPlayer({
  previewUrl,
  onPlayingChange,
  playerRef,
}: {
  previewUrl: string;
  onPlayingChange?: (isPlaying: boolean) => void;
  playerRef?: React.MutableRefObject<{
    play: () => void;
    pause: () => void;
    playing: boolean;
  } | null>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useVideoPlayer(previewUrl, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (playerRef) {
      playerRef.current = player;
    }
    return () => {
      if (playerRef) {
        playerRef.current = null;
      }
    };
  }, [player, playerRef]);

  useEffect(() => {
    const sub = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
      onPlayingChange?.(event.isPlaying);
    });
    return () => {
      sub.remove();
      player.pause();
      onPlayingChange?.(false);
    };
  }, [player, onPlayingChange]);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <Pressable
      onPress={togglePlay}
      className="flex-row items-center gap-2.5 px-5 py-2.5 rounded-full bg-rose-600/20 border border-rose-500/40 active:opacity-80 mt-3"
    >
      {isPlaying ? (
        <PauseIcon size={16} color="#FB7185" weight="fill" />
      ) : (
        <PlayIcon size={16} color="#FB7185" weight="fill" />
      )}
      <Text className="font-sans-medium text-sm text-rose-200">
        {isPlaying ? 'Pause preview' : 'Play 30s preview'}
      </Text>
    </Pressable>
  );
}

type CardDetailContentProps = {
  item: LibraryItem;
  onDismiss: () => void;
  onSelectTag: (tag: string) => void;
};

function CardDetailContent({ item, onDismiss, onSelectTag }: CardDetailContentProps) {
  const { deleteItem, updateItem } = useLibrary();
  const insets = useSafeAreaInsets();

  const initialTitle =
    'title' in item && typeof item.title === 'string' && item.title
      ? decodeHTML(item.title)
      : item.type === 'link' && 'siteTitle' in item && typeof item.siteTitle === 'string'
        ? decodeHTML(item.siteTitle)
        : '';
  const initialText = 'text' in item && typeof item.text === 'string' ? decodeHTML(item.text) : '';

  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState(item.note || '');
  const [editedText, setEditedText] = useState(initialText);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [shakeAnim] = useState(() => new Animated.Value(0));
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [imageRatio, setImageRatio] = useState<number>(1);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const musicPlayerRef = useRef<{ play: () => void; pause: () => void; playing: boolean } | null>(
    null
  );

  const handleToggleMusic = useCallback(() => {
    if (!musicPlayerRef.current) return;
    if (musicPlayerRef.current.playing) {
      musicPlayerRef.current.pause();
    } else {
      musicPlayerRef.current.play();
    }
  }, []);

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
    const existingTitle =
      'title' in item && typeof item.title === 'string' && item.title
        ? item.title
        : item.type === 'link' && 'siteTitle' in item && typeof item.siteTitle === 'string'
          ? item.siteTitle
          : '';
    if (existingTitle === cleanTitle) return;
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
    const removedTag = tags[indexToRemove];
    const updatedTags = tags.filter((_, idx) => idx !== indexToRemove);
    setTags(updatedTags);
    if (updatedTags.length === 0) {
      setIsEditingTags(false);
    }
    const updatedAutoTags = item.autoTags?.filter((t) => t !== removedTag);
    try {
      await updateItem(item.id, {
        tags: updatedTags.length > 0 ? updatedTags : undefined,
        autoTags: updatedAutoTags && updatedAutoTags.length > 0 ? updatedAutoTags : undefined,
      });
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
      } else if (item.type === 'pdf') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare && item.pdf.startsWith('file:')) {
          await Sharing.shareAsync(item.pdf, {
            mimeType: 'application/pdf',
            dialogTitle: item.title || 'PDF Document',
          });
          return;
        }
        await Share.share({ url: item.pdf, message: item.title });
      } else if (item.type === 'book') {
        const authorStr = item.authors?.length ? ` by ${item.authors.join(', ')}` : '';
        const isbnStr = item.isbn ? ` (ISBN: ${item.isbn})` : '';
        const msg = `${item.title}${authorStr}${isbnStr}`;
        await Share.share({ message: msg, url: item.url || item.cover });
      } else if (item.type === 'music') {
        const shareUrl = item.externalUrl || item.previewUrl;
        await Share.share({
          message: `${item.title} by ${item.artist}${shareUrl ? `\n${shareUrl}` : ''}`,
          url: shareUrl,
        });
      } else if (item.type === 'movie') {
        const dirStr = item.director ? ` (Directed by: ${item.director})` : '';
        const yearStr = item.releaseYear ? ` [${item.releaseYear}]` : '';
        const msg = `Movie: ${item.title}${yearStr}${dirStr}${item.overview ? `\n\n${item.overview}` : ''}`;
        await Share.share({ message: msg, url: item.poster });
      } else if (item.type === 'game') {
        const platStr = item.platforms?.length ? ` (${item.platforms.join(', ')})` : '';
        const yearStr = item.releaseYear ? ` [${item.releaseYear}]` : '';
        const msg = `Game: ${item.title}${yearStr}${platStr}${item.website ? `\n${item.website}` : ''}${item.description ? `\n\n${item.description}` : ''}`;
        await Share.share({ message: msg, url: item.website || item.cover });
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
      } else if (item.type === 'pdf') {
        await Clipboard.setStringAsync(item.pdf);
        showFeedback('PDF path copied');
      } else if (item.type === 'book') {
        const textToCopy = `${item.title}${
          item.authors?.length ? `\nAuthor(s): ${item.authors.join(', ')}` : ''
        }\nISBN: ${item.isbn}${item.description ? `\n\n${item.description}` : ''}`;
        await Clipboard.setStringAsync(textToCopy);
        showFeedback('Book details copied to clipboard');
      } else if (item.type === 'music') {
        await Clipboard.setStringAsync(`${item.artist} - ${item.title}`);
        showFeedback('Track info copied to clipboard');
      } else if (item.type === 'movie') {
        const textToCopy = `${item.title}${item.releaseYear ? ` (${item.releaseYear})` : ''}${
          item.director ? `\nDirector: ${item.director}` : ''
        }${item.genres?.length ? `\nGenres: ${item.genres.join(', ')}` : ''}${
          item.overview ? `\n\n${item.overview}` : ''
        }`;
        await Clipboard.setStringAsync(textToCopy);
        showFeedback('Movie details copied to clipboard');
      } else if (item.type === 'game') {
        const textToCopy = `${item.title}${item.releaseYear ? ` (${item.releaseYear})` : ''}${
          item.platforms?.length ? `\nPlatforms: ${item.platforms.join(', ')}` : ''
        }${item.genres?.length ? `\nGenres: ${item.genres.join(', ')}` : ''}${
          item.description ? `\n\n${item.description}` : ''
        }`;
        await Clipboard.setStringAsync(textToCopy);
        showFeedback('Game details copied to clipboard');
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

  const handleOpenPdf = async () => {
    if (item.type !== 'pdf') return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare && item.pdf.startsWith('file:')) {
        await Sharing.shareAsync(item.pdf, {
          mimeType: 'application/pdf',
          dialogTitle: item.title || 'PDF Document',
        });
        return;
      }
      if (await Linking.canOpenURL(item.pdf)) {
        await Linking.openURL(item.pdf);
      }
    } catch (e) {
      console.warn('Failed to open PDF', e);
    }
  };

  const handleOpenLink = async () => {
    const targetUrl =
      'url' in item
        ? item.url
        : item.type === 'music'
          ? item.externalUrl
          : item.type === 'game'
            ? item.website
            : item.type === 'movie' && item.tmdbId
              ? `https://www.themoviedb.org/movie/${item.tmdbId}`
              : undefined;
    if (!targetUrl) return;
    try {
      if (await Linking.canOpenURL(targetUrl)) {
        await WebBrowser.openBrowserAsync(targetUrl);
      }
    } catch {
      await Linking.openURL(targetUrl);
    }
  };

  const isLink = isLinkType(item.type);
  const isImage = item.type === 'image';
  const isPdf = item.type === 'pdf';
  const isMusic = item.type === 'music';
  const isGame = item.type === 'game';
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
          nestedScrollEnabled
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
          <View className="w-full items-center justify-center px-6 py-8 min-h-[300px] relative">
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                if (isEditingTags) setIsEditingTags(false);
              }}
              style={StyleSheet.absoluteFill}
            />
            {/* If it's an image: only display the image */}
            {isImage && (
              <View className="w-full max-w-sm overflow-hidden bg-zinc-950 border border-zinc-800">
                <ExpoImage
                  source={{ uri: item.image }}
                  className="w-full"
                  style={{
                    aspectRatio: imageRatio,
                  }}
                  contentFit="cover"
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
              <View className="w-full max-w-sm overflow-hidden bg-zinc-950 border border-zinc-800">
                {item.type === 'link' && (
                  <LinkCard
                    favicon={item.favicon}
                    siteTitle={item.siteTitle}
                    title={title || item.title}
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
                    video={item.video}
                    isDetail
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

            {/* If it's a book: show the book card */}
            {item.type === 'book' && (
              <View className="w-full max-w-sm overflow-hidden bg-zinc-950 border border-zinc-800">
                <BookCard
                  title={title || item.title}
                  authors={item.authors}
                  cover={item.cover}
                  coverAspectRatio={item.coverAspectRatio}
                  publisher={item.publisher}
                  publishedDate={item.publishedDate}
                  pageCount={item.pageCount}
                />
              </View>
            )}

            {/* If it's a PDF: show the PDF card */}
            {isPdf && (
              <View className="w-full max-w-sm overflow-hidden bg-zinc-950 border border-zinc-800">
                <PdfCard url={item.pdf} title={title || item.title} />
              </View>
            )}

            {/* If it's a music track: show the music presentation with vinyl record peek effect */}
            {isMusic && (
              <View className="w-full max-w-sm items-center gap-4">
                {/* Vinyl Record & Sleeve Showcase (Disc emerging to the right) */}
                <Pressable
                  onPress={item.previewUrl ? handleToggleMusic : undefined}
                  className="relative items-center justify-center my-2 active:opacity-90"
                  style={{ width: 320, height: 230 }}
                >
                  {/* Vinyl Record (Layered behind jacket, emerging to the right) */}
                  <View
                    style={{
                      position: 'absolute',
                      left: 106,
                      top: 15,
                      zIndex: 1,
                    }}
                  >
                    <VinylRecord size={200} coverUri={item.cover} isSpinning={isPlayingMusic} />
                  </View>

                  {/* Album Sleeve Jacket (Layered on top on the left) */}
                  <View
                    style={{
                      position: 'absolute',
                      width: 214,
                      height: 214,
                      left: 12,
                      top: 8,
                      zIndex: 2,
                      borderRadius: 10,
                      overflow: 'hidden',
                      backgroundColor: '#18181b',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                      shadowColor: '#000000',
                      shadowOffset: { width: 6, height: 4 },
                      shadowOpacity: 0.65,
                      shadowRadius: 10,
                      elevation: 8,
                    }}
                  >
                    {item.cover ? (
                      <ExpoImage
                        source={{ uri: item.cover }}
                        style={{ width: '100%', height: '100%', borderRadius: 9 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-zinc-800">
                        <DiscIcon size={64} color="#71717A" weight="duotone" />
                      </View>
                    )}

                    {/* Right edge sleeve slit opening indicator */}
                    <View
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 3.5,
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                      }}
                    />
                  </View>
                </Pressable>

                <View className="items-center gap-1 mt-1 px-4">
                  <Text className="font-sans-semibold text-2xl text-white text-center leading-tight">
                    {decodeHTML(title || item.title)}
                  </Text>
                  <Text className="font-sans text-base text-zinc-400 text-center mt-0.5">
                    {decodeHTML(item.artist)}
                  </Text>
                  {item.album && (
                    <Text className="font-sans text-xs text-zinc-500 text-center mt-0.5">
                      {decodeHTML(item.album)}
                      {item.releaseDate && ` • ${formatReleaseYear(item.releaseDate)}`}
                    </Text>
                  )}
                </View>

                {item.previewUrl && (
                  <MusicPreviewPlayer
                    previewUrl={item.previewUrl}
                    onPlayingChange={setIsPlayingMusic}
                    playerRef={musicPlayerRef}
                  />
                )}
              </View>
            )}

            {/* If it's a movie: show the movie card */}
            {item.type === 'movie' && (
              <View className="w-full max-w-sm overflow-hidden bg-zinc-950 border border-zinc-800">
                <MovieCard
                  title={title || item.title}
                  poster={item.poster}
                  releaseYear={item.releaseYear}
                  voteAverage={item.voteAverage}
                  genres={item.genres}
                  director={item.director}
                  runtime={item.runtime}
                />
              </View>
            )}

            {/* If it's a game: show the game card */}
            {item.type === 'game' && (
              <View className="w-full max-w-sm overflow-hidden bg-zinc-950 border border-zinc-800">
                <GameCard
                  title={title || item.title}
                  cover={item.cover}
                  platforms={item.platforms}
                  genres={item.genres}
                  releaseYear={item.releaseYear}
                  rating={item.rating}
                  metacritic={item.metacritic}
                />
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
            className="w-full flex-1 bg-zinc-950 border-t border-zinc-800 pb-16"
          >
            {/* Title Section */}
            <View className="flex-row items-center gap-4 py-5 px-6 border-b border-zinc-800">
              <TextTIcon size={20} color="#D4D4D8" />
              <TextInput
                value={title}
                onChangeText={setTitle}
                onFocus={() => {
                  scrollToTitle();
                  if (isEditingTags) setIsEditingTags(false);
                }}
                onBlur={handleSaveTitle}
                placeholder="Add a title here..."
                placeholderTextColor="#71717A"
                className="flex-1 font-sans text-xl text-white leading-tight"
                style={{ borderWidth: 0, backgroundColor: 'transparent' }}
                underlineColorAndroid="transparent"
              />
            </View>

            {/* Tags section */}
            <TagsBox
              tags={tags}
              autoTags={item.autoTags}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              inputRef={tagInputRef}
              showRemoveIcon={isEditingTags}
              onLayout={(e) => {
                tagsY.current = e.nativeEvent.layout.y;
              }}
              onContainerPress={() => {
                if (isEditingTags) {
                  setIsEditingTags(false);
                } else {
                  tagInputRef.current?.focus();
                }
              }}
              onInputFocus={() => {
                scrollToTags();
                if (isEditingTags) setIsEditingTags(false);
              }}
              onTagPress={(tag, idx) => {
                if (isEditingTags) {
                  handleRemoveTag(idx);
                } else {
                  onSelectTag(tag);
                }
              }}
              onTagLongPress={() => setIsEditingTags(true)}
              onAddTag={handleAddTag}
              renderTagWrapper={(tag, idx, children) => (
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
                  {children}
                </Animated.View>
              )}
            />

            {/* Movie Overview Section */}
            {item.type === 'movie' && Boolean(item.overview) && (
              <View className="py-6 px-6 border-b border-zinc-800 gap-3">
                <View className="flex-row items-center gap-2">
                  <FilmSlateIcon size={14} color="#E4E4E7" weight="bold" />
                  <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                    Overview
                  </Text>
                </View>
                <Text className="font-sans text-base text-zinc-300 leading-relaxed">
                  {decodeHTML(item.overview || '')}
                </Text>
              </View>
            )}

            {/* Notes Section */}
            <View
              onLayout={(e) => {
                notesY.current = e.nativeEvent.layout.y;
              }}
              className="py-6 px-6 border-b border-zinc-800 gap-4"
            >
              <View className="flex-row items-center gap-2">
                <NotePencilIcon size={14} color="#E4E4E7" weight="bold" />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                  Notes
                </Text>
              </View>

              <Pressable
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
                  className="w-full font-sans text-base text-zinc-100 leading-relaxed min-h-[72px]"
                  style={{ borderWidth: 0, backgroundColor: 'transparent' }}
                  underlineColorAndroid="transparent"
                />
              </Pressable>
            </View>

            {/* Info Section */}
            <View className="py-6 px-6 gap-4">
              <View className="flex-row items-center gap-2">
                <InfoIcon size={14} color="#E4E4E7" weight="bold" />
                <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                  Info
                </Text>
              </View>

              <View className="flex-row items-center gap-2.5">
                <CalendarBlankIcon size={16} color="#A1A1AA" />
                <Text className="font-sans text-base text-zinc-400">
                  Added {formatDateAdded(item.createdAt)}
                </Text>
              </View>

              {item.type === 'movie' && (
                <>
                  {Boolean(item.releaseDate) && (
                    <View className="flex-row items-center gap-2.5">
                      <CalendarBlankIcon size={16} color="#A1A1AA" />
                      <Text className="font-sans text-base text-zinc-400">
                        Release Date: {item.releaseDate}
                      </Text>
                    </View>
                  )}
                  {Boolean(item.director) && (
                    <View className="flex-row items-center gap-2.5">
                      <FilmSlateIcon size={16} color="#A1A1AA" />
                      <Text className="font-sans text-base text-zinc-400">
                        Director: {decodeHTML(item.director || '')}
                      </Text>
                    </View>
                  )}
                  {Boolean(item.runtime) && (
                    <View className="flex-row items-center gap-2.5">
                      <ClockIcon size={16} color="#A1A1AA" />
                      <Text className="font-sans text-base text-zinc-400">
                        Runtime: {item.runtime} min
                      </Text>
                    </View>
                  )}
                  {typeof item.voteAverage === 'number' && item.voteAverage > 0 && (
                    <View className="flex-row items-center gap-2.5">
                      <StarIcon size={16} color="#F59E0B" weight="fill" />
                      <Text className="font-sans text-base text-zinc-400">
                        Rating: {item.voteAverage.toFixed(1)} / 10
                      </Text>
                    </View>
                  )}
                  {Boolean(item.genres && item.genres.length > 0) && (
                    <View className="flex-row items-center gap-2.5">
                      <FilmSlateIcon size={16} color="#A1A1AA" />
                      <Text className="font-sans text-base text-zinc-400">
                        Genres: {item.genres?.map(decodeHTML).join(', ')}
                      </Text>
                    </View>
                  )}
                  {Boolean(item.originalTitle && item.originalTitle !== item.title) && (
                    <View className="flex-row items-center gap-2.5">
                      <FilmSlateIcon size={16} color="#A1A1AA" />
                      <Text className="font-sans text-base text-zinc-400">
                        Original Title: {decodeHTML(item.originalTitle || '')}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {item.type === 'music' && (
                <>
                  {item.album && (
                    <View className="flex-row items-center gap-2.5">
                      <DiscIcon size={16} color="#A1A1AA" />
                      <Text className="font-sans text-base text-zinc-400">
                        Album: {decodeHTML(item.album)}
                      </Text>
                    </View>
                  )}
                  {item.genre && (
                    <View className="flex-row items-center gap-2.5">
                      <MusicNotesIcon size={16} color="#A1A1AA" />
                      <Text className="font-sans text-base text-zinc-400">
                        Genre: {decodeHTML(item.genre)}
                      </Text>
                    </View>
                  )}
                  {Boolean(item.durationMs) && (
                    <View className="flex-row items-center gap-2.5">
                      <ClockIcon size={16} color="#A1A1AA" />
                      <Text className="font-sans text-base text-zinc-400">
                        Duration: {formatDuration(item.durationMs)}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {item.type === 'book' && (
                <>
                  <View className="flex-row items-center gap-2.5">
                    <BookOpenIcon size={16} color="#A1A1AA" />
                    <Text className="font-sans text-base text-zinc-400">ISBN: {item.isbn}</Text>
                  </View>
                  {item.authors && item.authors.length > 0 && (
                    <View className="flex-row items-center gap-2.5">
                      <Text className="font-sans text-base text-zinc-400">
                        Author(s): {item.authors.join(', ')}
                      </Text>
                    </View>
                  )}
                  {item.publisher && (
                    <View className="flex-row items-center gap-2.5">
                      <Text className="font-sans text-base text-zinc-400">
                        Publisher: {item.publisher}
                      </Text>
                    </View>
                  )}
                  {item.pageCount && (
                    <View className="flex-row items-center gap-2.5">
                      <Text className="font-sans text-base text-zinc-400">
                        Pages: {item.pageCount}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </Pressable>
        </ScrollView>

        {/* Action buttons at the bottom */}
        <View pointerEvents="box-none">
          <View className="w-full flex-row items-center justify-center border-t border-zinc-800 bg-zinc-950">
            {/* Delete button */}
            <Pressable
              onPress={handleDelete}
              hitSlop={12}
              className="flex-1 pt-6 pb-10 items-center justify-center border-r border-zinc-800 active:bg-zinc-900"
              accessibilityRole="button"
              accessibilityLabel="Delete"
            >
              <TrashSimpleIcon size={24} color="#EF4444" />
            </Pressable>

            {/* Download button (images only) */}
            {isImage && (
              <Pressable
                onPress={handleDownload}
                hitSlop={12}
                className="flex-1 pt-6 pb-10 items-center justify-center border-r border-zinc-800 active:bg-zinc-900"
                accessibilityRole="button"
                accessibilityLabel="Download image"
              >
                <DownloadSimpleIcon size={24} color="#FFFFFF" />
              </Pressable>
            )}

            {/* Copy button (images, notes, quotes, pdfs, movies, books, music, and games) */}
            {(isImage ||
              isNoteOrQuote ||
              isPdf ||
              isMusic ||
              isGame ||
              item.type === 'movie' ||
              item.type === 'book') && (
              <Pressable
                onPress={handleCopy}
                hitSlop={12}
                className={`flex-1 pt-6 pb-10 items-center justify-center active:bg-zinc-900 ${
                  isImage || isPdf || isMusic || (isGame && Boolean(item.website))
                    ? 'border-r border-zinc-800'
                    : ''
                }`}
                accessibilityRole="button"
                accessibilityLabel="Copy"
              >
                <CopyIcon size={24} color="#FFFFFF" />
              </Pressable>
            )}

            {/* Share button (links, images, pdfs, movies, books, music, and games) */}
            {(isLink ||
              isImage ||
              isPdf ||
              isMusic ||
              isGame ||
              item.type === 'movie' ||
              item.type === 'book') && (
              <Pressable
                onPress={handleShare}
                hitSlop={12}
                className={`flex-1 pt-6 pb-10 items-center justify-center active:bg-zinc-900 ${
                  isLink ||
                  isPdf ||
                  (item.type === 'book' && Boolean(item.url)) ||
                  (isMusic && Boolean(item.externalUrl)) ||
                  (isGame && Boolean(item.website)) ||
                  (item.type === 'movie' && Boolean(item.tmdbId))
                    ? 'border-r border-zinc-800'
                    : ''
                }`}
                accessibilityRole="button"
                accessibilityLabel="Share"
              >
                <ExportIcon size={24} color="#FFFFFF" />
              </Pressable>
            )}

            {/* Open link button (links, books with url, music with externalUrl, games with website, or movies with tmdbId) */}
            {(isLink ||
              (item.type === 'book' && Boolean(item.url)) ||
              (isMusic && Boolean(item.externalUrl)) ||
              (isGame && Boolean(item.website)) ||
              (item.type === 'movie' && Boolean(item.tmdbId))) && (
              <Pressable
                onPress={handleOpenLink}
                hitSlop={12}
                className="flex-1 pt-6 pb-10 items-center justify-center active:bg-zinc-900"
                accessibilityRole="button"
                accessibilityLabel="Open link"
              >
                <ArrowSquareOutIcon size={24} color="#FFFFFF" />
              </Pressable>
            )}

            {/* Open PDF button (PDFs only) */}
            {isPdf && (
              <Pressable
                onPress={handleOpenPdf}
                hitSlop={12}
                className="flex-1 pt-6 pb-10 items-center justify-center active:bg-zinc-900"
                accessibilityRole="button"
                accessibilityLabel="Open PDF"
              >
                <ArrowSquareOutIcon size={24} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </View>
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
      <BlurView intensity={64} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />

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
