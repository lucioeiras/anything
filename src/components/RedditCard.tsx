import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { RedditLogoIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type RedditProps = {
  subredditAvatar: string;
  subredditName: string;
  postTitle: string;
  text?: string;
  image?: string;
};

export const RedditCard = ({
  subredditAvatar,
  subredditName,
  postTitle,
  text,
  image,
}: RedditProps) => {
  const [aspectRatio, setAspectRatio] = useState(1);

  return (
    <View className="items-center gap-2">
      <View className="w-full bg-zinc-900 p-4 rounded-xl gap-3">
        <View className="flex-row items-center gap-3">
          <ExpoImage source={{ uri: subredditAvatar }} className="w-6 h-6 rounded-full" />
          <Text className="font-sans-medium text-sm text-zinc-100">{subredditName}</Text>
        </View>

        <Text className="font-sans-medium text-base text-zinc-100">{postTitle}</Text>

        {image && (
          <ExpoImage
            source={{ uri: image }}
            className="w-full rounded-lg"
            style={{ aspectRatio }}
            onLoad={(e) => {
              if (e.source.width && e.source.height) {
                const ratio = e.source.width / e.source.height;
                setTimeout(() => setAspectRatio(ratio), 0);
              }
            }}
          />
        )}

        {text && (
          <Text className="font-sans text-sm leading-[1.8] text-zinc-300" numberOfLines={3}>
            {text}
          </Text>
        )}

        <View className="flex-row items-center gap-1 mt-1">
          <RedditLogoIcon size={14} color="#F97315" weight="fill" />
          <Text className="font-sans-semibold text-sm text-orange-500">Reddit</Text>
        </View>
      </View>
    </View>
  );
};
