import { decodeHTML } from 'entities';
import * as Clipboard from 'expo-clipboard';
import { File } from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { LinkIcon, NotePencilIcon, TextTIcon, UserIcon, XIcon } from 'phosphor-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
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

import { BookLogs } from '@/components/books/BookLogs';
import { getProgressLabel } from '@/components/cards/ProgressStatus';
import { LinkedContentPicker } from '@/components/LinkedContentPicker';
import { LinkedContentPreview } from '@/components/LinkedContentPreview';
import { TagsBox } from '@/components/TagsBox';
import { useLibrary } from '@/hooks/useLibrary';
import { isLinkableItem } from '@/lib/library/links';
import {
  MEDIA_PROGRESS_STATUSES,
  type BookReadingLog,
  type LibraryItem,
  type LibraryItemType,
  type MediaProgressStatus,
} from '@/lib/library/types';
import { CardActions } from './CardActions';
import { CardInfo } from './CardInfo';
import { CardMediaDetails } from './CardMediaDetails';
import { CardPdfReader } from './CardPdfReader';
import { CardPreview } from './CardPreview';
import { CardReview } from './CardReview';

function isLinkType(type: LibraryItem['type']): boolean {
  return (
    type === 'link' ||
    type === 'article' ||
    type === 'youtube' ||
    type === 'tweet' ||
    type === 'reddit'
  );
}

type TrackableItemType = 'book' | 'movie' | 'game' | 'article' | 'youtube';

function isTrackableItem(
  item: LibraryItem
): item is Extract<LibraryItem, { type: TrackableItemType }> {
  return (
    item.type === 'book' ||
    item.type === 'movie' ||
    item.type === 'game' ||
    item.type === 'article' ||
    item.type === 'youtube'
  );
}

function getAllowedProgressStatuses(type: TrackableItemType): readonly MediaProgressStatus[] {
  return type === 'article' || type === 'youtube'
    ? MEDIA_PROGRESS_STATUSES.slice(0, -1)
    : MEDIA_PROGRESS_STATUSES;
}

function getCurrentProgressStatus(
  type: TrackableItemType,
  status?: MediaProgressStatus
): MediaProgressStatus {
  return status && getAllowedProgressStatuses(type).includes(status) ? status : 'want';
}

function getNextProgressStatus(
  type: TrackableItemType,
  status: MediaProgressStatus
): MediaProgressStatus {
  const allowedStatuses = getAllowedProgressStatuses(type);
  const currentIndex = allowedStatuses.indexOf(status);
  return allowedStatuses[(currentIndex + 1) % allowedStatuses.length];
}

function getProgressTone(status: MediaProgressStatus): 'blue' | 'amber' | 'emerald' | 'zinc' {
  const tones = {
    want: 'blue',
    'in-progress': 'amber',
    completed: 'emerald',
    abandoned: 'zinc',
  } as const;

  return tones[status];
}

type CardDetailContentProps = {
  item: LibraryItem;
  onDismiss: () => void;
  onSelectTag: (tag: string) => void;
  onSelectType: (type: LibraryItemType, label: string) => void;
};

