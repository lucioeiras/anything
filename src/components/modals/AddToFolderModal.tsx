import AsyncStorage from '@react-native-async-storage/async-storage';
import { XIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FolderTile } from '@/components/organize/FolderTile';
import { useLibrary } from '@/hooks/useLibrary';
import { getTagGroups } from '@/lib/library/organize';
import { getSourceId } from '@/lib/library/storage';
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
  const folderNames = saved?.key === storageKey ? saved.names : null;
  const libraryItems = useMemo(() => (state.status === 'ready' ? state.result.items : []), [state]);
  const itemsByTag = useMemo(
    () => new Map(getTagGroups(libraryItems).map((group) => [group.tag, group.items])),
    [libraryItems]
  );

  useEffect(() => {
    if (!visible) return;
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
        if (active) {
          setSaved({ key: storageKey, names: [] });
          Alert.alert('Could not load folders', 'Please try again.');
        }
      });
    return () => {
      active = false;
    };
  }, [visible, storageKey]);

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
          contentContainerClassName="px-6 pb-12 pt-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 gap-2 px-2 pb-8">
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
                />
              );
            })}
          </View>
          {folderNames === null && <ActivityIndicator className="py-6" color="#A1A1AA" />}
          {folderNames?.length === 0 && (
            <Text className="px-2 pt-2 font-sans text-sm text-zinc-500">
              Create a folder in the Folders tab to add cards here.
            </Text>
          )}
        </ScrollView>

        <Pressable
          onPress={handleClose}
          disabled={saving}
          className="w-full flex-row items-center justify-center gap-4 border-t border-zinc-800 bg-zinc-950 pt-6 pb-10 active:bg-zinc-900"
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          {saving ? (
            <ActivityIndicator size={24} color="#A1A1AA" />
          ) : (
            <XIcon size={24} color="#FFFFFF" weight="bold" />
          )}
          <Text className="font-sans-bold text-xl text-white">Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
