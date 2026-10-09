import { decodeHTML } from 'entities';
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
      <ExpoImage source={{ uri: thumbnail }} className="w-full h-40" />

      <View className="w-full p-7 gap-4 bg-indigo-950/20">
        <Text className="font-sans-medium text-lg leading-[1.6] text-zinc-50" numberOfLines={3}>
          {decodeHTML(articleTitle)}
        </Text>

        <View className="flex-row items-center gap-1.5 mt-2">
          <BookOpenIcon size={14} color="#615FFF" weight="bold" />
          <Text className="font-sans-semibold text-sm text-indigo-500" numberOfLines={1}>
            {decodeHTML(origin)}
          </Text>
        </View>
      </View>
    </View>
  );
};
