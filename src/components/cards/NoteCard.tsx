import { LinkIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

type NoteProps = {
  text: string;
  title?: string;
  linkedTitle?: string;
};

export const NoteCard = ({ text, title, linkedTitle }: NoteProps) => {
  return (
    <View className="w-full items-center">
      <View className="w-full p-5 bg-zinc-900/80 rounded-xl">
        <Text className="font-sans text-base leading-[1.8] text-zinc-100" numberOfLines={8}>
          {text}
        </Text>
        {linkedTitle && (
          <View className="flex-row items-center gap-2 mt-4 pt-3 border-t border-zinc-700">
            <LinkIcon size={14} color="#93C5FD" />
            <Text className="flex-1 font-sans-medium text-xs text-blue-300" numberOfLines={1}>
              {linkedTitle}
            </Text>
          </View>
        )}
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