export function CardDetailContent({
  item,
  onDismiss,
  onSelectTag,
  onSelectType,
}: CardDetailContentProps) {
  const { addTextItem, deleteItem, updateItem, state } = useLibrary();
  const libraryItems = state.status === 'ready' ? state.result.items : [];
  const linkedContent =
    item.type === 'note' || item.type === 'quote'
      ? libraryItems.find((candidate) => candidate.id === item.linkedItemId)
      : undefined;
  const linkedNotes = isLinkableItem(item)
    ? libraryItems.filter(
        (candidate): candidate is Extract<LibraryItem, { type: 'note' | 'quote' }> =>
          (candidate.type === 'note' || candidate.type === 'quote') &&
          candidate.linkedItemId === item.id
      )
    : [];
  const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);
  const handleUpdateLinkedItem = (linkedItemId?: string) => {
    updateItem(item.id, { linkedItemId }).catch((e) => {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not update link');
    });
  };
  const insets = useSafeAreaInsets();

  const initialTitle =
    'title' in item && typeof item.title === 'string' && item.title
      ? decodeHTML(item.title)
      : item.type === 'link' && 'siteTitle' in item && typeof item.siteTitle === 'string'
        ? decodeHTML(item.siteTitle)
        : '';
  const initialText = 'text' in item && typeof item.text === 'string' ? decodeHTML(item.text) : '';
  const [title, setTitle] = useState(initialTitle);
  const [quoteAuthor, setQuoteAuthor] = useState(
    item.type === 'quote' ? decodeHTML(item.author || '') : ''
  );
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [progressStatus, setProgressStatus] = useState<MediaProgressStatus>(
    isTrackableItem(item) ? getCurrentProgressStatus(item.type, item.progressStatus) : 'want'
  );
  const [reviewRating, setReviewRating] = useState(
    item.type === 'book' || item.type === 'movie' || item.type === 'game'
      ? (item.review?.rating ?? null)
      : null
  );
  const [reviewComments, setReviewComments] = useState(
    item.type === 'book' || item.type === 'movie' || item.type === 'game'
      ? (item.review?.comments ?? '')
      : ''
  );
  useEffect(() => {
    if (
      (item.type !== 'book' && item.type !== 'movie' && item.type !== 'game') ||
      progressStatus !== 'completed' ||
      reviewRating === null
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const comments = reviewComments.trim();
      updateItem(item.id, {
        review: { rating: reviewRating, ...(comments ? { comments } : {}) },
      }).catch((e) => console.warn('Failed to save review', e));
    }, 350);

    return () => clearTimeout(timer);
  }, [item, progressStatus, reviewRating, reviewComments, updateItem]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState(item.note || '');
  const [editedText, setEditedText] = useState(initialText);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [shakeAnim] = useState(() => new Animated.Value(0));
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const tagInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
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

  const handleSaveQuoteAuthor = async () => {
    if (item.type !== 'quote') return;
    const cleanAuthor = quoteAuthor.trim();
    if ((item.author || '') === cleanAuthor) return;
    try {
      await updateItem(item.id, { author: cleanAuthor || undefined });
    } catch (e) {
      console.warn('Failed to save quote author', e);
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

  const handleProgressStatusPress = async () => {
    if (!isTrackableItem(item)) return;

    const nextStatus = getNextProgressStatus(item.type, progressStatus);
    setProgressStatus(nextStatus);
    try {
      await updateItem(item.id, { progressStatus: nextStatus });
    } catch (e) {
      setProgressStatus(progressStatus);
      console.warn('Failed to update progress status', e);
    }
  };

  const handleSaveReadingLog = async (
    date: string,
    page: number,
    noteText: string,
    totalPages?: number,
    existingLog?: BookReadingLog
  ) => {
    if (item.type !== 'book') return;
    let noteId: string | undefined;
    let createdNoteId: string | undefined;
    let updatedNoteText: string | undefined;
    try {
      const previousNote = existingLog?.noteId
        ? libraryItems.find(
            (candidate): candidate is Extract<LibraryItem, { type: 'note' | 'quote' }> =>
              (candidate.type === 'note' || candidate.type === 'quote') &&
              candidate.id === existingLog.noteId
          )
        : undefined;

      if (existingLog?.noteId && previousNote && noteText) {
        noteId = existingLog.noteId;
        updatedNoteText = previousNote.text;
        await updateItem(existingLog.noteId, { text: noteText } as Partial<LibraryItem>);
      } else if (noteText) {
        const createdNote = await addTextItem(noteText, undefined, {
          linkedItemId: item.id,
          forceNote: true,
        });
        noteId = createdNote.id;
        createdNoteId = createdNote.id;
      }

      const updatedLog: BookReadingLog = existingLog
        ? { ...existingLog, date, page, noteId }
        : {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            date,
            page,
            createdAt: new Date().toISOString(),
            ...(noteId ? { noteId } : {}),
          };
      const readingLogs = existingLog
        ? (item.readingLogs ?? []).some((log) => log.id === existingLog.id)
          ? (item.readingLogs ?? []).map((log) => (log.id === existingLog.id ? updatedLog : log))
          : [...(item.readingLogs ?? []), updatedLog]
        : [...(item.readingLogs ?? []), updatedLog];
      const effectivePageCount = totalPages ?? item.pageCount;
      const reachedEnd =
        effectivePageCount !== undefined && effectivePageCount > 0 && page >= effectivePageCount;

      await updateItem(item.id, {
        ...(totalPages ? { pageCount: totalPages } : {}),
        ...(reachedEnd ? { progressStatus: 'completed' } : {}),
        readingLogs,
      });
      if (reachedEnd) setProgressStatus('completed');

      if (existingLog?.noteId && !noteId && previousNote) {
        await deleteItem(existingLog.noteId).catch((error) => {
          console.warn('Failed to remove reading log note', error);
        });
      }
    } catch (error) {
      if (createdNoteId) {
        try {
          await deleteItem(createdNoteId);
        } catch (cleanupError) {
          console.warn('Failed to remove note after reading log error', cleanupError);
        }
      }
      if (existingLog?.noteId && updatedNoteText !== undefined) {
        await updateItem(existingLog.noteId, {
          text: updatedNoteText,
        } as Partial<LibraryItem>).catch((rollbackError) =>
          console.warn('Failed to restore reading log note', rollbackError)
        );
      }
      throw error;
    }
  };

  const handleDeleteReadingLog = async (logToDelete: BookReadingLog) => {
    if (item.type !== 'book') return;
    await updateItem(item.id, {
      readingLogs: (item.readingLogs ?? []).filter((log) => log.id !== logToDelete.id),
    });
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

  const handleOpenPdf = () => {
    if (item.type !== 'pdf') return;
    setIsPdfOpen(true);
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
          <CardPreview
            item={item}
            title={title}
            editedText={editedText}
            onTextChange={handleCardTextChange}
            onTextBlur={handleCardTextBlur}
            onTextFocus={() => {
              scrollToTopSection();
              if (isEditingTags) setIsEditingTags(false);
            }}
            onDismissEditingTags={() => {
              Keyboard.dismiss();
              if (isEditingTags) setIsEditingTags(false);
            }}
          />

          {/* SECTION 2: BOTTOM SECTION (INFORMATION ABOUT THE CARD) */}
          <View
            onLayout={(e) => {
              section2Y.current = e.nativeEvent.layout.y;
            }}
            className="w-full flex-1 bg-zinc-950 border-t border-zinc-800 pb-16"
          >
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                if (isEditingTags) setIsEditingTags(false);
              }}
              style={StyleSheet.absoluteFill}
            />

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

            {item.type === 'quote' && (
              <View className="flex-row items-center gap-4 py-5 px-6 border-b border-zinc-800">
                <UserIcon size={20} color="#E4E4E7" />

                <TextInput
                  value={quoteAuthor}
                  onChangeText={setQuoteAuthor}
                  onBlur={handleSaveQuoteAuthor}
                  placeholder="Add an author..."
                  placeholderTextColor="#71717A"
                  className="flex-1 font-sans text-xl text-zinc-100 leading-tight"
                  style={{ borderWidth: 0, backgroundColor: 'transparent' }}
                  underlineColorAndroid="transparent"
                />
              </View>
            )}

            {/* Tags section */}
            <TagsBox
              containerClassName="py-6 px-6 border-b border-zinc-800 gap-4"
              tags={tags}
              autoTags={item.autoTags}
              cardType={item.type}
              onCardTypePress={onSelectType}
              priorityTag={
                isTrackableItem(item)
                  ? {
                      label: getProgressLabel(item.type, progressStatus),
                      tone: getProgressTone(progressStatus),
                      icon: progressStatus,
                      onPress: handleProgressStatusPress,
                      accessibilityLabel: `${getProgressLabel(item.type, progressStatus)}. Tap to change progress status`,
                    }
                  : undefined
              }
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

            {/* Link to content Section */}
            {isNoteOrQuote && (
              <View className="py-6 px-6 border-b border-zinc-800 gap-5">
                {linkedContent && isLinkableItem(linkedContent) ? (
                  <>
                    <View className="flex-row items-center gap-2">
                      <LinkIcon size={16} color="#E4E4E7" />
                      <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                        Linked content
                      </Text>
                    </View>

                    <LinkedContentPreview
                      item={linkedContent}
                      onChange={() =>
                        router.push({ pathname: '/card/[id]', params: { id: linkedContent.id } })
                      }
                      onRemove={() => handleUpdateLinkedItem(undefined)}
                    />
                  </>
                ) : (
                  <View className="flex-row items-center rounded-xl pr-3">
                    <Pressable
                      onPress={() => setIsLinkPickerOpen(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Link to content"
                      className="flex-row items-center gap-4"
                    >
                      <LinkIcon size={20} color="#FFFFFF" />
                      <Text className="font-sans-semibold text-lg text-white">Link to content</Text>
                    </Pressable>
                    {(item.type === 'note' || item.type === 'quote') && item.linkedItemId && (
                      <Pressable
                        onPress={() => handleUpdateLinkedItem(undefined)}
                        accessibilityRole="button"
                        accessibilityLabel="Remove linked content"
                        hitSlop={10}
                        className="p-2 rounded-full bg-zinc-800 active:opacity-70"
                      >
                        <XIcon size={16} color="#E4E4E7" weight="bold" />
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Linked Notes Section */}
            {isLinkableItem(item) && linkedNotes.length > 0 && (
              <View className="py-6 px-6 border-b border-zinc-800 gap-4">
                <View className="flex-row items-center gap-2">
                  <NotePencilIcon size={15} color="#E4E4E7" />
                  <Text className="font-sans-semibold text-sm tracking-wider uppercase text-zinc-200">
                    Linked notes ({linkedNotes.length})
                  </Text>
                </View>
                {linkedNotes.map((linkedNote) => (
                  <Pressable
                    key={linkedNote.id}
                    onPress={() =>
                      router.push({ pathname: '/card/[id]', params: { id: linkedNote.id } })
                    }
                    accessibilityRole="button"
                    className="rounded-xl bg-zinc-900 px-4 py-4"
                  >
                    <Text
                      className="font-sans-medium text-sm text-zinc-100 leading-[1.8]"
                      numberOfLines={3}
                    >
                      {linkedNote.title || linkedNote.text}
                    </Text>
                    {linkedNote.title && (
                      <Text className="font-sans text-xs text-zinc-400 mt-1" numberOfLines={2}>
                        {linkedNote.text}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {item.type === 'book' &&
              (progressStatus === 'in-progress' ||
                (progressStatus === 'completed' && (item.readingLogs?.length ?? 0) > 0)) && (
                <BookLogs
                  book={item}
                  readOnly={progressStatus === 'completed'}
                  onSave={handleSaveReadingLog}
                  onDelete={handleDeleteReadingLog}
                  getNoteText={(noteId) => {
                    const linkedNote = libraryItems.find(
                      (candidate) =>
                        (candidate.type === 'note' || candidate.type === 'quote') &&
                        candidate.id === noteId
                    );
                    return linkedNote && (linkedNote.type === 'note' || linkedNote.type === 'quote')
                      ? linkedNote.text
                      : undefined;
                  }}
                />
              )}

            {(item.type === 'book' || item.type === 'movie' || item.type === 'game') &&
              progressStatus === 'completed' && (
                <CardReview
                  rating={reviewRating}
                  comments={reviewComments}
                  onRatingChange={setReviewRating}
                  onCommentsChange={setReviewComments}
                />
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

            <CardMediaDetails item={item} />

            <CardInfo item={item} />
          </View>
        </ScrollView>

        <CardActions
          item={item}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onCopy={handleCopy}
          onShare={handleShare}
          onOpenLink={handleOpenLink}
          onOpenPdf={handleOpenPdf}
        />
      </KeyboardAvoidingView>

      {item.type === 'pdf' && (
        <CardPdfReader
          item={item}
          visible={isPdfOpen}
          onClose={() => setIsPdfOpen(false)}
          topInset={insets.top}
        />
      )}
      {isNoteOrQuote && (
        <LinkedContentPicker
          visible={isLinkPickerOpen}
          items={libraryItems}
          selectedId={item.linkedItemId}
          onSelect={handleUpdateLinkedItem}
          onClose={() => setIsLinkPickerOpen(false)}
        />
      )}
    </View>
  );
}
