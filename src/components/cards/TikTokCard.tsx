import { decodeHTML } from 'entities';
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { PlayIcon, TiktokLogoIcon } from 'phosphor-react-native';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type TikTokCardProps = {
  videoTitle: string;
  thumbnail: string;
  compactThumbnail?: boolean;
};

export function TikTokCard({ videoTitle, thumbnail, compactThumbnail = false }: TikTokCardProps) {
  return (
    <View className="w-full">
      <View
        testID="video-thumbnail-container"
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: compactThumbnail ? 3 / 4 : 9 / 16 }}
      >
        <ExpoImage
          source={{ uri: thumbnail }}
          className="w-full h-full rounded-t-xl"
          contentFit="cover"
        />
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <PlayIcon size={36} color="#FFFFFF" weight="fill" />
        </View>
      </View>

      <View className="w-full p-5 gap-3 bg-cyan-950/30 rounded-b-xl">
        <Text className="font-sans-medium text-lg leading-[1.6] text-zinc-50" numberOfLines={3}>
          {decodeHTML(videoTitle)}
        </Text>

        <View className="flex-row items-center gap-2 mt-2">
          <TiktokLogoIcon size={14} color="#25F4EE" weight="fill" />
          <Text className="font-sans-semibold text-sm text-cyan-300">TikTok</Text>
        </View>
      </View>
    </View>
  );
}
