import { Text, View } from 'react-native';

type NoteProps = {
  text: string;
  title?: string;
};

export const NoteCard = ({ text, title }: NoteProps) => {
  return (
    <View className="w-full p-7">
      <Text className="font-sans text-base leading-[1.8] text-zinc-100" numberOfLines={8}>
        {text}
      </Text>

      {title && (
        <Text
          className="font-sans-medium text-xs text-zinc-500 leading-[1.6] text-center mt-6"
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </View>
  );
};
