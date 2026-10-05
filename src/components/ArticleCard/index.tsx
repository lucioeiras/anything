import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { BookOpenTextIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type ArticleCardProps = {
  articleTitle: string;
  thumbnail: string;
  origin: string;
  title?: string;
};

export const ArticleCard = ({ articleTitle, thumbnail, origin, title }: ArticleCardProps) => {
  return (
    <View className="w-full gap-2">
      <View className="w-full">
        <ExpoImage source={{ uri: thumbnail }} className="w-full h-40 rounded-t-xl" />

        <View className="w-full bg-zinc-900 p-4 rounded-b-xl gap-4">
          <Text className="font-sans-medium text-lg leading-[1.8] text-zinc-50" numberOfLines={2}>
            {articleTitle}
          </Text>

          <View className="flex-row items-center gap-1 mt-2">
            <BookOpenTextIcon size={14} color="#71717B" />
            <Text className="font-sans text-sm text-zinc-500">{origin}</Text>
          </View>
        </View>
      </View>

      {title && (
        <Text className="font-sans-medium text-center text-xs text-zinc-200 mb-2" numberOfLines={1}>
          {title}
        </Text>
      )}
    </View>
  );
};
