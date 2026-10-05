import { Image } from 'expo-image';
import { TwitterLogoIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

type TweetProps = {
  avatar: string;
  author: string;
  text: string;
  image?: string;
  title?: string;
};

export const TweetCard = ({ avatar, author, text, image, title }: TweetProps) => {
  const [aspectRatio, setAspectRatio] = useState(1); // Default to a square until loaded

  return (
    <View className="items-center gap-2">
      <View className="w-full bg-zinc-900 p-4 rounded-xl gap-4">
        <View className="flex-row items-center gap-3">
          <Image source={{ uri: avatar }} className="w-6 h-6 rounded-full" />
          <Text className="font-sans-medium text-sm text-zinc-100">{author}</Text>
        </View>

        <Text className="font-sans text-sm leading-[1.8] text-zinc-300" numberOfLines={8}>
          {text}
        </Text>

        {image && (
          <Image
            source={{ uri: image }}
            className="w-full rounded-lg"
            style={{ aspectRatio }}
            onLoad={(e) => {
              if (e.source.width && e.source.height) {
                setAspectRatio(e.source.width / e.source.height);
              }
            }}
          />
        )}

        <View className="flex-row items-center gap-1 mt-2">
          <TwitterLogoIcon size={14} color="#71717B" weight="fill" />
          <Text className="font-sans text-sm text-zinc-500">Twitter</Text>
        </View>
      </View>

      {title && (
        <Text className="font-sans-medium text-xs text-zinc-200 mb-2" numberOfLines={1}>
          {title}
        </Text>
      )}
    </View>
  );
};
