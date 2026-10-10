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
        className="w-full"
        style={{
          aspectRatio: Math.max(0.65, Math.min(1.778, aspectRatio)),
          maxHeight: 260,
        }}
        contentFit="cover"
        onLoad={(e) => {
          if (e.source.width && e.source.height) {
            const ratio = e.source.width / e.source.height;
            setAspectRatio(Math.max(0.65, Math.min(1.778, ratio)));
          }
        }}
      />

      {title && (
        <Text
          className="font-sans-medium text-center text-xs text-zinc-500 leading-[1.6] py-3 px-3"
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </View>
  );
};
