import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { BlurTargetView } from 'expo-blur';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ArticleIcon,
  BookOpenIcon,
  FilePdfIcon,
  FilmSlateIcon,
  GameControllerIcon,
  ImageIcon,
  LinkIcon,
  MusicNotesIcon,
  NotePencilIcon,
  PlusIcon,
  QuotesIcon,
  RedditLogoIcon,
  TiktokLogoIcon,
  TwitterLogoIcon,
  VideoCameraIcon,
  WarningIcon,
  YoutubeLogoIcon,
} from 'phosphor-react-native';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ItemCard } from '@/components/cards/ItemCard';
import { CardSelectionBar } from '@/components/menus/CardSelectionBar';
import { RestoreToast } from '@/components/menus/RestoreToast';
import { SearchBar } from '@/components/menus/SearchBar';
import { useSearchBarOverlay } from '@/components/menus/SearchBarOverlay';
import { AddToFolderModal } from '@/components/modals/AddToFolderModal';
import { NewBookModal } from '@/components/modals/NewBookModal';
import { NewGameModal } from '@/components/modals/NewGameModal';
import { NewImageModal } from '@/components/modals/NewImageModal';
import { NewLinkModal } from '@/components/modals/NewLinkModal';
import { NewMovieModal } from '@/components/modals/NewMovieModal';
import { NewMusicModal } from '@/components/modals/NewMusicModal';
import { NewNoteModal } from '@/components/modals/NewNoteModal';
import { NewPdfModal } from '@/components/modals/NewPdfModal';
import { NewVideoModal } from '@/components/modals/NewVideoModal';
import { useLibrary } from '@/hooks/useLibrary';
import { isLinkableItem, type LinkableItem } from '@/lib/library/links';
import { matchesStatus, STATUS_FOLDERS } from '@/lib/library/organize';
import type {
  DeletedItemBackup,
  PickedImageAsset,
  PickedPdfAsset,
  PickedVideoAsset,
} from '@/lib/library/storage';
import type { MediaProgressStatus } from '@/lib/library/types';
import { ITEM_TYPES, type LibraryItem, type LibraryItemType } from '@/lib/library/types';

const CARD_TYPE_LABELS: Record<LibraryItemType, string> = {
  note: 'Notes',
  quote: 'Quotes',
  image: 'Media',
  pdf: 'PDFs',
  video: 'Videos',
  link: 'Links',
  article: 'Articles',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  tweet: 'Tweets',
  reddit: 'Reddit',
  book: 'Books',
  music: 'Music',
  movie: 'Movies',
  game: 'Games',
};

const CARD_TYPE_ICONS = {
  note: NotePencilIcon,
  quote: QuotesIcon,
  image: ImageIcon,
  pdf: FilePdfIcon,
  video: VideoCameraIcon,
  link: LinkIcon,
  article: ArticleIcon,
  youtube: YoutubeLogoIcon,
  tiktok: TiktokLogoIcon,
  tweet: TwitterLogoIcon,
  reddit: RedditLogoIcon,
  book: BookOpenIcon,
  music: MusicNotesIcon,
  movie: FilmSlateIcon,
  game: GameControllerIcon,
} satisfies Record<LibraryItemType, typeof NotePencilIcon>;

type BoardGridContextType = {
  lastIndices: { col0: number; col1: number };
  totalItems: number;
  reportItemCol: (index: number, col: number) => void;
};

type AddControlItem =
  'note' | 'link' | 'book' | 'music' | 'movie' | 'game' | 'image' | 'pdf' | 'video' | 'all';

type AddControlAction = {
  item: AddControlItem;
  token?: string;
  imageAsset?: PickedImageAsset;
  pdfAsset?: PickedPdfAsset;
};

const BoardGridContext = createContext<BoardGridContextType>({
  lastIndices: { col0: -1, col1: -1 },
  totalItems: 0,
  reportItemCol: () => {},
});

