import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FolderTile } from '@/components/organize/FolderTile';
import { useLibrary } from '@/hooks/useLibrary';
import { getTagGroups, matchesStatus, STATUS_FOLDERS } from '@/lib/library/organize';
import { getSourceId } from '@/lib/library/storage';
import { CircleNotchIcon, TagIcon } from 'phosphor-react-native';

export default function OrganizeScreen() {
  const { source, state, setSearchQuery } = useLibrary();
  const storageKey = `anything:highlightedTags:${getSourceId(source)}`;
  const [saved, setSaved] = useState<{ key: string; tags: string[] } | null>(null);
  const items = useMemo(() => (state.status === 'ready' ? state.result.items : []), [state]);
  const tagGroups = useMemo(() => getTagGroups(items), [items]);
  const highlighted = saved?.key === storageKey ? saved.tags : [];

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (active) setSaved({ key: storageKey, tags: value ? JSON.parse(value) : [] });
      })
      .catch(() => {
        if (active) setSaved({ key: storageKey, tags: [] });
      });
    return () => {
      active = false;
    };
  }, [storageKey]);

  const toggleHighlight = (tag: string) => {
    const next = highlighted.includes(tag)
      ? highlighted.filter((value) => value !== tag)
      : [...highlighted, tag];
    setSaved({ key: storageKey, tags: next });
    AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
  };

  const openFolder = (kind: 'status' | 'tag', key: string) => {
    setSearchQuery('');
    router.navigate({ pathname: '/board', params: { folderKind: kind, folderKey: key } });
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

  const highlightedGroups = highlighted
    .map((tag) => tagGroups.find((group) => group.tag === tag))
    .filter((group): group is (typeof tagGroups)[number] => Boolean(group));
  const visibleGroups = [
    ...highlightedGroups,
    ...tagGroups.filter((group) => group.items.length >= 3 && !highlighted.includes(group.tag)),
  ];

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="pb-12" showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View className="py-6 border-b border-zinc-800 gap-6">
          <View className="items-center gap-3">
            <View className="flex-row items-center gap-2 px-6 justify-center">
              <CircleNotchIcon size={16} color="#E4E4E7" />
              <Text className="font-sans-semibold text-base tracking-wider uppercase text-zinc-200">
                By Status
              </Text>
            </View>

            <Text className="text-center text-zinc-400 text-xs max-w-64 leading-relaxed">
              Books, movies, games, videos and articles by status
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="flex-row gap-4 px-4"
          >
            {STATUS_FOLDERS.map((folder) => (
              <FolderTile
                key={folder.key}
                title={folder.title}
                horizontal
                items={items.filter((item) => matchesStatus(item, folder.key))}
                onPress={() => openFolder('status', folder.key)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Tags Section */}
        <View className="py-8 px-6 gap-6">
          <View className="items-center gap-3">
            <View className="flex-row items-center gap-2 justify-center">
              <TagIcon size={16} color="#E4E4E7" />
              <Text className="font-sans-semibold text-base tracking-wider uppercase text-zinc-200">
                Your Tags
              </Text>
            </View>

            <Text className="text-center text-zinc-400 text-xs max-w-64 leading-relaxed">
              Tags with at least 3 cards. You can highlight your favorite tags.
            </Text>
          </View>

          {visibleGroups.length ? (
            <View className="flex-row flex-wrap">
              {visibleGroups.map((group) => (
                <FolderTile
                  key={group.tag}
                  title={group.tag}
                  items={group.items}
                  highlighted={highlighted.includes(group.tag)}
                  onToggleHighlight={() => toggleHighlight(group.tag)}
                  onPress={() => openFolder('tag', group.tag)}
                />
              ))}
            </View>
          ) : (
            <Text className="font-sans text-zinc-500">
              Tags will appear here once they have 3 cards.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
