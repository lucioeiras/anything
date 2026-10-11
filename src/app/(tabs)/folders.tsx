import { router } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NewFolderModal } from '@/components/modals/NewFolderModal';
import { FolderTile } from '@/components/organize/FolderTile';
import { useLibrary } from '@/hooks/useLibrary';
import { getTagGroups, matchesStatus, STATUS_FOLDERS } from '@/lib/library/organize';
import { getLibraryFolders, getSourceId, saveLibraryFolders } from '@/lib/library/storage';

export default function OrganizeScreen() {
  const { source, state, setSearchQuery, clearSearchTag, updateItem } = useLibrary();
  const [saved, setSaved] = useState<{ source: string; names: string[] } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const items = useMemo(() => (state.status === 'ready' ? state.result.items : []), [state]);
  const tagGroups = useMemo(() => getTagGroups(items), [items]);
  const itemsByTag = useMemo(
    () => new Map(tagGroups.map((group) => [group.tag, group.items])),
    [tagGroups]
  );
  const sourceId = getSourceId(source);
  const folderNames = saved?.source === sourceId ? saved.names : [];

  useEffect(() => {
    let active = true;
    getLibraryFolders(source)
      .then((names) => {
        if (!active) return;
        setSaved({ source: sourceId, names });
      })
      .catch(() => {
        if (active) {
          setSaved({ source: sourceId, names: [] });
          Alert.alert('Could not load folders', 'Please try again.');
        }
      });
    return () => {
      active = false;
    };
  }, [source, sourceId]);

  const openFolder = (kind: 'status' | 'tag', key: string) => {
    setSearchQuery('');
    clearSearchTag();
    router.navigate({ pathname: '/board', params: { folderKind: kind, folderKey: key } });
  };

  const createFolder = async (name: string): Promise<boolean> => {
    if (saved?.source !== sourceId) return false;
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
      setSaved({ source: sourceId, names: next });
      return true;
    } catch {
      Alert.alert('Could not create folder', 'Please try again.');
      return false;
    }
  };

  const confirmDeleteFolder = (name: string) => {
    Alert.alert('Delete folder?', `“${name}” will be removed from your folders.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (saved?.source !== sourceId) return;
          const next = folderNames.filter((folderName) => folderName !== name);
          try {
            const taggedItems = items.filter((item) =>
              item.tags?.some((tag) => tag.trim() === name)
            );
            for (const item of taggedItems) {
              await updateItem(item.id, {
                tags: item.tags?.filter((tag) => tag.trim() !== name) ?? [],
              });
            }
            await saveLibraryFolders(source, next);
            setSaved({ source: sourceId, names: next });
          } catch {
            Alert.alert('Could not delete folder', 'Please try again.');
          }
        },
      },
    ]);
  };

  if (state.status === 'loading')
    return (
      <View className="flex-1 justify-center bg-zinc-950">
        <ActivityIndicator color="#a1a1aa" />
      </View>
    );
  if (state.status === 'error')
    return (
      <View className="flex-1 justify-center bg-zinc-950 p-6">
        <Text className="text-center text-zinc-50">{state.error}</Text>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="px-6 pb-12 pt-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap">
          {STATUS_FOLDERS.map((folder) => (
            <FolderTile
              key={`status:${folder.key}`}
              title={folder.title}
              status={folder.key}
              items={items.filter((item) => matchesStatus(item, folder.key))}
              onPress={() => openFolder('status', folder.key)}
            />
          ))}
          {folderNames.map((name) => (
            <FolderTile
              key={`tag:${name}`}
              title={name}
              items={itemsByTag.get(name) ?? []}
              onPress={() => openFolder('tag', name)}
              onLongPress={() => confirmDeleteFolder(name)}
            />
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => setIsCreateOpen(true)}
        disabled={saved?.source !== sourceId}
        accessibilityRole="button"
        accessibilityLabel="Create folder"
        className="flex-row items-center justify-center gap-4 px-3 py-6 bg-violet-950/20 active:opacity-80 border-t border-zinc-800"
      >
        <PlusIcon size={18} color="#C4B5FD" weight="bold" />
        <Text className="font-sans-semibold text-lg text-violet-300">New Folder</Text>
      </Pressable>

      <NewFolderModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={createFolder}
      />
    </SafeAreaView>
  );
}
