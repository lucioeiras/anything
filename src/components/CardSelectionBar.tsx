import { TrashSimpleIcon, XIcon } from 'phosphor-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View
      style={{ bottom: Math.max(insets.bottom + 64, 80) }}
      className="absolute left-4 right-4 z-40 items-center"
      pointerEvents="box-none"
    >
      <View className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-full px-3 py-3 shadow-2xl flex-row items-center justify-between">
        <Pressable
          onPress={onCancel}
          hitSlop={8}
          className="py-3 px-5 rounded-full bg-zinc-800 active:bg-zinc-700 flex-row items-center gap-2"
        >
          <XIcon size={16} color="#E4E4E7" weight="bold" />
          <Text className="font-sans-medium text-base text-zinc-200">Cancel</Text>
        </Pressable>

        <Text className="font-sans-medium text-base text-white">
          {selectedCount === 0 ? 'Select cards' : `${selectedCount} selected`}
        </Text>

        <Pressable
          onPress={onDelete}
          disabled={selectedCount === 0}
          hitSlop={8}
          className={`flex-row items-center gap-2 py-3 px-5 rounded-full ${
            selectedCount > 0 ? 'bg-red-600 active:bg-red-700' : 'bg-zinc-800/80 opacity-40'
          }`}
        >
          <TrashSimpleIcon size={16} color="#ffffff" weight="bold" />
          <Text className="font-sans-semibold text-base text-white">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
