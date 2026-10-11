import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { FolderPlusIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NewFolderModal } from '@/components/modals/NewFolderModal';
import { FolderTile } from '@/components/organize/FolderTile';
import { useLibrary } from '@/hooks/useLibrary';
import { getTagGroups, matchesStatus, STATUS_FOLDERS } from '@/lib/library/organize';
import { getSourceId } from '@/lib/library/storage';

type SavedFolders = { key: string; names: string[] };

export default function OrganizeScreen() {
  const { source, state, setSearchQuery } = useLibrary();
  const storageKey = `anything:folders:${getSourceId(source)}`;
  const [saved, setSaved] = useState<SavedFolders | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const items = useMemo(() => (state.status === 'ready' ? state.result.items : []), [state]);
  const tagGroups = useMemo(() => getTagGroups(items), [items]);
  const itemsByTag = useMemo(
    () => new Map(tagGroups.map((group) => [group.tag, group.items])),
    [tagGroups]
  );
  const folderNames = saved?.key === storageKey ? saved.names : [];

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (!active) return;
        const parsed: unknown = value ? JSON.parse(value) : [];
        setSaved({
          key: storageKey,
          names: Array.isArray(parsed)
            ? parsed.filter((name): name is string => typeof name === 'string')
            : [],
        });
      })
      .catch(() => {
        if (active) setSaved({ key: storageKey, names: [] });
      });
    return () => {
      active = false;
    };
  }, [storageKey]);

  const openFolder = (kind: 'status' | 'tag', key: string) => {
    setSearchQuery('');
    router.navigate({ pathname: '/board', params: { folderKind: kind, folderKey: key } });
  };

  const createFolder = async (name: string): Promise<boolean> => {
    if (saved?.key !== storageKey) return false;
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
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      setSaved({ key: storageKey, names: next });
      return true;
    } catch {
      Alert.alert('Could not create folder', 'Please try again.');
      return false;
    }
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
            />
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => setIsCreateOpen(true)}
        disabled={saved?.key !== storageKey}
        accessibilityRole="button"
        accessibilityLabel="Create folder"
        className="flex-row items-center justify-center gap-4 px-3 py-6 bg-blue-950/20 active:opacity-80 border-t border-zinc-800"
      >
        <FolderPlusIcon size={18} color="#3B82F6" weight="bold" />
        <Text className="font-sans-semibold text-lg text-blue-500">New Folder</Text>
      </Pressable>

      <NewFolderModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={createFolder}
      />
    </SafeAreaView>
  );
}
