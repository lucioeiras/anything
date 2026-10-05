import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { useState } from 'react';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type NoteProps = {
  url: string;
  title?: string;
};

export const ImageCard = ({ url, title }: NoteProps) => {
  const [aspectRatio, setAspectRatio] = useState(1); // Default to a square until loaded

  return (
    <View className="w-full gap-2">
      <ExpoImage
        source={{ uri: url }}
        className="w-full rounded-xl"
        style={{ aspectRatio }}
        onLoad={(e) => {
          if (e.source.width && e.source.height) {
            setAspectRatio(e.source.width / e.source.height);
          }
        }}
      />

      <Text className="font-sans-medium text-center text-xs text-zinc-200 mb-2" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
};