export default function BoardScreen() {
  const {
    state,
    refresh,
    refreshing,
    deleteItems,
    restoreItems,
    searchItems,
    searchQuery,
    searchTag,
    searchType,
    setSearchQuery,
    clearSearchTag,
    updateItem,
  } = useLibrary();
  const searchBlurTargetRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const setSearchBarOverlay = useSearchBarOverlay();
  const {
    newNote,
    newLink,
    newBook,
    newMusic,
    newMovie,
    newGame,
    newImageUri,
    newImageFileName,
    newImageMimeType,
    newImageTimestamp,
    newPdfUri,
    newPdfFileName,
    newPdfTimestamp,
    newVideoUri,
    newVideoFileName,
    newVideoFileSize,
    newVideoTimestamp,
    controlAddItem,
    controlToken,
    folderKind,
    folderKey,
  } = useLocalSearchParams<{
    newNote?: string;
    newLink?: string;
    newBook?: string;
    newMusic?: string;
    newMovie?: string;
    newGame?: string;
    newImageUri?: string;
    newImageFileName?: string;
    newImageMimeType?: string;
    newImageTimestamp?: string;
    newPdfUri?: string;
    newPdfFileName?: string;
    newPdfTimestamp?: string;
    newVideoUri?: string;
    newVideoFileName?: string;
    newVideoFileSize?: string;
    newVideoTimestamp?: string;
    controlAddItem?: AddControlItem;
    controlToken?: string;
    folderKind?: 'status' | 'tag';
    folderKey?: string;
  }>();
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<PickedImageAsset | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pendingPdf, setPendingPdf] = useState<PickedPdfAsset | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<PickedVideoAsset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [restoreBackup, setRestoreBackup] = useState<DeletedItemBackup[] | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<{
    type: LibraryItemType;
    folderId: string;
  } | null>(null);
  const activeFolderKind =
    folderKey && (folderKind === 'status' || folderKind === 'tag') ? folderKind : null;
  const activeFolderKey = activeFolderKind ? folderKey : null;
  const folderLabel =
    activeFolderKind === 'status'
      ? STATUS_FOLDERS.find((folder) => folder.key === activeFolderKey)?.title
      : activeFolderKey;

  const clearFolderFilter = useCallback(() => {
    setSelectedType(null);
    router.setParams({ folderKind: '', folderKey: '' });
  }, []);
  const handleSearchChange = useCallback((text: string) => setSearchQuery(text), [setSearchQuery]);
  const itemColsRef = useRef<Map<number, number>>(new Map());
  const [lastIndices, setLastIndices] = useState<{ col0: number; col1: number }>({
    col0: -1,
    col1: -1,
  });
  const lastOpenedNoteRef = useRef<string | null>(null);
  const lastOpenedLinkRef = useRef<string | null>(null);
  const lastOpenedBookRef = useRef<string | null>(null);
  const lastOpenedMusicRef = useRef<string | null>(null);
  const lastOpenedMovieRef = useRef<string | null>(null);
  const lastOpenedGameRef = useRef<string | null>(null);
  const lastOpenedImageRef = useRef<string | null>(null);
  const lastOpenedPdfRef = useRef<string | null>(null);
  const lastOpenedVideoRef = useRef<string | null>(null);
  const lastOpenedControlRef = useRef<string | null>(null);

  const activeAddModalRef = useRef<Exclude<AddControlItem, 'all'> | null>(null);
  const queuedControlActionRef = useRef<AddControlAction | null>(null);

  const openControlAction = useCallback((action: AddControlAction) => {
    if (action.item === 'all') {
      activeAddModalRef.current = null;
      router.replace('/add');
      return;
    }

    activeAddModalRef.current = action.item;
    switch (action.item) {
      case 'note':
        setIsNoteDrawerOpen(true);
        break;
      case 'link':
        setIsLinkModalOpen(true);
        break;
      case 'book':
        setIsBookModalOpen(true);
        break;
      case 'music':
        setIsMusicModalOpen(true);
        break;
      case 'movie':
        setIsMovieModalOpen(true);
        break;
      case 'game':
        setIsGameModalOpen(true);
        break;
      case 'image':
        if (!action.imageAsset) {
          activeAddModalRef.current = null;
          router.replace({
            pathname: '/add',
            params: { controlItem: 'image', controlToken: action.token ?? Date.now().toString() },
          });
          break;
        }
        setPendingImage(action.imageAsset ?? null);
        setIsImageModalOpen(true);
        break;
      case 'pdf':
        if (!action.pdfAsset) {
          activeAddModalRef.current = null;
          router.replace({
            pathname: '/add',
            params: { controlItem: 'pdf', controlToken: action.token ?? Date.now().toString() },
          });
          break;
        }
        setPendingPdf(action.pdfAsset ?? null);
        setIsPdfModalOpen(true);
        break;
      case 'video':
        activeAddModalRef.current = null;
        router.replace({
          pathname: '/add',
          params: { controlItem: 'video', controlToken: action.token ?? Date.now().toString() },
        });
        break;
    }
  }, []);

  const requestControlAction = useCallback(
    (action: AddControlAction) => {
      if (!activeAddModalRef.current) {
        openControlAction(action);
        return;
      }

      queuedControlActionRef.current = action;
      setIsNoteDrawerOpen(false);
      setIsLinkModalOpen(false);
      setIsBookModalOpen(false);
      setIsMusicModalOpen(false);
      setIsMovieModalOpen(false);
      setIsGameModalOpen(false);
      setIsImageModalOpen(false);
      setIsPdfModalOpen(false);
      setIsVideoModalOpen(false);
    },
    [openControlAction]
  );

  const handleAddModalDismiss = useCallback(() => {
    activeAddModalRef.current = null;
    const queuedAction = queuedControlActionRef.current;
    if (!queuedAction) return;

    queuedControlActionRef.current = null;
    openControlAction(queuedAction);
  }, [openControlAction]);

  const closeAddModal = useCallback((item: Exclude<AddControlItem, 'all'>) => {
    if (!queuedControlActionRef.current) {
      activeAddModalRef.current = null;
    }

    switch (item) {
      case 'note':
        setIsNoteDrawerOpen(false);
        break;
      case 'link':
        setIsLinkModalOpen(false);
        break;
      case 'book':
        setIsBookModalOpen(false);
        break;
      case 'music':
        setIsMusicModalOpen(false);
        break;
      case 'movie':
        setIsMovieModalOpen(false);
        break;
      case 'game':
        setIsGameModalOpen(false);
        break;
      case 'image':
        setIsImageModalOpen(false);
        setPendingImage(null);
        break;
      case 'pdf':
        setIsPdfModalOpen(false);
        setPendingPdf(null);
        break;
      case 'video':
        setIsVideoModalOpen(false);
        setPendingVideo(null);
        break;
    }
  }, []);

  useEffect(() => {
    if (!controlAddItem || !controlToken) return;
    const requestKey = `${controlAddItem}:${controlToken}`;
    if (requestKey === lastOpenedControlRef.current) return;
    lastOpenedControlRef.current = requestKey;
    requestControlAction({ item: controlAddItem, token: controlToken });
  }, [controlAddItem, controlToken, requestControlAction]);

  useEffect(() => {
    if (newNote && newNote !== lastOpenedNoteRef.current) {
      lastOpenedNoteRef.current = newNote;
      requestControlAction({ item: 'note' });
    }
  }, [newNote, requestControlAction]);

  useEffect(() => {
    if (newLink && newLink !== lastOpenedLinkRef.current) {
      lastOpenedLinkRef.current = newLink;
      requestControlAction({ item: 'link' });
    }
  }, [newLink, requestControlAction]);

  useEffect(() => {
    if (newBook && newBook !== lastOpenedBookRef.current) {
      lastOpenedBookRef.current = newBook;
      requestControlAction({ item: 'book' });
    }
  }, [newBook, requestControlAction]);

  useEffect(() => {
    if (newMusic && newMusic !== lastOpenedMusicRef.current) {
      lastOpenedMusicRef.current = newMusic;
      requestControlAction({ item: 'music' });
    }
  }, [newMusic, requestControlAction]);

  useEffect(() => {
    if (newMovie && newMovie !== lastOpenedMovieRef.current) {
      lastOpenedMovieRef.current = newMovie;
      requestControlAction({ item: 'movie' });
    }
  }, [newMovie, requestControlAction]);

  useEffect(() => {
    if (newGame && newGame !== lastOpenedGameRef.current) {
      lastOpenedGameRef.current = newGame;
      requestControlAction({ item: 'game' });
    }
  }, [newGame, requestControlAction]);

  useEffect(() => {
    const pdfToken = newPdfTimestamp || newPdfUri;
    if (newPdfUri && pdfToken && pdfToken !== lastOpenedPdfRef.current) {
      lastOpenedPdfRef.current = pdfToken;
      requestControlAction({
        item: 'pdf',
        pdfAsset: { uri: newPdfUri, fileName: newPdfFileName },
      });
    }
  }, [newPdfUri, newPdfFileName, newPdfTimestamp, requestControlAction]);

  useEffect(() => {
    const imageToken = newImageTimestamp || newImageUri;
    if (newImageUri && imageToken && imageToken !== lastOpenedImageRef.current) {
      lastOpenedImageRef.current = imageToken;
      requestControlAction({
        item: 'image',
        imageAsset: {
          uri: newImageUri,
          fileName: newImageFileName,
          mimeType: newImageMimeType,
        },
      });
    }
  }, [newImageUri, newImageFileName, newImageMimeType, newImageTimestamp, requestControlAction]);

  useEffect(() => {
    const token = newVideoTimestamp || newVideoUri;
    if (!newVideoUri || !token || token === lastOpenedVideoRef.current) return;
    lastOpenedVideoRef.current = token;
    activeAddModalRef.current = 'video';
    setPendingVideo({
      uri: newVideoUri,
      fileName: newVideoFileName,
      fileSize: Number(newVideoFileSize) || undefined,
    });
    setIsVideoModalOpen(true);
  }, [newVideoUri, newVideoFileName, newVideoFileSize, newVideoTimestamp]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const toggleCardSelection = useCallback((itemId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleCardLongPress = useCallback(
    (item: LibraryItem) => {
      if (!isEditing) {
        setIsEditing(true);
        setSelectedCardIds(new Set([item.id]));
      } else {
        toggleCardSelection(item.id);
      }
    },
    [isEditing, toggleCardSelection]
  );

  const handleCardPress = useCallback(
    (item: LibraryItem) => {
      if (isEditing) {
        toggleCardSelection(item.id);
      } else {
        router.push({
          pathname: '/card/[id]',
          params: { id: item.id },
        });
      }
    },
    [isEditing, toggleCardSelection]
  );

  const handleCancelEdition = useCallback(() => {
    setIsEditing(false);
    setSelectedCardIds(new Set());
  }, []);

  const handleDeleteSelected = async () => {
    const idsToDelete = Array.from(selectedCardIds);
    if (idsToDelete.length === 0) return;

    try {
      setIsEditing(false);
      setSelectedCardIds(new Set());

      const backups = await deleteItems(idsToDelete);

      if (backups.length > 0) {
        setRestoreBackup(backups);
        setIsToastVisible(true);
      }
    } catch (error) {
      console.error('Failed to delete cards:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete cards');
    }
  };

  const handleRestore = async () => {
    if (!restoreBackup || restoreBackup.length === 0) return;
    try {
      const backups = restoreBackup;
      setIsToastVisible(false);
      setRestoreBackup(null);
      await restoreItems(backups);
    } catch (error) {
      console.error('Failed to restore cards:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to restore cards');
    }
  };

  const handleDismissToast = () => {
    setIsToastVisible(false);
    setRestoreBackup(null);
  };

  const isSearching = searchQuery.trim().length > 0;
  const folderId = activeFolderKind ? `${activeFolderKind}:${activeFolderKey}` : '';
  const activeType = searchType ?? (selectedType?.folderId === folderId ? selectedType.type : null);
  const hasActiveFilter =
    isSearching || activeType !== null || activeFolderKind !== null || searchTag !== null;

  const handleTypeFilter = useCallback(
    (type: LibraryItemType) => {
      if (searchType) setSearchQuery('');
      setSelectedType(activeType === type ? null : { type, folderId });
    },
    [activeType, folderId, searchType, setSearchQuery]
  );

  const displayedItems = useMemo(() => {
    if (state.status !== 'ready') return [];
    if (!hasActiveFilter) return state.result.items;
    const matches =
      activeType || (isSearching && !searchType)
        ? searchItems({
            ...(activeType ? { type: activeType } : {}),
            ...(isSearching && !searchType ? { searchQuery } : {}),
          })
        : state.result.items;
    return matches.filter(
      (item) =>
        (!searchTag || item.tags?.some((tag) => tag.trim() === searchTag)) &&
        (activeFolderKind !== 'status' ||
          matchesStatus(item, activeFolderKey as MediaProgressStatus)) &&
        (activeFolderKind !== 'tag' || item.tags?.some((tag) => tag.trim() === activeFolderKey))
    );
  }, [
    state,
    hasActiveFilter,
    activeType,
    isSearching,
    searchQuery,
    searchType,
    searchTag,
    searchItems,
    activeFolderKind,
    activeFolderKey,
  ]);

  const selectedItems = useMemo(
    () =>
      state.status === 'ready'
        ? state.result.items.filter((item) => selectedCardIds.has(item.id))
        : [],
    [state, selectedCardIds]
  );

  const reportItemCol = useCallback(
    (index: number, col: number) => {
      itemColsRef.current.set(index, col);
      const total = displayedItems.length;
      if (total === 0) return;

      if (index >= total - 2) {
        let col0 = -1;
        let col1 = -1;
        for (let i = total - 1; i >= 0; i--) {
          const c = itemColsRef.current.get(i);
          if (c === 0 && col0 === -1) col0 = i;
          if (c === 1 && col1 === -1) col1 = i;
          if (col0 !== -1 && col1 !== -1) break;
        }

        setLastIndices((prev) => {
          if (prev.col0 === col0 && prev.col1 === col1) return prev;
          return { col0, col1 };
        });
      }
    },
    [displayedItems.length]
  );

  const gridContextValue = useMemo(
    () => ({
      lastIndices,
      totalItems: displayedItems.length,
      reportItemCol,
    }),
    [lastIndices, displayedItems.length, reportItemCol]
  );

  const extraData = useMemo(
    () => ({
      isEditing,
      selectedCardIds,
      searchQuery,
      libraryState: state,
      lastIndices,
      totalItems: displayedItems.length,
    }),
    [isEditing, selectedCardIds, searchQuery, lastIndices, displayedItems.length, state]
  );

  const linkableItems = useMemo(() => {
    const linkedItems = new Map<string, LinkableItem>();
    if (state.status === 'ready') {
      for (const item of state.result.items) {
        if (isLinkableItem(item)) linkedItems.set(item.id, item);
      }
    }
    return linkedItems;
  }, [state]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LibraryItem>) => (
      <View style={styles.cardWrapper}>
        <ItemCard
          item={item}
          linkedItem={
            (item.type === 'note' || item.type === 'quote') && item.linkedItemId
              ? linkableItems.get(item.linkedItemId)
              : undefined
          }
          isEditing={isEditing}
          onNoteTextChange={(itemId, text) => {
            updateItem(itemId, { text } as Partial<LibraryItem>).catch((error) => {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Could not update note'
              );
            });
          }}
          isSelected={selectedCardIds.has(item.id)}
          onPress={handleCardPress}
          onLongPress={handleCardLongPress}
        />
      </View>
    ),
    [isEditing, selectedCardIds, handleCardPress, handleCardLongPress, linkableItems, updateItem]
  );

  const renderHeader = useCallback(() => {
    if (state.status !== 'ready') return null;
    const hasIssues = state.result.issues.length > 0;
    const hasDownloads = state.result.pendingDownloads > 0;

    return (
      <View className="pb-2">
        <TypeFilters selectedType={activeType} onSelect={handleTypeFilter} />
        {hasIssues && (
          <View className="mb-4 flex-row gap-2 rounded-xl bg-amber-950/60 p-3">
            <WarningIcon size={16} color="#fbbf24" weight="fill" />
            <Text className="flex-1 font-sans text-xs text-amber-200">
              {state.result.issues.length} file(s) skipped:{' '}
              {state.result.issues.map((i) => `${i.file} (${i.reason})`).join(', ')}
            </Text>
          </View>
        )}

        {hasDownloads && (
          <Text className="mb-4 font-sans text-xs text-zinc-500">
            {state.result.pendingDownloads} item(s) still downloading from iCloud…
          </Text>
        )}
      </View>
    );
  }, [state, activeType, handleTypeFilter]);

  const renderEmpty = useCallback(() => {
    if (hasActiveFilter) {
      const typeLabel = activeType ? CARD_TYPE_LABELS[activeType].toLowerCase() : null;
      const queryLabel = isSearching && !searchType ? searchQuery.trim() : null;
      return (
        <Centered
          title="No results found"
          message={
            typeLabel
              ? `No ${typeLabel}${queryLabel ? ` matching "${queryLabel}"` : ''}`
              : activeFolderKind
                ? `No cards in ${folderLabel ?? 'this folder'}${searchTag ? ` with tag #${searchTag}` : ''}${queryLabel ? ` matching "${queryLabel}"` : ''}`
                : searchTag
                  ? `No cards with tag #${searchTag}${queryLabel ? ` matching "${queryLabel}"` : ''}`
                  : `No cards matching "${queryLabel}"`
          }
        >
          <Pressable
            onPress={() => {
              setSearchQuery('');
              clearSearchTag();
              setSelectedType(null);
              clearFolderFilter();
            }}
            className="mt-6 rounded-full bg-zinc-800 px-5 py-2.5 active:opacity-80"
          >
            <Text className="font-sans-medium text-sm text-zinc-200">Clear filters</Text>
          </Pressable>
        </Centered>
      );
    }

    return (
      <Centered
        title="You can add anything here"
        message="This board is yours to save anything you want"
      >
        <Pressable
          onPress={() => router.push('/add')}
          className="mt-8 flex-row items-center justify-center gap-2 rounded-full bg-white px-5 py-3"
        >
          <PlusIcon size={18} color="#000000" />
          <Text className="font-sans-semibold text-base text-black">Add new item</Text>
        </Pressable>
      </Centered>
    );
  }, [
    hasActiveFilter,
    activeType,
    isSearching,
    searchType,
    searchQuery,
    searchTag,
    setSearchQuery,
    clearSearchTag,
    activeFolderKind,
    folderLabel,
    clearFolderFilter,
  ]);

  useFocusEffect(
    useCallback(() => {
      setSearchBarOverlay(
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          blurTarget={searchBlurTargetRef}
          bottomOffset={48 + insets.bottom}
          trailingAction={
            <Button
              accessibilityLabel="Add new item"
              variant="primary"
              shadowColor="#FFFFFF"
              shadowOpacity={0.24}
              icon={<PlusIcon size={24} color="#09090B" weight="bold" />}
              onPress={() => router.push('/add')}
            />
          }
          filters={[
            ...(activeFolderKind
              ? [
                  {
                    kind: 'folder' as const,
                    label: folderLabel ?? activeFolderKey ?? '',
                    status:
                      activeFolderKind === 'status'
                        ? (activeFolderKey as MediaProgressStatus)
                        : undefined,
                    onRemove: clearFolderFilter,
                  },
                ]
              : []),
            ...(searchTag
              ? [{ kind: 'tag' as const, label: searchTag, onRemove: clearSearchTag }]
              : []),
          ]}
          visible={state.status === 'ready' && !isEditing}
        />
      );

      return () => setSearchBarOverlay(null);
    }, [
      setSearchBarOverlay,
      searchQuery,
      handleSearchChange,
      insets.bottom,
      activeFolderKind,
      folderLabel,
      activeFolderKey,
      clearFolderFilter,
      searchTag,
      clearSearchTag,
      state.status,
      isEditing,
    ])
  );

  return (
    <View className="flex-1 bg-zinc-950">
      {state.status === 'loading' && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#a1a1aa" />
        </View>
      )}

      {state.status === 'error' && (
        <Centered title="Couldn't open the library" message={state.error}>
          <Pressable
            onPress={goBack}
            className="mt-6 rounded-full bg-zinc-800 px-5 py-2.5 active:opacity-80"
          >
            <Text className="font-sans-medium text-sm text-zinc-200">Choose another folder</Text>
          </Pressable>
        </Centered>
      )}

      {state.status === 'ready' && (
        <View className="flex-1">
          <View className="flex-1">
            <BlurTargetView ref={searchBlurTargetRef} style={{ flex: 1 }}>
              <BoardGridContext.Provider value={gridContextValue}>
                <FlashList<LibraryItem>
                  data={displayedItems}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  numColumns={2}
                  masonry
                  optimizeItemArrangement
                  extraData={extraData}
                  CellRendererComponent={CellRenderer}
                  contentContainerStyle={styles.contentContainer}
                  showsVerticalScrollIndicator={false}
                  keyboardDismissMode="on-drag"
                  keyboardShouldPersistTaps="handled"
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={refresh}
                      tintColor="#a1a1aa"
                    />
                  }
                  ListHeaderComponent={renderHeader}
                  ListEmptyComponent={renderEmpty}
                />
              </BoardGridContext.Provider>
            </BlurTargetView>
          </View>
        </View>
      )}

      <NewNoteModal
        visible={isNoteDrawerOpen}
        onClose={() => closeAddModal('note')}
        onDismiss={handleAddModalDismiss}
      />
      <NewLinkModal
        visible={isLinkModalOpen}
        onClose={() => closeAddModal('link')}
        onDismiss={handleAddModalDismiss}
      />
      <NewBookModal
        visible={isBookModalOpen}
        onClose={() => closeAddModal('book')}
        onDismiss={handleAddModalDismiss}
      />
      <NewMusicModal
        visible={isMusicModalOpen}
        onClose={() => closeAddModal('music')}
        onDismiss={handleAddModalDismiss}
      />
      <NewMovieModal
        visible={isMovieModalOpen}
        onClose={() => closeAddModal('movie')}
        onDismiss={handleAddModalDismiss}
      />
      <NewGameModal
        visible={isGameModalOpen}
        onClose={() => closeAddModal('game')}
        onDismiss={handleAddModalDismiss}
      />
      <NewImageModal
        visible={isImageModalOpen}
        imageAsset={pendingImage}
        onClose={() => closeAddModal('image')}
        onDismiss={handleAddModalDismiss}
      />
      <NewPdfModal
        visible={isPdfModalOpen}
        pdfAsset={pendingPdf}
        onClose={() => closeAddModal('pdf')}
        onDismiss={handleAddModalDismiss}
      />
      <NewVideoModal
        key={pendingVideo?.uri ?? 'empty-video'}
        visible={isVideoModalOpen}
        videoAsset={pendingVideo}
        onClose={() => closeAddModal('video')}
        onDismiss={handleAddModalDismiss}
      />

      <CardSelectionBar
        visible={isEditing}
        selectedCount={selectedCardIds.size}
        onDelete={handleDeleteSelected}
        onAddToFolder={() => setIsFolderPickerOpen(true)}
        onCancel={handleCancelEdition}
      />

      <AddToFolderModal
        visible={isFolderPickerOpen}
        items={selectedItems}
        onClose={() => setIsFolderPickerOpen(false)}
        onAdded={handleCancelEdition}
      />

      <RestoreToast
        visible={isToastVisible && !isEditing}
        count={restoreBackup?.length ?? 0}
        onRestore={handleRestore}
        onDismiss={handleDismissToast}
      />
    </View>
  );
}

