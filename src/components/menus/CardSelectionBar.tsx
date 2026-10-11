import { FolderPlusIcon, TrashSimpleIcon, XIcon } from 'phosphor-react-native';
import { Pressable, Text, View } from 'react-native';

type CardSelectionBarProps = {
  visible: boolean;
  selectedCount: number;
  onDelete: () => void;
  onAddToFolder: () => void;
  onCancel: () => void;
};

export function CardSelectionBar({
  visible,
  selectedCount,
  onDelete,
  onAddToFolder,
  onCancel,
}: CardSelectionBarProps) {
  if (!visible) return null;

  return (
    <View
      style={{ bottom: 0 }}
      className="w-full absolute z-40 items-center"
      pointerEvents="box-none"
    >
      <View className="w-full border-t border-zinc-800 bg-zinc-950">
        <View className="flex-row items-center justify-center border-b border-zinc-800 py-3">
          <Text className="font-sans-medium text-base text-white">
            {selectedCount === 0 ? (
              <Text className="text-zinc-500">Select cards</Text>
            ) : (
              <>
                <Text className="font-sans-medium text-white">{selectedCount}</Text>
                {'   '}
                <Text className="text-zinc-400">selected</Text>
              </>
            )}
          </Text>
        </View>

        <View className="flex-row items-stretch">
          <Pressable
            onPress={onCancel}
            hitSlop={8}
            className="w-1/3 flex-row items-center justify-center gap-2 px-3 py-5 active:bg-zinc-900 border-r border-zinc-800"
            accessibilityRole="button"
            accessibilityLabel="Cancel selection"
          >
            <XIcon size={16} color="#FFFFFF" weight="bold" />
            <Text className="font-sans-semibold text-base text-white">Cancel</Text>
          </Pressable>

          <Pressable
            onPress={onAddToFolder}
            disabled={selectedCount === 0}
            className={`w-1/3 flex-row items-center justify-center gap-2 border-r border-zinc-800 px-3 py-5 bg-violet-950/25 ${selectedCount > 0 ? 'active:bg-zinc-900' : 'opacity-40'}`}
            accessibilityRole="button"
            accessibilityLabel="Add selected cards to folder"
            accessibilityState={{ disabled: selectedCount === 0 }}
          >
            <FolderPlusIcon size={16} color="#C4B5FD" weight="bold" />
            <Text className="font-sans-semibold text-base text-violet-300">Add to folder</Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            disabled={selectedCount === 0}
            hitSlop={8}
            className={`w-1/3 flex-row items-center justify-center gap-2 px-3 py-5 ${
              selectedCount > 0 ? 'bg-red-950/40 active:bg-red-950/70' : 'bg-zinc-900 opacity-40'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Delete selected cards"
          >
            <TrashSimpleIcon
              size={16}
              color={selectedCount > 0 ? '#FB2C36' : '#71717A'}
              weight="bold"
            />
            <Text
              className={`font-sans-semibold text-base ${
                selectedCount > 0 ? 'text-red-500' : 'text-zinc-500'
              }`}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
