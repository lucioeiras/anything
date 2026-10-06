import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { BookOpenIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type ArticleCardProps = {
  articleTitle: string;
  thumbnail: string;
  origin: string;
};

export const ArticleCard = ({ articleTitle, thumbnail, origin }: ArticleCardProps) => {
  return (
    <View className="w-full">
      <ExpoImage source={{ uri: thumbnail }} className="w-full h-40 rounded-t-xl" />

      <View className="w-full bg-zinc-900 p-4 rounded-b-xl gap-4">
        <Text className="font-sans-medium text-lg leading-[1.6] text-zinc-50" numberOfLines={2}>
          {articleTitle}
        </Text>

        <View className="flex-row items-center gap-1 mt-2">
          <BookOpenIcon size={14} color="#D4D4D8" weight="bold" />
          <Text className="font-sans-semibold text-sm text-zinc-300">{origin}</Text>
        </View>
      </View>
    </View>
  );
};
