import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { RedditLogoIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { cleanRedditDescription } from '@/lib/library/metadata';

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

  const cleanText = cleanRedditDescription(text);
  const cleanImage =
    image && !image.includes('share.redd.it') && !image.includes('redditstatic.com')
      ? image
      : undefined;

  return (
    <View className="items-center gap-2">
      <View className="w-full bg-zinc-900 p-5 rounded-xl gap-3">
        <View className="flex-row items-center gap-3">
          <ExpoImage source={{ uri: subredditAvatar }} className="w-6 h-6 rounded-full" />
          <Text className="font-sans-medium text-sm text-zinc-300">{subredditName}</Text>
        </View>

        <Text className="font-sans-medium text-base text-zinc-100">{postTitle}</Text>

        {cleanImage && (
          <ExpoImage
            source={{ uri: cleanImage }}
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

        {cleanText && (
          <Text className="font-sans text-sm leading-[1.8] text-zinc-300" numberOfLines={3}>
            {cleanText}
          </Text>
        )}

        <View className="flex-row items-center gap-1.5 mt-1">
          <RedditLogoIcon size={14} color="#F97315" weight="fill" />
          <Text className="font-sans-semibold text-sm text-orange-500">Reddit</Text>
        </View>
      </View>
    </View>
  );
};
