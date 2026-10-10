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
    <View className="w-full">
      <ExpoImage
        source={{ uri: url }}
        className="w-full rounded-xl"
        style={{
          aspectRatio,
        }}
        contentFit="cover"
        onLoad={(e) => {
          if (e.source.width && e.source.height) {
            setAspectRatio(e.source.width / e.source.height);
          }
        }}
      />

      {title && (
        <Text
          className="font-sans-medium text-center text-xs text-zinc-400 leading-[1.6] mt-3"
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </View>
  );
};
