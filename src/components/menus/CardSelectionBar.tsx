import { TrashSimpleIcon, XIcon } from 'phosphor-react-native';
import { Pressable, Text, View } from 'react-native';

type CardSelectionBarProps = {
  visible: boolean;
  selectedCount: number;
  onDelete: () => void;
  onCancel: () => void;
};

export function CardSelectionBar({
  visible,
  selectedCount,
  onDelete,
  onCancel,
}: CardSelectionBarProps) {
  if (!visible) return null;

  return (
    <View
      style={{ bottom: 0 }}
      className="w-full absolute z-40 items-center"
      pointerEvents="box-none"
    >
      <View className="w-full bg-zinc-950 border-t border-zinc-800 flex-row items-center justify-between">
        <Pressable
          onPress={onCancel}
          hitSlop={8}
          className="py-6 px-8 border-r border-zinc-800 flex-row items-center gap-2 active:bg-zinc-900"
          accessibilityRole="button"
          accessibilityLabel="Cancel selection"
        >
          <XIcon size={16} color="#FFFFFF" weight="bold" />
          <Text className="font-sans-semibold text-base text-white">Cancel</Text>
        </Pressable>

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

        <Pressable
          onPress={onDelete}
          disabled={selectedCount === 0}
          hitSlop={8}
          className={`flex-row items-center gap-2 py-6 px-8 border-l border-zinc-800 ${
            selectedCount > 0
              ? 'bg-red-950/40 active:bg-red-950/70'
              : 'bg-zinc-900 border border-zinc-800/80 opacity-40'
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
  );
}
