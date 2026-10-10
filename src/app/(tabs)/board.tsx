import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { PlusIcon, WarningIcon } from 'phosphor-react-native';
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
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ItemCard } from '@/components/cards/ItemCard';
import { CardSelectionBar } from '@/components/menus/CardSelectionBar';
import { RestoreToast } from '@/components/menus/RestoreToast';
import { SearchBar } from '@/components/menus/SearchBar';
import { NewBookModal } from '@/components/modals/NewBookModal';
import { NewGameModal } from '@/components/modals/NewGameModal';
import { NewImageModal } from '@/components/modals/NewImageModal';
import { NewLinkModal } from '@/components/modals/NewLinkModal';
import { NewMovieModal } from '@/components/modals/NewMovieModal';
import { NewMusicModal } from '@/components/modals/NewMusicModal';
import { NewNoteModal } from '@/components/modals/NewNoteModal';
import { NewPdfModal } from '@/components/modals/NewPdfModal';
import { useLibrary } from '@/hooks/useLibrary';
import type { DeletedItemBackup, PickedImageAsset, PickedPdfAsset } from '@/lib/library/storage';
import { isLinkableItem, type LinkableItem } from '@/lib/library/links';
import type { LibraryItem } from '@/lib/library/types';

type BoardGridContextType = {
  lastIndices: { col0: number; col1: number };
  totalItems: number;
  reportItemCol: (index: number, col: number) => void;
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
    setSearchQuery,
  } = useLibrary();
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
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [restoreBackup, setRestoreBackup] = useState<DeletedItemBackup[] | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
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

  useEffect(() => {
    if (newNote && newNote !== lastOpenedNoteRef.current) {
      lastOpenedNoteRef.current = newNote;
      setIsNoteDrawerOpen(true);
    }
  }, [newNote]);

  useEffect(() => {
    if (newLink && newLink !== lastOpenedLinkRef.current) {
      lastOpenedLinkRef.current = newLink;
      setIsLinkModalOpen(true);
    }
  }, [newLink]);

  useEffect(() => {
    if (newBook && newBook !== lastOpenedBookRef.current) {
      lastOpenedBookRef.current = newBook;
      setIsBookModalOpen(true);
    }
  }, [newBook]);

  useEffect(() => {
    if (newMusic && newMusic !== lastOpenedMusicRef.current) {
      lastOpenedMusicRef.current = newMusic;
      setIsMusicModalOpen(true);
    }
  }, [newMusic]);

  useEffect(() => {
    if (newMovie && newMovie !== lastOpenedMovieRef.current) {
      lastOpenedMovieRef.current = newMovie;
      setIsMovieModalOpen(true);
    }
  }, [newMovie]);

  useEffect(() => {
    if (newGame && newGame !== lastOpenedGameRef.current) {
      lastOpenedGameRef.current = newGame;
      setIsGameModalOpen(true);
    }
  }, [newGame]);

  useEffect(() => {
    const pdfToken = newPdfTimestamp || newPdfUri;
    if (newPdfUri && pdfToken && pdfToken !== lastOpenedPdfRef.current) {
      lastOpenedPdfRef.current = pdfToken;
      setPendingPdf({
        uri: newPdfUri,
        fileName: newPdfFileName,
      });
      setIsPdfModalOpen(true);
    }
  }, [newPdfUri, newPdfFileName, newPdfTimestamp]);

  useEffect(() => {
    const imageToken = newImageTimestamp || newImageUri;
    if (newImageUri && imageToken && imageToken !== lastOpenedImageRef.current) {
      lastOpenedImageRef.current = imageToken;
      setPendingImage({
        uri: newImageUri,
        fileName: newImageFileName,
        mimeType: newImageMimeType,
      });
      setIsImageModalOpen(true);
    }
  }, [newImageUri, newImageFileName, newImageMimeType, newImageTimestamp]);

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

  const displayedItems = useMemo(() => {
    if (state.status !== 'ready') return [];
    if (!isSearching) return state.result.items;
    return searchItems({ searchQuery });
  }, [state, isSearching, searchQuery, searchItems]);

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
          isSelected={selectedCardIds.has(item.id)}
          onPress={handleCardPress}
          onLongPress={handleCardLongPress}
        />
      </View>
    ),
    [isEditing, selectedCardIds, handleCardPress, handleCardLongPress, linkableItems]
  );

  const renderHeader = useCallback(() => {
    if (state.status !== 'ready') return null;
    const hasIssues = state.result.issues.length > 0;
    const hasDownloads = state.result.pendingDownloads > 0;
    if (!hasIssues && !hasDownloads) return null;

    return (
      <View style={styles.headerWrapper}>
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
  }, [state]);

  const renderEmpty = useCallback(() => {
    if (isSearching) {
      return (
        <Centered title="No results found" message={`No cards matching "${searchQuery.trim()}"`}>
          <Pressable
            onPress={() => setSearchQuery('')}
            className="mt-6 rounded-full bg-zinc-800 px-5 py-2.5 active:opacity-80"
          >
            <Text className="font-sans-medium text-sm text-zinc-200">Clear search</Text>
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
  }, [isSearching, searchQuery, setSearchQuery]);

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
                  <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a1a1aa" />
                }
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
              />
            </BoardGridContext.Provider>
          </View>

          <SearchBar value={searchQuery} onChangeText={setSearchQuery} visible={!isEditing} />
        </View>
      )}

      <NewNoteModal visible={isNoteDrawerOpen} onClose={() => setIsNoteDrawerOpen(false)} />
      <NewLinkModal visible={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} />
      <NewBookModal visible={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
      <NewMusicModal visible={isMusicModalOpen} onClose={() => setIsMusicModalOpen(false)} />
      <NewMovieModal visible={isMovieModalOpen} onClose={() => setIsMovieModalOpen(false)} />
      <NewGameModal visible={isGameModalOpen} onClose={() => setIsGameModalOpen(false)} />
      <NewImageModal
        visible={isImageModalOpen}
        imageAsset={pendingImage}
        onClose={() => {
          setIsImageModalOpen(false);
          setPendingImage(null);
        }}
      />
      <NewPdfModal
        visible={isPdfModalOpen}
        pdfAsset={pendingPdf}
        onClose={() => {
          setIsPdfModalOpen(false);
          setPendingPdf(null);
        }}
      />

      <CardSelectionBar
        visible={isEditing}
        selectedCount={selectedCardIds.size}
        onDelete={handleDeleteSelected}
        onCancel={handleCancelEdition}
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
    paddingBottom: 0,
    flexGrow: 1,
  },
  cardWrapper: {
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  headerWrapper: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});
