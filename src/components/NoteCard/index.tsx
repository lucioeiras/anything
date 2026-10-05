import { Text, View } from 'react-native';

type NoteProps = {
  text: string;
  title?: string;
};

export const NoteCard = ({ text, title }: NoteProps) => {
  return (
    <View className="items-center gap-2">
      <View className="w-full bg-zinc-900 p-4 rounded-xl">
        <Text className="font-sans text-sm leading-[1.8] text-zinc-300" numberOfLines={8}>
          {text}
        </Text>
      </View>

      {title && (
        <Text className="font-sans-medium text-xs text-zinc-200 mb-2" numberOfLines={1}>
          {title}
        </Text>
      )}
    </View>
  );
};
