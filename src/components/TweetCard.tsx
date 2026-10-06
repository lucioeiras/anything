import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { TwitterLogoIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type TweetProps = {
  avatar: string;
  author: string;
  text: string;
  images?: string[];
};

export const TweetCard = ({ avatar, author, text, images = [] }: TweetProps) => {
  const [aspectRatio, setAspectRatio] = useState(1);

  return (
    <View className="w-full bg-zinc-900 p-4 rounded-xl gap-4">
      <View className="flex-row items-center gap-3">
        <ExpoImage source={{ uri: avatar }} className="w-6 h-6 rounded-full" />
        <Text className="font-sans-medium text-sm text-zinc-100">{author}</Text>
      </View>

      <Text className="font-sans text-sm leading-[1.8] text-zinc-300" numberOfLines={8}>
        {text}
      </Text>

      {images.length === 1 && (
        <ExpoImage
          source={{ uri: images[0] }}
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

      {images.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4"
          contentContainerClassName="px-4 gap-2"
        >
          {images.slice(0, 4).map((img, index) => (
            <ExpoImage
              key={index}
              source={{ uri: img }}
              className="w-36 h-32 rounded-lg bg-zinc-800"
              contentFit="cover"
            />
          ))}
        </ScrollView>
      )}

      <View className="flex-row items-center gap-1 mt-2">
        <TwitterLogoIcon size={14} color="#0CA5E9" weight="fill" />
        <Text className="font-sans-semibold text-sm text-sky-500">Twitter</Text>
      </View>
    </View>
  );
};
