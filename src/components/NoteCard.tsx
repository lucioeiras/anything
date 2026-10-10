import { Text, View } from 'react-native';

type NoteProps = {
  text: string;
  title?: string;
};

export const NoteCard = ({ text, title }: NoteProps) => {
  return (
    <View className="w-full items-center">
      <View className="w-full p-5 bg-zinc-900/80 rounded-xl">
        <Text className="font-sans text-base leading-[1.8] text-zinc-100" numberOfLines={8}>
          {text}
        </Text>
      </View>

      {title && (
        <Text
          className="font-sans-medium text-xs text-zinc-400 leading-[1.6] text-center mt-3"
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </View>
  );
};
