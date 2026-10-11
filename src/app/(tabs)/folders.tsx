import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FolderTile } from '@/components/organize/FolderTile';
import { useLibrary } from '@/hooks/useLibrary';
import { getTagGroups, matchesStatus, STATUS_FOLDERS } from '@/lib/library/organize';
import { getSourceId } from '@/lib/library/storage';
import { FolderPlusIcon } from 'phosphor-react-native';

type SavedFolders = { key: string; names: string[] };

export default function OrganizeScreen() {
  const { source, state, setSearchQuery } = useLibrary();
  const storageKey = `anything:folders:${getSourceId(source)}`;
  const [saved, setSaved] = useState<SavedFolders | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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

  const closeCreate = () => {
    if (isSaving) return;
    setIsCreateOpen(false);
    setFolderName('');
  };

  const createFolder = async () => {
    const name = folderName.trim();
    if (!name || isSaving || saved?.key !== storageKey) return;
    if (
      [...folderNames, ...STATUS_FOLDERS.map((folder) => folder.title)].some(
        (existing) => existing.toLocaleLowerCase() === name.toLocaleLowerCase()
      )
    ) {
      Alert.alert('Folder already exists', 'Choose a different name.');
      return;
    }

    setIsSaving(true);
    const next = [...folderNames, name];
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      setSaved({ key: storageKey, names: next });
      setIsCreateOpen(false);
      setFolderName('');
    } catch {
      Alert.alert('Could not create folder', 'Please try again.');
    } finally {
      setIsSaving(false);
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

      <Modal visible={isCreateOpen} transparent animationType="fade" onRequestClose={closeCreate}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/70"
        >
          <View className="rounded-t-3xl border-t border-zinc-800 bg-zinc-900 px-6 pb-10 pt-7">
            <Text className="font-sans-semibold text-xl text-zinc-50">New folder</Text>
            <Text className="mt-2 font-sans text-sm text-zinc-400">
              Add the folder name as a tag to any card to place it here.
            </Text>
            <TextInput
              autoFocus
              value={folderName}
              onChangeText={setFolderName}
              onSubmitEditing={createFolder}
              returnKeyType="done"
              maxLength={40}
              placeholder="Folder name"
              placeholderTextColor="#71717a"
              accessibilityLabel="Folder name"
              className="mt-6 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-sans text-base text-zinc-50"
            />
            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={closeCreate}
                disabled={isSaving}
                accessibilityRole="button"
                className="flex-1 items-center rounded-xl bg-zinc-800 py-3"
              >
                <Text className="font-sans-semibold text-zinc-200">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={createFolder}
                disabled={!folderName.trim() || isSaving}
                accessibilityRole="button"
                accessibilityState={{ disabled: !folderName.trim() || isSaving }}
                className={`flex-1 items-center rounded-xl py-3 ${folderName.trim() && !isSaving ? 'bg-zinc-50' : 'bg-zinc-700'}`}
              >
                <Text className="font-sans-semibold text-zinc-950">Create</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
