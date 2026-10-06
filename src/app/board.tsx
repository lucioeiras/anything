import { router } from 'expo-router';
import { FoldersIcon, WarningIcon } from 'phosphor-react-native';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { ItemCard } from '@/components/ItemCard';
import { MasonryColumns } from '@/components/MasonryColumns';
import { ProgressiveBlur } from '@/components/ProgressiveBlur';
import { useLibrary } from '@/hooks/useLibrary';
import type { LibraryItem } from '@/lib/library/types';

export default function BoardScreen() {
  const { state, refresh, refreshing } = useLibrary();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
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
            contentContainerClassName="px-3 pb-16 grow pt-16"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a1a1aa" />
            }
          >
            {/* Header */}
            <View className="flex-row items-center justify-end mb-5">
              <Pressable
                onPress={goBack}
                hitSlop={8}
                className="p-3 border border-zinc-700 rounded-full active:opacity-70"
                accessibilityLabel="Switch folder"
              >
                <FoldersIcon size={20} color="#D4D4D8" />
              </Pressable>
            </View>

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
              <Centered title="Nothing here yet" message="Add .json files to this folder." />
            ) : (
              <MasonryColumns
                data={state.result.items}
                keyExtractor={(item) => item.id}
                estimateHeight={estimateHeight}
                renderItem={(item) => <ItemCard item={item} />}
              />
            )}
          </ScrollView>

          {state.result.items.length > 0 && <ProgressiveBlur />}
        </>
      )}
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
      <Text className="font-sans-medium text-base text-zinc-200">{title}</Text>
      <Text className="mt-2 text-center font-sans text-sm text-zinc-500">{message}</Text>
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
