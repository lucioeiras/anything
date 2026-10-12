import { PlusIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';
import { NewFolderModal } from '@/components/modals/NewFolderModal';
import { FolderTile } from '@/components/organize/FolderTile';
import { useLibrary } from '@/hooks/useLibrary';
import { getTagGroups, STATUS_FOLDERS } from '@/lib/library/organize';
import { getLibraryFolders, getSourceId, saveLibraryFolders } from '@/lib/library/storage';
import type { LibraryItem } from '@/lib/library/types';

type Props = {
  visible: boolean;
  items: LibraryItem[];
  onClose: () => void;
  onAdded?: (updatedItems: LibraryItem[]) => void;
};

export function AddToFolderModal({ visible, items, onClose, onAdded }: Props) {
  const { source, state, updateItem } = useLibrary();
  const insets = useSafeAreaInsets();
  const storageKey = `anything:folders:${getSourceId(source)}`;
  const [saved, setSaved] = useState<{ key: string; names: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const folderNames = saved?.key === storageKey ? saved.names : null;
  const libraryItems = useMemo(() => (state.status === 'ready' ? state.result.items : []), [state]);
  const itemsByTag = useMemo(
    () => new Map(getTagGroups(libraryItems).map((group) => [group.tag, group.items])),
    [libraryItems]
  );

  useEffect(() => {
    if (!visible) return;
    let active = true;
    getLibraryFolders(source)
      .then((names) => {
        if (!active) return;
        setSaved({
          key: storageKey,
          names,
        });
      })
      .catch(() => {
        if (active) {
          setSaved({ key: storageKey, names: [] });
          Alert.alert('Could not load folders', 'Please try again.');
        }
      });
    return () => {
      active = false;
    };
  }, [visible, source, storageKey]);

  const addToFolder = async (name: string) => {
    if (saving || items.length === 0) return;
    setSaving(true);
    const updatedItems: LibraryItem[] = [];
    try {
      for (const item of items) {
        if (item.tags?.some((tag) => tag.trim() === name)) continue;
        updatedItems.push(await updateItem(item.id, { tags: [...(item.tags ?? []), name] }));
      }
      onAdded?.(updatedItems);
      onClose();
    } catch (error) {
      Alert.alert(
        'Could not add all cards',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const createFolder = async (name: string): Promise<boolean> => {
    if (folderNames === null) return false;
    if (
      [...folderNames, ...STATUS_FOLDERS.map((folder) => folder.title)].some(
        (existing) => existing.toLocaleLowerCase() === name.toLocaleLowerCase()
      )
    ) {
      Alert.alert('Folder already exists', 'Choose a different name.');
      return false;
    }

    const next = [...folderNames, name];
    try {
      await saveLibraryFolders(source, next);
      setSaved({ key: storageKey, names: next });
      return true;
    } catch {
      Alert.alert('Could not create folder', 'Please try again.');
      return false;
    }
  };

  const confirmDeleteFolder = (name: string) => {
    if (saving || folderNames === null) return;
    Alert.alert('Delete folder?', `“${name}” will be removed from your folders and cards.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (saving || folderNames === null) return;
          const next = folderNames.filter((folderName) => folderName !== name);
          try {
            const taggedItems = libraryItems.filter((item) =>
              item.tags?.some((tag) => tag.trim() === name)
            );
            for (const item of taggedItems) {
              await updateItem(item.id, {
                tags: item.tags?.filter((tag) => tag.trim() !== name) ?? [],
              });
            }
            await saveLibraryFolders(source, next);
            setSaved({ key: storageKey, names: next });
          } catch {
            Alert.alert('Could not delete folder', 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-zinc-950" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-6 pb-12 pt-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-2 px-2 pb-8">
            <Text className="font-sans-semibold text-2xl text-white text-center">
              Add to folder
            </Text>
            <Text className="font-sans text-base text-zinc-400 text-center">
              {items.length} {items.length === 1 ? 'card' : 'cards'} selected
            </Text>
          </View>

          <View className="flex-row flex-wrap">
            {folderNames?.map((name) => {
              const alreadyAdded =
                items.length > 0 &&
                items.every((item) => item.tags?.some((tag) => tag.trim() === name));
              return (
                <FolderTile
                  key={`tag:${name}`}
                  title={name}
                  items={itemsByTag.get(name) ?? []}
                  disabled={items.length === 0 || alreadyAdded || saving}
                  onPress={() => addToFolder(name)}
                  onLongPress={() => confirmDeleteFolder(name)}
                />
              );
            })}
          </View>
          {folderNames === null && <ActivityIndicator className="py-6" color="#A1A1AA" />}
          {folderNames?.length === 0 && (
            <View className="flex-1 items-center justify-center px-8 py-12">
              <Text className="font-sans-medium text-lg text-zinc-100">No folders yet</Text>
              <Text className="mt-2 text-center font-sans text-base text-zinc-500">
                Create a folder to organize these cards.
              </Text>
            </View>
          )}
        </ScrollView>

        <ActionFooter bottomInset={insets.bottom}>
          <Button
            accessibilityLabel="Cancel"
            onPress={handleClose}
            disabled={saving}
            icon={
              saving ? (
                <ActivityIndicator size={20} color="#A1A1AA" />
              ) : (
                <XIcon size={20} color="#FFFFFF" weight="bold" />
              )
            }
            text="Cancel"
          />
          <Button
            accessibilityLabel="Create folder"
            variant="primary"
            onPress={() => setIsCreateOpen(true)}
            disabled={saving}
            icon={<PlusIcon size={20} color="#C4B5FD" weight="bold" />}
            text="New Folder"
          />
        </ActionFooter>
      </View>
      <NewFolderModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={createFolder}
      />
    </Modal>
  );
}
