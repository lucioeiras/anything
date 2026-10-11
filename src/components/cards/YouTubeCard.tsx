import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { PlayIcon, YoutubeLogoIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

import type { YouTubeItem } from '@/lib/library/types';

import { ProgressStatus } from './ProgressStatus';

cssInterop(ExpoImage, { className: 'style' });

type YouTubeCardProps = {
  videoTitle: string;
  thumbnail: string;
  progressStatus?: YouTubeItem['progressStatus'];
};

export const YouTubeCard = ({ videoTitle, thumbnail, progressStatus }: YouTubeCardProps) => {
  return (
    <View className="w-full">
      <View className="relative w-full h-32">
        <ExpoImage source={{ uri: thumbnail }} className="w-full h-32 rounded-t-xl" />
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <PlayIcon size={36} color="#FFFFFF" weight="fill" />
        </View>
      </View>

      <View className="w-full p-5 gap-3 bg-rose-950/25 rounded-b-xl">
        <Text className="font-sans-medium text-lg leading-[1.6] text-zinc-50" numberOfLines={3}>
          {decodeHTML(videoTitle)}
        </Text>

        <ProgressStatus type="youtube" status={progressStatus} align="start" />

        <View className="flex-row items-center gap-2 mt-2">
          <YoutubeLogoIcon size={14} color="#F43F5E" weight="fill" />
          <Text className="font-sans-semibold text-sm text-rose-500">YouTube</Text>
        </View>
      </View>
    </View>
  );
};
