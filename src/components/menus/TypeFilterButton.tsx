import type { NotePencilIcon } from 'phosphor-react-native';
import { Pressable, Text } from 'react-native';

export function TypeFilterButton({
  label,
  icon: Icon,
  selected,
  onPress,
}: {
  label: string;
  icon: typeof NotePencilIcon;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2 ${selected ? 'border-white bg-white' : 'border-zinc-700'}`}
    >
      <Icon size={16} color={selected ? '#000000' : '#a1a1aa'} weight="bold" />
      <Text className={`font-sans-medium text-sm ${selected ? 'text-black' : 'text-zinc-300'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