function TypeFilters({
  selectedType,
  onSelect,
}: {
  selectedType: LibraryItemType | null;
  onSelect: (type: LibraryItemType) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="items-center gap-2 px-3 py-2.5"
      keyboardShouldPersistTaps="always"
      accessibilityLabel="Filter cards by type"
    >
      {ITEM_TYPES.map((type) => {
        const Icon = CARD_TYPE_ICONS[type];
        return (
          <TypeFilterButton
            key={type}
            label={CARD_TYPE_LABELS[type]}
            icon={Icon}
            selected={selectedType === type}
            onPress={() => onSelect(type)}
          />
        );
      })}
    </ScrollView>
  );
}

function TypeFilterButton({
  label,
  icon: Icon,
  selected,
  onPress,
}: {
  label: string;
  icon: typeof NotePencilIcon;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2 ${selected ? 'border-white bg-white' : 'border-zinc-700'}`}
    >
      <Icon size={16} color={selected ? '#000000' : '#a1a1aa'} weight="regular" />
      <Text className={`font-sans-medium text-sm ${selected ? 'text-black' : 'text-zinc-300'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

type CellRendererProps = {
  style?: {
    left?: number;
    [key: string]: any;
  };
  children?: React.ReactNode;
  index?: number;
  [key: string]: any;
};

const CellRenderer = forwardRef<View, CellRendererProps>((props, ref) => {
  const { style, children, index, ...rest } = props;
  const { reportItemCol } = useContext(BoardGridContext);
  const isLeftColumn = !style?.left || style.left < 1;

  useEffect(() => {
    if (typeof index === 'number') {
      reportItemCol(index, isLeftColumn ? 0 : 1);
    }
  }, [index, isLeftColumn, reportItemCol]);

  return (
    <View ref={ref} {...rest} style={[style]}>
      {children}
    </View>
  );
});

CellRenderer.displayName = 'CellRenderer';

function Centered({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="font-sans-medium text-lg text-zinc-100">{title}</Text>
      <Text className="mt-2 text-center font-sans text-base text-zinc-500">{message}</Text>
      {children}
    </View>
  );
}

function keyExtractor(item: LibraryItem): string {
  return item.id;
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 4,
    paddingTop: 64,
    paddingBottom: 200,
    flexGrow: 1,
  },
  cardWrapper: {
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
});
