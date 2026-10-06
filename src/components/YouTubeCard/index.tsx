import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { PlayIcon, YoutubeLogoIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type YouTubeCardProps = {
  videoTitle: string;
  thumbnail: string;
  title?: string;
};

export const YouTubeCard = ({ videoTitle, thumbnail, title }: YouTubeCardProps) => {
  return (
    <View className="w-full gap-2">
      <View className="w-full">
        <View className="relative w-full h-32">
          <ExpoImage source={{ uri: thumbnail }} className="w-full h-32 rounded-t-xl" />
          <View className="absolute inset-0 bg-black/50 rounded-t-xl items-center justify-center">
            <PlayIcon size={36} color="#FFFFFF" weight="fill" />
          </View>
        </View>

        <View className="w-full bg-zinc-900 p-4 rounded-b-xl gap-4">
          <Text className="font-sans-medium text-lg leading-[1.8] text-zinc-50" numberOfLines={2}>
            {videoTitle}
          </Text>

          <View className="flex-row items-center gap-1 mt-2">
            <YoutubeLogoIcon size={14} color="#71717B" weight="fill" />
            <Text className="font-sans-semibold text-sm text-zinc-500">YouTube</Text>
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
