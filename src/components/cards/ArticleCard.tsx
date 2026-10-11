import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { Text, View } from 'react-native';

import type { ArticleItem } from '@/lib/library/types';

import { ProgressStatus } from './ProgressStatus';

cssInterop(ExpoImage, { className: 'style' });

type ArticleCardProps = {
  articleTitle: string;
  thumbnail: string;
  origin: string;
  progressStatus?: ArticleItem['progressStatus'];
};

export const ArticleCard = ({
  articleTitle,
  thumbnail,
  origin,
  progressStatus,
}: ArticleCardProps) => {
  return (
    <View className="w-full">
      <ExpoImage source={{ uri: thumbnail }} className="w-full h-40 rounded-t-xl" />

      <View className="w-full p-5 gap-3 bg-zinc-900/80 rounded-b-xl">
        <Text className="font-sans-medium text-lg leading-[1.6] text-zinc-50" numberOfLines={3}>
          {decodeHTML(articleTitle)}
        </Text>

        <View className="flex-row items-center gap-2 mt-1 mb-2">
          <Text className="font-sans-semibold text-sm text-zinc-400" numberOfLines={1}>
            {decodeHTML(origin)}
          </Text>
        </View>

        <ProgressStatus type="article" status={progressStatus} align="start" />
      </View>
    </View>
  );
};
