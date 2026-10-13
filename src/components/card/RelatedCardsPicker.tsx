import { FlashList } from '@shopify/flash-list';
import { CheckIcon, MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';
import { ProgressiveBlur } from '@/components/effects/ProgressiveBlur';
import type { LibraryItem } from '@/lib/library/types';
import { RelatedCardTile } from './RelatedCardTile';

type Props = {
  itemId: string;
  items: LibraryItem[];
  selectedIds: string[];
  searchItems: (query: string) => LibraryItem[];
  onSave: (ids: string[]) => Promise<void>;
  onClose: () => void;
};

/** Mounted afresh on opening; later library updates must not reset the draft. */
export function RelatedCardsPicker({
  itemId,
  items,
  selectedIds,
  searchItems,
  onSave,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => new Set(selectedIds));
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const searchIds = useMemo(
    () => (query.trim() ? new Set(searchItems(query.trim()).map((item) => item.id)) : null),
    [query, searchItems]
  );
  const availableIds = new Set(items.filter((item) => item.id !== itemId).map((item) => item.id));
  const selectedIdsToSave = [...selected].filter((id) => availableIds.has(id));
  const matches = items.filter(
    (item) => item.id !== itemId && (!searchIds || searchIds.has(item.id))
  );
  const close = () => {
    if (!savingRef.current) onClose();
  };
  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await onSave(selectedIdsToSave);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save related cards. Please try again.'
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={close}>
      <View className="flex-1 bg-zinc-950" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center justify-between px-6 mb-5">
          <Text className="font-sans-semibold text-2xl text-white">Select related cards</Text>
        </View>
        <View className="flex-row items-center gap-4 border-t border-b border-zinc-800 px-6 mb-4 py-5">
          <MagnifyingGlassIcon size={20} color="#E4E4E7" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your library"
            accessibilityLabel="Search related cards"
            placeholderTextColor="#71717A"
            className="flex-1 font-sans text-xl text-white leading-tight"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {!!query && (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={12}
            >
              <XIcon size={20} color="#E4E4E7" />
            </Pressable>
          )}
        </View>
        {error && (
          <Text accessibilityRole="alert" className="px-6 pb-4 font-sans text-sm text-red-400">
            {error}
          </Text>
        )}
        <FlashList
          data={matches}
          keyExtractor={(item) => item.id}
          numColumns={2}
          masonry
          extraData={{ selected, saving }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 180 }}
          renderItem={({ item }) => (
            <RelatedCardTile
              item={item}
              selected={selected.has(item.id)}
              disabled={saving}
              onPress={() =>
                setSelected((previous) => {
                  const next = new Set(previous);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                })
              }
            />
          )}
          ListEmptyComponent={
            <Text className="font-sans text-sm text-zinc-500 py-8 text-center">
              {query.trim() ? 'No matching cards' : 'No other cards available'}
            </Text>
          }
        />
        <ProgressiveBlur
          height={190}
          intensity={55}
          darkLayerOpacity={0.75}
          includeBottomInset={false}
        />
        <ActionFooter bottomInset={insets.bottom} overlay>
          <View className="items-center gap-3">
            <View className="flex-row items-center gap-2">
              <Button
                accessibilityLabel="Cancel related cards"
                icon={<XIcon size={24} color="#FFFFFF" weight="bold" />}
                disabled={saving}
                onPress={close}
              />
              <Button
                accessibilityLabel="Save related cards"
                icon={<CheckIcon size={24} color="#FFFFFF" weight="bold" />}
                variant="primary"
                disabled={saving}
                onPress={() => {
                  void save();
                }}
              />
            </View>
            <Text className="font-sans-medium text-base text-white">
              <Text className="font-sans-bold">
                {selectedIdsToSave.length}
                {'  '}
              </Text>
              <Text className="font-sans-semibold text-zinc-400">selected</Text>
              {saving && <Text accessibilityLabel="Saving related cards">{'  '}Saving…</Text>}
            </Text>
          </View>
        </ActionFooter>
      </View>
    </Modal>
  );
}
