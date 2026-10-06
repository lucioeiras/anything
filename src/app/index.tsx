import { router } from 'expo-router';
import {
  CaretRightIcon,
  CloudIcon,
  DeviceMobileIcon,
  FolderPlusIcon,
  TrashSimpleIcon,
} from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLibrary } from '@/hooks/useLibrary';
import type { LibrarySource, SavedFolder } from '@/lib/library/storage';

export default function FolderSelectScreen() {
  const {
    source,
    selectFolder,
    pickAndOpenFolder,
    recentFolders,
    removeRecentFolder,
    isInitialized,
    shouldAutoOpenBoard,
    consumeAutoOpen,
  } = useLibrary();

  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (isInitialized && shouldAutoOpenBoard) {
      consumeAutoOpen();
      router.replace('/board');
    }
  }, [isInitialized, shouldAutoOpenBoard, consumeAutoOpen]);

  if (!isInitialized || shouldAutoOpenBoard) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator color="#71717a" />
      </View>
    );
  }

  const handlePickFolder = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const selected = await pickAndOpenFolder();
      if (selected) {
        router.push('/board');
      }
    } catch (e) {
      Alert.alert('Error opening folder', e instanceof Error ? e.message : String(e));
    } finally {
      setOpening(false);
    }
  };

  const handleSelectFolder = async (targetSource: LibrarySource) => {
    if (opening) return;
    setOpening(true);
    try {
      await selectFolder(targetSource);
      router.push('/board');
    } catch (e) {
      Alert.alert('Error opening folder', e instanceof Error ? e.message : String(e));
    } finally {
      setOpening(false);
    }
  };

  const handleRemoveFolder = (folder: SavedFolder) => {
    Alert.alert(
      'Remove folder',
      `Remove "${folder.name}" from recent folders? Your actual files will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeRecentFolder(folder.id),
        },
      ]
    );
  };

  const isCurrentSource = (target: LibrarySource) => {
    if (target.kind === 'local' && source.kind === 'local') return true;
    if (target.kind === 'folder' && source.kind === 'folder' && target.uri === source.uri)
      return true;
    return false;
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerClassName="h-full p-8 items-center justify-center"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-sans-medium text-4xl text-white text-center">
          Welcome to{' '}
          <Text className="font-serif-italic text-4xl text-blue-500 text-center"> anything</Text>
        </Text>
        <Text className="font-sans text-lg text-zinc-300 mt-3 text-center">
          Open your space folder or create a new one.
        </Text>
        <Text className="font-sans text-base text-zinc-400 mt-3 text-center max-w-80">
          Anything is offline-first and believes files should remain under your control.
        </Text>

        <Pressable
          onPress={handlePickFolder}
          disabled={opening}
          className="w-full max-w-80 py-3 flex-row items-center justify-center gap-2 bg-white rounded-full mt-8"
        >
          {opening ? (
            <ActivityIndicator size={20} color="#000" />
          ) : (
            <FolderPlusIcon size={20} color="#000" />
          )}
          <Text className="font-sans-semibold text-lg text-zinc-950">Select a folder</Text>
        </Pressable>

        {/* Section: Saved / Recent Folders */}
        <View className="mt-12 w-full">
          <Text className="font-sans-semibold text-xs uppercase tracking-wider text-zinc-500 mb-3 px-1">
            Libraries & Recents
          </Text>

          <View className="gap-2.5">
            {recentFolders.map((item) => {
              const isLocal = item.source.kind === 'local';
              const isActive = isCurrentSource(item.source);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectFolder(item.source)}
                  disabled={opening}
                  className="flex-row items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/90 p-4 active:bg-zinc-850"
                >
                  <View className="flex-1 flex-row items-center gap-3.5 mr-2">
                    <View className="h-11 w-11 items-center justify-center rounded-xl bg-zinc-800/70">
                      {isLocal ? (
                        <DeviceMobileIcon size={22} color="#a1a1aa" weight="duotone" />
                      ) : (
                        <CloudIcon size={22} color="#a1a1aa" weight="duotone" />
                      )}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="font-sans-semibold text-base text-zinc-100"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        {isActive && (
                          <View className="rounded-full bg-zinc-800 px-2 py-0.5">
                            <Text className="font-sans-medium text-[10px] text-zinc-300">
                              Last opened
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="mt-0.5 font-sans text-xs text-zinc-400">
                        {isLocal ? 'This Device • Library' : 'iCloud Drive / Files'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    {!isLocal && (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveFolder(item);
                        }}
                        hitSlop={10}
                        className="p-2 rounded-lg active:opacity-60"
                        accessibilityLabel="Remove from recent folders"
                      >
                        <TrashSimpleIcon size={18} color="#71717a" />
                      </Pressable>
                    )}
                    <CaretRightIcon size={18} color="#71717a" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
