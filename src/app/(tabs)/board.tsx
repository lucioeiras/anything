import { router, useLocalSearchParams } from 'expo-router';
import { PlusIcon, WarningIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { CardSelectionBar } from '@/components/CardSelectionBar';
import { ItemCard } from '@/components/ItemCard';
import { MasonryColumns } from '@/components/MasonryColumns';
import { NewImageModal } from '@/components/NewImageModal';
import { NewLinkModal } from '@/components/NewLinkModal';
import { NewNoteModal } from '@/components/NewNoteModal';
import { ProgressiveBlur } from '@/components/ProgressiveBlur';
import { RestoreToast } from '@/components/RestoreToast';
import { useLibrary } from '@/hooks/useLibrary';
import type { DeletedItemBackup, PickedImageAsset } from '@/lib/library/storage';
import type { LibraryItem } from '@/lib/library/types';

export default function BoardScreen() {
  const { state, refresh, refreshing, deleteItems, restoreItems } = useLibrary();
  const { newNote, newLink, newImageUri, newImageFileName, newImageMimeType, newImageTimestamp } =
    useLocalSearchParams<{
      newNote?: string;
      newLink?: string;
      newImageUri?: string;
      newImageFileName?: string;
      newImageMimeType?: string;
      newImageTimestamp?: string;
    }>();
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<PickedImageAsset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [restoreBackup, setRestoreBackup] = useState<DeletedItemBackup[] | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const lastOpenedNoteRef = useRef<string | null>(null);
  const lastOpenedLinkRef = useRef<string | null>(null);
  const lastOpenedImageRef = useRef<string | null>(null);

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

  const toggleCardSelection = (itemId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleCardLongPress = (item: LibraryItem) => {
    if (!isEditing) {
      setIsEditing(true);
      setSelectedCardIds(new Set([item.id]));
    } else {
      toggleCardSelection(item.id);
    }
  };

  const handleCardPress = (item: LibraryItem) => {
    if (isEditing) {
      toggleCardSelection(item.id);
    }
  };

  const handleCancelEdition = () => {
    setIsEditing(false);
    setSelectedCardIds(new Set());
  };

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
        <>
          <ScrollView
            contentContainerClassName="px-3 pb-48 grow pt-20"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a1a1aa" />
            }
          >
            {state.result.issues.length > 0 && (
              <View className="mb-4 flex-row gap-2 rounded-xl bg-amber-950/60 p-3">
                <WarningIcon size={16} color="#fbbf24" weight="fill" />
                <Text className="flex-1 font-sans text-xs text-amber-200">
                  {state.result.issues.length} file(s) skipped:{' '}
                  {state.result.issues.map((i) => `${i.file} (${i.reason})`).join(', ')}
                </Text>
              </View>
            )}

            {state.result.pendingDownloads > 0 && (
              <Text className="mb-4 font-sans text-xs text-zinc-500">
                {state.result.pendingDownloads} item(s) still downloading from iCloud…
              </Text>
            )}

            {state.result.items.length === 0 ? (
              <Centered
                title="You can add anything here"
                message="This board is yours to save anything you want"
              >
                <Pressable
                  onPress={() => router.push('/add')}
                  className="px-5 py-3 flex-row items-center justify-center gap-2 bg-white rounded-full mt-8"
                >
                  <PlusIcon size={18} color="#000000" />
                  <Text className="font-sans-semibold text-base text-black">Add new item</Text>
                </Pressable>
              </Centered>
            ) : (
              <MasonryColumns
                data={state.result.items}
                keyExtractor={(item) => item.id}
                estimateHeight={estimateHeight}
                renderItem={(item) => (
                  <ItemCard
                    item={item}
                    isEditing={isEditing}
                    isSelected={selectedCardIds.has(item.id)}
                    onPress={handleCardPress}
                    onLongPress={handleCardLongPress}
                  />
                )}
              />
            )}
          </ScrollView>

          {state.result.items.length > 0 && <ProgressiveBlur />}
        </>
      )}

      <NewNoteModal visible={isNoteDrawerOpen} onClose={() => setIsNoteDrawerOpen(false)} />
      <NewLinkModal visible={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} />
      <NewImageModal
        visible={isImageModalOpen}
        imageAsset={pendingImage}
        onClose={() => {
          setIsImageModalOpen(false);
          setPendingImage(null);
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

function estimateHeight(item: LibraryItem): number {
  switch (item.type) {
    case 'link':
      return 1.5;
    case 'note':
    case 'quote':
      return 2;
    default:
      return 3;
  }
}
